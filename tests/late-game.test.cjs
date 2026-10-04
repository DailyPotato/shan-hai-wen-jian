'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const X=require('../engine.js');
const C=X.CONTENT;
const V3=fs.readFileSync(path.join(__dirname,'v3-save.fixture.json'),'utf8');
const checked=(s,id)=>{X.action(s,id);assert.equal(s.lastAction.ok,true,id+': '+s.lastAction.message);};
const economic=s=>({player:structuredClone(s.player),inventory:{...s.inventory},equipment:{...s.equipment},techniques:{...s.techniques},grades:{...s.techniqueGrades},npc:structuredClone(s.npcProgress),progress:structuredClone(s.progress),trials:structuredClone(s.trials),sect:structuredClone(s.sect),activity:s.activity?structuredClone(s.activity):null});
const failed=(s,id)=>{const before=economic(s);X.action(s,id);assert.equal(s.lastAction.ok,false,id);assert.deepEqual(economic(s),before,id+' must be free');};
const advance=(s,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds/.05);i++)X.step(s,input,.05);};
const blocked=(m,x,y,r=18)=>x<r+25||y<r+25||x>m.width-r-25||y>m.height-r-25||m.ponds.some(p=>((x-p.x)/(p.rx+r))**2+((y-p.y)/(p.ry+r))**2<1)||m.obstacles.some(o=>Math.hypot(x-o.x,y-o.y)<o.radius+r);
const permanentWorlds=worlds=>Object.fromEntries(Object.entries(worlds).map(([id,w])=>[id,{...structuredClone(w),enemies:w.enemies.map(e=>{const saved={...e};delete saved.gated;delete saved.dormant;return saved;})}]));

test('authentic v3 migration preserves the earned NPC, immortal technique, gear and every permanent world',()=>{
  assert.equal(crypto.createHash('sha256').update(V3).digest('hex'),'a7707f367a3a2eff03bc1d240ecd0f5eb4ab4d7ff1b23ddb82534a78851576ab');
  const old=JSON.parse(V3),s=X.deserialize(V3),next=JSON.parse(X.serialize(s));assert.equal(s.version,4);
  for(const k of ['root','npcProgress','inventory','equipment','buffs','story','progress','trials','projectiles','quests','questRewards','won','dead','meditationCd','seed','rng','time'])assert.deepEqual(next[k],old[k],k);
  for(const k of Object.keys(old.player))assert.deepEqual(next.player[k],old.player[k],k);
  for(const [id,level]of Object.entries(old.techniques)){const grade=old.techniqueGrades[id],suffix=['','_mystic','_earth','_heaven','_immortal'][grade],mapped=id+suffix;assert.equal(next.techniques[mapped],level);assert.equal(X.techniqueInfo(s,mapped).gradeIndex,grade);}
  assert.equal(Object.keys(next.npcProgress).length,8);assert.equal(next.activeTechnique,'flame_immortal');assert.equal(s.secondaryTechnique,null);assert.equal(s.player.secondaryCd,0);
  const flame=X.techniqueInfo(s);assert.equal(flame.level,3);assert.equal(flame.gradeIndex,4);assert.ok(flame.multiplier>=1.25*1.44*1.75-1e-9);assert.equal(flame.manaCost,22);assert.ok(Math.abs(flame.cooldown-5.904)<1e-9);
  for(const [id,w]of Object.entries(old.worlds)){
    assert.deepEqual(next.worlds[id].nodes,w.nodes);assert.deepEqual(next.worlds[id].drops,w.drops);
    for(let i=0;i<w.enemies.length;i++)for(const k of ['id','type','x','y','hp','maxHp','respawn','mode','attackTimer','cooldown','burn','burnDamage','slow','rooted','wave'])assert.equal(next.worlds[id].enemies[i][k],w.enemies[i][k],id+'.'+k);
  }
  const restored=X.deserialize(X.serialize(s));assert.deepEqual(restored.npcProgress,s.npcProgress);assert.deepEqual(restored.techniqueGrades,s.techniqueGrades);
});

test('eight cultivation realms are ordered with real growth and seven persistent maps retain legacy terrain',()=>{
  assert.deepEqual(X.REALMS.map(r=>r.realmName),['炼气','筑基','金丹','元婴','化神','炼虚','合体','大乘']);
  for(let i=0;i<X.REALMS.length;i++){const r=X.REALMS[i];assert.ok(r.maxHp>0&&r.maxMp>0&&r.attack>0);if(i<7)assert.ok(r.xpNeeded>0);if(i){assert.ok(r.maxHp>X.REALMS[i-1].maxHp);assert.ok(r.maxMp>X.REALMS[i-1].maxMp);assert.ok(r.attack>X.REALMS[i-1].attack);}}
  assert.equal(Object.keys(C.MAPS).length,7);assert.ok(C.MAPS.sect);assert.ok(C.TECHNIQUES.arrow);
  for(const id of ['main','red','snow','bambooTrial','fireTrial','iceTrial']){const m=C.MAPS[id],old=JSON.parse(V3).worlds[id];assert.equal(m.nodes.length,old.nodes.length);assert.equal(m.spawns.length,old.enemies.length);}
  const s=X.createGame(621);checked(s,'travel:sect');assert.equal(s.mapId,'sect');assert.equal(X.isSafe(s),true);
  for(const p of [{x:80,y:80},{x:3100,y:80},{x:80,y:2300},{x:3100,y:2300}]){if(blocked(C.MAPS.sect,p.x,p.y))continue;Object.assign(s.player,p);assert.equal(X.isSafe(s),true);}
  assert.equal(X.deserialize(X.serialize(s)).mapId,'sect');
});

