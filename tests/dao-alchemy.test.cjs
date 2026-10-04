'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const X=require('../engine.js'),C=X.CONTENT,V4=fs.readFileSync(path.join(__dirname,'v4-save.fixture.json'),'utf8');
const checked=(s,id)=>{X.action(s,id);assert.equal(s.lastAction.ok,true,id+': '+s.lastAction.message);};
const ledger=s=>({wallet:Object.fromEntries([...Object.keys(C.RESOURCES),'xp','potions'].map(k=>[k,s.player[k]])),inventory:structuredClone(s.inventory),dao:structuredClone(s.dao),alchemy:structuredClone(s.alchemy)});
const failed=(s,id)=>{const before=ledger(s);X.action(s,id);assert.equal(s.lastAction.ok,false,id);assert.deepEqual(ledger(s),before,id+' must not charge or mint output');};
const advance=(s,seconds)=>{for(let i=0;i<Math.ceil(seconds/.05);i++)X.step(s,{},.05);};
const fresh=()=>X.deserialize(V4);
const learn=(s,ids)=>ids.forEach(id=>checked(s,'dao:learn:'+id));
const station=(s,mapId='sect')=>{if(s.mapId!==mapId){const h=X.mapInfo(s).hub;s.player.x=h.x;s.player.y=h.y;checked(s,'travel:'+mapId);}const n=X.mapInfo(s).npcs.find(n=>n.id==='alchemy');assert.ok(n);s.player.x=n.x;s.player.y=n.y;assert.equal(X.alchemyInfo(s).near,true);};
const roundtrip=s=>{const restored=X.deserialize(X.serialize(s));assert.deepEqual(restored.alchemy,s.alchemy);assert.deepEqual(restored.dao,s.dao);assert.deepEqual(ledger(restored),ledger(s));return restored;};
const worlds=w=>Object.fromEntries(Object.entries(w).map(([id,v])=>[id,{nodes:v.nodes,drops:v.drops,enemies:v.enemies.map(e=>Object.fromEntries(['id','type','x','y','hp','maxHp','respawn','mode','attackTimer','cooldown','burn','burnDamage','slow','rooted','wave'].map(k=>[k,e[k]])))}]));

test('authentic v4 save migrates strictly to v5 with all earned data intact and no granted new choices',()=>{
  assert.equal(crypto.createHash('sha256').update(V4).digest('hex'),'65185670d4d76a56a222067f5bbcfb1ce7420e7919337db9561aca7cf6200fd4');
  const old=JSON.parse(V4),s=fresh(),next=JSON.parse(X.serialize(s));assert.equal(s.version,7);assert.deepEqual(s.dao,{learned:[]});assert.equal(s.alchemy,null);
  for(const k of Object.keys(old))if(!['version','worlds'].includes(k))assert.deepEqual(next[k],old[k],k);assert.deepEqual(worlds(next.worlds),worlds(old.worlds));assert.equal(X.daoInfo(s).earnedPoints,20);assert.equal(X.daoInfo(s).spentPoints,0);
  roundtrip(s);
  for(const [label,mutate] of [['realm',d=>d.player.realm=8],['facility',d=>d.sect.facilities.garden.level=4],['records',d=>d.sect.records.tower=-1],['exploration',d=>d.exploration.claimed.push('missing')],['worlds',d=>d.worlds.main.enemies.pop()],['inventory',d=>d.inventory.missingItem=1],['grades',d=>d.techniqueGrades.arrow_immortal=0],['combo',d=>d.combo.until=d.time+7]]){const bad=structuredClone(old);mutate(bad);assert.throws(()=>X.deserialize(JSON.stringify(bad)),label);}
  const extra=structuredClone(old);extra.dao={learned:Object.keys(C.DAO_NODES)};extra.alchemy={phase:'ready',output:{potions:999}};const restored=X.deserialize(JSON.stringify(extra));assert.deepEqual(restored.dao,{learned:[]});assert.equal(restored.alchemy,null);assert.deepEqual(restored.inventory,s.inventory);
});

