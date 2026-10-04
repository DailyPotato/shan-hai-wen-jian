'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const X=require('../engine.js');
const C=X.CONTENT;
const legacyNPCs=['elder','disciple','herbalist','hunter','broker','fireArtisan','snowHealer','trialKeeper'].map(id=>C.NPC_CHARACTERS[id]);
const V2=fs.readFileSync(path.join(__dirname,'v2-save.fixture.json'),'utf8');
const keys=[...Object.keys(C.RESOURCES),'potions','xp'];
const ledger=s=>({wallet:Object.fromEntries(keys.map(k=>[k,s.player[k]])),inventory:{...s.inventory},techniques:{...s.techniques},grades:{...s.techniqueGrades},npc:structuredClone(s.npcProgress)});
const advance=(s,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds/.05);i++)X.step(s,input,.05);};
const checked=(s,id)=>{X.action(s,id);assert.equal(s.lastAction.ok,true,id+': '+s.lastAction.message);};
const failed=(s,id)=>{const before=ledger(s);X.action(s,id);assert.equal(s.lastAction.ok,false,id);assert.deepEqual(ledger(s),before,id+' must not charge or change progress');};
// Isolated mechanics fixtures may change location or wallet. The final integration below never does.
function fixture(){const s=X.deserialize(V2);for(const k of Object.keys(C.RESOURCES))s.player[k]=1000;return s;}
function at(s,id){const n=C.NPC_CHARACTERS[id];if(s.mapId!==n.mapId){const h=X.mapInfo(s).start;s.player.x=h.x;s.player.y=h.y;checked(s,'travel:'+n.mapId);}s.player.x=n.x;s.player.y=n.y;return s;}
function meet(s,id,choice='respect'){at(s,id);checked(s,`npc:${id}:talk:${choice}`);return s;}
function rewardDelta(s,before,reward,cost={}){
  for(const k of keys)assert.equal(s.player[k],before.wallet[k]-(cost[k]||0)+(reward[k]||0));
  for(const k of new Set([...Object.keys(before.inventory),...Object.keys(reward)])){
    if(keys.includes(k))continue;assert.equal(s.inventory[k]||0,(before.inventory[k]||0)+(reward[k]||0));
  }
}
const blocked=(m,x,y,r=18)=>x<r+25||y<r+25||x>m.width-r-25||y>m.height-r-25||m.ponds.some(p=>((x-p.x)/(p.rx+r))**2+((y-p.y)/(p.ry+r))**2<1)||m.obstacles.some(o=>Math.hypot(x-o.x,y-o.y)<o.radius+r);

test('authentic v2 fixture migrates without losing the earned character, worlds or progress',()=>{
  assert.equal(crypto.createHash('sha256').update(V2).digest('hex'),'02fac0e8793eec003e3d116db8cab5c585c7ef24b483190e9268599280078e22');
  const old=JSON.parse(V2),s=X.deserialize(V2),next=JSON.parse(X.serialize(s));
  assert.ok(s.version>=3);assert.deepEqual(s.npcProgress,{});
  assert.deepEqual(s.techniqueGrades,Object.fromEntries(Object.keys(old.techniques).map(k=>[k,0])));
  for(const k of ['root','techniques','activeTechnique','inventory','equipment','buffs','story','progress','trials','projectiles','quests','questRewards','won','dead','meditationCd','seed','rng','time'])assert.deepEqual(next[k],old[k],k);
  for(const k of Object.keys(old.player))assert.deepEqual(next.player[k],old.player[k],k);
  for(const [id,w]of Object.entries(old.worlds)){
    assert.deepEqual(next.worlds[id].nodes,w.nodes);assert.deepEqual(next.worlds[id].drops,w.drops);
    // Zone, telegraph and velocity are recomputed; actual monster state and rewards must persist.
    for(let i=0;i<w.enemies.length;i++)for(const k of ['id','type','x','y','hp','maxHp','respawn','mode','attackTimer','cooldown','burn','burnDamage','slow','rooted','wave'])assert.equal(next.worlds[id].enemies[i][k],w.enemies[i][k],id+'.'+k);
  }
  assert.deepEqual(X.deserialize(X.serialize(s)).techniqueGrades,s.techniqueGrades);
});