// Actual movement and combat helper. It never assigns player position, health, currency or progress.
function naturalBot(s){
  const p=s.player;let frames=0,deaths=0;
  function layout(){const m=X.mapInfo(s),size=35,cols=Math.floor((m.width-86)/size)+1,rows=Math.floor((m.height-86)/size)+1;return{m,size,cols,rows,coord:n=>({x:43+n%cols*size,y:43+Math.floor(n/cols)*size})};}
  function nearest(pt,g){let best=-1,bd=Infinity;for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){const x=Math.round((pt.x-43)/g.size)+xx,y=Math.round((pt.y-43)/g.size)+yy,id=y*g.cols+x;if(x<0||y<0||x>=g.cols||y>=g.rows)continue;const c=g.coord(id),d=Math.hypot(c.x-pt.x,c.y-pt.y);if(!blocked(g.m,c.x,c.y)&&d<bd){best=id;bd=d;}}assert.ok(best>=0);return best;}
  function route(target){const g=layout(),start=nearest(p,g),end=nearest(target,g),q=[start],prev=new Map([[start,null]]);for(let i=0;i<q.length&&!prev.has(end);i++){const id=q[i],a=g.coord(id),cx=id%g.cols,cy=Math.floor(id/g.cols);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=cx+dx,y=cy+dy,n=y*g.cols+x;if(x<0||y<0||x>=g.cols||y>=g.rows||prev.has(n))continue;const b=g.coord(n);if(blocked(g.m,b.x,b.y)||blocked(g.m,(a.x+b.x)/2,(a.y+b.y)/2))continue;prev.set(n,id);q.push(n);}}assert.ok(prev.has(end),'Natural target must be walkable');let id=end,r=[];while(id!==null){r.unshift(g.coord(id));id=prev.get(id);}return r;}
  function frame(input={}){assert.ok(++frames<250000,'Natural expansion frame budget');if(p.hp<X.stats(s).maxHp*.6&&p.potions>0)X.action(s,'heal');if(p.mp<X.stats(s).maxMp*.25&&s.inventory.spiritTea>0)X.action(s,'use:spiritTea');X.step(s,input,.05);if(s.dead){deaths++;X.action(s,'revive');return false;}return true;}
  function walk(target){for(let attempt=0;attempt<8;attempt++){let died=false;for(const point of route(target)){let tries=0;while(Math.hypot(point.x-p.x,point.y-p.y)>13){if(tries++>45)break;const d=Math.hypot(point.x-p.x,point.y-p.y),foe=s.enemies.filter(e=>e.hp>0&&!e.gated).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!frame({mx:(point.x-p.x)/d,my:(point.y-p.y)/d,attack:true,aimX:foe?.x,aimY:foe?.y,skill:foe&&Math.hypot(foe.x-p.x,foe.y-p.y)<200})){died=true;break;}}if(died)break;}if(!died&&Math.hypot(p.x-target.x,p.y-target.y)<70)return;}assert.fail('Natural walk failed');}
  function fight(e){for(let attempt=0;attempt<5&&e.hp>0;attempt++){walk(e);for(let i=0;i<8000&&e.hp>0;i++){const d=Math.hypot(e.x-p.x,e.y-p.y),warning=s.effects.find(f=>f.type==='warning'&&f.sourceId===e.id&&f.life<.25),avoid=warning&&Math.hypot(warning.x-p.x,warning.y-p.y)<warning.radius+25;let mx=0,my=0;if(avoid){mx=p.x-warning.x||-1;my=p.y-warning.y||1;const l=Math.hypot(mx,my);mx/=l;my/=l;}else if(d>80){mx=(e.x-p.x)/d;my=(e.y-p.y)/d;}if(!frame({mx,my,attack:true,skill:true,aimX:e.x,aimY:e.y,dash:!!avoid}))break;}}assert.equal(e.hp,0,`Natural combat ${e.type}`);}
  function hub(){walk(X.mapInfo(s).start);checked(s,'meditate');}
  function travel(id){hub();checked(s,'travel:'+id);assert.equal(s.mapId,id);}
  return{frame,walk,fight,hub,travel,metrics:()=>({frames,deaths})};
}