test('finite enlightenment points come from milestones and the nine nodes charge once with prerequisite and realm gates',()=>{
  assert.equal(Object.keys(C.DAO_DIRECTIONS).length,3);assert.equal(Object.keys(C.DAO_NODES).length,9);
  for(const direction of Object.keys(C.DAO_DIRECTIONS)){const nodes=Object.values(C.DAO_NODES).filter(n=>n.direction===direction);assert.equal(nodes.length,3);assert.deepEqual(nodes.map(n=>n.cost),[1,2,3]);assert.deepEqual(nodes.map(n=>n.realmRequired),[0,2,4]);}
  const s=fresh(),before=ledger(s),initial=X.daoInfo(s);assert.equal(initial.availablePoints,20);failed(s,'dao:learn:sword_flow');failed(s,'dao:learn:missing');
  for(const n of Object.values(C.DAO_NODES)){const points=X.daoInfo(s).availablePoints;checked(s,'dao:learn:'+n.id);assert.equal(X.daoInfo(s).availablePoints,points-n.cost);failed(s,'dao:learn:'+n.id);}
  assert.equal(X.daoInfo(s).spentPoints,18);assert.equal(X.daoInfo(s).availablePoints,2);assert.deepEqual(s.player.stones,before.wallet.stones);assert.deepEqual(s.inventory,before.inventory);const snapshot=ledger(s);for(let i=0;i<100;i++)X.daoInfo(s);assert.deepEqual(ledger(s),snapshot);roundtrip(s);
  const newGame=X.createGame(73);assert.equal(X.daoInfo(newGame).earnedPoints,0);failed(newGame,'dao:learn:sword_edge');
  const gate=fresh();checked(gate,'dao:learn:sword_edge');gate.player.realm=1;failed(gate,'dao:learn:sword_flow');gate.player.realm=7;gate.dead=true;failed(gate,'dao:learn:sword_flow');gate.dead=false;checked(gate,'travel:main');gate.player.x=1100;gate.player.y=1800;failed(gate,'dao:learn:sword_flow');
  const repeated=fresh(),earned=X.daoInfo(repeated).earnedPoints;repeated.sect.records.bounty+=20;repeated.sect.records.defense+=20;repeated.sect.records.tower+=20;assert.equal(X.daoInfo(repeated).earnedPoints,earned,'Repeated clears must not mint additional points');
});

// Combat fixtures only isolate actual hits: enemy health/position and stuns are explicitly adjusted.
// The natural continuation below never injects health, locations, points or resources.
function battle(s,weapon='starterSword',distances=[80]){
  if(s.equipment.weapon!==weapon)checked(s,'equip:'+weapon);checked(s,'travel:main');s.player.x=1100;s.player.y=1800;s.player.attackCd=0;s.player.skillCd=0;s.player.secondaryCd=0;s.player.hp=X.stats(s).maxHp*.3;s.player.mp=150;s.projectiles=[];s.effects=[];
  for(const e of s.enemies){e.hp=0;e.stun=20;}const targets=s.enemies.slice(0,distances.length);targets.forEach((e,i)=>Object.assign(e,{x:1100+distances[i],y:1800,homeX:1100+distances[i],homeY:1800,hp:10000,maxHp:10000,gated:false,stun:20}));return targets;
}
const attack=(s,seconds=.05)=>{X.step(s,{attack:true,aimX:2000,aimY:1800},.05);if(seconds>.05)advance(s,seconds-.05);};
test('sword enlightenment changes real damage, extended hits, cadence and bounded healing from actual damage only',()=>{
  const base=fresh(),edge=fresh();learn(edge,['sword_edge']);const a=battle(base),b=battle(edge);attack(base);attack(edge);assert.ok(Math.abs((10000-b[0].hp)/(10000-a[0].hp)-1.12)<1e-9);
  const short=fresh(),flow=fresh();learn(flow,['sword_edge','sword_flow']);const miss=battle(short,'starterSword',[145]),hit=battle(flow,'starterSword',[145]);attack(short);attack(flow);assert.equal(miss[0].hp,10000);assert.ok(hit[0].hp<10000);assert.ok(Math.abs(flow.player.attackCd-short.player.attackCd*.88)<1e-9);
  const returner=fresh();learn(returner,['sword_edge','sword_flow','sword_return']);const target=battle(returner);target[0].hp=2;const hp=returner.player.hp;attack(returner);assert.equal(target[0].hp,0);assert.ok(Math.abs(returner.player.hp-hp-.16)<1e-9,'Overkill must not inflate lifesteal');
  const capped=fresh();learn(capped,['sword_edge','sword_flow','sword_return']);battle(capped,'starterSword',[60,70,80,90]);const before=capped.player.hp;attack(capped);assert.ok(Math.abs(capped.player.hp-before-X.stats(capped).maxHp*.04)<1e-9,'A multi-hit attack must respect the per-attack health cap');
});

