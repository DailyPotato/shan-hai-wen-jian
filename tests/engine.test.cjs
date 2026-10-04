'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const X = require('../engine.js');
const tick = (s, input = {}, seconds = 1) => {
  for (let i = 0; i < Math.ceil(seconds / 0.05); i++) X.step(s, input, 0.05);
  return s;
};
const quiet = () => {
  const s = X.createGame(321);
  // Fix root balance only for isolated legacy combat regressions; full-run tests use real seeded roots.
  if(s.root){s.root={grade:'mortal',elements:['water'],legacy:false};s.player.hp=X.stats(s).maxHp;s.player.mp=X.stats(s).maxMp;}
  s.enemies.forEach(e => {e.stun = 20;});
  return s;
};
const blocked = (x, y, radius = 18) => x < radius + 25 || y < radius + 25 || x > X.WIDTH - radius - 25 || y > X.HEIGHT - radius - 25 ||
  X.PONDS.some(p => ((x - p.x) / (p.rx + radius)) ** 2 + ((y - p.y) / (p.ry + radius)) ** 2 < 1) ||
  X.OBSTACLES.some(o => Math.hypot(x - o.x, y - o.y) < o.radius + radius);
const resources = p => ({xp:p.xp, stones:p.stones, herbs:p.herbs, potions:p.potions, weapon:p.weapon, realm:p.realm});

test('new games are deterministic, complete and loadable', () => {
  const a = X.createGame(791), b = X.createGame(791);
  assert.equal(X.serialize(a), X.serialize(b));
  assert.equal(a.enemies.filter(e => e.boss).length, 3);
  assert.equal(a.nodes.length, X.CONTENT ? X.CONTENT.MAPS.main.nodes.length : 42);
  assert.equal(a.player.hp, X.stats(a).maxHp);
  assert.equal(a.player.mp, X.stats(a).maxMp);
  const restored=X.deserialize(X.serialize(a));
  assert.deepEqual(restored.player,a.player);assert.deepEqual(restored.quests,a.quests);assert.deepEqual(restored.nodes,a.nodes);
  assert.equal(X.serialize(X.deserialize(X.serialize(restored))), X.serialize(restored));
  assert.equal(typeof X.objective(a), 'string');
  assert.ok(a.enemies.every(e => !blocked(e.x, e.y, e.radius)));
});

test('movement normalizes diagonal input, clamps time and rejects nonfinite input', () => {
  const a = quiet(), b = quiet();
  X.step(a, {mx:1}, 99);
  X.step(b, {mx:1, my:1}, 99);
  assert.equal(a.time, 0.05);
  const start = X.createGame().player;
  assert.ok(Math.abs(Math.hypot(a.player.x-start.x,a.player.y-start.y) - Math.hypot(b.player.x-start.x,b.player.y-start.y)) < 1e-8);
  const before = [a.player.x,a.player.y,a.time];
  X.step(a, {mx:NaN, my:Infinity, aimX:NaN}, Infinity);
  assert.deepEqual([a.player.x,a.player.y,a.time], before);
  X.step(a, {mx:NaN, my:Infinity}, 0.05);
  assert.deepEqual([a.player.x,a.player.y], before.slice(0,2));
});

test('walking and dashing respect ponds, rocks and world edges', () => {
  for (const [x,y,mx,my] of [[1070,700,1,0],[960,1130,1,0],[45,1500,-1,0],[3155,1500,1,0]]) {
    const s = quiet(); Object.assign(s.player,{x,y});
    for (let i=0; i<80; i++) {
      X.step(s,{mx,my,dash:i===0},0.05);
      assert.equal(blocked(s.player.x,s.player.y),false,`${x}, ${y}, frame ${i}`);
    }
  }
});