// Rich wallets are only used to isolate costs and boundary rules in the following unit tests.
function fixture(){const s=X.deserialize(V3);checked(s,'travel:sect');checked(s,'sect:join');for(const k of Object.keys(C.RESOURCES))s.player[k]=10000;s.player.xp=100000;s.sect.contribution=10000;s.sect.totalContribution=10000;return s;}
const facility=(s,id)=>X.sectInfo(s).facilities.find(f=>f.id===id);
function battleFixture(s,e){const dx=1700-e.x,dy=1200-e.y,d=Math.hypot(dx,dy)||1;s.player.x=e.x+dx/d*65;s.player.y=e.y+dy/d*65;for(let i=0;i<6000&&e.hp>0;i++){s.player.invuln=20;for(const foe of s.enemies)foe.stun=20;X.step(s,{attack:true,skill:true,aimX:e.x,aimY:e.y},.05);}assert.equal(e.hp,0,e.type);}
function clearFightActivity(s){let guard=0;while(X.activityInfo(s)?.phase==='fight'||X.activityInfo(s)?.phase==='choice'){assert.ok(guard++<20);if(X.activityInfo(s).phase==='choice'){checked(s,'activity:blessing:blade');continue;}for(const e of s.enemies.filter(e=>e.hp>0))battleFixture(s,e);}assert.equal(X.activityInfo(s).phase,'complete');}

test('35 fixed manuscripts have five distinct names, profiles and sources per direction and reject promotion',()=>{
  for(const direction of Object.keys(C.TECHNIQUE_DIRECTIONS)){
    const group=Object.values(C.TECHNIQUES).filter(t=>t.direction===direction).sort((a,b)=>a.gradeIndex-b.gradeIndex);
    assert.equal(group.length,5);assert.equal(new Set(group.map(t=>t.name)).size,5);assert.deepEqual(group.map(t=>t.gradeIndex),[0,1,2,3,4]);
    assert.equal(new Set(group.map(t=>JSON.stringify({profile:t.castProfile,range:t.rangeMultiplier}))).size,5,direction+' must change the actual cast shape or reach');
    for(const t of group){assert.ok(C.ITEMS[t.id+'Book']);assert.equal(C.ITEMS[t.id+'Book'].technique,t.id);assert.ok(t.acquisition);assert.equal(t.requiredRealm,t.gradeIndex);assert.equal(t.grade,C.TECHNIQUE_GRADES[t.grade].id);}
  }
  const s=fixture();for(const t of Object.values(C.TECHNIQUES)){failed(s,'promote:'+t.id);assert.equal(X.techniqueInfo(s,t.id).canPromote,false);assert.equal(X.techniqueInfo(s,t.id).promoteCost,null);}
});

test('fixed book acquisition pays exact contribution and materials and enforces realm, trial and safety',()=>{
  const s=fixture();failed(s,'acquire:flame_immortal');failed(s,'acquire:sword_immortal');
  const id='arrow_earth',t=C.TECHNIQUES[id];const before=economic(s);checked(s,'acquire:'+id);
  for(const [k,n]of Object.entries(t.acquireCost))assert.equal(k==='contribution'?s.sect.contribution:s.player[k],(k==='contribution'?before.sect.contribution:before.player[k])-n);
  assert.equal(s.inventory[id+'Book'],1);failed(s,'acquire:'+id);checked(s,'learn:'+id);assert.equal(s.techniques[id],1);assert.equal(X.techniqueInfo(s,id).gradeIndex,2);
  const grade=X.techniqueInfo(s,id).gradeIndex;checked(s,'train:'+id);checked(s,'train:'+id);assert.equal(s.techniques[id],3);assert.equal(X.techniqueInfo(s,id).gradeIndex,grade);
  const locked=fixture();locked.trials.bambooTrial.rewarded=false;failed(locked,'acquire:wood_earth');locked.trials.bambooTrial.rewarded=true;locked.player.realm=1;failed(locked,'acquire:wood_earth');locked.player.realm=3;locked.sect.contribution=0;failed(locked,'acquire:wood_earth');
  const outside=fixture();checked(outside,'travel:main');failed(outside,'acquire:wood_mystic');
  assert.equal(X.deserialize(X.serialize(s)).techniques[id],3);
});

test('all 35 spells apply their real projectile, area or control profile with a fixed grade',()=>{
  for(const t of Object.values(C.TECHNIQUES)){
    const s=fixture();s.player.realm=4;s.techniques[t.id]=3;s.techniqueGrades[t.id]=t.gradeIndex;s.activeTechnique=t.id;s.player.skillCd=0;s.player.x=1100;s.player.y=1800;s.player.mp=X.stats(s).maxMp;s.player.hp=X.stats(s).maxHp*.5;
    checked(s,'travel:main');s.player.x=1100;s.player.y=1800;for(const e of s.enemies)e.stun=20;
    const targets=s.enemies.slice(0,9);targets.forEach((e,i)=>Object.assign(e,{x:1190+i*55,y:1800,homeX:1190+i*55,homeY:1800,hp:10000,maxHp:10000}));
    const info=X.techniqueInfo(s),mp=s.player.mp;X.step(s,{skill:true,aimX:1600,aimY:1800},.05);assert.equal(s.player.mp,mp-info.manaCost);assert.equal(s.player.skillCd,info.cooldown);
    const bolts=s.projectiles.filter(p=>p.owner==='player');
    if(t.castProfile.projectileCount)assert.equal(bolts.length,t.castProfile.projectileCount,t.id);
    if(t.direction==='flame')assert.ok(Math.abs(bolts[0].explosion-t.castProfile.explosionRadius*t.rangeMultiplier)<1e-9);
    if(t.direction==='wood')assert.ok(Math.abs(targets[0].rooted-(t.castProfile.rootDuration+.9-.05))<1e-9,t.id+' must apply root time after the simulation frame');
    if(t.direction==='thunder')assert.equal(s.effects.filter(e=>e.type==='thunder').length,t.castProfile.chainTargets);
    if(t.direction==='earth'){assert.ok(s.player.shield>0);assert.ok(targets[0].x>1190);}
    if(t.direction==='arrow')advance(s,.3);assert.ok(targets.some(e=>e.hp<10000),t.id+' needs real damage');assert.equal(X.techniqueInfo(s).gradeIndex,t.gradeIndex);
  }
});