test('bow enlightenment changes real arrow damage, speed, cadence and two-target penetration',()=>{
  const base=fresh(),focus=fresh();learn(focus,['bow_focus']);const a=battle(base,'ironBow',[230]),b=battle(focus,'ironBow',[230]);attack(base,.5);attack(focus,.5);assert.ok(a[0].hp<10000);assert.ok(Math.abs((10000-b[0].hp)/(10000-a[0].hp)-1.12)<1e-9);
  const plain=fresh(),wind=fresh();learn(wind,['bow_focus','bow_wind']);battle(plain,'ironBow',[350]);battle(wind,'ironBow',[350]);attack(plain);attack(wind);assert.ok(Math.abs(wind.projectiles[0].vx/plain.projectiles[0].vx-1.18)<1e-9);assert.ok(Math.abs(wind.player.attackCd/plain.player.attackCd-.85)<1e-9);
  const pierced=fresh();learn(pierced,['bow_focus','bow_wind','bow_pierce']);const victims=battle(pierced,'ironBow',[180,260,340]);attack(pierced,.7);assert.ok(victims[0].hp<10000&&victims[1].hp<10000);assert.equal(victims[2].hp,10000,'One ordinary arrow must stop after its two real hits');
});

test('art enlightenment extends real combo timing, reduces Q and F mana, refunds ten mana and increases only ordinary gathering',()=>{
  const original=fresh(),cycled=fresh();learn(cycled,['art_cycle']);battle(original);battle(cycled);X.step(original,{secondary:true},.05);X.step(cycled,{secondary:true},.05);advance(original,7);advance(cycled,7);assert.equal(X.techniqueInfo(original,'flame_immortal').comboReady,false);assert.equal(X.techniqueInfo(cycled,'flame_immortal').comboReady,true);
  const breath=fresh(),baseline=fresh();learn(breath,['art_cycle','art_breath']);checked(breath,'technique:flame_immortal');checked(baseline,'technique:flame_immortal');battle(breath);battle(baseline);for(const id of ['flame_immortal','wood'])assert.equal(X.techniqueInfo(breath,id).manaCost,Math.max(12,Math.floor(X.techniqueInfo(baseline,id).manaCost*.9)));
  let mp=breath.player.mp,cost=X.techniqueInfo(breath,'wood').manaCost;X.step(breath,{secondary:true},.05);assert.ok(Math.abs(breath.player.mp-(mp+.125-cost))<1e-9);mp=breath.player.mp;cost=X.techniqueInfo(breath,'flame_immortal').manaCost;X.step(breath,{skill:true,aimX:1500,aimY:1800},.05);assert.ok(Math.abs(breath.player.mp-(mp+.125-cost+10))<1e-9);assert.equal(breath.combo.element,'fire');
  for(const type of ['herb','crystal','iron','spiritwood','ember','frost','core','essence']){const s=fresh();learn(s,['art_cycle','art_breath','art_harvest']);checked(s,'travel:'+({ember:'red',frost:'snow'}[type]||'main'));const node=s.nodes.find(n=>n.type===type);assert.ok(node);node.ready=0;s.player.x=node.x;s.player.y=node.y;const field=type==='herb'?'herbs':type==='crystal'?'stones':type,before=s.player[field];X.interact(s);assert.ok(node.ready>0);assert.equal(s.player[field]-before,type==='crystal'?15:['core','essence'].includes(type)?1:3,type);}
  const site=fresh();site.exploration.claimed=[];learn(site,['art_cycle','art_breath','art_harvest']);checked(site,'travel:main');const cache=C.EXPLORATION_SITES.lostCamp;site.player.x=cache.x;site.player.y=cache.y;const stones=site.player.stones;checked(site,'site:lostCamp');assert.equal(site.player.stones-stones,cache.reward.stones,'Exploration rewards must not gain ordinary-gather bonuses');site.player.x=1100;site.player.y=1800;site.drops.push({x:1100,y:1800,type:'stones',amount:5});const wallet=site.player.stones;X.step(site,{},.05);assert.equal(site.player.stones-wallet,5,'Loose drops must not gain ordinary-gather bonuses');
});

