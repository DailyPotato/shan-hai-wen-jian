(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./content.js') : root.XianContent);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Xian = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CONTENT) {
  'use strict';

  const WIDTH = 3200, HEIGHT = 2400;
  const HUB = { x: 500, y: 1800, radius: 340 };
  const PONDS = [{ x: 1350, y: 700, rx: 230, ry: 155 }, { x: 2430, y: 2000, rx: 160, ry: 120 }];
  const OBSTACLES = [
    { x: 1040, y: 1130, radius: 55 }, { x: 1690, y: 1800, radius: 65 },
    { x: 1950, y: 1130, radius: 48 }, { x: 2600, y: 1330, radius: 64 },
    { x: 2900, y: 1900, radius: 52 }, { x: 730, y: 690, radius: 48 },
    { x: 1800, y: 400, radius: 50 }, { x: 2230, y: 1620, radius: 50 }
  ];
  const REALMS = [
    { realmName: '炼气', maxHp: 120, maxMp: 90, attack: 18, speed: 250, xpNeeded: 520 },
    { realmName: '筑基', maxHp: 190, maxMp: 125, attack: 33, speed: 263, xpNeeded: 1100 },
    { realmName: '金丹', maxHp: 290, maxMp: 165, attack: 52, speed: 276, xpNeeded: 1900 },
    { realmName: '元婴', maxHp: 430, maxMp: 210, attack: 76, speed: 290, xpNeeded: 0 }
  ];
  const NPCS = [
    { id: 'master', x: 440, y: 1680 }, { id: 'forge', x: 670, y: 1800 },
    { id: 'alchemy', x: 380, y: 1900 }, { id: 'shrine', x: 580, y: 1970 }
  ];
  const ENEMY = {
    wolf: { name: '山野灵狼', hp: 65, radius: 22, speed: 132, damage: 10, xp: 18, stones: 9, aggro: 350, range: 75 },
    spirit: { name: '竹林幽灵', hp: 104, radius: 23, speed: 103, damage: 14, xp: 29, stones: 15, aggro: 430, range: 310 },
    golem: { name: '遗迹石卫', hp: 172, radius: 30, speed: 88, damage: 21, xp: 43, stones: 23, aggro: 380, range: 100 },
    wolfKing: { name: '苍牙狼王', hp: 2000, radius: 43, speed: 145, damage: 22, xp: 200, stones: 100, aggro: 610, range: 360, realm: 0 },
    ancientTree: { name: '千年木灵', hp: 4500, radius: 52, speed: 48, damage: 31, xp: 350, stones: 160, aggro: 600, range: 500, realm: 1 },
    guardian: { name: '天门守卫', hp: 8000, radius: 48, speed: 92, damage: 40, xp: 700, stones: 240, aggro: 640, range: 520, realm: 2 }
  };
  Object.assign(ENEMY, {
    flameWolf:{...ENEMY.wolf,name:'赤焰灵狼',hp:135,damage:17,xp:31,stones:15,skin:'wolf',element:'fire'},
    flameSpirit:{...ENEMY.spirit,name:'流火幽灵',hp:190,damage:22,xp:43,stones:21,skin:'spirit',element:'fire'},
    lavaGolem:{...ENEMY.golem,name:'熔岩石卫',hp:300,damage:28,xp:60,stones:30,skin:'golem',element:'fire'},
    iceWolf:{...ENEMY.wolf,name:'寒影灵狼',hp:220,damage:24,xp:45,stones:23,skin:'wolf',element:'ice'},
    iceSpirit:{...ENEMY.spirit,name:'霜雪幽灵',hp:300,damage:28,xp:62,stones:29,skin:'spirit',element:'ice'},
    iceGolem:{...ENEMY.golem,name:'玄冰石卫',hp:480,damage:36,xp:82,stones:39,skin:'golem',element:'ice'},
    flameLord:{...ENEMY.guardian,name:'赤霄炎君',hp:4700,damage:31,xp:420,stones:150,realm:1,skin:'golem',element:'fire',style:'flame'},
    frostWyrm:{...ENEMY.wolfKing,name:'北冥霜龙',hp:7600,damage:38,xp:620,stones:210,realm:2,skin:'wolf',element:'ice',style:'ice'},
    bambooPhantom:{...ENEMY.ancientTree,name:'竹魇灵主',hp:1700,damage:19,xp:180,stones:70,realm:0,skin:'spirit',element:'wood',style:'wood'},
    infernoIdol:{...ENEMY.guardian,name:'赤焰魔像',hp:3900,damage:29,xp:340,stones:115,realm:1,skin:'golem',element:'fire',style:'flame'},
    iceSovereign:{...ENEMY.guardian,name:'玄冰水君',hp:6600,damage:36,xp:520,stones:170,realm:2,skin:'guardian',element:'ice',style:'ice'}
  });
  const SPAWNS = [
    ['wolf', 985, 1700], ['wolf', 1100, 2010], ['wolf', 1390, 2110], ['wolf', 920, 1350],
    ['wolf', 1200, 1320], ['wolf', 1680, 1370], ['wolf', 1830, 1570], ['wolf', 680, 1120],
    ['wolf', 860, 850], ['wolf', 1010, 530], ['wolf', 1510, 1090], ['wolf', 1790, 2100],
    ['spirit', 1690, 1000], ['spirit', 1720, 700], ['spirit', 1930, 880], ['spirit', 2130, 1080],
    ['spirit', 2100, 330], ['spirit', 1840, 220], ['spirit', 2190, 750],
    ['golem', 2420, 1060], ['golem', 2750, 1150], ['golem', 2990, 850],
    ['golem', 2560, 410], ['golem', 2990, 340], ['golem', 2850, 1600],
    ['wolfKing', 1450, 1580], ['ancientTree', 2020, 650], ['guardian', 2790, 650]
  ];
  const NODE_LOCATIONS = [
    [760, 1570], [860, 1900], [1000, 1840], [960, 1190], [780, 1320], [580, 970],
    [1080, 1490], [1270, 1860], [1450, 1900], [1630, 1590], [1890, 1890], [1600, 2230],
    [1090, 2240], [580, 610], [950, 680], [1110, 900], [1570, 810], [1500, 440],
    [1700, 490], [1930, 390], [2140, 520], [2000, 1040], [2190, 1210], [1790, 1190],
    [2390, 740], [2410, 300], [2680, 280], [2980, 580], [2780, 960], [2520, 1190],
    [2750, 1400], [2980, 1530], [2710, 1870], [2250, 2170], [2060, 2040], [2090, 1420],
    [1130, 410], [770, 2100], [2230, 930], [2970, 2160], [2840, 2240], [1880, 1390]
  ];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const finite = v => typeof v === 'number' && Number.isFinite(v);
  const safe = p => Math.hypot(p.x - HUB.x, p.y - HUB.y) < HUB.radius;

  function mapInfo(stateOrId = 'main', requestedId) {
    const state = typeof stateOrId === 'object' ? stateOrId : null;
    const id = state ? requestedId || state.mapId || 'main' : stateOrId;
    const m = CONTENT.MAPS[id] || CONTENT.MAPS.main;
    return state ? {...m,unlocked:state.player.realm>=m.realmRequired,visited:!!state.progress&&state.progress.visited.includes(m.id),trial:state.trials&&state.trials[m.id]||null} : m;
  }

  function isSafe(state) { const h=mapInfo(state).hub;return Math.hypot(state.player.x-h.x,state.player.y-h.y)<h.radius; }

  function rootInfo(state) {
    const r=state.root||{grade:'mortal',elements:['metal']},g=CONTENT.ROOT_GRADES[r.grade];
    return {grade:r.grade,name:g.name,elements:r.elements.map(id=>({...CONTENT.ELEMENTS[id]})),description:r.legacy?'旧存档的初始灵根，保留原有气血、灵力与道术基础平衡。':g.description,cultivationMultiplier:r.legacy?1:g.cultivation,affinityBonus:r.legacy?0:g.affinity,growth:r.legacy?1:g.growth};
  }

  function techniqueInfo(state,id=state.activeTechnique||'sword') {
    const t=CONTENT.TECHNIQUES[id];if(!t)return null;
    const level=state.techniques?state.techniques[id]||0:id==='sword'?1:0;
    const r=state.root||{grade:'mortal',elements:[]},g=CONTENT.ROOT_GRADES[r.grade];
    const linked={metal:['wind'],wood:['water'],ice:['water'],thunder:['wind'],fire:[],earth:[]};
    const direct=r.elements.includes(t.element),secondary=(linked[t.element]||[]).some(e=>r.elements.includes(e));
    let affinity=r.legacy?0:direct?g.affinity:secondary?g.affinity*.5:0;
    for(const item of Object.values(state.equipment||{})){const eq=CONTENT.ITEMS[item];if(eq&&eq.element===t.element)affinity+=eq.affinity||0;}
    return {...t,level,known:level>0,maxLevel:3,affinity,multiplier:(1+affinity)*(1+Math.max(0,level-1)*.22),manaCost:Math.max(12,t.manaCost-(direct&&!r.legacy?2:0)),cooldown:Math.max(3,t.cooldown-Math.max(0,level-1)*.4),trainCost:level===1?{stones:45,[t.resource]:3,herbs:2}:{stones:110,[t.resource]:6,core:2},trainRealm:level>=2?1:0};
  }

  function zoneAt(x, y, stateOrId='main') {
    const m=mapInfo(stateOrId);
    if(m.id!=='main')return {id:m.id,name:x<900&&y>1400?'驿站 · '+m.name:m.name,level:m.realmRequired,color:{fire:'#efa378',snow:'#bfdcec',bamboo:'#b3d3aa',dungeon:'#df9671',ice:'#abd6e9'}[m.theme]||'#b8ce8b'};
    if (x > 2250) return { id: 'ruins', name: '天门遗迹', level: 2, color: '#9e9ace' };
    if (x > 1600 && y < 1300) return { id: 'bamboo', name: '青竹秘境', level: 1, color: '#8ac4a9' };
    if (x < 900 && y > 1400) return { id: 'hub', name: '青云观', level: 0, color: '#e6c991' };
    return { id: 'meadow', name: '落霞原', level: 0, color: '#b8ce8b' };
  }

  function stats(state) {
    const r = REALMS[clamp(Math.floor(state.player.realm), 0, 3)];
    const growth=state.root?CONTENT.ROOT_GRADES[state.root.grade].growth:1;
    const s={...r,maxHp:Math.round(r.maxHp*growth),maxMp:Math.round(r.maxMp*growth),attack:r.attack+state.player.weapon*4,defense:0,manaRegen:0};
    for(const item of Object.values(state.equipment||{})){const eq=CONTENT.ITEMS[item];if(eq&&eq.stats)for(const [k,v]of Object.entries(eq.stats))s[k]=(s[k]||0)+v;}
    for(const [id,level]of Object.entries(state.techniques||{})){const t=CONTENT.TECHNIQUES[id];if(level>1&&t){const bonus=(level-1)*({attack:2,maxMp:6,maxHp:10,speed:4,defense:1}[t.passive]||0);s[t.passive]=(s[t.passive]||0)+bonus;}}
    if((state.buffs||[]).some(b=>b.type==='rage'))s.attack*=1.25;
    return s;
  }

  function random(state) {
    let n = state.rng | 0;
    n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
    state.rng = n >>> 0;
    return state.rng / 4294967296;
  }

  function log(state, message) {
    if (state.logs[state.logs.length - 1] !== message) state.logs.push(message);
    if (state.logs.length > 6) state.logs.splice(0, state.logs.length - 6);
  }

  function outcome(state, id, ok, message) {
    state.lastAction = { id, ok, message };
    if (message) log(state, message);
    return state;
  }

  function effect(state, type, x, y, life, radius, extra) {
    state.effects.push({ type, x, y, life, maxLife: life, radius, ...(extra || {}) });
    if (state.effects.length > 140) state.effects.splice(0, state.effects.length - 140);
  }

  function enemyAt(type, x, y, i) {
    const t = ENEMY[type];
    return {
      id: `enemy-${i}`, type, x, y, homeX: x, homeY: y, hp: t.hp, maxHp: t.hp,
      radius: t.radius, zone: zoneAt(x, y).id, boss: t.realm !== undefined, name: t.name,
      hit: 0, attackTimer: 0, telegraph: 0, cooldown: 0.8 + (i % 4) * 0.2, mode: 'patrol',
      phase: 0, patrol: i * 0.71, respawn: 0, stun: 0, gated: (t.realm || 0) > 0,
      attackX: x, attackY: y, facing: 0, vx: 0, vy: 0
    };
  }

  function createLegacy(seed = 123) {
    seed = finite(seed) ? (seed >>> 0) || 123 : 123;
    return {
      version: 1, seed, rng: seed, time: 0,
      player: { x: 550, y: 1780, hp: 120, mp: 90, realm: 0, xp: 0, stones: 20, herbs: 0,
        potions: 3, weapon: 0, facing: -0.9, attackCd: 0, skillCd: 0, dashCd: 0, invuln: 0,
        dashTime: 0, dashX: 0, dashY: 0, moving: false, hit: 0 },
      enemies: SPAWNS.map((s, i) => enemyAt(s[0], s[1], s[2], i)),
      nodes: NODE_LOCATIONS.map((n, i) => ({ id: `node-${i}`, x: n[0], y: n[1], type: i % 3 === 2 ? 'crystal' : 'herb', ready: 0 })),
      projectiles: [], effects: [], drops: [], logs: ['踏入青云观。前往落霞原历练，击败苍牙狼王。'],
      quests: { kills: 0, herbs: 0, bosses: [] }, questRewards: [],
      won: false, dead: false, interaction: null, meditationCd: 0, lastAction: null
    };
  }

  function makeWorld(mapId) {
    const m=CONTENT.MAPS[mapId];
    return {enemies:m.spawns.map((v,i)=>({...enemyAt(v[0],v[1],v[2],i),wave:v[3]||0,zone:m.id,skin:ENEMY[v[0]].skin||v[0],archetype:ENEMY[v[0]].skin||v[0],element:ENEMY[v[0]].element||'metal',burn:0,burnDamage:0,burnTick:0,slow:0,rooted:0})),nodes:m.nodes.map((v,i)=>({id:`node-${i}`,x:v[1],y:v[2],type:v[0],ready:0})),drops:[]};
  }

  function expand(state,legacy) {
    state.version=2;state.mapId='main';state.worlds={};state.progress={visited:['main'],bosses:state.quests.bosses.slice(),gathered:{},claims:[]};
    state.trials={};for(const m of Object.values(CONTENT.MAPS))if(m.type==='trial')state.trials[m.id]={wave:1,cleared:false,clears:0,rewarded:false};
    let n=(state.seed^0x9e3779b9)>>>0;n^=n<<13;n^=n>>>17;n^=n<<5;const pick=(n>>>0)%100;
    let grade='mortal',sum=0;for(const g of Object.values(CONTENT.ROOT_GRADES)){sum+=g.weight;if(pick<sum){grade=g.id;break;}}
    const elements=Object.keys(CONTENT.ELEMENTS),first=elements[(state.seed>>>0)%8],second=elements[((state.seed>>>3)+3)%8];
    state.root={grade:legacy?'mortal':grade,elements:legacy?['metal']:[first,...(second!==first&&state.seed%3===0?[second]:[])],legacy:!!legacy};
    state.techniques={sword:1};state.activeTechnique='sword';state.inventory={starterSword:1,clothRobe:1};state.equipment={weapon:'starterSword',robe:'clothRobe',charm:null};state.buffs=[];
    state.story={chapter:0,choices:{},completed:[],journal:[],relations:{mercy:0,wisdom:0,valor:0}};
    for(const key of ['iron','spiritwood','ember','frost','core','essence'])state.player[key]=0;
    state.player.shield=0;state.player.shieldTime=0;state.player.slow=0;
    const world=makeWorld('main');
    if(legacy){state.enemies=state.enemies.map((e,i)=>({...world.enemies[i],...e,burn:0,burnDamage:0,burnTick:0,slow:0,rooted:0}));state.nodes.push(...world.nodes.slice(state.nodes.length));}
    else{state.enemies=world.enemies;state.nodes=world.nodes;const st=stats(state);state.player.hp=st.maxHp;state.player.mp=st.maxMp;}
    state.worlds.main={enemies:state.enemies,nodes:state.nodes,drops:state.drops};
    return state;
  }

  function createGame(seed=123){return expand(createLegacy(seed),false);}

  function gainXp(state,value){const bonus=state.root?CONTENT.ROOT_GRADES[state.root.grade].cultivation:1;state.player.xp+=value*bonus*((state.buffs||[]).some(b=>b.type==='insight')?1.3:1);}
  function grant(state,reward){for(const [id,count]of Object.entries(reward)){if(id==='xp')gainXp(state,count);else if(id in state.player)state.player[id]+=count;else state.inventory[id]=(state.inventory[id]||0)+count;}}
  function canPay(state,cost){return Object.entries(cost).every(([id,n])=>(state.player[id]||0)>=n);}
  function pay(state,cost){for(const [id,n]of Object.entries(cost))state.player[id]-=n;}
  function costText(cost){return Object.entries(cost).map(([id,n])=>`${(CONTENT.RESOURCES[id]||CONTENT.ITEMS[id]||{name:id}).name} ${n}`).join('、');}

  function storyInfo(state){
    const c=CONTENT.STORY[state.story.chapter],req=[];
    if(!c)return{chapter:state.story.chapter,title:'山海新篇',text:'残卷归一，你的选择已写入山海。继续探索秘境和各派功法。',options:[],requirements:[],ready:false,completed:true,journal:state.story.journal,choices:state.story.choices,relations:state.story.relations};
    const r=c.requirement;
    if(r.boss&&!state.progress.bosses.includes(r.boss))req.push(`击败${ENEMY[r.boss].name}`);
    if(r.visited&&!state.progress.visited.includes(r.visited))req.push(`踏足${CONTENT.MAPS[r.visited].name}`);
    if(r.anyBoss&&!r.anyBoss.some(id=>state.progress.bosses.includes(id)))req.push(`击败${r.anyBoss.map(id=>ENEMY[id].name).join('或')}`);
    if(r.trial&&!state.trials[r.trial].rewarded)req.push(`完成${CONTENT.MAPS[r.trial].name}`);
    if(r.trialCount&&Object.values(state.trials).filter(t=>t.rewarded).length<r.trialCount)req.push(`完成 ${r.trialCount} 处不同秘境`);
    return{chapter:state.story.chapter,title:c.title,text:c.text,options:c.options.map(o=>({id:o.id,label:o.label,description:o.description})),requirements:req,ready:req.length===0,completed:false,journal:state.story.journal,choices:state.story.choices,relations:state.story.relations};
  }

  function questsInfo(state){return Object.values(CONTENT.SIDE_QUESTS).map(q=>{
    let progress=0;if(q.kind==='gather')progress=state.progress.gathered[q.resource]||0;
    if(q.kind==='trial')progress=state.trials[q.trial].rewarded?1:0;
    if(q.kind==='boss')progress=state.progress.bosses.includes(q.boss)?1:0;
    if(q.kind==='techniques')progress=Object.values(state.techniques).filter(n=>n>0).length;
    if(q.kind==='maps')progress=state.progress.visited.length;
    if(q.kind==='level')progress=Math.max(...Object.values(state.techniques));
    const completed=state.progress.claims.includes(q.id);
    return{...q,progress:Math.min(progress,q.target),ready:progress>=q.target&&!completed,completed};
  });}

  function inventoryInfo(state){const entries=[];for(const item of Object.values(CONTENT.ITEMS)){
    const count=item.resourceField?state.player[item.resourceField]||0:state.inventory[item.id]||0;
    if(count>0)entries.push({...item,count,equipped:Object.values(state.equipment).includes(item.id),usable:item.type==='consumable'||item.type==='book'});
  }return entries;}

  function travel(state,target){
    const m=CONTENT.MAPS[target];if(!m)return outcome(state,'travel:'+target,false,'山海图上没有此地。');
    if(state.dead)return outcome(state,'travel:'+target,false,'先重聚灵身，再行远游。');
    const portal=mapInfo(state).portals.some(p=>p.target===target&&distance(p,state.player)<105);
    if(!isSafe(state)&&!portal)return outcome(state,'travel:'+target,false,'传送需要返回安全驿站，或靠近通往目的地的传送门。');
    if(state.player.realm<m.realmRequired)return outcome(state,'travel:'+target,false,`需达到${REALMS[m.realmRequired].realmName}境，才能进入${m.name}。`);
    if(target===state.mapId)return outcome(state,'travel:'+target,false,'你已在此地。');
    state.worlds[state.mapId]={enemies:state.enemies,nodes:state.nodes,drops:state.drops};
    if(m.type==='trial'&&state.trials[target].cleared){state.trials[target].wave=1;state.trials[target].cleared=false;state.worlds[target]=makeWorld(target);}
    const w=state.worlds[target]||(state.worlds[target]=makeWorld(target));
    state.mapId=target;state.enemies=w.enemies;state.nodes=w.nodes;state.drops=w.drops;
    state.player.x=m.start.x;state.player.y=m.start.y;state.player.dashTime=0;state.player.invuln=Math.max(state.player.invuln,1);
    state.projectiles=[];state.effects=[];state.interaction=null;
    if(!state.progress.visited.includes(target))state.progress.visited.push(target);
    updateGates(state);effect(state,'ring',state.player.x,state.player.y,1,150,{color:'#c5e4da'});
    return outcome(state,'travel:'+target,true,`已抵达${m.name}。${m.type==='trial'?'三重试炼开始，可随时从入口退出。':'驿站安全，地图上的灵脉与妖兽可供历练。'}`);
  }

  function updateGates(state){const trial=state.trials[state.mapId];for(const e of state.enemies){e.dormant=!!trial&&(trial.cleared||e.wave!==trial.wave);e.gated=(e.boss&&state.player.realm<ENEMY[e.type].realm)||e.dormant;}}

  function trialCheck(state){
    const t=state.trials[state.mapId];if(!t||t.cleared)return;
    if(state.enemies.some(e=>e.wave===t.wave&&e.hp>0))return;
    if(t.wave<3){t.wave++;log(state,`${mapInfo(state).name} · 第 ${t.wave} 重试炼解封。`);effect(state,'ring',state.player.x,state.player.y,1,150,{color:'#ddd4a3'});}
    else{t.cleared=true;t.clears++;const rewards=CONTENT.TRIAL_REWARDS[state.mapId];if(!t.rewarded){grant(state,rewards.first);t.rewarded=true;log(state,`${mapInfo(state).name}首次通关！独有功法、装备与灵材已收入背包。`);}else if(t.clears<=5){grant(state,rewards.repeat);log(state,'秘境再次通关，获得有限灵材奖励。首次奖励不重复。');}else log(state,'秘境再次通关。已达本秘境额外灵材奖励上限。');}
    updateGates(state);
  }

  function expandedAction(state,id){
    const [kind,key]=id.split(':');if(!['travel','learn','train','technique','use','equip','craft','buy','story','claim'].includes(kind)||!key)return null;
    if(kind==='travel')return travel(state,key);
    if(state.dead)return outcome(state,id,false,'灵身已散，先重聚灵身。');
    if(['learn','train','equip','craft','buy','story','claim','technique'].includes(kind)&&!isSafe(state))return outcome(state,id,false,'请返回安全驿站后进行此操作。');
    if(kind==='technique'){if(!state.techniques[key])return outcome(state,id,false,'尚未习得此功法。');state.activeTechnique=key;return outcome(state,id,true,`已运转${CONTENT.TECHNIQUES[key].name}，按 Q 施展。`);}
    if(kind==='learn'){
      const t=CONTENT.TECHNIQUES[key],book=key+'Book';if(!t)return outcome(state,id,false,'不存在这门功法。');
      if(state.techniques[key])return outcome(state,id,false,'已习得此法，可继续研习提升重数。');
      if(!(state.inventory[book]>0))return outcome(state,id,false,'缺少对应残卷，可向云游商人购买或探索秘境。');
      state.inventory[book]--;state.techniques[key]=1;return outcome(state,id,true,`研读残卷，习得${t.name}一重。`);
    }
    if(kind==='train'){
      const info=techniqueInfo(state,key);if(!info||!info.known)return outcome(state,id,false,'先习得功法。');
      if(info.level>=3)return outcome(state,id,false,'此法已至三重圆满。');
      if(state.player.realm<info.trainRealm)return outcome(state,id,false,'三重功法需要筑基境以上。');
      if(!canPay(state,info.trainCost))return outcome(state,id,false,'研习需要 '+costText(info.trainCost)+'。');
      const previous=stats(state);pay(state,info.trainCost);state.techniques[key]++;preserveVitals(state,previous);
      return outcome(state,id,true,`${info.name}研习至${state.techniques[key]}重，道术与被动属性提升。`);
    }
    if(kind==='buy'){
      const item=CONTENT.ITEMS[key];if(!item||!item.price)return outcome(state,id,false,'商人未出售此物。');
      if(item.type==='equipment'&&state.inventory[key]>0)return outcome(state,id,false,'已拥有这件装备。');
      if(item.type==='book'&&state.techniques[item.technique])return outcome(state,id,false,'已习得此法，无须再购残卷。');
      if(state.player.stones<item.price)return outcome(state,id,false,`需要 ${item.price} 灵石。`);
      state.player.stones-=item.price;grant(state,{[key]:1});return outcome(state,id,true,`购得${item.name}。`);
    }
    if(kind==='craft'){
      const r=CONTENT.RECIPES[key];if(!r)return outcome(state,id,false,'未识此丹方或锻造图谱。');
      if(state.player.realm<r.realmRequired)return outcome(state,id,false,'境界不足，无法炼制此物。');
      if(Object.keys(r.output).some(k=>CONTENT.ITEMS[k].type==='equipment'&&state.inventory[k]>0))return outcome(state,id,false,'已拥有此装备，无须重复锻造。');
      if(!canPay(state,r.cost))return outcome(state,id,false,'材料不足，需要 '+costText(r.cost)+'。');
      pay(state,r.cost);grant(state,r.output);return outcome(state,id,true,`${r.name}炼制完成。`);
    }
    if(kind==='equip'){
      const item=CONTENT.ITEMS[key];if(!item||item.type!=='equipment'||!(state.inventory[key]>0))return outcome(state,id,false,'背包中没有这件装备。');
      if(state.equipment[item.slot]===key)return outcome(state,id,false,'已经穿戴此物。');
      const previous=stats(state);state.equipment[item.slot]=key;preserveVitals(state,previous);return outcome(state,id,true,`已装备${item.name}。`);
    }
    if(kind==='use'){
      const item=CONTENT.ITEMS[key];if(!item)return outcome(state,id,false,'未知物品。');
      if(item.type==='book')return expandedAction(state,'learn:'+item.technique);
      if(key==='potions')return action(state,'heal');
      if(item.type!=='consumable'||!(state.inventory[key]>0))return outcome(state,id,false,'背包中没有可用的此物。');
      if(item.effect==='mana'){if(state.player.mp>=stats(state).maxMp)return outcome(state,id,false,'灵力充盈，无须饮茶。');state.player.mp=Math.min(stats(state).maxMp,state.player.mp+stats(state).maxMp*.55);}
      else{const duration={rage:40,ward:45,insight:60}[item.effect];if(!duration)return outcome(state,id,false,'此物无法使用。');state.buffs=state.buffs.filter(b=>b.type!==item.effect);state.buffs.push({type:item.effect,life:duration});}
      state.inventory[key]--;effect(state,'heal',state.player.x,state.player.y,.6,60,{color:item.effect==='rage'?'#e9a77b':'#a9dccc'});return outcome(state,id,true,`已使用${item.name}。`);
    }
    if(kind==='story'){
      const info=storyInfo(state);if(info.completed||!info.ready)return outcome(state,id,false,info.requirements.join('；')||'本篇剧情已完成。');
      const c=CONTENT.STORY[state.story.chapter],choice=c.options.find(o=>o.id===key);if(!choice)return outcome(state,id,false,'无此剧情选择。');
      grant(state,choice.reward);state.story.choices[c.id]=key;state.story.relations[choice.relation]++;
      state.story.completed.push(c.id);state.story.journal.push({chapter:c.id,title:c.title,text:`${c.text}\n你的选择：${choice.label}。${choice.description}`,time:state.time});state.story.chapter++;
      return outcome(state,id,true,`${c.title}已记入山海志。${choice.description}`);
    }
    if(kind==='claim'){
      const q=questsInfo(state).find(q=>q.id===key);if(!q||!q.ready)return outcome(state,id,false,q&&q.completed?'奖励已经领取。':'任务尚未完成。');
      grant(state,q.reward);state.progress.claims.push(key);return outcome(state,id,true,`完成${q.name}，奖励已收入背包。`);
    }
    return null;
  }
  function preserveVitals(state,previous){const next=stats(state);state.player.hp=Math.min(next.maxHp,state.player.hp/previous.maxHp*next.maxHp);state.player.mp=Math.min(next.maxMp,state.player.mp/previous.maxMp*next.maxMp);}

  function blocked(x, y, radius, state) {
    if (x < radius + 25 || x > WIDTH - radius - 25 || y < radius + 25 || y > HEIGHT - radius - 25) return true;
    for (const p of mapInfo(state||'main').ponds) {
      if (((x - p.x) / (p.rx + radius)) ** 2 + ((y - p.y) / (p.ry + radius)) ** 2 < 1) return true;
    }
    return mapInfo(state||'main').obstacles.some(o => Math.hypot(x - o.x, y - o.y) < o.radius + radius);
  }

  function move(state, entity, dx, dy, radius, avoidHub) {
    const pieces = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 14));
    for (let i = 0; i < pieces; i++) {
      const nx = entity.x + dx / pieces, ny = entity.y + dy / pieces;
      const legal = (x, y) => !blocked(x, y, radius, state) && (!avoidHub || Math.hypot(x - HUB.x, y - HUB.y) > HUB.radius + radius);
      if (legal(nx, ny)) { entity.x = nx; entity.y = ny; }
      else {
        if (legal(nx, entity.y)) entity.x = nx;
        if (legal(entity.x, ny)) entity.y = ny;
      }
    }
  }

  function questCheck(state) {
    const rewards = [
      ['firstHunt', state.quests.kills >= 5, 120, 30, 2, '历练初成：击败 5 只妖兽，获得 120 修为、30 灵石、2 回春丹。'],
      ['herbalist', state.quests.herbs >= 6, 90, 25, 0, '百草识灵：采得 6 株灵草，获得 90 修为与 25 灵石。'],
      ['veteran', state.quests.kills >= 15, 180, 70, 2, '斩妖行者：击败 15 只妖兽，获得 180 修为、70 灵石、2 回春丹。']
    ];
    for (const [id, achieved, xp, stones, potions, message] of rewards) {
      if (achieved && !state.questRewards.includes(id)) {
        state.questRewards.push(id); state.player.xp += xp;
        state.player.stones += stones; state.player.potions += potions; log(state, message);
        effect(state, 'ring', state.player.x, state.player.y, 1, 80, { color: '#ebce83' });
      }
    }
  }

  function hurtPlayer(state, amount, x, y) {
    const p = state.player;
    if (state.dead || p.invuln > 0 || isSafe(state)) return false;
    amount=Math.max(1,amount-stats(state).defense);if(state.buffs.some(b=>b.type==='ward'))amount*=.75;
    if(p.shield>0){const absorbed=Math.min(p.shield,amount);p.shield-=absorbed;amount-=absorbed;effect(state,'shield',p.x,p.y,.3,38,{color:'#d7bb87'});}
    p.hp = Math.max(0, p.hp - amount); p.invuln = 0.55; p.hit = 0.2;
    effect(state, 'damage', p.x, p.y - 38, 0.7, 0, { amount: Math.round(amount), color: '#fa998b' });
    effect(state, 'impact', p.x, p.y, 0.3, 35, { color: '#ee977e' });
    if (finite(x) && finite(y)) {
      const d = Math.hypot(p.x - x, p.y - y) || 1;
      move(state, p, (p.x - x) / d * 18, (p.y - y) / d * 18, 18, false);
    }
    if (p.hp <= 0) {
      state.dead = true; state.interaction = null; p.dashTime = 0;
      log(state, '道途未尽。在归元祠重聚灵身，可保留境界与装备。');
    }
    return true;
  }

  function hurtEnemy(state, enemy, damage, push) {
    if (enemy.hp <= 0 || enemy.gated) return;
    enemy.hp = Math.max(0, enemy.hp - damage); enemy.hit = 0.18;
    effect(state, 'damage', enemy.x, enemy.y - enemy.radius - 12, 0.65, 0, { amount: Math.round(damage), color: '#f7deb0' });
    if (push && !enemy.boss) {
      const d = distance(enemy, state.player) || 1;
      move(state, enemy, (enemy.x - state.player.x) / d * push, (enemy.y - state.player.y) / d * push, enemy.radius, true);
    }
    if (enemy.hp > 0) return;
    enemy.telegraph = 0;
    const t = ENEMY[enemy.type];
    gainXp(state,t.xp);
    state.quests.kills++;
    state.drops.push({ x: enemy.x, y: enemy.y, type: 'stones', amount: t.stones });
    if (enemy.boss) {
      const first=!state.progress.bosses.includes(enemy.type);
      if(first)state.progress.bosses.push(enemy.type);
      if (['wolfKing','ancientTree','guardian'].includes(enemy.type)&&!state.quests.bosses.includes(enemy.type)) state.quests.bosses.push(enemy.type);
      grant(state,{core:enemy.type==='wolfKing'?2:3,essence:enemy.type==='wolfKing'?1:2});
      if(first&&enemy.type==='flameLord')grant(state,{flameBook:1,ember:4});
      if(first&&enemy.type==='frostWyrm')grant(state,{frostBook:1,frost:4});
      state.drops.push({ x: enemy.x + 28, y: enemy.y, type: 'potions', amount: 3 });
      state.player.mp = Math.min(stats(state).maxMp, state.player.mp + 45);
      log(state, `${enemy.name}已伏诛！获得 ${t.xp} 修为，拾取灵石与回春丹。`);
      effect(state, 'burst', enemy.x, enemy.y, 1.3, enemy.radius * 3, { color: '#e9c476' });
      if (enemy.type === 'guardian') { state.won = true; log(state, '天门重开，山海归宁。你已完成问剑之旅，仍可继续游历。'); }
    } else {
      enemy.respawn = 65;
      if (random(state) < 0.3) state.drops.push({ x: enemy.x + 20, y: enemy.y, type: 'herbs', amount: 1 });
      const resource=t.element==='fire'?'ember':t.element==='ice'?'frost':(t.skin||enemy.type)==='golem'?'iron':(t.skin||enemy.type)==='spirit'?'spiritwood':random(state)<.17?'core':null;
      if(resource)state.drops.push({x:enemy.x-20,y:enemy.y,type:resource,amount:1});
      effect(state, 'burst', enemy.x, enemy.y, 0.5, 40, { color: '#c8d7a3' });
    }
    questCheck(state);
  }

  function sword(state) {
    const p = state.player, s = stats(state);
    if (p.attackCd > 0 || state.dead || p.dashTime > 0) return;
    p.attackCd = 0.36;
    effect(state, 'slash', p.x, p.y, 0.22, 112, { angle: p.facing, color: '#e9e2b5' });
    for (const e of state.enemies) {
      if (e.hp <= 0 || e.gated || distance(e, p) > 108 + e.radius) continue;
      let diff = Math.atan2(e.y - p.y, e.x - p.x) - p.facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) < 1.15 || distance(e, p) < e.radius + 26) hurtEnemy(state, e, s.attack, 9);
    }
  }

  function statusEnemy(e,type,life,damage){
    if(e.hp<=0||e.gated)return;
    if(type==='burn'){e.burn=Math.max(e.burn||0,life);e.burnDamage=Math.max(e.burnDamage||0,damage||0);}
    if(type==='slow')e.slow=Math.max(e.slow||0,life);
    if(type==='root')e.rooted=Math.max(e.rooted||0,e.boss?life*.35:life);
  }
  function playerBolt(state,angle,speed,damage,info,options={}){
    const p=state.player;state.projectiles.push({x:p.x+Math.cos(angle)*28,y:p.y+Math.sin(angle)*28,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:options.life||1.4,radius:options.radius||7,owner:'player',sourceId:'player',damage,element:info.element,color:info.color,...options});
  }
  function cast(state) {
    const p=state.player,info=techniqueInfo(state),attack=stats(state).attack*info.multiplier;
    if(state.dead||p.skillCd>0)return;
    if(p.mp<info.manaCost){outcome(state,'skill',false,'灵力不足。服用回春丹或返回驿站调息。');return;}
    p.mp-=info.manaCost;p.skillCd=info.cooldown;
    const extra={element:info.element,color:info.color};
    if(info.id==='sword'){
      effect(state,'burst',p.x,p.y,.65,210,extra);effect(state,'ring',p.x,p.y,.5,210,extra);
      for(const offset of[-.14,0,.14])playerBolt(state,p.facing+offset,520,attack*1.8,info,{life:1.2+info.level*.12});
      for(const e of state.enemies)if(e.hp>0&&!e.gated&&distance(e,p)<210+e.radius){hurtEnemy(state,e,attack*1.5,28);if(!e.boss)e.stun=.85;}
    }else if(info.id==='flame'){
      effect(state,'flame',p.x,p.y,.8,175,extra);
      playerBolt(state,p.facing,380,attack*2.3,info,{radius:14,explosion:145,status:'burn',statusLife:4,statusDamage:attack*.3});
      for(const e of state.enemies)if(e.hp>0&&!e.gated&&distance(e,p)<175+e.radius){hurtEnemy(state,e,attack*1.1,8);statusEnemy(e,'burn',4,attack*.3);}
    }else if(info.id==='frost'){
      effect(state,'frost',p.x,p.y,.8,225,extra);
      for(let i=-2;i<=2;i++)playerBolt(state,p.facing+i*.19,445,attack*1.05,info,{radius:9,status:'slow',statusLife:4,pierce:2,hits:[]});
      for(const e of state.enemies)if(e.hp>0&&!e.gated&&distance(e,p)<225+e.radius){hurtEnemy(state,e,attack*.65,0);statusEnemy(e,'slow',4);}
    }else if(info.id==='wood'){
      p.hp=Math.min(stats(state).maxHp,p.hp+stats(state).maxHp*(.16+.025*info.level)*(1+info.affinity));
      effect(state,'heal',p.x,p.y,.8,75,extra);effect(state,'root',p.x,p.y,1,260,extra);
      for(const e of state.enemies)if(e.hp>0&&!e.gated&&distance(e,p)<260+e.radius){hurtEnemy(state,e,attack*1.7,0);statusEnemy(e,'root',2.5+info.level*.3);}
    }else if(info.id==='thunder'){
      let previous=p;const used=new Set();
      for(let i=0;i<2+info.level;i++){
        const targets=state.enemies.filter(e=>e.hp>0&&!e.gated&&!used.has(e.id)&&distance(e,previous)<(i?300:680));
        targets.sort((a,b)=>i?distance(a,previous)-distance(b,previous):Math.hypot(a.x-(p.x+Math.cos(p.facing)*350),a.y-(p.y+Math.sin(p.facing)*350))-Math.hypot(b.x-(p.x+Math.cos(p.facing)*350),b.y-(p.y+Math.sin(p.facing)*350)));
        const e=targets[0];if(!e)break;effect(state,'thunder',e.x,e.y,.45,25,{...extra,fromX:previous.x,fromY:previous.y});hurtEnemy(state,e,attack*3.2*Math.pow(.86,i),0);e.stun=Math.max(e.stun,e.boss?.2:.6);used.add(e.id);previous=e;
      }
      effect(state,'ring',p.x,p.y,.4,70,extra);
    }else if(info.id==='earth'){
      p.shield=Math.max(p.shield,stats(state).maxHp*(.22+info.level*.055));p.shieldTime=6;
      effect(state,'shield',p.x,p.y,1,52,extra);effect(state,'impact',p.x,p.y,.7,230,extra);
      for(const e of state.enemies)if(e.hp>0&&!e.gated&&distance(e,p)<230+e.radius){hurtEnemy(state,e,attack*2.5,45);e.stun=Math.max(e.stun,e.boss?.15:.9);}
    }
  }

  function shoot(state, e, angle, speed, damage, radius) {
    state.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 3.6, radius: radius || 9, owner: 'enemy', sourceId: e.id, damage,element:e.element||'metal',color:(CONTENT.ELEMENTS[e.element]||{}).color||'#dfb993' });
  }

  function beginAttack(state, e) {
    const p = state.player;
    const skin=ENEMY[e.type].skin||e.type;
    e.mode = 'windup'; e.attackX = p.x; e.attackY = p.y;
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    if (e.boss) {
      e.phase++;
      e.attackTimer = e.type === 'wolfKing' ? 0.85 : 1.05;
      const aoe = e.type === 'wolfKing' ? 110 : e.type === 'ancientTree' ? 130 : 148;
      effect(state, 'warning', p.x, p.y, e.attackTimer, aoe, { color: '#dc795e', sourceId: e.id });
      if (e.type === 'wolfKing') effect(state, 'warning', e.x, e.y, e.attackTimer, 85, { angle: e.facing, targetX: p.x, targetY: p.y, sourceId: e.id });
    } else {
      e.attackTimer = skin === 'golem' ? 0.8 : 0.58;
      const ranged = skin === 'spirit';
      effect(state, 'warning', ranged ? e.x : e.attackX, ranged ? e.y : e.attackY,
        e.attackTimer, ranged ? 32 : skin === 'golem' ? 65 : 45, { color: '#dca478', sourceId: e.id });
    }
    e.telegraph = e.attackTimer;
  }

  function finishAttack(state, e) {
    const p = state.player, t = ENEMY[e.type];
    const skin=t.skin||e.type;
    if (e.boss) {
      const radius = e.type === 'wolfKing' ? 110 : e.type === 'ancientTree' ? 130 : 148;
      if (e.type === 'wolfKing'||e.type==='frostWyrm') {
        const d = Math.hypot(e.attackX - e.x, e.attackY - e.y);
        if (d > 1) move(state, e, (e.attackX - e.x) / d * Math.min(d, 380), (e.attackY - e.y) / d * Math.min(d, 380), e.radius, true);
      }
      effect(state, 'impact', e.attackX, e.attackY, 0.48, radius, { color: e.type === 'ancientTree' ? '#b6d19a' : '#e6ad7c' });
      if (Math.hypot(p.x - e.attackX, p.y - e.attackY) < radius + 18) hurtPlayer(state, t.damage, e.attackX, e.attackY);
      if (e.type === 'ancientTree' || (e.type === 'guardian' && e.phase % 2 === 0)) {
        const aim = Math.atan2(p.y - e.y, p.x - e.x);
        for (let i = -2; i <= 2; i++) shoot(state, e, aim + i * 0.27, e.type === 'guardian' ? 280 : 220, t.damage * 0.65, 10);
      }
      if (e.type === 'guardian' && e.phase % 3 === 0) {
        for (let i = 0; i < 8; i++) shoot(state, e, i * Math.PI / 4 + e.phase * 0.31, 185, 24, 10);
        effect(state, 'ring', e.x, e.y, 0.65, 190, { color: '#c7b6f1' });
      }
      if(t.style==='flame'){
        for(let i=0;i<6;i++)shoot(state,e,i*Math.PI/3+e.phase*.2,220,t.damage*.65,11);
        effect(state,'flame',e.attackX,e.attackY,.8,radius,{color:'#ef946c',element:'fire'});
      }
      if(t.style==='ice'){
        const a=Math.atan2(p.y-e.y,p.x-e.x);for(let i=-2;i<=2;i++)shoot(state,e,a+i*.2,240,t.damage*.7,10);
        effect(state,'frost',e.attackX,e.attackY,.7,radius,{color:'#b6dff2',element:'ice'});
      }
      if(t.style==='wood'){
        const a=Math.atan2(p.y-e.y,p.x-e.x);shoot(state,e,a,185,t.damage*.7,12);
        effect(state,'root',e.attackX,e.attackY,.8,radius,{color:'#a7d397',element:'wood'});
      }
      e.cooldown = e.type === 'wolfKing' ? 1.65 : e.type === 'ancientTree' ? 1.9 : 1.65;
    } else if (skin === 'spirit') {
      shoot(state, e, Math.atan2(e.attackY - e.y, e.attackX - e.x), 230, t.damage, 9);
      e.cooldown = 1.8;
    } else {
      effect(state, 'impact', e.attackX, e.attackY, 0.25, skin === 'golem' ? 65 : 45, { color: '#d4a67c' });
      const reach = skin === 'golem' ? 82 : 62;
      if (Math.hypot(p.x - e.attackX, p.y - e.attackY) < reach && distance(p, e) < t.range + 50) hurtPlayer(state, t.damage, e.x, e.y);
      e.cooldown = skin === 'golem' ? 1.55 : 1.05;
    }
    e.attackTimer = 0; e.telegraph = 0; e.mode = 'chase';
  }

  function enemyStep(state, e, dt) {
    const p = state.player, t = ENEMY[e.type];
    const skin=t.skin||e.type,trial=state.trials[state.mapId];
    e.hit = Math.max(0, e.hit - dt); e.stun = Math.max(0, e.stun - dt);
    e.dormant=!!trial&&(trial.cleared||e.wave!==trial.wave);
    e.gated = (e.boss && p.realm < t.realm)||e.dormant;
    e.slow=Math.max(0,(e.slow||0)-dt);e.rooted=Math.max(0,(e.rooted||0)-dt);
    if(e.hp>0&&e.burn>0&&!e.gated){e.burn=Math.max(0,e.burn-dt);e.burnTick=(e.burnTick||0)+dt;if(e.burnTick>=.5){e.burnTick-=.5;hurtEnemy(state,e,e.burnDamage*.5,0);effect(state,'flame',e.x,e.y,.3,30,{element:'fire',color:'#efa179'});}}
    e.vx = 0; e.vy = 0;
    if (e.hp <= 0) {
      if (!e.boss&&!trial) {
        e.respawn -= dt;
        if (e.respawn <= 0 && distance(e, p) > 520 && distance({ x: e.homeX, y: e.homeY }, p) > 440) {
          Object.assign(e, enemyAt(e.type, e.homeX, e.homeY, Number(e.id.split('-')[1])));
          e.burn=0;e.burnDamage=0;e.burnTick=0;e.slow=0;e.rooted=0;
        }
      }
      return;
    }
    if (e.gated || e.stun > 0) return;
    e.cooldown = Math.max(0, e.cooldown - dt);
    if (e.mode === 'windup') {
      if (state.dead || isSafe(state)) { e.mode = 'patrol'; e.attackTimer = 0; e.telegraph = 0; return; }
      e.attackTimer -= dt;
      e.telegraph = Math.max(0, e.attackTimer);
      if (e.attackTimer <= 0) finishAttack(state, e);
      return;
    }
    const d = distance(e, p), homeDistance = Math.hypot(e.x - e.homeX, e.y - e.homeY);
    const leash = e.boss ? 660 : 460;
    const engaged = !state.dead && !isSafe(state) && d < t.aggro && homeDistance < leash;
    let tx, ty, speed;
    if (engaged) {
      e.mode = 'chase'; e.facing = Math.atan2(p.y - e.y, p.x - e.x);
      if (d < t.range && e.cooldown <= 0) { beginAttack(state, e); return; }
      const desired = skin === 'spirit' ? 240 : e.type === 'ancientTree' ? 260 : e.type === 'guardian' ? 170 : 45;
      if (d > desired) { tx = p.x; ty = p.y; speed = t.speed; }
      else if (skin === 'spirit' && d < 150) { tx = e.x + (e.x - p.x); ty = e.y + (e.y - p.y); speed = t.speed * 0.75; }
      else return;
    } else if (homeDistance > 135) {
      e.mode = 'return'; tx = e.homeX; ty = e.homeY; speed = t.speed * 0.85;
      if (homeDistance > leash && e.boss) e.hp = Math.min(e.maxHp, e.hp + dt * 8);
    } else {
      e.mode = 'patrol'; e.patrol += dt * 0.25;
      const radius = e.boss ? 28 : 66;
      tx = e.homeX + Math.cos(e.patrol) * radius; ty = e.homeY + Math.sin(e.patrol * 0.8) * radius;
      speed = t.speed * 0.32;
    }
    const direction = Math.hypot(tx - e.x, ty - e.y);
    if(e.rooted>0)return;if(e.slow>0)speed*=.45;
    if (direction > 5) {
      e.vx = (tx - e.x) / direction * speed; e.vy = (ty - e.y) / direction * speed;
      move(state, e, e.vx * dt, e.vy * dt, e.radius, true);
    }
  }

  function interact(state) {
    if (state.dead) return outcome(state, 'interact', false, '灵身已散，先在归元祠重聚灵身。');
    const p = state.player;
    const m=mapInfo(state);
    const candidates=[...m.portals.filter(n=>distance(n,p)<105).map(n=>({kind:'portal',entry:n})),...m.npcs.filter(n=>distance(n,p)<105).map(n=>({kind:'npc',entry:n})),...state.nodes.filter(n=>n.ready<=0&&distance(n,p)<90).map(n=>({kind:'node',entry:n}))];
    candidates.sort((a,b)=>distance(a.entry,p)-distance(b.entry,p));const chosen=candidates[0];
    if(!chosen)return outcome(state,'interact',false,'靠近灵脉、资源、传送门或驿站人物，按 E 交互。');
    if(chosen.kind==='portal'){state.interaction='portal:'+chosen.entry.target;return outcome(state,'interact',true,'');}
    if(chosen.kind==='npc'){state.interaction=chosen.entry.id;return outcome(state,'interact',true,'');}
    const node=chosen.entry;
    node.ready = node.type === 'herb' ? 75 : node.type==='crystal'?95:120;
    if (node.type === 'herb') {
      p.herbs += 2; gainXp(state,6); state.quests.herbs += 2;state.progress.gathered.herbs=(state.progress.gathered.herbs||0)+2;
      effect(state, 'heal', node.x, node.y, 0.55, 35, { color: '#a2dfb7' });
      outcome(state, 'interact', true, '采得 2 株灵草，获得 6 修为。');
    } else if(node.type==='crystal') {
      p.stones += 12; gainXp(state,5);state.progress.gathered.stones=(state.progress.gathered.stones||0)+12;
      effect(state, 'burst', node.x, node.y, 0.55, 38, { color: '#9fdedc' });
      outcome(state, 'interact', true, '采得 12 灵石，获得 5 修为。');
    } else {
      const r=CONTENT.RESOURCES[node.type],amount=['core','essence'].includes(node.type)?1:2;
      p[node.type]+=amount;state.progress.gathered[node.type]=(state.progress.gathered[node.type]||0)+amount;gainXp(state,6);
      effect(state,'burst',node.x,node.y,.55,38,{color:r.color});outcome(state,'interact',true,`采得 ${amount} ${r.name}，获得 6 修为。`);
    }
    questCheck(state);
    return state;
  }

  function action(state, id) {
    if(typeof id!=='string')return outcome(state,'unknown',false,'未知操作。');
    const extended=expandedAction(state,id);if(extended)return extended;
    const p = state.player, s = stats(state);
    if (id === 'revive') {
      if (!state.dead) return outcome(state, id, false, '灵身尚在，无须重聚。');
      const loss = Math.floor(p.stones * 0.12);
      p.stones -= loss; p.xp = Math.max(0, p.xp - Math.min(45, Math.floor(p.xp * 0.08)));
      state.worlds[state.mapId]={enemies:state.enemies,nodes:state.nodes,drops:state.drops};
      state.mapId='main';const home=state.worlds.main;state.enemies=home.enemies;state.nodes=home.nodes;state.drops=home.drops;
      p.x = 550; p.y = 1780; p.hp = s.maxHp; p.mp = s.maxMp; p.invuln = 2;p.shield=0;p.shieldTime=0;p.slow=0;state.buffs=[];
      p.dashTime = 0; p.attackCd = 0; state.dead = false; state.interaction = null;
      state.projectiles = []; state.effects = [];
      return outcome(state, id, true, `归元祠重聚灵身，损失 ${loss} 灵石与少量修为。境界、装备和任务保留。`);
    }
    if (state.dead) return outcome(state, id, false, '灵身已散，先重聚灵身。');
    if (id === 'heal') {
      if (p.potions < 1) return outcome(state, id, false, '回春丹已用尽。收集灵草，回道观炼制。');
      if (p.hp >= s.maxHp && p.mp >= s.maxMp) return outcome(state, id, false, '气血与灵力充盈，丹药无需消耗。');
      p.potions--; p.hp = Math.min(s.maxHp, p.hp + s.maxHp * 0.42); p.mp = Math.min(s.maxMp, p.mp + s.maxMp * 0.25);
      effect(state, 'heal', p.x, p.y, 0.6, 65, { color: '#a6e1c0' });
      return outcome(state, id, true, '服下回春丹：恢复 42% 气血与 25% 灵力。');
    }
    if (!['meditate', 'breakthrough', 'craft', 'upgrade'].includes(id)) return outcome(state, id, false, '未知操作。');
    if (!isSafe(state)) return outcome(state, id, false, '此事须返回青云观的安全范围内进行。');
    if (id === 'meditate') {
      p.hp = s.maxHp; p.mp = s.maxMp;
      if (state.meditationCd <= 0) {
        const gained = 12 + p.realm * 6;
        gainXp(state,gained); state.meditationCd = 60;
        effect(state, 'ring', p.x, p.y, 1, 85, { color: '#a0dedb' });
        return outcome(state, id, true, `调息完毕，气血灵力充盈，获得 ${gained} 修为。修为奖励每 60 秒一次。`);
      }
      return outcome(state, id, true, `气血与灵力恢复。再历练 ${Math.ceil(state.meditationCd)} 秒可获调息修为。`);
    }
    if (id === 'craft') {
      if (p.herbs < 2 || p.stones < 8) return outcome(state, id, false, '炼制 2 枚回春丹需要 2 株灵草与 8 灵石。');
      p.herbs -= 2; p.stones -= 8; p.potions += 2;
      return outcome(state, id, true, '炼制完成：获得 2 枚回春丹。');
    }
    if (id === 'upgrade') {
      const cap = Math.min(6, 2 + p.realm * 2), cost = 40 + p.weapon * 35, herbs = 1 + Math.floor(p.weapon / 2);
      if (p.weapon >= 6) return outcome(state, id, false, '灵剑已达六重，剑意圆满。');
      if (p.weapon >= cap) return outcome(state, id, false, `当前境界最多淬炼至 ${cap} 重，请先突破境界。`);
      if (p.stones < cost || p.herbs < herbs) return outcome(state, id, false, `淬炼需要 ${cost} 灵石与 ${herbs} 株灵草。`);
      p.stones -= cost; p.herbs -= herbs; p.weapon++;
      return outcome(state, id, true, `灵剑淬炼至 ${p.weapon} 重，攻击力提升 4。`);
    }
    if (p.realm >= 3) return outcome(state, id, false, '已达元婴境，问剑之心永无止境。');
    const required = ['wolfKing', 'ancientTree', 'guardian'][p.realm];
    if (!state.quests.bosses.includes(required)) return outcome(state, id, false, `突破需先击败${ENEMY[required].name}，破除境界心障。`);
    if (p.xp < s.xpNeeded) return outcome(state, id, false, `修为不足：需要 ${s.xpNeeded}，当前 ${Math.floor(p.xp)}。`);
    p.xp -= s.xpNeeded; p.realm++;
    const next = stats(state); p.hp = next.maxHp; p.mp = next.maxMp;
    effect(state, 'burst', p.x, p.y, 1.2, 180, { color: '#f1d89d' });
    state.enemies.forEach(e => { e.gated = e.boss && p.realm < ENEMY[e.type].realm; });
    return outcome(state, id, true, `破境成功，踏入${next.realmName}！气血、灵力与攻击提升，新秘境封印解除。`);
  }

  function step(state, input = {}, dt = 0) {
    dt = finite(dt) ? clamp(dt, 0, 0.05) : 0;
    if (dt <= 0) return state;
    state.time += dt; state.meditationCd = Math.max(0, state.meditationCd - dt);
    state.buffs.forEach(b=>b.life-=dt);state.buffs=state.buffs.filter(b=>b.life>0);
    const p = state.player, s = stats(state);
    p.shieldTime=Math.max(0,p.shieldTime-dt);if(p.shieldTime<=0)p.shield=0;p.slow=Math.max(0,p.slow-dt);
    ['attackCd', 'skillCd', 'dashCd', 'invuln', 'hit'].forEach(key => { p[key] = Math.max(0, p[key] - dt); });
    state.nodes.forEach(n => { n.ready = Math.max(0, n.ready - dt); });
    if (!state.dead) {
      if (finite(input.aimX) && finite(input.aimY) && Math.hypot(input.aimX - p.x, input.aimY - p.y) > 4) p.facing = Math.atan2(input.aimY - p.y, input.aimX - p.x);
      let mx = finite(input.mx) ? clamp(input.mx, -1, 1) : 0, my = finite(input.my) ? clamp(input.my, -1, 1) : 0;
      const length = Math.hypot(mx, my); if (length > 1) { mx /= length; my /= length; }
      if (input.dash && p.dashCd <= 0) {
        p.dashTime = 0.19; p.dashCd = 1.4; p.invuln = Math.max(p.invuln, 0.25);
        const d = Math.hypot(mx, my); p.dashX = d > 0 ? mx / d : Math.cos(p.facing); p.dashY = d > 0 ? my / d : Math.sin(p.facing);
        effect(state, 'ring', p.x, p.y, 0.28, 40, { color: '#9fdbdf' });
      }
      p.moving = length > 0.05 || p.dashTime > 0;
      if (p.dashTime > 0) {
        move(state, p, p.dashX * 830 * dt, p.dashY * 830 * dt, 18, false); p.dashTime = Math.max(0, p.dashTime - dt);
        effect(state, 'trail', p.x, p.y, 0.25, 17, { angle: p.facing, color: '#a2dbdf' });
      } else move(state, p, mx * s.speed * dt*(p.slow>0?.65:1), my * s.speed * dt*(p.slow>0?.65:1), 18, false);
      p.mp = Math.min(s.maxMp, p.mp + dt * ((isSafe(state) ? 6 : 2.5)+s.manaRegen));
      if (isSafe(state)) p.hp = Math.min(s.maxHp, p.hp + dt * 3);
      if (input.attack) sword(state);
      if (input.skill) cast(state);
      if (input.interact) interact(state);
    } else p.moving = false;
    state.enemies.forEach(e => enemyStep(state, e, dt));
    for (const b of state.projectiles) {
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (blocked(b.x, b.y, b.radius, state) || (b.owner === 'enemy' && Math.hypot(b.x - HUB.x, b.y - HUB.y) < HUB.radius)) b.life = 0;
      if (b.life > 0 && b.owner === 'player') {
        for (const e of state.enemies) {
          if (e.hp > 0 && !e.gated && !(b.hits||[]).includes(e.id)&&Math.hypot(e.x - b.x, e.y - b.y) < b.radius + e.radius) {
            hurtEnemy(state, e, b.damage, 7);if(b.status)statusEnemy(e,b.status,b.statusLife,b.statusDamage);
            if(b.pierce){b.hits=b.hits||[];b.hits.push(e.id);b.pierce--;if(b.pierce<=0)b.life=0;}else b.life=0;
            if(b.explosion){effect(state,'flame',b.x,b.y,.6,b.explosion,{element:b.element,color:b.color});for(const other of state.enemies)if(other!==e&&other.hp>0&&!other.gated&&Math.hypot(other.x-b.x,other.y-b.y)<b.explosion+other.radius){hurtEnemy(state,other,b.damage*.6,8);statusEnemy(other,'burn',b.statusLife,b.statusDamage);}}
            effect(state, 'impact', b.x, b.y, 0.23, 22, { color: b.color||'#a5e4e3',element:b.element||'metal' });
            break;
          }
        }
      }
      if (b.life > 0 && b.owner === 'enemy' && !state.dead && Math.hypot(p.x - b.x, p.y - b.y) < b.radius + 18) {
        const hit=hurtPlayer(state, b.damage, b.x - b.vx, b.y - b.vy);if(hit&&b.element==='ice')p.slow=2.5;b.life = 0;
      }
    }
    state.projectiles = state.projectiles.filter(b => b.life > 0).slice(-200);
    const kept = [];
    for (const drop of state.drops) {
      const d = distance(drop, p);
      if (!state.dead && d < 105) {
        p[drop.type] += drop.amount;
        effect(state, 'particle', drop.x, drop.y, 0.35, 5, { color: drop.type === 'stones' ? '#f1d18c' : '#afe4ad' });
      } else if (!state.dead && d < 190) {
        drop.x += (p.x - drop.x) * dt * 5; drop.y += (p.y - drop.y) * dt * 5; kept.push(drop);
      } else kept.push(drop);
    }
    state.drops = kept.slice(-100);
    state.effects.forEach(e => { e.life -= dt; });
    state.effects = state.effects.filter(e => e.life > 0);
    trialCheck(state);
    return state;
  }

  function objective(state) {
    const p = state.player, s = stats(state);
    if (state.dead) return '灵身已散 · 点击重聚灵身，返回青云观';
    const m=mapInfo(state);if(m.type==='trial')return m.trial.cleared?'秘境已通关 · 返回入口退出，重新进入可挑战':`${m.name} · 第 ${m.trial.wave}/3 重试炼 · ${state.enemies.filter(e=>e.wave===m.trial.wave&&e.hp>0).length} 个敌人`;
    if(m.id!=='main'){const boss=m.id==='red'?'flameLord':'frostWyrm';return state.progress.bosses.includes(boss)?`${m.name} · 采集灵材、探索秘境与推进山海志`:`${m.name} · 寻找并击败${ENEMY[boss].name}`;}
    if (state.won) return '山海已安 · 可继续游历，或回道观突破元婴';
    if (!state.quests.bosses.includes('wolfKing')) {
      if (state.quests.kills < 5) return `落霞历练 · 斩妖 ${Math.min(5, state.quests.kills)}/5 · 寻找苍牙狼王`;
      return '问剑苍牙 · 前往落霞原东南，击败苍牙狼王';
    }
    if (p.realm === 0) return `筑基之路 · 修为 ${Math.floor(p.xp)}/${s.xpNeeded} · 回道观突破`;
    if (!state.quests.bosses.includes('ancientTree')) return '青竹试炼 · 前往东北竹林，击败千年木灵';
    if (p.realm === 1) return `结丹之路 · 修为 ${Math.floor(p.xp)}/${s.xpNeeded} · 回道观突破`;
    return '叩问天门 · 前往东方遗迹，击败天门守卫';
  }

  function serialize(state) {
    state.worlds[state.mapId]={enemies:state.enemies,nodes:state.nodes,drops:state.drops};
    const keys=['version','seed','rng','time','player','mapId','worlds','root','techniques','activeTechnique','inventory','equipment','buffs','story','progress','trials','projectiles','logs','quests','questRewards','won','dead','meditationCd'];
    const data={};for(const key of keys)data[key]=state[key];return JSON.stringify(data);
  }

  function deserializeV1(json) {
    const fail = () => { throw new Error('存档无效或不兼容，请选择有效的山海问剑存档。'); };
    if (typeof json !== 'string' || json.length > 500000) fail();
    let data; try { data = JSON.parse(json); } catch (_) { fail(); }
    if (!data || typeof data !== 'object' || data.version !== 1) fail();
    const number = (v, lo, hi, integer) => {
      if (!finite(v) || v < lo || v > hi || (integer && !Number.isInteger(v))) fail();
      return v;
    };
    const boolean = v => { if (typeof v !== 'boolean') fail(); return v; };
    const state = createLegacy(number(data.seed, 1, 4294967295, true));
    state.rng = number(data.rng, 1, 4294967295, true); state.time = number(data.time, 0, 1e9);
    const savedPlayer = data.player;
    if (!savedPlayer || typeof savedPlayer !== 'object') fail();
    const p = state.player;
    p.realm = number(savedPlayer.realm, 0, 3, true); p.weapon = number(savedPlayer.weapon, 0, 6, true);
    const s = stats(state);
    p.x = number(savedPlayer.x, 43, WIDTH - 43); p.y = number(savedPlayer.y, 43, HEIGHT - 43);
    if (blocked(p.x, p.y, 17, state)) fail();
    p.hp = number(savedPlayer.hp, 0, s.maxHp); p.mp = number(savedPlayer.mp, 0, s.maxMp);
    ['xp', 'stones', 'herbs', 'potions'].forEach(k => { p[k] = number(savedPlayer[k], 0, 1e8); if (k !== 'xp' && !Number.isInteger(p[k])) fail(); });
    p.facing = number(savedPlayer.facing, -Math.PI * 2, Math.PI * 2);
    ['attackCd', 'skillCd', 'dashCd', 'invuln', 'hit', 'dashTime'].forEach(k => { p[k] = number(savedPlayer[k], 0, 20); });
    p.dashX = number(savedPlayer.dashX, -1, 1); p.dashY = number(savedPlayer.dashY, -1, 1);
    state.dead = boolean(data.dead); state.won = boolean(data.won);
    if (state.dead !== (p.hp <= 0)) fail();
    const q = data.quests;
    if (!q || !Array.isArray(q.bosses) || q.bosses.length > 3) fail();
    state.quests.kills = number(q.kills, 0, 1e7, true); state.quests.herbs = number(q.herbs, 0, 1e7, true);
    if (q.bosses.some(b => !['wolfKing', 'ancientTree', 'guardian'].includes(b)) || new Set(q.bosses).size !== q.bosses.length) fail();
    state.quests.bosses = q.bosses.slice();
    if (state.won !== q.bosses.includes('guardian')) fail();
    if (p.realm >= 1 && !q.bosses.includes('wolfKing')) fail();
    if (p.realm >= 2 && !q.bosses.includes('ancientTree')) fail();
    if (p.realm >= 3 && !q.bosses.includes('guardian')) fail();
    if (q.bosses.includes('ancientTree') && (!q.bosses.includes('wolfKing') || p.realm < 1)) fail();
    if (q.bosses.includes('guardian') && (!q.bosses.includes('ancientTree') || p.realm < 2)) fail();
    if (q.kills < q.bosses.length || p.weapon > Math.min(6, 2 + p.realm * 2)) fail();
    if (!Array.isArray(data.questRewards) || data.questRewards.some(k => !['firstHunt', 'herbalist', 'veteran'].includes(k)) || new Set(data.questRewards).size !== data.questRewards.length) fail();
    state.questRewards = data.questRewards.slice();
    if ((state.questRewards.includes('firstHunt') && q.kills < 5) || (state.questRewards.includes('veteran') && q.kills < 15) || (state.questRewards.includes('herbalist') && q.herbs < 6)) fail();
    state.meditationCd = number(data.meditationCd, 0, 60);
    if (!Array.isArray(data.enemies) || data.enemies.length !== state.enemies.length) fail();
    for (let i = 0; i < state.enemies.length; i++) {
      const e = state.enemies[i], v = data.enemies[i];
      if (!v || v.id !== e.id || v.type !== e.type) fail();
      e.x = number(v.x, 0, WIDTH); e.y = number(v.y, 0, HEIGHT); e.hp = number(v.hp, 0, e.maxHp);
      ['hit', 'attackTimer', 'cooldown', 'respawn', 'stun'].forEach(k => { e[k] = number(v[k], k === 'respawn' ? -1e9 : 0, k === 'respawn' ? 65 : 20); });
      e.phase = number(v.phase, 0, 1e8, true); e.patrol = number(v.patrol, 0, 1e9);
      e.attackX = number(v.attackX, 0, WIDTH); e.attackY = number(v.attackY, 0, HEIGHT);
      e.facing = number(v.facing, -Math.PI * 2, Math.PI * 2);
      if (!['patrol', 'chase', 'windup', 'return'].includes(v.mode)) fail();
      e.mode = v.mode; e.gated = e.boss && p.realm < ENEMY[e.type].realm;
      e.telegraph = e.mode === 'windup' ? e.attackTimer : 0;
      if (e.boss && (e.hp <= 0) !== q.bosses.includes(e.type)) fail();
      if (e.mode === 'windup' && e.hp > 0) {
        effect(state, 'warning', e.attackX, e.attackY, Math.max(0.01, e.attackTimer), e.boss ? 135 : 55, { sourceId: e.id, color: '#dca478' });
      }
    }
    if (!Array.isArray(data.nodes) || data.nodes.length !== state.nodes.length) fail();
    data.nodes.forEach((v, i) => { if (!v || v.id !== state.nodes[i].id || v.type !== state.nodes[i].type) fail(); state.nodes[i].ready = number(v.ready, 0, 95); });
    if (!Array.isArray(data.projectiles) || data.projectiles.length > 200) fail();
    state.projectiles = data.projectiles.map(v => {
      if (!v || !['enemy', 'player'].includes(v.owner)) fail();
      if ((v.owner === 'enemy' && !state.enemies.some(e => e.id === v.sourceId)) || (v.owner === 'player' && v.sourceId !== 'player')) fail();
      return { x: number(v.x, 0, WIDTH), y: number(v.y, 0, HEIGHT), vx: number(v.vx, -600, 600), vy: number(v.vy, -600, 600),
        life: number(v.life, 0, 4), radius: number(v.radius, 1, 30), owner: v.owner, sourceId: v.sourceId, damage: number(v.damage, 0, 250) };
    });
    if (!Array.isArray(data.drops) || data.drops.length > 100) fail();
    state.drops = data.drops.map(v => {
      if (!v || !['stones', 'herbs', 'potions'].includes(v.type)) fail();
      return { x: number(v.x, 0, WIDTH), y: number(v.y, 0, HEIGHT), type: v.type, amount: number(v.amount, 1, 1000, true) };
    });
    if (!Array.isArray(data.logs) || data.logs.length > 6 || data.logs.some(v => typeof v !== 'string' || v.length > 200)) fail();
    state.logs = data.logs.slice();
    return state;
  }

  function deserialize(json){
    const fail=()=>{throw new Error('存档无效或不兼容，请选择有效的山海问剑存档。');};
    if(typeof json!=='string'||json.length>1500000)fail();let d;try{d=JSON.parse(json);}catch(_){fail();}
    if(!d||typeof d!=='object')fail();if(d.version===1)return expand(deserializeV1(json),true);if(d.version!==2)fail();
    const num=(v,lo,hi,integer=false)=>{if(!finite(v)||v<lo||v>hi||integer&&!Number.isInteger(v))fail();return v;};
    const bool=v=>{if(typeof v!=='boolean')fail();return v;};
    const object=v=>{if(!v||typeof v!=='object'||Array.isArray(v))fail();return v;};
    const ids=(v,allowed,max=allowed.length)=>{if(!Array.isArray(v)||v.length>max||v.some(k=>!allowed.includes(k))||new Set(v).size!==v.length)fail();return v.slice();};
    const s=createGame(num(d.seed,1,4294967295,true));s.rng=num(d.rng,1,4294967295,true);s.time=num(d.time,0,1e9);
    if(!CONTENT.MAPS[d.mapId])fail();s.mapId=d.mapId;
    const r=object(d.root);if(!CONTENT.ROOT_GRADES[r.grade])fail();s.root={grade:r.grade,elements:ids(r.elements,Object.keys(CONTENT.ELEMENTS),2),legacy:bool(r.legacy)};
    if(!s.root.elements.length||s.root.legacy&&(s.root.grade!=='mortal'||s.root.elements.length!==1||s.root.elements[0]!=='metal'))fail();
    s.techniques={};for(const [id,level]of Object.entries(object(d.techniques))){if(!CONTENT.TECHNIQUES[id])fail();s.techniques[id]=num(level,1,3,true);}if(!s.techniques.sword||!s.techniques[d.activeTechnique])fail();s.activeTechnique=d.activeTechnique;
    s.inventory={};for(const [id,count]of Object.entries(object(d.inventory))){const item=CONTENT.ITEMS[id];if(!item||item.resourceField)fail();s.inventory[id]=num(count,0,1e7,true);}if(!s.inventory.starterSword||!s.inventory.clothRobe)fail();
    const eq=object(d.equipment);s.equipment={};for(const slot of ['weapon','robe','charm']){const id=eq[slot];if(id===null){if(slot!=='charm')fail();s.equipment[slot]=null;}else{const item=CONTENT.ITEMS[id];if(!item||item.slot!==slot||!s.inventory[id])fail();s.equipment[slot]=id;}}
    if(!Array.isArray(d.buffs)||d.buffs.length>3)fail();s.buffs=d.buffs.map(b=>{if(!b||!['rage','ward','insight'].includes(b.type))fail();return{type:b.type,life:num(b.life,0,{rage:40,ward:45,insight:60}[b.type])};});if(new Set(s.buffs.map(b=>b.type)).size!==s.buffs.length)fail();
    const p=object(d.player);s.player.realm=num(p.realm,0,3,true);s.player.weapon=num(p.weapon,0,6,true);if(s.player.weapon>Math.min(6,2+s.player.realm*2))fail();
    if(Object.values(s.techniques).includes(3)&&s.player.realm<1)fail();if(s.player.realm<CONTENT.MAPS[s.mapId].realmRequired)fail();
    const st=stats(s);s.player.x=num(p.x,43,WIDTH-43);s.player.y=num(p.y,43,HEIGHT-43);if(blocked(p.x,p.y,17,s))fail();
    s.player.hp=num(p.hp,0,st.maxHp);s.player.mp=num(p.mp,0,st.maxMp);
    for(const id of [...Object.keys(CONTENT.RESOURCES),'potions'])s.player[id]=num(p[id],0,1e8,true);s.player.xp=num(p.xp,0,1e8);
    s.player.facing=num(p.facing,-Math.PI*2,Math.PI*2);for(const id of ['attackCd','skillCd','dashCd','invuln','hit','dashTime','shieldTime','slow'])s.player[id]=num(p[id],0,20);
    s.player.shield=num(p.shield,0,st.maxHp*2);s.player.dashX=num(p.dashX,-1,1);s.player.dashY=num(p.dashY,-1,1);s.player.moving=!!p.moving;
    s.dead=bool(d.dead);s.won=bool(d.won);if(s.dead!==(s.player.hp<=0))fail();s.meditationCd=num(d.meditationCd,0,60);
    const q=object(d.quests);s.quests={kills:num(q.kills,0,1e7,true),herbs:num(q.herbs,0,1e7,true),bosses:ids(q.bosses,['wolfKing','ancientTree','guardian'])};
    if(s.won!==s.quests.bosses.includes('guardian')||s.quests.kills<s.quests.bosses.length)fail();
    if(s.player.realm>=1&&!s.quests.bosses.includes('wolfKing')||s.player.realm>=2&&!s.quests.bosses.includes('ancientTree')||s.player.realm>=3&&!s.quests.bosses.includes('guardian'))fail();
    if(s.quests.bosses.includes('ancientTree')&&(!s.quests.bosses.includes('wolfKing')||s.player.realm<1)||s.quests.bosses.includes('guardian')&&(!s.quests.bosses.includes('ancientTree')||s.player.realm<2))fail();
    s.questRewards=ids(d.questRewards,['firstHunt','herbalist','veteran']);if(s.questRewards.includes('firstHunt')&&q.kills<5||s.questRewards.includes('veteran')&&q.kills<15||s.questRewards.includes('herbalist')&&q.herbs<6)fail();
    const progress=object(d.progress);s.progress={visited:ids(progress.visited,Object.keys(CONTENT.MAPS)),bosses:ids(progress.bosses,Object.keys(ENEMY).filter(k=>ENEMY[k].realm!==undefined)),gathered:{},claims:ids(progress.claims,Object.keys(CONTENT.SIDE_QUESTS))};
    if(!s.progress.visited.includes('main')||!s.progress.visited.includes(s.mapId)||s.quests.bosses.some(b=>!s.progress.bosses.includes(b)))fail();
    if(s.progress.visited.some(id=>CONTENT.MAPS[id].realmRequired>s.player.realm)||s.progress.bosses.some(id=>ENEMY[id].realm>s.player.realm))fail();
    for(const [id,count]of Object.entries(object(progress.gathered))){if(!CONTENT.RESOURCES[id])fail();s.progress.gathered[id]=num(count,0,1e8,true);}
    const trials=object(d.trials);s.trials={};for(const id of Object.keys(CONTENT.TRIAL_REWARDS)){const t=object(trials[id]);s.trials[id]={wave:num(t.wave,1,3,true),cleared:bool(t.cleared),clears:num(t.clears,0,1e7,true),rewarded:bool(t.rewarded)};if(t.rewarded!==(t.clears>0)||t.cleared&&(t.wave!==3||t.clears<1))fail();const boss=CONTENT.MAPS[id].spawns.find(v=>v[3]===3)[0];if(t.rewarded&&(!s.progress.visited.includes(id)||!s.progress.bosses.includes(boss)))fail();}
    const story=object(d.story);s.story.chapter=num(story.chapter,0,CONTENT.STORY.length,true);s.story.completed=ids(story.completed,CONTENT.STORY.map(c=>c.id));if(s.story.completed.length!==s.story.chapter||s.story.completed.some((id,i)=>id!==CONTENT.STORY[i].id))fail();
    s.story.choices={};s.story.relations={mercy:0,wisdom:0,valor:0};if(Object.keys(object(story.choices)).length!==s.story.chapter)fail();
    if(!Array.isArray(story.journal)||story.journal.length!==s.story.chapter)fail();s.story.journal=[];
    for(let i=0;i<s.story.chapter;i++){const c=CONTENT.STORY[i],choice=c.options.find(o=>o.id===story.choices[c.id]);if(!choice)fail();s.story.choices[c.id]=choice.id;s.story.relations[choice.relation]++;const journal=object(story.journal[i]);if(journal.chapter!==c.id)fail();s.story.journal.push({chapter:c.id,title:c.title,text:`${c.text}\n你的选择：${choice.label}。${choice.description}`,time:num(journal.time,0,s.time)});}
    const completedChapter=s.story.chapter;for(let i=0;i<completedChapter;i++){s.story.chapter=i;if(!storyInfo(s).ready)fail();}s.story.chapter=completedChapter;
    const savedWorlds=object(d.worlds);if(Object.keys(savedWorlds).length!==s.progress.visited.length||Object.keys(savedWorlds).some(id=>!s.progress.visited.includes(id)))fail();s.worlds={};
    function loadDrops(v){if(!Array.isArray(v)||v.length>100)fail();return v.map(b=>{if(!b||!Object.keys(CONTENT.RESOURCES).concat('potions').includes(b.type))fail();return{x:num(b.x,0,WIDTH),y:num(b.y,0,HEIGHT),type:b.type,amount:num(b.amount,1,1000,true)};});}
    for(const mapId of s.progress.visited){const saved=object(savedWorlds[mapId]),world=makeWorld(mapId);if(!Array.isArray(saved.enemies)||saved.enemies.length!==world.enemies.length||!Array.isArray(saved.nodes)||saved.nodes.length!==world.nodes.length)fail();
      world.enemies.forEach((e,i)=>{const v=object(saved.enemies[i]);if(v.id!==e.id||v.type!==e.type||v.wave!==e.wave||v.maxHp!==e.maxHp)fail();e.x=num(v.x,0,WIDTH);e.y=num(v.y,0,HEIGHT);e.hp=num(v.hp,0,e.maxHp);for(const id of ['hit','attackTimer','cooldown','stun','burn','burnTick','slow','rooted'])e[id]=num(v[id],0,20);e.burnDamage=num(v.burnDamage,0,10000);e.respawn=num(v.respawn,-1e9,65);e.phase=num(v.phase,0,1e8,true);e.patrol=num(v.patrol,0,1e9);e.attackX=num(v.attackX,0,WIDTH);e.attackY=num(v.attackY,0,HEIGHT);e.facing=num(v.facing,-Math.PI*2,Math.PI*2);if(!['patrol','chase','windup','return'].includes(v.mode))fail();e.mode=v.mode;e.telegraph=e.mode==='windup'?e.attackTimer:0;
        if(e.boss&&CONTENT.MAPS[mapId].type==='overworld'&&(e.hp<=0)!==s.progress.bosses.includes(e.type))fail();
      });
      saved.nodes.forEach((v,i)=>{if(!v||v.id!==world.nodes[i].id||v.type!==world.nodes[i].type)fail();world.nodes[i].ready=num(v.ready,0,120);});world.drops=loadDrops(saved.drops);s.worlds[mapId]=world;
    }
    const current=s.worlds[s.mapId];s.enemies=current.enemies;s.nodes=current.nodes;s.drops=current.drops;
    if(!Array.isArray(d.projectiles)||d.projectiles.length>200)fail();s.projectiles=d.projectiles.map(v=>{
      if(!v||!['enemy','player'].includes(v.owner)||v.owner==='player'&&v.sourceId!=='player'||v.owner==='enemy'&&!s.enemies.some(e=>e.id===v.sourceId))fail();
      const b={x:num(v.x,0,WIDTH),y:num(v.y,0,HEIGHT),vx:num(v.vx,-1000,1000),vy:num(v.vy,-1000,1000),life:num(v.life,0,5),radius:num(v.radius,1,35),owner:v.owner,sourceId:v.sourceId,damage:num(v.damage,0,10000)};
      if(v.element!==undefined){if(!CONTENT.ELEMENTS[v.element])fail();b.element=v.element;if(v.color!==undefined&&(typeof v.color!=='string'||!/^#[0-9a-f]{6}$/i.test(v.color)))fail();b.color=v.color||CONTENT.ELEMENTS[v.element].color;}
      if(v.status!==undefined){if(!['burn','slow','root'].includes(v.status))fail();b.status=v.status;b.statusLife=num(v.statusLife,0,20);if(v.statusDamage!==undefined)b.statusDamage=num(v.statusDamage,0,10000);}
      if(v.explosion!==undefined)b.explosion=num(v.explosion,0,300);if(v.pierce!==undefined)b.pierce=num(v.pierce,0,5,true);if(v.hits!==undefined)b.hits=ids(v.hits,s.enemies.map(e=>e.id),5);return b;
    });
    if(!Array.isArray(d.logs)||d.logs.length>6||d.logs.some(v=>typeof v!=='string'||v.length>200))fail();s.logs=d.logs.slice();s.effects=[];s.interaction=null;s.lastAction=null;
    updateGates(s);for(const e of s.enemies)if(e.hp>0&&e.mode==='windup')effect(s,'warning',e.attackX,e.attackY,Math.max(.01,e.attackTimer),e.boss?135:55,{sourceId:e.id,color:'#dca478'});
    for(const id of s.progress.claims){const entry=questsInfo(s).find(q=>q.id===id);if(entry.progress<entry.target)fail();}
    return s;
  }

  return { createGame, step, interact, action, serialize, deserialize, stats, objective, zoneAt,
    mapInfo,isSafe,rootInfo,techniqueInfo,storyInfo,questsInfo,inventoryInfo,CONTENT,
    WIDTH, HEIGHT, HUB, PONDS, OBSTACLES, REALMS, NPCS, ENEMY };
});