test('sword, bow and staff have actual different attacks, soft technique compatibility and durable projectiles',()=>{
  const base=X.createGame(23);base.inventory.trainingBow=1;base.inventory.trainingStaff=1;
  for(const [item,kind]of [['starterSword','sword'],['trainingBow','bow'],['trainingStaff','staff']]){
    const s=X.deserialize(X.serialize(base));if(item!==s.equipment.weapon)checked(s,'equip:'+item);assert.equal(X.weaponInfo(s).kind,kind);assert.equal(s.activeTechnique,'sword');
    s.player.x=1100;s.player.y=1900;const e=s.enemies[0];Object.assign(e,{x:1400,y:1900,homeX:1400,homeY:1900,stun:20});for(const foe of s.enemies)foe.stun=20;
    const hp=e.hp;X.step(s,{attack:true,aimX:1400,aimY:1900},.05);
    if(kind==='sword'){assert.equal(s.projectiles.length,0);assert.equal(e.hp,hp);}else{assert.ok(s.projectiles.some(p=>p.owner==='player'&&p.weaponKind===kind));const restored=X.deserialize(X.serialize(s));assert.deepEqual(restored.projectiles,s.projectiles);advance(s,.8);assert.ok(e.hp<hp,kind+' must hit at range');}
    s.player.skillCd=0;s.player.mp=X.stats(s).maxMp;X.step(s,{skill:true,aimX:1400,aimY:1900},.05);assert.ok(s.player.skillCd>0,'Nonmatching weapons must allow the old spell');
  }
  const s=fixture();checked(s,'equip:trainingStaff');const compatible=X.techniqueInfo(s,'wood');checked(s,'equip:trainingBow');const neutral=X.techniqueInfo(s,'wood');assert.ok(Math.abs(compatible.multiplier/neutral.multiplier-1.15)<1e-9);assert.equal(compatible.weaponBonus,1.15);assert.equal(neutral.weaponBonus,1);
});

test('exploration sites are legal, differentiated, gated, claim once and save real discovery records',()=>{
  assert.equal(Object.keys(C.EXPLORATION_SITES).length,12);assert.deepEqual(['main','red','snow'].map(id=>Object.values(C.EXPLORATION_SITES).filter(s=>s.mapId===id).length),[6,3,3]);
  assert.equal(new Set(Object.values(C.EXPLORATION_SITES).map(s=>JSON.stringify(s.reward))).size,12);
  const s=fixture();for(const site of Object.values(C.EXPLORATION_SITES)){
    const m=C.MAPS[site.mapId];assert.equal(blocked(m,site.x,site.y),false,site.id);const hub=X.mapInfo(s).start;s.player.x=hub.x;s.player.y=hub.y;if(s.mapId!==site.mapId)checked(s,'travel:'+site.mapId);
    failed(s,'site:'+site.id);s.player.x=site.x;s.player.y=site.y;X.interact(s);assert.equal(s.interaction,'site:'+site.id);checked(s,'site:'+site.id);assert.equal(X.siteInfo(s,site.id).claimed,true);failed(s,'site:'+site.id);
  }
  assert.deepEqual(X.deserialize(X.serialize(s)).exploration,s.exploration);
  const fresh=X.createGame(43),site=C.EXPLORATION_SITES.bambooTablet;fresh.player.x=site.x;fresh.player.y=site.y;failed(fresh,'site:'+site.id);
});

test('cultivation retains early boss gates and requires genuine tower and three escalating tribulations',()=>{
  const early=X.createGame(731);early.player.xp=100000;failed(early,'breakthrough');assert.equal(X.cultivationInfo(early).requirements[0].met,false);
  const s=fixture();assert.equal(X.cultivationInfo(s).requirements[0].id,'tower');failed(s,'breakthrough');checked(s,'sect:mission:tower');clearFightActivity(s);checked(s,'activity:leave');assert.equal(s.sect.towerBest,5);checked(s,'breakthrough');assert.equal(s.player.realm,4);
  for(let rank=1;rank<=3;rank++){
    failed(s,'breakthrough');checked(s,'sect:mission:tribulation');assert.equal(X.activityInfo(s).rank,rank);
    // Isolate gate accounting; natural dodging is tested in the earned-resource run below.
    while(X.activityInfo(s).phase==='fight'){s.player.invuln=20;X.step(s,{},.05);}
    assert.equal(X.activityInfo(s).phase,'complete');checked(s,'activity:leave');const before=economic(s),cost=X.cultivationInfo(s).cost,needed=X.cultivationInfo(s).xpNeeded;checked(s,'breakthrough');assert.equal(s.player.realm,rank+4);assert.equal(s.player.xp,before.player.xp-needed);for(const[k,n]of Object.entries(cost))assert.equal(s.player[k],before.player[k]-n);
  }
  assert.equal(s.player.realm,7);assert.equal(X.cultivationInfo(s).maxRealm,true);failed(s,'breakthrough');assert.equal(X.deserialize(X.serialize(s)).player.realm,7);
});

