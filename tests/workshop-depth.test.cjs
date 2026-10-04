'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {X,C,RAW,fresh,ledger,checked,failed,advance,roundtrip,atStation}=require('./depth-helpers.cjs');
const LEGACY_BATCHES=JSON.parse(fs.readFileSync(path.join(__dirname,'v5-alchemy-stages.fixture.json'),'utf8')).phases;
const nearly=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} must equal ${b}`);
function funded(){const s=fresh();for(const [id,f]of Object.entries(s.sect.facilities))if(f.stored)checked(s,'sect:claim:'+id);checked(s,'management:enable');for(const id of Object.keys(s.management.facilities))checked(s,'management:cancel:'+id);checked(s,'management:order:garden:timber:6');for(let i=0;s.player.spiritwood<13;i++){assert.ok(i<5000);if(s.management.facilities.garden.stored.length)checked(s,'management:claim:garden');X.step(s,{},.05);}return s;}
function brew(s,recipe='healing',catalyst='essence',{stable=true,purify=true,seal='slow'}={}){
 atStation(s,'alchemy');checked(s,`workshop:brew:start:${recipe}:${catalyst}`);const paid=structuredClone(s.workshop.brew.paidCost);let frames=0,purifyCount=0;
 while(X.brewingInfo(s).phase==='extract'){
  assert.ok(frames++<325);const info=X.brewingInfo(s),fire=stable?info.temperature<info.targetTemperature-1?'3':'0':'3';
  if(info.fire!==Number(fire))checked(s,'workshop:brew:fire:'+fire);
  if(purify&&info.canPurify&&purifyCount<2){const mp=s.player.mp;checked(s,'workshop:brew:purify');nearly(s.player.mp,mp-8);purifyCount++;}
  X.step(s,{},.05);
 }
 checked(s,'workshop:brew:seal:'+seal);advance(s,seal==='slow'?6:3);assert.equal(X.brewingInfo(s).phase,'ready');const info=X.brewingInfo(s),output=structuredClone(info.output),result={output,quality:info.qualityName,paid,gameTime:frames*.05+(seal==='slow'?6:3),purifyCount,stableRatio:info.stability};roundtrip(s);checked(s,'workshop:brew:claim');return result;
}
function forge(s,pattern='edge',temper='water',{proper=true}={}){
 atStation(s,'forge');checked(s,'workshop:forge:start:ironBow:'+pattern);let frames=0;
 while(X.forgingInfo(s).phase==='heat'){
  assert.ok(frames++<165);const info=X.forgingInfo(s),fire=proper?info.temperature<info.targetTemperature-1?'3':'0':'0';if(info.fire!==Number(fire))checked(s,'workshop:forge:fire:'+fire);
  if(info.canHammer&&(!proper||Math.abs(info.temperature-info.targetTemperature)<10))checked(s,'workshop:forge:hammer');X.step(s,{},.05);
 }
 const effectiveStrikes=X.forgingInfo(s).effectiveStrikes;checked(s,'workshop:forge:temper:'+temper);advance(s,temper==='water'?3:6);const mod=structuredClone(X.forgingInfo(s).mod),paid=structuredClone(s.workshop.forge.paidCost);roundtrip(s);checked(s,'workshop:forge:claim');return{mod,paid,effectiveStrikes,time:frames*.05+(temper==='water'?3:6)};
}

test('genuine V5 bytes migrate to V7 with earned data intact and empty new default processes',()=>{
 assert.equal(crypto.createHash('sha256').update(RAW).digest('hex'),'8d7a3251f7f103e89703ffae0a29706b73c8e9f772a2577b2942f7bd818e2c99');
 const old=JSON.parse(RAW),s=fresh(),next=JSON.parse(X.serialize(s));assert.equal(s.version,7);
 for(const k of Object.keys(old))if(!['version','worlds'].includes(k))assert.deepEqual(next[k],old[k],k);
 for(const[id,w]of Object.entries(old.worlds)){assert.deepEqual(next.worlds[id].nodes,w.nodes);assert.deepEqual(next.worlds[id].drops,w.drops);for(let i=0;i<w.enemies.length;i++)for(const k of ['id','type','x','y','hp','maxHp','respawn','mode','attackTimer','cooldown','burn','burnDamage','slow','rooted','wave'])assert.deepEqual(next.worlds[id].enemies[i][k],w.enemies[i][k],id+'.'+k);}
 assert.equal(s.workshop.brew,null);assert.equal(s.workshop.forge,null);assert.deepEqual(s.workshop.mods,{});assert.deepEqual(s.workshop.medicineBuffs,{});assert.equal(s.workshop.research,0);assert.equal(s.management.enabled,false);assert.deepEqual(s.journey.build.slots,[null,null]);assert.equal(s.journey.active,null);assert.equal(s.journey.retreat,null);assert.deepEqual(s.journey.relations,{});roundtrip(s);
 for(const mutate of [d=>d.inventory.healing_fine=99,d=>d.dao.learned.push('missing'),d=>d.dao.learned=['sword_flow']]){const bad=JSON.parse(RAW);mutate(bad);assert.throws(()=>X.deserialize(JSON.stringify(bad)));}
 const extra=JSON.parse(RAW);extra.workshop={mods:{ironBow:{stats:{attack:999}}},research:3};extra.journey={build:{slots:['burnHarvest','windStep']},routes:{completed:{herbTrail:true}}};const clean=X.deserialize(JSON.stringify(extra));assert.deepEqual(clean.workshop.mods,{});assert.equal(clean.workshop.research,0);assert.deepEqual(clean.journey.build.slots,[null,null]);
});

test('every genuinely paid legacy V5 alchemy stage survives V7 then settles its original medicine exactly once',()=>{
 for(const fixture of LEGACY_BATCHES){let s=X.deserialize(fixture.save),before=s.player.potions;assert.equal(s.alchemy.phase,fixture.phase);assert.deepEqual(s.alchemy,JSON.parse(fixture.save).alchemy);failed(s,'workshop:brew:start:healing:essence');roundtrip(s);
  if(s.alchemy.phase==='heat')checked(s,'alchemy:heat:high');if(s.alchemy.phase==='heating')advance(s,s.alchemy.remaining);if(s.alchemy.phase==='seal')checked(s,'alchemy:seal:slow');if(s.alchemy.phase==='sealing')advance(s,s.alchemy.remaining);assert.equal(s.alchemy.phase,'ready');assert.deepEqual(s.alchemy.output,{potions:4});checked(s,'alchemy:claim');assert.equal(s.player.potions,before+4);assert.equal(s.alchemy,null);failed(s,'alchemy:claim');checked(s,'workshop:brew:start:healing:essence');assert.equal(s.workshop.brew.phase,'extract');roundtrip(s);
 }
});

test('material and actual fire control trade quantity and speed for demonstrably stronger medicine',t=>{
 const refined=fresh(),bulk=fresh(),a=brew(refined,'healing','essence'),b=brew(bulk,'healing','ember',{stable:false,purify:false,seal:'fast'});assert.notDeepEqual(a.output,b.output);assert.equal(a.paid.essence,1);assert.equal(b.paid.ember,1);assert.ok(a.gameTime>b.gameTime);assert.ok(a.purifyCount>0);const aid=Object.keys(a.output)[0],bid=Object.keys(b.output)[0];assert.ok(aid.endsWith('_pure')||aid.endsWith('_fine'));assert.equal(bid,'potions');assert.ok(Object.values(b.output)[0]>Object.values(a.output)[0]);
 // Medicine efficacy fixture only: HP/MP are lowered to compare doses, never to prove progression.
 const ast=X.stats(refined),bst=X.stats(bulk);refined.player.hp=ast.maxHp*.1;refined.player.mp=0;bulk.player.hp=bst.maxHp*.1;bulk.player.mp=0;const ah=refined.player.hp,bh=bulk.player.hp;checked(refined,'use:'+aid);checked(bulk,'heal');assert.ok((refined.player.hp-ah)/ast.maxHp>(bulk.player.hp-bh)/bst.maxHp,'Refined medicine must heal more per dose in the real state');roundtrip(refined);roundtrip(bulk);failed(refined,'workshop:brew:claim');
 t.diagnostic(JSON.stringify({refined:a,bulk:b,boundary:'Same genuine resource save and real paid controls; lowered HP/MP only in the explicit dose-effect boundary fixture'}));
});

test('all five furnace medicines and paid stages survive saves, pause/death and original station controls',()=>{
 for(const recipe of ['healing','tea','ward','rage','insight']){let s=funded();atStation(s,'alchemy');const before=ledger(s),base=C.RECIPES[recipe].cost;checked(s,`workshop:brew:start:${recipe}:essence`);for(const[k,n]of Object.entries(base))assert.equal(s.player[k],before.wallet[k]-n-(k==='essence'?1:0));assert.equal(s.player.essence,before.wallet.essence-(base.essence||0)-1);s=roundtrip(s);failed(s,'workshop:brew:start:'+recipe+':essence');failed(s,'workshop:brew:claim');checked(s,'workshop:brew:fire:2');advance(s,3);s=roundtrip(s);const snapshot=ledger(s);for(let i=0;i<30;i++){X.workshopInfo(s);X.step(s,{},0);}assert.deepEqual(ledger(s),snapshot);s.dead=true;for(let i=0;i<100;i++)X.step(s,{},.05);assert.deepEqual(ledger(s),snapshot);s.dead=false;
  const mp=s.player.mp;checked(s,'workshop:brew:purify');nearly(s.player.mp,mp-8);failed(s,'workshop:brew:purify');checked(s,'travel:main');failed(s,'workshop:brew:fire:1');advance(s,13);assert.equal(X.brewingInfo(s).phase,'condense');failed(s,'workshop:brew:seal:slow');atStation(s,'alchemy');checked(s,'workshop:brew:seal:slow');advance(s,6);s=roundtrip(s);const output=X.brewingInfo(s).output,ready=ledger(s);checked(s,'workshop:brew:claim');for(const[id,n]of Object.entries(output))assert.equal(id==='potions'?s.player.potions:s.inventory[id],(id==='potions'?ready.wallet.potions:ready.inventory[id]||0)+n);failed(s,'workshop:brew:claim');roundtrip(s);
 }
});

test('two forged inscriptions apply actual benefits and drawbacks, with no stacking or switch healing',t=>{
 const edge=funded(),guard=funded(),e=forge(edge,'edge','water'),g=forge(guard,'guard','frost');const original=X.stats(fresh()),es=X.stats(edge),gs=X.stats(guard);assert.ok(es.attack>original.attack);assert.ok(es.maxHp<original.maxHp);assert.ok(gs.defense>original.defense);assert.ok(gs.speed<original.speed);assert.equal(e.paid.frost,undefined);assert.equal(g.paid.frost,2);assert.ok(g.time>e.time);assert.equal(edge.workshop.mods.ironBow.pattern,'edge');assert.equal(guard.workshop.mods.ironBow.pattern,'guard');
 const second=forge(edge,'spirit','water');assert.equal(edge.workshop.mods.ironBow.pattern,'spirit');assert.deepEqual(edge.workshop.mods.ironBow,second.mod);assert.equal(Object.keys(edge.workshop.mods).length,1);assert.ok(X.stats(edge).attack<original.attack,'Reforging must replace the original sharpness');const max=X.stats(edge).maxHp;edge.player.hp=max*.45;const ratio=edge.player.hp/max;for(let i=0;i<5;i++){checked(edge,'equip:starterSword');checked(edge,'equip:ironBow');nearly(edge.player.hp/X.stats(edge).maxHp,ratio);}roundtrip(edge);roundtrip(guard);failed(edge,'workshop:forge:claim');t.diagnostic(JSON.stringify({edge:e,guard:g,rewritten:second}));
});

test('proper temperature and spaced hammering yield stronger real inscription than cold rushed work',()=>{
 const proper=funded(),cold=funded(),a=forge(proper,'edge','water'),b=forge(cold,'edge','water',{proper:false});assert.ok(a.effectiveStrikes>b.effectiveStrikes);assert.ok(a.mod.quality>b.mod.quality);assert.ok(X.stats(proper).attack>X.stats(cold).attack);assert.ok(X.stats(proper).maxHp<X.stats(cold).maxHp,'Sharper paid work retains a real vitality drawback');
 const s=funded();atStation(s,'forge');checked(s,'workshop:forge:start:ironBow:edge');checked(s,'workshop:forge:hammer');failed(s,'workshop:forge:hammer');roundtrip(s);checked(s,'travel:main');failed(s,'workshop:forge:hammer');failed(s,'workshop:forge:temper:water');
});

test('V6 rejects impossible paid thermal stages, too-early products, impossible strikes and forged modifiers',()=>{
 const s=fresh();atStation(s,'alchemy');checked(s,'workshop:brew:start:healing:essence');advance(s,1);const raw=X.serialize(s);
 for(const mutate of [d=>d.workshop.brew.recipeId='missing',d=>d.workshop.brew.catalystId='missing',d=>d.workshop.brew.paidCost.essence=0,d=>d.workshop.brew.duration=1,d=>d.workshop.brew.stable=2,d=>d.workshop.brew.purifyUses=5,d=>d.workshop.brew.startedAt=d.time]){const bad=JSON.parse(raw);mutate(bad);assert.throws(()=>X.deserialize(JSON.stringify(bad)));}
 advance(s,15);checked(s,'workshop:brew:seal:slow');advance(s,6);const ready=JSON.parse(X.serialize(s));ready.workshop.brew.startedAt=ready.time-ready.workshop.brew.elapsed;assert.throws(()=>X.deserialize(JSON.stringify(ready)),'A ready brew cannot skip its mandatory 16-second extraction');
 const f=funded();atStation(f,'forge');checked(f,'workshop:forge:start:ironBow:edge');advance(f,8);checked(f,'workshop:forge:temper:water');advance(f,3);const forged=JSON.parse(X.serialize(f));forged.workshop.forge.startedAt=forged.time-forged.workshop.forge.elapsed;assert.throws(()=>X.deserialize(JSON.stringify(forged)),'A ready forge cannot skip its mandatory 8-second heating');
 const impossible=JSON.parse(X.serialize(f));impossible.workshop.forge.strikes=2;impossible.workshop.forge.effectiveStrikes=.75;impossible.workshop.forge.lastStrike=impossible.time-3;assert.throws(()=>X.deserialize(JSON.stringify(impossible)),'Two strikes can yield only 0.5, 1.25 or 2 effective strikes');checked(f,'workshop:forge:claim');const mod=JSON.parse(X.serialize(f));mod.workshop.mods.ironBow.stats.attack=999;assert.throws(()=>X.deserialize(JSON.stringify(mod)));
});

test('refined and pure tea restore their actual MP percentages and cannot be used at full MP',()=>{
 for(const seal of ['fast','slow']){const s=funded(),result=brew(s,'tea','essence',{seal}),id=Object.keys(result.output)[0];assert.equal(id,seal==='fast'?'tea_fine':'tea_pure');const cap=X.stats(s).maxMp;s.player.mp=0;checked(s,'use:'+id);nearly(s.player.mp,cap*(seal==='fast'?.68:.82));roundtrip(s);s.player.mp=cap;failed(s,'use:'+id);}
});

test('real rage potency replaces ordinary buff strength, retains stronger item on weak reuse and never stacks',()=>{
 const s=funded();forge(s,'edge','water');const base=X.stats(s).attack,pure=Object.keys(brew(s,'rage','essence').output)[0],fine=Object.keys(brew(s,'rage','essence',{seal:'fast'}).output)[0];assert.equal(pure,'rage_pure');assert.equal(fine,'rage_fine');checked(s,'use:'+pure);nearly(X.stats(s).attack/base,1.42);checked(s,'craft:rage');checked(s,'use:rageElixir');nearly(X.stats(s).attack/base,1.42);checked(s,'use:'+fine);assert.equal(s.workshop.medicineBuffs.rage.itemId,pure);nearly(X.stats(s).attack/base,1.42);roundtrip(s);advance(s,51);assert.equal(s.workshop.medicineBuffs.rage,undefined);assert.equal(s.buffs.some(b=>b.type==='rage'),false);nearly(X.stats(s).attack,base);roundtrip(s);
});

// These attack boundaries add one enemy projectile at a real unsafe coordinate,
// to compare actual incoming damage; they are not a natural-progression fixture.
function incoming(s){checked(s,'travel:main');s.player.x=1100;s.player.y=1800;s.player.shield=0;s.player.invuln=0;const hp=s.player.hp;s.projectiles.push({x:s.player.x,y:s.player.y,vx:0,vy:0,life:1,radius:9,owner:'enemy',sourceId:s.enemies[0].id,damage:200});X.step(s,{},.05);return hp-s.player.hp;}
test('actual ward damage is 44 percent lower and ordinary plus refined buffs retain the same strongest reduction',()=>{
 const bare=funded(),pure=funded(),both=funded();for(const s of [pure,both]){const id=Object.keys(brew(s,'ward','essence').output)[0];assert.equal(id,'ward_pure');checked(s,'use:'+id);}const weak=Object.keys(brew(both,'ward','essence',{seal:'fast'}).output)[0];assert.equal(weak,'ward_fine');checked(both,'use:'+weak);checked(both,'craft:ward');checked(both,'use:wardPowder');assert.equal(both.workshop.medicineBuffs.ward.itemId,'ward_pure');roundtrip(both);const a=incoming(bare),b=incoming(pure),c=incoming(both);nearly(b/a,.56);nearly(c/a,.56);roundtrip(pure);roundtrip(both);
});

function earnedXp(s){checked(s,'management:order:library:insight:1');for(let i=0;!s.management.facilities.library.stored.length;i++){assert.ok(i<1500);X.step(s,{},.05);}const before=s.player.xp;checked(s,'management:claim:library');return s.player.xp-before;}
test('actual insight increases earned production XP and ordinary plus refined buffs never multiply twice',()=>{
 const base=funded(),fine=funded(),pure=funded(),both=funded();for(const [s,seal]of[[fine,'fast'],[pure,'slow'],[both,'slow']]){const id=Object.keys(brew(s,'insight','essence',{seal}).output)[0];assert.equal(id,seal==='fast'?'insight_fine':'insight_pure');checked(s,'use:'+id);}const weak=Object.keys(brew(both,'insight','essence',{seal:'fast'}).output)[0];checked(both,'use:'+weak);checked(both,'craft:insight');checked(both,'use:insightPill');assert.equal(both.workshop.medicineBuffs.insight.itemId,'insight_pure');roundtrip(both);const normal=earnedXp(base);nearly(earnedXp(fine)/normal,1.4);nearly(earnedXp(pure)/normal,1.5);nearly(earnedXp(both)/normal,1.5);roundtrip(fine);roundtrip(pure);roundtrip(both);
});

// Explicit death boundaries use a real enemy projectile at an unsafe position.
// Death, material loss and revival are performed by the engine itself.
function deathBoundary(s){if(s.mapId!=='main')checked(s,'travel:main');s.player.x=1100;s.player.y=1800;s.player.invuln=0;s.player.shield=0;s.projectiles.push({x:s.player.x,y:s.player.y,vx:0,vy:0,life:1,radius:9,owner:'enemy',sourceId:s.enemies[0].id,damage:100000});X.step(s,{},.05);assert.equal(s.dead,true);assert.equal(s.player.hp,0);roundtrip(s);}
test('paid furnace and forge survive real death, stopped process time, revival and later controls without repayment',()=>{
 for(const kind of ['brew','forge']){const s=funded();atStation(s,kind==='brew'?'alchemy':'forge');checked(s,kind==='brew'?'workshop:brew:start:healing:essence':'workshop:forge:start:ironBow:edge');advance(s,1);const paid=structuredClone(s.workshop[kind].paidCost);deathBoundary(s);const stopped=ledger(s),elapsed=s.workshop[kind].elapsed;for(let i=0;i<1000;i++)X.step(s,{},.05);assert.deepEqual(ledger(s),stopped);assert.equal(s.workshop[kind].elapsed,elapsed);roundtrip(s);checked(s,'revive');atStation(s,kind==='brew'?'alchemy':'forge');const wallet=ledger(s).wallet;checked(s,kind==='brew'?'workshop:brew:purify':'workshop:forge:hammer');assert.deepEqual(s.workshop[kind].paidCost,paid);assert.deepEqual(ledger(s).wallet,wallet);roundtrip(s);
  advance(s,kind==='brew'?16:8);checked(s,kind==='brew'?'workshop:brew:seal:slow':'workshop:forge:temper:water');advance(s,kind==='brew'?6:3);roundtrip(s);checked(s,kind==='brew'?'workshop:brew:claim':'workshop:forge:claim');failed(s,kind==='brew'?'workshop:brew:claim':'workshop:forge:claim');roundtrip(s);}
});
