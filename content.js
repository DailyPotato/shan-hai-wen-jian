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
    arrow:{id:'arrow',name:'穿云箭诀',description:'五箭扇射，中央灵箭穿透敌阵；灵弓适配时威力额外提高。',element:'wind',color:'#b3e8ca',manaCost:25,cooldown:6.5,resource:'spiritwood',passive:'speed',preferredWeapon:'bow'},
    sword:{id:'sword',name:'御剑诀',description:'三道飞剑与近身剑气。等级提高飞剑伤害与射程。',element:'metal',color:'#e4ddac',manaCost:28,cooldown:7,resource:'iron',passive:'attack'},
    flame:{id:'flame',name:'离火焚天',description:'发射爆裂火球，灼烧命中目标，周身炎环引燃近敌。',element:'fire',color:'#ef976b',manaCost:30,cooldown:8,resource:'ember',passive:'attack'},
    frost:{id:'frost',name:'玄冰凝霜',description:'五枚寒冰碎片穿透敌阵，并大幅减速近敌。',element:'ice',color:'#b3e7ff',manaCost:26,cooldown:7.5,resource:'frost',passive:'maxMp'},
    wood:{id:'wood',name:'长春引灵',description:'恢复气血，缠根定住近敌并伤害；适合持久历练。',element:'wood',color:'#a1dfb1',manaCost:32,cooldown:11,resource:'spiritwood',passive:'maxHp'},
    thunder:{id:'thunder',name:'九霄雷引',description:'雷击锁定前方目标并连锁最多五敌，造成短暂麻痹。',element:'thunder',color:'#c2acfa',manaCost:34,cooldown:8.5,resource:'essence',passive:'speed'},
    earth:{id:'earth',name:'厚土镇岳',description:'获得可吸收伤害的护盾，并以地震重击、震退近敌。',element:'earth',color:'#d3b182',manaCost:30,cooldown:10,resource:'iron',passive:'defense'}
  };
  const TECHNIQUE_GRADES={
    yellow:{id:'yellow',index:0,name:'黄阶',color:'#c6c6ad',description:'功法原本，保留初始威力。',multiplier:1,manaReduction:0,cooldownReduction:0,levelRequired:1,realmRequired:0,trialsRequired:[]},
    mystic:{id:'mystic',index:1,name:'玄阶',color:'#8ed8c2',description:'凝练法意，道术威力提高 12%，耗灵与冷却降低 4%。',multiplier:1.12,manaReduction:.04,cooldownReduction:.04,levelRequired:1,realmRequired:0,trialsRequired:[]},
    earth:{id:'earth',index:2,name:'地阶',color:'#8ebfe8',description:'洞天真传，道术威力提高 28%，耗灵与冷却降低 8%。',multiplier:1.28,manaReduction:.08,cooldownReduction:.08,levelRequired:2,realmRequired:1,trialsRequired:['bambooTrial']},
    heaven:{id:'heaven',index:3,name:'天阶',color:'#c7a5ef',description:'地宫悟道，道术威力提高 48%，耗灵与冷却降低 12%。',multiplier:1.48,manaReduction:.12,cooldownReduction:.12,levelRequired:3,realmRequired:2,trialsRequired:['fireTrial']},
    immortal:{id:'immortal',index:4,name:'仙阶',color:'#efcc80',description:'三境归一，道术威力提高 75%，耗灵与冷却降低 18%。',multiplier:1.75,manaReduction:.18,cooldownReduction:.18,levelRequired:3,realmRequired:3,trialsRequired:['bambooTrial','fireTrial','iceTrial']}
  };
  const ITEMS={};
  for(const r of Object.values(RESOURCES))ITEMS[r.id]={...r,type:'resource',grade:'凡品',resourceField:r.id};
  ITEMS.potions={id:'potions',name:'回春丹',description:'恢复 42% 气血与 25% 灵力。快捷键 R。',type:'consumable',grade:'凡品',resourceField:'potions',effect:'heal',price:18};
  const add=(id,name,type,grade,description,other)=>ITEMS[id]={id,name,type,grade,description,...other};
  add('spiritTea','凝神茶','consumable','凡品','立即恢复 55% 灵力。',{price:24,effect:'mana'});
  add('rageElixir','赤阳丹','consumable','灵品','持续 40 秒，攻击提高 25%，重复服用仅刷新时长。',{price:48,effect:'rage'});
  add('wardPowder','护体散','consumable','灵品','持续 45 秒，所受伤害降低 25%。',{price:42,effect:'ward'});
  add('insightPill','通灵丹','consumable','灵品','持续 60 秒，战斗、采集修为提高 30%。',{price:65,effect:'insight'});
  for(const t of Object.values(TECHNIQUES))if(t.id!=='sword')add(`${t.id}Book`,`${t.name}残卷`,'book','灵品',`残卷的物品珍稀度为灵品；研读后习得${t.name}黄阶一重。功法品阶需另行晋升。`,{technique:t.id,price:{arrow:35,flame:45,frost:55,wood:35,thunder:75,earth:50}[t.id]});
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
  const NPC_CHARACTERS={
    elder:{id:'elder',name:'顾清玄',role:'传功长老',skin:'elder',mapId:'main',x:300,y:1580,color:'#d6c29a',description:'掌管青云观传承的长老，重视功法重数，也教授黄、玄、地、天、仙五阶法意。',dialogue:'“重数是熟练，品阶是法意。先凝练一门功法，再走过三处秘境，方可窥见仙阶。”',choices:[{id:'respect',label:'请长老指点法意',description:'获得 2 玄铁与 20 修为，交情 +2。',reward:{iron:2,xp:20},rapport:2},{id:'practical',label:'先把基础练扎实',description:'获得 12 灵石，交情 +1。',reward:{stones:12},rapport:1}],services:[{id:'study',label:'配制悟法丹',description:'用灵髓辅以灵石配制 1 枚通灵丹；每 20 秒可配制一次。',cost:{stones:20,essence:1},reward:{insightPill:1},cooldown:20,minRapport:1}]},
    disciple:{id:'disciple',name:'陆青禾',role:'论剑同门',skin:'disciple',mapId:'main',x:790,y:1780,color:'#89c9ca',description:'常在山门论剑的年轻弟子，以真实斩妖历练印证剑法。',dialogue:'“空谈剑意不如出山护人。我们各斩六只妖兽，再回来谈今日所得。”',choices:[{id:'respect',label:'同门一道护山',description:'获得 1 枚回春丹，交情 +2。',reward:{potions:1},rapport:2},{id:'practical',label:'先筹备路上的盘缠',description:'获得 10 灵石，交情 +1。',reward:{stones:10},rapport:1}],commission:{name:'以战证剑',description:'接取后再击败 6 个真实敌人。',kind:'kills',target:6,relative:true,reward:{iron:4,stones:35,xp:70}}},
    herbalist:{id:'herbalist',name:'苏百草',role:'采药师',skin:'herbalist',mapId:'main',x:250,y:1960,color:'#a7d69b',description:'识遍山野灵草的药师，委托采药并以草药代炼回春丹。',dialogue:'“药性要亲自辨认，背包里旧存的草不算今日所得。替我再采十株，我便为你备好丹药。”',choices:[{id:'respect',label:'愿向前辈学辨草',description:'获得 2 灵草，交情 +2。',reward:{herbs:2},rapport:2},{id:'practical',label:'请教灵木入药之法',description:'获得 1 灵木，交情 +1。',reward:{spiritwood:1},rapport:1}],commission:{name:'山野新药',description:'接取后从野外资源点新采 10 株灵草。',kind:'herbs',target:10,relative:true,reward:{potions:3,spiritTea:1,xp:60}},services:[{id:'brew',label:'代炼回春丹 ×3',description:'消耗草药与灵石炼出 3 枚回春丹；每 15 秒一次。',cost:{herbs:4,stones:10},reward:{potions:3},cooldown:15,minRapport:1}]},
    hunter:{id:'hunter',name:'燕孤山',role:'猎妖人',skin:'hunter',mapId:'main',x:470,y:2080,color:'#d1a386',description:'常年巡山的猎妖人，追踪苍牙狼王，并传授防护用药。',dialogue:'“苍牙不只是贪食，它的妖丹里有逆流的灵气。斩了狼王，带回消息，我就把压箱底的土法交给你。”',choices:[{id:'respect',label:'为山民追猎苍牙',description:'获得 1 玄铁与 1 回春丹，交情 +2。',reward:{iron:1,potions:1},rapport:2},{id:'practical',label:'问清此行酬劳',description:'获得 12 灵石，交情 +1。',reward:{stones:12},rapport:1}],commission:{name:'苍牙踪迹',description:'击败苍牙狼王；已完成的真实首领记录也可交差。',kind:'boss',boss:'wolfKing',target:1,relative:false,reward:{core:1,earthBook:1,xp:60}},services:[{id:'ward',label:'猎妖护体散',description:'代制 1 份护体散；每 20 秒一次。',cost:{iron:2,herbs:1,stones:10},reward:{wardPowder:1},cooldown:20,minRapport:1}]},
    broker:{id:'broker',name:'裴九商',role:'灵材行商',skin:'broker',mapId:'main',x:750,y:1960,color:'#d8bc79',description:'在各地收购灵材的行商，以明确的材料与灵石代价交换稀有资源。',dialogue:'“玄铁换灵木，妖丹换灵髓，货清账明。做过一桩买卖，或诚心结交，便可谈更稀有的货。”',choices:[{id:'respect',label:'以诚结交行商',description:'获得 1 玄铁，交情 +2，开启妖丹换灵髓。',reward:{iron:1},rapport:2},{id:'practical',label:'先议一笔普通买卖',description:'获得 8 灵石，交情 +1。完成普通交易可增进交情。',reward:{stones:8},rapport:1}],services:[{id:'timber',label:'玄铁换灵木',description:'3 玄铁与 8 灵石换 2 灵木；每 15 秒一次。',cost:{iron:3,stones:8},reward:{spiritwood:2},cooldown:15,minRapport:1},{id:'ore',label:'灵木换玄铁',description:'3 灵木与 8 灵石换 2 玄铁；每 15 秒一次。',cost:{spiritwood:3,stones:8},reward:{iron:2},cooldown:15,minRapport:1},{id:'essence',label:'妖丹换灵髓',description:'2 妖丹与 18 灵石换 1 灵髓；交情 2 以上，每 30 秒一次。',cost:{core:2,stones:18},reward:{essence:1},cooldown:30,minRapport:2}]},
    fireArtisan:{id:'fireArtisan',name:'祝炎',role:'火脉匠师',skin:'fireArtisan',mapId:'red',x:300,y:1580,color:'#e49a70',description:'赤霄驿站的火脉匠师，供应赤焰砂并代炼攻伐丹药。',dialogue:'“火脉中最难的是收束。既然来了赤霄，就学着让烈焰留在掌心，而不是落在山民屋顶。”',choices:[{id:'respect',label:'学习收束火脉',description:'获得 2 赤焰砂，交情 +2。',reward:{ember:2},rapport:2},{id:'practical',label:'为灵剑备些铁料',description:'获得 2 玄铁，交情 +1。',reward:{iron:2},rapport:1}],services:[{id:'ember',label:'熔铁炼赤焰砂',description:'3 玄铁与 12 灵石炼成 3 赤焰砂；每 15 秒一次。',cost:{iron:3,stones:12},reward:{ember:3},cooldown:15,minRapport:1},{id:'rage',label:'双份赤阳丹',description:'3 赤焰砂、2 灵草与 10 灵石炼成 2 枚赤阳丹；交情 2 以上，每 20 秒一次。',cost:{ember:3,herbs:2,stones:10},reward:{rageElixir:2},cooldown:20,minRapport:2}]},
    snowHealer:{id:'snowHealer',name:'白霁',role:'雪域医师',skin:'snowHealer',mapId:'snow',x:300,y:1580,color:'#bedde9',description:'北冥驿站的医师，以寒晶稳定药性，并为伤者清除寒气。',dialogue:'“北冥的寒气会留在经脉里。备好丹茶，若受了寒伤，再带些药草到我这里。”',choices:[{id:'respect',label:'请教寒晶药性',description:'获得 1 寒晶，交情 +2。',reward:{frost:1},rapport:2},{id:'practical',label:'先备一枚救急丹',description:'获得 1 回春丹，交情 +1。',reward:{potions:1},rapport:1}],services:[{id:'supplies',label:'北冥丹茶包',description:'2 寒晶、2 灵草与 12 灵石换 2 回春丹和 1 凝神茶；每 20 秒一次。',cost:{frost:2,herbs:2,stones:12},reward:{potions:2,spiritTea:1},cooldown:20,minRapport:1},{id:'cleanse',label:'祛寒疗伤',description:'恢复气血上限的 50%、灵力上限的 30%，祛除减速；每 20 秒一次。气血灵力全满且未受寒时不收费。',cost:{herbs:1,frost:1,stones:10},reward:{},restore:{hpPercent:.5,mpPercent:.3,clearSlow:true},cooldown:20,minRapport:1}]},
    trialKeeper:{id:'trialKeeper',name:'青篁',role:'守阵灵',skin:'trialKeeper',mapId:'bambooTrial',x:300,y:1580,color:'#adc7a2',description:'青竹洞天的守阵灵，见证三重试炼，并将灵木与妖丹凝成灵髓。',dialogue:'“我只记录真正走过三重阵的人。你可随时退出，也可带着自己的剑法回来。”',choices:[{id:'respect',label:'立誓走过三重竹阵',description:'获得 1 灵髓，交情 +2。',reward:{essence:1},rapport:2},{id:'practical',label:'请教阵中妖丹来历',description:'获得 1 妖丹，交情 +1。',reward:{core:1},rapport:1}],commission:{name:'竹阵见证',description:'完成青竹洞天的三波真实战斗；已有首通记录可交差。',kind:'trial',trial:'bambooTrial',target:1,relative:false,reward:{spiritwood:4,wardPowder:1,xp:80}},services:[{id:'refine',label:'凝练青竹灵髓',description:'3 灵木、1 妖丹与 15 灵石凝成 2 灵髓；交情 2 以上，每 25 秒一次。',cost:{spiritwood:3,core:1,stones:15},reward:{essence:2},cooldown:25,minRapport:2}]}
  };
  for(const npc of Object.values(NPC_CHARACTERS))MAPS[npc.mapId].npcs.push({id:npc.id,name:npc.name,role:npc.role,skin:npc.skin,color:npc.color,x:npc.x,y:npc.y});
  const WEAPON_TYPES={
    sword:{id:'sword',name:'灵剑',description:'近身扇形斩击，适配御剑诀。',range:108,cooldown:.36,damageMultiplier:1,projectileSpeed:0,color:'#e9dfaf'},
    bow:{id:'bow',name:'灵弓',description:'远程直射灵箭，不消耗箭矢，适配穿云箭诀。',range:760,cooldown:.55,damageMultiplier:1.45,projectileSpeed:640,color:'#b3e8ca'},
    staff:{id:'staff',name:'法杖',description:'发射灵力法弹，命中后小范围溅射，适配五行法术。',range:620,cooldown:.65,damageMultiplier:1.35,projectileSpeed:430,color:'#b6c7f0'}
  };
  for(const item of Object.values(ITEMS))if(item.slot==='weapon')item.weaponKind='sword';
  add('trainingBow','青竹练弓','equipment','凡品','轻便灵弓，使左键变为真正的远程箭矢。',{slot:'weapon',weaponKind:'bow',tier:0,stats:{attack:0}});
  add('ironBow','玄铁长弓','equipment','凡品','攻击 +8，远射箭矢。',{slot:'weapon',weaponKind:'bow',tier:1,stats:{attack:8}});
  add('stormBow','追风灵弓','equipment','灵品','攻击 +18、速度 +8，适配穿云箭诀。',{slot:'weapon',weaponKind:'bow',tier:2,stats:{attack:18,speed:8}});
  add('celestialBow','天罡逐星弓','equipment','仙品','攻击 +36、灵力上限 +25，风系道术额外 +12%。',{slot:'weapon',weaponKind:'bow',tier:4,stats:{attack:36,maxMp:25},element:'wind',affinity:.12});
  add('trainingStaff','引灵木杖','equipment','凡品','初学法杖，左键发射灵力法弹，灵力上限 +6。',{slot:'weapon',weaponKind:'staff',tier:0,stats:{maxMp:6}});
  add('spiritStaff','长春灵杖','equipment','凡品','攻击 +9、灵力上限 +15。',{slot:'weapon',weaponKind:'staff',tier:1,stats:{attack:9,maxMp:15}});
  add('thunderStaff','九霄雷杖','equipment','灵品','攻击 +19、灵力上限 +25，雷法额外 +10%。',{slot:'weapon',weaponKind:'staff',tier:2,stats:{attack:19,maxMp:25},element:'thunder',affinity:.10});
  add('astralStaff','太虚星辰杖','equipment','仙品','攻击 +34、灵力上限 +45、灵力回复 +1/秒。',{slot:'weapon',weaponKind:'staff',tier:4,stats:{attack:34,maxMp:45,manaRegen:1}});
  add('heavenSword','太清斩仙剑','equipment','仙品','攻击 +38、气血上限 +35，金系道术额外 +12%。',{slot:'weapon',weaponKind:'sword',tier:4,stats:{attack:38,maxHp:35},element:'metal',affinity:.12});
  const extraRecipes={ironBow:{name:'铸造玄铁长弓',cost:{spiritwood:5,iron:3,stones:40},output:{ironBow:1},realmRequired:0},spiritStaff:{name:'制成长春灵杖',cost:{spiritwood:6,essence:1,stones:45},output:{spiritStaff:1},realmRequired:0},stormBow:{name:'追风灵弓',cost:{spiritwood:8,iron:5,core:2,stones:90},output:{stormBow:1},realmRequired:1},thunderStaff:{name:'九霄雷杖',cost:{spiritwood:6,iron:4,essence:3,core:2,stones:100},output:{thunderStaff:1},realmRequired:1}};
  for(const[id,r]of Object.entries(extraRecipes))RECIPES[id]={id,...r,description:`消耗${Object.entries(r.cost).map(([k,v])=>`${RESOURCES[k].name} ${v}`).join('、')}制作。`};
  for(const t of Object.values(TECHNIQUES))t.preferredWeapon=t.id==='sword'?'sword':t.id==='arrow'?'bow':'staff';
  ITEMS.contribution={id:'contribution',name:'宗门贡献',type:'currency',grade:'凡品',description:'完成宗门历练所得，可在宗门换取灵材与高阶兵器。'};
  MAPS.sect=map('sect','青云宗','sect',0,'sect','独立宗门大院：宗主大殿、传功阁、铸兵阁、丹房、藏经亭、灵材库与破境坛。',[],[],[],[],[{id:'worldGate',name:'前往青云山海',x:1600,y:2110,target:'main'}]);
  MAPS.sect.hub={x:1600,y:1200,radius:1700};MAPS.sect.start={x:1600,y:1800};MAPS.sect.roads=[[[1600,2110],[1600,1200],[1600,760]],[[790,1020],[1200,1200],[1600,1200],[2410,1020]],[[840,1580],[1600,1600],[2360,1580]]];
  MAPS.sect.npcs=[{id:'master',name:'凌云真人',role:'宗主',skin:'elder',color:'#d9d0b8',x:1600,y:800},{id:'elder',name:'顾清玄',role:'传功长老',skin:'elder',color:'#d6c29a',x:1200,y:940},{id:'disciple',name:'陆青禾',role:'论剑同门',skin:'disciple',color:'#89c9ca',x:2040,y:940},{id:'forge',name:'铸兵阁',role:'兵器锻造',x:790,y:1080},{id:'alchemy',name:'丹房',role:'丹药炼制',x:2410,y:1080},{id:'broker',name:'裴九商',role:'灵材库',skin:'broker',color:'#d8bc79',x:2360,y:1580},{id:'storyteller',name:'藏经守卷人',role:'山海藏经',x:840,y:1580},{id:'hunter',name:'燕孤山',role:'宗门任务',skin:'hunter',color:'#d1a386',interaction:'sect',x:1150,y:1570},{id:'cultivation',name:'太清破境坛',role:'独立修行入口',x:1600,y:1260},{id:'waygate',name:'山海传送阵',x:1600,y:1900}];
  NPC_CHARACTERS.master={id:'master',name:'凌云真人',role:'宗主',skin:'elder',mapId:'main',x:440,y:1680,color:'#d9d0b8',description:'主持山门与问剑之路的宗主，说明主线、境界和宗门历练。功法细节由顾清玄负责。',dialogue:'“问剑先护山民，修行再问自身。想知道下一步去哪里，来问我；想推敲功法，去找顾长老。”',choices:[{id:'respect',label:'请宗主指出问剑之路',description:'获得 10 灵石，交情 +2。',reward:{stones:10},rapport:2},{id:'practical',label:'准备丹药再出发',description:'获得 1 回春丹，交情 +1。',reward:{potions:1},rapport:1}],services:[]};
  const EXPLORATION_SITES={
    lostCamp:{id:'lostCamp',mapId:'main',x:1050,y:1650,kind:'chest',name:'失落营地',description:'被妖兽侵袭的山民营地，遗留下急救药箱。',realmRequired:0,reward:{potions:2,stones:20,xp:70}},
    ancientTablet:{id:'ancientTablet',mapId:'main',x:600,y:520,kind:'tablet',name:'北山剑碑',description:'风雨侵蚀的古剑碑，仍留有修行者的行剑心得。',realmRequired:0,reward:{iron:3,xp:100}},
    herbGarden:{id:'herbGarden',mapId:'main',x:1200,y:2100,kind:'garden',name:'山野药畦',description:'早年药师留下的一片药畦，采收后不再重复生长。',realmRequired:0,reward:{herbs:6,spiritTea:1,xp:60}},
    mountainCache:{id:'mountainCache',mapId:'main',x:1520,y:1000,kind:'chest',name:'行旅秘匣',description:'旧时行商在山路旁藏下的补给匣。',realmRequired:0,reward:{spiritwood:3,stones:30,xp:100}},
    bambooTablet:{id:'bambooTablet',mapId:'main',x:1870,y:480,kind:'tablet',name:'青竹风痕碑',description:'竹林古碑记载了穿云箭法的一段残章。',realmRequired:1,reward:{arrowBook:1,essence:2,xp:180}},
    ruinChest:{id:'ruinChest',mapId:'main',x:2730,y:1470,kind:'chest',name:'天门遗藏',description:'石卫巡逻区域里的旧宝藏。',realmRequired:2,reward:{core:2,essence:3,stones:70,xp:300}},
    ashChest:{id:'ashChest',mapId:'red',x:1000,y:1880,kind:'chest',name:'荒原驿车',description:'被熔风卷落的驿车仍存有未损坏的物资。',realmRequired:1,reward:{ember:4,iron:3,potions:2,xp:200}},
    flameTablet:{id:'flameTablet',mapId:'red',x:2170,y:770,kind:'tablet',name:'赤霄盟碑',description:'旧盟的刻文使你更了解火脉的呼吸。',realmRequired:1,reward:{essence:2,rageElixir:2,xp:250}},
    emberGarden:{id:'emberGarden',mapId:'red',x:2810,y:2090,kind:'garden',name:'赤焰药圃',description:'依火脉生长的灵草只可完整采收一次。',realmRequired:1,reward:{ember:5,herbs:5,core:1,xp:220}},
    frozenCamp:{id:'frozenCamp',mapId:'snow',x:1000,y:2100,kind:'chest',name:'雪原旧营',description:'冰雪下的旧营留下了丹茶与寒晶。',realmRequired:2,reward:{frost:4,potions:2,spiritTea:2,xp:280}},
    frostTablet:{id:'frostTablet',mapId:'snow',x:2020,y:650,kind:'tablet',name:'北冥誓碑',description:'誓碑记录稳定寒流的方法，读过后留在山海志里。',realmRequired:2,reward:{essence:3,core:2,xp:350}},
    snowGarden:{id:'snowGarden',mapId:'snow',x:2650,y:1720,kind:'garden',name:'冰莲药畦',description:'深雪中的灵药畦，留下了一次丰厚的收获。',realmRequired:2,reward:{frost:5,herbs:6,wardPowder:2,xp:300}}
  };
  const ACTIVITIES={
    bounty:{id:'bounty',type:'bounty',name:'宗门悬赏',description:'清剿三类妖修，应对近战追击、灵弹远射与重甲敌人；境界越高，对手越强。',realmRequired:1,mapId:'red',firstReward:{xp:1100,contribution:60,stones:70,core:2,essence:2},repeatReward:{xp:450,contribution:20,stones:25},rewardLimit:5},
    defense:{id:'defense',type:'defense',name:'护脉守护',description:'守住灵脉晶石，击退三波敌人。敌人优先袭击晶石，失守即告失败。',realmRequired:2,mapId:'main',firstReward:{xp:2200,contribution:90,stones:120,core:3,essence:3},repeatReward:{xp:900,contribution:30,stones:40},rewardLimit:4},
    tower:{id:'tower',type:'tower',name:'镇妖塔',description:'五层不同敌阵；每过一层选剑意、回元或凝神祝福。各层首次奖励独立，登顶才能突破化神。',realmRequired:3,mapId:'main',firstReward:{xp:3000,contribution:150,stones:180,core:4,essence:4},repeatReward:{xp:1400,contribution:45,stones:60},rewardLimit:3},
    tribulation:{id:'tribulation',type:'tribulation',name:'九霄渡劫',description:'化神后在雷劫场存活。随炼虚、合体递增为二重、三重雷劫；提示范围是真实落雷区域。',realmRequired:4,mapId:'snow',firstReward:{xp:4000,contribution:120,stones:180,core:4,essence:4},repeatReward:{xp:1000,contribution:35,stones:50},rewardLimit:3}
  };
  const SECT_SUPPLIES={
    timber:{id:'timber',name:'宗门草木包',description:'常用草木与药材。',cost:{contribution:20},reward:{herbs:6,spiritwood:3},realmRequired:0},
    iron:{id:'iron',name:'玄铁补给',description:'用于铸兵和研习。',cost:{contribution:20},reward:{iron:5},realmRequired:0},
    spirit:{id:'spirit',name:'高阶灵材包',description:'妖丹与灵髓，用于功法晋阶及破境。',cost:{contribution:35},reward:{core:2,essence:2},realmRequired:1},
    sword:{id:'sword',name:'太清斩仙剑',description:'化神后凭贡献领用高级灵剑。',cost:{contribution:240,stones:160},reward:{heavenSword:1},realmRequired:4},
    bow:{id:'bow',name:'天罡逐星弓',description:'化神后凭贡献领用高级灵弓。',cost:{contribution:240,stones:160},reward:{celestialBow:1},realmRequired:4},
    staff:{id:'staff',name:'太虚星辰杖',description:'化神后凭贡献领用高级法杖。',cost:{contribution:240,stones:160},reward:{astralStaff:1},realmRequired:4}
  };
  // A technique's grade belongs to its manuscript; practice only raises its learned level.
  const TECHNIQUE_DIRECTIONS={
    sword:{id:'sword',name:'御剑',description:'飞剑与近身剑气，适配灵剑。'},
    arrow:{id:'arrow',name:'灵弓',description:'远射灵箭，选择集束或宽幅箭雨。'},
    flame:{id:'flame',name:'火法',description:'火球爆裂与灼烧，适配法杖。'},
    frost:{id:'frost',name:'冰法',description:'穿透冰片与减速，适配法杖。'},
    wood:{id:'wood',name:'木法',description:'回春与缠根，适配法杖。'},
    thunder:{id:'thunder',name:'雷法',description:'锁敌连雷与麻痹，适配法杖。'},
    earth:{id:'earth',name:'土法',description:'护盾、震地与击退，适配法杖。'}
  };
  const techniqueNames={
    sword:['御剑诀','分光剑诀','青莲剑阵','太清御剑','万剑归宗'],
    arrow:['穿云箭诀','逐风连矢','贯星箭经','落日真诀','九天射日'],
    flame:['离火焚天','赤炎爆诀','焚脉火典','朱雀真法','大日焚空'],
    frost:['玄冰凝霜','寒潮冰诀','北冥冰魄','霜天封界','太阴冰轮'],
    wood:['长春引灵','青藤缠灵','枯荣生息','青帝长生','万木归元'],
    thunder:['九霄雷引','惊霆连诀','天罡雷经','紫霄御雷','太清劫雷'],
    earth:['厚土镇岳','岩甲震诀','山岳守心经','地元镇域','玄黄不灭']
  };
  const fixedGrades=Object.values(TECHNIQUE_GRADES).sort((a,b)=>a.index-b.index);
  for(const grade of fixedGrades){
    grade.realmRequired=grade.index;
    grade.description=`先天固定${grade.name}，习得后只能研习重数，不能提升品阶。`;
  }
  const baseTechniques=Object.values(TECHNIQUES).map(t=>({...t}));
  for(const base of baseTechniques)for(const grade of fixedGrades){
    const i=grade.index,id=base.id+(i?'_'+grade.id:''),profile={};
    let effect;
    if(base.id==='sword'){profile.projectileCount=[3,4,5,6,7][i];effect=`放出 ${profile.projectileCount} 道飞剑，并斩出近身剑气。`;}
    else if(base.id==='arrow'){profile.projectileCount=[5,3,5,7,9][i];profile.spread=[.14,.08,.12,.16,.19][i];effect=`${profile.projectileCount} 箭${i===1?'集束':'扇射'}，中央灵箭穿透敌阵。`;}
    else if(base.id==='frost'){profile.projectileCount=[5,3,5,7,9][i];profile.spread=[.15,.09,.14,.18,.21][i];effect=`发射 ${profile.projectileCount} 枚${i===1?'集束':'扇形'}寒冰碎片，穿透并减速近敌。`;}
    else if(base.id==='flame'){profile.explosionRadius=[54,64,76,88,100][i];effect=`爆裂火球炸开 ${profile.explosionRadius} 尺范围，灼烧目标，并释放近身炎环。`;}
    else if(base.id==='wood'){profile.rootDuration=[1.5,1.8,2.2,2.6,3][i];effect=`回春疗伤，缠根基础定身 ${profile.rootDuration} 秒，重数增加可延长，并造成木伤。`;}
    else if(base.id==='thunder'){profile.chainTargets=[5,3,5,6,8][i];effect=`雷击连锁最多 ${profile.chainTargets} 敌，造成短暂麻痹。`;}
    else{profile.knockback=[18,22,26,30,36][i];effect=`凝成吸收伤害的护盾，震地并击退近敌 ${profile.knockback} 尺。`;}
    const cost={contribution:[0,35,80,150,260][i],stones:[0,25,55,95,160][i]};
    if(i){cost[base.resource]=[0,2,4,6,8][i];if(i>=2)cost.core=i-1;if(i>=3)cost.essence=(cost.essence||0)+i-2;}
    else{delete cost.contribution;delete cost.stones;}
    TECHNIQUES[id]={...base,id,name:techniqueNames[base.id][i],baseId:base.id,direction:base.id,directionName:TECHNIQUE_DIRECTIONS[base.id].name,
      gradeIndex:i,grade:grade.id,gradeName:grade.name,gradeColor:grade.color,power:grade.multiplier,
      rangeMultiplier:1+i*.06,manaMultiplier:1-grade.manaReduction,cooldownMultiplier:1-grade.cooldownReduction,
      requiredRealm:grade.realmRequired,requiredTrials:[...grade.trialsRequired],acquireCost:cost,castProfile:profile,
      preferredWeapon:base.id==='sword'?'sword':base.id==='arrow'?'bow':'staff',
      description:`${effect} ${grade.name}品阶固定；威力系数 ${grade.multiplier.toFixed(2)}，作用范围系数 ${(1+i*.06).toFixed(2)}。`,
      acquisition:i?'青云宗藏经：凭境界、秘境见证与贡献换取经卷。':base.id==='sword'?'初入山门已习得，也可在宗门领卷。':base.id==='arrow'?'加入宗门赠卷，或探索青竹风痕碑。':'山海见闻、人物委托、秘境首通或行商购卷。'};
    const previous=ITEMS[id+'Book'];
    add(id+'Book',TECHNIQUES[id].name+'经卷','book',grade.name,`研读后习得${TECHNIQUES[id].name}一重，${grade.name}品阶固定。`,
      {technique:id,...(!i&&previous?.price?{price:previous.price}:{})});
  }
  NPC_CHARACTERS.elder.description='掌管青云宗传承的长老。各门功法先天分黄、玄、地、天、仙五阶，研习可提升重数；高阶经卷须凭历练获取。';
  NPC_CHARACTERS.elder.dialogue='“重数靠勤修，品阶由经卷决定。凡法不能炼成仙法；先在山海历练，再到藏经阁寻适合你的传承。”';
  NPC_CHARACTERS.elder.choices[0].label='请长老指点功法搭配';
  SECT_SUPPLIES.spirit.description='妖丹与灵髓，用于高阶功法研习、购卷与破境。';
  const SECT_POSITIONS={east:{id:'east',label:'东方木位',element:'wood'},south:{id:'south',label:'南方火位',element:'fire'},center:{id:'center',label:'中央土位',element:'earth'},west:{id:'west',label:'西方金位',element:'metal'},north:{id:'north',label:'北方水位',element:'water'}};
  const SECT_FACILITIES={
    garden:{id:'garden',name:'灵药田',description:'弟子照料药畦，生产灵草与灵木；木位相契。',preferredElement:'wood',position:'east',duration:45,reward:{herbs:3,spiritwood:1}},
    forge:{id:'forge',name:'宗门锻坊',description:'弟子收束炉火，生产玄铁与赤焰砂；金位相契。',preferredElement:'metal',position:'west',duration:60,reward:{iron:2,ember:1}},
    library:{id:'library',name:'藏经阁',description:'弟子整理古卷，提供修为与灵髓；水位相契。',preferredElement:'water',position:'north',duration:75,reward:{xp:55,essence:1}}
  };
  const SECT_DISCIPLES={qinghe:{id:'qinghe',name:'陆青禾',element:'wood',realmRequired:0,recruitCost:{}},yanming:{id:'yanming',name:'沈炎明',element:'fire',realmRequired:2,recruitCost:{contribution:45,stones:40}},ruoshui:{id:'ruoshui',name:'林若水',element:'water',realmRequired:3,recruitCost:{contribution:70,stones:60}}};
  const DAO_DIRECTIONS={sword:{id:'sword',name:'剑道',description:'凝练近身剑锋、身法与以战养气。'},bow:{id:'bow',name:'弓道',description:'灵箭的威力、弹速与贯穿。'},art:{id:'art',name:'术道',description:'五行连携、灵力调度与采集效率。'}};
  const DAO_NODES={
    sword_edge:{id:'sword_edge',direction:'sword',name:'锋芒',description:'灵剑近身普攻伤害提高 12%。',cost:1,realmRequired:0,prerequisites:[],effects:{swordDamage:1.12}},
    sword_flow:{id:'sword_flow',direction:'sword',name:'流云',description:'灵剑普攻射程增加 18，攻击间隔缩短 12%。',cost:2,realmRequired:2,prerequisites:['sword_edge'],effects:{swordRangeBonus:18,swordCooldown:.88}},
    sword_return:{id:'sword_return',direction:'sword',name:'剑气归元',description:'近身剑击实际造成伤害的 8% 回复气血，每次攻击最多回复气血上限的 4%。',cost:3,realmRequired:4,prerequisites:['sword_flow'],effects:{swordLeech:.08,swordLeechCap:.04}},
    bow_focus:{id:'bow_focus',direction:'bow',name:'穿云',description:'灵弓普攻箭矢伤害提高 12%。',cost:1,realmRequired:0,prerequisites:[],effects:{bowDamage:1.12}},
    bow_wind:{id:'bow_wind',direction:'bow',name:'追风',description:'灵弓普攻弹速提高 18%，攻击间隔缩短 15%。',cost:2,realmRequired:2,prerequisites:['bow_focus'],effects:{bowSpeed:1.18,bowCooldown:.85}},
    bow_pierce:{id:'bow_pierce',direction:'bow',name:'贯星',description:'普通灵箭可贯穿两名敌人，继续使用真实飞行与碰撞判定。',cost:3,realmRequired:4,prerequisites:['bow_wind'],effects:{bowPierce:2}},
    art_cycle:{id:'art_cycle',direction:'art',name:'五行流转',description:'木火土金水木相生的衔接窗口由 6 秒延长到 8 秒。',cost:1,realmRequired:0,prerequisites:[],effects:{comboWindow:8}},
    art_breath:{id:'art_breath',direction:'art',name:'调息通灵',description:'Q/F 道术耗灵减少 10%，五行相生返灵由 6 提高到 10。最低耗灵仍为 12。',cost:2,realmRequired:2,prerequisites:['art_cycle'],effects:{spellMana:.9,comboRefund:10}},
    art_harvest:{id:'art_harvest',direction:'art',name:'寻脉辨药',description:'普通野外采集产量提高 25%，向上取整；稀有妖丹与灵髓、遗迹和掉落不增产。',cost:3,realmRequired:4,prerequisites:['art_breath'],effects:{gatherYield:1.25}}
  };
  const ALCHEMY_RECIPES={};for(const id of ['healing','tea','ward']){const r=RECIPES[id];ALCHEMY_RECIPES[id]={id,name:r.name,description:'以分阶段控火、凝丹炼制；策略影响实际产量，药效沿用丹方。',cost:{...r.cost},baseOutput:{...r.output},realmRequired:r.realmRequired};}
  const ALCHEMY_HEAT={low:{id:'low',label:'文火养性',description:'七秒温养。慢凝比原配方多得 2 份，快凝保持原产量。',duration:7,cost:{}},balanced:{id:'balanced',label:'平火调和',description:'五秒调和。慢凝多得 1 份，快凝保持原产量。',duration:5,cost:{}},high:{id:'high',label:'武火精炼',description:'另耗 1 赤焰砂，三秒精炼。慢凝多得 2 份；快凝会焦炼，少得 1 份，最低 1 份。',duration:3,cost:{ember:1}}};
  const ALCHEMY_SEAL={slow:{id:'slow',label:'慢凝聚元',description:'四秒凝结，完整保留控火策略带来的增产。',duration:4,cost:{}},fast:{id:'fast',label:'快凝收炉',description:'一秒收炉，文火与平火保持原产量；武火来不及调和，会损失产量。',duration:1,cost:{}}};
  return{MAPS,TECHNIQUES,TECHNIQUE_DIRECTIONS,TECHNIQUE_GRADES,NPC_CHARACTERS,WEAPON_TYPES,EXPLORATION_SITES,ACTIVITIES,SECT_SUPPLIES,SECT_POSITIONS,SECT_FACILITIES,SECT_DISCIPLES,DAO_DIRECTIONS,DAO_NODES,ALCHEMY_RECIPES,ALCHEMY_HEAT,ALCHEMY_SEAL,ROOT_GRADES,ELEMENTS,RESOURCES,ITEMS,RECIPES,STORY,SIDE_QUESTS,TRIAL_REWARDS};
});