test('activity worlds never replace permanent maps and active fight, tower choice, warning and completion survive saves',()=>{
  for(const type of ['bounty','defense','tower','tribulation']){
    const s=fixture();if(type==='tribulation'){s.player.realm=4;s.sect.towerBest=5;s.sect.records.tower=1;s.player.hp=X.stats(s).maxHp;s.player.mp=X.stats(s).maxMp;}
    const permanent=permanentWorlds(JSON.parse(X.serialize(s)).worlds);checked(s,'sect:mission:'+type);assert.equal(X.mapInfo(s).id,'activity:'+type);assert.equal(X.mapInfo(s).sourceMapId,C.ACTIVITIES[type].mapId);assert.equal(X.isSafe(s),false);failed(s,'travel:main');
    let restored=X.deserialize(X.serialize(s));assert.deepEqual(permanentWorlds(JSON.parse(X.serialize(restored)).worlds),permanent);assert.equal(restored.enemies,restored.activity.world.enemies);assert.equal(X.activityInfo(restored).type,type);
    if(type==='tower'){for(const e of s.enemies.filter(e=>e.hp>0))battleFixture(s,e);assert.equal(X.activityInfo(s).phase,'choice');restored=X.deserialize(X.serialize(s));assert.equal(X.activityInfo(restored).choices.length,3);checked(restored,'activity:blessing:spirit');assert.equal(restored.activity.stage,2);}
    if(type==='tribulation'){advance(s,1.1);assert.ok(s.activity.warnings.length>0);restored=X.deserialize(X.serialize(s));assert.deepEqual(restored.activity.warnings,s.activity.warnings);}
    checked(s,'activity:leave');assert.equal(s.mapId,'sect');assert.equal(s.activity,null);assert.deepEqual(permanentWorlds(JSON.parse(X.serialize(s)).worlds),permanent);
  }
});

const activityRewards=s=>({wallet:Object.fromEntries([...Object.keys(C.RESOURCES),'xp','potions'].map(k=>[k,s.player[k]])),inventory:{...s.inventory},contribution:s.sect.contribution,totalContribution:s.sect.totalContribution,records:{...s.sect.records},towerBest:s.sect.towerBest,tribulationBest:s.sect.tribulationBest,tribulationRanks:[...s.sect.tribulationRanks]});
const assertReturned=(s,permanent,rewards)=>{assert.equal(s.mapId,'sect');assert.equal(s.activity,null);assert.equal(X.activityInfo(s),null);assert.equal(X.isSafe(s),true);assert.equal(s.enemies,s.worlds.sect.enemies);assert.equal(s.nodes,s.worlds.sect.nodes);assert.deepEqual(s.drops,s.worlds.sect.drops);assert.deepEqual(permanentWorlds(JSON.parse(X.serialize(s)).worlds),permanent);assert.deepEqual(activityRewards(s),rewards);};

test('all four successful activities automatically return after two seconds and countdown saves never repeat rewards',()=>{
  for(const type of ['bounty','defense','tower','tribulation']){
    const s=fixture();if(type==='tribulation'){s.player.realm=4;s.sect.towerBest=5;s.sect.records.tower=1;s.player.hp=X.stats(s).maxHp;s.player.mp=X.stats(s).maxMp;}
    const permanent=permanentWorlds(JSON.parse(X.serialize(s)).worlds),records=s.sect.records[type];checked(s,'sect:mission:'+type);
    if(type==='tribulation'){while(X.activityInfo(s).phase==='fight'){s.player.invuln=20;X.step(s,{},.05);}}else clearFightActivity(s);
    assert.equal(X.activityInfo(s).phase,'complete');assert.equal(X.activityInfo(s).returnRemaining,2);assert.equal(s.sect.records[type],records+1);assert.ok(s.activity.rewarded);assert.equal(s.drops.length,0);
    const rewards=activityRewards(s),completed=JSON.parse(X.serialize(s));
    // Previous v4 complete saves had neither a return timer nor any automatic exit.
    const old=structuredClone(completed);delete old.activity.returnRemaining;const legacy=X.deserialize(JSON.stringify(old));assert.equal(X.activityInfo(legacy).returnRemaining,2);assert.deepEqual(activityRewards(legacy),rewards);advance(legacy,1.95);assert.equal(X.activityInfo(legacy).phase,'complete');advance(legacy,.1);assertReturned(legacy,permanent,rewards);
    advance(s,1.2);assert.ok(Math.abs(X.activityInfo(s).returnRemaining-.8)<1e-9);const restored=X.deserialize(X.serialize(s));assert.equal(X.activityInfo(restored).returnRemaining,X.activityInfo(s).returnRemaining);assert.deepEqual(activityRewards(restored),rewards);
    advance(restored,.7);assert.equal(X.activityInfo(restored).phase,'complete');advance(restored,.15);assertReturned(restored,permanent,rewards);advance(restored,3);assert.deepEqual(activityRewards(restored),rewards);
    advance(s,.75);assert.equal(X.activityInfo(s).phase,'complete');advance(s,.1);assertReturned(s,permanent,rewards);
    for(const value of [null,-.1,2.1]){const invalid=structuredClone(completed);invalid.activity.returnRemaining=value;assert.throws(()=>X.deserialize(JSON.stringify(invalid)));}
  }
});

