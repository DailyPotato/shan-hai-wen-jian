'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const X=require('../engine.js'),C=X.CONTENT;
const RAW=fs.readFileSync(path.join(__dirname,'v5-save.fixture.json'),'utf8');
const fresh=()=>X.deserialize(RAW);
const ledger=s=>({wallet:Object.fromEntries([...Object.keys(C.RESOURCES),'xp','potions'].map(k=>[k,s.player[k]])),inventory:structuredClone(s.inventory),equipment:structuredClone(s.equipment),dao:structuredClone(s.dao),sect:structuredClone(s.sect),workshop:structuredClone(s.workshop),management:structuredClone(s.management),journey:structuredClone(s.journey),worldlife:structuredClone(s.worldlife)});
const checked=(s,id)=>{X.action(s,id);assert.equal(s.lastAction.ok,true,id+': '+s.lastAction.message);return s.lastAction;};
const failed=(s,id)=>{const before=ledger(s);X.action(s,id);assert.equal(s.lastAction.ok,false,id);assert.deepEqual(ledger(s),before,id+' must not change paid resources or progression');};
const step=(s,input={})=>{X.step(s,input,.05);assert.equal(s.dead,false,'Normal-action run must remain alive');};
const advance=(s,seconds)=>{for(let i=0;i<Math.ceil(seconds/.05);i++)step(s);};
// Only derived retreat floats and enemy display/movement runtime fields are
// canonicalized. Wallets, costs, rewards, quantities and all progression stay exact.
const canonicalLedger=s=>{const l=ledger(s);for(const r of [l.journey?.retreat,...(l.journey?.cultivation.sessions||[])])if(r)for(const k of ['pressure','stableTime'])r[k]=Math.round(r[k]*1e6)/1e6;for(const e of l.journey?.active?.world.enemies||[]){if(e.dormant===false)delete e.dormant;delete e.vx;delete e.vy;delete e.telegraph;}return l;};
const roundtrip=s=>{const next=X.deserialize(X.serialize(s));assert.deepEqual(canonicalLedger(next),canonicalLedger(s));return next;};
const blocked=(m,x,y,r=18)=>x<r+25||y<r+25||x>m.width-r-25||y>m.height-r-25||(m.ponds||[]).some(p=>((x-p.x)/(p.rx+r))**2+((y-p.y)/(p.ry+r))**2<1)||(m.obstacles||[]).some(o=>Math.hypot(x-o.x,y-o.y)<o.radius+r);

// A declared boundary fixture may move the camera to a station for isolated cost/state rules.
// Natural progression below uses naturalBot and never calls this helper.
function atStation(s,id,mapId='sect'){
 if(s.mapId!==mapId){const hub=X.mapInfo(s).hub;s.player.x=hub.x;s.player.y=hub.y;checked(s,'travel:'+mapId);}
 const n=X.mapInfo(s).npcs.find(n=>n.id===id);assert.ok(n);s.player.x=n.x;s.player.y=n.y;
}

// This helper only issues normal gameplay inputs and paid actions; it never assigns state fields.
function naturalBot(s){
 const p=s.player,trace=[];let frames=0,heals=0,teas=0;
 const action=id=>{const before=ledger(s);checked(s,id);trace.push({id,time:s.time,from:before.wallet,to:ledger(s).wallet});};
 const frame=(input={})=>{assert.ok(++frames<250000,'Natural detailed-system frame budget');if(p.hp<X.stats(s).maxHp*.55&&p.potions>0){action('heal');heals++;}if(p.mp<X.stats(s).maxMp*.2&&s.inventory.spiritTea>0){action('use:spiritTea');teas++;}step(s,input);};
 function layout(){const m=X.mapInfo(s),size=35,cols=Math.floor((m.width-86)/size)+1,rows=Math.floor((m.height-86)/size)+1;return{m,size,cols,rows,coord:n=>({x:43+n%cols*size,y:43+Math.floor(n/cols)*size})};}
 function nearest(pt,g){let best=-1,bd=Infinity;for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){const x=Math.round((pt.x-43)/g.size)+xx,y=Math.round((pt.y-43)/g.size)+yy,id=y*g.cols+x;if(x<0||y<0||x>=g.cols||y>=g.rows)continue;const c=g.coord(id),d=Math.hypot(c.x-pt.x,c.y-pt.y);if(!blocked(g.m,c.x,c.y)&&d<bd){best=id;bd=d;}}assert.ok(best>=0,'Natural route has a reachable endpoint');return best;}
 function route(target){const g=layout(),start=nearest(p,g),end=nearest(target,g),q=[start],prev=new Map([[start,null]]);for(let i=0;i<q.length&&!prev.has(end);i++){const id=q[i],a=g.coord(id),cx=id%g.cols,cy=Math.floor(id/g.cols);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=cx+dx,y=cy+dy,n=y*g.cols+x;if(x<0||y<0||x>=g.cols||y>=g.rows||prev.has(n))continue;const b=g.coord(n);if(blocked(g.m,b.x,b.y)||blocked(g.m,(a.x+b.x)/2,(a.y+b.y)/2))continue;prev.set(n,id);q.push(n);}}assert.ok(prev.has(end),'Natural target must be walkable');let id=end,r=[];while(id!==null){r.unshift(g.coord(id));id=prev.get(id);}return r;}
 function walk(target){for(let attempt=0;attempt<6;attempt++){for(const point of route(target)){let tries=0;while(Math.hypot(point.x-p.x,point.y-p.y)>13){if(tries++>45)break;const d=Math.hypot(point.x-p.x,point.y-p.y),foe=s.enemies.filter(e=>e.hp>0&&!e.gated).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];frame({mx:(point.x-p.x)/d,my:(point.y-p.y)/d,attack:!!foe,aimX:foe?.x,aimY:foe?.y,skill:!!foe&&Math.hypot(foe.x-p.x,foe.y-p.y)<220});}}if(Math.hypot(p.x-target.x,p.y-target.y)<70)return;}assert.fail('Natural walk failed');}
 function fight(e){const ranged=X.weaponInfo(s).kind!=='sword';for(let i=0;i<10000&&e.hp>0;i++){const d=Math.hypot(e.x-p.x,e.y-p.y)||1,warning=s.effects.find(f=>f.type==='warning'&&f.life<.3&&Math.hypot(f.x-p.x,f.y-p.y)<f.radius+25),avoid=!!warning;let mx=0,my=0;if(avoid){mx=p.x-warning.x||-1;my=p.y-warning.y||1;const l=Math.hypot(mx,my);mx/=l;my/=l;}else if(d>(ranged?420:80)){mx=(e.x-p.x)/d;my=(e.y-p.y)/d;}else if(ranged&&d<200){mx=(p.x-e.x)/d;my=(p.y-e.y)/d;}frame({mx,my,attack:true,skill:true,secondary:true,aimX:e.x,aimY:e.y,dash:!!avoid});}assert.equal(e.hp,0,`Natural combat ${e.type}`);}
 const wait=seconds=>{for(let i=0;i<Math.ceil(seconds/.05);i++)frame();};
 const travel=id=>{walk(X.mapInfo(s).start);if(s.mapId!==id)action('travel:'+id);};
 const station=id=>{const n=X.mapInfo(s).npcs.find(n=>n.id===id);assert.ok(n);walk(n);X.interact(s);assert.equal(s.interaction,id);};
 return{action,frame,wait,walk,fight,travel,station,trace,metrics:()=>({frames,heals,teas,gameplaySeconds:s.time})};
}
module.exports={X,C,RAW,fresh,ledger,checked,failed,step,advance,roundtrip,atStation,naturalBot};