test('all resources and bosses are connected to the starting area by walkable ground', () => {
  const size=40, cols=Math.floor((X.WIDTH-86)/size)+1, rows=Math.floor((X.HEIGHT-86)/size)+1;
  const coord = n => ({x:43+(n%cols)*size,y:43+Math.floor(n/cols)*size});
  const nearest = p => Math.round((p.y-43)/size)*cols+Math.round((p.x-43)/size);
  const s = X.createGame(), start=nearest(s.player), previous=new Map([[start,null]]), queue=[start];
  for(let cursor=0;cursor<queue.length;cursor++){
    const id=queue[cursor],p=coord(id),cx=id%cols,cy=Math.floor(id/cols);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const nx=cx+dx,ny=cy+dy,n=ny*cols+nx;
      if(nx<0||ny<0||nx>=cols||ny>=rows||previous.has(n))continue;
      const q=coord(n);
      if(blocked(q.x,q.y)||blocked((p.x+q.x)/2,(p.y+q.y)/2))continue;
      previous.set(n,id);queue.push(n);
    }
  }
  const targets=[...s.nodes,...X.NPCS,...s.enemies.filter(e=>e.boss)];
  for(const target of targets)assert.ok(previous.has(nearest(target)),`Unreachable ${target.id||target.type}`);
  for(const target of s.enemies.filter(e=>e.boss)){
    const route=[];let id=nearest(target);while(id!==null){route.unshift(coord(id));id=previous.get(id);}
    const run=quiet();
    for(const point of route){
      let attempts=0;
      while(Math.hypot(point.x-run.player.x,point.y-run.player.y)>13){
        assert.ok(attempts++<20,'Movement failed to follow a reachable path');
        const d=Math.hypot(point.x-run.player.x,point.y-run.player.y);
        X.step(run,{mx:(point.x-run.player.x)/d,my:(point.y-run.player.y)/d},0.05);
        assert.equal(blocked(run.player.x,run.player.y),false);
      }
    }
    assert.ok(Math.hypot(run.player.x-target.x,run.player.y-target.y)<60);
  }
});

test('sword has a directional arc and cooldown; kills grant real rewards once', () => {
  const s=quiet();Object.assign(s.player,{x:1100,y:1700});
  const front=s.enemies[0],back=s.enemies[1];
  Object.assign(front,{x:1170,y:1700,homeX:1170,homeY:1700});
  Object.assign(back,{x:1030,y:1700,homeX:1030,homeY:1700});
  X.step(s,{attack:true,aimX:1400,aimY:1700},0.05);
  assert.equal(front.hp,front.maxHp-X.stats(s).attack);
  assert.equal(back.hp,back.maxHp);
  const hp=front.hp;X.step(s,{attack:true,aimX:1400,aimY:1700},0.05);
  assert.equal(front.hp,hp);
  tick(s,{attack:true,aimX:1400,aimY:1700},1.2);
  assert.equal(front.hp,0);
  assert.equal(s.quests.kills,1);
  assert.equal(s.player.xp,18);
  assert.ok(s.player.stones>20||s.drops.some(d=>d.type==='stones'));
  tick(s,{attack:true,aimX:1400,aimY:1700},1);
  assert.equal(s.quests.kills,1);
  assert.equal(s.player.xp,18);
});

test('skill consumes mana once per cooldown and cannot damage locked bosses', () => {
  const s=quiet(),boss=s.enemies.find(e=>e.type==='ancientTree');
  Object.assign(s.player,{x:boss.x-80,y:boss.y});
  const hp=boss.hp;
  X.step(s,{skill:true},0.05);
  assert.equal(boss.hp,hp);
  assert.equal(s.player.mp,62);
  X.step(s,{skill:true},0.05);
  assert.equal(s.player.mp,62.125);
  s.player.skillCd=0;s.player.mp=0;
  X.step(s,{skill:true},0.05);
  assert.equal(s.player.skillCd,0);
  assert.equal(s.lastAction.ok,false);
});

test('spectral swords travel beyond melee range, retain collision after save and stop at rocks', () => {
  const s=quiet(),target=s.enemies[0];
  Object.assign(s.player,{x:1100,y:1900,facing:0});
  Object.assign(target,{x:1450,y:1900,homeX:1450,homeY:1900});
  X.step(s,{skill:true,aimX:1450,aimY:1900},0.05);
  assert.equal(target.hp,target.maxHp,'Ranged target should not take instant area damage');
  assert.equal(s.projectiles.filter(p=>p.owner==='player').length,3);
  const restored=X.deserialize(X.serialize(s));
  tick(s,{},0.7);tick(restored,{},0.7);
  assert.ok(target.hp<target.maxHp);
  assert.ok(Math.abs(target.hp-(target.maxHp-X.stats(s).attack*X.techniqueInfo(s).multiplier*1.8))<1e-8);
  assert.equal(restored.enemies[0].hp,target.hp);
  assert.equal(s.player.hp,120,'Friendly swords cannot hurt their caster');
  const wall=quiet(),behind=wall.enemies[0];
  Object.assign(wall.player,{x:900,y:1130,facing:0});
  Object.assign(behind,{x:1300,y:1130,homeX:1300,homeY:1130});
  X.step(wall,{skill:true,aimX:1300,aimY:1130},0.05);tick(wall,{},1);
  assert.equal(behind.hp,behind.maxHp,'Rock should stop swords');
});