test('success settles uncollected activity stones once, including legacy completed saves',()=>{
  const s=fixture();checked(s,'sect:mission:bounty');s.drops.push({x:100,y:100,type:'stones',amount:17});
  // Isolate the final-clear accounting; actual activity combat is covered above and in the natural run.
  for(const e of s.enemies)e.hp=0;
  const stones=s.player.stones;X.step(s,{},.05);assert.equal(s.player.stones,stones+17+C.ACTIVITIES.bounty.firstReward.stones);assert.equal(s.drops.length,0);
  const rewards=activityRewards(s),old=JSON.parse(X.serialize(s));delete old.activity.returnRemaining;old.activity.world.drops.push({x:100,y:100,type:'stones',amount:23});const legacy=X.deserialize(JSON.stringify(old)),expected=structuredClone(rewards);expected.wallet.stones+=23;
  assert.deepEqual(activityRewards(legacy),expected);assert.equal(legacy.drops.length,0);const reloaded=X.deserialize(X.serialize(legacy));assert.deepEqual(activityRewards(reloaded),expected);advance(reloaded,2.05);assert.equal(reloaded.activity,null);assert.deepEqual(activityRewards(reloaded),expected);
  checked(s,'activity:leave');assert.match(s.lastAction.message,/返回/);assert.doesNotMatch(s.lastAction.message,/未完成/);assert.deepEqual(activityRewards(s),rewards);
});

test('tower choices and failed defense wait for player action instead of automatically returning',()=>{
  const tower=fixture();checked(tower,'sect:mission:tower');for(const e of tower.enemies.filter(e=>e.hp>0))battleFixture(tower,e);assert.equal(X.activityInfo(tower).phase,'choice');assert.equal(X.activityInfo(tower).returnRemaining,null);advance(tower,3);assert.equal(X.activityInfo(tower).phase,'choice');assert.equal(tower.activity.stage,1);assert.equal(tower.sect.records.tower,0);
  const choice=X.deserialize(X.serialize(tower));advance(choice,3);assert.equal(X.activityInfo(choice).phase,'choice');checked(choice,'activity:blessing:spirit');assert.equal(choice.activity.stage,2);assert.equal(X.activityInfo(choice).phase,'fight');const invalid=JSON.parse(X.serialize(choice));invalid.activity.returnRemaining=1;assert.throws(()=>X.deserialize(JSON.stringify(invalid)));checked(choice,'activity:leave');assert.equal(choice.activity,null);
  const defense=fixture(),permanent=permanentWorlds(JSON.parse(X.serialize(defense)).worlds);checked(defense,'sect:mission:defense');defense.activity.crystal.hp=1;defense.player.x=2000;defense.player.y=1450;
  for(let i=0;i<2000&&X.activityInfo(defense).phase==='fight';i++){defense.player.invuln=20;X.step(defense,{},.05);}
  assert.equal(X.activityInfo(defense).phase,'failed');assert.equal(defense.sect.records.defense,0);assert.equal(X.activityInfo(defense).returnRemaining,null);const rewards=activityRewards(defense);advance(defense,3);assert.equal(X.activityInfo(defense).phase,'failed');const failedSave=X.deserialize(X.serialize(defense));advance(failedSave,3);assert.equal(X.activityInfo(failedSave).phase,'failed');checked(failedSave,'activity:leave');assertReturned(failedSave,permanent,rewards);
});