test('original eight characters remain distinct on legal safe ground with meaningful choices and services',()=>{
  const chars=legacyNPCs;assert.equal(chars.length,8);
  assert.equal(new Set(chars.map(n=>n.name)).size,8);assert.equal(new Set(chars.map(n=>n.skin)).size,8);
  for(const n of chars){const m=C.MAPS[n.mapId];
    assert.ok(m.npcs.some(v=>v.id===n.id&&v.x===n.x&&v.y===n.y));assert.equal(blocked(m,n.x,n.y),false);
    assert.ok(Math.hypot(n.x-m.hub.x,n.y-m.hub.y)<m.hub.radius);
    for(const other of m.npcs.filter(v=>v.id!==n.id))assert.ok(Math.hypot(n.x-other.x,n.y-other.y)>80,`${n.id} overlaps ${other.id}`);
    assert.ok(n.dialogue&&n.role&&n.description);assert.deepEqual(n.choices.map(c=>c.id),['respect','practical']);
    assert.notDeepEqual(n.choices[0].reward,n.choices[1].reward);assert.ok(n.services?.length||n.commission);
  }
});

test('NPC inspection is pure and proximity, map, death and malformed action guards charge nothing',()=>{
  const s=X.createGame(731),raw=X.serialize(s);assert.equal(X.npcInfo(s,'missing'),null);
  for(const id of Object.keys(C.NPC_CHARACTERS))X.npcInfo(s,id);assert.equal(X.serialize(s),raw);
  for(const id of ['npc:elder:talk:respect','npc:elder:service:study','npc:missing:talk:respect'])failed(s,id);
  at(s,'elder');for(const id of ['npc:elder:talk:missing','npc:elder:talk:respect:extra','npc:elder:accept','npc:elder:claim','npc:elder:service:study'])failed(s,id);
  s.dead=true;s.player.hp=0;failed(s,'npc:elder:talk:respect');s.dead=false;s.player.hp=X.stats(s).maxHp;
  at(s,'disciple');s.player.x=880;assert.ok(X.npcInfo(s,'disciple').near);assert.equal(X.isSafe(s),false);failed(s,'npc:disciple:talk:respect');
  const advanced=fixture();at(advanced,'elder');failed(advanced,'npc:fireArtisan:talk:respect');
});

test('first meeting choices grant different actual rewards once and E targets the chosen character',()=>{
  for(const n of legacyNPCs)for(const choice of n.choices){
    const s=fixture();at(s,n.id);X.interact(s);assert.equal(s.interaction,n.id);
    const before=ledger(s);checked(s,`npc:${n.id}:talk:${choice.id}`);rewardDelta(s,before,choice.reward);
    assert.equal(X.npcInfo(s,n.id).rapport,choice.rapport);assert.equal(X.npcInfo(s,n.id).choice,choice.id);
    failed(s,`npc:${n.id}:talk:respect`);failed(s,`npc:${n.id}:talk:practical`);
    assert.deepEqual(X.deserialize(X.serialize(s)).npcProgress,s.npcProgress);
  }
});

test('every NPC service pays exact costs, grants real items, obeys gameplay cooldown and rapport',()=>{
  for(const n of legacyNPCs)for(const service of n.services||[]){
    const s=meet(fixture(),n.id);if(service.restore){s.player.hp=100;s.player.mp=100;s.player.slow=2;}
    const before=ledger(s),rapport=X.npcInfo(s,n.id).rapport;
    checked(s,`npc:${n.id}:service:${service.id}`);rewardDelta(s,before,service.reward,service.cost);
    if(service.restore){assert.equal(s.player.hp,Math.min(X.stats(s).maxHp,100+X.stats(s).maxHp*.5));assert.equal(s.player.mp,Math.min(X.stats(s).maxMp,100+X.stats(s).maxMp*.3));assert.equal(s.player.slow,0);}
    assert.equal(X.npcInfo(s,n.id).rapport,rapport+1);assert.equal(s.npcProgress[n.id].services[service.id].uses,1);
    failed(s,`npc:${n.id}:service:${service.id}`);assert.ok(X.npcInfo(s,n.id).services.find(v=>v.id===service.id).remaining>0);
    // Inspection and repeated clicks do not make the clock run.
    for(let i=0;i<100;i++)X.npcInfo(s,n.id);failed(s,`npc:${n.id}:service:${service.id}`);
    advance(s,service.cooldown+.1);if(service.restore){s.player.hp=100;s.player.mp=100;s.player.slow=2;}
    checked(s,`npc:${n.id}:service:${service.id}`);assert.equal(s.npcProgress[n.id].services[service.id].uses,2);
    assert.equal(X.npcInfo(s,n.id).rapport,rapport+1);assert.deepEqual(X.deserialize(X.serialize(s)).npcProgress,s.npcProgress);
  }
});