test('enemy attacks telegraph damage and dash protects during invulnerability', () => {
  const s=quiet(),e=s.enemies[0];
  Object.assign(s.player,{x:985,y:1725});
  Object.assign(e,{x:985,y:1680,homeX:985,homeY:1680,stun:0,cooldown:0});
  X.step(s,{},0.05);
  assert.equal(e.mode,'windup');assert.equal(s.player.hp,120);
  assert.ok(s.effects.some(f=>f.type==='warning'));
  tick(s,{},0.65);
  assert.ok(s.player.hp<120);
  const d=quiet(),enemy=d.enemies[0];
  Object.assign(d.player,{x:985,y:1725});
  Object.assign(enemy,{x:985,y:1680,homeX:985,homeY:1680,stun:0,cooldown:0,mode:'windup',attackTimer:0.03,attackX:985,attackY:1725});
  X.step(d,{dash:true,mx:1},0.05);
  assert.equal(d.player.hp,120);assert.ok(d.player.invuln>0);
});

test('safe area blocks hostile damage and prevents enemy entry', () => {
  const s=X.createGame(),e=s.enemies[0];
  const fullHp=X.stats(s).maxHp;
  Object.assign(s.player,{x:820,y:1800});
  Object.assign(e,{x:870,y:1800,homeX:870,homeY:1800,mode:'windup',attackTimer:0.01,attackX:820,attackY:1800});
  s.projectiles.push({x:835,y:1800,vx:-200,vy:0,life:2,radius:9,owner:'enemy',sourceId:e.id,damage:99});
  tick(s,{},1);
  assert.equal(s.player.hp,fullHp);
  assert.ok(Math.hypot(e.x-X.HUB.x,e.y-X.HUB.y)>=X.HUB.radius+e.radius);
  assert.equal(s.projectiles.length,0);
});

test('gathering has regrowth cooldown and quest bonuses cannot be farmed by repetition', () => {
  const s=quiet(),herbs=s.nodes.filter(n=>n.type==='herb');
  for(const node of herbs.slice(0,3)){Object.assign(s.player,{x:node.x,y:node.y});X.interact(s);}
  assert.equal(s.quests.herbs,6);assert.equal(s.player.herbs,6);
  assert.equal(s.player.xp,108);assert.equal(s.player.stones,45);
  assert.deepEqual(s.questRewards,['herbalist']);
  const before=resources(s.player);X.interact(s);assert.deepEqual(resources(s.player),before);
  Object.assign(s.player,{x:550,y:1780});tick(s,{},76);
  Object.assign(s.player,{x:herbs[0].x,y:herbs[0].y});X.interact(s);
  assert.equal(s.player.xp,114);assert.equal(s.player.herbs,8);assert.equal(s.player.stones,45);
});

test('crafting, healing and forging have exact costs and failed actions charge nothing', () => {
  const s=quiet(),p=s.player;
  let before=resources(p);X.action(s,'craft');assert.equal(s.lastAction.ok,false);assert.deepEqual(resources(p),before);
  Object.assign(p,{herbs:3,stones:100});X.action(s,'craft');
  assert.equal(p.herbs,1);assert.equal(p.stones,92);assert.equal(p.potions,5);
  before=resources(p);X.action(s,'heal');assert.equal(s.lastAction.ok,false);assert.deepEqual(resources(p),before);
  p.hp=20;p.mp=10;X.action(s,'heal');assert.equal(p.hp,70.4);assert.equal(p.mp,32.5);assert.equal(p.potions,4);
  X.action(s,'upgrade');assert.equal(p.weapon,1);assert.equal(p.stones,52);assert.equal(p.herbs,0);assert.equal(X.stats(s).attack,22);
  before=resources(p);X.action(s,'upgrade');assert.equal(s.lastAction.ok,false);assert.deepEqual(resources(p),before);
  Object.assign(p,{x:1100,y:1700,herbs:99,stones:999});before=resources(p);
  for(const id of ['upgrade','craft','meditate','breakthrough']){X.action(s,id);assert.equal(s.lastAction.ok,false);assert.deepEqual(resources(p),before);}
});