test('facility output follows actual gameplay, assignment, matching elements, capacity and manual claim',()=>{
  const s=fixture();for(const id of Object.keys(C.SECT_FACILITIES)){const before=economic(s),cost=facility(s,id).upgradeCost;checked(s,'sect:upgrade:'+id);for(const[k,n]of Object.entries(cost))assert.equal(k==='contribution'?s.sect.contribution:s.player[k],(k==='contribution'?before.sect.contribution:before.player[k])-n);}
  advance(s,100);assert.ok(Object.values(s.sect.facilities).every(f=>f.progress===0&&f.stored===0));
  checked(s,'sect:assign:garden:qinghe');const matched=facility(s,'garden');assert.ok(matched.productionMultiplier>1);checked(s,'sect:position:garden:south');assert.equal(s.sect.facilities.garden.progress,0);assert.ok(facility(s,'garden').productionMultiplier<matched.productionMultiplier);
  checked(s,'sect:position:garden:east');advance(s,facility(s,'garden').duration*3+.1);assert.equal(s.sect.facilities.garden.stored,3);assert.equal(s.sect.facilities.garden.progress,0);
  const before=economic(s),reward=facility(s,'garden').claimReward;for(let i=0;i<100;i++)X.sectInfo(s);assert.deepEqual(economic(s),before);advance(s,100);assert.equal(s.sect.facilities.garden.stored,3);for(const k of Object.keys(C.RESOURCES))assert.equal(s.player[k],before.player[k]);
  checked(s,'sect:claim:garden');for(const[k,n]of Object.entries(reward))assert.equal(s.player[k],before.player[k]+n);failed(s,'sect:claim:garden');
  checked(s,'sect:assign:forge:qinghe');assert.equal(s.sect.facilities.garden.discipleId,null);assert.equal(s.sect.facilities.forge.discipleId,'qinghe');
  checked(s,'sect:recruit:yanming');checked(s,'sect:recruit:ruoshui');failed(s,'sect:recruit:ruoshui');checked(s,'sect:assign:library:ruoshui');
  const snapshot=structuredClone(s.sect.facilities);s.dead=true;advance(s,10);assert.deepEqual(s.sect.facilities,snapshot);s.dead=false;
  assert.deepEqual(X.deserialize(X.serialize(s)).sect,s.sect);
  const low=X.createGame(59);checked(low,'travel:sect');checked(low,'sect:join');failed(low,'sect:upgrade:garden');failed(low,'sect:assign:garden:qinghe');failed(low,'sect:recruit:ruoshui');
});

test('secondary technique has an independent cooldown and five-element chains apply damage and mana effects',()=>{
  const s=fixture();checked(s,'technique:flame_immortal');checked(s,'secondary:wood');checked(s,'travel:main');s.player.skillCd=0;s.player.x=1100;s.player.y=1800;s.player.mp=150;for(const e of s.enemies)e.stun=20;
  X.step(s,{secondary:true},.05);assert.ok(s.player.secondaryCd>0);assert.equal(s.player.skillCd,0);assert.equal(s.combo.element,'wood');assert.equal(X.techniqueInfo(s).comboReady,true);
  const secondaryCd=s.player.secondaryCd,mp=s.player.mp,cost=X.techniqueInfo(s).manaCost;X.step(s,{skill:true},.05);assert.ok(s.player.skillCd>0);assert.ok(s.player.secondaryCd<secondaryCd);assert.ok(Math.abs(s.player.mp-(mp+.125-cost+6))<1e-9);assert.equal(s.combo.element,'fire');
  const restored=X.deserialize(X.serialize(s));assert.equal(restored.secondaryTechnique,'wood');assert.equal(restored.player.secondaryCd,s.player.secondaryCd);assert.deepEqual(restored.combo,s.combo);
  advance(s,6.1);assert.equal(X.techniqueInfo(s,'earth').comboReady,false);const early=X.createGame(79);failed(early,'secondary:sword');
  const same=fixture();failed(same,'secondary:'+same.activeTechnique);checked(same,'secondary:wood');checked(same,'technique:wood');assert.equal(same.secondaryTechnique,null);checked(same,'secondary:none');
});

test('v4 rejects forged facilities, duplicate assignments, activities, exploration, secondary and fixed grades',()=>{
  const s=fixture();checked(s,'sect:upgrade:garden');checked(s,'sect:assign:garden:qinghe');const raw=X.serialize(s);
  const mutations=[d=>d.sect.facilities.garden.level=4,d=>d.sect.facilities.garden.position='missing',d=>d.sect.facilities.garden.stored=4,d=>d.sect.facilities.garden.progress=100000,d=>d.sect.facilities.garden.discipleId='missing',d=>d.sect.facilities.forge.discipleId='qinghe',d=>d.sect.disciples.qinghe.recruited=false,d=>d.sect.contribution=d.sect.totalContribution+1,d=>d.exploration.claimed=['missing'],d=>d.exploration.claimed=['lostCamp'],d=>d.secondaryTechnique='missing',d=>d.secondaryTechnique=d.activeTechnique,d=>d.player.secondaryCd=-1,d=>d.combo.element='missing',d=>d.combo.until=d.time+100,d=>d.techniqueGrades.sword=4];
  for(const mutation of mutations){const d=JSON.parse(raw);mutation(d);assert.throws(()=>X.deserialize(JSON.stringify(d)));}
  checked(s,'sect:mission:bounty');const active=X.serialize(s);for(const mutate of [d=>d.activity.type='missing',d=>d.activity.stage=99,d=>d.activity.world.enemies=[],d=>d.activity.realm=7,d=>d.activity.rewarded=true,d=>d.activity.mapId='missing']){const d=JSON.parse(active);mutate(d);assert.throws(()=>X.deserialize(JSON.stringify(d)));}
});