test('ordinary trade unlocks the broker, poor services and unnecessary healing fail free',()=>{
  const s=meet(fixture(),'broker','practical');failed(s,'npc:broker:service:essence');
  checked(s,'npc:broker:service:timber');assert.equal(X.npcInfo(s,'broker').rapport,2);checked(s,'npc:broker:service:essence');
  const poor=meet(X.createGame(17),'herbalist');failed(poor,'npc:herbalist:service:brew');
  const healthy=meet(fixture(),'snowHealer');healthy.player.hp=X.stats(healthy).maxHp;healthy.player.mp=X.stats(healthy).maxMp;healthy.player.slow=0;failed(healthy,'npc:snowHealer:service:cleanse');
  healthy.player.slow=1;checked(healthy,'npc:snowHealer:service:cleanse');assert.equal(healthy.player.slow,0);
});

test('commissions exclude preaccept activity, accept and claim once, and honor true historical achievements',()=>{
  const s=meet(fixture(),'herbalist');checked(s,'npc:herbalist:accept');assert.equal(s.npcProgress.herbalist.commission.baseline,s.quests.herbs);assert.equal(X.npcInfo(s,'herbalist').commission.progress,0);
  failed(s,'npc:herbalist:accept');failed(s,'npc:herbalist:claim');
  // Inventory gifts are not gathering events.
  s.player.herbs+=10;assert.equal(X.npcInfo(s,'herbalist').commission.progress,0);
  for(const id of ['hunter','trialKeeper']){meet(s,id);checked(s,`npc:${id}:accept`);assert.equal(X.npcInfo(s,id).commission.progress,1);
    const before=ledger(s);checked(s,`npc:${id}:claim`);rewardDelta(s,before,C.NPC_CHARACTERS[id].commission.reward);assert.equal(X.npcInfo(s,id).rapport,4);failed(s,`npc:${id}:claim`);
  }
  const fresh=meet(X.createGame(19),'hunter');checked(fresh,'npc:hunter:accept');assert.equal(X.npcInfo(fresh,'hunter').commission.progress,0);failed(fresh,'npc:hunter:claim');
});

test('fixed technique grades cannot be promoted and practice only raises learned levels',()=>{
  assert.equal(Object.keys(C.TECHNIQUES).length,35);
  for(const id of Object.keys(C.TECHNIQUE_DIRECTIONS)){
    const s=X.createGame(61);for(const key of Object.keys(C.RESOURCES))s.player[key]=1000;s.player.realm=1;s.quests.kills=1;s.quests.bosses=['wolfKing'];s.progress.bosses=['wolfKing'];s.enemies.find(e=>e.type==='wolfKing').hp=0;s.player.hp=X.stats(s).maxHp;s.player.mp=X.stats(s).maxMp;if(!s.techniques[id]){checked(s,'buy:'+id+'Book');checked(s,'learn:'+id);}
    const grade=X.techniqueInfo(s,id).gradeIndex;
    failed(s,'promote:'+id);checked(s,'train:'+id);assert.equal(X.techniqueInfo(s,id).gradeIndex,grade);
    checked(s,'train:'+id);assert.equal(s.techniques[id],3);assert.equal(X.techniqueInfo(s,id).gradeIndex,grade);failed(s,'promote:'+id);failed(s,'train:'+id);
    assert.deepEqual(X.deserialize(X.serialize(s)).techniques,s.techniques);
  }
});

test('v3 rejects malformed grade and NPC records rather than accepting forged progression',()=>{
  const base=fixture();meet(base,'broker','practical');checked(base,'npc:broker:service:timber');meet(base,'disciple');checked(base,'npc:disciple:accept');
  const raw=X.serialize(base);
  const changes=[
    d=>delete d.techniqueGrades.sword,d=>d.techniqueGrades.missing=0,d=>d.techniqueGrades.sword=5,d=>d.techniqueGrades.sword=-1,d=>d.techniqueGrades.sword=1.5,
    d=>d.techniqueGrades.flame=2,d=>d.npcProgress.missing=d.npcProgress.disciple,d=>d.npcProgress.broker.met=false,d=>d.npcProgress.broker.choice='missing',
    d=>d.npcProgress.broker.rapport=10,d=>d.npcProgress.broker.commission.accepted=true,d=>d.npcProgress.disciple.commission.claimed=true,
    d=>d.npcProgress.disciple.commission.baseline=d.quests.kills+1,d=>d.npcProgress.broker.services.missing={uses:1,lastAt:0},
    d=>d.npcProgress.broker.services.timber.uses=0,d=>d.npcProgress.broker.services.timber.lastAt=d.time+1,d=>d.npcProgress.broker.services.timber.uses=1000000,
    d=>{d.npcProgress.broker.services={essence:{uses:1,lastAt:d.time}};},d=>{d.npcProgress.disciple.commission.accepted=false;d.npcProgress.disciple.commission.baseline=1;}
  ];
  for(const change of changes){const d=JSON.parse(raw);change(d);assert.throws(()=>X.deserialize(JSON.stringify(d)));}
});