test('meditation restores health but rewards cultivation only after elapsed gameplay time', () => {
  const s=quiet();s.player.hp=1;s.player.mp=0;X.action(s,'meditate');
  assert.equal(s.player.hp,120);assert.equal(s.player.mp,90);assert.equal(s.player.xp,12);
  for(let i=0;i<100;i++)X.action(s,'meditate');
  assert.equal(s.player.xp,12);assert.equal(s.meditationCd,60);
  tick(s,{},59);X.action(s,'meditate');assert.equal(s.player.xp,12);
  tick(s,{},1.1);X.action(s,'meditate');assert.equal(s.player.xp,24);
});

test('boss combat unlocks a reachable realm sequence and the final victory', () => {
  const s=quiet(),p=s.player;
  p.xp=999;let before=resources(p);X.action(s,'breakthrough');assert.equal(s.lastAction.ok,false);assert.deepEqual(resources(p),before);
  for(const type of ['wolfKing','ancientTree','guardian']){
    const boss=s.enemies.find(e=>e.type===type);
    Object.assign(p,{x:boss.x-70,y:boss.y,invuln:20});boss.stun=20;
    for(let i=0;i<2000&&boss.hp>0;i++){
      // This fixture isolates outgoing damage and milestone transitions; enemy damage is tested separately.
      boss.stun=20;p.invuln=20;
      X.step(s,{attack:true,skill:true,aimX:boss.x,aimY:boss.y},0.05);
    }
    assert.equal(boss.hp,0,type);assert.ok(s.quests.bosses.includes(type));
    assert.ok(p.xp>=X.ENEMY[type].xp);
    assert.equal(s.won,type==='guardian');
    Object.assign(p,{x:550,y:1780});
    const required=X.stats(s).xpNeeded;p.xp=required-1;before=resources(p);
    X.action(s,'breakthrough');assert.equal(s.lastAction.ok,false);assert.deepEqual(resources(p),before);
    p.xp=required;X.action(s,'breakthrough');assert.equal(s.lastAction.ok,true);assert.equal(p.xp,0);
    assert.equal(p.hp,X.stats(s).maxHp);assert.equal(p.mp,X.stats(s).maxMp);
  }
  assert.equal(p.realm,3);assert.equal(s.won,true);
  assert.equal(X.deserialize(X.serialize(s)).won,true);
});

test('death and revival retain milestones and equipment with bounded penalties', () => {
  const s=quiet(),p=s.player;p.hp=0;s.dead=true;p.stones=100;p.xp=100;p.weapon=2;
  const before=resources(p);X.action(s,'craft');assert.deepEqual(resources(p),before);
  X.action(s,'revive');assert.equal(s.dead,false);assert.equal(p.hp,120);assert.equal(p.mp,90);
  assert.equal(p.stones,88);assert.equal(p.xp,92);assert.equal(p.weapon,2);
  assert.deepEqual([p.x,p.y],[550,1780]);
  const revived=resources(p);X.action(s,'revive');assert.equal(s.lastAction.ok,false);assert.deepEqual(resources(p),revived);
});

test('save restores ongoing combat and discards unknown object properties', () => {
  const s=X.createGame(923),e=s.enemies[0];Object.assign(s.player,{x:985,y:1725});
  const initialHp=s.player.hp;
  Object.assign(e,{x:985,y:1680,homeX:985,homeY:1680,cooldown:0});X.step(s,{},0.05);
  const data=JSON.parse(X.serialize(s));data.player.arbitrary='ignored';data.arbitrary='ignored';
  const loaded=X.deserialize(JSON.stringify(data));
  assert.equal(loaded.time,s.time);assert.equal(loaded.enemies[0].mode,'windup');
  assert.ok(loaded.effects.some(f=>f.type==='warning'));
  assert.equal(loaded.arbitrary,undefined);assert.equal(loaded.player.arbitrary,undefined);
  tick(loaded,{},0.7);assert.ok(loaded.player.hp<initialHp);
});