test('authentic earned character explores twelve sites, manages disciples, clears all activities and reaches 大乘',t=>{
  const s=X.deserialize(V3),bot=naturalBot(s),startRealm=s.player.realm;let clears=0;
  bot.travel('sect');checked(s,'sect:join');checked(s,'learn:arrow');checked(s,'secondary:wood');
  for(const site of Object.values(C.EXPLORATION_SITES)){if(s.mapId!==site.mapId)bot.travel(site.mapId);bot.walk(site);X.interact(s);assert.equal(s.interaction,'site:'+site.id);checked(s,'site:'+site.id);}
  bot.travel('sect');checked(s,'sect:upgrade:garden');checked(s,'sect:assign:garden:qinghe');checked(s,'craft:ironBow');checked(s,'craft:spiritStaff');
  checked(s,'equip:ironBow');checked(s,'technique:arrow');bot.travel('main');const remote=s.enemies.find(e=>e.hp>0&&!e.boss&&!e.gated);assert.ok(remote);bot.fight(remote);bot.travel('sect');checked(s,'equip:flameSword');checked(s,'technique:flame_immortal');
  function returnNaturally(){let frames=0;while(s.activity){assert.ok(frames++<45,'Successful activity should return within two gameplay seconds');assert.equal(X.activityInfo(s).phase,'complete');assert.ok(bot.frame());}assert.equal(s.mapId,'sect');assert.equal(X.isSafe(s),true);}
  function activity(type){bot.hub();checked(s,'sect:mission:'+type);let rounds=0;while(X.activityInfo(s).phase!=='complete'){assert.ok(rounds++<30);assert.notEqual(X.activityInfo(s).phase,'failed');if(X.activityInfo(s).phase==='choice'){checked(s,'activity:blessing:vital');continue;}for(const e of s.enemies.filter(e=>e.hp>0))bot.fight(e);}clears++;assert.doesNotThrow(()=>X.deserialize(X.serialize(s)));returnNaturally();}
  activity('bounty');activity('defense');activity('tower');assert.equal(s.sect.towerBest,5);checked(s,'breakthrough');assert.equal(s.player.realm,4);
  checked(s,'sect:recruit:yanming');checked(s,'sect:recruit:ruoshui');checked(s,'sect:upgrade:forge');checked(s,'sect:upgrade:library');checked(s,'sect:assign:forge:yanming');checked(s,'sect:assign:library:ruoshui');checked(s,'sect:position:forge:south');
  checked(s,'equip:spiritStaff');checked(s,'technique:flame_immortal');
  for(let rank=1;rank<=3;rank++){
    bot.hub();checked(s,'sect:mission:tribulation');assert.equal(X.activityInfo(s).rank,rank);while(X.activityInfo(s).phase==='fight'){
      const w=s.activity.warnings.find(w=>Math.hypot(s.player.x-w.x,s.player.y-w.y)<w.radius+55);let mx=0,my=0;if(w){mx=s.player.x-w.x||1;my=s.player.y-w.y||-1;const l=Math.hypot(mx,my);mx/=l;my/=l;}else{const dx=1700-s.player.x,dy=1200-s.player.y,d=Math.hypot(dx,dy);if(d>330){mx=dx/d;my=dy/d;}}
      assert.ok(bot.frame({mx,my,dash:!!w}));
    }assert.equal(X.activityInfo(s).phase,'complete');clears++;returnNaturally();
    while(s.player.xp<X.cultivationInfo(s).xpNeeded)activity('tower');checked(s,'breakthrough');assert.equal(s.player.realm,rank+4);
  }
  for(const id of Object.keys(C.SECT_FACILITIES)){if(s.sect.facilities[id].stored>0)checked(s,'sect:claim:'+id);}
  checked(s,'acquire:arrow_immortal');checked(s,'learn:arrow_immortal');
  for(let level=1;level<3;level++){while(s.player.spiritwood<X.techniqueInfo(s,'arrow_immortal').trainCost.spiritwood)checked(s,'sect:supply:timber');checked(s,'train:arrow_immortal');}
  bot.hub();checked(s,'equip:ironBow');checked(s,'technique:arrow_immortal');checked(s,'secondary:wood');
  assert.equal(s.player.realm,7);assert.equal(s.exploration.claimed.length,12);assert.equal(s.progress.visited.length,7);assert.equal(s.sect.tribulationBest,3);assert.equal(s.sect.towerBest,5);assert.ok(Object.values(s.sect.records).every(n=>n>0));assert.equal(s.techniques.arrow_immortal,3);assert.equal(X.techniqueInfo(s).gradeIndex,4);
  const restored=X.deserialize(X.serialize(s));assert.deepEqual(restored.sect,s.sect);assert.deepEqual(restored.exploration,s.exploration);assert.deepEqual(restored.npcProgress,s.npcProgress);assert.equal(restored.activeTechnique,s.activeTechnique);assert.equal(restored.secondaryTechnique,s.secondaryTechnique);
  if(process.env.SHANHAI_LATE_QA_SAVE){fs.mkdirSync(path.dirname(process.env.SHANHAI_LATE_QA_SAVE),{recursive:true});fs.writeFileSync(process.env.SHANHAI_LATE_QA_SAVE,X.serialize(s));}
  t.diagnostic(JSON.stringify({startRealm,endRealm:s.player.realm,visited:s.progress.visited,sites:s.exploration.claimed.length,records:s.sect.records,towerBest:s.sect.towerBest,tribulationBest:s.sect.tribulationBest,contribution:s.sect.contribution,active:s.activeTechnique,secondary:s.secondaryTechnique,facilities:s.sect.facilities,clears,...bot.metrics(),gameplaySeconds:Math.round(s.time)}));
});
