(function(root,factory){'use strict';const content=factory();if(typeof module==='object'&&module.exports)module.exports=content;if(root)root.XianContent=content;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ELEMENTS={metal:{name:'金',color:'#ecd293'},wood:{name:'木',color:'#99d8a4'},water:{name:'水',color:'#87ceeb'},fire:{name:'火',color:'#ef9166'},earth:{name:'土',color:'#c6ab81'},wind:{name:'风',color:'#b7efe0'},thunder:{name:'雷',color:'#c4a9ff'},ice:{name:'冰',color:'#b2e5ff'}};
  Object.entries(ELEMENTS).forEach(([id,e])=>Object.assign(e,{id,description:`${e.name}属性与同系功法共鸣；风与剑、雷，水与木、冰亦相生。`}));
  const ROOT_GRADES={
    mortal:{name:'凡灵根',description:'根骨平实，属性相合时仍可发挥完整道术。',growth:1,cultivation:1,affinity:.10,weight:28},
    spirit:{name:'真灵根',description:'灵气亲和，气血灵力成长提高 4%，修为获取提高 6%。',growth:1.04,cultivation:1.06,affinity:.15,weight:34},
    earth:{name:'地灵根',description:'厚积薄发，气血灵力成长提高 8%，修为获取提高 12%。',growth:1.08,cultivation:1.12,affinity:.20,weight:23},
    heaven:{name:'天灵根',description:'天生通玄，气血灵力成长提高 12%，修为获取提高 18%。',growth:1.12,cultivation:1.18,affinity:.25,weight:12},
    immortal:{name:'仙灵根',description:'仙缘初醒，气血灵力成长提高 16%，修为获取提高 25%。',growth:1.16,cultivation:1.25,affinity:.32,weight:3}
  };Object.entries(ROOT_GRADES).forEach(([id,g])=>g.id=id);
  const RESOURCES={stones:{name:'灵石',description:'采集灵晶、击败妖兽所得，用于交易、淬炼与道术研习。',color:'#ead193'},herbs:{name:'灵草',description:'野外采集，可炼回春丹、护体散和通灵丹。',color:'#a5d597'},iron:{name:'玄铁',description:'矿脉和石卫掉落，用于铸剑、土系研习与护甲。',color:'#a9b9c7'},spiritwood:{name:'灵木',description:'古树枝节与青竹洞天所产，用于木系功法与法衣。',color:'#9acd9d'},ember:{name:'赤焰砂',description:'赤霄荒原火脉所得，用于火系功法、烈焰剑及攻伐丹药。',color:'#ef9b70'},frost:{name:'寒晶',description:'北冥雪域冰脉所得，用于冰系功法和玄冰法器。',color:'#b3e0ee'},core:{name:'妖丹',description:'精英妖兽、首领与秘境掉落，高阶研习和法宝必需。',color:'#cab5e5'},essence:{name:'灵髓',description:'稀有灵脉和秘境宝匣所产，用于雷系道术与仙品装备。',color:'#8bddd6'}};
  Object.entries(RESOURCES).forEach(([id,r])=>r.id=id);
  const TECHNIQUES={
    sword:{id:'sword',name:'御剑诀',description:'三道飞剑与近身剑气。等级提高飞剑伤害与射程。',element:'metal',color:'#e4ddac',manaCost:28,cooldown:7,resource:'iron',passive:'attack'},
    flame:{id:'flame',name:'离火焚天',description:'发射爆裂火球，灼烧命中目标，周身炎环引燃近敌。',element:'fire',color:'#ef976b',manaCost:30,cooldown:8,resource:'ember',passive:'attack'},
    frost:{id:'frost',name:'玄冰凝霜',description:'五枚寒冰碎片穿透敌阵，并大幅减速近敌。',element:'ice',color:'#b3e7ff',manaCost:26,cooldown:7.5,resource:'frost',passive:'maxMp'},
    wood:{id:'wood',name:'长春引灵',description:'恢复气血，缠根定住近敌并伤害；适合持久历练。',element:'wood',color:'#a1dfb1',manaCost:32,cooldown:11,resource:'spiritwood',passive:'maxHp'},
    thunder:{id:'thunder',name:'九霄雷引',description:'雷击锁定前方目标并连锁最多五敌，造成短暂麻痹。',element:'thunder',color:'#c2acfa',manaCost:34,cooldown:8.5,resource:'essence',passive:'speed'},
    earth:{id:'earth',name:'厚土镇岳',description:'获得可吸收伤害的护盾，并以地震重击、震退近敌。',element:'earth',color:'#d3b182',manaCost:30,cooldown:10,resource:'iron',passive:'defense'}
  };
  const ITEMS={};
  for(const r of Object.values(RESOURCES))ITEMS[r.id]={...r,type:'resource',grade:'凡品',resourceField:r.id};
  ITEMS.potions={id:'potions',name:'回春丹',description:'恢复 42% 气血与 25% 灵力。快捷键 R。',type:'consumable',grade:'凡品',resourceField:'potions',effect:'heal',price:18};
  const add=(id,name,type,grade,description,other)=>ITEMS[id]={id,name,type,grade,description,...other};
  add('spiritTea','凝神茶','consumable','凡品','立即恢复 55% 灵力。',{price:24,effect:'mana'});
  add('rageElixir','赤阳丹','consumable','灵品','持续 40 秒，攻击提高 25%，重复服用仅刷新时长。',{price:48,effect:'rage'});
  add('wardPowder','护体散','consumable','灵品','持续 45 秒，所受伤害降低 25%。',{price:42,effect:'ward'});
  add('insightPill','通灵丹','consumable','灵品','持续 60 秒，战斗、采集修为提高 30%。',{price:65,effect:'insight'});
  for(const t of Object.values(TECHNIQUES))if(t.id!=='sword')add(`${t.id}Book`,`${t.name}残卷`,'book','灵品',`研读后习得${t.name}一重。已有功法可保留残卷。`,{technique:t.id,price:{flame:45,frost:55,wood:35,thunder:75,earth:50}[t.id]});
  add('starterSword','青锋剑','equipment','凡品','初入山门的练功灵剑，可继续在铸剑台淬炼。',{slot:'weapon',tier:0,stats:{attack:0}});
  add('clothRobe','青云道衣','equipment','凡品','轻便的山门道衣。',{slot:'robe',tier:0,stats:{maxHp:0}});
  add('ironSword','玄铁剑','equipment','凡品','沉稳剑锋，攻击 +7。',{slot:'weapon',tier:1,stats:{attack:7},price:85});
  add('jadeSword','青竹灵剑','equipment','灵品','洞天灵木铸成，攻击 +14、灵力上限 +15。',{slot:'weapon',tier:2,stats:{attack:14,maxMp:15}});
  add('flameSword','赤霄离火剑','equipment','仙品','攻击 +24，额外火系道术伤害 +15%。',{slot:'weapon',tier:3,stats:{attack:24},element:'fire',affinity:.15});
  add('iceSword','北冥玄冰剑','equipment','仙品','攻击 +22，额外冰系道术伤害 +18%。',{slot:'weapon',tier:3,stats:{attack:22},element:'ice',affinity:.18});
  add('barkRobe','灵木法衣','equipment','凡品','气血上限 +25，防御 +2。',{slot:'robe',tier:1,stats:{maxHp:25,defense:2},price:80});
  add('cloudRobe','流云法衣','equipment','灵品','气血上限 +45，移动速度 +10，防御 +4。',{slot:'robe',tier:2,stats:{maxHp:45,speed:10,defense:4}});
  add('frostRobe','玄冰仙衣','equipment','仙品','气血上限 +80，防御 +7，灵力上限 +25。',{slot:'robe',tier:3,stats:{maxHp:80,defense:7,maxMp:25}});
  add('jadeCharm','青竹护符','equipment','凡品','灵力上限 +15，气血上限 +12。',{slot:'charm',tier:1,stats:{maxMp:15,maxHp:12},price:60});
  add('thunderCharm','雷纹法印','equipment','灵品','攻击 +6，灵力回复 +0.8/秒。',{slot:'charm',tier:2,stats:{attack:6,manaRegen:.8}});
  add('heavenCharm','山海问心印','equipment','仙品','攻击 +10，气血上限 +35，灵力上限 +30。',{slot:'charm',tier:3,stats:{attack:10,maxHp:35,maxMp:30}});
  const RECIPES={
    healing:{name:'回春丹 ×2',cost:{herbs:2,stones:8},output:{potions:2},realmRequired:0},
    tea:{name:'凝神茶',cost:{herbs:2,spiritwood:1,stones:8},output:{spiritTea:1},realmRequired:0},
    rage:{name:'赤阳丹',cost:{herbs:2,ember:2,stones:15},output:{rageElixir:1},realmRequired:0},
    ward:{name:'护体散',cost:{herbs:2,iron:2,stones:12},output:{wardPowder:1},realmRequired:0},
    insight:{name:'通灵丹',cost:{herbs:3,essence:1,core:1,stones:18},output:{insightPill:1},realmRequired:1},
    ironSword:{name:'铸造玄铁剑',cost:{iron:6,spiritwood:2,stones:40},output:{ironSword:1},realmRequired:0},
    barkRobe:{name:'织造灵木法衣',cost:{spiritwood:6,herbs:4,stones:30},output:{barkRobe:1},realmRequired:0},
    cloudRobe:{name:'流云法衣',cost:{spiritwood:8,core:2,essence:2,stones:90},output:{cloudRobe:1},realmRequired:1},
    flameSword:{name:'赤霄离火剑',cost:{iron:10,ember:8,core:3,essence:3,stones:150},output:{flameSword:1},realmRequired:1},
    iceSword:{name:'北冥玄冰剑',cost:{iron:8,frost:10,core:3,essence:3,stones:150},output:{iceSword:1},realmRequired:2},
    frostRobe:{name:'玄冰仙衣',cost:{spiritwood:8,frost:10,core:3,stones:130},output:{frostRobe:1},realmRequired:2},
    thunderCharm:{name:'雷纹法印',cost:{iron:4,essence:5,core:2,stones:95},output:{thunderCharm:1},realmRequired:1}
  };Object.entries(RECIPES).forEach(([id,r])=>Object.assign(r,{id,description:`消耗${Object.entries(r.cost).map(([k,v])=>`${RESOURCES[k].name} ${v}`).join('、')}炼制。`}));
  const hub={x:500,y:1800,radius:340},start={x:550,y:1780};
  const npcs=[{id:'master',name:'凌云真人',x:440,y:1680},{id:'forge',name:'铸剑台',x:670,y:1800},{id:'alchemy',name:'灵药炉',x:380,y:1900},{id:'shrine',name:'归元祠',x:580,y:1970},{id:'merchant',name:'云游商人',x:260,y:1780},{id:'waygate',name:'山海传送阵',x:730,y:1630},{id:'storyteller',name:'守卷人',x:560,y:1550}];
  function map(id,name,theme,realmRequired,type,description,ponds,obstacles,spawns,nodes,portals){return{id,name,theme,realmRequired,type,description,width:3200,height:2400,start:{...start},hub:{...hub},npcs:npcs.map(n=>({...n})),ponds,obstacles,spawns,nodes,portals,roads:[[[500,1800],[1000,1550],[1650,1300],[2400,850],[2800,600]],[[1000,1550],[1350,2050],[2300,2200]]],arena:{x:1750,y:1150,radius:850}};}
  const mainSpawns=[['wolf',985,1700],['wolf',1100,2010],['wolf',1390,2110],['wolf',920,1350],['wolf',1200,1320],['wolf',1680,1370],['wolf',1830,1570],['wolf',680,1120],['wolf',860,850],['wolf',1010,530],['wolf',1510,1090],['wolf',1790,2100],['spirit',1690,1000],['spirit',1720,700],['spirit',1930,880],['spirit',2130,1080],['spirit',2100,330],['spirit',1840,220],['spirit',2190,750],['golem',2420,1060],['golem',2750,1150],['golem',2990,850],['golem',2560,410],['golem',2990,340],['golem',2850,1600],['wolfKing',1450,1580],['ancientTree',2020,650],['guardian',2790,650]];
  const mainPoints=[[760,1570],[860,1900],[1000,1840],[960,1190],[780,1320],[580,970],[1080,1490],[1270,1860],[1450,1900],[1630,1590],[1890,1890],[1600,2230],[1090,2240],[580,610],[950,680],[1110,900],[1570,810],[1500,440],[1700,490],[1930,390],[2140,520],[2000,1040],[2190,1210],[1790,1190],[2390,740],[2410,300],[2680,280],[2980,580],[2780,960],[2520,1190],[2750,1400],[2980,1530],[2710,1870],[2250,2170],[2060,2040],[2090,1420],[1130,410],[770,2100],[2230,930],[2970,2160],[2840,2240],[1880,1390]];
  const mainNodes=mainPoints.map((p,i)=>[i%3===2?'crystal':'herb',...p]);mainNodes.push(['iron',1140,1730],['iron',2650,1520],['spiritwood',1780,870],['spiritwood',2160,250],['core',2970,1100],['essence',2530,580],['iron',960,2100],['spiritwood',800,1020]);
  function scatter(resource,points){return points.map((p,i)=>[i%5===0?'herb':i%5===1?'crystal':i%5===2?'iron':i%5===3?resource:'essence',...p]);}
  const MAPS={
    main:map('main','青云山海','jade',0,'overworld','青云观、落霞原、青竹林与天门遗迹。最初的问剑之路。',[{x:1350,y:700,rx:230,ry:155},{x:2430,y:2000,rx:160,ry:120}],[{x:1040,y:1130,radius:55},{x:1690,y:1800,radius:65},{x:1950,y:1130,radius:48},{x:2600,y:1330,radius:64},{x:2900,y:1900,radius:52},{x:730,y:690,radius:48},{x:1800,y:400,radius:50},{x:2230,y:1620,radius:50}],mainSpawns,mainNodes,[{id:'bambooGate',name:'青竹洞天',x:1550,y:1260,target:'bambooTrial'},{id:'redGate',name:'赤霄古道',x:2180,y:1760,target:'red'},{id:'snowGate',name:'北冥石门',x:2800,y:920,target:'snow'}]),
    red:map('red','赤霄荒原','fire',1,'overworld','断裂的火山高地遍布赤焰砂，赤霄炎君守护古盟信物。',[{x:1460,y:1240,rx:190,ry:265},{x:2540,y:1860,rx:290,ry:115}],[{x:1010,y:920,radius:75},{x:2030,y:460,radius:95},{x:2490,y:1030,radius:85},{x:1790,y:2070,radius:70}], [['flameWolf',950,1500],['flameWolf',1100,2020],['flameWolf',1720,1720],['flameWolf',2070,1300],['flameSpirit',1050,620],['flameSpirit',1810,830],['flameSpirit',2250,620],['flameSpirit',2810,1470],['lavaGolem',2580,450],['lavaGolem',2820,1000],['lavaGolem',2220,2170],['flameLord',2750,650]],scatter('ember',[[830,1500],[890,2110],[1220,1790],[1710,1550],[1870,1190],[2260,1420],[2670,1180],[2920,1780],[2750,2210],[2060,2040],[1170,750],[1550,490],[2170,320],[2900,410],[2010,810]]),[{id:'home',name:'返回青云',x:730,y:2060,target:'main'},{id:'fireGate',name:'赤焰地宫',x:2150,y:1060,target:'fireTrial'}]),
    snow:map('snow','北冥雪域','snow',2,'overworld','两道冰湖将雪原分成险峻的走廊，北冥霜龙封存旧誓。',[{x:1250,y:1060,rx:170,ry:380},{x:2270,y:1460,rx:340,ry:165}],[{x:820,y:800,radius:75},{x:1730,y:720,radius:88},{x:2640,y:1930,radius:65},{x:2940,y:1150,radius:90}], [['iceWolf',980,1720],['iceWolf',1630,1660],['iceWolf',1870,2080],['iceWolf',1040,480],['iceSpirit',1690,1110],['iceSpirit',2120,870],['iceSpirit',2650,1130],['iceSpirit',2840,1730],['iceGolem',2420,530],['iceGolem',2790,2130],['iceGolem',2170,2130],['frostWyrm',2810,640]],scatter('frost',[[820,1500],[950,2110],[1480,1840],[1830,1520],[1940,1130],[2480,930],[2780,1380],[3010,1880],[2400,2200],[1560,2150],[980,630],[1430,430],[2040,430],[2920,330],[2630,730]]),[{id:'home',name:'返回青云',x:740,y:2050,target:'main'},{id:'iceGate',name:'玄冰水府',x:1930,y:1900,target:'iceTrial'}]),
    bambooTrial:map('bambooTrial','青竹洞天','bamboo',0,'trial','三重竹影试炼：狼群、木灵石卫、竹魇。首通获得长春残卷与青竹灵剑。',[{x:1370,y:650,rx:190,ry:135}],[{x:1300,y:1770,radius:55},{x:2090,y:1610,radius:70},{x:2600,y:1150,radius:60}],[['wolf',1150,1390,1],['wolf',1430,1510,1],['wolf',1700,1350,1],['spirit',1580,950,2],['spirit',1880,1080,2],['golem',2130,1300,2],['bambooPhantom',2490,650,3]],[['spiritwood',1010,1560],['herb',1080,1860],['essence',1990,740],['core',2680,700],['spiritwood',2240,1440]],[{id:'home',name:'退出洞天',x:730,y:2060,target:'main'}]),
    fireTrial:map('fireTrial','赤焰地宫','dungeon',1,'trial','沿熔岩甬道破三重阵，赤焰魔像以炎爆守阵。首通获得离火残卷与雷纹法印。',[{x:1800,y:1720,rx:340,ry:140},{x:2260,y:610,rx:150,ry:145}],[{x:1140,y:1050,radius:90},{x:1970,y:1140,radius:75},{x:2670,y:1520,radius:70}],[['flameWolf',1110,1450,1],['flameWolf',1420,1390,1],['flameSpirit',1630,1200,1],['lavaGolem',1780,900,2],['flameSpirit',2070,860,2],['lavaGolem',2400,1120,2],['infernoIdol',2750,670,3]],[['ember',950,1700],['ember',1640,870],['iron',2400,1450],['essence',2650,900],['core',2920,700]],[{id:'home',name:'退出地宫',x:730,y:2060,target:'main'}]),
    iceTrial:map('iceTrial','玄冰水府','ice',2,'trial','冰廊、寒影与玄冰水君的三重试炼。首通获得凝霜残卷与玄冰仙衣。',[{x:1410,y:1280,rx:190,ry:170},{x:2230,y:1720,rx:210,ry:155}],[{x:1070,y:770,radius:80},{x:1960,y:630,radius:75},{x:2650,y:1370,radius:75}],[['iceWolf',1100,1680,1],['iceWolf',1680,1510,1],['iceSpirit',1820,1230,1],['iceGolem',1720,900,2],['iceSpirit',2290,1110,2],['iceGolem',2450,850,2],['iceSovereign',2820,610,3]],[['frost',1010,1450],['frost',1830,1860],['spiritwood',2160,930],['essence',2660,950],['core',3000,660]],[{id:'home',name:'退出水府',x:730,y:2060,target:'main'}])
  };
  const STORY=[
    {id:'beginning',title:'第一章 · 入山问道',text:'守卷人将残缺的山海图摊在案上：“天门的灵脉正在逆流。问剑者，可先救眼前之人，也可追寻失落的洞天。”',requirement:{},options:[{id:'protect',label:'救助山民',description:'获得 4 灵草与 2 回春丹，仁心 +1。',reward:{herbs:4,potions:2},relation:'mercy'},{id:'seek',label:'探寻古法',description:'获得长春残卷与 15 灵石，求道 +1。',reward:{woodBook:1,stones:15},relation:'wisdom'}]},
    {id:'fang',title:'第二章 · 苍牙之患',text:'苍牙狼王的妖丹内缠着一缕青竹气息。凌云真人请你选择如何处理狼王留下的灵材。',requirement:{boss:'wolfKing'},options:[{id:'restore',label:'修复山门灵脉',description:'获得灵木法衣，仁心 +1。',reward:{barkRobe:1,spiritwood:3},relation:'mercy'},{id:'studyFire',label:'研习妖丹中的离火',description:'获得离火残卷与 3 赤焰砂，求道 +1。',reward:{flameBook:1,ember:3},relation:'wisdom'}]},
    {id:'bamboo',title:'第三章 · 竹影残卷',text:'千年木灵记起旧日誓言：天门并非封印敌人，而是封住失控的灵气。青竹洞天藏着第三页残卷。',requirement:{boss:'ancientTree',trial:'bambooTrial'},options:[{id:'lightning',label:'以雷法追索残卷',description:'获得九霄雷引残卷与 3 灵髓。',reward:{thunderBook:1,essence:3},relation:'wisdom'},{id:'defend',label:'以厚土守护山民',description:'获得厚土镇岳残卷与 5 玄铁。',reward:{earthBook:1,iron:5},relation:'mercy'}]},
    {id:'redPact',title:'第四章 · 赤霄盟约',text:'赤霄炎君放下武器。旧盟尚在：荒原的赤焰可以焚尽侵蚀，也可以成为你的剑锋。',requirement:{visited:'red',anyBoss:['flameLord','infernoIdol']},options:[{id:'forgeFire',label:'将赤焰铸入灵剑',description:'获得赤霄离火剑，锋芒 +1。',reward:{flameSword:1},relation:'valor'},{id:'shareFire',label:'将火脉分给流亡者',description:'获得 90 灵石、6 赤焰砂与 2 通灵丹，仁心 +1。',reward:{stones:90,ember:6,insightPill:2},relation:'mercy'}]},
    {id:'snowOath',title:'第五章 · 雪域旧誓',text:'北冥霜龙记得天门开启那日。你带来的残卷证明，修士可以重新引导灵气，而不必永远封山。',requirement:{visited:'snow',anyBoss:['frostWyrm','iceSovereign']},options:[{id:'iceBlade',label:'借寒晶斩断旧锁',description:'获得北冥玄冰剑与凝霜残卷。',reward:{iceSword:1,frostBook:1},relation:'valor'},{id:'iceRobe',label:'以寒气稳定灵脉',description:'获得玄冰仙衣与 3 凝神茶。',reward:{frostRobe:1,spiritTea:3},relation:'wisdom'}]},
    {id:'heaven',title:'终章 · 山海问心',text:'天门守卫已倒，残卷重新成图。守卷人问：“此后你将执剑巡山，还是留在灵脉间守护众生？”',requirement:{boss:'guardian',trialCount:2},options:[{id:'wander',label:'问剑山海',description:'获得山海问心印与 120 修为，锋芒 +1。',reward:{heavenCharm:1,xp:120},relation:'valor'},{id:'shelter',label:'守护山海',description:'获得山海问心印、4 回春丹与 3 妖丹，仁心 +1。',reward:{heavenCharm:1,potions:4,core:3},relation:'mercy'}]}
  ];STORY.forEach(c=>c.description=c.text);
  const SIDE_QUESTS={
    miner:{id:'miner',name:'铸剑备料',description:'累计采得 8 份玄铁。',kind:'gather',resource:'iron',target:8,reward:{stones:40,earthBook:1}},
    woodland:{id:'woodland',name:'青竹寻踪',description:'完成青竹洞天三重试炼。',kind:'trial',trial:'bambooTrial',target:1,reward:{xp:100,spiritwood:5}},
    fireHunter:{id:'fireHunter',name:'赤霄止焰',description:'击败赤霄炎君。',kind:'boss',boss:'flameLord',target:1,reward:{ember:5,flameBook:1,core:2}},
    frostHunter:{id:'frostHunter',name:'北冥寻誓',description:'击败北冥霜龙。',kind:'boss',boss:'frostWyrm',target:1,reward:{frost:5,frostBook:1,core:2}},
    scholar:{id:'scholar',name:'道法兼修',description:'习得 4 门不同功法。',kind:'techniques',target:4,reward:{essence:4,insightPill:2}},
    explorer:{id:'explorer',name:'山海行者',description:'踏足全部 6 张地图。',kind:'maps',target:6,reward:{stones:120,thunderBook:1,core:3}},
    adept:{id:'adept',name:'一法通玄',description:'将任意一门功法研习至三重。',kind:'level',target:3,reward:{xp:180,essence:3}}
  };
  const TRIAL_REWARDS={bambooTrial:{first:{woodBook:1,jadeSword:1,core:2,essence:2},repeat:{stones:35,spiritwood:3,core:1}},fireTrial:{first:{flameBook:1,thunderCharm:1,core:3,ember:5},repeat:{stones:60,ember:3,core:1}},iceTrial:{first:{frostBook:1,frostRobe:1,core:4,frost:5},repeat:{stones:85,frost:3,core:1}}};
  return{MAPS,TECHNIQUES,ROOT_GRADES,ELEMENTS,RESOURCES,ITEMS,RECIPES,STORY,SIDE_QUESTS,TRIAL_REWARDS};
});