test('all three alchemy recipes and six strategies pay once and deliver the exact declared yield after elapsed stages',()=>{
  for(const recipeId of ['healing','tea','ward'])for(const heat of ['low','balanced','high'])for(const seal of ['slow','fast']){
    let s=fresh();station(s);const recipe=C.ALCHEMY_RECIPES[recipeId],before=ledger(s);checked(s,'alchemy:start:'+recipeId);for(const[k,n]of Object.entries(recipe.cost))assert.equal(s.player[k],before.wallet[k]-n);assert.deepEqual(s.alchemy.paidCost,recipe.cost);assert.equal(s.alchemy.phase,'heat');failed(s,'alchemy:claim');failed(s,'alchemy:start:'+recipeId);failed(s,'alchemy:cancel');s=roundtrip(s);
    const ember=s.player.ember;checked(s,'alchemy:heat:'+heat);assert.equal(s.player.ember,ember-(heat==='high'?1:0));assert.equal(s.alchemy.phase,'heating');failed(s,'alchemy:heat:'+heat);failed(s,'alchemy:seal:'+seal);advance(s,C.ALCHEMY_HEAT[heat].duration-.1);assert.equal(s.alchemy.phase,'heating');s=roundtrip(s);advance(s,.1);assert.equal(s.alchemy.phase,'seal');s=roundtrip(s);
    checked(s,'alchemy:seal:'+seal);assert.equal(s.alchemy.phase,'sealing');advance(s,C.ALCHEMY_SEAL[seal].duration-.1);failed(s,'alchemy:claim');s=roundtrip(s);advance(s,.1);assert.equal(s.alchemy.phase,'ready');s=roundtrip(s);
    const bonus=seal==='slow'?heat==='balanced'?1:2:heat==='high'?-1:0,expected=Object.fromEntries(Object.entries(recipe.baseOutput).map(([id,n])=>[id,Math.max(1,n+bonus)]));assert.deepEqual(s.alchemy.output,expected);const ready=ledger(s);advance(s,10);assert.deepEqual(ledger(s),ready);checked(s,'alchemy:claim');assert.equal(s.alchemy,null);for(const[k,n]of Object.entries(expected))assert.equal(k==='potions'?s.player.potions:s.inventory[k],(k==='potions'?ready.wallet.potions:ready.inventory[k]||0)+n);failed(s,'alchemy:claim');roundtrip(s);
  }
});

test('alchemy inspection, zero-time pause, death and wrong furnace cannot speed or claim a batch or refund ingredients',()=>{
  const s=fresh();station(s);checked(s,'alchemy:start:healing');checked(s,'alchemy:heat:low');const before=ledger(s);for(let i=0;i<100;i++){X.alchemyInfo(s);X.step(s,{},0);}assert.deepEqual(ledger(s),before);s.dead=true;advance(s,5);assert.deepEqual(ledger(s),before);s.dead=false;
  checked(s,'travel:main');advance(s,7);assert.equal(s.alchemy.phase,'seal');failed(s,'alchemy:seal:slow');station(s);checked(s,'alchemy:seal:slow');checked(s,'travel:main');advance(s,4);assert.equal(s.alchemy.phase,'ready');failed(s,'alchemy:claim');let restored=roundtrip(s);station(restored);checked(restored,'alchemy:claim');failed(restored,'alchemy:claim');
  const poor=fresh();station(poor);poor.player.herbs=0;failed(poor,'alchemy:start:healing');poor.player.herbs=2;poor.player.ember=0;checked(poor,'alchemy:start:healing');failed(poor,'alchemy:heat:high');checked(poor,'alchemy:heat:low');
});

