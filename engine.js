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
    { realmName: '元婴', maxHp: 430, maxMp: 210, attack: 76, speed: 290, xpNeeded: 3200 },
    { realmName: '化神', maxHp: 600, maxMp: 265, attack: 106, speed: 300, xpNeeded: 5200 },
    { realmName: '炼虚', maxHp: 800, maxMp: 320, attack: 142, speed: 305, xpNeeded: 7800 },
    { realmName: '合体', maxHp: 1040, maxMp: 385, attack: 188, speed: 310, xpNeeded: 11000 },
    { realmName: '大乘', maxHp: 1320, maxMp: 455, attack: 240, speed: 320, xpNeeded: 0 }
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
  Object.assign(ENEMY,{
    sectWolf:{...ENEMY.wolf,name:'山海凶兽',hp:240,damage:18,xp:35,stones:10,skin:'wolf',element:'wind'},
    sectSpirit:{...ENEMY.spirit,name:'侵脉妖灵',hp:260,damage:21,xp:40,stones:12,skin:'spirit',element:'thunder'},
    sectGolem:{...ENEMY.golem,name:'镇塔石卫',hp:400,damage:26,xp:45,stones:14,skin:'golem',element:'earth'},
    sectSentinel:{...ENEMY.guardian,name:'镇妖塔主',hp:3400,damage:30,xp:120,stones:40,realm:0,skin:'guardian',element:'thunder',style:'ice'},
    sectBounty:{...ENEMY.wolfKing,name:'悬赏妖修',hp:1200,damage:23,xp:100,stones:25,realm:0,skin:'wolf',element:'fire',style:'flame'}
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
    if(state&&state.activity&&!requestedId){const a=state.activity,source=CONTENT.MAPS[a.mapId];return{...source,id:'activity:'+a.type,sourceMapId:a.mapId,name:CONTENT.ACTIVITIES[a.type].name,type:'activity',hub:{x:500,y:1800,radius:0},safeAreas:[],ponds:[],obstacles:[],start:{x:1550,y:1400},arena:{x:1700,y:1200,radius:500},npcs:[],portals:[],activity:activityInfo(state),crystal:a.crystal||null,unlocked:true,visited:true,trial:null};}
    return state ? {...m,unlocked:state.player.realm>=m.realmRequired,visited:!!state.progress&&state.progress.visited.includes(m.id),trial:state.trials&&state.trials[m.id]||null} : m;
  }

  function isSafe(state) { const m=mapInfo(state),h=m.hub;return m.type==='sect'||Math.hypot(state.player.x-h.x,state.player.y-h.y)<h.radius; }

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
    const gradeIndex=t.gradeIndex||0,grade=Object.values(CONTENT.TECHNIQUE_GRADES).find(g=>g.index===gradeIndex);
    const preferredWeapon=t.preferredWeapon||'staff',weaponCompatible=weaponInfo(state).kind===preferredWeapon,weaponBonus=weaponCompatible?1.15:1;
    const blessings=state.activity&&state.activity.blessings||{blade:0,spirit:0};
    const learnRequirements=(t.requiredTrials||[]).map(id=>CONTENT.MAPS[id].name+'首通'),baseReason=state.dead?'先重聚灵身。':!isSafe(state)?'请返回安全驿站。':level?'已习得此法。':state.player.realm<t.requiredRealm?`需要${REALMS[t.requiredRealm].realmName}境。`:(t.requiredTrials||[]).some(id=>!state.trials[id].rewarded)?'需完成 '+learnRequirements.join('、')+'。':'';
    const learnReason=baseReason||!(state.inventory[id+'Book']>0)&&'缺少对应经卷。'||'',acquireReason=baseReason||sectReason(state)||state.inventory[id+'Book']>0&&'背包已有此经卷。'||!canPay(state,t.acquireCost||{})&&'需要 '+costText(t.acquireCost)+'。'||'';
    const comboElement=t.element==='ice'?'water':Object.keys(GENERATES).includes(t.element)?t.element:null,comboReady=!!comboElement&&state.combo&&state.combo.until>state.time&&GENERATES[state.combo.element]===comboElement;
    return {...t,level,known:level>0,maxLevel:3,affinity,multiplier:(1+affinity)*(1+Math.max(0,level-1)*.22)*grade.multiplier*weaponBonus*(1+blessings.blade*.08),manaCost:Math.max(12,Math.floor((t.manaCost-(direct&&!r.legacy?2:0))*(1-grade.manaReduction))),cooldown:Math.max(3,(t.cooldown-Math.max(0,level-1)*.4)*(1-grade.cooldownReduction)*(1-blessings.spirit*.06)),trainCost:level===1?{stones:45,[t.resource]:3,herbs:2}:{stones:110,[t.resource]:6,core:2},trainRealm:level>=2?1:0,grade:grade.id,gradeName:grade.name,gradeColor:grade.color,gradeIndex,gradeMultiplier:grade.multiplier,preferredWeapon,weaponCompatible,weaponBonus,comboElement,comboReady,comboMultiplier:comboReady?1.25:1,learnRealm:t.requiredRealm,learnRequirements,canLearn:!learnReason,learnReason,canAcquire:!acquireReason,acquireReason,source:t.acquisition,canPromote:false,promoteReason:'功法品阶由经卷固定，不能提升品阶。',promoteCost:null};
  }

  function weaponInfo(state){const itemId=state.equipment&&state.equipment.weapon||'starterSword',item=CONTENT.ITEMS[itemId],kind=item.weaponKind||'sword',type=CONTENT.WEAPON_TYPES[kind];return{...type,id:kind,itemId,name:item.name,kind,compatibleTechniques:Object.values(CONTENT.TECHNIQUES).filter(t=>t.preferredWeapon===kind).map(t=>t.id)};}

  function cultivationInfo(state){
    const index=state.player.realm,terminal=index>=REALMS.length-1,requirements=[],cost=index>=3?{stones:[180,300,450,700][index-3],core:[3,4,6,8][index-3],essence:[2,3,4,6][index-3]}:{};
    if(!terminal&&index<3){const boss=['wolfKing','ancientTree','guardian'][index];requirements.push({id:boss,label:`击败${ENEMY[boss].name}`,current:state.quests.bosses.includes(boss)?1:0,target:1,met:state.quests.bosses.includes(boss)});}
    if(!terminal&&index===3)requirements.push({id:'tower',label:'镇妖塔五层首通',current:state.sect.towerBest,target:5,met:state.sect.towerBest>=5});
    if(!terminal&&index>=4)requirements.push({id:'tribulation',label:`完成第 ${index-3} 重雷劫`,current:state.sect.tribulationBest,target:index-3,met:state.sect.tribulationBest>=index-3});
    let reason=terminal?'已达大乘境。':state.dead?'先重聚灵身。':!isSafe(state)?'请在安全驿站或宗门修行。':requirements.some(r=>!r.met)?requirements.find(r=>!r.met).label:state.player.xp<REALMS[index].xpNeeded?`修为需要 ${REALMS[index].xpNeeded}，当前 ${Math.floor(state.player.xp)}。`:!canPay(state,cost)?'破境需要 '+costText(cost)+'。':'';
    return{realmIndex:index,realmName:REALMS[index].realmName,nextRealmName:terminal?null:REALMS[index+1].realmName,xp:state.player.xp,xpNeeded:REALMS[index].xpNeeded,maxRealm:terminal,maxRealmIndex:REALMS.length-1,realmCount:REALMS.length,requirements,ready:!reason,reason,cost,unlocks:Object.values(CONTENT.ACTIVITIES).filter(m=>m.realmRequired===index+1).map(m=>({id:m.id,name:m.name,description:m.description}))};
  }

  function promotionInfo(state,id,target){
    const t=CONTENT.TECHNIQUES[id],grade=Object.values(CONTENT.TECHNIQUE_GRADES).find(g=>g.index===target);
    if(!grade)return{promoteCost:null,promoteRealm:null,promoteRequirements:[],canPromote:false,promoteReason:'此法已至仙阶圆满。'};
    const cost={stones:[0,35,90,180,320][target]};cost[t.resource]=(cost[t.resource]||0)+[0,2,4,6,10][target];
    if(target===1)cost.herbs=2;if(target>=2)cost.core=[0,0,1,2,4][target];if(target>=3)cost.essence=(cost.essence||0)+[0,0,0,2,4][target];
    const requirements=[`${grade.levelRequired} 重功法`,`${REALMS[grade.realmRequired].realmName}境`,...grade.trialsRequired.map(id=>`${CONTENT.MAPS[id].name}首次通关`)];
    let reason='';if(!state.techniques||!state.techniques[id])reason='先习得这门功法。';
    else if(state.techniques[id]<grade.levelRequired)reason=`需将此法研习至 ${grade.levelRequired} 重。`;
    else if(state.player.realm<grade.realmRequired)reason=`需达到${REALMS[grade.realmRequired].realmName}境。`;
    else{const missing=grade.trialsRequired.find(id=>!state.trials||!state.trials[id].rewarded);if(missing)reason=`需完成${CONTENT.MAPS[missing].name}首次通关。`;}
    if(!reason&&state.dead)reason='先重聚灵身。';if(!reason&&!isSafe(state))reason='晋阶须在安全驿站进行。';if(!reason&&!canPay(state,cost))reason='材料不足，需要 '+costText(cost)+'。';
    return{promoteCost:cost,promoteRealm:grade.realmRequired,promoteRequirements:requirements,canPromote:!reason,promoteReason:reason};
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
    const r = REALMS[clamp(Math.floor(state.player.realm), 0, REALMS.length-1)];
    const growth=state.root?CONTENT.ROOT_GRADES[state.root.grade].growth:1;
    const s={...r,maxHp:Math.round(r.maxHp*growth),maxMp:Math.round(r.maxMp*growth),attack:r.attack+state.player.weapon*4,defense:0,manaRegen:0};
    for(const item of Object.values(state.equipment||{})){const eq=CONTENT.ITEMS[item];if(eq&&eq.stats)for(const [k,v]of Object.entries(eq.stats))s[k]=(s[k]||0)+v;}
    const directions={};for(const[id,level]of Object.entries(state.techniques||{})){const t=CONTENT.TECHNIQUES[id];if(t){const key=t.baseId||id;if(!directions[key]||level>directions[key].level)directions[key]={t,level};}}
    for(const{t,level}of Object.values(directions))if(level>1){const bonus=(level-1)*({attack:2,maxMp:6,maxHp:10,speed:4,defense:1}[t.passive]||0);s[t.passive]=(s[t.passive]||0)+bonus;}
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
    state.version=4;state.mapId='main';state.worlds={};state.progress={visited:['main'],bosses:state.quests.bosses.slice(),gathered:{},claims:[]};
    state.trials={};for(const m of Object.values(CONTENT.MAPS))if(m.type==='trial')state.trials[m.id]={wave:1,cleared:false,clears:0,rewarded:false};
    let n=(state.seed^0x9e3779b9)>>>0;n^=n<<13;n^=n>>>17;n^=n<<5;const pick=(n>>>0)%100;
    let grade='mortal',sum=0;for(const g of Object.values(CONTENT.ROOT_GRADES)){sum+=g.weight;if(pick<sum){grade=g.id;break;}}
    const elements=Object.keys(CONTENT.ELEMENTS),first=elements[(state.seed>>>0)%8],second=elements[((state.seed>>>3)+3)%8];
    state.root={grade:legacy?'mortal':grade,elements:legacy?['metal']:[first,...(second!==first&&state.seed%3===0?[second]:[])],legacy:!!legacy};
    state.techniques={sword:1};state.techniqueGrades={sword:0};state.npcProgress={};state.activeTechnique='sword';state.inventory={starterSword:1,clothRobe:1};state.equipment={weapon:'starterSword',robe:'clothRobe',charm:null};state.buffs=[];
    state.story={chapter:0,choices:{},completed:[],journal:[],relations:{mercy:0,wisdom:0,valor:0}};
    for(const key of ['iron','spiritwood','ember','frost','core','essence'])state.player[key]=0;
    state.player.shield=0;state.player.shieldTime=0;state.player.slow=0;
    initializeNewSystems(state);
    const world=makeWorld('main');
    if(legacy){state.enemies=state.enemies.map((e,i)=>({...world.enemies[i],...e,burn:0,burnDamage:0,burnTick:0,slow:0,rooted:0}));state.nodes.push(...world.nodes.slice(state.nodes.length));}
    else{state.enemies=world.enemies;state.nodes=world.nodes;const st=stats(state);state.player.hp=st.maxHp;state.player.mp=st.maxMp;}
    state.worlds.main={enemies:state.enemies,nodes:state.nodes,drops:state.drops};
    return state;
  }

  function createGame(seed=123){return expand(createLegacy(seed),false);}

  function gainXp(state,value){const bonus=state.root?CONTENT.ROOT_GRADES[state.root.grade].cultivation:1;state.player.xp+=value*bonus*((state.buffs||[]).some(b=>b.type==='insight')?1.3:1);}
  function grant(state,reward){for(const [id,count]of Object.entries(reward)){if(id==='xp')gainXp(state,count);else if(id==='contribution'){state.sect.contribution+=count;state.sect.totalContribution+=count;}else if(id in state.player)state.player[id]+=count;else state.inventory[id]=(state.inventory[id]||0)+count;}}
  function canPay(state,cost){return Object.entries(cost).every(([id,n])=>(id==='contribution'?state.sect.contribution:state.player[id]||0)>=n);}
  function pay(state,cost){for(const [id,n]of Object.entries(cost)){if(id==='contribution')state.sect.contribution-=n;else state.player[id]-=n;}}
  function costText(cost){return Object.entries(cost).map(([id,n])=>`${(CONTENT.RESOURCES[id]||CONTENT.ITEMS[id]||{name:id}).name} ${n}`).join('、');}

  const GENERATES={wood:'fire',fire:'earth',earth:'metal',metal:'water',water:'wood'};
  function initializeNewSystems(state){
    state.sect={joined:false,contribution:0,totalContribution:0,records:{bounty:0,defense:0,tower:0,tribulation:0},towerBest:0,tribulationBest:0,tribulationRanks:[],facilities:{},disciples:{}};
    for(const f of Object.values(CONTENT.SECT_FACILITIES))state.sect.facilities[f.id]={level:0,position:f.position,discipleId:null,progress:0,stored:0};
    for(const d of Object.values(CONTENT.SECT_DISCIPLES))state.sect.disciples[d.id]={recruited:false};
    state.activity=null;state.exploration={claimed:[],records:{}};state.secondaryTechnique=null;state.player.secondaryCd=0;state.combo={element:null,until:0};state.legacyTechniqueIds=[];
  }
  function sectReason(state){return state.dead?'先重聚灵身。':state.activity?'先结束当前历练。':state.mapId!=='sect'||!isSafe(state)?'请返回青云宗大院。':!state.sect.joined?'先加入青云宗。':'';}
  function facilityInfo(state,id){
    const f=CONTENT.SECT_FACILITIES[id],v=state.sect.facilities[id],pos=CONTENT.SECT_POSITIONS[v.position],d=CONTENT.SECT_DISCIPLES[v.discipleId];
    const productionMultiplier=(pos.element===f.preferredElement?1.25:1)*(d?(d.element===pos.element?1.25:GENERATES[d.element]===pos.element?1.15:1):1);
    const duration=f.duration/(productionMultiplier*(1+Math.max(0,v.level-1)*.35));
    const batchReward=Object.fromEntries(Object.entries(f.reward).map(([k,n])=>[k,n*Math.max(1,v.level)]));
    const claimReward=Object.fromEntries(Object.entries(batchReward).map(([k,n])=>[k,n*v.stored]));
    const next=v.level+1,upgradeCost=next<=3?{contribution:[25,60,110][next-1],stones:[35,80,150][next-1],iron:[3,6,10][next-1],spiritwood:[3,5,8][next-1]}:null;
    let upgradeReason=sectReason(state)||next>3&&'设施已至三级。'||v.stored>0&&'请先领取积存成果再升级。'||state.player.realm<next&&`设施${next}级需要${REALMS[next].realmName}境。`||upgradeCost&&!canPay(state,upgradeCost)&&'需要 '+costText(upgradeCost)+'。'||'';
    const claimReason=sectReason(state)||v.stored<1&&'暂无可领取的生产成果。'||'';
    return{...f,...v,maxLevel:3,element:pos.element,duration,capacity:3,batchReward,claimReward,upgradeCost,upgradeRealm:Math.min(3,next),canUpgrade:!upgradeReason,upgradeReason,canClaim:!claimReason,claimReason,positions:Object.values(CONTENT.SECT_POSITIONS),productionMultiplier,producing:v.level>0&&!!v.discipleId&&v.stored<3};
  }
  function sectInfo(state){
    const reason=sectReason(state),inSect=state.mapId==='sect'&&!state.activity,joinReason=state.dead?'先重聚灵身。':!inSect?'前往青云宗加入山门。':state.sect.joined?'你已加入青云宗。':'';
    const rank=state.player.realm>=4?3:state.player.realm>=2?2:state.player.realm>=1?1:0;
    const missions=Object.values(CONTENT.ACTIVITIES).map(m=>{const unlocked=state.player.realm>=m.realmRequired,r=reason||!unlocked&&`需达到${REALMS[m.realmRequired].realmName}境。`||'',rank=m.id==='tribulation'?clamp(state.player.realm-3,1,3):1,first=m.id==='tribulation'?!state.sect.tribulationRanks.includes(rank):state.sect.records[m.id]===0,reward=first?m.id==='tribulation'?{...m.firstReward,xp:[5500,8500,12000][rank-1],core:7+rank,essence:5+rank}:m.firstReward:m.repeatReward;return{...m,unlocked,available:!r,reason:r,rank,reward,clears:state.sect.records[m.id]};});
    const supplies=Object.values(CONTENT.SECT_SUPPLIES).map(s=>{const owned=Object.keys(s.reward).some(id=>CONTENT.ITEMS[id].type==='equipment'&&state.inventory[id]>0),r=reason||state.player.realm<s.realmRequired&&'境界不足。'||owned&&'已经领用此装备。'||!canPay(state,s.cost)&&'需要 '+costText(s.cost)+'。'||'';return{...s,available:!r,reason:r};});
    const disciples=Object.values(CONTENT.SECT_DISCIPLES).map(d=>{const recruited=state.sect.disciples[d.id].recruited,assignedTo=Object.keys(state.sect.facilities).find(id=>state.sect.facilities[id].discipleId===d.id)||null,r=reason||recruited&&'此弟子已经加入。'||state.player.realm<d.realmRequired&&`需要${REALMS[d.realmRequired].realmName}境。`||!canPay(state,d.recruitCost)&&'需要 '+costText(d.recruitCost)+'。'||'';return{...d,recruited,assignedTo,canRecruit:!r,recruitReason:r};});
    return{joined:state.sect.joined,inSect,safe:isSafe(state),canJoin:!joinReason,reason:joinReason,rank,rankName:['记名弟子','内门弟子','真传弟子','山门长老'][rank],contribution:state.sect.contribution,totalContribution:state.sect.totalContribution,missions,supplies,facilities:Object.keys(CONTENT.SECT_FACILITIES).map(id=>facilityInfo(state,id)),disciples};
  }
  function productionStep(state,dt){if(!state.sect.joined||state.dead)return;for(const id of Object.keys(CONTENT.SECT_FACILITIES)){const f=facilityInfo(state,id),v=state.sect.facilities[id];if(!f.producing)continue;v.progress+=dt;while(v.progress>=f.duration&&v.stored<3){v.progress-=f.duration;v.stored++;}if(v.stored>=3)v.progress=0;}}
  function siteInfo(state,id){const s=CONTENT.EXPLORATION_SITES[id];if(!s)return null;const claimed=state.exploration.claimed.includes(id),near=!state.activity&&state.mapId===s.mapId&&distance(s,state.player)<=105,reason=state.dead?'先重聚灵身。':claimed?'此遗迹已经探索。':!near?'请靠近遗迹再探索。':state.player.realm<s.realmRequired?`需要${REALMS[s.realmRequired].realmName}境。`:'';return{...s,claimed,near,available:!reason,reason};}
  function activityInfo(state){
    const a=state.activity;if(!a)return null;const c=CONTENT.ACTIVITIES[a.type];
    const choices=a.phase==='choice'?[{id:'blade',label:'剑意',description:'本次历练道术伤害提高 8%。'},{id:'vital',label:'回元',description:'立即恢复 35% 气血，后续每层恢复 15%。'},{id:'spirit',label:'凝神',description:'本次历练道术冷却缩短 6%，恢复 35% 灵力。'}]:[];
    return{type:a.type,id:a.type,name:c.name,phase:a.phase,stage:a.stage,wave:a.type==='defense'?a.stage:1,maxWaves:a.type==='defense'?3:1,floor:a.type==='tower'?a.stage:1,maxFloors:a.type==='tower'?5:1,rank:a.rank,timeRemaining:a.type==='tribulation'?Math.max(0,a.duration-a.elapsed):null,progress:a.type==='tribulation'?a.elapsed:a.stage-1,target:a.type==='tower'?5:a.type==='defense'?3:a.type==='tribulation'?a.duration:1,objective:c.description,crystal:a.crystal?{...a.crystal}:null,remainingEnemies:state.enemies.filter(e=>e.hp>0).length,choices,completed:a.phase==='complete',failed:a.phase==='failed',canLeave:true,description:a.type==='tower'?`第 ${a.stage}/5 层 · ${['疾行狼群','缠根灵阵','远射妖灵','重甲石卫','镇塔妖主'][a.stage-1]}`:c.description,blessings:{...a.blessings},warnings:a.warnings.map(w=>({...w})),reward:a.reward||null};
  }
  function activityEnemySpec(type,realm,stage){const b=ENEMY[type],scale=type==='sectBounty'?1+(realm-1)*.35:1+realm*.48+(stage-1)*.28;return{...b,hp:Math.round(b.hp*scale),damage:b.damage*(1+realm*.22+(stage-1)*.12),speed:b.speed*(type==='sectWolf'?1.15:1),aggro:2000,range:type==='sectSpirit'?500:b.range};}
  function makeActivityWorld(type,realm,stage){
    let kinds=type==='bounty'?['sectBounty','sectSpirit','sectGolem']:type==='defense'?Array.from({length:stage+2},(_,i)=>['sectWolf','sectSpirit','sectGolem'][(i+stage)%3]):type==='tower'?stage===5?['sectSentinel','sectSpirit','sectWolf']:Array.from({length:stage+2},(_,i)=>stage===1?'sectWolf':stage===2?(i%2?'sectWolf':'sectSpirit'):stage===3?'sectSpirit':'sectGolem'):[];
    return{enemies:kinds.map((kind,i)=>{const angle=i*Math.PI*2/kinds.length-1.5,r=type==='defense'?430:300,x=1700+Math.cos(angle)*r,y=1200+Math.sin(angle)*r,t=activityEnemySpec(kind,realm,stage);return{...enemyAt(kind,x,y,i),id:`activity-${stage}-${i}`,maxHp:t.hp,hp:t.hp,activityEnemy:true,activityRealm:realm,activityStage:stage,wave:stage,zone:'activity',skin:t.skin,archetype:t.skin,element:type==='tower'&&stage===2?'wood':t.element,burn:0,burnDamage:0,burnTick:0,slow:0,rooted:0,gated:false};}),nodes:[],drops:[]};
  }
  function bindActivityWorld(state){const w=state.activity.world;state.enemies=w.enemies;state.nodes=w.nodes;state.drops=w.drops;}
  function startActivity(state,type){
    const m=sectInfo(state).missions.find(m=>m.id===type);if(!m||!m.available)return outcome(state,'sect:mission:'+type,false,m&&m.reason||'未知历练。');
    state.worlds[state.mapId]={enemies:state.enemies,nodes:state.nodes,drops:state.drops};
    const rank=type==='tribulation'?clamp(state.player.realm-3,1,3):1;
    state.activity={type,mapId:m.mapId,realm:state.player.realm,rank,stage:1,phase:'fight',elapsed:0,duration:30+rank*10,nextStrike:1,warnings:[],blessings:{blade:0,vital:0,spirit:0},crystal:type==='defense'?{x:1700,y:1200,maxHp:800+state.player.realm*220,hp:800+state.player.realm*220}:null,world:makeActivityWorld(type,state.player.realm,1),rewarded:false,reward:null};
    bindActivityWorld(state);state.player.x=1550;state.player.y=1400;state.player.invuln=1.5;state.player.dashTime=0;state.projectiles=[];state.effects=[];state.interaction=null;
    return outcome(state,'sect:mission:'+type,true,`${m.name}开始。可随时从宗门面板退出历练。`);
  }
  function leaveActivity(state){
    if(!state.activity)return outcome(state,'activity:leave',false,'当前没有宗门历练。');
    state.activity=null;state.mapId='sect';const w=state.worlds.sect||(state.worlds.sect=makeWorld('sect'));state.enemies=w.enemies;state.nodes=w.nodes;state.drops=w.drops;state.player.x=1600;state.player.y=1800;state.player.dashTime=0;state.player.invuln=1;state.projectiles=[];state.effects=[];state.interaction=null;
    return outcome(state,'activity:leave',true,'已返回青云宗。未完成的历练不发放通关奖励。');
  }
  function completeActivity(state){
    const a=state.activity;if(a.rewarded)return;const c=CONTENT.ACTIVITIES[a.type],count=state.sect.records[a.type];let reward={};
    if(a.type==='tribulation'){const first=!state.sect.tribulationRanks.includes(a.rank);if(first){reward={...c.firstReward,xp:[5500,8500,12000][a.rank-1],core:7+a.rank,essence:5+a.rank};state.sect.tribulationRanks.push(a.rank);state.sect.tribulationBest=Math.max(state.sect.tribulationBest,a.rank);}else if(count<c.rewardLimit*3)reward=c.repeatReward;}
    else reward=count===0?c.firstReward:count<c.rewardLimit?c.repeatReward:{};
    state.sect.records[a.type]++;grant(state,reward);a.reward={...reward};a.rewarded=true;a.phase='complete';a.warnings=[];state.projectiles=[];state.effects=state.effects.filter(e=>e.type!=='warning');log(state,`${c.name}完成。${Object.keys(reward).length?'奖励已收入背包。':'额外奖励已达上限。'}`);
  }
  function advanceActivity(state){const a=state.activity;a.stage++;a.phase='fight';a.world=makeActivityWorld(a.type,a.realm,a.stage);bindActivityWorld(state);state.projectiles=[];state.effects=[];state.player.x=1550;state.player.y=1400;state.player.invuln=1;const s=stats(state);if(a.blessings.vital)state.player.hp=Math.min(s.maxHp,state.player.hp+s.maxHp*.15*a.blessings.vital);}
  function activityStep(state,dt){
    const a=state.activity;if(!a)return;a.world={enemies:state.enemies,nodes:state.nodes,drops:state.drops};if(a.phase!=='fight')return;
    if(state.dead){a.phase='failed';a.warnings=[];state.projectiles=[];state.effects=state.effects.filter(e=>e.type!=='warning');return;}
    if(a.crystal&&a.crystal.hp<=0){a.phase='failed';a.warnings=[];state.projectiles=[];state.effects=state.effects.filter(e=>e.type!=='warning');log(state,'灵脉晶石破碎，守护失败。退出后可重新挑战。');return;}
    if(a.type==='tribulation'){
      a.elapsed+=dt;a.nextStrike-=dt;
      if(a.nextStrike<=0){a.nextStrike=1.5-a.rank*.15;const positions=[{x:state.player.x,y:state.player.y}];for(let i=1;i<a.rank;i++){const ang=random(state)*Math.PI*2,r=70+random(state)*190;positions.push({x:1700+Math.cos(ang)*r,y:1200+Math.sin(ang)*r});}for(const p of positions){const w={x:p.x,y:p.y,remaining:.95,radius:75+a.rank*10};a.warnings.push(w);effect(state,'warning',w.x,w.y,w.remaining,w.radius,{element:'thunder',color:'#d8acef',sourceId:'tribulation'});}}
      for(const w of a.warnings){w.remaining-=dt;if(w.remaining<=0){effect(state,'thunder',w.x,w.y,.5,w.radius,{element:'thunder',color:'#c9b1ef',fromX:w.x+20,fromY:w.y-260});if(distance(w,state.player)<w.radius+18)hurtPlayer(state,stats(state).maxHp*(.17+a.rank*.025),w.x,w.y);}}
      a.warnings=a.warnings.filter(w=>w.remaining>0);if(state.dead){a.phase='failed';a.warnings=[];state.projectiles=[];state.effects=state.effects.filter(e=>e.type!=='warning');}else if(a.elapsed>=a.duration)completeActivity(state);return;
    }
    if(state.enemies.some(e=>e.hp>0))return;
    if(a.type==='defense'&&a.stage<3){advanceActivity(state);log(state,`护脉守护 · 第 ${a.stage}/3 波来袭。`);return;}
    if(a.type==='tower'){if(a.stage>state.sect.towerBest){grant(state,{xp:[600,800,1000,1200,1600][a.stage-1],contribution:15,core:1,essence:1});state.sect.towerBest=a.stage;}if(a.stage<5){a.phase='choice';state.projectiles=[];log(state,'此层已清，请选择祝福后继续登塔。');return;}}
    completeActivity(state);
  }
  function systemsAction(state,id){
    const parts=id.split(':'),[kind,key,arg,last]=parts;
    if(kind==='activity'){
      if(key==='leave'&&parts.length===2)return leaveActivity(state);
      const a=state.activity;if(!a||a.phase!=='choice'||key!=='blessing'||parts.length!==3||!['blade','vital','spirit'].includes(arg))return outcome(state,id,false,'当前不能选择此祝福。');
      a.blessings[arg]++;const s=stats(state);if(arg==='vital')state.player.hp=Math.min(s.maxHp,state.player.hp+s.maxHp*.35);if(arg==='spirit')state.player.mp=Math.min(s.maxMp,state.player.mp+s.maxMp*.35);advanceActivity(state);return outcome(state,id,true,'祝福已生效，下一层开启。');
    }
    if(kind==='site'){const s=(parts.length===2||parts.length===3&&arg==='claim')&&siteInfo(state,key);if(!s||!s.available)return outcome(state,id,false,s&&s.reason||'未知遗迹。');grant(state,s.reward);state.exploration.claimed.push(key);state.exploration.records[key]={time:state.time,mapId:state.mapId};effect(state,'particle',s.x,s.y,.9,12,{color:'#e3ca88'});return outcome(state,id,true,`${s.name}探索完成，收获已收入背包与山海志。`);}
    if(kind==='secondary'){if(parts.length!==2)return outcome(state,id,false,'未知副法。');const reason=state.dead?'先重聚灵身。':!isSafe(state)?'请返回安全驿站。':state.player.realm<1?'筑基后解锁副法。':key!=='none'&&!state.techniques[key]?'尚未习得此法。':key===state.activeTechnique?'主法与副法须不同。':'';if(reason)return outcome(state,id,false,reason);state.secondaryTechnique=key==='none'?null:key;return outcome(state,id,true,key==='none'?'已撤下副法。':`${CONTENT.TECHNIQUES[key].name}已设为副法，按 F 施展。`);}
    if(kind!=='sect')return null;
    if(key==='join'){const s=sectInfo(state);if(!s.canJoin)return outcome(state,id,false,s.reason);state.sect.joined=true;state.sect.disciples.qinghe.recruited=true;grant(state,{trainingBow:1,trainingStaff:1,arrowBook:1,contribution:30});return outcome(state,id,true,'已加入青云宗，获练弓、法杖、穿云残卷与30贡献。同门陆青禾愿协助宗门经营。');}
    if(key==='mission'&&parts.length===3)return startActivity(state,arg);
    const reason=sectReason(state);if(reason)return outcome(state,id,false,reason);
    if(['supply','exchange'].includes(key)&&parts.length===3){const s=sectInfo(state).supplies.find(s=>s.id===arg);if(!s||!s.available)return outcome(state,id,false,s&&s.reason||'未知补给。');pay(state,s.cost);grant(state,s.reward);return outcome(state,id,true,`领用${s.name}。`);}
    if(key==='recruit'&&parts.length===3){const d=sectInfo(state).disciples.find(d=>d.id===arg);if(!d||!d.canRecruit)return outcome(state,id,false,d&&d.recruitReason||'未知弟子。');pay(state,d.recruitCost);state.sect.disciples[arg].recruited=true;return outcome(state,id,true,`${d.name}已加入，五行灵根为${CONTENT.ELEMENTS[d.element].name}。`);}
    const f=CONTENT.SECT_FACILITIES[arg],v=state.sect.facilities[arg];if(!f)return outcome(state,id,false,'未知宗门设施。');
    if(key==='upgrade'&&parts.length===3){const info=facilityInfo(state,arg);if(!info.canUpgrade)return outcome(state,id,false,info.upgradeReason);pay(state,info.upgradeCost);v.level++;return outcome(state,id,true,`${f.name}升至${v.level}级。安排弟子后开始生产。`);}
    if(key==='claim'&&parts.length===3){const info=facilityInfo(state,arg);if(!info.canClaim)return outcome(state,id,false,info.claimReason);grant(state,info.claimReward);v.stored=0;return outcome(state,id,true,`${f.name}积存成果已领取。`);}
    if(key==='position'&&parts.length===4&&CONTENT.SECT_POSITIONS[last]){if(v.position===last)return outcome(state,id,false,'已经位于此方位。');v.position=last;v.progress=0;return outcome(state,id,true,`${f.name}调整至${CONTENT.SECT_POSITIONS[last].label}，本批进度重新开始。`);}
    if(key==='assign'&&parts.length===4){if(last==='none'){v.discipleId=null;v.progress=0;return outcome(state,id,true,'已撤回驻守弟子。');}const d=CONTENT.SECT_DISCIPLES[last];if(!d||!state.sect.disciples[last].recruited)return outcome(state,id,false,'此弟子尚未加入。');if(!v.level)return outcome(state,id,false,'先修建一级设施。');for(const entry of Object.values(state.sect.facilities))if(entry.discipleId===last){entry.discipleId=null;entry.progress=0;}v.discipleId=last;v.progress=0;return outcome(state,id,true,`${d.name}开始照料${f.name}。`);}
    return outcome(state,id,false,'未知宗门操作。');
  }

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
    if(state.activity)return outcome(state,'travel:'+target,false,'先退出当前宗门历练。');
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
    updateGates(state);effect(state,'particle',state.player.x,state.player.y,.7,16,{color:'#c5e4da'});
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

  function npcMeasure(state,commission){
    if(commission.kind==='kills')return state.quests.kills;
    if(commission.kind==='herbs')return state.quests.herbs;
    if(commission.kind==='boss')return state.progress.bosses.includes(commission.boss)?1:0;
    if(commission.kind==='trial')return state.trials[commission.trial].rewarded?1:0;
    return 0;
  }

  function npcInfo(state,id){
    const n=CONTENT.NPC_CHARACTERS[id];if(!n)return null;
    const p=state.npcProgress&&state.npcProgress[id]||{met:false,choice:null,rapport:0,commission:{accepted:false,claimed:false,baseline:0},services:{}};
    const location=!state.activity&&mapInfo(state).npcs.find(npc=>npc.id===id),near=!!location&&distance(location,state.player)<=105;
    const vicinity=state.dead?'先重聚灵身。':!near?`请靠近${n.name}再交谈。`:!isSafe(state)?'请在安全驿站内交谈。':'';
    const choices=n.choices.map(c=>({...c,available:!p.met&&!vicinity,reason:p.met?'首次会面已记入交情，不再重复赠礼。':vicinity}));
    let commission=null;
    if(n.commission){const c=n.commission,record=p.commission,progress=record.accepted?Math.max(0,npcMeasure(state,c)-(c.relative?record.baseline:0)):0;
      const ready=record.accepted&&!record.claimed&&progress>=c.target;
      const reason=vicinity||!p.met&&'先完成首次会面。'||record.claimed&&'委托奖励已经领取。'||!record.accepted&&'尚未接取此委托。'||progress<c.target&&'真实历练进度尚未完成。'||'';
      commission={...c,accepted:record.accepted,claimed:record.claimed,progress:Math.min(c.target,progress),ready,canClaim:ready&&!vicinity,cost:{},reason};
    }
    const services=(n.services||[]).map(service=>{
      const record=p.services[service.id],remaining=record?Math.max(0,service.cooldown-(state.time-record.lastAt)):0;
      let reason=vicinity;if(!reason&&!p.met)reason='先完成首次会面。';if(!reason&&p.rapport<(service.minRapport||0))reason=`交情需要 ${service.minRapport}，首次普通交易或完成委托可增加交情。`;
      if(!reason&&remaining>0)reason=`还需 ${Math.ceil(remaining)} 秒历练时间。`;
      if(!reason&&service.restore&&state.player.hp>=stats(state).maxHp&&state.player.mp>=stats(state).maxMp&&state.player.slow<=0)reason='气血灵力充盈且未受寒，无须诊治。';
      if(!reason&&!canPay(state,service.cost))reason='需要 '+costText(service.cost)+'。';
      return{...service,remaining,available:!reason,reason};
    });
    const guidance=id==='master'?{path:objective(state),sect:state.sect.joined?'宗门任务随筑基、金丹、元婴、化神陆续开启。生产设施需弟子驻守，成果容量三批，记得主动领取。':'可从传送阵前往青云宗加入山门，试用灵弓与法杖。'}:id==='elder'?{technique:`${techniqueInfo(state).name}为固定${techniqueInfo(state).gradeName}，当前${techniqueInfo(state).level}重；研习只提升重数，高阶经卷在宗门藏经换取。`,fit:`当前兵器${weaponInfo(state).name}，${techniqueInfo(state).weaponCompatible?'与主法相契，威力提高15%。':'主法仍可正常施展。'}筑基后选不同副法，木火土金水木相生在6秒内连施可提高后一法威力并返灵。`}:{};
    const consults=Object.entries(guidance).map(([key,description])=>({id:key,label:{path:'请教下一步道途',sect:'请教宗门历练',technique:'请教功法传承',fit:'请教兵器与五行搭配'}[key],description,available:!vicinity,reason:vicinity}));
    return{...n,...(location||{}),dialogue:guidance.path?`“${guidance.path}。宗门另有护脉、镇塔与渡劫历练，修行不会在天门结束。”`:n.dialogue,met:p.met,choice:p.choice,rapport:p.rapport,near,choices,commission,services,consults};
  }

  function npcAction(state,id){
    const bits=id.split(':');if(bits[0]!=='npc')return null;
    const [,npcId,kind,key]=bits,info=npcInfo(state,npcId),n=CONTENT.NPC_CHARACTERS[npcId];
    if(!info)return outcome(state,id,false,'此处没有这位人物。');
    if(state.dead||!info.near||!isSafe(state))return outcome(state,id,false,state.dead?'先重聚灵身。':!info.near?`请靠近${info.name}再交谈。`:'请在安全驿站内交谈。');
    if(!['talk','accept','claim','service','consult'].includes(kind)||bits.length!==((kind==='talk'||kind==='service'||kind==='consult')?4:3))return outcome(state,id,false,'未知人物互动。');
    if(kind==='consult'){const c=info.consults.find(c=>c.id===key);return outcome(state,id,!!c,c?`${n.name}：${c.description}`:'无此请教内容。');}
    const previous=state.npcProgress[npcId];
    const p=previous||{met:false,choice:null,rapport:0,commission:{accepted:false,claimed:false,baseline:0},services:{}};
    if(kind==='talk'){
      const c=info.choices.find(c=>c.id===key);if(!c||!c.available)return outcome(state,id,false,c&&c.reason||'无此会面选择。');
      grant(state,c.reward);p.met=true;p.choice=c.id;p.rapport=c.rapport;state.npcProgress[npcId]=p;
      return outcome(state,id,true,`${n.name}：${c.description}`);
    }
    if(!p.met)return outcome(state,id,false,'先完成首次会面，再接委托或交易。');
    if(kind==='accept'){
      if(!n.commission)return outcome(state,id,false,'这位人物没有未接取的委托。');
      if(p.commission.accepted)return outcome(state,id,false,p.commission.claimed?'此委托已完成。':'已经接取此委托。');
      p.commission={accepted:true,claimed:false,baseline:n.commission.relative?npcMeasure(state,n.commission):0};
      return outcome(state,id,true,`已接取${n.commission.name}。${n.commission.description}`);
    }
    if(kind==='claim'){
      if(!info.commission||!info.commission.canClaim)return outcome(state,id,false,info.commission&&info.commission.reason||'没有可以交付的委托。');
      grant(state,n.commission.reward);p.commission.claimed=true;p.rapport=Math.min(10,p.rapport+2);
      return outcome(state,id,true,`${n.name}的委托已完成，奖励收入背包，交情 +2。`);
    }
    const service=info.services.find(s=>s.id===key);if(!service||!service.available)return outcome(state,id,false,service&&service.reason||'无此服务。');
    pay(state,service.cost);grant(state,service.reward);
    if(service.restore){const st=stats(state);state.player.hp=Math.min(st.maxHp,state.player.hp+st.maxHp*service.restore.hpPercent);state.player.mp=Math.min(st.maxMp,state.player.mp+st.maxMp*service.restore.mpPercent);if(service.restore.clearSlow)state.player.slow=0;effect(state,'heal',state.player.x,state.player.y,.8,60,{color:n.color});}
    const record=p.services[key];if(!record)p.rapport=Math.min(10,p.rapport+1);p.services[key]={uses:(record?record.uses:0)+1,lastAt:state.time};
    return outcome(state,id,true,`${n.name}已完成${service.label}。`);
  }

  function expandedAction(state,id){
    const [kind,key]=id.split(':');if(!['travel','learn','train','technique','use','equip','craft','buy','story','claim','promote','acquire'].includes(kind)||!key)return null;
    if(kind==='travel')return travel(state,key);
    if(state.dead)return outcome(state,id,false,'灵身已散，先重聚灵身。');
    if(['learn','train','equip','craft','buy','story','claim','technique','promote','acquire'].includes(kind)&&!isSafe(state))return outcome(state,id,false,'请返回安全驿站后进行此操作。');
    if(kind==='promote'){
      return outcome(state,id,false,'功法品阶由经卷固定，不能提升品阶。请获取另一门高阶功法。');
    }
    if(kind==='acquire'){const info=techniqueInfo(state,key);if(!info||!info.canAcquire)return outcome(state,id,false,info&&info.acquireReason||'未知传承。');pay(state,info.acquireCost);grant(state,{[key+'Book']:1});return outcome(state,id,true,`已换得${info.name}经卷，可研读习得。`);}
    if(kind==='technique'){if(!state.techniques[key])return outcome(state,id,false,'尚未习得此功法。');state.activeTechnique=key;if(state.secondaryTechnique===key)state.secondaryTechnique=null;return outcome(state,id,true,`已运转${CONTENT.TECHNIQUES[key].name}，按 Q 施展。`);}
    if(kind==='learn'){
      const t=CONTENT.TECHNIQUES[key],book=key+'Book';if(!t)return outcome(state,id,false,'不存在这门功法。');
      const info=techniqueInfo(state,key);if(!info.canLearn)return outcome(state,id,false,info.learnReason);
      state.inventory[book]--;state.techniques[key]=1;state.techniqueGrades[key]=t.gradeIndex;return outcome(state,id,true,`研读经卷，习得${t.name}${t.gradeName}一重。`);
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
    if(state&&state.activity&&Math.hypot(x-1700,y-1200)>500-radius)return true;
    for (const p of mapInfo(state||'main').ponds) {
      if (((x - p.x) / (p.rx + radius)) ** 2 + ((y - p.y) / (p.ry + radius)) ** 2 < 1) return true;
    }
    return mapInfo(state||'main').obstacles.some(o => Math.hypot(x - o.x, y - o.y) < o.radius + radius);
  }

  function move(state, entity, dx, dy, radius, avoidHub) {
    const hub=mapInfo(state).hub;
    const pieces = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 14));
    for (let i = 0; i < pieces; i++) {
      const nx = entity.x + dx / pieces, ny = entity.y + dy / pieces;
      const legal = (x, y) => !blocked(x, y, radius, state) && (!avoidHub || hub.radius<=0 || Math.hypot(x - hub.x, y - hub.y) > hub.radius + radius);
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
    if(state.activity&&state.activity.type==='tower'&&state.activity.stage===4)damage*=.7;
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
    if(enemy.activityEnemy){enemy.respawn=1e9;effect(state,'burst',enemy.x,enemy.y,.5,40,{color:'#c8d7a3'});questCheck(state);return;}
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
    const p = state.player, s = stats(state),weapon=weaponInfo(state);
    if (p.attackCd > 0 || state.dead || p.dashTime > 0) return;
    p.attackCd = weapon.cooldown;
    if(weapon.kind!=='sword'){const info={element:weapon.kind==='bow'?'wind':CONTENT.ITEMS[weapon.itemId].element||'thunder',color:weapon.color};playerBolt(state,p.facing,weapon.projectileSpeed,s.attack*weapon.damageMultiplier,info,{life:weapon.range/weapon.projectileSpeed,radius:weapon.kind==='bow'?5:10,kind:weapon.kind==='bow'?'arrow':'orb',weaponKind:weapon.kind,angle:p.facing,...(weapon.kind==='staff'?{explosion:65}:{})});effect(state,weapon.kind==='bow'?'bowShot':'orbCast',p.x,p.y,.22,20,{angle:p.facing,color:weapon.color});return;}
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
  function cast(state,secondary=false) {
    const p=state.player,info=techniqueInfo(state,secondary?state.secondaryTechnique:state.activeTechnique),cd=secondary?'secondaryCd':'skillCd';
    if(!info||!info.known||state.dead||p[cd]>0||secondary&&p.realm<1)return;
    const attack=stats(state).attack*info.multiplier*info.comboMultiplier,baseId=info.baseId||info.id,profile=info.castProfile||{},range=info.rangeMultiplier||1;
    if(p.mp<info.manaCost){outcome(state,'skill',false,'灵力不足。服用回春丹或返回驿站调息。');return;}
    p.mp-=info.manaCost;p[cd]=info.cooldown;
    if(info.comboReady){p.mp=Math.min(stats(state).maxMp,p.mp+6);effect(state,'particle',p.x,p.y-28,.8,18,{color:info.color});log(state,'五行相生：后一法威力提高25%，返还6灵力。');}
    state.combo={element:info.comboElement,until:info.comboElement?state.time+6:0};
    const extra={element:info.element,color:info.color};
    if(baseId==='arrow'){
      const count=profile.projectileCount||5,spread=profile.spread||.14;for(let i=0;i<count;i++){const offset=(i-(count-1)/2)*spread;playerBolt(state,p.facing+offset,670,attack*1.65,info,{life:1.25*range,radius:6,kind:'arrow',weaponKind:'bow',angle:p.facing+offset,...(i===Math.floor(count/2)?{pierce:3,hits:[]}:{})});}effect(state,'bowVolley',p.x,p.y,.4,22,{...extra,angle:p.facing});
    }else if(baseId==='sword'){
      effect(state,'burst',p.x,p.y,.65,210*range,extra);effect(state,'ring',p.x,p.y,.5,210*range,extra);
      const count=profile.projectileCount||3;for(let i=0;i<count;i++)playerBolt(state,p.facing+(i-(count-1)/2)*.14,520,attack*1.8,info,{life:(1.2+info.level*.12)*range,kind:'spectralBlade',weaponKind:'sword',angle:p.facing+(i-(count-1)/2)*.14});
      for(const e of state.enemies)if(e.hp>0&&!e.gated&&distance(e,p)<210*range+e.radius){hurtEnemy(state,e,attack*1.5,28);if(!e.boss)e.stun=.85;}
    }else if(baseId==='flame'){
      effect(state,'flame',p.x,p.y,.8,175*range,extra);
      playerBolt(state,p.facing,380,attack*2.3,info,{radius:14,life:1.4*range,kind:'fireball',explosion:(profile.explosionRadius||145)*range,status:'burn',statusLife:4,statusDamage:attack*.3,weaponKind:'staff',angle:p.facing});
      for(const e of state.enemies)if(e.hp>0&&!e.gated&&distance(e,p)<175*range+e.radius){hurtEnemy(state,e,attack*1.1,8);statusEnemy(e,'burn',4,attack*.3);}
    }else if(baseId==='frost'){
      effect(state,'frost',p.x,p.y,.8,225*range,extra);
      const count=profile.projectileCount||5;for(let i=0;i<count;i++)playerBolt(state,p.facing+(i-(count-1)/2)*(profile.spread||.19),445,attack*1.05,info,{radius:9,life:1.4*range,status:'slow',statusLife:4,pierce:2,hits:[]});
      for(const e of state.enemies)if(e.hp>0&&!e.gated&&distance(e,p)<225*range+e.radius){hurtEnemy(state,e,attack*.65,0);statusEnemy(e,'slow',4);}
    }else if(baseId==='wood'){
      p.hp=Math.min(stats(state).maxHp,p.hp+stats(state).maxHp*(.16+.025*info.level)*(1+info.affinity));
      effect(state,'heal',p.x,p.y,.8,75,extra);effect(state,'root',p.x,p.y,1,260*range,extra);
      for(const e of state.enemies)if(e.hp>0&&!e.gated&&distance(e,p)<260*range+e.radius){hurtEnemy(state,e,attack*1.7,0);statusEnemy(e,'root',(profile.rootDuration||2.5)+info.level*.3);}
    }else if(baseId==='thunder'){
      let previous=p;const used=new Set();
      for(let i=0;i<(profile.chainTargets||2+info.level);i++){
        const targets=state.enemies.filter(e=>e.hp>0&&!e.gated&&!used.has(e.id)&&distance(e,previous)<(i?300:680)*range);
        targets.sort((a,b)=>i?distance(a,previous)-distance(b,previous):Math.hypot(a.x-(p.x+Math.cos(p.facing)*350),a.y-(p.y+Math.sin(p.facing)*350))-Math.hypot(b.x-(p.x+Math.cos(p.facing)*350),b.y-(p.y+Math.sin(p.facing)*350)));
        const e=targets[0];if(!e)break;effect(state,'thunder',e.x,e.y,.45,25,{...extra,fromX:previous.x,fromY:previous.y});hurtEnemy(state,e,attack*3.2*Math.pow(.86,i),0);e.stun=Math.max(e.stun,e.boss?.2:.6);used.add(e.id);previous=e;
      }
      effect(state,'ring',p.x,p.y,.4,70,extra);
    }else if(baseId==='earth'){
      p.shield=Math.max(p.shield,stats(state).maxHp*(.22+info.level*.055));p.shieldTime=6;
      effect(state,'shield',p.x,p.y,1,52,extra);effect(state,'impact',p.x,p.y,.7,230*range,extra);
      for(const e of state.enemies)if(e.hp>0&&!e.gated&&distance(e,p)<230*range+e.radius){hurtEnemy(state,e,attack*2.5,profile.knockback||45);e.stun=Math.max(e.stun,e.boss?.15:.9);}
    }
  }

  function shoot(state, e, angle, speed, damage, radius) {
    state.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 3.6, radius: radius || 9, owner: 'enemy', sourceId: e.id, damage,element:e.element||'metal',color:(CONTENT.ELEMENTS[e.element]||{}).color||'#dfb993' });
  }

  function beginAttack(state, e) {
    const a=state.activity,crystal=a&&a.type==='defense'&&a.crystal&&a.crystal.hp>0&&distance(e,state.player)>220?a.crystal:null,p=crystal||state.player;e.attackTarget=crystal?'crystal':'player';
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

  function restoreAttackWarning(state,e){
    const skin=ENEMY[e.type].skin||e.type,life=Math.max(.01,e.attackTimer);
    if(e.boss){const radius=e.type==='wolfKing'?110:e.type==='ancientTree'?130:148;effect(state,'warning',e.attackX,e.attackY,life,radius,{color:'#dc795e',sourceId:e.id});if(e.type==='wolfKing')effect(state,'warning',e.x,e.y,life,85,{angle:e.facing,targetX:e.attackX,targetY:e.attackY,sourceId:e.id});}
    else effect(state,'warning',skin==='spirit'?e.x:e.attackX,skin==='spirit'?e.y:e.attackY,life,skin==='spirit'?32:skin==='golem'?65:45,{color:'#dca478',sourceId:e.id});
  }

  function finishAttack(state, e) {
    const p = state.player, t = e.activityEnemy?activityEnemySpec(e.type,e.activityRealm,e.activityStage):ENEMY[e.type];
    const skin=t.skin||e.type;
    if(e.attackTarget==='crystal'&&state.activity&&state.activity.crystal){const c=state.activity.crystal;if(skin==='spirit')shoot(state,e,Math.atan2(e.attackY-e.y,e.attackX-e.x),230,t.damage,9);else if(Math.hypot(c.x-e.attackX,c.y-e.attackY)<100&&distance(c,e)<t.range+80){c.hp=Math.max(0,c.hp-t.damage);effect(state,'impact',c.x,c.y,.3,45,{color:'#eca077'});}e.cooldown=1.4;e.attackTimer=0;e.telegraph=0;e.mode='chase';return;}
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
    const p = state.player, t = e.activityEnemy?activityEnemySpec(e.type,e.activityRealm,e.activityStage):ENEMY[e.type];
    const skin=t.skin||e.type,trial=state.activity?null:state.trials[state.mapId];
    e.hit = Math.max(0, e.hit - dt); e.stun = Math.max(0, e.stun - dt);
    e.dormant=!!trial&&(trial.cleared||e.wave!==trial.wave);
    e.gated = (e.boss && p.realm < t.realm)||e.dormant;
    e.slow=Math.max(0,(e.slow||0)-dt);e.rooted=Math.max(0,(e.rooted||0)-dt);
    if(e.hp>0&&e.burn>0&&!e.gated){e.burn=Math.max(0,e.burn-dt);e.burnTick=(e.burnTick||0)+dt;if(e.burnTick>=.5){e.burnTick-=.5;hurtEnemy(state,e,e.burnDamage*.5,0);effect(state,'flame',e.x,e.y,.3,30,{element:'fire',color:'#efa179'});}}
    e.vx = 0; e.vy = 0;
    if (e.hp <= 0) {
      if (!e.boss&&!trial&&!e.activityEnemy) {
        e.respawn -= dt;
        if (e.respawn <= 0 && distance(e, p) > 520 && distance({ x: e.homeX, y: e.homeY }, p) > 440) {
          Object.assign(e, enemyAt(e.type, e.homeX, e.homeY, Number(e.id.split('-')[1])));
          e.burn=0;e.burnDamage=0;e.burnTick=0;e.slow=0;e.rooted=0;
        }
      }
      return;
    }
    if (e.gated || e.stun > 0) return;
    if(state.activity&&state.activity.phase!=='fight')return;
    e.cooldown = Math.max(0, e.cooldown - dt);
    if (e.mode === 'windup') {
      if (state.dead || isSafe(state)) { e.mode = 'patrol'; e.attackTimer = 0; e.telegraph = 0; return; }
      e.attackTimer -= dt;
      e.telegraph = Math.max(0, e.attackTimer);
      if (e.attackTimer <= 0) finishAttack(state, e);
      return;
    }
    const target=state.activity&&state.activity.type==='defense'&&distance(e,p)>220?state.activity.crystal:p;
    const d = distance(e, target), homeDistance = Math.hypot(e.x - e.homeX, e.y - e.homeY);
    const leash = e.activityEnemy?5000:e.boss ? 660 : 460;
    const engaged = !state.dead && !isSafe(state) && d < t.aggro && homeDistance < leash;
    let tx, ty, speed;
    if (engaged) {
      e.mode = 'chase'; e.facing = Math.atan2(target.y - e.y, target.x - e.x);
      if (d < t.range && e.cooldown <= 0) { beginAttack(state, e); return; }
      const desired = skin === 'spirit' ? 240 : e.type === 'ancientTree' ? 260 : e.type === 'guardian' ? 170 : 45;
      if (d > desired) { tx = target.x; ty = target.y; speed = t.speed; }
      else if (skin === 'spirit' && d < 150) { tx = e.x + (e.x - target.x); ty = e.y + (e.y - target.y); speed = t.speed * 0.75; }
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
    if(state.activity){state.interaction='sect';return outcome(state,'interact',true,'');}
    const candidates=[...m.portals.filter(n=>distance(n,p)<105).map(n=>({kind:'portal',entry:n})),...m.npcs.filter(n=>distance(n,p)<105).map(n=>({kind:'npc',entry:n})),...Object.values(CONTENT.EXPLORATION_SITES).filter(s=>s.mapId===state.mapId&&!state.exploration.claimed.includes(s.id)&&distance(s,p)<105).map(s=>({kind:'site',entry:s})),...state.nodes.filter(n=>n.ready<=0&&distance(n,p)<90).map(n=>({kind:'node',entry:n}))];
    candidates.sort((a,b)=>distance(a.entry,p)-distance(b.entry,p));const chosen=candidates[0];
    if(!chosen)return outcome(state,'interact',false,'靠近灵脉、资源、传送门或驿站人物，按 E 交互。');
    if(chosen.kind==='portal'){state.interaction='portal:'+chosen.entry.target;return outcome(state,'interact',true,'');}
    if(chosen.kind==='npc'){state.interaction=chosen.entry.interaction||chosen.entry.id;return outcome(state,'interact',true,'');}
    if(chosen.kind==='site'){state.interaction='site:'+chosen.entry.id;return outcome(state,'interact',true,'');}
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
    const systemAction=systemsAction(state,id);if(systemAction)return systemAction;
    const character=npcAction(state,id);if(character)return character;
    const extended=expandedAction(state,id);if(extended)return extended;
    const p = state.player, s = stats(state);
    if (id === 'revive') {
      if (!state.dead) return outcome(state, id, false, '灵身尚在，无须重聚。');
      const loss = Math.floor(p.stones * 0.12);
      p.stones -= loss; p.xp = Math.max(0, p.xp - Math.min(45, Math.floor(p.xp * 0.08)));
      const activityDeath=!!state.activity;if(activityDeath)leaveActivity(state);else{state.worlds[state.mapId]={enemies:state.enemies,nodes:state.nodes,drops:state.drops};state.mapId='main';const home=state.worlds.main;state.enemies=home.enemies;state.nodes=home.nodes;state.drops=home.drops;}
      p.x = activityDeath?1600:550; p.y = activityDeath?1800:1780; p.hp = s.maxHp; p.mp = s.maxMp; p.invuln = 2;p.shield=0;p.shieldTime=0;p.slow=0;state.buffs=[];
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
    const cultivation=cultivationInfo(state);if(!cultivation.ready)return outcome(state,id,false,cultivation.reason);
    pay(state,cultivation.cost);p.xp -= s.xpNeeded; p.realm++;
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
    ['attackCd', 'skillCd', 'secondaryCd', 'dashCd', 'invuln', 'hit'].forEach(key => { p[key] = Math.max(0, p[key] - dt); });
    productionStep(state,dt);
    state.nodes.forEach(n => { n.ready = Math.max(0, n.ready - dt); });
    if (!state.dead) {
      if (finite(input.aimX) && finite(input.aimY) && Math.hypot(input.aimX - p.x, input.aimY - p.y) > 4) p.facing = Math.atan2(input.aimY - p.y, input.aimX - p.x);
      let mx = finite(input.mx) ? clamp(input.mx, -1, 1) : 0, my = finite(input.my) ? clamp(input.my, -1, 1) : 0;
      const length = Math.hypot(mx, my); if (length > 1) { mx /= length; my /= length; }
      if (input.dash && p.dashCd <= 0) {
        p.dashTime = 0.19; p.dashCd = 1.4; p.invuln = Math.max(p.invuln, 0.25);
        const d = Math.hypot(mx, my); p.dashX = d > 0 ? mx / d : Math.cos(p.facing); p.dashY = d > 0 ? my / d : Math.sin(p.facing);
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
      if (input.secondary) cast(state,true);
      if (input.interact) interact(state);
    } else p.moving = false;
    state.enemies.forEach(e => enemyStep(state, e, dt));
    for (const b of state.projectiles) {
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      const hub=mapInfo(state).hub;
      if (blocked(b.x, b.y, b.radius, state) || (b.owner === 'enemy' && hub.radius>0&&Math.hypot(b.x - hub.x, b.y - hub.y) < hub.radius)) b.life = 0;
      if (b.life > 0 && b.owner === 'player') {
        for (const e of state.enemies) {
          if (e.hp > 0 && !e.gated && !(b.hits||[]).includes(e.id)&&Math.hypot(e.x - b.x, e.y - b.y) < b.radius + e.radius) {
            hurtEnemy(state, e, b.damage, 7);if(b.status)statusEnemy(e,b.status,b.statusLife,b.statusDamage);
            if(b.pierce){b.hits=b.hits||[];b.hits.push(e.id);b.pierce--;if(b.pierce<=0)b.life=0;}else b.life=0;
            if(b.explosion){effect(state,b.status==='burn'?'flame':'impact',b.x,b.y,.6,b.explosion,{element:b.element,color:b.color});for(const other of state.enemies)if(other!==e&&other.hp>0&&!other.gated&&Math.hypot(other.x-b.x,other.y-b.y)<b.explosion+other.radius){hurtEnemy(state,other,b.damage*.6,8);if(b.status==='burn')statusEnemy(other,'burn',b.statusLife,b.statusDamage);}}
            effect(state, 'impact', b.x, b.y, 0.23, 22, { color: b.color||'#a5e4e3',element:b.element||'metal' });
            break;
          }
        }
      }
      if (b.life > 0 && b.owner === 'enemy' && !state.dead && Math.hypot(p.x - b.x, p.y - b.y) < b.radius + 18) {
        const hit=hurtPlayer(state, b.damage, b.x - b.vx, b.y - b.vy);if(hit&&['ice','wood'].includes(b.element))p.slow=2.5;b.life = 0;
      }
      if(b.life>0&&b.owner==='enemy'&&state.activity&&state.activity.type==='defense'&&distance(b,state.activity.crystal)<b.radius+36){state.activity.crystal.hp=Math.max(0,state.activity.crystal.hp-b.damage);b.life=0;effect(state,'impact',b.x,b.y,.3,25,{color:b.color});}
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
    if(state.activity)activityStep(state,dt);else trialCheck(state);
    return state;
  }

  function objective(state) {
    const p = state.player, s = stats(state);
    if (state.dead) return '灵身已散 · 点击重聚灵身，返回安全据点';
    if(state.activity){const a=activityInfo(state);return a.completed?`${a.name}已完成 · 奖励已领取，退出返回宗门`:a.failed?`${a.name}失败 · 退出后可重新挑战`:a.phase==='choice'?'镇妖塔 · 选择一项祝福再登下一层':a.type==='tribulation'?`${a.rank} 重雷劫 · 避开落雷，再坚持 ${Math.ceil(a.timeRemaining)} 秒`:a.type==='defense'?`护脉守护 · 第 ${a.wave}/3 波 · 晶石 ${Math.ceil(a.crystal.hp)}/${a.crystal.maxHp}`:`${a.name} · ${a.type==='tower'?`第 ${a.floor}/5 层 · `:''}剩余 ${a.remainingEnemies} 敌`;}
    if(state.mapId==='sect')return !state.sect.joined?'青云宗 · 在宗门面板加入山门，试用灵弓与法杖':p.realm<1?'青云宗 · 备齐兵器丹药，出山击败苍牙，筑基后开启宗门经营':`${s.realmName}修行 · 经营设施、领取成果；${cultivationInfo(state).ready?'可在破境坛突破':cultivationInfo(state).reason}`;
    const m=mapInfo(state);if(m.type==='trial')return m.trial.cleared?'秘境已通关 · 返回入口退出，重新进入可挑战':`${m.name} · 第 ${m.trial.wave}/3 重试炼 · ${state.enemies.filter(e=>e.wave===m.trial.wave&&e.hp>0).length} 个敌人`;
    if(m.id!=='main'){const boss=m.id==='red'?'flameLord':'frostWyrm';return state.progress.bosses.includes(boss)?`${m.name} · 采集灵材、探索秘境与推进山海志`:`${m.name} · 寻找并击败${ENEMY[boss].name}`;}
    if (state.won) return p.realm>=7?'大乘圆满 · 游历山海，经营宗门或再战镇妖塔':`${s.realmName}道途 · ${p.realm<3?'回安全据点突破元婴':p.realm===3?'前往青云宗，登顶镇妖塔后突破化神':'前往青云宗渡劫，继续突破更高境界'}`;
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
    if(state.activity)state.activity.world={enemies:state.enemies,nodes:state.nodes,drops:state.drops};else state.worlds[state.mapId]={enemies:state.enemies,nodes:state.nodes,drops:state.drops};
    const keys=['version','seed','rng','time','player','mapId','worlds','root','techniques','techniqueGrades','npcProgress','activeTechnique','secondaryTechnique','legacyTechniqueIds','combo','sect','activity','exploration','inventory','equipment','buffs','story','progress','trials','projectiles','logs','quests','questRewards','won','dead','meditationCd'];
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
    if(!d||typeof d!=='object')fail();if(d.version===1)return expand(deserializeV1(json),true);if(![2,3,4].includes(d.version))fail();
    const num=(v,lo,hi,integer=false)=>{if(!finite(v)||v<lo||v>hi||integer&&!Number.isInteger(v))fail();return v;};
    const bool=v=>{if(typeof v!=='boolean')fail();return v;};
    const object=v=>{if(!v||typeof v!=='object'||Array.isArray(v))fail();return v;};
    const ids=(v,allowed,max=allowed.length)=>{if(!Array.isArray(v)||v.length>max||v.some(k=>!allowed.includes(k))||new Set(v).size!==v.length)fail();return v.slice();};
    const s=createGame(num(d.seed,1,4294967295,true));s.rng=num(d.rng,1,4294967295,true);s.time=num(d.time,0,1e9);
    if(!CONTENT.MAPS[d.mapId])fail();s.mapId=d.mapId;
    const r=object(d.root);if(!CONTENT.ROOT_GRADES[r.grade])fail();s.root={grade:r.grade,elements:ids(r.elements,Object.keys(CONTENT.ELEMENTS),2),legacy:bool(r.legacy)};
    if(!s.root.elements.length||s.root.legacy&&(s.root.grade!=='mortal'||s.root.elements.length!==1||s.root.elements[0]!=='metal'))fail();
    s.techniques={};for(const [id,level]of Object.entries(object(d.techniques))){if(!CONTENT.TECHNIQUES[id])fail();s.techniques[id]=num(level,1,3,true);}if(!s.techniques.sword||!s.techniques[d.activeTechnique])fail();s.activeTechnique=d.activeTechnique;
    s.techniqueGrades={};if(d.version===2){for(const id of Object.keys(s.techniques))s.techniqueGrades[id]=0;}
    else{const grades=object(d.techniqueGrades);if(Object.keys(grades).length!==Object.keys(s.techniques).length)fail();for(const [id,index]of Object.entries(grades)){if(!s.techniques[id])fail();s.techniqueGrades[id]=num(index,0,4,true);if(d.version===4&&index!==CONTENT.TECHNIQUES[id].gradeIndex)fail();}}
    if(d.version<4){for(const [id,index]of Object.entries({...s.techniqueGrades})){if(index){const grade=Object.values(CONTENT.TECHNIQUE_GRADES).find(g=>g.index===index),variant=id+'_'+grade.id;if(!CONTENT.TECHNIQUES[variant])fail();s.techniques[variant]=s.techniques[id];s.techniqueGrades[variant]=index;s.legacyTechniqueIds.push(variant);s.techniqueGrades[id]=0;if(s.activeTechnique===id)s.activeTechnique=variant;}}}
    else{s.legacyTechniqueIds=ids(d.legacyTechniqueIds,Object.keys(CONTENT.TECHNIQUES));for(const id of s.legacyTechniqueIds)if(!s.techniques[id]||!CONTENT.TECHNIQUES[id].gradeIndex)fail();s.secondaryTechnique=d.secondaryTechnique;if(s.secondaryTechnique!==null&&(!s.techniques[s.secondaryTechnique]||s.secondaryTechnique===s.activeTechnique))fail();const combo=object(d.combo);if(combo.element!==null&&!Object.keys(GENERATES).includes(combo.element))fail();s.combo={element:combo.element,until:num(combo.until,0,s.time+6)};if(!s.combo.element&&s.combo.until!==0)fail();}
    s.inventory={};for(const [id,count]of Object.entries(object(d.inventory))){const item=CONTENT.ITEMS[id];if(!item||item.resourceField)fail();s.inventory[id]=num(count,0,1e7,true);}if(!s.inventory.starterSword||!s.inventory.clothRobe)fail();
    const eq=object(d.equipment);s.equipment={};for(const slot of ['weapon','robe','charm']){const id=eq[slot];if(id===null){if(slot!=='charm')fail();s.equipment[slot]=null;}else{const item=CONTENT.ITEMS[id];if(!item||item.slot!==slot||!s.inventory[id])fail();s.equipment[slot]=id;}}
    if(!Array.isArray(d.buffs)||d.buffs.length>3)fail();s.buffs=d.buffs.map(b=>{if(!b||!['rage','ward','insight'].includes(b.type))fail();return{type:b.type,life:num(b.life,0,{rage:40,ward:45,insight:60}[b.type])};});if(new Set(s.buffs.map(b=>b.type)).size!==s.buffs.length)fail();
    const p=object(d.player);s.player.realm=num(p.realm,0,d.version<4?3:7,true);s.player.weapon=num(p.weapon,0,6,true);if(s.player.weapon>Math.min(6,2+s.player.realm*2))fail();
    if(d.version===4)s.player.secondaryCd=num(p.secondaryCd,0,20);if(s.secondaryTechnique&&s.player.realm<1)fail();
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
    const progress=object(d.progress);s.progress={visited:ids(progress.visited,Object.keys(CONTENT.MAPS)),bosses:ids(progress.bosses,[...new Set(Object.values(CONTENT.MAPS).flatMap(m=>m.spawns.map(v=>v[0])).filter(k=>ENEMY[k].realm!==undefined))]),gathered:{},claims:ids(progress.claims,Object.keys(CONTENT.SIDE_QUESTS))};
    if(!s.progress.visited.includes('main')||!s.progress.visited.includes(s.mapId)||s.quests.bosses.some(b=>!s.progress.bosses.includes(b)))fail();
    if(s.progress.visited.some(id=>CONTENT.MAPS[id].realmRequired>s.player.realm)||s.progress.bosses.some(id=>ENEMY[id].realm>s.player.realm))fail();
    for(const [id,count]of Object.entries(object(progress.gathered))){if(!CONTENT.RESOURCES[id])fail();s.progress.gathered[id]=num(count,0,1e8,true);}
    const trials=object(d.trials);s.trials={};for(const id of Object.keys(CONTENT.TRIAL_REWARDS)){const t=object(trials[id]);s.trials[id]={wave:num(t.wave,1,3,true),cleared:bool(t.cleared),clears:num(t.clears,0,1e7,true),rewarded:bool(t.rewarded)};if(t.rewarded!==(t.clears>0)||t.cleared&&(t.wave!==3||t.clears<1))fail();const boss=CONTENT.MAPS[id].spawns.find(v=>v[3]===3)[0];if(t.rewarded&&(!s.progress.visited.includes(id)||!s.progress.bosses.includes(boss)))fail();}
    for(const [id,index]of Object.entries(s.techniqueGrades)){const t=CONTENT.TECHNIQUES[id],legacy=s.legacyTechniqueIds.includes(id);if(legacy){if(s.techniques[id]<[1,1,2,3,3][index]||s.player.realm<Math.min(3,index-1)||Object.values(CONTENT.TECHNIQUE_GRADES).filter(g=>g.index<=index).some(g=>g.trialsRequired.some(map=>!s.trials[map].rewarded)))fail();}else if(s.player.realm<t.requiredRealm||(t.requiredTrials||[]).some(map=>!s.trials[map].rewarded))fail();}
    if(d.version===4){
      const sect=object(d.sect);s.sect.joined=bool(sect.joined);s.sect.contribution=num(sect.contribution,0,1e8,true);s.sect.totalContribution=num(sect.totalContribution,s.sect.contribution,1e8,true);s.sect.towerBest=num(sect.towerBest,0,5,true);s.sect.tribulationBest=num(sect.tribulationBest,0,3,true);s.sect.tribulationRanks=ids(sect.tribulationRanks,[1,2,3]);if(s.sect.tribulationBest!==Math.max(0,...s.sect.tribulationRanks))fail();
      const records=object(sect.records);if(Object.keys(records).length!==4)fail();for(const id of Object.keys(CONTENT.ACTIVITIES))s.sect.records[id]=num(records[id],0,1e7,true);
      if(s.sect.records.tower>0&&s.sect.towerBest!==5||s.sect.records.tribulation<s.sect.tribulationRanks.length||s.sect.towerBest&&s.player.realm<3||s.sect.tribulationBest&&s.player.realm<s.sect.tribulationBest+3)fail();
      if(s.player.realm>=4&&s.sect.towerBest!==5||s.player.realm>=5&&s.sect.tribulationBest<s.player.realm-4)fail();
      if(s.sect.joined&&!s.progress.visited.includes('sect')||!s.sect.joined&&(s.sect.totalContribution>0||s.sect.towerBest>0||s.sect.tribulationBest>0||Object.values(s.sect.records).some(n=>n>0)))fail();
      const facilities=object(sect.facilities),disciples=object(sect.disciples);if(Object.keys(facilities).length!==3||Object.keys(disciples).length!==3)fail();
      for(const id of Object.keys(CONTENT.SECT_DISCIPLES)){const v=object(disciples[id]);s.sect.disciples[id]={recruited:bool(v.recruited)};if(v.recruited&&(!s.sect.joined||s.player.realm<CONTENT.SECT_DISCIPLES[id].realmRequired))fail();}if(s.sect.joined&&!s.sect.disciples.qinghe.recruited)fail();
      const assigned=[];for(const id of Object.keys(CONTENT.SECT_FACILITIES)){const v=object(facilities[id]);if(!CONTENT.SECT_POSITIONS[v.position])fail();const level=num(v.level,0,3,true),stored=num(v.stored,0,3,true),progress=num(v.progress,0,CONTENT.SECT_FACILITIES[id].duration),discipleId=v.discipleId;if(discipleId!==null&&(!s.sect.disciples[discipleId]||!s.sect.disciples[discipleId].recruited||assigned.includes(discipleId)))fail();if(discipleId)assigned.push(discipleId);if(level>s.player.realm||!level&&(stored||progress||discipleId)||stored===3&&progress!==0||!discipleId&&progress!==0)fail();s.sect.facilities[id]={level,stored,progress,position:v.position,discipleId};}
      const exploration=object(d.exploration);s.exploration.claimed=ids(exploration.claimed,Object.keys(CONTENT.EXPLORATION_SITES));const evidence=object(exploration.records);if(Object.keys(evidence).length!==s.exploration.claimed.length)fail();s.exploration.records={};for(const id of s.exploration.claimed){const site=CONTENT.EXPLORATION_SITES[id],r=object(evidence[id]);if(r.mapId!==site.mapId||!s.progress.visited.includes(site.mapId)||s.player.realm<site.realmRequired)fail();s.exploration.records[id]={mapId:r.mapId,time:num(r.time,0,s.time)};}
    }
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
    if(d.version===4&&d.activity!==null){
      const v=object(d.activity),catalog=CONTENT.ACTIVITIES[v.type];if(!catalog||!s.sect.joined||s.mapId!=='sect'||v.mapId!==catalog.mapId)fail();
      const realm=num(v.realm,catalog.realmRequired,s.player.realm,true),rank=num(v.rank,1,3,true),stage=num(v.stage,1,v.type==='tower'?5:v.type==='defense'?3:1,true);if(rank!==(v.type==='tribulation'?clamp(realm-3,1,3):1)||!['fight','choice','complete','failed'].includes(v.phase)||v.phase==='choice'&&(v.type!=='tower'||stage>=5))fail();
      const duration=num(v.duration,30+rank*10,30+rank*10),elapsed=num(v.elapsed,0,duration+.05),nextStrike=num(v.nextStrike,-.05,2),blessings=object(v.blessings),rewarded=bool(v.rewarded);if(rewarded!==(v.phase==='complete'))fail();
      const counts={};for(const id of ['blade','vital','spirit'])counts[id]=num(blessings[id],0,4,true);if(Object.values(counts).reduce((a,b)=>a+b,0)!==(v.type==='tower'?stage-1:0))fail();
      let crystal=null;if(v.type==='defense'){const c=object(v.crystal),maxHp=800+realm*220;if(c.x!==1700||c.y!==1200||c.maxHp!==maxHp)fail();crystal={x:c.x,y:c.y,maxHp,hp:num(c.hp,0,maxHp)};if(c.hp<=0&&v.phase!=='failed')fail();}else if(v.crystal!==null)fail();
      if(!Array.isArray(v.warnings)||v.warnings.length>9||v.type!=='tribulation'&&v.warnings.length)fail();const warnings=v.warnings.map(w=>{object(w);return{x:num(w.x,43,WIDTH-43),y:num(w.y,43,HEIGHT-43),remaining:num(w.remaining,0,.95),radius:num(w.radius,75+rank*10,75+rank*10)};});
      const saved=object(v.world),world=makeActivityWorld(v.type,realm,stage);if(!Array.isArray(saved.enemies)||saved.enemies.length!==world.enemies.length||!Array.isArray(saved.nodes)||saved.nodes.length!==0)fail();
      world.enemies.forEach((e,i)=>{const b=object(saved.enemies[i]);if(b.id!==e.id||b.type!==e.type||b.maxHp!==e.maxHp||b.wave!==stage||b.activityRealm!==realm||b.activityStage!==stage||b.activityEnemy!==true)fail();e.x=num(b.x,43,WIDTH-43);e.y=num(b.y,43,HEIGHT-43);e.hp=num(b.hp,0,e.maxHp);for(const id of ['hit','attackTimer','cooldown','stun','burn','burnTick','slow','rooted'])e[id]=num(b[id],0,20);e.burnDamage=num(b.burnDamage,0,10000);e.respawn=num(b.respawn,0,1e9);e.phase=num(b.phase,0,1e8,true);e.patrol=num(b.patrol,0,1e9);e.attackX=num(b.attackX,0,WIDTH);e.attackY=num(b.attackY,0,HEIGHT);e.facing=num(b.facing,-Math.PI*2,Math.PI*2);if(!['patrol','chase','windup','return'].includes(b.mode))fail();e.mode=b.mode;e.telegraph=e.mode==='windup'?e.attackTimer:0;if(b.attackTarget!==undefined){if(!['player','crystal'].includes(b.attackTarget)||b.attackTarget==='crystal'&&v.type!=='defense')fail();e.attackTarget=b.attackTarget;}});
      if(v.phase==='choice'&&world.enemies.some(e=>e.hp>0)||v.phase==='complete'&&v.type!=='tribulation'&&world.enemies.some(e=>e.hp>0))fail();world.drops=loadDrops(saved.drops);
      let reward=null;if(v.reward!==null){object(v.reward);reward={};for(const[id,n]of Object.entries(v.reward)){if(id!=='xp'&&id!=='contribution'&&!CONTENT.RESOURCES[id])fail();reward[id]=num(n,0,15000);}}if(!rewarded&&reward!==null)fail();
      s.activity={type:v.type,mapId:v.mapId,realm,rank,stage,phase:v.phase,duration,elapsed,nextStrike,blessings:counts,crystal,warnings,world,rewarded,reward};bindActivityWorld(s);if(blocked(s.player.x,s.player.y,17,s))fail();
    }
    s.npcProgress={};if(d.version>=3){for(const [id,v]of Object.entries(object(d.npcProgress))){const npc=CONTENT.NPC_CHARACTERS[id];if(!npc||!s.progress.visited.includes(npc.mapId))fail();object(v);if(bool(v.met)!==true)fail();const choice=npc.choices.find(c=>c.id===v.choice);if(!choice)fail();const c=object(v.commission),accepted=bool(c.accepted),claimed=bool(c.claimed),baseline=num(c.baseline,0,1e7,true);if(claimed&&!accepted||!accepted&&baseline!==0||!npc.commission&&(accepted||claimed||baseline!==0)||npc.commission&&!npc.commission.relative&&baseline!==0)fail();if(npc.commission&&baseline>npcMeasure(s,npc.commission))fail();
      const services={};for(const [serviceId,record]of Object.entries(object(v.services))){const service=(npc.services||[]).find(service=>service.id===serviceId);if(!service)fail();object(record);services[serviceId]={uses:num(record.uses,1,1e7,true),lastAt:num(record.lastAt,0,s.time)};if(record.lastAt<(record.uses-1)*service.cooldown-1e-6)fail();}
      for(const serviceId of Object.keys(services)){const service=npc.services.find(service=>service.id===serviceId);if(choice.rapport+(claimed?2:0)+Object.keys(services).length-1<service.minRapport)fail();}
      const rapport=Math.min(10,choice.rapport+(claimed?2:0)+Object.keys(services).length);if(num(v.rapport,0,10,true)!==rapport)fail();
      s.npcProgress[id]={met:true,choice:choice.id,rapport,commission:{accepted,claimed,baseline},services};if(claimed&&npcMeasure(s,npc.commission)-(npc.commission.relative?baseline:0)<npc.commission.target)fail();
    }}
    if(!Array.isArray(d.projectiles)||d.projectiles.length>200)fail();s.projectiles=d.projectiles.map(v=>{
      if(!v||!['enemy','player'].includes(v.owner)||v.owner==='player'&&v.sourceId!=='player'||v.owner==='enemy'&&!s.enemies.some(e=>e.id===v.sourceId))fail();
      const b={x:num(v.x,0,WIDTH),y:num(v.y,0,HEIGHT),vx:num(v.vx,-1000,1000),vy:num(v.vy,-1000,1000),life:num(v.life,0,5),radius:num(v.radius,1,35),owner:v.owner,sourceId:v.sourceId,damage:num(v.damage,0,10000)};
      if(v.element!==undefined){if(!CONTENT.ELEMENTS[v.element])fail();b.element=v.element;if(v.color!==undefined&&(typeof v.color!=='string'||!/^#[0-9a-f]{6}$/i.test(v.color)))fail();b.color=v.color||CONTENT.ELEMENTS[v.element].color;}
      if(v.status!==undefined){if(!['burn','slow','root'].includes(v.status))fail();b.status=v.status;b.statusLife=num(v.statusLife,0,20);if(v.statusDamage!==undefined)b.statusDamage=num(v.statusDamage,0,10000);}
      if(v.explosion!==undefined)b.explosion=num(v.explosion,0,300);if(v.pierce!==undefined)b.pierce=num(v.pierce,0,5,true);if(v.hits!==undefined)b.hits=ids(v.hits,s.enemies.map(e=>e.id),5);
      if(v.weaponKind!==undefined){if(!['sword','bow','staff'].includes(v.weaponKind))fail();b.weaponKind=v.weaponKind;}
      if(v.kind!==undefined){if(!['arrow','orb','spectralBlade','fireball'].includes(v.kind))fail();b.kind=v.kind;}
      if(v.angle!==undefined)b.angle=num(v.angle,-Math.PI*4,Math.PI*4);return b;
    });
    if(!Array.isArray(d.logs)||d.logs.length>6||d.logs.some(v=>typeof v!=='string'||v.length>200))fail();s.logs=d.logs.slice();s.effects=[];s.interaction=null;s.lastAction=null;
    updateGates(s);for(const e of s.enemies)if(e.hp>0&&e.mode==='windup')restoreAttackWarning(s,e);
    if(s.activity)for(const w of s.activity.warnings)effect(s,'warning',w.x,w.y,Math.max(.01,w.remaining),w.radius,{element:'thunder',color:'#d8acef',sourceId:'tribulation'});
    for(const id of s.progress.claims){const entry=questsInfo(s).find(q=>q.id===id);if(entry.progress<entry.target)fail();}
    return s;
  }

  return { createGame, step, interact, action, serialize, deserialize, stats, objective, zoneAt,
    mapInfo,isSafe,rootInfo,techniqueInfo,storyInfo,questsInfo,inventoryInfo,npcInfo,cultivationInfo,weaponInfo,sectInfo,activityInfo,siteInfo,CONTENT,
    WIDTH, HEIGHT, HUB, PONDS, OBSTACLES, REALMS, NPCS, ENEMY };
});