test('authentic v2 character visits eight NPCs, earns new commissions and trains flame without injections',t=>{
  const s=X.deserialize(V2),p=s.player,startWallet=ledger(s),initialKills=s.quests.kills,initialHerbs=s.quests.herbs;
  let frames=0,deaths=0;const size=35,cols=Math.floor((X.WIDTH-86)/size)+1,rows=Math.floor((X.HEIGHT-86)/size)+1;
  const coord=n=>({x:43+n%cols*size,y:43+Math.floor(n/cols)*size});
  function nearest(pt){let best=-1,bd=Infinity;for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){
    const x=Math.round((pt.x-43)/size)+xx,y=Math.round((pt.y-43)/size)+yy,id=y*cols+x;if(x<0||y<0||x>=cols||y>=rows)continue;
    const c=coord(id),d=Math.hypot(c.x-pt.x,c.y-pt.y);if(!blocked(X.mapInfo(s),c.x,c.y)&&d<bd){best=id;bd=d;}
  }assert.ok(best>=0);return best;}
  function route(target){const start=nearest(p),end=nearest(target),q=[start],prev=new Map([[start,null]]);
    for(let i=0;i<q.length&&!prev.has(end);i++){const id=q[i],a=coord(id),cx=id%cols,cy=Math.floor(id/cols);
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=cx+dx,y=cy+dy,n=y*cols+x;
        if(x<0||y<0||x>=cols||y>=rows||prev.has(n))continue;const b=coord(n),m=X.mapInfo(s);if(blocked(m,b.x,b.y)||blocked(m,(a.x+b.x)/2,(a.y+b.y)/2))continue;prev.set(n,id);q.push(n);
      }
    }assert.ok(prev.has(end));let id=end,r=[];while(id!==null){r.unshift(coord(id));id=prev.get(id);}return r;}
  function frame(input={}){assert.ok(++frames<60000);if(p.hp<X.stats(s).maxHp*.5&&p.potions>0)X.action(s,'heal');if(p.mp<X.stats(s).maxMp*.2&&s.inventory.spiritTea>0)X.action(s,'use:spiritTea');X.step(s,input,.05);assert.equal(blocked(X.mapInfo(s),p.x,p.y),false);if(s.dead){deaths++;X.action(s,'revive');return false;}return true;}
  function walk(target){for(let attempt=0;attempt<6;attempt++){let died=false;for(const point of route(target)){let tries=0;while(Math.hypot(point.x-p.x,point.y-p.y)>13){
    if(tries++>40)break;const d=Math.hypot(point.x-p.x,point.y-p.y),foe=s.enemies.filter(e=>e.hp>0&&!e.gated).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
    if(!frame({mx:(point.x-p.x)/d,my:(point.y-p.y)/d,attack:true,aimX:foe?.x,aimY:foe?.y,skill:foe&&Math.hypot(foe.x-p.x,foe.y-p.y)<200})){died=true;break;}
  }if(died)break;}if(!died&&Math.hypot(p.x-target.x,p.y-target.y)<65)return;}assert.fail('Cannot walk to '+JSON.stringify(target));}
  function hub(){walk(X.mapInfo(s).start);checked(s,'meditate');}
  function visit(id,choice='respect'){const n=C.NPC_CHARACTERS[id];if(s.mapId!==n.mapId){hub();checked(s,'travel:'+n.mapId);}walk(n);X.interact(s);assert.equal(s.interaction,id);checked(s,`npc:${id}:talk:${choice}`);}
  function fight(e){walk(e);for(let i=0;i<4000&&e.hp>0;i++){const d=Math.hypot(e.x-p.x,e.y-p.y),warning=s.effects.find(f=>f.type==='warning'&&f.sourceId===e.id&&f.life<.25);const avoid=warning&&Math.hypot(warning.x-p.x,warning.y-p.y)<warning.radius+25;let mx=0,my=0;
    if(avoid){mx=p.x-warning.x||-1;my=p.y-warning.y||1;const l=Math.hypot(mx,my);mx/=l;my/=l;}else if(d>80){mx=(e.x-p.x)/d;my=(e.y-p.y)/d;}
    assert.ok(frame({mx,my,attack:true,skill:true,aimX:e.x,aimY:e.y,dash:!!avoid}));
  }assert.equal(e.hp,0);}
  visit('elder');checked(s,'npc:elder:service:study');visit('disciple');checked(s,'npc:disciple:accept');assert.equal(X.npcInfo(s,'disciple').commission.progress,0);
  visit('herbalist');checked(s,'npc:herbalist:accept');assert.equal(X.npcInfo(s,'herbalist').commission.progress,0);checked(s,'npc:herbalist:service:brew');
  visit('hunter');checked(s,'npc:hunter:accept');checked(s,'npc:hunter:claim');checked(s,'npc:hunter:service:ward');
  visit('broker','practical');failed(s,'npc:broker:service:essence');checked(s,'npc:broker:service:timber');checked(s,'npc:broker:service:essence');
  // Gather fresh herbs and defeat genuine respawned monsters after commission acceptance.
  while(X.npcInfo(s,'herbalist').commission.progress<10){const node=s.nodes.filter(n=>n.type==='herb'&&n.ready===0).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];assert.ok(node);walk(node);const before=s.quests.herbs;X.interact(s);assert.equal(s.quests.herbs,before+2);}
  while(X.npcInfo(s,'disciple').commission.progress<6){let foe=s.enemies.filter(e=>!e.boss&&e.hp>0&&!e.gated).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!foe){hub();for(let i=0;i<1400;i++)frame();continue;}fight(foe);}
  walk(C.NPC_CHARACTERS.disciple);checked(s,'npc:disciple:claim');walk(C.NPC_CHARACTERS.herbalist);checked(s,'npc:herbalist:claim');
  visit('fireArtisan');checked(s,'npc:fireArtisan:service:ember');checked(s,'npc:fireArtisan:service:rage');
  visit('snowHealer');checked(s,'npc:snowHealer:service:supplies');
  visit('trialKeeper');checked(s,'npc:trialKeeper:accept');checked(s,'npc:trialKeeper:claim');checked(s,'npc:trialKeeper:service:refine');
  hub();checked(s,'travel:main');hub();checked(s,'train:flame');checked(s,'train:flame');failed(s,'promote:flame');checked(s,'equip:flameSword');checked(s,'technique:flame');
  const foe=s.enemies.find(e=>e.hp>0&&!e.boss&&!e.gated);assert.ok(foe);walk(foe);while(p.skillCd>0)frame();const mp=p.mp,info=X.techniqueInfo(s),st=X.stats(s),regen=.05*((X.isSafe(s)?6:2.5)+st.manaRegen);frame({skill:true,aimX:foe.x,aimY:foe.y});assert.equal(p.mp,Math.min(st.maxMp,mp+regen)-info.manaCost);assert.ok(s.effects.some(e=>e.type==='flame'));
  hub();walk(C.NPC_CHARACTERS.elder);X.interact(s);
  assert.ok(s.version>=3);assert.equal(Object.keys(s.npcProgress).length,8);assert.equal(Object.values(s.npcProgress).filter(n=>n.commission.claimed).length,4);assert.equal(s.techniques.flame,3);assert.equal(X.techniqueInfo(s,'flame').gradeIndex,0);assert.ok(s.quests.kills>=initialKills+6);assert.ok(s.quests.herbs>=initialHerbs+10);assert.equal(deaths,0);
  const restored=X.deserialize(X.serialize(s));assert.deepEqual(restored.npcProgress,s.npcProgress);assert.deepEqual(restored.techniqueGrades,s.techniqueGrades);assert.deepEqual(restored.player,s.player);
  if(process.env.SHANHAI_GRADE_QA_SAVE){fs.mkdirSync(path.dirname(process.env.SHANHAI_GRADE_QA_SAVE),{recursive:true});fs.writeFileSync(process.env.SHANHAI_GRADE_QA_SAVE,X.serialize(s));}
  t.diagnostic(JSON.stringify({version:s.version,NPCs:Object.keys(s.npcProgress),commissions:4,flameLevel:s.techniques.flame,flameGrade:s.techniqueGrades.flame,startWallet:startWallet.wallet,endWallet:ledger(s).wallet,kills:s.quests.kills-initialKills,herbs:s.quests.herbs-initialHerbs,deaths,frames,gameplaySeconds:Math.round(s.time)}));
});