test('v5 rejects forged enlightenment and contradictory paid alchemy stages, time, output and quality',()=>{
  const s=fresh(),raw=X.serialize(s);for(const mutate of [d=>d.dao.learned=['missing'],d=>d.dao.learned=['sword_edge','sword_edge'],d=>d.dao.learned=['sword_flow'],d=>d.dao.learned=['sword_flow','sword_edge'],d=>d.dao=null]){const bad=JSON.parse(raw);mutate(bad);assert.throws(()=>X.deserialize(JSON.stringify(bad)));}
  const unearned=JSON.parse(X.serialize(X.createGame(77)));unearned.dao.learned=['sword_edge'];assert.throws(()=>X.deserialize(JSON.stringify(unearned)));
  station(s);checked(s,'alchemy:start:healing');checked(s,'alchemy:heat:high');advance(s,1);const heating=X.serialize(s);for(const mutate of [d=>d.alchemy.recipeId='missing',d=>d.alchemy.stationMapId='missing',d=>d.alchemy.phase='ready',d=>d.alchemy.heat='missing',d=>d.alchemy.seal='slow',d=>d.alchemy.duration=7,d=>d.alchemy.remaining=4,d=>d.alchemy.startedAt=d.time,d=>d.alchemy.paidCost.ember=0,d=>d.alchemy.paidCost.stones=0,d=>d.alchemy.output={potions:4},d=>d.alchemy.quality={id:'refined'}]){const bad=JSON.parse(heating);mutate(bad);assert.throws(()=>X.deserialize(JSON.stringify(bad)));}
  advance(s,2);checked(s,'alchemy:seal:slow');advance(s,4);const ready=X.serialize(s);for(const mutate of [d=>d.alchemy.output.potions=999,d=>d.alchemy.output.spiritTea=1,d=>d.alchemy.quality.name='Forged',d=>d.alchemy.quality.extra=1,d=>d.alchemy.remaining=1,d=>d.alchemy.startedAt=d.time,d=>d.alchemy.heat='low']){const bad=JSON.parse(ready);mutate(bad);assert.throws(()=>X.deserialize(JSON.stringify(bad)));}
});

test('genuine earned v4 character walks to its furnace, spends finite points and brews four batches without state injection',t=>{
  const s=fresh(),initial=ledger(s),p=s.player,n=C.MAPS.sect.npcs.find(n=>n.id==='alchemy');assert.equal(s.mapId,'sect');let frames=0;
  for(const id of Object.keys(C.DAO_NODES))checked(s,'dao:learn:'+id);assert.equal(X.daoInfo(s).availablePoints,2);
  while(Math.hypot(p.x-n.x,p.y-n.y)>35){assert.ok(frames++<2000);const d=Math.hypot(n.x-p.x,n.y-p.y);X.step(s,{mx:(n.x-p.x)/d,my:(n.y-p.y)/d},.05);assert.equal(s.dead,false);}
  X.interact(s);assert.equal(s.interaction,'alchemy');const outcomes=[];
  for(const [recipe,heat,seal]of [['healing','low','slow'],['tea','balanced','slow'],['ward','high','fast'],['healing','high','fast']]){checked(s,'alchemy:start:'+recipe);checked(s,'alchemy:heat:'+heat);advance(s,C.ALCHEMY_HEAT[heat].duration);checked(s,'alchemy:seal:'+seal);advance(s,C.ALCHEMY_SEAL[seal].duration);const output={...s.alchemy.output},quality=s.alchemy.quality.id;roundtrip(s);checked(s,'alchemy:claim');outcomes.push({recipe,heat,seal,quality,output});}
  assert.equal(s.player.potions,initial.wallet.potions+5);assert.equal(s.inventory.spiritTea,(initial.inventory.spiritTea||0)+2);assert.equal(s.inventory.wardPowder,(initial.inventory.wardPowder||0)+1);assert.equal(s.player.herbs,initial.wallet.herbs-8);assert.equal(s.player.stones,initial.wallet.stones-36);assert.equal(s.player.ember,initial.wallet.ember-2);checked(s,'use:wardPowder');assert.ok(s.buffs.some(b=>b.type==='ward'&&b.life===45));assert.equal(s.alchemy,null);roundtrip(s);
  if(process.env.SHANHAI_DAO_QA_SAVE){fs.mkdirSync(path.dirname(process.env.SHANHAI_DAO_QA_SAVE),{recursive:true});fs.writeFileSync(process.env.SHANHAI_DAO_QA_SAVE,X.serialize(s));}
  t.diagnostic(JSON.stringify({version:s.version,source:'authentic earned v4 final save',learned:s.dao.learned,earnedPoints:X.daoInfo(s).earnedPoints,spentPoints:X.daoInfo(s).spentPoints,outcomes,walkFrames:frames,gameplaySeconds:s.time,dead:s.dead,wallet:ledger(s).wallet}));
});