test('malformed and contradictory saves are rejected before gameplay', () => {
  const edits=[d=>{d.version=99;},d=>{d.player.x=1350;d.player.y=700;},d=>{d.player.hp=-1;},d=>{d.player.hp=null;},d=>{d.player.hp=9999;},d=>{d.player.realm=1;},d=>{d.player.weapon=6;},d=>{d.player.stones=1.5;},d=>{d.dead=true;},d=>{d.won=true;},d=>{d.quests.bosses=['wolfKing','wolfKing'];},d=>{d.quests.bosses=['ancientTree'];},d=>{d.worlds.main.enemies[0].id='unknown';},d=>{d.worlds.main.enemies[25].hp=0;},d=>{d.worlds.main.nodes.pop();},d=>{d.projectiles=[{x:1,y:1,vx:0,vy:0,life:1,radius:9,owner:'enemy',sourceId:'missing',damage:1}];},d=>{d.worlds.main.drops=[{x:500,y:1800,type:'xp',amount:99}];},d=>{d.questRewards=['unknown'];},d=>{d.questRewards=['firstHunt'];},d=>{d.meditationCd=61;},d=>{d.logs=['x'.repeat(201)];}];
  for(let i=0;i<edits.length;i++){const data=JSON.parse(X.serialize(X.createGame()));edits[i](data);assert.throws(()=>X.deserialize(JSON.stringify(data)),/存档无效/,'Invalid edit '+i);}
  for(const input of ['','{','null','[]','x'.repeat(500001),null])assert.throws(()=>X.deserialize(input),/存档无效/);
});

