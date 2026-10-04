'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const C=require('../content.js');
const LEGACY=fs.readFileSync(path.join(__dirname,'v1-save.fixture.json'),'utf8');
let X;
const engine=()=>X||(X=require('../engine.js'));
const ledger=s=>({resources:Object.fromEntries([...Object.keys(C.RESOURCES),'potions','xp','weapon','realm'].map(k=>[k,s.player[k]])),inventory:{...s.inventory},techniques:{...s.techniques},equipment:{...s.equipment}});
const advance=(s,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds/.05);i++)engine().step(s,input,.05);return s;};
function fixture(realm=0){
  const X=engine(),s=X.createGame(701);
  s.root={grade:'mortal',elements:['water'],legacy:false};s.player.realm=realm;
  const bosses=['wolfKing','ancientTree','guardian'].slice(0,realm);
  s.quests.bosses=bosses.slice();s.progress.bosses=bosses.slice();s.quests.kills=realm;s.won=realm===3;
  for(const e of s.enemies){e.stun=20;if(bosses.includes(e.type))e.hp=0;}
  s.player.hp=X.stats(s).maxHp;s.player.mp=X.stats(s).maxMp;return s;
}
function hub(s){const h=engine().mapInfo(s).start;s.player.x=h.x;s.player.y=h.y;}
function battle(s,e){
  const X=engine();s.player.x=e.x-75;s.player.y=e.y;
  for(let i=0;i<5000&&e.hp>0;i++){
    s.player.invuln=20;for(const foe of s.enemies)foe.stun=20;
    X.step(s,{attack:true,skill:true,aimX:e.x,aimY:e.y},.05);
  }
  assert.equal(e.hp,0,`Combat failed: ${e.type}`);
}
const mapBlocked=(m,x,y,r=18)=>x<r+25||y<r+25||x>m.width-r-25||y>m.height-r-25||
  m.ponds.some(p=>((x-p.x)/(p.rx+r))**2+((y-p.y)/(p.ry+r))**2<1)||m.obstacles.some(o=>Math.hypot(x-o.x,y-o.y)<o.radius+r);

function graph(m,start){
  const size=35,cols=Math.floor((m.width-86)/size)+1,rows=Math.floor((m.height-86)/size)+1;
  const coord=n=>({x:43+n%cols*size,y:43+Math.floor(n/cols)*size});
  const nearest=p=>Math.round((p.y-43)/size)*cols+Math.round((p.x-43)/size);
  const first=nearest(start),previous=new Map([[first,null]]),queue=[first];
  for(let cursor=0;cursor<queue.length;cursor++){
    const id=queue[cursor],a=coord(id),cx=id%cols,cy=Math.floor(id/cols);
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const x=cx+dx,y=cy+dy,n=y*cols+x;
      if(x<0||y<0||x>=cols||y>=rows||previous.has(n))continue;
      const b=coord(n);if(mapBlocked(m,b.x,b.y)||mapBlocked(m,(a.x+b.x)/2,(a.y+b.y)/2))continue;
      previous.set(n,id);queue.push(n);
    }
  }
  return{previous,coord,nearest};
}