test('a complete expanded run is reachable through normal movement, combat and earned resources', t => {
  // This integration player never edits HP, coordinates, XP, currency, equipment or enemy state.
  const s=X.createGame(987),p=s.player;
  const collision=(x,y)=>{
    const m=X.mapInfo(s);
    return x<43||y<43||x>m.width-43||y>m.height-43||m.ponds.some(q=>((x-q.x)/(q.rx+18))**2+((y-q.y)/(q.ry+18))**2<1)||m.obstacles.some(q=>Math.hypot(x-q.x,y-q.y)<q.radius+18);
  };
  let frames=0,deaths=0;
  const size=35,cols=Math.floor((X.WIDTH-86)/size)+1,rows=Math.floor((X.HEIGHT-86)/size)+1;
  const coord=n=>({x:43+n%cols*size,y:43+Math.floor(n/cols)*size});
  function nearest(pt){
    let best=-1,bd=Infinity;
    for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){
      const x=Math.round((pt.x-43)/size)+xx,y=Math.round((pt.y-43)/size)+yy,id=y*cols+x;
      if(x<0||y<0||x>=cols||y>=rows)continue;
      const c=coord(id),d=Math.hypot(c.x-pt.x,c.y-pt.y);
      if(!collision(c.x,c.y)&&d<bd){best=id;bd=d;}
    }
    assert.ok(best>=0,'Path endpoint has walkable ground');return best;
  }
  function route(target){
    const start=nearest(p),end=nearest(target),q=[start],prev=new Map([[start,null]]);
    for(let i=0;i<q.length&&!prev.has(end);i++){
      const id=q[i],a=coord(id),cx=id%cols,cy=Math.floor(id/cols);
      for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        const x=cx+dx,y=cy+dy,n=y*cols+x;
        if(x<0||y<0||x>=cols||y>=rows||prev.has(n))continue;
        const b=coord(n);if(collision(b.x,b.y)||collision((a.x+b.x)/2,(a.y+b.y)/2))continue;
        prev.set(n,id);q.push(n);
      }
    }
    assert.ok(prev.has(end),'Destination is reachable');let id=end,r=[];
    while(id!==null){r.unshift(coord(id));id=prev.get(id);}return r;
  }
  function frame(input={}){
    assert.ok(++frames<150000,'Natural run should finish within its frame budget');
    if(p.hp<X.stats(s).maxHp*.55&&p.potions>0)X.action(s,'heal');
    if(s.inventory.spiritTea>0&&p.mp<X.stats(s).maxMp*.25)X.action(s,'use:spiritTea');
    X.step(s,input,.05);
    if(s.dead){deaths++;X.action(s,'revive');return false;}return true;
  }
  function travel(target){
    for(let tries=0;tries<12;tries++){
      let died=false;
      for(const point of route(target)){
        let attempts=0;
        while(Math.hypot(point.x-p.x,point.y-p.y)>13){
          // An enemy knockback can displace the player; advancing the route recovers it.
          if(attempts++>40)break;
          const d=Math.hypot(point.x-p.x,point.y-p.y);
          const near=s.enemies.filter(e=>e.hp>0&&!e.gated).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
          if(!frame({mx:(point.x-p.x)/d,my:(point.y-p.y)/d,aimX:near?.x,aimY:near?.y,attack:true,skill:near&&Math.hypot(near.x-p.x,near.y-p.y)<200})){died=true;break;}
        }
        if(died)break;
      }
      if(!died)return;
    }
    assert.fail('Could not reach destination after reviving');
  }
  function hub(){
    travel({x:550,y:1780});X.action(s,'meditate');
    while(p.herbs>=2&&p.stones>=8&&p.potions<8)X.action(s,'craft');
    while(p.weapon<Math.min(6,2+p.realm*2)){X.action(s,'upgrade');if(!s.lastAction.ok)break;}
  }
  function gather(node){travel(node);assert.ok(Math.hypot(p.x-node.x,p.y-node.y)<90);X.interact(s);}
  function fight(e){
    for(let attempt=0;attempt<10&&e.hp>0;attempt++){
      travel(e);
      for(let i=0;i<3000&&e.hp>0;i++){
        const d=Math.hypot(e.x-p.x,e.y-p.y);
        const warning=s.effects.find(f=>f.type==='warning'&&f.sourceId===e.id&&f.life<.25);
        const avoid=warning&&Math.hypot(warning.x-p.x,warning.y-p.y)<warning.radius+25;
        let mx=0,my=0;
        if(avoid){mx=(p.x-warning.x)||-1;my=(p.y-warning.y)||1;const l=Math.hypot(mx,my);mx/=l;my/=l;}
        else if(d>85){mx=(e.x-p.x)/d;my=(e.y-p.y)/d;}
        if(!frame({mx,my,attack:true,aimX:e.x,aimY:e.y,skill:true,dash:!!avoid}))break;
        if(p.hp<25&&p.potions<1){hub();break;}
      }
    }
    assert.equal(e.hp,0,`Unable to defeat ${e.type}`);
    assert.doesNotThrow(()=>X.deserialize(X.serialize(s)));
  }
  function advance(){
    hub();
    while(p.xp<X.stats(s).xpNeeded){
      const alive=s.enemies.find(e=>e.type==='wolf'&&e.hp>0);
      if(alive)fight(alive);else for(let i=0;i<1500;i++)frame();
      hub();
    }
    X.action(s,'breakthrough');assert.equal(s.lastAction.ok,true);
  }
  for(const node of s.nodes.slice(0,12))gather(node);
  hub();assert.equal(p.weapon,2);
  for(const e of s.enemies.filter(e=>e.type==='wolf').slice(0,6))fight(e);
  hub();fight(s.enemies.find(e=>e.type==='wolfKing'));advance();assert.equal(p.realm,1);
  for(const node of s.nodes.slice(12,30).filter(n=>n.ready===0))gather(node);
  hub();for(const e of s.enemies.filter(e=>e.type==='spirit'))fight(e);
  fight(s.enemies.find(e=>e.type==='ancientTree'));hub();
  for(const e of s.enemies.filter(e=>e.type==='golem').slice(0,6))fight(e);
  advance();assert.equal(p.realm,2);
  for(const node of s.nodes.filter(n=>n.ready===0).slice(0,8))gather(node);
  hub();fight(s.enemies.find(e=>e.type==='guardian'));
  assert.equal(s.won,true);assert.deepEqual(s.quests.bosses,['wolfKing','ancientTree','guardian']);
  function checked(id){X.action(s,id);assert.equal(s.lastAction.ok,true,id+': '+s.lastAction.message);}
  function enter(id){hub();checked('travel:'+id);assert.equal(s.mapId,id);}
  function learnAvailable(){for(const id of Object.keys(X.CONTENT.TECHNIQUES))if(!s.techniques[id]&&s.inventory[id+'Book']>0)checked('learn:'+id);}
  function claimReady(){for(const q of X.questsInfo(s))if(q.ready)checked('claim:'+q.id);learnAvailable();}
  function chapter(choice){hub();assert.equal(X.storyInfo(s).ready,true,JSON.stringify(X.storyInfo(s).requirements));checked('story:'+choice);learnAvailable();}
  function equipIfOwned(id){if(s.inventory[id]>0&&s.equipment[X.CONTENT.ITEMS[id].slot]!==id)checked('equip:'+id);}
  function trial(id){
    enter(id);for(const node of s.nodes.filter(n=>n.ready===0))gather(node);
    let waves=0;
    while(!s.trials[id].cleared){
      assert.ok(waves++<9,'Trial should advance through three waves');
      const foes=s.enemies.filter(e=>e.hp>0&&!e.gated);
      assert.ok(foes.length>0,'Current trial wave must have active enemies');
      for(const e of foes)fight(e);
    }
    assert.equal(s.trials[id].wave,3);assert.equal(s.trials[id].clears,1);assert.equal(s.trials[id].rewarded,true);
    hub();claimReady();checked('travel:main');hub();
  }
  // Continue the same organically earned character through every new system and map.
  chapter('seek');checked('technique:wood');chapter('studyFire');
  for(const node of s.nodes.filter(n=>!['herb','crystal'].includes(n.type)&&n.ready===0))gather(node);
  hub();claimReady();trial('bambooTrial');equipIfOwned('jadeSword');chapter('lightning');checked('technique:thunder');
  enter('red');for(const node of s.nodes.filter(n=>n.ready===0))gather(node);
  hub();for(const e of s.enemies.filter(e=>!e.boss&&e.hp>0))fight(e);
  fight(s.enemies.find(e=>e.type==='flameLord'));hub();claimReady();checked('travel:main');chapter('forgeFire');equipIfOwned('flameSword');checked('technique:flame');
  if(Object.entries(X.CONTENT.RECIPES.cloudRobe.cost).every(([id,n])=>p[id]>=n)){checked('craft:cloudRobe');equipIfOwned('cloudRobe');}
  checked('buy:spiritTea');checked('buy:wardPowder');checked('use:wardPowder');
  trial('fireTrial');equipIfOwned('thunderCharm');
  enter('snow');for(const node of s.nodes.filter(n=>n.ready===0))gather(node);
  hub();for(const e of s.enemies.filter(e=>!e.boss&&e.hp>0))fight(e);
  fight(s.enemies.find(e=>e.type==='frostWyrm'));hub();claimReady();checked('travel:main');chapter('iceBlade');equipIfOwned('iceSword');checked('technique:frost');
  trial('iceTrial');equipIfOwned('frostRobe');chapter('wander');equipIfOwned('heavenCharm');
  claimReady();learnAvailable();
  if(!s.techniques.earth){checked('buy:earthBook');checked('learn:earth');}
  checked('technique:earth');checked('train:sword');checked('train:sword');claimReady();
  if(p.xp>=X.stats(s).xpNeeded)checked('breakthrough');
  assert.equal(s.progress.visited.length,6);assert.equal(Object.values(s.trials).filter(q=>q.rewarded).length,3);
  assert.equal(s.story.completed.length,6);assert.equal(s.story.journal.length,6);assert.equal(Object.keys(s.techniques).length,6);
  assert.equal(s.techniques.sword,3);assert.equal(s.progress.claims.length,7);
  assert.ok(p.stones>=0&&p.herbs>=0&&p.potions>=0);assert.ok(deaths<12);
  assert.equal(X.deserialize(X.serialize(s)).won,true);
  if(process.env.SHANHAI_QA_SAVE){
    const fs=require('node:fs'),path=require('node:path');fs.mkdirSync(path.dirname(process.env.SHANHAI_QA_SAVE),{recursive:true});fs.writeFileSync(process.env.SHANHAI_QA_SAVE,X.serialize(s));
  }
  t.diagnostic(JSON.stringify({won:s.won,realm:p.realm,kills:s.quests.kills,bosses:s.progress.bosses,visited:s.progress.visited,trials:s.trials,techniques:s.techniques,story:s.story.completed,claims:s.progress.claims,equipment:s.equipment,weapon:p.weapon,hp:p.hp,potions:p.potions,deaths,gameplaySeconds:Math.round(s.time),frames}));
});