test('content loads in Node and a browser and describes real usable systems',()=>{
  const browser={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../content.js'),'utf8'),browser);
  assert.deepEqual(Object.keys(browser.XianContent.MAPS),Object.keys(C.MAPS));
  assert.deepEqual(Object.keys(C.MAPS),['main','red','snow','bambooTrial','fireTrial','iceTrial']);
  assert.deepEqual(Object.keys(C.TECHNIQUES),['sword','flame','frost','wood','thunder','earth']);
  assert.equal(Object.keys(C.ROOT_GRADES).length,5);assert.equal(Object.keys(C.ELEMENTS).length,8);
  assert.equal(Object.keys(C.RESOURCES).length,8);assert.ok(Object.keys(C.RECIPES).length>=8);
  for(const section of ['MAPS','TECHNIQUES','ROOT_GRADES','ELEMENTS','RESOURCES','ITEMS','RECIPES','SIDE_QUESTS']){
    for(const[id,item]of Object.entries(C[section])){
      assert.equal(item.id,id);assert.ok(item.name&&item.description,`${section}.${id} needs readable information`);
    }
  }
  const grades=Object.values(C.ROOT_GRADES);
  assert.equal(new Set(grades.map(g=>g.growth)).size,5);assert.equal(new Set(grades.map(g=>g.cultivation)).size,5);
  const acquired=new Set(Object.values(C.MAPS).flatMap(m=>m.nodes.map(n=>n[0]==='herb'?'herbs':n[0]==='crystal'?'stones':n[0])));
  const consumed=new Set(Object.values(C.RECIPES).flatMap(r=>Object.keys(r.cost)));
  for(const resource of Object.keys(C.RESOURCES)){assert.ok(acquired.has(resource));assert.ok(consumed.has(resource));}
  for(const recipe of Object.values(C.RECIPES)){
    for(const[r,amount]of Object.entries(recipe.cost)){assert.ok(C.RESOURCES[r]);assert.ok(Number.isInteger(amount)&&amount>0);}
    for(const[id,amount]of Object.entries(recipe.output)){assert.ok(C.ITEMS[id]);assert.ok(Number.isInteger(amount)&&amount>0);}
  }
  for(const slot of ['weapon','robe','charm'])assert.ok(new Set(Object.values(C.ITEMS).filter(i=>i.slot===slot).map(i=>i.tier)).size>=3);
  assert.ok(C.STORY.length>=5);for(const chapter of C.STORY){assert.ok(chapter.options.length>=2);for(const option of chapter.options)assert.ok(Object.keys(option.reward).length>0&&option.relation);}
});

test('all six maps have distinct terrain and reachable resources, bosses, NPCs and exits',()=>{
  const signatures=new Set();
  for(const m of Object.values(C.MAPS)){
    assert.equal(m.width,3200);assert.equal(m.height,2400);assert.equal(mapBlocked(m,m.start.x,m.start.y),false);
    signatures.add(JSON.stringify([m.ponds,m.obstacles,m.spawns,m.nodes]));
    const g=graph(m,m.start),targets=[...m.nodes.map(n=>({name:n[0],x:n[1],y:n[2]})),...m.spawns.map(n=>({name:n[0],x:n[1],y:n[2]})),...m.npcs,...m.portals];
    for(const target of targets){
      assert.equal(mapBlocked(m,target.x,target.y),false,`${m.id}: ${target.name} lies in solid terrain`);
      assert.ok(g.previous.has(g.nearest(target)),`${m.id}: ${target.name} is unreachable`);
    }
    if(m.type==='trial'){
      assert.deepEqual([...new Set(m.spawns.map(s=>s[3]))],[1,2,3]);
      assert.equal(m.spawns.filter(s=>s[3]===3).length,1);
      assert.ok(m.portals.some(p=>p.target==='main'),'Trial needs a physical exit');
    }
  }
  assert.equal(signatures.size,6);
});

test('seeded roots cover all five grades and eight elements with real growth and cultivation',()=>{
  const X=engine(),grades=new Set(),elements=new Set();
  for(let seed=1;seed<=2048;seed++){
    const a=X.createGame(seed),b=X.createGame(seed);
    assert.deepEqual(a.root,b.root);assert.ok(C.ROOT_GRADES[a.root.grade]);
    grades.add(a.root.grade);for(const id of a.root.elements){assert.ok(C.ELEMENTS[id]);elements.add(id);}
    assert.equal(new Set(a.root.elements).size,a.root.elements.length);
  }
  assert.equal(grades.size,5);assert.equal(elements.size,8);
  const hp=[],xp=[];
  for(const grade of Object.keys(C.ROOT_GRADES)){
    const s=fixture();s.root.grade=grade;s.player.hp=X.stats(s).maxHp;s.player.mp=X.stats(s).maxMp;
    const node=s.nodes.find(n=>n.type==='herb'&&X.mapInfo(s).npcs.every(p=>Math.hypot(p.x-n.x,p.y-n.y)>110));
    s.player.x=node.x;s.player.y=node.y;X.interact(s);
    hp.push(X.stats(s).maxHp);xp.push(s.player.xp);
    assert.ok(Math.abs(s.player.xp-6*C.ROOT_GRADES[grade].cultivation)<1e-8);
    assert.equal(X.rootInfo(s).grade,grade);
  }
  assert.equal(new Set(hp).size,5);assert.equal(new Set(xp).size,5);
});

test('matching roots affect technique cost and damage and elemental equipment adds affinity',()=>{
  const X=engine(),neutral=fixture(),matched=fixture();
  for(const s of[neutral,matched]){s.root.grade='immortal';s.player.hp=X.stats(s).maxHp;s.player.mp=X.stats(s).maxMp;s.player.x=1100;s.player.y=1800;Object.assign(s.enemies[0],{x:1190,y:1800,homeX:1190,homeY:1800});}
  neutral.root.elements=['fire'];matched.root.elements=['metal'];
  const n=X.techniqueInfo(neutral),m=X.techniqueInfo(matched);
  assert.ok(m.affinity>n.affinity);assert.ok(m.manaCost<n.manaCost);
  X.step(neutral,{skill:true,aimX:1190,aimY:1800},.05);X.step(matched,{skill:true,aimX:1190,aimY:1800},.05);
  assert.ok(matched.enemies[0].hp<neutral.enemies[0].hp);
  const fire=fixture();fire.techniques.flame=1;if(fire.techniqueGrades)fire.techniqueGrades.flame=0;fire.inventory.flameSword=1;
  const before=X.techniqueInfo(fire,'flame').affinity;X.action(fire,'equip:flameSword');
  assert.equal(safeOk(fire),true);assert.ok(X.techniqueInfo(fire,'flame').affinity>before);
});

function safeOk(s){return !!s.lastAction&&s.lastAction.ok;}

test('all six Q schools have distinct combat effects and every active effect can be saved',()=>{
  const X=engine(),signatures=new Set();
  for(const id of Object.keys(C.TECHNIQUES)){
    const s=fixture();s.techniques[id]=1;if(s.techniqueGrades)s.techniqueGrades[id]=0;s.activeTechnique=id;
    s.player.x=1100;s.player.y=1800;s.player.hp=X.stats(s).maxHp*.5;
    for(let i=0;i<3;i++)Object.assign(s.enemies[i],{x:1190+i*120,y:1800,homeX:1190+i*120,homeY:1800});
    const hp=s.player.hp,mp=s.player.mp,info=X.techniqueInfo(s);
    X.step(s,{skill:true,aimX:1500,aimY:1800},.05);
    assert.equal(s.player.mp,mp-info.manaCost);assert.equal(s.player.skillCd,info.cooldown);
    const projectiles=s.projectiles.filter(p=>p.owner==='player');
    if(id==='sword')assert.equal(projectiles.length,3);
    if(id==='flame'){assert.equal(projectiles.length,1);assert.ok(s.enemies[0].burn>0);}
    if(id==='frost'){assert.equal(projectiles.length,5);assert.ok(s.enemies[0].slow>0);assert.ok(projectiles.every(p=>p.pierce>0));}
    if(id==='wood'){assert.ok(s.player.hp>hp);assert.ok(s.enemies[0].rooted>0);assert.equal(projectiles.length,0);}
    if(id==='thunder'){assert.ok(s.effects.filter(e=>e.type==='thunder').length>=2);assert.equal(projectiles.length,0);}
    if(id==='earth'){assert.ok(s.player.shield>0&&s.player.shieldTime>0);assert.equal(projectiles.length,0);}
    signatures.add(JSON.stringify([projectiles.length,s.effects.map(e=>e.type).sort(),s.enemies[0].burn>0,s.enemies[0].slow>0,s.enemies[0].rooted>0,s.player.shield>0,s.player.hp>hp]));
    assert.ok(s.effects.some(e=>e.element===info.element));
    const restored=X.deserialize(X.serialize(s));
    assert.equal(restored.activeTechnique,id);assert.equal(restored.projectiles.length,s.projectiles.length);
    assert.equal(restored.player.shield,s.player.shield);
    assert.equal(restored.enemies[0].burn,s.enemies[0].burn);assert.equal(restored.enemies[0].slow,s.enemies[0].slow);assert.equal(restored.enemies[0].rooted,s.enemies[0].rooted);
  }
  assert.equal(signatures.size,6);
});

test('books, purchases, training and selecting schools enforce costs, caps and safety',()=>{
  const X=engine(),s=fixture();let before=ledger(s);X.action(s,'learn:flame');assert.equal(safeOk(s),false);assert.deepEqual(ledger(s),before);
  s.player.stones=1000;
  for(const id of Object.keys(C.TECHNIQUES).filter(id=>id!=='sword')){
    const book=C.ITEMS[id+'Book'],coins=s.player.stones;
    X.action(s,'buy:'+book.id);assert.equal(safeOk(s),true);assert.equal(s.player.stones,coins-book.price);assert.equal(s.inventory[book.id],1);
    X.action(s,'use:'+book.id);assert.equal(safeOk(s),true);assert.equal(s.techniques[id],1);assert.equal(s.inventory[book.id],0);
    before=ledger(s);X.action(s,'buy:'+book.id);assert.equal(safeOk(s),false);assert.deepEqual(ledger(s),before);
    X.action(s,'technique:'+id);assert.equal(s.activeTechnique,id);
  }
  for(const key of Object.keys(C.RESOURCES))s.player[key]=1000;
  const cost=X.techniqueInfo(s,'sword').trainCost,previous=X.stats(s),hpRatio=s.player.hp/previous.maxHp,mpRatio=s.player.mp/previous.maxMp;
  X.action(s,'train:sword');assert.equal(s.techniques.sword,2);for(const[key,value]of Object.entries(cost))assert.equal(s.player[key],1000-value);
  assert.ok(X.stats(s).attack>previous.attack);assert.ok(Math.abs(s.player.hp/X.stats(s).maxHp-hpRatio)<1e-8);assert.ok(Math.abs(s.player.mp/X.stats(s).maxMp-mpRatio)<1e-8);
  before=ledger(s);X.action(s,'train:sword');assert.equal(safeOk(s),false);assert.deepEqual(ledger(s),before);
  s.player.realm=1;s.quests.bosses=['wolfKing'];s.progress.bosses=['wolfKing'];s.quests.kills=1;s.enemies.find(e=>e.type==='wolfKing').hp=0;
  X.action(s,'train:sword');assert.equal(s.techniques.sword,3);
  before=ledger(s);X.action(s,'train:sword');assert.equal(safeOk(s),false);assert.deepEqual(ledger(s),before);
  s.player.x=1100;s.player.y=1800;before=ledger(s);
  for(const action of['train:flame','learn:missing','technique:sword','buy:spiritTea']){X.action(s,action);assert.equal(safeOk(s),false);assert.deepEqual(ledger(s),before);}
});

test('every recipe consumes exact materials, creates actual items and rejects unpaid repeats',()=>{
  const X=engine();
  for(const recipe of Object.values(C.RECIPES)){
    const s=fixture(3);for(const key of Object.keys(C.RESOURCES))s.player[key]=1000;
    const before=ledger(s);X.action(s,'craft:'+recipe.id);assert.equal(safeOk(s),true,recipe.id);
    for(const key of Object.keys(C.RESOURCES))assert.equal(s.player[key],before.resources[key]-(recipe.cost[key]||0));
    for(const[id,amount]of Object.entries(recipe.output))assert.equal(C.ITEMS[id].resourceField?s.player[id]-(before.resources[id]||0):(s.inventory[id]||0)-(before.inventory[id]||0),amount);
    if(Object.keys(recipe.output).some(id=>C.ITEMS[id].type==='equipment')){const paid=ledger(s);X.action(s,'craft:'+recipe.id);assert.equal(safeOk(s),false);assert.deepEqual(ledger(s),paid);}
    const poor=fixture(3),empty=ledger(poor);X.action(poor,'craft:'+recipe.id);assert.equal(safeOk(poor),false);assert.deepEqual(ledger(poor),empty);
  }
});

test('equipment changes real stats without creating health through repeated swaps',()=>{
  const X=engine(),s=fixture();
  s.player.hp=X.stats(s).maxHp*.4;s.player.mp=X.stats(s).maxMp*.3;
  for(const item of Object.values(C.ITEMS).filter(i=>i.type==='equipment'))s.inventory[item.id]=1;
  const initial=X.stats(s);X.action(s,'equip:ironSword');assert.equal(X.stats(s).attack,initial.attack+7);
  for(let i=0;i<20;i++)for(const id of['frostRobe','clothRobe','jadeCharm','heavenCharm','jadeSword','starterSword']){
    X.action(s,'equip:'+id);assert.equal(safeOk(s),true);
    assert.ok(Math.abs(s.player.hp/X.stats(s).maxHp-.4)<1e-8);assert.ok(Math.abs(s.player.mp/X.stats(s).maxMp-.3)<1e-8);
  }
  const info=X.inventoryInfo(s);assert.ok(info.some(i=>i.id===s.equipment.weapon&&i.equipped));assert.ok(info.some(i=>i.type==='resource'));
  const restored=X.deserialize(X.serialize(s));assert.deepEqual(restored.equipment,s.equipment);assert.deepEqual(restored.inventory,s.inventory);
});

test('consumables restore mana, refresh rather than stack buffs and expire through game time',()=>{
  const X=engine(),s=fixture();
  s.inventory.spiritTea=2;let before=ledger(s);X.action(s,'use:spiritTea');assert.equal(safeOk(s),false);assert.deepEqual(ledger(s),before);
  s.player.mp=0;X.action(s,'use:spiritTea');assert.equal(s.player.mp,X.stats(s).maxMp*.55);assert.equal(s.inventory.spiritTea,1);
  for(const[id,type]of[['rageElixir','rage'],['wardPowder','ward'],['insightPill','insight']]){
    s.inventory[id]=2;X.action(s,'use:'+id);assert.equal(safeOk(s),true);
    advance(s,1);X.action(s,'use:'+id);assert.equal(s.buffs.filter(b=>b.type===type).length,1);assert.equal(s.inventory[id],0);
  }
  assert.equal(X.stats(s).attack,18*1.25);
  const restored=X.deserialize(X.serialize(s));assert.deepEqual(restored.buffs,s.buffs);
  advance(s,61);assert.equal(s.buffs.length,0);assert.equal(X.stats(s).attack,18);
});

test('travel honors realm and physical portal gates and each map retains its own world',()=>{
  const X=engine(),locked=fixture();let before=ledger(locked);
  X.action(locked,'travel:red');assert.equal(safeOk(locked),false);assert.equal(locked.mapId,'main');assert.deepEqual(ledger(locked),before);
  locked.player.x=1100;locked.player.y=1800;X.action(locked,'travel:bambooTrial');assert.equal(safeOk(locked),false);
  const portal=C.MAPS.main.portals.find(p=>p.target==='bambooTrial');locked.player.x=portal.x;locked.player.y=portal.y;
  X.interact(locked);assert.equal(locked.interaction,'portal:bambooTrial');X.action(locked,'travel:bambooTrial');assert.equal(safeOk(locked),true);assert.equal(locked.mapId,'bambooTrial');assert.equal(locked.interaction,null);
  const exit=C.MAPS.bambooTrial.portals[0];locked.player.x=exit.x;locked.player.y=exit.y;X.interact(locked);assert.equal(locked.interaction,'portal:main');X.action(locked,'travel:main');assert.equal(locked.mapId,'main');
  const s=fixture(3),markers={};
  for(const id of Object.keys(C.MAPS)){
    hub(s);if(id!==s.mapId){X.action(s,'travel:'+id);assert.equal(safeOk(s),true);}
    assert.equal(X.zoneAt(2000,1000,s).id,id==='main'?'bamboo':id);
    const node=s.nodes.find(n=>n.type!=='herb'&&n.type!=='crystal')||s.nodes[0];
    s.player.x=node.x;s.player.y=node.y;X.interact(s);assert.equal(safeOk(s),true);assert.ok(node.ready>0);
    const enemy=s.enemies.find(e=>!e.boss);enemy.hp=enemy.maxHp*.75;
    s.drops.push({x:3000,y:2300,type:'stones',amount:7});markers[id]={node:node.id,ready:node.ready,enemy:enemy.id,hp:enemy.hp};
    hub(s);
    const g=graph(C.MAPS[id],s.player),boss=s.enemies.find(e=>e.boss)||s.enemies[0],route=[];
    let step=g.nearest(boss);while(step!==null){route.unshift(g.coord(step));step=g.previous.get(step);}
    for(const point of route){let attempts=0;while(Math.hypot(point.x-s.player.x,point.y-s.player.y)>13){
      assert.ok(attempts++<30,'Engine movement must follow every map path');for(const e of s.enemies)e.stun=20;s.player.invuln=20;
      const d=Math.hypot(point.x-s.player.x,point.y-s.player.y);X.step(s,{mx:(point.x-s.player.x)/d,my:(point.y-s.player.y)/d},.05);
      assert.equal(mapBlocked(C.MAPS[id],s.player.x,s.player.y),false);
    }}
    markers[id].ready=node.ready;hub(s);
  }
  const restored=X.deserialize(X.serialize(s));assert.deepEqual(restored.progress.visited,Object.keys(C.MAPS));
  for(const[id,marker]of Object.entries(markers)){
    const world=restored.worlds[id];assert.equal(world.nodes.find(n=>n.id===marker.node).ready,marker.ready);assert.equal(world.enemies.find(e=>e.id===marker.enemy).hp,marker.hp);
    assert.ok(world.drops.some(d=>d.amount===7&&d.x===3000&&d.y===2300));
  }
  hub(restored);X.action(restored,'travel:red');assert.equal(restored.enemies,restored.worlds.red.enemies);assert.equal(restored.nodes,restored.worlds.red.nodes);
  restored.player.hp=0;restored.dead=true;X.action(restored,'revive');assert.equal(restored.mapId,'main');assert.equal(restored.dead,false);assert.equal(X.isSafe(restored),true);assert.equal(restored.progress.visited.length,6);
});

test('three-wave trials advance only after combat, grant unique first rewards and cap repeat gifts',()=>{
  const X=engine();
  for(const id of Object.keys(C.TRIAL_REWARDS)){
    const s=fixture(3),unique=Object.keys(C.TRIAL_REWARDS[id].first).filter(k=>!C.ITEMS[k].resourceField);
    const loot=C.MAPS[id].spawns.reduce((total,p)=>total+X.ENEMY[p[0]].stones,0);
    for(let clear=1;clear<=6;clear++){
      hub(s);X.action(s,'travel:'+id);assert.equal(safeOk(s),true);assert.equal(s.trials[id].wave,1);
      const before=s.player.stones+s.drops.filter(d=>d.type==='stones').reduce((n,d)=>n+d.amount,0);
      for(let wave=1;wave<=3;wave++){
        assert.equal(s.trials[id].wave,wave);assert.ok(s.enemies.filter(e=>e.wave>wave&&e.hp>0).every(e=>e.gated));
        for(const e of s.enemies.filter(e=>e.wave===wave&&e.hp>0))battle(s,e);
      }
      assert.equal(s.trials[id].cleared,true);assert.equal(s.trials[id].clears,clear);assert.equal(s.trials[id].rewarded,true);
      for(const item of unique)assert.equal(s.inventory[item],C.TRIAL_REWARDS[id].first[item],'First reward must not be duplicated');
      if(clear>=5){
        const after=s.player.stones+s.drops.filter(d=>d.type==='stones').reduce((n,d)=>n+d.amount,0);
        assert.equal(after-before,loot+(clear<=5?(C.TRIAL_REWARDS[id].repeat.stones||0):0),'Repeat gift ends after fifth clear; normal combat loot remains');
      }
      hub(s);assert.doesNotThrow(()=>X.deserialize(X.serialize(s)));X.action(s,'travel:main');assert.equal(s.mapId,'main');
    }
  }
});

test('story choices have different consequences and journal and quest claims survive saves once',()=>{
  const X=engine(),a=fixture(),b=fixture();
  assert.equal(X.storyInfo(a).ready,true);assert.equal(X.storyInfo(a).options.length,2);
  X.action(a,'story:seek');X.action(b,'story:protect');
  assert.equal(a.inventory.woodBook,1);assert.equal(a.player.stones,35);assert.equal(a.story.relations.wisdom,1);
  assert.equal(b.player.herbs,4);assert.equal(b.player.potions,5);assert.equal(b.story.relations.mercy,1);
  assert.equal(a.story.chapter,1);assert.equal(a.story.journal.length,1);assert.ok(a.story.journal[0].text.includes('探寻古法'));
  const before=ledger(a);X.action(a,'story:seek');assert.equal(safeOk(a),false);assert.deepEqual(ledger(a),before);assert.equal(a.story.journal.length,1);
  const old=X.deserialize(LEGACY);X.action(old,'story:protect');X.action(old,'story:restore');
  assert.equal(old.story.chapter,2);assert.equal(old.inventory.barkRobe,1);assert.equal(X.storyInfo(old).ready,false);assert.ok(X.storyInfo(old).requirements.length>0);
  const miner=fixture();
  for(const node of miner.nodes.filter(n=>n.type==='iron')){miner.player.x=node.x;miner.player.y=node.y;X.interact(miner);}
  hub(miner);advance(miner,121);
  const regrown=miner.nodes.find(n=>n.type==='iron');miner.player.x=regrown.x;miner.player.y=regrown.y;X.interact(miner);
  hub(miner);const quest=X.questsInfo(miner).find(q=>q.id==='miner');assert.equal(quest.ready,true);
  const stones=miner.player.stones;X.action(miner,'claim:miner');assert.equal(miner.player.stones,stones+40);assert.equal(miner.inventory.earthBook,1);
  const claimed=ledger(miner);X.action(miner,'claim:miner');assert.equal(safeOk(miner),false);assert.deepEqual(ledger(miner),claimed);
  const saved=X.deserialize(X.serialize(miner));assert.equal(X.questsInfo(saved).find(q=>q.id==='miner').completed,true);
  const restored=X.deserialize(X.serialize(old));assert.deepEqual(restored.story,old.story);
});

test('genuine v1 migration preserves advancement and resources and creates a balanced durable legacy root',()=>{
  const X=engine(),old=JSON.parse(LEGACY),a=X.deserialize(LEGACY),b=X.deserialize(LEGACY);
  assert.ok(a.version>=2);assert.equal(a.mapId,'main');assert.deepEqual(a.root,b.root);assert.equal(a.root.legacy,true);
  assert.equal(X.techniqueInfo(a).affinity,0);assert.equal(X.techniqueInfo(a).manaCost,28);
  for(const key of['realm','weapon','hp','mp','xp','stones','herbs','potions','x','y'])assert.equal(a.player[key],old.player[key],key);
  assert.deepEqual(a.quests,old.quests);assert.deepEqual(a.questRewards,old.questRewards);
  assert.equal(a.enemies.find(e=>e.type==='wolfKing').hp,0);assert.equal(a.nodes.length,C.MAPS.main.nodes.length);
  assert.equal(X.stats(a).maxHp,190);assert.equal(X.stats(a).maxMp,125);
  const again=X.deserialize(X.serialize(a));assert.deepEqual(again.root,a.root);assert.deepEqual(again.player,a.player);
});

test('high-tier elemental projectiles preserve damage and all status fields beyond v1 limits',()=>{
  const X=engine(),s=fixture(3);s.root={grade:'immortal',elements:['fire'],legacy:false};s.player.weapon=6;s.techniques.flame=3;if(s.techniqueGrades)s.techniqueGrades.flame=0;s.activeTechnique='flame';
  for(const id of['flameSword','frostRobe','heavenCharm']){s.inventory[id]=1;X.action(s,'equip:'+id);}
  s.buffs=[{type:'rage',life:40}];s.player.hp=X.stats(s).maxHp;s.player.mp=X.stats(s).maxMp;s.player.x=1100;s.player.y=1900;
  X.step(s,{skill:true,aimX:2100,aimY:1900},.05);
  const bolt=s.projectiles.find(p=>p.owner==='player');assert.ok(bolt&&bolt.damage>250);assert.equal(bolt.status,'burn');assert.ok(bolt.explosion>0);
  const restored=X.deserialize(X.serialize(s));assert.deepEqual(restored.projectiles,s.projectiles);
  assert.equal(restored.activeTechnique,'flame');assert.deepEqual(restored.buffs,s.buffs);
});

test('malformed expanded progression, inventory, elemental effects and map states are rejected',()=>{
  const X=engine();
  const edits=[
    d=>{d.mapId='missing';},d=>{d.progress.visited.push('red');},d=>{d.progress.bosses.push('frostWyrm');},d=>{d.root.grade='missing';},d=>{d.root.elements=['fire','fire'];},d=>{d.root.legacy=true;},
    d=>{d.activeTechnique='flame';},d=>{d.techniques.sword=4;},d=>{d.techniques.unknown=1;},d=>{d.inventory.stones=1;},d=>{d.inventory.starterSword=-1;},d=>{d.equipment.weapon='flameSword';},
    d=>{d.buffs=[{type:'rage',life:41}];},d=>{d.buffs=[{type:'rage',life:1},{type:'rage',life:1}];},d=>{d.player.ember=-1;},d=>{d.trials.bambooTrial.rewarded=true;},d=>{d.trials.bambooTrial.wave=4;},
    d=>{d.story.chapter=1;},d=>{d.story.journal=[{chapter:'missing',time:0}];},d=>{d.progress.claims=['explorer'];},d=>{delete d.worlds.main;},d=>{d.worlds.main.enemies[0].wave=3;},
    d=>{d.projectiles=[{x:1100,y:1800,vx:100,vy:0,life:1,radius:7,damage:3,owner:'player',sourceId:'player',element:'unknown'}];},
    d=>{d.projectiles=[{x:1100,y:1800,vx:100,vy:0,life:1,radius:7,damage:3,owner:'player',sourceId:'player',element:'fire',color:'javascript:bad'}];}
  ];
  for(let i=0;i<edits.length;i++){const data=JSON.parse(X.serialize(X.createGame(987)));edits[i](data);assert.throws(()=>X.deserialize(JSON.stringify(data)),/存档无效/,'Invalid v2 edit '+i);}
});
