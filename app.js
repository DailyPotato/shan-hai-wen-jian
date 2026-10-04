/* 山海问剑 — browser UI, input, local saves, and synthesized ambient audio. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SAVE_KEY = 'shan-hai-wen-jian.save.v1';
  const AUDIO_KEY = 'shan-hai-wen-jian.audio';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const icons = {
    sword: '<path d="m23 3 5 5-15 18-5 1 1-5Z"/><path d="m5 20 12 10M8 27l-4 5M23 3l-2 8"/>',
    bow: '<path d="M9 3c21 3 21 25 0 28l7-14Z"/><path d="M3 17h27m-6-4 6 4-6 4M9 3l7 14-7 14"/>',
    staff: '<path d="m10 30 13-21M19 4l8-1 4 7-8 5-7-4Z"/><path d="m22 6 4 2-1 3-4-1Z"/>',
    arrow: '<path d="m5 29 23-24m-9 1 9-1-1 9M4 24l6 6M8 20l6 6"/><path d="M3 14C4 4 16 0 24 3M28 17c4 9-3 14-12 14"/>',
    skill: '<path d="m23 5 4 4-13 14-4 1 1-4Z"/><path d="m7 19 10 9M11 24l-4 5M6 13C2 20 5 30 15 31M22 2c8 2 12 10 8 16M3 11l4 2 2-4M31 19l-1-4-4 1"/>',
    dash: '<path d="m15 8 8 8-8 8M21 8l8 8-8 8M3 8h7M1 16h10M3 24h7"/>',
    potion: '<path d="M13 3h8v6l7 11v7a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4v-7l7-11Z"/><path d="M11 3h12M9 21h16M13 14h8M17 23v5M14.5 25.5h5"/>',
    interact: '<path d="M11 16V7a2 2 0 0 1 4 0v9-12a2 2 0 0 1 4 0v12-9a2 2 0 0 1 4 0v10-6a2 2 0 0 1 4 0v10c0 7-3 10-8 10h-3c-3 0-5-3-7-6l-5-8a2 2 0 0 1 3-3l4 5"/>',
    herb: '<path d="M16 31V15M16 23C5 23 3 13 4 8c10 0 13 8 12 15ZM16 17c10 0 13-8 12-13-10 0-13 7-12 13Z"/>',
    stone: '<path d="m17 2 12 12-6 17H10L3 14Z"/><path d="m17 2-6 12 6 17 6-17ZM3 14h26"/>',
    forge: '<path d="M5 13h24l-7 7H11ZM11 20v6H7v5h20v-5h-6v-6M15 2l8 4-4 7-8-4Z"/>',
    flame:'<path d="M18 2c3 9-1 9 4 14 1-4 2-5 4-7 9 15 4 23-10 23C3 32 1 21 9 14c-1 8 5 5 7 2 3-5 0-7 2-14Z"/>',
    frost:'<path d="M17 2v30M4 9l26 15M4 25 30 9M13 5l4 4 4-4M13 29l4-4 4 4M4 14l6-1-1-6M30 20l-6 1 1 6M4 20l6 1-1 6M30 14l-6-1 1-6"/>',
    wood:'<path d="M17 32V13M17 25C7 25 4 15 5 9c9 0 14 7 12 16ZM17 18c10 0 13-9 12-15-10 0-13 8-12 15Z"/>',
    thunder:'<path d="m19 2-11 17h9l-4 13L27 13h-9Z"/><path d="m3 6 3 3M29 27l3 3M3 29l4-2"/>',
    earth:'<path d="m17 2 13 6v10c0 7-8 13-13 15C12 31 4 25 4 18V8Z"/><path d="m9 23 5-8 4 5 4-7 5 10Z"/>',
  };
  const svg = icon => `<svg viewBox="0 0 34 34" aria-hidden="true">${icons[icon] || icons.sword}</svg>`;
  let state = null;
  let renderer;
  let modalKind = '';
  let saveAvailable = false;
  let savedData = null;
  let lastFrame = performance.now();
  let saveTimer = 0;
  let mapTimer = 0;
  let hudTimer = 0;
  let pointer = {x: innerWidth / 2 + 100, y: innerHeight / 2, moved: false};
  let mouseAttack = false;
  let pending = {};
  let seenLogs = [];
  let previouslyDead = false;
  let previouslyWon = false;
  let lastZone = '';
  let panelMessage = '';
  let lastModalFocus = null;
  let bagTab = 'resources';
  let mapSelection = 'main';
  let selectedTechnique = 'sword';
  let lastMapId = '';
  let masterTopic = 'welcome';
  let activityMarkup = '';
  let sectTab = 'routes';
  let selectedFacility = 'garden';
  let cultivationTab = 'retreat';
  let selectedDao = '';
  let selectedAlchemyRecipe = 'healing';
  let alchemySignature = '';
  let selectedBrewCatalyst = 'wood';
  let selectedForgeRecipe = '';
  let selectedForgePattern = 'edge';
  let workbenchSignature = '';
  let techniqueTab = 'build';
  let selectedRoute = '';
  let selectedOrder = '';
  let orderQuantity = 1;
  let selectedMindsetSlot = 0;
  let retreatSignature = '';
  let expeditionMarkup = '';
  let npcTab = 'bond';
  let journalTab = 'quests';
  let questMapFilter = 'mistTown';
  let selectedWorldQuest = '';
  let trackedWorldQuest = '';
  let selectedTalent = '';
  const selectedTraitTraining = {};
  const TRACK_KEY='shan-hai-wen-jian.tracked-quest';
  try{trackedWorldQuest=localStorage.getItem(TRACK_KEY) || '';}catch(_){}
  const catalog = () => Xian.CONTENT || window.XianContent || {};
  const entries = key => Object.values(catalog()[key] || {});
  const realmCatalog = () => Xian.REALMS || entries('REALMS');
  const realmName = index => realmCatalog()[index]?.realmName || realmCatalog()[index]?.name || '未明';
  const finalRealm = () => state.player.realm >= realmCatalog().length - 1;
  const currentWeapon = () => {
    const item = itemInfo(state?.equipment?.weapon || 'starterSword');
    const info = typeof Xian.weaponInfo === 'function' ? Xian.weaponInfo(state) : {};
    const kind = info.kind || info.type || info.weaponType || item.weaponKind || item.weaponType || 'sword';
    return {name:item.name,type:kind,kind,range:kind==='bow'?650:110,cooldown:kind==='bow'?.6:.36,...info};
  };
  const mapDetails = id => {
    const meta=state?Xian.mapInfo(state,id):Xian.mapInfo(id);
    return {...meta,unlocked:meta.unlocked ?? Boolean(state&&state.player.realm >= (meta.realmRequired || 0)),visited:meta.visited ?? Boolean(state?.progress?.visited?.includes(id)),trial:meta.trial || state?.trials?.[id] || null};
  };
  const currentMap = () => state?Xian.mapInfo(state):mapDetails('main');
  const mapCategory = map => map.id==='sect'?{label:'宗门 · 同道与百艺',symbol:'宗',safeName:'山门安全区'}:map.type==='trial'?{label:'洞天 · 三重试炼',symbol:'◇',safeName:'安全据点'}:({town:{label:'城镇 · 市井因缘',symbol:'市',safeName:'城中安全区'},harbor:{label:'海港 · 潮汐航路',symbol:'港',safeName:'港口安全区'},crypt:{label:'地宫 · 残灯遗迹',symbol:'陵',safeName:'地宫据点'},sky:{label:'天墟 · 云台机关',symbol:'墟',safeName:'云台据点'}})[map.theme] || {label:'山川 · 自由探索',symbol:'✦',safeName:'安全营地'};
  const mapSites = () => typeof Xian.activityInfo==='function'&&Xian.activityInfo(state)?[]:entries('EXPLORATION_SITES').filter(site=>site.mapId===state?.mapId).map(site=>({...site,...(typeof Xian.siteInfo==='function'?Xian.siteInfo(state,site.id):{}),unlocked:state.player.realm>=(site.realmRequired || 0)}));
  const gradeName = id => (catalog().ROOT_GRADES || {})[id]?.name || id;
  const elementInfo = id => (catalog().ELEMENTS || {})[id] || {name:id,color:'#dcc18b'};
  const itemInfo = id => (catalog().ITEMS || {})[id] || {id,name:id,description:''};
  const resourceInfo = id => (catalog().RESOURCES || {})[id] || {id,name:id};
  const resourcesText = value => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(entry => typeof entry === 'string' ? entry : `${itemInfo(entry.id || entry.item).name} × ${entry.count || entry.amount || 1}`).join(' · ');
    return Object.entries(value).filter(([,n]) => typeof n === 'number' && n > 0).map(([id,n]) => `${({xp:'修为',contribution:'宗门贡献',research:'工艺研究'})[id] || (resourceInfo(id).name === id ? itemInfo(id).name : resourceInfo(id).name)} ${n}`).join(' · ');
  };
  const keys = new Set();
  const npcNames = {master:'凌云真人',forge:'铸剑台',alchemy:'灵药炉',shrine:'归元祠',waygate:'山海渡口',merchant:'云游商人',storyteller:'守卷人',sect:'宗门事务',cultivation:'太清静修坛'};
  const weaponNames = {sword:'剑',bow:'弓',staff:'法杖'};
  const npcPoints = {master:[440,1680],forge:[670,1800],alchemy:[380,1900],shrine:[580,1970]};
  const slotDefs = [
    {id:'attack',name:'普攻',key:'鼠标',icon:'sword',desc:'普通攻击 · 鼠标左键，向瞄准方向攻击'},
    {id:'skill',name:'御剑',key:'Q',icon:'skill',desc:'御剑诀 · Q，消耗灵力释放远程攻击'},
    {id:'secondary',name:'副法',key:'F',icon:'skill',desc:'副法 · F，筑基后装入第二门功法'},
    {id:'dash',name:'踏风',key:'Space',icon:'dash',desc:'踏风步 · 空格，向移动方向闪避'},
    {id:'heal',name:'回春丹',key:'R',icon:'potion',desc:'回春丹 · R，恢复气血与灵力'},
    {id:'interact',name:'交互',key:'E',icon:'interact',desc:'交互 · E，采集灵草、灵晶，拜访道院'},
  ];
  Object.defineProperty(window, '__game', {get: () => state});
  Object.defineProperty(window, 'game', {get: () => state});

  const sound = (() => {
    let context, master, music, timer, tick = 0;
    let enabled = true;
    try { enabled = localStorage.getItem(AUDIO_KEY) !== 'off'; } catch (_) {}
    function ensure() {
      if (!enabled) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!context) {
        context = new AudioContext();
        master = context.createGain(); master.gain.value = .24; master.connect(context.destination);
        music = context.createGain(); music.gain.value = .22; music.connect(master);
      }
      context.resume().catch(() => {});
      if (!timer) { ambient(); timer = window.setInterval(ambient, 2400); }
    }
    function note(freq, duration, level, type, target, delay = 0) {
      if (!context || !enabled || context.state !== 'running') return;
      const now = context.currentTime + delay;
      const osc = context.createOscillator(), gain = context.createGain();
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(level, now + Math.min(.4, duration / 6));
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      osc.connect(gain); gain.connect(target || master);
      osc.start(now); osc.stop(now + duration + .05);
      osc.onended = () => {osc.disconnect();gain.disconnect();};
    }
    function ambient() {
      if (!state || document.hidden || !enabled) return;
      const melody = [261.63,293.66,392,329.63,293.66,220,261.63,196];
      note(98, 4.7, .11, 'sine', music);
      note(146.83, 3.5, .07, 'sine', music);
      note(melody[tick++ % melody.length], 2.8, .12, 'sine', music, .18);
      note(melody[(tick + 2) % melody.length] * 2, 1.5, .025, 'triangle', music, 1.2);
    }
    function fx(kind) {
      if (!context || !enabled || document.hidden) return;
      if (kind === 'attack') {note(420,.095,.14,'triangle');note(170,.1,.08,'sine',null,.025);}
      else if (kind === 'dash') {note(650,.1,.1,'sine');note(940,.14,.08,'sine',null,.04);}
      else if (kind === 'skill') {note(196,.4,.2,'triangle');note(784,.3,.12,'sine',null,.08);}
      else if (kind === 'hurt') note(85,.2,.22,'triangle');
      else if (kind === 'success') {note(523.25,.3,.12,'sine');note(659.25,.45,.1,'sine',null,.12);}
      else if (kind === 'fail') note(130,.1,.07,'triangle');
      else note(440,.13,.05,'sine');
    }
    function toggle() {
      enabled = !enabled;
      try {localStorage.setItem(AUDIO_KEY, enabled ? 'on' : 'off');} catch (_) {}
      if (master) master.gain.setTargetAtTime(enabled ? .24 : 0, context.currentTime, .08);
      if (enabled) ensure();
      updateButton();
    }
    function updateButton() {
      $('sound-button').classList.toggle('active', enabled);
      $('sound-button').setAttribute('aria-pressed', String(enabled));
      $('sound-button').title = enabled ? '关闭声音' : '开启声音';
      $('sound-button').setAttribute('aria-label', enabled ? '关闭环境音乐和音效' : '开启环境音乐和音效');
    }
    return {ensure,fx,toggle,updateButton};
  })();

  function notify(message, warning = false) {
    if (!message) return;
    const node = document.createElement('div');
    node.className = `toast${warning ? ' warning' : ''}`;
    node.textContent = String(message);
    $('notifications').appendChild(node);
    while ($('notifications').children.length > 4) $('notifications').firstChild.remove();
    window.setTimeout(() => node.remove(), 4600);
  }
  function clearInput() {keys.clear();mouseAttack = false;pending = {};}
  function refreshSaved() {
    savedData = null; saveAvailable = false;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {savedData = Xian.deserialize(raw);saveAvailable = true;}
    } catch (_) {
      $('title-status').textContent = '旧存档无法读取。可以开始新旅程，或导入备份。';
    }
    $('continue-button').classList.toggle('hidden', !saveAvailable);
    $('new-button').classList.toggle('secondary-new', saveAvailable);
    $('new-button').innerHTML = saveAvailable ? '另启仙途 <span>NEW JOURNEY →</span>' : '踏入山海 <span>BEGIN JOURNEY →</span>';
  }
  function save(show = false) {
    if (!state) return false;
    try {
      localStorage.setItem(SAVE_KEY, Xian.serialize(state));
      saveAvailable = true;
      $('save-status').textContent = `已保存 · ${new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'})}`;
      if (show) notify('仙途已保存。');
      return true;
    } catch (_) {
      $('save-status').textContent = '存档失败 · 请导出备份';
      if (show) notify('浏览器无法写入存档，请导出备份。', true);
      return false;
    }
  }
  function start(data = null) {
    state = data || Xian.createGame(Math.floor(Date.now() % 2147483647));
    state.interaction = null;
    seenLogs = Array.isArray(state.logs) ? state.logs.slice() : [];
    previouslyDead = false; previouslyWon = Boolean(state.won);
    saveTimer = 0; lastFrame = performance.now();
    closeModal();
    $('title-screen').classList.add('hidden');
    $('hud').classList.remove('hidden');
    sound.ensure(); sound.updateButton();
    updateHUD(); drawMap(); save();
    mapSelection = state.mapId || 'main'; selectedTechnique = state.activeTechnique || 'sword';
    if (!data) {notify('仙途已启。先与凌云真人交谈，或前往东侧山野历练。');rootPanel(true);}
    else notify('故山依旧，仙途再续。');
  }
  function newJourney() {
    if (saveAvailable || state) {
      showConfirm('另启仙途', '新旅程会替换此浏览器中的当前存档。你可以先导出备份，留住已有的修为。', () => start(), '开启新旅程', 'new');
    } else start();
  }
  function exportSave() {
    const target = state || savedData;
    if (!target) return;
    const file = new Blob([Xian.serialize(target)], {type:'application/json'});
    const url = URL.createObjectURL(file);
    const a = document.createElement('a'); a.href = url;
    a.download = `山海问剑-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (state) notify('存档备份已导出。');
  }
  function pickImport() {$('import-file').value = '';$('import-file').click();}
  async function importSave(file) {
    if (!file) return;
    try {
      if (file.size > 2000000) throw new Error('文件过大');
      const data = Xian.deserialize(await file.text());
      const apply = () => {start(data);notify('已导入存档。');};
      if (state || saveAvailable) showConfirm('导入仙途', '存档已通过校验。导入会替换此浏览器中的当前进度，请先备份需要保留的旅程。', apply, '导入并继续', 'import');
      else apply();
    } catch (_) {
      const message = '存档格式不正确，无法导入。现有进度已保留。';
      if (state) notify(message, true); else $('title-status').textContent = message;
      if (modalKind) {panelMessage = message;const e = $('panel-message');if(e)e.textContent = message;}
    }
  }
  function showModal(kind, title, eyebrow, content, closeable = true) {
    clearInput();
    lastModalFocus = document.activeElement;
    modalKind = kind;
    $('modal').classList.toggle('wide-modal', kind.startsWith('npc:') || kind.startsWith('worldnpc:') || ['map','techniques','bag','story','master','storyteller','merchant','alchemy','forge','cultivate','sect','route-choice'].includes(kind));
    const volume={map:['舆','山川有路'],techniques:['法','七脉藏经'],bag:['物','百物有灵'],cultivate:['道','八境问道'],sect:['宗','同道长生'],story:['记','山海异闻'],storyteller:['记','山海异闻'],alchemy:['丹','草木成丹'],forge:['铸','百炼成器'],'route-choice':['旅','山海行路'],master:['缘','山海相逢'],worldnpc:['缘','山海众生'],root:['灵','天地之根']}[kind.split(':')[0]] || [kind.startsWith('npc:')?'缘':'卷',kind.startsWith('npc:')?'山海相逢':'仙途手卷'];
    $('modal').dataset.kind=kind.split(':')[0];
    if(kind==='sect')$('modal').dataset.page=sectTab;else delete $('modal').dataset.page;
    $('modal').innerHTML = `<aside class="panel-spine" aria-hidden="true"><span class="panel-seal">${volume[0]}</span><span class="panel-spine-title">${volume[1]}</span><small>山海问剑</small></aside><header class="modal-header"><div><span class="eyebrow">${esc(eyebrow)}</span><h2 id="modal-title">${esc(title)}</h2></div><span class="page-ornament" aria-hidden="true">✧</span>${closeable ? '<button class="modal-close" data-ui="close" aria-label="关闭面板">×</button>' : ''}</header><div class="panel-body">${content}</div>`;
    $('modal-backdrop').classList.remove('hidden');
    if(kind==='techniques'&&typeof Xian.buildInfo==='function'&&!$('modal').querySelector('.depth-tabs'))$('modal').querySelector('.panel-body').insertAdjacentHTML('afterbegin',techniqueTabsMarkup());
    if(kind==='story'&&typeof Xian.worldQuestInfo==='function'&&!$('modal').querySelector('[data-world-quest-page]'))$('modal').querySelector('.panel-body').insertAdjacentHTML('afterbegin',journalTabsMarkup());
    if(kind.startsWith('npc:')&&!$('modal').querySelector('[data-relationship-page]')){
      const info=Xian.npcInfo(state,kind.slice(4)),commission=info.commission;
      if(typeof Xian.relationshipInfo==='function'&&['elder','herbalist','fireArtisan','disciple'].includes(kind.slice(4)))$('modal').querySelector('.panel-body').insertAdjacentHTML('afterbegin',`<div class="panel-tabs depth-tabs"><button data-npc-tab="bond" data-npc-id="${esc(kind.slice(4))}">同行契约</button><button class="selected" data-npc-tab="talk" data-npc-id="${esc(kind.slice(4))}">叙谈与旧委托</button></div>`);
      if(info.consults?.length){
        const block=document.createElement('section');block.className='npc-consultations';
        block.innerHTML=`<h3>${info.met?'再叙仙途':'问道指引'}</h3><div class="npc-talk-choices">${info.consults.map(choice=>`<button class="story-option" data-engine="npc:${esc(kind.slice(4))}:consult:${esc(choice.id)}" ${choice.available?'':'disabled'}><strong>${esc(choice.label)}</strong><span>${esc(choice.description)}</span>${choice.reason?`<small>${esc(choice.reason)}</small>`:''}</button>`).join('')}</div>`;
        $('modal').querySelector('.npc-talk-choices').after(block);
        if(info.met){const firstTalk=$('modal').querySelector('.npc-conversation>.npc-talk-choices');firstTalk.classList.add('first-talk-complete');firstTalk.innerHTML='<p>初谈立场已记下，赠礼已领取。此后可随时请教，或办理人物委托与服务。</p>';}
      }
      if(commission){
        if(!info.met){const reason=document.createElement('p');reason.className='npc-disabled-reason';reason.textContent='先选择交谈立场，相识之后即可接取委托。';$('modal').querySelector('.npc-commission').appendChild(reason);}
        if(Object.keys(commission.cost || {}).length){const cost=document.createElement('p');cost.className='commission-reward';cost.textContent=`交付所需：${resourcesText(commission.cost)}`;$('modal').querySelector('.commission-progress').after(cost);}
      }
      for(const choice of $('modal').querySelectorAll('.npc-talk-choices button:disabled'))if(!choice.querySelector('small')){const reason=document.createElement('small');reason.textContent=info.met?'初谈立场已经确定，赠礼不会重复。':'请在安全区域内靠近此人物交谈。';choice.appendChild(reason);}
    }
    if(kind==='map'){
      const preview=document.createElement('canvas');preview.width=320;preview.height=240;preview.className='destination-preview';preview.setAttribute('aria-label','所选地图地形与传送门');
      $('modal').querySelector('.destination-meta').before(preview);
      drawDestinationPreview(preview,mapDetails(mapSelection));
    }
    if(kind==='bag'&&state.buffs?.length){
      const buffs=document.createElement('div');buffs.className='active-buffs';
      buffs.textContent=state.buffs.map(b=>`${({rage:'赤阳丹 · 攻击 +25%',ward:'护体散 · 减伤 25%',insight:'通灵丹 · 修为 +30%'})[b.type] || b.type} · 剩余 ${Math.ceil(b.life)} 秒`).join('　 /　 ');
      $('modal').querySelector('.panel-tabs').after(buffs);
    }
    for(const portrait of $('modal').querySelectorAll('.npc-art img')){
      const show=()=>portrait.parentElement.classList.add('has-portrait');
      portrait.addEventListener('load',show,{once:true});
      portrait.addEventListener('error',()=>portrait.remove(),{once:true});
      if(portrait.complete&&portrait.naturalWidth)show();
    }
    if(['story','storyteller'].includes(kind)&&$('modal').querySelector('.story-chapter')){
      const relations=Xian.storyInfo(state).relations || {}, row=document.createElement('div');row.className='story-relations';
      row.textContent=`仁心 ${relations.mercy || 0}　求道 ${relations.wisdom || 0}　锋芒 ${relations.valor || 0}　·　抉择与委托须在安全驿站中完成`;
      $('modal').querySelector('.story-chapter').appendChild(row);
    }
    $('modal').focus();
    $('modal').scrollTop=0;$('modal').querySelector('.panel-body').scrollTop=0;
    const body=$('modal').querySelector('.panel-body');
    if(body.scrollHeight>body.clientHeight+6){
      const indicator=document.createElement('span');indicator.className='panel-scroll-indicator';indicator.textContent='向下翻阅 ↓';$('modal').appendChild(indicator);
      body.addEventListener('scroll',()=>indicator.classList.toggle('hidden',body.scrollTop+body.clientHeight>=body.scrollHeight-8));
    }
    if (state) save();
  }
  function closeModal() {
    modalKind = ''; panelMessage = '';
    if (state) state.interaction = null;
    clearInput(); $('modal-backdrop').classList.add('hidden');
    if (lastModalFocus && typeof lastModalFocus.focus === 'function') lastModalFocus.focus({preventScroll:true});
    lastFrame = performance.now();
  }
  function button(label, action, variant = '') {return `<button class="modal-button ${variant}" data-ui="${action}">${label}</button>`;}
  function actionButton(label, action, variant = '') {return `<button class="modal-button ${variant}" data-engine="${action}">${label}</button>`;}
  function panelFeedback() {return `<p id="panel-message" class="panel-message" aria-live="polite">${esc(panelMessage)}</p>`;}
  function showConfirm(title, copy, callback, label, id) {
    showModal(`confirm-${id}`, title, 'A NEW CHAPTER', `<p class="lede">${esc(copy)}</p><div class="modal-actions">${button(label,'confirm','main')}${(state || savedData) ? button('导出当前存档','export','subtle') : ''}${button('取消','cancel','subtle')}</div>`);
    $('modal').querySelector('[data-ui="confirm"]').addEventListener('click', callback, {once:true});
  }
  function pausePanel() {
    if (state?.dead) return deathPanel();
    showModal('pause', '山静，剑亦静', 'JOURNEY AT REST', `<p class="lede">暂歇片刻。山海会等你归来。</p><div class="modal-actions">${button('继续游历','close','main')}${button('修行与突破 · L','cultivate')}${button('宗门事务 · N','sect')}${button('山海舆图','map')}${button('山海功法','techniques')}${button('见闻与任务','story')}${button('行囊','bag')}${button('游玩指引','help')}</div><h3>仙途存档</h3><p>进度每 10 秒自动保存。导出备份可在另一台电脑上继续旅程。旧版存档会保留已有修为并迁移到山海新篇。</p><div class="modal-actions">${button('立即保存','save')}${button('导出存档','export','subtle')}${button('导入存档','import','subtle')}${button('返回首页','home','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">ESC · 继续游戏</div>`);
  }
  function helpPanel() {
    showModal('help','初入山海','THE PATH OF THE IMMORTAL',`<p class="lede">亲手走过山海。移动、瞄准、闪避、武器与道术，组成你的战斗之道。</p><div class="keys-table"><div><kbd>W A S D / ↑↓←→</kbd>移动</div><div><kbd>鼠标左键</kbd>剑、弓或法杖普通攻击</div><div><kbd>Q</kbd>施放主法</div><div><kbd>F</kbd>筑基后施放副法</div><div><kbd>Space</kbd>踏风步 · 短暂闪避</div><div><kbd>E</kbd>人物 / 采集 / 古迹交互</div><div><kbd>R</kbd>服用回春丹</div><div><kbd>L</kbd>修行 / 境界突破</div><div><kbd>N</kbd>宗门事务 / 历练 / 兑换</div><div><kbd>B</kbd>行囊 / 使用 / 装备</div><div><kbd>M</kbd>世界舆图 / 安全渡界</div><div><kbd>K</kbd>功法传承 / 重数 / 主副法</div><div><kbd>J</kbd>故事抉择 / 委托 / 手记</div><div><kbd>Esc</kbd>暂停 / 关闭面板</div></div><h3>修行与突破</h3><p>从青云观出发，在山野斩妖、采集与探索，积攒修为和灵材。按 L 查看全部 ${realmCatalog().length} 个境界、当前突破条件与下一境的内容。条件满足后，在安全营地的独立修行界面突破；头像与暂停菜单也能进入。突破会开启更强的历练与传承。</p><h3>器物与道法</h3><p>剑近身挥斩，弓远程射箭，法杖释放灵弹。按 B 装备，普攻随武器改变；按 K 查看当前武器的射程、攻击间隔与功法相契倍率。筑基后可装入 F 副法，主副法各自计时，六秒内五行相生会增强道术并返还灵力。功法可搭配各类武器，相契武器能增强道术效果，换武器后仍可施放已选择的功法。</p><p>每门功法的黄、玄、地、天、仙品阶固定，更高品阶是另一门独立法门，须另行取得经卷并参悟。功法重数可修习提升，消耗实际灵材。灵根与装备的属性相契也会增强功法。购买或炼成的丹药、典籍和装备须在行囊中亲手使用。</p><h3>山门与历练</h3><p>从安全营地打开 M 前往宗门山门，按 N 拜入门下、参加历练并用贡献兑换器物。筑基后可建设药园、铸兵阁与藏经阁，调整五行方位、招募并派驻同门；产出最多存三批，须主动领取。宗门历练按境界逐步开启：清剿悬赏、守护阵心、五层试炼塔与渡劫。塔层间可选择祝福；历练中通过左侧进度查看目标、剩余时间与阵心气血，也可以随时退出回宗门。</p><h3>悟道与炼丹</h3><p>按 L 切换悟道树。突破、探索与历练首通会带来悟道点，三条道途的节点需依次参悟。在丹炉边按 E，选择丹方、炉火与凝丹策略；文火慢凝可多得丹药，武火快凝会损耗。关闭丹炉可继续游历，成丹后返回原炉领取。便捷炼制仍可沿用一步制作。</p><h3>人物与山野机缘</h3><p>靠近山海人物按 E。初谈立场与赠礼只能选择一次，之后可继续请教、接取委托，或支付灵材使用人物服务。凌云真人讲山门与巡山，顾清玄讲功法与器物，守卷人负责山海故事。人物对话随你的修为和历练推进。</p><p>山野中有古迹、灵藏与采集机缘。靠近按 E 查看条件与奖励，探索所得存入行囊。不同地图与洞天有独有妖兽、灵材和试炼奖励；按 J 查看尚未完成的因缘与旅途手记。</p><p class="modal-note">小地图金色菱形是营地，红色标记是守关者，菱形探索标记代表山野机缘。普通面板打开时游戏暂停；丹炉面板在炉边继续炼制，按 ESC 可暂停。浏览器自动保存仙途，导出存档可备份或在另一台电脑继续。</p><div class="modal-actions">${button(state?'继续游历':'我已知晓','close','main')}</div>`);
  }
  function statsCard(name, value, suffix = '') {return `<div class="stat-card"><small>${name}</small><strong>${esc(value)}${suffix ? `<em> ${esc(suffix)}</em>` : ''}</strong></div>`;}
  function rootMarkup() {
    const r = Xian.rootInfo(state), selected = (r.elements || []).map(e => typeof e === 'string' ? e : e.id);
    return `<section class="root-card"><div class="root-heading"><span class="eyebrow">天赋灵根</span><strong>${esc(r.name || gradeName(r.grade))}</strong><span>修为倍率 ×${Number(r.cultivationMultiplier || 1).toFixed(2)}</span></div><div class="element-row">${entries('ELEMENTS').map(e => `<span class="element-chip ${selected.includes(e.id) ? 'attuned' : ''}" style="--element:${esc(e.color || '#dcc18b')}" title="${esc(e.description || '')}">${esc(e.name)}</span>`).join('')}</div><p>${esc(r.description)}${r.affinityBonus ? ` · 相契功法增益 ${Math.round(r.affinityBonus*100)}%` : ''}</p></section>`;
  }
  function rootPanel(reveal = false) {
    if(state.dead)return deathPanel();
    const r = Xian.rootInfo(state);
    showModal('root', reveal ? '灵根初显' : '先天灵根', 'EIGHT VEINS · A PATH OF YOUR OWN', `<p class="lede">${reveal ? '归元祠映出你的先天灵根。天赋是起点，选择与历练才是你自己的仙途。' : '灵根影响修为成长，与相契属性的功法相辅相成。'}</p><div class="root-reveal">${esc(r.name || gradeName(r.grade))}</div>${rootMarkup()}<div class="grade-legend">${entries('ROOT_GRADES').map(g => `<span class="${g.id === r.grade ? 'selected' : ''}">${esc(g.name)}</span>`).join('')}</div><p class="modal-note">灵根随本次旅程确定，存档会保留其品质与属性。打开功法面板，选择与你灵根相契的修行之路。</p><div class="modal-actions">${button(reveal ? '执剑入山海' : '继续游历','close','main')}${button('查看山海功法','techniques','subtle')}</div>`);
  }
  function mapPanel(reset = false) {
    if(state.dead)return deathPanel();
    if(reset)mapSelection=currentMap().sourceMapId || state.mapId || 'main';
    const maps = entries('MAPS'), m = mapDetails(mapSelection);
    const current = currentMap(), activity=typeof Xian.activityInfo==='function'?Xian.activityInfo(state):null, safe = Xian.isSafe(state)&&!activity, realmNames=realmCatalog().map(r=>r.realmName || r.name);
    const trial = m.trial || {};
    const atlasPositions={main:[18,78],sect:[18,51],red:[65,77],snow:[84,15],bambooTrial:[41,25],fireTrial:[84,51],iceTrial:[63,40],mistTown:[16,21],tidePort:[40,83],buriedPalace:[84,84],skyRuins:[63,15]};
    showModal('map','山海舆图','MOUNTAINS · SECTS · HIDDEN REALMS',`<div class="atlas-layout"><section class="atlas"><div class="atlas-decoration" aria-hidden="true"><span>北冥</span><span>山海</span><span>赤霄</span></div><svg class="atlas-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M18 78 18 51 16 21 41 25 63 15 84 15M18 78 40 83 65 77 84 84 84 51 63 40 41 25"/><path class="ridge" d="M5 22q8-10 12-4t8-6q4 11 11 7M59 50q9-18 17-12t9-16M4 87q18-13 30-6t16-5M61 88q13-12 30-10"/></svg><div class="atlas-nodes">${maps.map(map => {const info=mapDetails(map.id);return `<button class="atlas-node ${map.id === mapSelection ? 'selected' : ''} ${map.id === state.mapId ? 'current' : ''} ${info.unlocked ? '' : 'locked'}" data-map="${esc(map.id)}" style="--atlas-x:${(atlasPositions[map.id] || [50,50])[0]}%;--atlas-y:${(atlasPositions[map.id] || [50,50])[1]}%;--map-color:${map.theme === 'fire' || map.theme === 'dungeon' ? '#d29068' : map.theme === 'snow' || map.theme === 'ice' ? '#a7cbe3' : '#9ac6a6'}"><span class="atlas-symbol">${esc(mapCategory(map).symbol)}</span><strong>${esc(map.name)}</strong><small>${map.id === state.mapId ? '当前所在' : info.unlocked ? info.visited ? '曾经抵达' : '未曾踏足' : `${realmNames[map.realmRequired || 0]}境开启`}</small></button>`;}).join('')}</div><div class="atlas-key">✦ 原野　◇ 洞天　宗 宗门　市 城镇　港 海港　陵 地宫　墟 天墟　<span>当前：${esc(current.name)}</span></div></section><aside class="destination-card"><span class="eyebrow">${esc(mapCategory(m).label)}</span><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p><div class="destination-meta"><span>入境要求</span><strong>${realmNames[m.realmRequired || 0]}境</strong><span>踏足状态</span><strong>${m.visited ? '已抵达' : '未抵达'}</strong>${m.type === 'trial' ? `<span>试炼进度</span><strong>${trial.cleared ? '已通关' : `第 ${trial.wave || 1} / 3 重`}</strong><span>通关次数</span><strong>${trial.clears || 0}</strong>` : ''}</div><p class="modal-note">${!m.unlocked ? `此地封印尚未解除，需要${realmNames[m.realmRequired || 0]}境。` : !safe ? activity ? '当前正在宗门历练中。先通过左侧历练界面退出，返回宗门后再渡界。' : '请返回当前地图的安全营地，或亲自走到传送门，按 E 渡界。' : m.id === state.mapId ? '你正身处此界。沿地图中的道路游历，寻找灵材与守关者。' : '当前位于安全营地，可以通过山海渡口前往此界。'}</p><div class="modal-actions">${m.id !== state.mapId ? `<button class="modal-button main" data-engine="travel:${esc(m.id)}" ${!m.unlocked || !safe ? 'disabled' : ''}>${m.unlocked ? '启程前往' : '境界未至'}</button>` : button('继续探索','close','main')}</div></aside></div>${panelFeedback()}<div class="shortcut-footer">M · 山海舆图　ESC · 关闭</div>`);
  }
  function techniqueTabsMarkup() {
    return `<div class="panel-tabs depth-tabs" role="tablist" aria-label="道法与构筑"><button role="tab" aria-selected="${techniqueTab==='build'}" data-technique-tab="build">心法配装</button><button role="tab" aria-selected="${techniqueTab==='arts'}" data-technique-tab="arts">七脉藏经</button></div>`;
  }
  function techniquesPanel() {
    if(typeof Xian.buildInfo!=='function'||techniqueTab==='arts')return legacyTechniquesPanel();
    if(state.dead)return deathPanel();
    const info=Xian.buildInfo(state),weapon=currentWeapon(),q=Xian.techniqueInfo(state,state.activeTechnique),f=state.secondaryTechnique?Xian.techniqueInfo(state,state.secondaryTechnique):null;
    const generates={wood:'fire',fire:'earth',earth:'metal',metal:'water',water:'wood'},qToF=Boolean(f?.comboElement&&generates[q.comboElement]===f.comboElement),fToQ=Boolean(f?.comboElement&&generates[f.comboElement]===q.comboElement);
    const comboText=qToF?`${q.name}先施放，${f.comboWindow}秒内接${f.name} · 后法返灵${f.comboRefund}`:fToQ?`${f.name}先施放，${q.comboWindow}秒内接${q.name} · 后法返灵${q.comboRefund}`:f?'两法独立施放 · 当前两法无五行相生':'装入副法后可搭配五行相生';
    showModal('techniques','心法配装','BUILD · THE WAY YOU FIGHT',`${techniqueTabsMarkup()}<div class="build-workspace"><aside class="build-character"><span class="eyebrow">${esc(weaponNames[weapon.kind])}修 · ${esc(weapon.name)}</span><img src="assets/player-${esc(weapon.kind)}-v4.png" alt="当前武器修士"><h3>一身道法</h3><div class="spell-slots">${[[q,'Q'],[f,'F']].map(([t,key])=>`<button class="spell-slot" data-open-arts="${esc(t?.id || state.activeTechnique)}"><kbd>${key}</kbd><strong>${esc(t?.name || '未装入副法')}</strong><small>${t?`${esc(elementInfo(t.element).name)} · ${t.manaCost || 0} 灵力`:'筑基后开启副法'}</small></button>`).join('')}</div><div class="build-combo"><span>${esc(elementInfo(q.element).name)}</span><b>${qToF?'→':fToQ?'←':'·'}</b><span>${f?esc(elementInfo(f.element).name):'副法待配'}</span></div><div class="mindset-slots">${Array.from({length:info.capacity || 2},(_,i)=>{const m=info.slots[i];return `<div class="mindset-slot ${selectedMindsetSlot===i?'selected':''}" data-mindset-slot="${i}" role="button" tabindex="0" aria-label="选择心法${i+1}槽"><span>${i+1}</span><div><strong>${esc(m?.name || '空心法槽')}</strong><small>${m?`实战已触发 ${m.triggerCount || 0} 次`:'先选此槽，再装入右侧心法'}</small></div>${m?`<button data-engine="journey:build:equip:${i}:none" aria-label="卸下${esc(m.name)}">卸下</button>`:''}</div>`;}).join('')}</div><div class="build-stat">${esc(comboText)}<br>气血 ${Math.ceil(state.player.hp)} / ${Xian.stats(state).maxHp} · 灵力 ${Math.ceil(state.player.mp)} / ${Xian.stats(state).maxMp}</div><div class="modal-actions">${button('调整装备','bag','subtle')}</div></aside><section><span class="eyebrow">当前目标槽 · 心法 ${selectedMindsetSlot+1}</span><p class="depth-note">心法由实际命中、状态、闪避与护盾触发。搭配对应道法与武器，再到山野验证你的打法。</p><div class="mindset-grid">${info.mindsets.map((m,i)=>`<article class="mindset-card ${m.equipped?'equipped':''}"><span class="mindset-mark">${['焰','冰','生','守','风','衡'][i] || '道'}</span><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p><small>${m.reason?esc(m.reason):m.equipped?`已装配 · 实战触发 ${m.triggerCount || 0} 次`:m.requirements?.length?esc(m.requirements.map(r=>typeof r==='string'?r:r.label || r.description).join(' · ')):'条件已具备'}${m.conflicts?.length?`<br>互斥：${esc(m.conflicts.map(id=>info.mindsets.find(x=>x.id===id)?.name || id).join('、'))}`:''}</small><button class="modal-button ${m.available?'main':'subtle'}" data-engine="journey:build:equip:${selectedMindsetSlot}:${esc(m.id)}" ${m.available&&!m.equipped?'':'disabled'}>${m.equipped?'已装入心法槽':`装入 ${selectedMindsetSlot+1} 槽`}</button></article>`).join('')}</div>${info.synergies?.length?`<div class="build-synergies"><span class="eyebrow">触发配合参考</span>${info.synergies.map(s=>`<h4>${esc(s.name)}</h4><p>${esc(s.description)}</p>`).join('')}</div>`:''}${panelFeedback()}</section></div>`);
  }
  function legacyTechniquesPanel() {
    if(state.dead)return deathPanel();
    const all=entries('TECHNIQUES'),baseIds=['sword','arrow','flame','frost','wood','thunder','earth'];
    const directionOf=t=>t.direction || t.baseId || t.id.split('_')[0];
    if(!all.some(t=>t.id===selectedTechnique))selectedTechnique=state.activeTechnique || 'sword';
    const selected=Xian.techniqueInfo(state,selectedTechnique),direction=directionOf(selected),el=elementInfo(selected.element),weapon=currentWeapon();
    const currentSecondary=state.secondaryTechnique?Xian.techniqueInfo(state,state.secondaryTechnique):null;
    const group=all.filter(t=>directionOf(t)===direction).sort((a,b)=>(a.gradeIndex || 0)-(b.gradeIndex || 0));
    const book=entries('ITEMS').find(i=>i.type==='book'&&i.technique===selected.id),bookCount=book?(state.inventory[book.id] || 0):0;
    const canLearn=selected.canLearn ?? (bookCount>0&&Xian.isSafe(state));
    const canQ=selected.known&&state.activeTechnique!==selected.id&&state.secondaryTechnique!==selected.id;
    const canF=selected.known&&state.player.realm>=1&&state.activeTechnique!==selected.id&&state.secondaryTechnique!==selected.id;
    const labels={sword:'御剑之道',arrow:'穿云箭道',flame:'离火之道',frost:'玄冰之道',wood:'长春之道',thunder:'九霄雷道',earth:'厚土之道'};
    const acquire=selected.acquireCost&&Object.keys(selected.acquireCost).length>0;
    const source=selected.source || selected.acquisition || (book?'云游商人、山野故事与探索奖励。':'初入山门即习得。');
    const precedingElement=({metal:'earth',water:'metal',wood:'water',fire:'wood',earth:'fire'})[selected.comboElement];
    const comboElement=precedingElement?elementInfo(precedingElement).name:'';
    showModal('techniques','山海道法','SEVEN PATHS · DISTINCT ARTS',`<p class="compact-lede">${all.length} 门道法，各有固定品阶与独立传承。选择修炼方向，再查看具体法门。重数代表熟练；主法装入 Q，筑基后可装入另一门副法 F。</p><div class="directions-row" role="tablist" aria-label="修炼方向">${baseIds.filter(id=>all.some(t=>directionOf(t)===id)).map(id=>{const t=all.find(t=>directionOf(t)===id),e=elementInfo(t.element),known=all.filter(t=>directionOf(t)===id&&Xian.techniqueInfo(state,t.id).known).length,total=all.filter(t=>directionOf(t)===id).length;return `<button role="tab" aria-selected="${direction===id}" class="${direction===id?'selected':''}" data-direction="${id}" style="--element:${esc(e.color)}"><strong>${esc(catalog().TECHNIQUE_DIRECTIONS?.[id]?.name || labels[id])}</strong><small>${known} / ${total} 已习得</small></button>`;}).join('')}</div><div class="techniques-layout"><div class="technique-list">${group.map(t=>{const info=Xian.techniqueInfo(state,t.id);return `<button class="technique-choice ${selectedTechnique===t.id?'selected':''}" data-tech="${esc(t.id)}" style="--element:${esc(el.color)}"><span class="technique-sigil" style="color:${esc(info.gradeColor || '#d8c690')};border-color:${esc(info.gradeColor || '#d8c690')}">${esc((info.gradeName || '黄阶').slice(0,1))}</span><div><strong>${esc(t.name)}</strong><small>${info.known?`${info.level} / ${info.maxLevel || 3} 重`:'尚未习得'}${state.activeTechnique===t.id?' · 当前 Q':state.secondaryTechnique===t.id?' · 当前 F':''}</small><span class="technique-grade-badge" style="--grade-color:${esc(info.gradeColor || '#d8c690')}">${esc(info.gradeName || '黄阶')} · 固定品阶</span></div></button>`;}).join('')}</div><section class="technique-detail" style="--element:${esc(el.color)}"><span class="eyebrow">${esc(el.name)}系 · ${esc(selected.gradeName || '黄阶')} · ${selected.known?`${selected.level} 重`:'尚未习得'}</span><h3>${esc(selected.name)}</h3><p>${esc(selected.description)}</p><div class="fixed-grade-note"><span>此法品阶固定</span><strong style="color:${esc(selected.gradeColor || '#d8c690')}">${esc(selected.gradeName || '黄阶')}</strong><small>其他品阶是另一门法门，须各自取得传承并参悟。</small></div><div class="stat-grid">${statsCard('灵力消耗',selected.manaCost)}${statsCard('施法间隔',Number(selected.cooldown).toFixed(1),'秒')}${statsCard('道术倍率',`×${Number(selected.multiplier || 1).toFixed(2)}`)}</div><div class="weapon-compatibility"><div><span>当前武器 · ${esc(weaponNames[weapon.kind] || weapon.kind)}</span><strong>${esc(weapon.name)}</strong></div><p>${esc(weapon.description || '')}</p><div class="weapon-values"><span>普攻射程 ${weapon.range}</span><span>攻击间隔 ${Number(weapon.cooldown).toFixed(2)} 秒</span></div><p class="weapon-match ${selected.weaponCompatible?'matched':''}">${selected.weaponCompatible?'武器相契':'相契武器'} · ${esc(weaponNames[selected.preferredWeapon] || selected.preferredWeapon || '剑')} · 道术倍率 ×${Number(selected.weaponBonus || 1).toFixed(2)}<br>可使用其他武器施放，相契武器增强效果。属性相契增益 +${Math.round((selected.affinity || 0)*100)}%。</p></div><section class="technique-inheritance"><h3>传承与参悟</h3><p>${esc(source)}</p>${book?`<p>持有${esc(book.name)} ${bookCount} 本${selected.learnRealm?` · ${esc(realmName(selected.learnRealm))}境可参悟`:''}</p>`:''}${selected.learnRequirements?.length?`<div class="story-requirements">${selected.learnRequirements.map(req=>`<span>${esc(typeof req==='string'?req:req.label || req.description)}</span>`).join('')}</div>`:''}${acquire&&!selected.known?`<p class="inheritance-cost">换卷所需：${esc(resourcesText(selected.acquireCost))}</p><button class="modal-button ${selected.canAcquire?'main':'subtle'}" data-engine="acquire:${esc(selected.id)}" ${selected.canAcquire?'':'disabled'}>向宗门换取经卷</button>${selected.acquireReason?`<p class="promotion-reason">${esc(selected.acquireReason)}</p>`:''}`:''}${!selected.known?`<div class="modal-actions"><button class="modal-button main" data-engine="learn:${esc(selected.id)}" ${canLearn?'':'disabled'}>参悟此法</button></div>${selected.learnReason?`<p class="promotion-reason">${esc(selected.learnReason)}</p>`:''}`:`<h3>功法重数</h3><p>${selected.level>=3?'此法已修至三重。':`修习下一重：${esc(resourcesText(selected.trainCost))} · ${esc(realmName(selected.trainRealm || 0))}境可修。`}</p>${selected.level<3?actionButton('修习下一重',`train:${selected.id}`,'subtle'):''}`}</section><section class="secondary-technique"><div class="secondary-heading"><h3>主法 Q · 副法 F</h3><span>${currentSecondary?`副法：${esc(currentSecondary.name)}`:'副法尚未装入'}</span></div><div class="combo-detail ${selected.comboReady?'ready':''}"><span>${comboElement?`${esc(comboElement)} → ${esc(el.name)} · 五行相生`:'此法的连携'}</span><strong>${selected.comboElement?`${selected.comboReady?'连携已就绪':`${selected.comboWindow || 6}秒内相生`} · ×${selected.comboReady?Number(selected.comboMultiplier || 1.25).toFixed(2):'1.25'}`:'不参与五行相生'}</strong><small>${selected.comboElement?`先施放前一属性，再施放此法，可增强效果并返还 ${selected.comboRefund || 6} 灵力。`:'此法独立施放，主副法冷却仍各自计时。'}</small></div><div class="modal-actions"><button class="modal-button ${canQ?'main':'subtle'}" data-engine="technique:${esc(selected.id)}" ${canQ?'':'disabled'}>${state.activeTechnique===selected.id?'当前主法 Q':'装入 Q'}</button><button class="modal-button ${canF?'main':'subtle'}" data-engine="secondary:${esc(selected.id)}" ${canF?'':'disabled'}>${state.secondaryTechnique===selected.id?'当前副法 F':'装入 F'}</button>${state.secondaryTechnique?'<button class="modal-button subtle" data-engine="secondary:none">卸下副法</button>':''}</div>${state.player.realm<1?'<p class="promotion-reason">筑基境开启 F 副法，主副法需选不同的法门。</p>':!selected.known?'<p class="promotion-reason">先参悟此法，再装入主法或副法。</p>':''}</section><div class="modal-actions">${button('查看灵根','root','subtle')}</div></section></div>${panelFeedback()}<div class="shortcut-footer">K · 道法　Q · 主法　F · 副法　ESC · 关闭</div>`);
  }
  function characterPortrait(id,info) {
    if(typeof renderer?.npcPortrait==='function')return `<div class="npc-art has-portrait"><img src="${renderer.npcPortrait(info.skin || (id==='master'?'elder':id),id)}" alt="${esc(info.name)}人物立绘"></div>`;
    const colors={elder:'#b5b294',disciple:'#7ebbb3',herbalist:'#9fbc7c',hunter:'#b89b70',broker:'#bc999e',fireArtisan:'#d69a76',snowHealer:'#a6cddc',trialKeeper:'#a5c0a0'};
    const color=info.color || colors[id] || '#abc1aa';
    const hat=id==='hunter'?'<path d="M47 50 76 29 107 50 96 56H58Z" fill="#b3a06e"/>':id==='broker'?'<path d="M59 41h36v-12H64Z" fill="#35483c"/>':id==='elder'?'<path d="M73 69 86 69 83 86 73 88Z" fill="#d8d7b9"/>':'<path d="M77 35v-9m-8 5h17" fill="none" stroke="#d7d4a9" stroke-width="3"/>';
    const accessory=id==='herbalist'?'<path d="M39 123v-34m0 20c-12 0-14-13-10-16 9 0 14 10 10 16Zm0-9c12-1 14-13 10-17-10 0-13 10-10 17Z" fill="#90b580"/>':id==='fireArtisan'?'<path d="m115 87-11 4 3 15 13-5Zm-5 14-6 28" fill="#bfa481"/>':id==='snowHealer'?'<path d="M117 89v36m-15-26 30 17m-30 0 30-17" fill="none" stroke="#b6e3ee" stroke-width="2"/>':id==='hunter'?'<path d="M111 69v67m0-67q30 34 0 67m0-67 14 34-14 33" fill="none" stroke="#aeb58c" stroke-width="2"/>':id==='broker'?'<path d="m112 90 16 6-5 22-16-6Z" fill="#cdb487"/><path d="m114 97 10 5m-11 2 9 5" stroke="#637457"/>':'<path d="M113 66v77m-6-69 6-11 7 11" fill="none" stroke="#d3bd80" stroke-width="3"/>';
    const illustration = `<svg viewBox="0 0 160 175" role="img" aria-label="${esc(info.name)}人物立绘"><defs><linearGradient id="npc-back" x2="0" y2="1"><stop stop-color="#31513e"/><stop offset="1" stop-color="#102c20"/></linearGradient></defs><rect x="5" y="5" width="150" height="165" fill="url(#npc-back)" stroke="${esc(color)}" stroke-opacity=".25"/><circle cx="103" cy="49" r="27" fill="${esc(color)}" opacity=".1"/><path d="M5 137 35 107l26 30 30-37 39 35 25-26v61H5Z" fill="#5c795c" opacity=".18"/><ellipse cx="79" cy="151" rx="37" ry="8" fill="#092016" opacity=".5"/><path d="m66 71 27 1 15 69-13 11H61l-11-12Z" fill="${esc(color)}"/><path d="m66 72 13 22 15-22M79 94v51m-20-33 36-1" fill="none" stroke="#e3dcc0" stroke-opacity=".6" stroke-width="2"/><path d="m65 76-17 45 14 5 11-35m23-15 17 43-13 6-12-34" fill="${esc(color)}" stroke="#213e2b" stroke-width="1"/><path d="m69 147-4 11h13v-13m8 0v13h13l-6-11" fill="#254336"/><circle cx="79" cy="57" r="15" fill="#c7b99b"/><path d="M63 59c-5-22 31-28 33-1l-7-13-17-1Z" fill="#294130"/><path d="m70 62 5 0m9 0h5" stroke="#3d5342" stroke-width="1.5"/>${hat}${accessory}</svg>`;
    const portraits={master:'elder-v4.png',elder:'elder-v4.png',herbalist:'herbalist-v4.png'};
    return `<div class="npc-art">${illustration}${portraits[id]?`<img src="assets/${portraits[id]}" alt="${esc(info.name)}立绘">`:''}</div>`;
  }
  function characterPanel(id) {
    if(typeof Xian.relationshipInfo!=='function'||!['elder','herbalist','fireArtisan','disciple'].includes(id)||npcTab==='talk')return legacyCharacterPanel(id);
    if(state.dead)return deathPanel();
    const old=Xian.npcInfo(state,id),info=Xian.relationshipInfo(state,id),c=info.contract;
    if(!old||!info)return legacyCharacterPanel(id);
    const contractText=c?.description || (c?c.kind==='kills'?`接下契约后，亲自击败 ${c.target} 名妖兽，再回到${info.name}身边交付。`:c.kind==='delivery'?`准备 ${c.target} 份${resourceInfo(c.item).name===c.item?itemInfo(c.item).name:resourceInfo(c.item).name}，接取后在人物身边交付。`:`接下契约后，亲自在山野采集 ${c.target} 份${resourceInfo(c.kind).name===c.kind?itemInfo(c.kind).name:resourceInfo(c.kind).name}，再带回所需交付材料。`:'');
    showModal(`npc:${id}`,info.name,'RELATIONSHIPS · PROMISES IN THE MOUNTAINS',`<div data-relationship-page="${esc(id)}"><div class="panel-tabs depth-tabs"><button class="selected" data-npc-tab="bond" data-npc-id="${esc(id)}">同行契约</button><button data-npc-tab="talk" data-npc-id="${esc(id)}">叙谈与旧委托</button></div><div class="npc-dialog-layout"><aside class="npc-identity">${characterPortrait(id,old)}<span class="eyebrow">${esc(old.role || '')}</span><h3>${esc(info.name)}</h3><p>${esc(old.description || old.identity?.description || '')}</p><div class="npc-rapport"><span>同行关系</span><strong>${esc(info.stageName)}</strong></div><small class="depth-reason">${esc(info.reason || '')}</small></aside><section class="npc-conversation"><p class="npc-dialogue">${esc(!info.met?'相逢尚浅，先说清心中所求，再以行动结下一段缘分。':contractText || '历次契约已记下，往后同道相助仍需有所付出。')}</p>${!info.met?`<div class="npc-talk-choices">${(old.choices || []).map(choice=>`<button class="story-option" data-engine="npc:${esc(id)}:talk:${esc(choice.id)}" ${!info.near||choice.available===false?'disabled':''}><strong>${esc(choice.label)}</strong><span>${esc(choice.description)}</span></button>`).join('')}</div>`:''}<div class="relationship-track">${Array.from({length:info.maxContracts+1},(_,i)=>`<div class="${i<info.completed?'complete':i===info.completed?'current':''}"><b>${i<info.completed?'✓':i}</b><span>${i===0?'相逢':`${i} 契`}</span></div>`).join('')}</div>${c?`<article class="relationship-card"><span class="eyebrow">第 ${info.completed+1} / ${info.maxContracts} 次同行契约</span><h3>${esc(c.name)}</h3><p>${esc(contractText)}</p><div class="progress-caption"><span>${c.accepted?'接取后实际进度':'先接取，再开始行动'}</span><strong>${c.progress} / ${c.target}</strong></div><div class="track"><i style="width:${clamp(c.progress/Math.max(1,c.target)*100,0,100)}%"></i></div>${Object.keys(c.cost || {}).length?costTrayMarkup(c.cost,'交付'):''}<p>完成所得：${esc(resourcesText(c.reward))}</p><div class="modal-actions"><button class="modal-button main" data-engine="journey:npc:${esc(id)}:${c.accepted?'deliver':'accept'}" ${(c.accepted?c.ready&&!c.reason:c.available)?'':'disabled'}>${c.accepted?c.ready?'交付此次契约':'行动尚未完成':'接下同行契约'}</button><small class="depth-reason">${esc(c.reason || '')}</small></div></article>`:`<div class="relationship-card"><h3>六契已成</h3><p>同行足迹已留在山海。现在可以借助已经建立的关系，为下一次生产与历练做准备。</p></div>`}<div class="relationship-supports">${info.supports.map(s=>`<div><h4>${esc(s.label)}</h4><p>${esc(s.description)}</p><small>${esc(resourcesText(s.cost))}${s.duration?` · 持续 ${s.duration} 秒`:''}${s.remaining?`<br>正在生效 · 剩余 ${Math.ceil(s.remaining)} 秒`:''}</small><button class="modal-button ${s.available?'main':'subtle'}" data-engine="journey:npc:${esc(id)}:support:${esc(s.id)}" ${s.available?'':'disabled'}>请同道相助</button>${s.reason?`<small>${esc(s.reason)}</small>`:''}</div>`).join('')}</div>${info.history.length?`<div class="relationship-history">相助足迹：${info.history.map(h=>esc(h.name)).join(' → ')}</div>`:''}${panelFeedback()}</section></div></div>`);
  }
  function legacyCharacterPanel(id) {
    if(state.dead)return deathPanel();
    const info=Xian.npcInfo(state,id);
    if(!info)return;
    const near=Boolean(info.near)&&Xian.isSafe(state)&&!state.dead,commission=info.commission;
    const choices=info.choices || [],services=info.services || [];
    const reply=panelMessage&&state.lastAction?.ok&&state.lastAction.id.startsWith(`npc:${id}:consult:`)?panelMessage:null;
    const dialogue=reply || (Array.isArray(info.dialogue)?info.dialogue.join('\n'):info.dialogue);
    const proximityReason=info.reason || '请靠近此人物，在安全区域内交谈。';
    let commissionMarkup='';
    if(commission){
      const accepted=Boolean(commission.accepted),claimed=Boolean(commission.claimed || commission.completed),ready=Boolean(commission.ready);
      commissionMarkup=`<section class="npc-commission"><span class="eyebrow">人物委托</span><h3>${esc(commission.name || commission.title)}</h3><p>${esc(commission.description)}</p><div class="commission-progress"><span>${accepted?'已接取':'未接取'}${claimed?' · 已领取奖励':''}</span><strong>${commission.progress ?? 0} / ${commission.target ?? 1}</strong></div><p class="commission-reward">所得：${esc(resourcesText(commission.reward))}</p><button class="modal-button ${claimed?'subtle':'main'}" data-engine="npc:${esc(id)}:${accepted?'claim':'accept'}" ${!near || !info.met || claimed || accepted&&!(commission.canClaim ?? ready)?'disabled':''}>${claimed?'委托已完成':accepted?ready?'交付委托，领取奖励':'尚待完成':'接取委托'}</button>${!near?`<p class="npc-disabled-reason">${esc(proximityReason)}</p>`:accepted&&!(commission.canClaim ?? ready)?`<p class="npc-disabled-reason">${esc(commission.reason || '完成委托目标后，再回来交付。')}</p>`:''}</section>`;
    }
    showModal(`npc:${id}`,info.name,'FATE · 山海有相逢',`<div class="npc-dialog-layout"><aside class="npc-identity">${characterPortrait(id,info)}<span class="eyebrow">${esc(info.role || '')}</span><h3>${esc(info.name)}</h3><p>${esc(typeof info.identity==='object'?info.identity.description:info.identity || info.description || '')}</p><div class="npc-rapport"><span>交情</span><strong>${info.rapport || 0}</strong></div>${id==='elder'?`<div class="modal-actions">${button('功法传承','techniques','subtle')}</div>`:''}</aside><div class="npc-conversation"><p class="npc-dialogue">${esc(dialogue)}</p><div class="npc-talk-choices">${choices.map(choice=>`<button class="story-option" data-engine="npc:${esc(id)}:talk:${esc(choice.id)}" ${!near || choice.available===false?'disabled':''}><strong>${esc(choice.label)}</strong><span>${esc(choice.description)}</span>${choice.reason?`<small>${esc(choice.reason)}</small>`:''}</button>`).join('')}</div>${!near?`<p class="npc-disabled-reason">${esc(proximityReason)}</p>`:''}${commissionMarkup}${services.length?`<h3>人物所长</h3><div class="npc-services">${services.map(service=>{const canUse=near&&info.met&&service.available!==false&&service.ready!==false;return `<article><div><strong>${esc(service.name || service.label)}</strong><p>${esc(service.description)}</p><span class="service-cost">${esc(resourcesText(service.cost))}${service.remaining?` · 再等 ${Math.ceil(service.remaining)} 秒`:''}</span>${!canUse?`<small>${esc(service.reason || (!near?proximityReason:'此服务暂不可用。'))}</small>`:''}</div><button class="modal-button ${canUse?'main':'subtle'}" data-engine="npc:${esc(id)}:service:${esc(service.id)}" ${canUse?'':'disabled'}>${esc(service.buttonLabel || '请教')}</button></article>`;}).join('')}</div>`:''}</div></div>${panelFeedback()}<div class="modal-actions">${button('告辞','close','subtle')}</div><div class="shortcut-footer">E · 与身边人物交谈　ESC · 关闭</div>`);
  }
  function storyPanel(kind = 'story') {
    if(kind==='story'&&journalTab==='quests'&&typeof Xian.worldQuestInfo==='function')return worldQuestPanel();
    return legacyStoryPanel(kind);
  }
  function journalTabsMarkup() {
    return `<div class="panel-tabs depth-tabs"><button class="${journalTab==='quests'?'selected':''}" data-journal-tab="quests">山海支线</button><button class="${journalTab==='story'?'selected':''}" data-journal-tab="story">问剑正卷</button></div>`;
  }
  function worldQuestPanel() {
    if(state.dead)return deathPanel();
    const quests=Xian.worldQuestInfo(state),mapIds=[...new Set(quests.map(q=>q.mapId))];
    if(!selectedWorldQuest&&mapIds.includes(state.mapId))questMapFilter=state.mapId;
    const filtered=questMapFilter==='all'?quests:quests.filter(q=>q.mapId===questMapFilter);
    if(!filtered.some(q=>q.id===selectedWorldQuest))selectedWorldQuest=filtered.find(q=>q.accepted&&!q.claimed)?.id || filtered[0]?.id || '';
    const selected=quests.find(q=>q.id===selectedWorldQuest),people=[...new Set(filtered.map(q=>q.npcId))],npcs=catalog().WORLD_NPCS || {};
    showModal('story','山海支线','SIDE STORIES · DEEDS AND CONSEQUENCES',`<div data-world-quest-page>${journalTabsMarkup()}<div class="quest-map-tabs">${mapIds.map(id=>`<button class="${questMapFilter===id?'selected':''}" data-quest-map="${esc(id)}">${esc(mapDetails(id).name)}<small>${quests.filter(q=>q.mapId===id&&q.claimed).length} / ${quests.filter(q=>q.mapId===id).length}</small></button>`).join('')}<button class="${questMapFilter==='all'?'selected':''}" data-quest-map="all">全部支线<small>${quests.filter(q=>q.claimed).length} / ${quests.length}</small></button></div><div class="sidequest-layout"><section class="sidequest-chains">${people.map(id=>{const n=npcs[id] || {name:id},chain=filtered.filter(q=>q.npcId===id);return `<article class="sidequest-chain"><header><img src="${renderer.npcPortrait?.(n.skin,id) || ''}" alt="${esc(n.name)}头像"><div><span class="eyebrow">${esc(n.role || '')}</span><h3>${esc(n.name)}</h3></div><button data-open-world-npc="${esc(id)}">人物册 ↗</button></header><div class="sidequest-steps">${chain.map((q,i)=>`<button class="sidequest-node ${selected?.id===q.id?'selected':''} ${q.claimed?'claimed':q.accepted?'accepted':''}" data-world-quest="${esc(q.id)}"><span>${q.claimed?'✓':i+1}</span><div><strong>${esc(q.name)}</strong><small>${q.claimed?'已交付':q.accepted?`实际进度 ${q.progress} / ${q.target}`:q.prerequisites?.length?'前置契约后开启':'尚未接取'}${trackedWorldQuest===q.id?' · 正在追踪':''}</small></div></button>`).join('')}</div></article>`;}).join('')}</section><aside class="sidequest-detail">${selected?`<span class="eyebrow">${esc(mapDetails(selected.mapId).name)} · ${esc(npcs[selected.npcId]?.name || selected.npcId)}</span><h3>${esc(selected.name)}</h3><p>${esc(selected.description)}</p><div class="quest-status-seal">${selected.claimed?'已成':selected.accepted?'行中':'待启'}</div>${selected.accepted?`<div class="progress-caption"><span>接取后的真实进度</span><strong>${selected.progress} / ${selected.target}</strong></div><div class="track"><i style="width:${clamp(selected.progress/Math.max(1,selected.target)*100,0,100)}%"></i></div>`:''}<div class="sidequest-reward"><small>完成所得</small><strong>${esc(resourcesText(selected.reward))}</strong></div>${selected.prerequisites?.length?`<p class="depth-note">前置：${selected.prerequisites.map(id=>esc(quests.find(q=>q.id===id)?.name || id)).join('、')}</p>`:''}<div class="sidequest-actions"><button class="modal-button main" data-engine="worldlife:quest:${selected.accepted?'claim':'accept'}:${esc(selected.id)}" ${(selected.accepted?selected.canClaim:selected.canAccept)?'':'disabled'}>${selected.claimed?'此支线已交付':selected.accepted?'返回人物交付':'接取此支线'}</button><button class="modal-button subtle" data-track-world-quest="${esc(selected.id)}" ${selected.claimed?'disabled':''}>${trackedWorldQuest===selected.id?'取消目标追踪':'追踪此目标'}</button><button class="modal-button subtle" data-world-map="${esc(selected.mapId)}">在舆图定位</button></div><p class="depth-reason">${esc(selected.reason || '')}</p><p class="depth-note">接取和交付须亲自到发布人物身边。击杀、采集和踏访支线只记录接取后的行动。</p>`:'<p class="empty-state">当前地域没有支线。</p>'}${panelFeedback()}</aside></div></div>`);
  }
  function talentPanel() {
    if(state.dead)return deathPanel();
    const info=Xian.talentInfo(state),paths=[{id:'martial',name:'武道',glyph:'武'},{id:'spirit',name:'灵法',glyph:'灵'},{id:'life',name:'百艺',glyph:'生'}];
    if(!info.entries.some(t=>t.id===selectedTalent))selectedTalent=info.entries.find(t=>t.available)?.id || info.entries[0]?.id || '';
    const selected=info.entries.find(t=>t.id===selectedTalent);cultivationTab='talents';
    showModal('cultivate','天赋根基','TALENTS · GROW INTO YOUR OWN PATH',`${cultivationTabsMarkup()}<div class="talent-banner"><div><span class="eyebrow">修行积累 · 三条天赋方向</span><h3>根基生于选择</h3></div><div class="talent-points"><strong>${info.pointsAvailable}</strong><span>可用天赋点</span><small>已得 ${info.pointsEarned} · 已用 ${info.pointsSpent}</small></div></div><div class="talent-workspace"><div class="talent-tree">${paths.map(p=>`<section class="talent-path"><header><span>${p.glyph}</span><h3>${p.name}</h3></header>${info.entries.filter(t=>t.path===p.id).map(t=>`<button class="talent-node ${t.id===selectedTalent?'selected':''} ${t.unlocked?'learned':t.available?'available':'locked'}" data-talent="${esc(t.id)}"><span>${t.unlocked?'✓':t.cost}</span><div><strong>${esc(t.name)}</strong><small>${t.unlocked?'已学得':t.available?'可领悟':esc(t.reason || '尚未具备条件')}</small></div>${t.prerequisites?.length?'<i aria-hidden="true"></i>':''}</button>`).join('')}</section>`).join('')}</div><aside class="talent-detail">${selected?`<span class="eyebrow">${esc(paths.find(p=>p.id===selected.path)?.name || selected.path)}根基</span><h3>${esc(selected.name)}</h3><div class="talent-effect-icon">${svg(selected.path==='martial'?'sword':selected.path==='spirit'?'skill':'herb')}</div><p>${esc(selected.description)}</p><dl><div><dt>领悟所需</dt><dd>${selected.cost} 天赋点</dd></div><div><dt>当前状态</dt><dd>${selected.unlocked?'已学得':selected.available?'可领悟':'待准备'}</dd></div></dl>${selected.prerequisites?.length?`<p class="depth-note">先修：${selected.prerequisites.map(id=>esc(info.entries.find(t=>t.id===id)?.name || id)).join('、')}</p>`:''}<button class="modal-button main" data-engine="worldlife:talent:learn:${esc(selected.id)}" ${selected.available&&!selected.unlocked?'':'disabled'}>${selected.unlocked?'天赋已学得':'投入点数，领悟此天赋'}</button><p class="depth-reason">${esc(selected.reason || '')}</p>`:''}${panelFeedback()}</aside></div>`);
  }
  function worldNpcPanel(id) {
    const info=Xian.worldNpcInfo?.(state,id);if(!info)return;
    state.interaction=null;
    const r=info.romance,thief=info.thief,questList=info.quests || [],map=mapDetails(info.mapId),met=Boolean(info.met);
    showModal(`worldnpc:${id}`,info.name,'MOUNTAIN FOLK · A LIFE OF THEIR OWN',`<div class="world-person-layout"><aside class="world-person-identity">${characterPortrait(id,info)}<span class="eyebrow">${esc(map.name)}</span><h3>${esc(info.name)}</h3><p>${esc(info.role)}</p>${r?`<div class="affinity-counter"><span>好感</span><strong>${r.affinity}</strong><small>${r.bonded?'已结为道侣':'结侣所需 6'}</small></div>`:''}<p class="depth-reason">${esc(info.reason || '')}</p><button class="modal-button subtle" data-world-map="${esc(info.mapId)}">在舆图定位</button></aside><section class="world-person-story"><p class="world-person-dialogue">${esc(info.description || info.dialogue || info.role)}</p><div class="world-meeting"><span class="meeting-seal">${met?'识':'逢'}</span><div><strong>${met?'已经相识':'初次相逢'}</strong><small>${met?'支线与关系进展由你此后的实际行动推进。':'靠近人物，先听听对方的来历。'}</small></div><button class="modal-button main" data-engine="worldlife:npc:talk:${esc(id)}" ${info.talkAvailable?'':'disabled'}>${met?'会面已记下':'上前交谈'}</button></div>${questList.map(q=>`<article class="world-person-quest ${q.claimed?'claimed':''}"><span class="eyebrow">${q.claimed?'承诺已成':q.accepted?'已接取':q.prerequisites?.length?'后续支线':'初识支线'}</span><h3>${esc(q.name)}</h3><p>${esc(q.description)}</p>${q.accepted?`<div class="progress-caption"><span>实际进度</span><strong>${q.progress} / ${q.target}</strong></div><div class="track"><i style="width:${clamp(q.progress/Math.max(1,q.target)*100,0,100)}%"></i></div>`:''}<small>所得：${esc(resourcesText(q.reward))}</small><div class="modal-actions"><button class="modal-button main" data-engine="worldlife:quest:${q.accepted?'claim':'accept'}:${esc(q.id)}" ${(q.accepted?q.canClaim:q.canAccept)?'':'disabled'}>${q.claimed?'支线已交付':q.accepted?'交付此支线':'接取此支线'}</button><button class="modal-button subtle" data-track-world-quest="${esc(q.id)}" ${q.claimed?'disabled':''}>${trackedWorldQuest===q.id?'取消追踪':'追踪目标'}</button></div>${q.reason?`<p class="depth-reason">${esc(q.reason)}</p>`:''}</article>`).join('')}${r?`<section class="romance-workspace"><header><span class="eyebrow">同修与道侣 · ${r.accompanying?'正在同行':r.bonded?'道侣相契':'情缘待续'}</span><h3>一道走过山海</h3><p>${esc(r.description)}</p></header><div class="bond-path"><div class="${met?'complete':''}"><b>${met?'✓':'1'}</b><span>彼此相识</span></div><div class="${questList.every(q=>q.claimed)?'complete':''}"><b>${questList.every(q=>q.claimed)?'✓':'2'}</b><span>两卷支线已成</span></div><div class="${r.bonded?'complete':''}"><b>${r.bonded?'✓':'3'}</b><span>好感与结侣</span></div></div><div class="romance-actions"><article><h4>赠礼相知</h4><p>已赠礼 ${r.gifts} / 3 次</p>${costTrayMarkup(r.giftCost,'赠礼')}<button class="modal-button main" data-engine="worldlife:romance:gift:${esc(id)}" ${r.canGift?'':'disabled'}>付出灵材，赠礼</button>${r.giftReason?`<small>${esc(r.giftReason)}</small>`:''}</article><article><h4>${r.bonded?'道侣同行':'同修结侣'}</h4>${!r.bonded?`${costTrayMarkup(r.bondCost,'结侣')}<button class="modal-button main" data-engine="worldlife:romance:bond:${esc(id)}" ${r.canBond?'':'disabled'}>缔结道侣</button>${r.bondReason?`<small>${esc(r.bondReason)}</small>`:''}`:`<p>${r.accompanying?'正在跟随你行走山海，实战时给予专属援助。':'可邀请道侣同行，实战时给予专属援助。'}</p><button class="modal-button main" data-engine="worldlife:romance:travel:${esc(id)}" ${r.canTravel?'':'disabled'}>${r.accompanying?'暂别同行':'邀请道侣同行'}</button>${r.travelReason?`<small>${esc(r.travelReason)}</small>`:''}`}</article></div></section>`:''}${thief?`<section class="thief-resolution"><span class="eyebrow">城中因果 · 一次处置</span><h3>${thief.resolved?'此事已有定论':'如何处置空空儿'}</h3>${thief.resolved?`<p>你选择了${esc(thief.choices.find(c=>c.id===thief.choice)?.label || thief.choice)}，实际结果已记录。</p>`:`<p>完成他的两段支线后，选择一次真实的处置。付出与所得会改变你的后续修行。</p><div class="thief-choice-grid">${thief.choices.map(c=>`<button data-engine="worldlife:thief:${esc(c.id)}" ${c.available?'':'disabled'}><strong>${esc(c.label)}</strong><small>${esc(c.description)}</small><em>付出 ${esc(resourcesText(c.cost)) || '无资源'}<br>所得 ${esc(resourcesText(c.reward)) || '见实际处置结果'}</em>${c.reason?`<small class="depth-reason">${esc(c.reason)}</small>`:''}</button>`).join('')}</div>${thief.reason?`<p class="depth-reason">${esc(thief.reason)}</p>`:''}`}</section>`:''}${panelFeedback()}</section></div>`);
  }
  function legacyStoryPanel(kind = 'story') {
    if(state.dead)return deathPanel();
    const story=Xian.storyInfo(state), quests=Xian.questsInfo(state), journal=story.journal || [];
    const dialogue=kind==='storyteller';
    showModal(kind,dialogue?(currentMap().npcs.find(n=>n.id===kind)?.name || npcNames[kind]):'山海见闻','STORIES · CHOICES · PROMISES',`<section class="story-chapter"><span class="eyebrow">${story.completed?'此卷已成':`第 ${Number(story.chapter)+1} 章`}</span><h3>${esc(story.title)}</h3><p>${esc(story.text)}</p>${story.requirements?.length?`<div class="story-requirements">${story.requirements.map(text=>`<span>${story.ready?'✓':'◇'} ${esc(text)}</span>`).join('')}</div>`:''}${story.completed?'<p class="modal-note">这一卷已写尽。你留下的选择与足迹，皆存于见闻。</p>':`<div class="story-options">${(story.options || []).map(option=>`<button class="story-option" data-engine="story:${esc(option.id)}" ${!story.ready?'disabled':''}><strong>${esc(option.label)}</strong><span>${esc(option.description)}</span></button>`).join('')}</div>${!story.ready?'<p class="modal-note">此段因缘尚待历练。完成上述条件后，可继续与道院人物交谈。</p>':''}`}</section><h3>山海委托 <span class="section-count">${quests.filter(q=>q.completed).length} / ${quests.length}</span></h3><div class="quests-list">${quests.map(q=>`<article class="quest-card ${q.completed?'completed':''}"><div><strong>${esc(q.name)}</strong><p>${esc(q.description)}</p><small>${esc(resourcesText(q.reward))}</small></div><div class="quest-action"><span>${Math.min(q.progress || 0,q.target || 0)} / ${q.target}</span><button class="modal-button ${q.ready&&!q.completed?'main':'subtle'}" data-engine="claim:${esc(q.id)}" ${q.completed||!q.ready?'disabled':''}>${q.completed?'已领取':q.ready?'领取奖励':'尚未完成'}</button></div></article>`).join('')}</div><h3>旅途手记</h3><div class="journal-list">${journal.length?journal.slice().reverse().map(entry=>`<article><span>${Math.floor((entry.time || 0)/60)} 分钟 · ${esc(entry.title || `第 ${Number(entry.chapter)+1} 章`)}</span><p>${esc(entry.text || entry)}</p></article>`).join(''):'<p class="empty-state">尚未落笔。去与守卷人交谈，写下旅途的第一段因缘。</p>'}</div><div class="modal-actions">${button('继续游历','close','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">J · 见闻与任务　ESC · 关闭</div>`);
  }
  function inventoryCard(item) {
    const source=itemInfo(item.id), type=item.type || source.type;
    const color=source.element ? elementInfo(source.element).color : '#d4c48e';
    const weaponKind=source.weaponKind || source.weaponType || 'sword';
    let actions='';
    if(type==='equipment')actions=`<button class="modal-button ${item.equipped?'subtle':'main'}" data-engine="equip:${esc(item.id)}" ${item.equipped?'disabled':''}>${item.equipped?'已装备':'装备'}</button>`;
    else if(type==='book')actions=actionButton('参悟',`learn:${source.technique}`,'main');
    else if(type==='consumable' && item.usable !== false)actions=actionButton('使用',`use:${item.id}`,'main');
    return `<article class="bag-item" style="--element:${esc(color)}"><div class="bag-item-icon">${svg(type==='equipment'?(source.slot==='weapon'?weaponKind:'forge'):type==='book'?'skill':source.id==='herbs'?'herb':type==='resource'?'stone':'potion')}</div><div class="bag-item-copy"><div class="item-heading"><strong>${esc(item.name)}</strong><span>× ${item.count}</span></div><small>${esc(item.grade || source.grade || '')}${source.slot ? ` · ${source.slot==='weapon'?weaponNames[weaponKind] || '武器':source.slot==='robe'?'法衣':'灵饰'}` : ''}</small><p>${esc(item.description || source.description)}</p>${source.stats?`<span class="item-stats">${esc(statBonuses(source.stats))}</span>`:''}</div>${actions?`<div class="bag-item-action">${actions}</div>`:''}</article>`;
  }
  function statBonuses(stats) {
    const names={attack:'攻击',maxHp:'气血上限',maxMp:'灵力上限',defense:'护体',speed:'移速',xpMultiplier:'修为倍率',manaRegen:'灵力回复',crit:'会心'};
    return Object.entries(stats || {}).map(([id,n])=>`${names[id] || id} ${n>=0?'+':''}${n}`).join(' · ');
  }
  function cultivatePanel() {
    if(state.dead)return deathPanel();
    if(cultivationTab==='talents'&&typeof Xian.talentInfo==='function')return talentPanel();
    if(cultivationTab==='retreat'&&typeof Xian.retreatInfo==='function')return retreatPanel();
    if(cultivationTab==='dao'&&typeof Xian.daoInfo==='function')return daoPanel();
    const s=Xian.stats(state),p=state.player,terminal=finalRealm();
    const info=typeof Xian.cultivationInfo==='function'?Xian.cultivationInfo(state):{realmIndex:p.realm,realmName:s.realmName,nextRealmName:realmName(p.realm+1),xp:p.xp,xpNeeded:s.xpNeeded,requirements:[],ready:false,reason:'先积累修为与历练，再回安全营地修行。',unlocks:[]};
    const requirements=info.requirements || [],unlocks=info.unlocks || [];
    const nextRealm=realmCatalog()[p.realm+1],weapon=currentWeapon();
    showModal('cultivate','修行与突破','THE IMMORTAL PATH',`${cultivationTabsMarkup()}<p class="lede">${esc(info.realmName)}之境。历练凝为修为，突破开启下一段仙途。</p><div class="realm-path">${realmCatalog().map((r,i)=>`<div class="realm-step ${i===p.realm?'current':i<p.realm?'complete':''}"><span>${esc(r.realmName || r.name)}</span><small>${i<p.realm?'已突破':i===p.realm?'当前境界':'尚未到达'}</small></div>`).join('')}</div>${rootMarkup()}<div class="cultivation-layout"><section class="breakthrough-card"><span class="eyebrow">${terminal?'仙途圆满':'下一境界'}</span><h3>${terminal?esc(info.realmName):esc(info.nextRealmName)}</h3><div class="cultivation-progress"><div class="progress-caption"><span>修为积累</span><span>${Math.floor(info.xp)}${terminal?'':` / ${info.xpNeeded}`}</span></div><div class="track"><i style="width:${terminal?100:clamp(info.xp/info.xpNeeded*100,0,100)}%"></i></div></div>${terminal?'<p class="modal-note">这一程的境界已修至圆满。仍可历练洞天、磨炼武器与道术，完成宗门事务。</p>':`<div class="breakthrough-requirements">${requirements.map(req=>`<div class="requirement-row ${req.met?'met':''}"><span>${req.met?'✓':'◇'}</span><div><strong>${esc(req.label)}</strong>${Number.isFinite(req.current)&&Number.isFinite(req.target)?`<small>${Math.min(req.current,req.target)} / ${req.target}</small>`:''}</div><small>${req.met?'已满足':'尚待历练'}</small></div>`).join('')}</div>${info.cost&&Object.keys(info.cost).length?`<p class="breakthrough-cost">突破消耗：${esc(resourcesText(info.cost))}</p>`:''}<button class="modal-button main breakthrough-button" data-engine="breakthrough" ${info.ready?'':'disabled'}>突破至${esc(info.nextRealmName)}</button>${info.reason?`<p class="promotion-reason">${esc(info.reason)}</p>`:''}`}</section><section class="realm-unlocks"><span class="eyebrow">${terminal?'当前修为':'突破所得'}</span><h3>${terminal?'道途已成':'新的力量与机缘'}</h3>${nextRealm?`<div class="realm-gains"><span>气血基础 ${realmCatalog()[p.realm]?.maxHp || 0} → ${nextRealm.maxHp}</span><span>灵力基础 ${realmCatalog()[p.realm]?.maxMp || 0} → ${nextRealm.maxMp}</span><span>攻击基础 ${realmCatalog()[p.realm]?.attack || 0} → ${nextRealm.attack}</span></div>`:''}${unlocks.length?`<div class="unlock-list">${unlocks.map(unlock=>`<article><strong>${esc(unlock.name)}</strong><p>${esc(unlock.description)}</p></article>`).join('')}</div>`:'<p class="empty-state">继续探索山海，完成尚未写尽的因缘。</p>'}</section></div><div class="stat-grid cultivation-stats">${statsCard('气血上限',s.maxHp)}${statsCard('灵力上限',s.maxMp)}${statsCard('攻击威力',Math.round(s.attack))}${statsCard('当前武器',weapon.name)}${statsCard('武器淬炼',p.weapon,'重')}${statsCard('灵石',p.stones)}</div><div class="modal-actions">${actionButton('打坐调息','meditate','subtle')}${button('继续游历','close','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">L · 修行与突破　ESC · 关闭</div>`);
  }
  function bagPanel() {
    if (state.dead) return deathPanel();
    const inventory=[...entries('RESOURCES').map(r=>({...itemInfo(r.id),count:state.player[r.id] || 0})),...Xian.inventoryInfo(state).filter(item=>item.type!=='resource')];
    const types={resources:'resource',consumables:'consumable',equipment:'equipment',books:'book'};
    const filtered=inventory.filter(item=>item.type===types[bagTab]);
    const slots={weapon:'武器',robe:'法衣',charm:'灵饰'};
    const weapon=currentWeapon();
    showModal('bag','行囊','GATHER · CRAFT · EQUIP',`<div class="inventory-layout"><aside class="loadout-page"><span class="eyebrow">此身行走山海</span><div class="loadout-portrait"><img src="assets/player-${esc(weapon.kind)}-v4.png" alt="当前修士装束"></div><h3>${esc(realmName(state.player.realm))}修士</h3><div class="equipment-strip">${Object.entries(slots).map(([slot,name])=>`<div><small>${name}</small><strong>${esc(state.equipment[slot]?itemInfo(state.equipment[slot]).name:'未装备')}</strong></div>`).join('')}</div><div class="loadout-stat">攻击 ${Math.round(Xian.stats(state).attack)} · 淬炼 ${state.player.weapon} 重</div></aside><section class="inventory-page"><div class="panel-tabs" role="tablist" aria-label="行囊分类">${Object.entries({resources:'灵材',consumables:'丹药符箓',equipment:'装备',books:'功法典籍'}).map(([id,label])=>`<button role="tab" aria-selected="${bagTab===id}" class="${bagTab===id?'selected':''}" data-bag="${id}">${label} <small>${inventory.filter(i=>i.type===types[id]).length}</small></button>`).join('')}</div><div class="bag-grid">${filtered.length?filtered.map(inventoryCard).join(''):'<p class="empty-state">此处尚空。探索山野、采集灵材，或拜访云游商人，充实行囊。</p>'}</div><div class="bag-summary"><span>行囊中的器物、灵材与传承，皆来自你的山海之行。</span>${button('功法修习','techniques','subtle')}</div></section></div>${panelFeedback()}<div class="shortcut-footer">B · 行囊　R · 服用回春丹　ESC · 关闭</div>`);
  }
  function cultivationTabsMarkup() {
    const tabs=typeof Xian.retreatInfo==='function'?{retreat:'闭关导气',realm:'境界突破',dao:'悟道树',...(typeof Xian.talentInfo==='function'?{talents:'天赋根基'}:{})}:{realm:'境界修行',dao:'悟道树'};
    return `<div class="panel-tabs cultivation-tabs" role="tablist" aria-label="修行分类">${Object.entries(tabs).map(([id,name])=>`<button role="tab" aria-selected="${cultivationTab===id}" class="${cultivationTab===id?'selected':''}" data-cultivation-tab="${id}">${name}</button>`).join('')}</div>`;
  }
  function retreatPanel() {
    const info=Xian.retreatInfo(state),mode=info.modes.find(m=>m.id===info.mode),ready=info.phase==='ready';
    cultivationTab='retreat';retreatSignature=[info.active,info.phase,info.mode].join('|');
    showModal('cultivate','太清静修','RETREAT · GUIDE YOUR INNER BREATH',`${cultivationTabsMarkup()}<div class="retreat-workspace"><aside><div class="qi-sea"><div class="qi-circle"><div id="retreat-qi-water" class="qi-water" style="--qi:${clamp((info.progress || 0)*100,0,100)}%"></div><span>气<small>${info.active?esc(mode?.name || '闭关'):'气海待凝'}</small></span></div><div class="qi-pressure"><span>导气压力 <strong id="retreat-pressure-value">${Math.round(info.pressure || 0)}</strong></span><div class="qi-pressure-track"><i id="retreat-pressure-needle" style="--pressure:${clamp(info.pressure || 0,0,100)}%"></i></div></div></div><p class="depth-note">调息使压力进入 ${info.targetMin}—${info.targetMax} 的稳定区。每次导气会改变实际压力，稳定时间决定所得心得。</p><div class="build-stat" id="retreat-preparation">${retreatPreparationText(info)}</div></aside><section>${!info.active?`<div class="retreat-modes">${info.modes.map(m=>`<article class="retreat-mode"><span class="eyebrow">${m.duration} 秒闭关</span><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p>${costTrayMarkup(m.cost,'投入')}<small>${esc(m.reason || '收功时决定将心得用于破境准备或实战调息。')}</small><button class="modal-button main" data-engine="journey:retreat:start:${esc(m.id)}" ${m.available?'':'disabled'}>入定修行</button></article>`).join('')}</div>`:ready?`<div class="retreat-result"><span class="eyebrow">闭关已成 · 心得待用</span><h3>${esc(info.quality || '收功')}</h3><p>本次心得 ${info.insight} · 稳定时间 ${Math.floor(info.stableTime || 0)} 秒。选择本次领悟的去处，结果收入对应准备。</p><div class="retreat-claims">${info.claimChoices.map(c=>`<button data-engine="journey:retreat:claim:${esc(c.id)}" ${info.canClaim&&c.available!==false?'':'disabled'}><strong>${esc(c.label)}</strong><small>${esc(c.description)}${c.reason?`<br>${esc(c.reason)}`:''}</small></button>`).join('')}</div>${!info.canClaim?`<p class="depth-reason">${esc(info.claimReason)}</p>`:''}</div>`:`<div class="workbench-title"><div><span class="eyebrow">行气周天</span><h3>${esc(mode?.name || '闭关导气')}</h3></div><span class="work-batch-status">投入已支付</span></div><div class="work-gauges"><div><span>稳定时间</span><strong id="retreat-stable">${Math.floor(info.stableTime || 0)} 秒</strong></div><div><span>稳定比例</span><strong id="retreat-ratio">${Math.round((info.stableRatio || 0)*100)}%</strong></div><div><span>当前心得</span><strong id="retreat-insight">${info.insight || 0}</strong></div></div><div class="work-progress"><span>闭关剩余 <strong id="retreat-countdown">${Math.ceil(info.remaining || 0)} 秒</strong></span><div class="track"><i id="retreat-progress" style="width:${clamp((info.progress || 0)*100,0,100)}%"></i></div></div><div class="retreat-controls">${info.controls.map(c=>`<button data-retreat-control="${esc(c.id)}" data-engine="journey:retreat:steer:${esc(c.id)}" ${c.available?'':'disabled'}><strong>${esc(c.label)}</strong><small>${esc(c.description)}</small></button>`).join('')}</div><p id="retreat-control-reason" class="depth-reason">${esc(info.controls.find(c=>c.reason)?.reason || '保持压力在稳定区，等待心神回转再导气。')}</p><p class="depth-note">关闭手卷可继续修炼；Esc 暂停、离开页面或关游戏都不会继续计时。</p>`}${panelFeedback()}<div class="modal-actions">${button('查看破境准备','realm','subtle')}${button('回到山海','close','subtle')}</div></section></div>`);
  }
  function retreatPreparationText(info) {
    const prep=info.preparations;
    if(!prep)return '尚未存有闭关破境准备。';
    if(Array.isArray(prep))return prep.length?prep.map(p=>typeof p==='string'?esc(p):esc(p.description || p.label || p.name)).join('<br>'):'尚未存有闭关破境准备。';
    return Object.entries(prep).filter(([,v])=>v).map(([id,v])=>`${esc(realmName(Number(id)))}破境修为需求 −${typeof v==='number'?Math.round(v*100):esc(v.discount || 0)}%`).join('<br>') || '尚未存有闭关破境准备。';
  }
  function updateRetreatProgress() {
    if(cultivationTab!=='retreat'||typeof Xian.retreatInfo!=='function')return;
    const info=Xian.retreatInfo(state),signature=[info.active,info.phase,info.mode].join('|');
    if(signature!==retreatSignature){const scroll=$('modal').querySelector('.panel-body')?.scrollTop || 0;retreatPanel();$('modal').querySelector('.panel-body').scrollTop=scroll;return;}
    const set=(id,value)=>{if($(id))$(id).textContent=value;};
    set('retreat-pressure-value',Math.round(info.pressure || 0));set('retreat-stable',`${Math.floor(info.stableTime || 0)} 秒`);set('retreat-ratio',`${Math.round((info.stableRatio || 0)*100)}%`);set('retreat-insight',info.insight || 0);set('retreat-countdown',`${Math.ceil(info.remaining || 0)} 秒`);
    if($('retreat-qi-water'))$('retreat-qi-water').style.setProperty('--qi',`${clamp((info.progress || 0)*100,0,100)}%`);
    if($('retreat-pressure-needle'))$('retreat-pressure-needle').style.setProperty('--pressure',`${clamp(info.pressure || 0,0,100)}%`);
    if($('retreat-progress'))$('retreat-progress').style.width=`${clamp((info.progress || 0)*100,0,100)}%`;
    for(const button of $('modal').querySelectorAll('[data-retreat-control]')){const c=info.controls.find(c=>c.id===button.dataset.retreatControl);button.disabled=!c?.available;}
    set('retreat-control-reason',info.controls.find(c=>c.reason)?.reason || '保持压力在稳定区，等待心神回转再导气。');
  }
  function daoPanel() {
    if(state.dead)return deathPanel();
    cultivationTab='dao';
    const info=Xian.daoInfo(state);
    if(!info.nodes.some(n=>n.id===selectedDao))selectedDao=info.nodes[0]?.id || '';
    const selected=info.nodes.find(n=>n.id===selectedDao),byId=Object.fromEntries(info.nodes.map(n=>[n.id,n]));
    const iconsByDirection={sword:'sword',bow:'bow',art:'skill'};
    showModal('cultivate','悟道树','THE DAO · CHOICES THAT SHAPE YOUR PATH',`${cultivationTabsMarkup()}<div class="dao-banner"><div><span class="eyebrow">历练沉淀 · 三条道途</span><h3>一念生，万法通</h3><p>突破境界、探索遗迹与历练首通凝为悟道点。沿前置逐一参悟，让剑、弓与五行道术生出不同的战斗方式。</p></div><div class="dao-points"><strong>${info.availablePoints}</strong><span>可用悟道点</span><small>已用 ${info.spentPoints} / 已得 ${info.earnedPoints}</small></div></div><div class="dao-layout"><div class="dao-tree">${info.directions.map(direction=>`<section class="dao-path"><header><span>${svg(iconsByDirection[direction.id])}</span><h3>${esc(direction.name)}</h3><p>${esc(direction.description)}</p></header><div class="dao-chain">${info.nodes.filter(n=>n.direction===direction.id).map((node,i)=>`<button class="dao-node ${node.learned?'learned':node.canLearn?'available':'locked'} ${node.id===selectedDao?'selected':''}" data-dao-node="${esc(node.id)}" aria-pressed="${node.id===selectedDao}"><span class="dao-node-number">${['一','二','三'][i] || i+1}</span><strong>${esc(node.name)}</strong><small>${node.learned?'已参悟':`${node.cost} 悟道点 · ${esc(realmName(node.realmRequired))}境`}</small><i>${node.learned?'✓':node.canLearn?'可悟':'◇'}</i></button>`).join('')}</div></section>`).join('')}</div><aside class="dao-insight"><span class="eyebrow">${esc(info.directions.find(d=>d.id===selected?.direction)?.name || '悟道')}</span><h3>${esc(selected?.name || '选择一项悟道')}</h3><p>${esc(selected?.description || '')}</p>${selected?`<div class="dao-requirements"><div><span>所需境界</span><strong>${esc(realmName(selected.realmRequired))}</strong></div><div><span>前置悟道</span><strong>${selected.prerequisites.length?selected.prerequisites.map(id=>esc(byId[id]?.name || id)).join(' → '):'无'}</strong></div><div><span>参悟消耗</span><strong>${selected.cost} 悟道点</strong></div></div><button class="modal-button ${selected.canLearn?'main':'subtle'}" data-engine="dao:learn:${esc(selected.id)}" ${selected.canLearn?'':'disabled'}>${selected.learned?'此道已悟':'参悟此道'}</button>${selected.reason?`<p class="promotion-reason">${esc(selected.reason)}</p>`:''}`:''}<p class="modal-note">参悟后长期生效。剑与弓节点只增强对应武器；术道节点增强真实连携、耗灵与野外采集。</p></aside></div><details class="dao-milestones"><summary>悟道点的来处 <span>${info.milestones.filter(m=>m.earned).length} / ${info.milestones.length} 项历练</span></summary><div>${info.milestones.map(m=>`<span class="${m.earned?'earned':''}">${m.earned?'✓':'◇'} ${esc(m.label)}<small>+${m.points}</small></span>`).join('')}</div></details>${panelFeedback()}<div class="shortcut-footer">L · 境界与悟道　ESC · 关闭</div>`);
  }
  function costTrayMarkup(cost, label='备料') {
    return `<div class="material-tray" aria-label="${esc(label)}"><span>${esc(label)}</span>${Object.entries(cost || {}).filter(([,n])=>n>0).map(([id,n])=>`<div class="material-token"><i>${svg(['herbs','wood'].includes(id)?'herb':['frost','ember'].includes(id)?id==='frost'?'frost':'flame':'stone')}</i><strong>${esc(resourceInfo(id).name===id?itemInfo(id).name:resourceInfo(id).name)}</strong><small>× ${n}</small></div>`).join('') || '<small>无需额外灵材</small>'}</div>`;
  }
  function workStagesMarkup(phases, current) {
    const index=Math.max(0,phases.findIndex(p=>p.ids.includes(current)));
    return `<div class="work-stages">${phases.map((p,i)=>`<div class="${i===index?'current':i<index?'complete':''}"><b>${i<index?'✓':i+1}</b><span>${esc(p.label)}</span></div>`).join('')}</div>`;
  }
  function thermalWorkbenchMarkup(info,forge) {
    const temperature=Number(info.temperature || 0),target=Number(info.targetTemperature || 0),active=Boolean(info.active),heating=['extract','heat'].includes(info.phase);
    return `<div class="thermal-workbench ${forge?'forge-bench':'brew-bench'} ${active?'working':'idle'}" style="--temperature:${clamp(temperature,0,140)/140*100}%;--target:${clamp(target,0,140)/140*100}%"><div class="workbench-ambient" aria-hidden="true"></div><div class="thermal-vessel" aria-hidden="true">${forge?'<div class="forged-blade"></div><div class="anvil-shape"></div>':'<div class="furnace-lid"></div><div class="furnace-bowl"><span>丹</span></div><div class="furnace-foot"></div>'}<div class="work-flame" style="--flame:${active&&heating?(info.fire || 0)/3:0}"><i></i><i></i><i></i></div><div class="work-sparks"></div></div><div class="thermal-display"><span>${forge?'器胚温度':'丹炉温度'}</span><strong id="work-temperature">${Math.round(temperature)}<small> 度</small></strong><p>${active?`目标 ${Math.round(target)} 度`:'开炉后显现目标温区'}</p></div><div class="thermal-scale"><i class="thermal-safe-zone" style="left:${clamp((target-9)/140*100,0,100)}%;width:${active?18/140*100:0}%"></i><i class="thermal-needle" id="work-temperature-needle" style="left:${clamp(temperature/140*100,0,100)}%"></i><span>冷</span><span>温</span><span>炽</span></div><div class="flame-controls" aria-label="${forge?'锻台':'丹炉'}火力">${(active?info.fireChoices || []:[]).map(f=>`<button class="${Number(f.id)===info.fire?'selected':''}" data-engine="workshop:${forge?'forge':'brew'}:fire:${esc(f.id)}" ${!heating||!info.near?'disabled':''}><span>${svg('flame')}</span><strong>${esc(f.label)}</strong><small>${f.target!=null?`${f.target} 度`:''}</small></button>`).join('')}</div></div>`;
  }
  function alchemyPanel() {
    if(typeof Xian.brewingInfo!=='function'||Xian.alchemyInfo(state).active)return legacyAlchemyPanel();
    return workshopPanel('alchemy');
  }
  function workshopPanel(kind) {
    if(state.dead)return deathPanel();
    state.interaction=null;
    const forge=kind==='forge',info=forge?Xian.forgingInfo(state):Xian.brewingInfo(state);
    const recipes=info.recipes || [],choices=forge?info.patterns || []:info.catalysts || [];
    let selectedId=forge?selectedForgeRecipe:selectedAlchemyRecipe;
    if(info.recipeId)selectedId=info.recipeId;
    if(!recipes.some(r=>r.id===selectedId))selectedId=recipes[0]?.id || '';
    if(forge)selectedForgeRecipe=selectedId;else selectedAlchemyRecipe=selectedId;
    const recipe=info.recipe || recipes.find(r=>r.id===selectedId),choiceId=forge?info.patternId || selectedForgePattern:info.catalystId || selectedBrewCatalyst;
    const choice=choices.find(c=>c.id===choiceId) || choices[0];
    if(forge)selectedForgePattern=choice?.id || 'edge';else selectedBrewCatalyst=choice?.id || 'wood';
    const active=Boolean(info.active),phase=info.phase || 'prepare',timed=forge?['heat','quenching'].includes(phase):['extract','sealing'].includes(phase);
    const phases=forge?[{label:'选器铸纹',ids:['prepare']},{label:'控温锤炼',ids:['heat']},{label:'淬火定型',ids:['temper','quenching']},{label:'收器',ids:['ready']}]:[{label:'丹方辅料',ids:['prepare']},{label:'控火提炼',ids:['extract']},{label:'聚气凝丹',ids:['condense','sealing']},{label:'出炉',ids:['ready']}];
    const stageChoices=forge?info.temperChoices || []:info.sealChoices || [],choosePhase=forge?phase==='temper':phase==='condense';
    const canStart=Boolean(!active&&info.near&&recipe?.available!==false&&choice?.available!==false&&recipe&&choice);
    const stageName=phases.find(p=>p.ids.includes(phase))?.label || '备料';
    workbenchSignature=[kind,phase,info.recipeId,info.near,info.canClaim].join('|');
    const outcomeMarkup=phase==='ready'?`<div class="work-result"><span class="result-seal">${forge?'器':'丹'}</span><span class="eyebrow">${esc(info.qualityName || info.mod?.name || '成品')}</span><h3>${esc(resourcesText(info.output))}</h3>${info.mod?.stats?`<p>${esc(statBonuses(info.mod.stats))}</p>`:''}<button class="modal-button main" data-engine="workshop:${forge?'forge':'brew'}:claim" ${info.canClaim?'':'disabled'}>${forge?'收取器物':'开炉收丹'}</button>${!info.canClaim?`<small>${esc(info.claimReason || info.reason)}</small>`:''}</div>`:choosePhase?`<div class="finishing-choices"><span class="eyebrow">${forge?'投入淬火介质':'决定凝丹方式'}</span>${stageChoices.map(c=>`<button class="finish-choice" data-engine="workshop:${forge?'forge:temper':'brew:seal'}:${esc(c.id)}" ${c.available===false||!info.near?'disabled':''}><span>${svg(forge?'frost':'skill')}</span><div><strong>${esc(c.label)}</strong><small>${esc(c.description)}</small><em>${c.duration} 秒${Object.keys(c.cost || {}).length?` · ${esc(resourcesText(c.cost))}`:''}</em>${c.available===false?`<small>${esc(c.reason)}</small>`:''}</div></button>`).join('')}</div>`:'';
    showModal(kind,forge?'百炼铸纹':'五行精炼丹炉',forge?'FORGE · FIRE SHAPES THE BLADE':'ALCHEMY · TEND THE FIRE',`<div class="workbench-layout"><aside class="workbench-catalog"><span class="eyebrow">${forge?'器谱':'丹方'}</span>${recipes.map(r=>`<button class="work-recipe ${r.id===selectedId?'selected':''}" data-work-recipe="${esc(r.id)}" data-work-kind="${kind}" ${active?'disabled':''}><span>${svg(forge?'forge':'potion')}</span><div><strong>${esc(r.name)}</strong><small>${esc(resourcesText(r.baseOutput || r.output))}</small></div></button>`).join('')}<div class="work-location"><strong>${info.near?'你正位于工作台旁':'须亲自返回工作台'}</strong><small>${esc(info.reason || '')}</small></div></aside><section class="workbench-main">${workStagesMarkup(phases,phase)}<div class="workbench-title"><div><span class="eyebrow">${esc(stageName)}</span><h3>${esc(recipe?.name || '择材而作')}</h3></div><span class="work-batch-status">${active?'材料已投入':'尚未投料'}</span></div>${thermalWorkbenchMarkup(info,forge)}${!active?`${costTrayMarkup(recipe?.cost,'主料')}<div class="work-options"><span class="eyebrow">${forge?'选择器纹 · 重铸会覆盖此型号原纹':'选择辅料 · 实际投入一份'}</span><div class="work-choice-grid">${choices.map(c=>`<button class="work-choice ${c.id===choice?.id?'selected':''}" data-work-choice="${esc(c.id)}" data-work-kind="${kind}" ${c.available===false?'disabled':''}><strong>${esc(c.name)}</strong><small>${esc(c.description)}</small>${c.cost?`<em>${esc(resourcesText(c.cost))}</em>`:c.stats?`<em>${esc(statBonuses(c.stats))}</em>`:''}</button>`).join('')}</div></div>`:''}${active?`<div class="work-gauges">${forge?`<div><span>有效锤炼 / 已敲锤</span><strong id="work-strikes">${info.effectiveStrikes || 0} / ${info.strikes || 0}</strong></div>`:`<div><span>纯净度</span><strong id="work-purity">${Math.round(info.purity || 0)}%</strong></div><div><span>温区稳定</span><strong id="work-stability">${Math.round((info.stability || 0)*100)}%</strong></div>`}<div><span>预计品质</span><strong id="work-quality">${esc(info.predictedQuality || info.qualityName || info.mod?.name || '尚未定型')}</strong></div></div>`:''}${timed?`<div class="work-progress"><span>${esc(stageName)} <strong id="work-countdown">${Math.ceil(info.remaining || 0)} 秒</strong></span><div class="track"><i id="work-progress-fill" style="width:${clamp((info.progress || 0)*100,0,100)}%"></i></div></div>`:''}${outcomeMarkup}<div class="work-actions">${!active?`<button class="modal-button main" data-engine="workshop:${forge?'forge':'brew'}:start:${esc(selectedId)}:${esc(choice?.id)}" ${canStart?'':'disabled'}>${forge?'投入材料，起炉铸器':'投入主料与辅料，开炉'}</button>`:forge&&phase==='heat'?`<button id="work-primary-action" class="modal-button main" data-engine="workshop:forge:hammer" ${info.canHammer&&info.near?'':'disabled'}>落锤 <small>有效 ${info.effectiveStrikes || 0} / ${info.strikes || 0}</small></button>`:!forge&&phase==='extract'?`<button id="work-primary-action" class="modal-button main" data-engine="workshop:brew:purify" ${info.canPurify&&info.near?'':'disabled'}>涤除丹杂 · 8 灵力</button>`:''}<span id="work-action-reason">${esc(!active?recipe?.reason || choice?.reason || info.reason || '材料按所选丹方与辅料消耗一次。':forge?info.hammerReason || info.reason || '温区内落锤，决定器纹品质。':info.purifyReason || info.reason || '控制炉火，让温度稳定于目标温区。')}</span></div>${panelFeedback()}</section><aside class="workbench-preview"><span class="eyebrow">${active?'本炉记录':'工艺预览'}</span><div class="preview-sigil">${svg(forge?'forge':'potion')}</div><h3>${esc(choice?.name || '')}</h3><p>${esc(choice?.description || recipe?.description || '')}</p>${!forge&&choice&&!active?`<dl><div><dt>目标温度偏移</dt><dd>${choice.heatOffset>=0?'+':''}${choice.heatOffset || 0} 度</dd></div><div><dt>纯净度增量</dt><dd>${choice.purityBonus>=0?'+':''}${choice.purityBonus || 0}</dd></div><div><dt>额外产量</dt><dd>${choice.yieldBonus || 0}</dd></div></dl>`:''}${forge&&choice?.stats?`<p class="preview-stats">${esc(statBonuses(info.mod?.stats || choice.stats))}</p>`:''}${active?`<div class="preview-output"><small>预计产物 · 收取后入行囊</small><strong id="work-output">${esc(resourcesText(info.output)) || '定型后显现'}</strong></div>`:''}<p class="work-rule">${forge?'锤炼温区与淬火共同决定刻纹。新纹覆盖同型号原纹，装备后才产生属性取舍。':'炉火改变温度，稳定温区与涤杂共同决定品质。药效以最终丹药的行囊说明为准。'}</p></aside></div>`);
  }
  function updateWorkbenches() {
    const forge=modalKind==='forge',info=forge?Xian.forgingInfo?.(state):Xian.brewingInfo?.(state);
    if(!info)return;
    if(!forge&&Xian.alchemyInfo(state).active)return updateAlchemyProgress();
    const signature=[modalKind,info.phase || 'prepare',info.recipeId,info.near,info.canClaim].join('|');
    if(signature!==workbenchSignature){const scroll=$('modal').querySelector('.panel-body')?.scrollTop || 0;workshopPanel(modalKind);$('modal').querySelector('.panel-body').scrollTop=scroll;return;}
    const set=(id,value)=>{if($(id))$(id).textContent=value;};
    set('work-temperature',`${Math.round(info.temperature || 0)} 度`);set('work-countdown',`${Math.ceil(info.remaining || 0)} 秒`);set('work-purity',`${Math.round(info.purity || 0)}%`);set('work-stability',`${Math.round((info.stability || 0)*100)}%`);set('work-strikes',`${info.effectiveStrikes || 0} / ${info.strikes || 0}`);set('work-quality',info.predictedQuality || info.qualityName || info.mod?.name || '尚未定型');set('work-output',resourcesText(info.output) || '定型后显现');
    if($('work-temperature-needle'))$('work-temperature-needle').style.left=`${clamp((info.temperature || 0)/140*100,0,100)}%`;
    if($('work-progress-fill'))$('work-progress-fill').style.width=`${clamp((info.progress || 0)*100,0,100)}%`;
    if($('work-primary-action')){$('work-primary-action').disabled=!(info.near&&(forge?info.canHammer:info.canPurify));if(forge)$('work-primary-action').innerHTML=`落锤 <small>有效 ${info.effectiveStrikes || 0} / ${info.strikes || 0}</small>`;}
    if(info.active)set('work-action-reason',forge?info.hammerReason || info.reason || '温区内落锤，决定器纹品质。':info.purifyReason || info.reason || '控制炉火，让温度稳定于目标温区。');
    const vessel=$('modal').querySelector('.work-flame');if(vessel)vessel.style.setProperty('--flame',['extract','heat'].includes(info.phase)?(info.fire || 0)/3:0);
    for(const button of $('modal').querySelectorAll('.flame-controls button'))button.classList.toggle('selected',Number(button.dataset.engine.split(':').pop())===info.fire);
  }
  function legacyAlchemyPanel() {
    if(state.dead)return deathPanel();
    state.interaction=null;
    const info=Xian.alchemyInfo(state);
    if(info.recipe)selectedAlchemyRecipe=info.recipe.id;
    if(!info.recipes.some(r=>r.id===selectedAlchemyRecipe))selectedAlchemyRecipe=info.recipes[0]?.id || 'healing';
    const selected=info.recipe || info.recipes.find(r=>r.id===selectedAlchemyRecipe);
    const phase=info.phase || 'recipe',phases=['recipe','heat','seal','ready'],stage=phase==='heating'?1:phase==='sealing'?2:phases.indexOf(phase);
    const phaseNames={recipe:'择方备料',heat:'选择炉火',heating:'炉火温养',seal:'选择凝丹',sealing:'聚气凝丹',ready:'成丹待领'};
    const phaseText=phaseNames[phase];
    const heat=info.heatChoices.find(c=>c.id===info.heat),seal=info.sealChoices.find(c=>c.id===info.seal);
    const timed=['heating','sealing'].includes(phase);
    const choices=phase==='heat'?info.heatChoices:phase==='seal'?info.sealChoices:[];
    const prefix=phase==='heat'?'heat':'seal';
    alchemySignature=[info.phase,info.recipe?.id,info.near,info.canClaim].join('|');
    showModal('alchemy','灵药炉','ALCHEMY · FIRE, PATIENCE AND HERBAL SPIRIT',`<div class="alchemy-layout"><aside class="alchemy-recipes"><span class="eyebrow">丹方录</span><h3>草木皆有灵</h3><p>择方开炉，调火温养，再聚气成丹。不同炉火与凝丹策略改变实际产量。</p>${info.recipes.map((recipe,i)=>`<button class="alchemy-recipe ${recipe.id===selectedAlchemyRecipe?'selected':''}" data-alchemy-recipe="${esc(recipe.id)}" ${info.active&&recipe.id!==selectedAlchemyRecipe?'disabled':''}><span>${svg(i===1?'herb':i===2?'earth':'potion')}</span><div><strong>${esc(recipe.name)}</strong><small>${esc(resourcesText(recipe.baseOutput))}</small></div></button>`).join('')}<div class="alchemy-station"><span>此炉所在</span><strong>${esc(info.stationName)}</strong><small>${info.near?'你正位于炉边':esc(info.reason)}</small></div></aside><section class="alchemy-workbench" data-alchemy-phase="${phase}"><div class="alchemy-stages">${phases.map((id,i)=>`<span class="${i===stage?'current':i<stage?'done':''}"><i>${i<stage?'✓':i+1}</i>${({recipe:'择方',heat:'控火',seal:'凝丹',ready:'收丹'})[id]}</span>`).join('')}</div><div class="alchemy-furnace"><div class="furnace-aura" aria-hidden="true"></div><svg class="furnace-vessel" viewBox="0 0 240 235" aria-hidden="true"><defs><linearGradient id="furnace-jade" x2="0" y2="1"><stop stop-color="#80a187"/><stop offset="1" stop-color="#365f47"/></linearGradient></defs><path d="M75 202 67 217M166 202l7 15" stroke="#4e674b" stroke-width="9" stroke-linecap="round"/><path d="M67 104C33 83 27 126 59 149M173 104c34-21 40 22 8 45" stroke="#788661" stroke-width="8" fill="none"/><path d="M62 94h115l-8 84q-3 24-50 25t-50-25Z" fill="url(#furnace-jade)" stroke="#b6a773" stroke-width="3"/><path d="M74 96q45-23 91 0M79 177q39 17 77 0" fill="none" stroke="#c2b483" stroke-width="2"/><path d="m68 85 27-24h48l29 24Z" fill="#597b58" stroke="#b4a26f" stroke-width="3"/><path d="M114 62V45h12v17" stroke="#687954" stroke-width="4" fill="#b5a374"/><circle cx="121" cy="143" r="27" fill="none" stroke="#c0b37f" stroke-width="2"/><path d="M113 121q31 24 0 46m16-46q-31 24 0 46" fill="none" stroke="#acb276" stroke-width="1.5"/><path class="furnace-fire" d="M119 193c-13 10-8 15-11 22-13-8-5-17-11-22-13 22 0 34 22 34s34-13 24-30c-4 9-8 11-12 12 2-9-6-11-12-16Z" fill="#c6894c"/><path class="furnace-steam" d="M106 35q-14-12-2-23m18 26q14-13 2-29m17 26q-9-8-2-16" fill="none" stroke="#7fa38e" stroke-width="3" stroke-linecap="round"/></svg><div class="furnace-caption"><span class="eyebrow">${esc(phaseText)}</span><h3>${esc(selected?.name || '一炉丹心')}</h3><small>${heat?esc(heat.label):'尚未选择炉火'}${seal?` · ${esc(seal.label)}`:''}</small></div></div>${timed?`<div class="alchemy-progress"><div><span>${phase==='heating'?'炉火温养中':'灵气凝结中'}</span><strong id="alchemy-countdown">${Math.ceil(info.remaining)} 秒</strong></div><div class="track"><i id="alchemy-progress-fill" style="width:${Math.round(info.progress*100)}%"></i></div><p>你可以留在炉边守候，或关闭面板继续游历。按 ESC 可暂停。</p></div>`:''}${phase==='recipe'&&selected?`<div class="alchemy-formula"><span>丹方所需</span><strong>${esc(resourcesText(selected.cost))}</strong><small>基础产出：${esc(resourcesText(selected.baseOutput))} · ${esc(realmName(selected.realmRequired))}境可炼</small></div><button class="modal-button main alchemy-main" data-engine="alchemy:start:${esc(selected.id)}" ${selected.available?'':'disabled'}>投料开炉</button>${selected.reason?`<p class="promotion-reason">${esc(selected.reason)}</p>`:''}`:''}${choices.length?`<div class="alchemy-choices">${choices.map((choice,i)=>`<button data-engine="alchemy:${prefix}:${esc(choice.id)}" ${choice.available?'':'disabled'}><span>${prefix==='heat'?['文','平','武'][i]:['慢','快'][i]}</span><strong>${esc(choice.label)}</strong><small>${choice.duration} 秒${Object.keys(choice.cost).length?` · ${esc(resourcesText(choice.cost))}`:''}</small><p>${esc(choice.description)}</p>${choice.reason?`<em>${esc(choice.reason)}</em>`:''}</button>`).join('')}</div>`:''}${phase==='ready'?`<div class="alchemy-result"><span class="eyebrow">${esc(info.quality?.name || '丹成')}</span><h3>${esc(resourcesText(info.output))}</h3><p>${esc(info.quality?.description || '')}本批药效沿用丹方。</p><button class="modal-button main alchemy-main" data-engine="alchemy:claim" ${info.canClaim?'':'disabled'}>收入行囊</button>${info.claimReason?`<p class="promotion-reason">${esc(info.claimReason)}</p>`:''}</div>`:''}</section></div><details class="alchemy-quick"><summary>便捷炼制与器物 <span>沿用既有配方，一步制作</span></summary><div class="recipe-list">${entries('RECIPES').filter(r=>Object.keys(r.output || {}).some(id=>itemInfo(id).type==='consumable')).map(r=>`<article class="recipe-row"><div class="recipe-copy"><strong>${esc(r.name)}</strong><p>${esc(resourcesText(r.cost))} → ${esc(resourcesText(r.output))}</p></div><button class="modal-button subtle" data-engine="craft:${esc(r.id)}" ${info.active||!info.near||state.player.realm<(r.realmRequired || 0)?'disabled':''}>一步炼制</button></article>`).join('')}</div></details><div class="modal-actions">${button('查看行囊','bag','subtle')}${button('关闭丹炉','close','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">E · 丹炉交互　ESC · 暂停　关闭面板可续炼</div>`);
  }
  function updateAlchemyProgress() {
    if(!state||typeof Xian.alchemyInfo!=='function')return;
    const info=Xian.alchemyInfo(state),signature=[info.phase,info.recipe?.id,info.near,info.canClaim].join('|');
    if(signature!==alchemySignature){const scroll=$('modal').querySelector('.panel-body')?.scrollTop || 0;alchemyPanel();$('modal').querySelector('.panel-body').scrollTop=scroll;return;}
    if($('alchemy-countdown'))$('alchemy-countdown').textContent=`${Math.max(0,Math.ceil(info.remaining))} 秒`;
    if($('alchemy-progress-fill'))$('alchemy-progress-fill').style.width=`${Math.round(info.progress*100)}%`;
  }
  function craftingPanel(kind = 'alchemy') {
    if(kind==='alchemy'&&typeof Xian.alchemyInfo==='function')return alchemyPanel();
    if(kind==='forge'&&typeof Xian.forgingInfo==='function')return workshopPanel('forge');
    const isForge=kind==='forge', recipes=entries('RECIPES').filter(recipe=>{
      const outputs=Object.keys(recipe.output || {}).map(itemInfo);
      return outputs.some(item=>item.type===(isForge?'equipment':'consumable'));
    });
    const p=state.player;
    const legacyForge=isForge?`<div class="recipe-row"><div class="recipe-copy"><strong>武器淬炼 · ${p.weapon} 重</strong><p>当前威力 ${Xian.stats(state).attack}，淬炼提升 4 点威力。<br>${p.weapon>=6?'已达六重。':`下次消耗 ${40+p.weapon*35} 灵石、${1+Math.floor(p.weapon/2)} 株灵草。`}<br>当前境界上限 ${Math.min(6,2+p.realm*2)} 重。</p></div>${actionButton('淬炼武器','upgrade','main')}</div>`:'';
    showModal(kind,isForge?'铸剑台':'灵药炉',isForge?'FORGE · 灵材化为锋芒':'ALCHEMY · 草木炼为丹心',`<p class="compact-lede">${isForge?'灵铁、精魄与灵材可炼为不同的剑、弓、法衣与灵饰；制作后到行囊装备。':'山川灵材各有所用。炼成的丹药与符箓可在行囊中使用，战斗中的回春丹仍按 R 服用。'}</p><div class="resource-wallet">${entries('RESOURCES').map(r=>`<span>${esc(r.name)} <b>${state.player[r.resourceField || r.id] || 0}</b></span>`).join('')}</div>${legacyForge}<div class="recipe-list">${recipes.map(recipe=>`<article class="recipe-row"><div class="recipe-copy"><strong>${esc(recipe.name)}</strong><p>${esc(recipe.description)}<br><span class="recipe-cost">${esc(resourcesText(recipe.cost))}</span><br>产出 ${esc(resourcesText(recipe.output))}${recipe.realmRequired ? ` · ${realmName(recipe.realmRequired)}境可制` : ''}</p></div><button class="modal-button main" data-engine="craft:${esc(recipe.id)}" ${p.realm < (recipe.realmRequired || 0)?'disabled':''}>${isForge?'炼制':'开炉'}</button></article>`).join('')}</div><div class="modal-actions">${button('查看行囊','bag','subtle')}${button('继续游历','close','subtle')}</div>${panelFeedback()}`);
  }
  function vendorPanel() {
    const stock=entries('ITEMS').filter(item=>Number.isFinite(item.price)&&item.price>0);
    showModal('merchant','云游商人','TRAVELING MERCHANT · 山海互通',`<p class="compact-lede">「山川有别，百物相生。你需要的机缘，也许正在我的行囊中。」</p><div class="vendor-balance">现有灵石 <strong>${state.player.stones}</strong><span>典籍可解锁功法；丹药、装备购买后存入行囊。</span></div><div class="vendor-grid">${stock.map(item=>`<article class="vendor-item"><div><span class="eyebrow">${esc(item.grade)} · ${item.type==='book'?'典籍':item.type==='equipment'?'装备':item.type==='resource'?'灵材':'消耗品'}</span><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p></div><div class="vendor-buy"><span>${item.price} 灵石</span>${actionButton('购买',`buy:${item.id}`,state.player.stones>=item.price?'main':'subtle')}</div></article>`).join('')}</div><div class="modal-actions">${button('查看行囊','bag','subtle')}${button('告辞','close','subtle')}</div>${panelFeedback()}`);
  }
  function portalPanel(target) {
    const m=mapDetails(target);
    showModal(`portal:${target}`,m.name,'THRESHOLD · 山海一线',`<p class="lede">传送门中，另一片山海正向你敞开。</p><p>${esc(m.description)}</p><p class="modal-note">${m.unlocked?`${m.type==='trial'?'踏入此地，将迎来三重试炼。':'沿途有不同的灵材、妖兽与守关者。'}渡界后从当地营地出发，可随时返回安全营地离开。`:`需达到${realmName(m.realmRequired)}境才可进入。`}</p><div class="modal-actions"><button class="modal-button main" data-engine="travel:${esc(target)}" ${m.unlocked?'':'disabled'}>穿过传送门</button>${button('暂不前往','close','subtle')}</div>${panelFeedback()}`);
  }
  function npcPanel(kind) {
    if(kind.startsWith('worldlife:')&&typeof Xian.worldNpcInfo==='function')return worldNpcPanel(kind.slice(10));
    if(catalog().NPC_CHARACTERS?.[kind])return characterPanel(kind);
    if (kind === 'sect') return sectPanel();
    if (kind === 'cultivation') return cultivatePanel();
    if (kind === 'master') return masterPanel();
    if (kind === 'storyteller') return storyPanel(kind);
    if (kind === 'waygate') return mapPanel(true);
    if (kind === 'merchant') return vendorPanel();
    if (kind.startsWith('portal:')) return portalPanel(kind.slice(7));
    if (kind === 'alchemy' || kind === 'forge') return craftingPanel(kind);
    const p = state.player;
    if (kind === 'alchemy') {
      showModal('alchemy','灵药炉','ALCHEMY · 炼化山川灵气',`<p class="lede">炉火不息，药香长存。灵草炼为回春丹，助你走过凶险山野。</p><div class="recipe-row"><div class="recipe-copy"><strong>炼制回春丹 × 2</strong><p>消耗 2 株灵草、8 枚灵石。<br>现有灵草 ${p.herbs} · 灵石 ${p.stones} · 回春丹 ${p.potions}</p></div>${actionButton('开炉炼丹','craft','main')}</div><p>回春丹回复 42% 气血与 25% 灵力，战斗中按 R 服用。气血和灵力都充盈时不会消耗丹药。</p><div class="modal-actions">${button('离开丹炉','close','subtle')}</div>${panelFeedback()}`);
    } else if (kind === 'forge') {
      const cost = 40 + p.weapon * 35, herbs = 1 + Math.floor(p.weapon / 2), cap = Math.min(6, 2 + p.realm * 2);
      showModal('forge','铸剑台','THE BLADE REFORGED',`<p class="lede">百炼成钢，剑随心长。将一路所得灵石，铸入你的佩剑。</p><div class="recipe-row"><div class="recipe-copy"><strong>灵剑 · ${p.weapon === 0 ? '未淬炼' : `${p.weapon} 重`}</strong><p>当前攻击威力 ${Xian.stats(state).attack}。淬炼后威力增加 4。<br>${p.weapon >= 6 ? '灵剑已达六重，剑意圆满。' : `下次淬炼：${cost} 灵石 + ${herbs} 株灵草。`}<br>现有灵石 ${p.stones} · 灵草 ${p.herbs}</p></div>${actionButton('淬炼灵剑','upgrade','main')}</div><p class="modal-note">当前境界最多可淬炼至 ${cap} 重。突破境界可提高上限；材料不足时不会消耗材料。</p><div class="modal-actions">${button('离开铸剑台','close','subtle')}</div>${panelFeedback()}`);
    } else {
      showModal('shrine','归元祠','REST · 归于山海',`<p class="lede">「流水不争先，争的是滔滔不绝。」</p><p>在道院打坐可恢复全部气血和灵力。隔一段历练时光，调息还能增加少量修为。</p><div class="stat-grid">${statsCard('当前气血',Math.ceil(p.hp),`/ ${Xian.stats(state).maxHp}`)}${statsCard('当前灵力',Math.ceil(p.mp),`/ ${Xian.stats(state).maxMp}`)}${statsCard('修为',Math.floor(p.xp))}</div><div class="modal-actions">${actionButton('打坐调息','meditate','main')}${button('继续游历','close','subtle')}</div>${panelFeedback()}`);
    }
  }
  function masterPanel(topic = masterTopic) {
    if(state.dead)return deathPanel();
    masterTopic=topic;
    const joined=state.sect?.id || state.sect?.sectId;
    const topics={
      welcome:joined?'「既入山门，便与同道共担风雨。办妥宗门委托，贡献会记在你的名下。」':'「青云观只是仙途的起点。山海各宗自有传承，走到山门前，先听听他们如何问道。」',
      sect:'「宗门并非一块牌匾。剑修与弓修各有传承，亲自拜访掌事、完成委托，再以贡献换取传承与器物。按 N 可以查看宗门事务。」',
      patrol:`「巡山时别只盯着妖兽。沿道路采集灵材，留意传送门，危险来时先保住性命。」\n眼下的历练方向：${Xian.objective(state)}`,
    };
    const info={name:npcNames.master,role:'青云观 · 山门引路人',description:'守护青云观的真人，关注山门规矩与弟子的山野历练。',color:'#bfc29d'};
    showModal('master',info.name,'THE GATEKEEPER · 山门与历练',`<div class="npc-dialog-layout"><aside class="npc-identity">${characterPortrait('master',info)}<span class="eyebrow">${info.role}</span><h3>${info.name}</h3><p>${info.description}</p></aside><div class="npc-conversation"><p class="npc-dialogue">${esc(topics[topic] || topics.welcome)}</p><div class="npc-talk-choices"><button class="story-option" data-master="sect"><strong>请教山门规矩</strong><span>了解宗门、贡献与传承。</span></button><button class="story-option" data-master="patrol"><strong>请教巡山历练</strong><span>听取当前阶段的游历建议。</span></button></div><p class="modal-note">山海故事由守卷人记录。你可前往守卷人身边交谈，或按 J 查看见闻。</p><div class="modal-actions">${button('查看宗门事务','sect','subtle')}${button('告辞','close','subtle')}</div></div></div>${panelFeedback()}`);
  }
  function sectPanel() {
    if(state.dead)return deathPanel();
    const info=typeof Xian.sectInfo==='function'?Xian.sectInfo(state):{joined:false,rank:'未入门',contribution:0,totalContribution:0,missions:[],supplies:[],facilities:[],disciples:[]};
    const activity=typeof Xian.activityInfo==='function'?Xian.activityInfo(state):null;
    const atSect=state.mapId==='sect'&&Xian.isSafe(state)&&!activity,joined=Boolean(info.joined);
    const missions=info.missions || [],supplies=info.supplies || [],facilities=info.facilities || [],disciples=info.disciples || [];
    let body='';
    if(sectTab==='routes'&&typeof Xian.routeInfo==='function')body=routePreparationMarkup();
    else if(sectTab==='facilities')body=sectFacilitiesMarkup(info,atSect);
    else if(sectTab==='disciples')body=sectDisciplesMarkup(info,atSect);
    else body=`<div class="sect-mission-grid">${missions.map(m=>{const enabled=joined&&atSect&&m.unlocked;return `<article class="sect-mission ${m.unlocked?'':'locked'}"><span class="mission-mark" aria-hidden="true">${svg(({bounty:'sword',defense:'earth',tower:'forge',tribulation:'thunder'})[m.id])}</span><span class="eyebrow">${esc(realmName(m.realmRequired || 0))}境历练</span><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p><div class="mission-reward"><span>本次完成</span><strong>${esc(resourcesText(m.reward || m.firstReward)) || '本次无资源奖励'}</strong>${m.id==='tribulation'?`<span>雷劫难度</span><strong>${m.rank || 1} 重雷劫</strong>`:''}</div><button class="modal-button ${enabled?'main':'subtle'}" data-engine="sect:mission:${esc(m.id)}" ${enabled?'':'disabled'}>开始历练</button>${!enabled?`<p class="promotion-reason">${esc(!joined?'先拜入宗门。':activity?'先完成或退出当前历练。':!m.unlocked?m.reason || `需达到${realmName(m.realmRequired || 0)}境。`:!atSect?'返回宗门安全区域，方可开始历练。':'暂不可用。')}</p>`:''}</article>`;}).join('')}</div><h3>贡献兑换</h3><div class="sect-supplies">${supplies.map(s=>`<article><div><strong>${esc(s.name)}</strong><p>所得：${esc(resourcesText(s.reward))}</p><span>${esc(resourcesText(s.cost))}</span>${!s.available?`<small>${esc(s.reason || '当前尚不能兑换。')}</small>`:''}</div><button class="modal-button ${s.available?'main':'subtle'}" data-engine="sect:exchange:${esc(s.id)}" ${s.available?'':'disabled'}>兑换</button></article>`).join('')}</div>`;
    showModal('sect','宗门事务','THE SECT · DUTY AND LEGACY',`<div class="sect-banner"><div><span class="eyebrow">${esc(catalog().MAPS?.sect?.name || '宗门山门')}</span><h3>${joined?'同道共问长生':'山门待君入'}</h3><p>${joined?'历练积累贡献，建设设施、安排弟子与五行方位，让山门随你的仙途成长。':'亲自到山门拜入宗门，领取入门器物与传承，开启贡献与历练。'}</p></div><div class="sect-rank"><span>${esc(info.rankName || (typeof info.rank==='object'?info.rank.name:joined?'记名弟子':'未入门'))}</span><strong>${info.contribution || 0}</strong><small>可用贡献 · 累计 ${info.totalContribution || 0}</small></div></div>${!joined?`<div class="sect-join"><p>${atSect?'你已来到宗门山门，可以拜入门下。':'拜入宗门须亲自前往山门。打开 M，可从安全营地渡界。'}</p><button class="modal-button main" data-engine="sect:join" ${atSect?'':'disabled'}>拜入宗门</button>${!atSect?button('前往宗门山门','sect-map','subtle'):''}</div>`:''}<div class="panel-tabs" role="tablist" aria-label="宗门事务分类">${Object.entries({...(typeof Xian.routeInfo==='function'?{routes:'山海路线'}:{}),missions:'宗门历练',facilities:'山门建设',disciples:'弟子分工'}).map(([id,label])=>`<button role="tab" aria-selected="${sectTab===id}" class="${sectTab===id?'selected':''}" data-sect-tab="${id}">${label}</button>`).join('')}</div>${!atSect&&joined?'<p class="modal-note">此处可查看山门进展。返回宗门安全区域后，才能办理建设、派驻、招募与领取。</p>':''}${body}<div class="modal-actions">${!atSect?button('查看宗门山门','sect-map','subtle'):''}${button('查看行囊','bag','subtle')}${button('继续游历','close','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">N · 宗门事务　ESC · 关闭</div>`);
  }
  function sectFacilitiesMarkup(info,atSect) {
    if(typeof Xian.managementInfo==='function'){
      const management=Xian.managementInfo(state);
      if(management.enabled)return managementMarkup(management,info);
      const intro=`<section class="management-intro"><div><h3>五行庭院 · 生产调度</h3><p>先领取旧有积存，再接管产线。新订单逐批消耗真实材料；方位、邻接、弟子专长与疲劳一起决定生产。</p></div><button class="modal-button main" data-engine="management:enable" ${management.canEnable?'':'disabled'}>启用订单调度</button>${management.reason?`<small>${esc(management.reason)}</small>`:''}</section>`;
      return intro+legacySectFacilitiesMarkup(info,atSect);
    }
    return legacySectFacilitiesMarkup(info,atSect);
  }
  function routePreparationMarkup() {
    const routes=Xian.routeInfo(state),exp=Xian.expeditionInfo(state);
    if(!routes.some(r=>r.id===selectedRoute))selectedRoute=routes[0]?.id || '';
    const r=routes.find(r=>r.id===selectedRoute);
    if(!r)return '<p class="empty-state">路线尚未开启。</p>';
    const points=[[19,73],[50,46],[82,25]],build=Xian.buildInfo(state),q=Xian.techniqueInfo(state,state.activeTechnique),f=state.secondaryTechnique?Xian.techniqueInfo(state,state.secondaryTechnique):null,weapon=currentWeapon();
    const buffs=state.buffs || [],medicines=Xian.inventoryInfo(state).filter(i=>i.type==='consumable'&&i.count>0);
    return `<div class="route-selection" role="tablist" aria-label="山海路线">${routes.map(x=>`<button role="tab" aria-selected="${r.id===x.id}" class="${r.id===x.id?'selected':''}" data-route="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div><div class="route-workspace"><section><div class="route-atlas"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M19 73 Q26 43 50 46 T82 25"/></svg>${r.stations.map((p,i)=>`<div class="route-station ${exp?.id===r.id?(i+1<exp.stage?'complete':i+1===exp.stage?'current':''):''}" style="--station-x:${points[i]?.[0] || 50}%;--station-y:${points[i]?.[1] || 50}%"><b>${i+1}</b><strong>${esc(p.name)}</strong><small>${esc(p.description)}</small></div>`).join('')}</div><p class="depth-note">三站路线各有抉择。到达路标后按 E 查看当站的敌情、代价与回报，再亲自完成战斗。途中退出会失去本路尚未结算的奖励。</p><div class="departure-loadout"><span>行前整备 · 当前实装</span><strong>${esc(weapon.name)} · ${esc(weaponNames[weapon.kind])}</strong><p>Q ${esc(q.name)}${f?` → F ${esc(f.name)}`:' · F 尚未配装'}<br>心法 ${build.slots.filter(Boolean).map(m=>esc(m.name)).join(' / ') || '尚未装配'}<br>行囊药物 ${medicines.length?medicines.map(m=>`${esc(m.name)} × ${m.count}`).join(' · '):'暂无'}${buffs.length?`<br>已启用丹药增益 ${buffs.length} 项`:''}</p><div class="modal-actions">${button('调整功法心法','techniques','subtle')}${button('整顿行囊用药','bag','subtle')}</div></div></section><aside class="route-briefing"><span class="eyebrow">${esc(realmName(r.realmRequired))}境路线 · 已完成 ${r.completed || 0} 次</span><h3>${esc(r.name)}</h3><p>${esc(r.description)}</p>${costTrayMarkup(r.cost,'出发补给')}<p class="depth-note">出发补给会即时投入；站点选择的额外准备分别支付。最终所得来自实际选择与三站通关。</p>${exp?`<div class="route-marker-status"><strong>${esc(exp.name)}</strong><br>第 ${exp.stage} / ${exp.maxStages} 站 · ${esc(exp.stageName)}<br>本路已付 ${esc(resourcesText(exp.paidCost))}</div><div class="modal-actions">${button('回到当前路线','close','main')}<button class="modal-button subtle" data-engine="journey:route:leave" ${exp.canLeave?'':'disabled'}>放弃本路并返回</button></div>`:`<div class="work-actions"><button class="modal-button main" data-engine="journey:route:start:${esc(r.id)}" ${r.available?'':'disabled'}>投入补给，踏上此路</button></div>`}<p class="depth-reason">${esc(r.reason || '')}</p>${panelFeedback()}</aside></div>`;
  }
  function routeStationPanel() {
    const info=Xian.expeditionInfo?.(state);
    if(!info||info.phase!=='choice'||!info.near)return;
    state.interaction=null;
    showModal('route-choice',info.station.name,'ROUTE · A CHOICE WITH CONSEQUENCES',`<span class="eyebrow">${esc(info.name)} · 第 ${info.stage} / ${info.maxStages} 站</span><p class="lede">${esc(info.station.description)}</p><div class="route-choice-list">${info.options.map(o=>`<button data-engine="journey:route:choose:${esc(o.id)}" ${o.available?'':'disabled'}><strong>${esc(o.label)}</strong><span>${esc(o.danger)}</span><small>${esc(o.description)}</small><em>本次投入 ${esc(resourcesText(o.cost)) || '无额外材料'} · 通关所得 ${esc(resourcesText(o.reward)) || '无额外资源'}</em>${o.reason?`<small>${esc(o.reason)}</small>`:''}</button>`).join('')}</div><p class="depth-note">选择后会出现对应的实际敌阵与危险；用当前武器、道法和准备完成这一站。</p>${panelFeedback()}<div class="modal-actions">${button('先查看周围','close','subtle')}<button class="modal-button subtle" data-engine="journey:route:leave">放弃本路并返回</button></div>`);
  }
  function updateExpeditionHUD(info) {
    const panel=$('activity-panel');panel.classList.remove('hidden');
    const complete=info.phase==='complete',failed=info.phase==='failed',choice=info.phase==='choice',fight=info.phase==='fight';
    const objective=info.objective,head=complete?'路线通关':failed?'路线受挫':choice?'站点待决':fight?'站点实战':'前往路标';
    const markup=`<div class="activity-heading"><span class="eyebrow">${head} · ${info.stage} / ${info.maxStages} 站</span><button data-engine="journey:route:leave">${complete||failed?'返回':'退出路线'} ↗</button></div><h3>${esc(info.name)}</h3><p>${esc(info.stageName)}</p>${choice?`<p class="activity-warning">${info.near?'按 E 查看敌情并选择路线。':'走近当前路标后按 E。'}</p>${info.near?'<button class="modal-button main" data-ui="route-choice">查看站点选择</button>':''}`:fight?`<div class="activity-time"><span>剩余敌人</span><strong>${info.remainingEnemies}</strong></div>${objective?`<div class="activity-crystal"><span>护送目标 ${Math.ceil(objective.hp)} / ${objective.maxHp}</span><div><i style="width:${clamp(objective.hp/objective.maxHp*100,0,100)}%"></i></div></div>`:''}${info.warnings.length?'<p class="activity-warning">地面危险即将落下，及时闪避。</p>':''}`:complete?`<p class="activity-warning">本路所得：${esc(resourcesText(info.pendingReward))}</p><div class="activity-time"><span>自动返回宗门</span><strong>${Math.ceil(info.returnRemaining || 0)} 秒</strong></div>`:failed?'<p class="activity-warning">本路未结算奖励。退出整备，重新规划。</p>':'<p>沿世界中的行旅路标，抵达下一站。</p>'}<p class="activity-cost">本路已付 ${esc(resourcesText(info.paidCost)) || '无'}</p>`;
    if(markup!==expeditionMarkup){expeditionMarkup=markup;panel.innerHTML=markup;}
  }
  function managementMarkup(info,legacy) {
    if(!info.facilities.some(f=>f.id===selectedFacility))selectedFacility=info.facilities[0]?.id || 'garden';
    const f=info.facilities.find(f=>f.id===selectedFacility),old=legacy.facilities.find(x=>x.id===selectedFacility);
    if(!f)return '<p class="empty-state">山门尚待建设。</p>';
    if(!f.recipes.some(r=>r.id===selectedOrder))selectedOrder=f.order?.recipeId || f.recipes[0]?.id || '';
    const r=f.recipes.find(r=>r.id===selectedOrder),worker=info.workers.find(w=>w.id===f.discipleId),positions=info.positions.map(p=>({east:[82,43],south:[50,72],center:[50,44],west:[18,43],north:[50,17]})[p.id] || [50,44]),imgs={garden:'herb-garden-v4.png',forge:'forge-v4.png',library:'pavilion-v4.png'};
    const maxQuantity=Math.max(0,r?.maxQuantity ?? 6);orderQuantity=clamp(orderQuantity,1,Math.max(1,maxQuantity));
    const percent=f.batch?clamp(f.batch.progress/f.batch.duration*100,0,100):0;
    return `<div class="courtyard-layout"><section><div class="five-courtyard"><div class="courtyard-ring"></div><svg class="courtyard-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${positions.map((p,i)=>{const q=positions[(i+1)%positions.length];return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`;}).join('')}</svg>${info.positions.map((p,i)=>{const building=info.facilities.find(x=>x.position===p.id),xy=positions[i] || [50,45];return `<button class="courtyard-position ${building?'':'available'} ${building?.id===selectedFacility?'selected':''}" style="--slot-x:${xy[0]}%;--slot-y:${xy[1]}%" ${building?`data-facility="${esc(building.id)}"`:`data-engine="management:position:${esc(f.id)}:${esc(p.id)}" ${f.canMove?'':'disabled'}`}><small>${esc(p.label)} · ${esc(elementInfo(p.element).name)}</small>${building?`<img src="assets/${imgs[building.id]}" alt=""><strong>${esc(building.name)}</strong><span>${building.level} 重 · ${building.resting?'弟子轮休':building.producing?'生产中':'待安排'}<br>${building.stored} / 3 批积存</span>`:`<strong>空置方位</strong><span>将${esc(f.name)}移至此位</span>`}</button>`;}).join('')}<div class="courtyard-caption"><strong>五行相生，产线相续</strong>选择建筑，再选择空置方位。真实邻接加成列于右侧。<br>工艺研究 ${info.research} / 3 级</div></div><div class="panel-tabs">${info.facilities.map(x=>`<button class="${x.id===f.id?'selected':''}" data-facility="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div><div class="production-sources"><span>下一批预计来源${f.order?' · 已排产线':' · 默认产线'}</span>${(f.sources || []).map(s=>`<span>${esc(s)}</span>`).join('')}</div><p class="depth-note">手卷内暂停生产。关闭手卷后继续计时；库存满三批即停。订单的材料仅在一批实际开始时投入。</p>${worker?`<div class="worker-strip"><span class="worker-avatar">${esc(worker.name.slice(0,1))}</span><div><strong>${esc(worker.name)} · ${worker.resting?'轮休恢复':'派驻生产'}</strong><small>疲劳 ${Math.round(worker.fatigue)} / 100${worker.resting?` · 至少休息剩余 ${Math.ceil(worker.restRemaining || 0)} 秒`:''}</small><div class="fatigue-track"><i style="width:${clamp(worker.fatigue,0,100)}%"></i></div></div><button class="modal-button subtle" data-engine="management:rest:${esc(worker.id)}" ${!info.inSect||worker.resting?'disabled':''}>轮休</button></div><div class="worker-policy">${info.policies.map(p=>`<button class="${worker.policy===p.id?'selected':''}" data-engine="management:policy:${esc(worker.id)}:${esc(p.id)}" ${!info.inSect||f.batch?'disabled':''} title="速率 ${p.speed} · 疲劳 ${p.fatigue}">${esc(p.name)}${Object.keys(p.extraCost || {}).length?` · ${esc(resourcesText(p.extraCost))}`:''}</button>`).join('')}</div>${f.batch?'<p class="depth-reason">本批材料已投入，政策调整须待此批完成。</p>':''}`:''}<div class="assignment-options">${info.workers.filter(w=>w.recruited).map(w=>`<button data-engine="sect:assign:${esc(f.id)}:${esc(w.id)}" ${!info.inSect||!f.level||f.discipleId===w.id?'disabled':''}>${esc(w.name)}${w.assignedTo?` · ${esc(info.facilities.find(x=>x.id===w.assignedTo)?.name || '')}`:''}</button>`).join('')}${worker?`<button data-engine="sect:assign:${esc(f.id)}:none" ${!info.inSect?'disabled':''}>撤回弟子</button>`:''}</div></section><aside class="courtyard-detail"><span class="eyebrow">生产调度 · ${f.level} 重设施</span><h3>${esc(f.name)}</h3>${f.moveReason?`<p class="depth-reason">${esc(f.moveReason)}</p>`:''}<div class="production-queue">${Array.from({length:3},(_,i)=>`<div class="production-batch ${i<f.stored?'':'empty'}">${i<f.stored?'成':'空'}</div>`).join('')}<div>${f.stored} / 3 批库存<br>${esc(resourcesText(f.totalRewards || f.storedRewards)) || '待产出'}</div></div>${f.canClaim?`<button class="modal-button main" data-engine="management:claim:${esc(f.id)}">领取实际积存</button>`:''}${f.order&&!f.batch?`<p class="depth-note">待执行订单：${esc(f.recipes.find(x=>x.id===f.order.recipeId)?.name || '生产')} × ${f.order.quantity} 批。关闭手卷后投入首批材料。</p>`:''}${f.batch?`<div class="work-progress"><span>${esc(f.recipes.find(x=>x.id===f.batch.recipeId)?.name || '正在生产')}<strong>${Math.ceil(f.batch.duration-f.batch.progress)} 秒</strong></span><div class="track"><i style="width:${percent}%"></i></div></div><p class="depth-note">已付 ${esc(resourcesText(f.batch.cost))}<br>本批产物 ${esc(resourcesText(f.batch.reward))}<br>剩余订单 ${f.order?.quantity || 0} 批 · 速率 ${Number(f.batchMultiplier || 1).toFixed(2)} 倍</p>`:''}<div class="order-grid">${f.recipes.map(x=>`<button class="order-option ${x.id===selectedOrder?'selected':''}" data-order-recipe="${esc(x.id)}"><strong>${esc(x.name)}</strong><em>${esc(elementInfo(x.element).name)} · 预计 ${Math.ceil(x.duration)} 秒</em><small>每批投入 ${esc(resourcesText(x.cost)) || '无需材料'}<br>每批产出 ${esc(resourcesText(x.reward))}</small></button>`).join('')}</div><div class="quantity-control"><span>计划订单批数</span><div><button data-order-quantity="-1" ${orderQuantity<=1?'disabled':''}>−</button><strong>${orderQuantity}</strong><button data-order-quantity="1" ${orderQuantity>=maxQuantity?'disabled':''}>＋</button></div></div><div class="work-actions"><button class="modal-button main" data-engine="management:order:${esc(f.id)}:${esc(selectedOrder)}:${orderQuantity}" ${info.inSect&&f.level&&r?.available&&maxQuantity>0&&!f.order&&!f.batch?'':'disabled'}>安排订单</button>${f.order?`<button class="modal-button subtle" data-engine="management:cancel:${esc(f.id)}">取消后续</button>`:''}</div><p class="depth-reason">${esc(r?.reason || (!info.inSect?'亲自返回宗门安排订单。':f.order?'当前订单尚未结束，可先取消未投入部分。':!f.level?'先建设此设施。':''))}</p>${old?`<div class="modal-actions"><button class="modal-button subtle" data-engine="sect:upgrade:${esc(f.id)}" ${old.canUpgrade?'':'disabled'}>${f.level?`升至 ${f.level+1} 重`:'建设设施'}</button></div>`:''}${panelFeedback()}</aside></div>`;
  }
  function legacySectFacilitiesMarkup(info,atSect) {
    const facilities=info.facilities || [],disciples=info.disciples || [];
    if(!facilities.some(f=>f.id===selectedFacility))selectedFacility=facilities[0]?.id || 'garden';
    const f=facilities.find(f=>f.id===selectedFacility);
    if(!f)return '<p class="empty-state">山门尚待建设。</p>';
    const assigned=disciples.find(d=>d.id===f.discipleId),element=elementInfo(f.element || f.preferredElement),preferred=elementInfo(f.preferredElement || f.element);
    const percent=f.level>0?clamp((f.progress || 0)/(f.duration || 1)*100,0,100):0;
    const full=f.stored>=f.capacity,canConfigure=atSect&&info.joined;
    const positions=f.positions || [];
    return `<div class="sect-building-layout"><aside class="sect-blueprint"><div class="blueprint-heading"><span class="eyebrow">青云宗 · 内院</span><p>山门建设</p></div><div class="facility-overview">${facilities.map(item=>`<button class="facility-node ${item.id===f.id?'selected':''} ${item.level?'built':''}" data-facility="${esc(item.id)}"><span>${svg(item.id==='garden'?'herb':item.id==='forge'?'forge':'skill')}</span><div><strong>${esc(item.name)}</strong><small>${item.level?`${item.level} / ${item.maxLevel} 重建筑`:'尚未建成'}</small><em>${item.level?`${item.stored} / ${item.capacity} 批待领取`:'建设并派驻后生产'}</em></div></button>`).join('')}</div><p class="blueprint-note">五行方位与派驻弟子会改变设施的实际生产速率。仓储达到三批后停产，需亲手领取。设施建成后也需派驻弟子，才会开始生产。</p></aside><section class="facility-detail"><div class="facility-title"><div><span class="eyebrow">${f.level?`建筑 ${f.level} / ${f.maxLevel} 重`:'待建建筑'}</span><h3>${esc(f.name)}</h3></div><span class="facility-element" style="--element:${esc(preferred.color)}">${esc(preferred.name)}</span></div><p>${esc(f.description)}</p><div class="facility-production"><div><span>${full?'仓储已满':f.level?f.discipleId?'生产进度':'等待弟子派驻':'尚未生产'}</span><strong>${f.stored} / ${f.capacity} 批</strong></div><div class="track"><i style="width:${full?100:percent}%"></i></div><p>每批产出：${esc(resourcesText(f.batchReward))}<br>每批需 ${Math.ceil(f.duration || 0)} 秒 · 生产倍率 ×${Number(f.productionMultiplier || 1).toFixed(2)}</p><button class="modal-button ${f.canClaim?'main':'subtle'}" data-engine="sect:claim:${esc(f.id)}" ${f.canClaim?'':'disabled'}>领取${f.stored?` ${f.stored} 批`:'产出'}</button>${f.stored?`<small>实际可领：${esc(resourcesText(f.claimReward))}</small>`:''}${!f.canClaim&&f.claimReason?`<small>${esc(f.claimReason)}</small>`:''}</div><h3>五行方位</h3><div class="element-compass">${positions.map(position=>`<button class="compass-${esc(position.id)} ${f.position===position.id?'selected':''}" data-engine="sect:position:${esc(f.id)}:${esc(position.id)}" style="--element:${esc(elementInfo(position.element).color)}" ${!canConfigure||f.position===position.id?'disabled':''}><span>${esc(position.label)}</span><strong>${esc(elementInfo(position.element).name)}</strong></button>`).join('')}</div><p class="facility-affinity">设施偏好 ${esc(preferred.name)} · 当前方位 ${esc(element.name)} · 速率 ×${Number(f.productionMultiplier || 1).toFixed(2)}<br><small>调整方位或调任弟子，会重新开始当前批次。</small></p><h3>派驻弟子</h3><div class="facility-assignment"><span>${assigned?`${esc(assigned.name)} · ${esc(elementInfo(assigned.element).name)}灵根`:'当前无人派驻'}</span>${assigned?`<button data-engine="sect:assign:${esc(f.id)}:none" ${canConfigure?'':'disabled'}>撤回弟子</button>`:''}</div><div class="assignment-options">${disciples.filter(d=>d.recruited).map(d=>`<button data-engine="sect:assign:${esc(f.id)}:${esc(d.id)}" ${!canConfigure||!f.level||f.discipleId===d.id?'disabled':''} style="--element:${esc(elementInfo(d.element).color)}"><span>${esc(elementInfo(d.element).name)}</span>${esc(d.name)}${f.discipleId===d.id?' · 已派驻':d.assignedTo?' · 调任':''}</button>`).join('') || '<p>前往弟子分工，招募同门协助山门生产。</p>'}</div><section class="facility-upgrade"><h3>${f.level?'提升设施':'建成设施'}</h3>${f.level<f.maxLevel?`<p>${esc(resourcesText(f.upgradeCost))} · ${esc(realmName(f.upgradeRealm || 0))}境可建</p><button class="modal-button ${f.canUpgrade?'main':'subtle'}" data-engine="sect:upgrade:${esc(f.id)}" ${f.canUpgrade?'':'disabled'}>${f.level?`升至 ${f.level+1} 重`:'开始建设'}</button>${!f.canUpgrade&&f.upgradeReason?`<p class="promotion-reason">${esc(f.upgradeReason)}</p>`:''}`:'<p>设施已建至三重。继续调整方位与弟子，及时领取产出。</p>'}</section></section></div>`;
  }
  function traitTrainingMarkup(d) {
    if(!d.trainOptions.some(t=>t.id===selectedTraitTraining[d.id]))selectedTraitTraining[d.id]=d.trainOptions.find(t=>t.available)?.id || d.trainOptions[0]?.id || '';
    const selected=d.trainOptions.find(t=>t.id===selectedTraitTraining[d.id]);
    return `<div class="trait-training"><span class="eyebrow">后天训练 · 替换当前单一词条</span><select class="trait-select" data-trait-choice="${esc(d.id)}" aria-label="${esc(d.name)}训练方向">${d.trainOptions.map(t=>`<option value="${esc(t.id)}" ${t.id===selected?.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select>${selected?`<div class="trait-preview"><strong>${esc(selected.name)}</strong><p>${esc(selected.description)}</p><small>${esc(resourcesText(selected.cost))}</small><button class="modal-button main" data-engine="worldlife:trait:train:${esc(d.id)}:${esc(selected.id)}" ${selected.available?'':'disabled'}>投入材料，更换词条</button>${selected.reason?`<small>${esc(selected.reason)}</small>`:''}</div>`:''}</div>`;
  }
  function sectDisciplesMarkup(info,atSect) {
    if(typeof Xian.discipleTraitInfo!=='function')return legacySectDisciplesMarkup(info,atSect);
    const traits=Xian.discipleTraitInfo(state),facilities=info.facilities || [];
    return `<p class="compact-lede">同门既有灵根，也有各自性情。训练更换单一后天词条，实际生产和疲劳倍率随之改变；查看建筑的下一批来源可核实结果。</p><div class="trait-disciple-grid">${traits.map(d=>{const old=info.disciples.find(x=>x.id===d.id) || d,assigned=facilities.find(f=>f.id===old.assignedTo),element=elementInfo(old.element);return `<article class="trait-disciple-card"><header><img src="${renderer.npcPortrait?.(d.id,d.id) || ''}" alt="${esc(d.name)}独立立绘"><div><span class="eyebrow">${esc(element.name)}灵根 · ${esc(realmName(old.realmRequired || 0))}境同门</span><h3>${esc(d.name)}</h3><p>${d.recruited?assigned?`派驻 ${esc(assigned.name)}`:'已招募，尚未派驻':'尚未招募'}</p></div></header><div class="disciple-trait-tags">${d.traits.map(t=>`<div><strong>${esc(t.name)}</strong><small>${esc(t.description)}</small></div>`).join('')}</div><div class="trait-multipliers"><div><span>生产倍率</span><strong>${Number(d.productionMultiplier).toFixed(2)}<small> 倍</small></strong></div><div><span>疲劳倍率</span><strong>${Number(d.fatigueMultiplier).toFixed(2)}<small> 倍</small></strong></div></div><p class="depth-note">${d.active?'词条已生效。':'启用新调度后，词条才会产生实际效果。'}${esc(d.battleDescription || '')}</p>${!d.recruited?`<div class="modal-actions"><button class="modal-button main" data-engine="sect:recruit:${esc(d.id)}" ${old.canRecruit?'':'disabled'}>招募同门</button><span class="depth-reason">${esc(old.recruitReason || resourcesText(old.recruitCost))}</span></div>`:`${traitTrainingMarkup(d)}<div class="disciple-jobs">${facilities.map(f=>`<button data-engine="sect:assign:${esc(f.id)}:${esc(d.id)}" ${!atSect||!f.level||old.assignedTo===f.id?'disabled':''}>派驻${esc(f.name)}</button>`).join('')}</div>`}</article>`;}).join('')}</div>`;
  }
  function legacySectDisciplesMarkup(info,atSect) {
    const disciples=info.disciples || [],facilities=info.facilities || [];
    return `<p class="compact-lede">弟子各有灵根与入门条件。招募后派驻已建成的设施，设施面板会显示实际生产倍率。</p><div class="disciple-roster">${disciples.map(d=>{const element=elementInfo(d.element),assigned=facilities.find(f=>f.id===d.assignedTo);return `<article class="disciple-card" style="--element:${esc(element.color)}"><div class="disciple-portrait"><span>${esc(element.name)}</span><i></i></div><div class="disciple-identity"><span class="eyebrow">${esc(element.name)}灵根 · ${esc(realmName(d.realmRequired || 0))}境同门</span><h3>${esc(d.name)}</h3><p>${d.recruited?assigned?`正在${esc(assigned.name)}协助生产。`:'已招募，尚未派驻设施。':`招募所需：${esc(resourcesText(d.recruitCost))}`}</p>${!d.recruited?`<button class="modal-button ${d.canRecruit?'main':'subtle'}" data-engine="sect:recruit:${esc(d.id)}" ${d.canRecruit?'':'disabled'}>招募同门</button>${d.recruitReason?`<p class="promotion-reason">${esc(d.recruitReason)}</p>`:''}`:`<div class="disciple-jobs">${facilities.map(f=>`<button data-engine="sect:assign:${esc(f.id)}:${esc(d.id)}" ${!atSect||!f.level||d.assignedTo===f.id?'disabled':''}>${esc(f.name)}${d.assignedTo===f.id?' · 已派驻':''}</button>`).join('')}</div>${assigned?`<button class="disciple-unassign" data-engine="sect:assign:${esc(assigned.id)}:none" ${atSect?'':'disabled'}>撤回同门</button>`:''}`}</div></article>`;}).join('')}</div>`;
  }
  function explorationPanel(id) {
    if(state.dead)return deathPanel();
    const info=typeof Xian.siteInfo==='function'?Xian.siteInfo(state,id):catalog().EXPLORATION_SITES?.[id];
    if(!info)return;
    const requirements=info.requirements || [];
    showModal(`site:${id}`,info.name,'TRACES IN THE WILDERNESS · 山野机缘',`<div class="exploration-seal">${info.kind==='chest'?'藏':info.kind==='gather'?'采':'迹'}</div><p class="lede">${esc(info.description || '')}</p>${requirements.length?`<div class="story-requirements">${requirements.map(req=>`<span>${typeof req==='object'?`${req.met?'✓':'◇'} ${esc(req.label || req.description)}`:esc(req)}</span>`).join('')}</div>`:''}<div class="site-reward"><span>${info.claimed?'所得已存入行囊':'此处可得'}</span><strong>${esc(resourcesText(info.reward))}</strong></div><p class="modal-note">${esc(info.claimed?'这处机缘已经探查。继续寻找山野中尚未踏足的古迹。':info.reason || '探查并领取此处机缘。每处探索点仅能领取一次。')}</p><div class="modal-actions"><button class="modal-button main" data-engine="site:${esc(id)}:claim" ${info.available&&!info.claimed?'':'disabled'}>${info.claimed?'已探查':'探查机缘'}</button>${button('继续游历','close','subtle')}</div>${panelFeedback()}`);
  }
  function deathPanel() {
    showModal('death','此身暂歇，仙途未尽','THE PATH CONTINUES',`<p class="lede">山海凶险，胜败寻常。回到青云观，整顿行囊，再问长生。</p><p>重整旗鼓会损失少量灵石和当前修为。已突破的境界、武器淬炼与斩妖进度会保留。</p><div class="modal-actions">${actionButton('重返青云观','revive','main')}${button('导出存档','export','subtle')}</div>`,false);
  }
  function victoryPanel() {
    showModal('victory','天门已开，仙途未止','THE MOUNTAINS REMEMBER',`<div class="victory-seal">问道</div><p class="lede">天门守卫已败，这一卷山海已有回响。<br>更高的境界与宗门历练，仍在前方等你。</p><div class="stat-grid">${statsCard('斩妖',state.quests.kills)}${statsCard('当前境界',Xian.stats(state).realmName)}${statsCard('游历时长',Math.floor(state.time/60),'分钟')}</div><p>你的仙途已保存。按 L 查看下一步修行，或前往宗门继续历练。</p><div class="modal-actions">${button('继续游历','close','main')}${button('导出存档','export','subtle')}</div>`);
  }
  function execute(id) {
    if (!state) return;
    const kind = modalKind;
    const scrollTop=$('modal').querySelector('.panel-body')?.scrollTop || 0;
    Xian.action(state,id);
    const result = state.lastAction;
    panelMessage = result?.message || (Array.isArray(state.logs) ? state.logs[state.logs.length-1] : '') || '';
    sound.fx(result?.ok === false ? 'fail' : 'success');
    if (id.startsWith('travel:') && result?.ok) {
      closeModal();pointer.moved=false;mapSelection=state.mapId;lastZone='';
      mapArrival();notify(`已抵达${currentMap().name}。`);
    }
    else if (id.startsWith('journey:route:choose:')&&result?.ok) {closeModal();pointer.moved=false;notify(result.message || '选择已定，完成当前站点的实战。');}
    else if ((id.startsWith('sect:mission:') || id === 'activity:leave' || id.startsWith('journey:route:start:') || id==='journey:route:leave') && result?.ok) {
      closeModal();pointer.moved=false;lastZone='';mapArrival();notify(result.message || (id==='activity:leave'?'已返回宗门。':'历练已经开始。'));
    }
    else if (id === 'revive' && !state.dead) {previouslyDead = false;closeModal();notify('已回到青云观。气血与灵力恢复，仙途仍在。');}
    else if (kind === 'bag') bagPanel();
    else if (kind === 'map') mapPanel();
    else if (kind === 'techniques') techniquesPanel();
    else if (kind.startsWith('npc:')) characterPanel(kind.slice(4));
    else if (kind.startsWith('worldnpc:')) worldNpcPanel(kind.slice(9));
    else if (kind === 'master') masterPanel();
    else if (kind === 'sect') sectPanel();
    else if (kind === 'route-choice') routeStationPanel();
    else if (['story','storyteller'].includes(kind)) storyPanel(kind);
    else if (kind === 'merchant') vendorPanel();
    else if (kind === 'cultivate') cultivatePanel(kind);
    else if (['forge','alchemy','shrine','cultivation'].includes(kind)) npcPanel(kind);
    else if (kind.startsWith('portal:')) portalPanel(kind.slice(7));
    else if (kind.startsWith('site:')) explorationPanel(kind.slice(5));
    if(modalKind&&$('modal').querySelector('.panel-body'))$('modal').querySelector('.panel-body').scrollTop=scrollTop;
    updateHUD(); save();
  }
  function mapArrival() {
    $('map-arrival')?.remove();
    const node=document.createElement('div');node.id='map-arrival';node.className='map-arrival';
    node.innerHTML=`<span>山海新境</span><strong>${esc(currentMap().name)}</strong>`;
    $('game-root').appendChild(node);setTimeout(()=>node.remove(),2200);
  }
  function home() {
    save();closeModal();state = null;
    $('hud').classList.add('hidden');$('title-screen').classList.remove('hidden');refreshSaved();
  }
  function updateHUD() {
    if (!state) return;
    const p = state.player, s = Xian.stats(state);
    $('realm').textContent = s.realmName;
    $('hp-fill').style.width = `${clamp(p.hp/s.maxHp*100,0,100)}%`;
    $('mp-fill').style.width = `${clamp(p.mp/s.maxMp*100,0,100)}%`;
    $('hp-value').textContent = `${Math.max(0,Math.ceil(p.hp))} / ${s.maxHp}`;
    $('mp-value').textContent = `${Math.max(0,Math.ceil(p.mp))} / ${s.maxMp}`;
    $('xp-fill').style.width = `${(finalRealm() ? 100 : clamp(p.xp/s.xpNeeded*100,0,100))}%`;
    const activity=typeof Xian.activityInfo==='function'?Xian.activityInfo(state):null;
    const tracked=trackedWorldQuest&&typeof Xian.worldQuestInfo==='function'?Xian.worldQuestInfo(state).find(q=>q.id===trackedWorldQuest):null;
    const expeditionObjective=typeof Xian.expeditionInfo==='function'?Xian.expeditionInfo(state):null;
    if(tracked?.claimed){trackedWorldQuest='';try{localStorage.removeItem(TRACK_KEY);}catch(_){}}
    $('objective').textContent = expeditionObjective?`${expeditionObjective.name} · ${expeditionObjective.stageName}`:activity?.completed || activity?.failed ? Xian.objective(state) : activity?.objective || (tracked&&!tracked.claimed?`${tracked.name} · ${tracked.accepted?`${tracked.progress} / ${tracked.target}`:'尚待接取'} · ${catalog().WORLD_NPCS?.[tracked.npcId]?.name || tracked.npcId}`:Xian.objective(state));
    const zone = Xian.zoneAt(p.x,p.y,state);
    if (zone.name !== lastZone) {lastZone = zone.name;$('zone-name').textContent = zone.name;}
    const map=currentMap(),r=Xian.rootInfo(state),tech=Xian.techniqueInfo(state);
    const secondaryTech=state.secondaryTechnique?Xian.techniqueInfo(state,state.secondaryTechnique):null;
    $('root-chip').textContent=r.name || gradeName(r.grade);
    $('root-chip').title=`${(r.elements || []).map(e=>typeof e==='string'?elementInfo(e).name:e.name).join(' / ')}灵根 · 点击角色查看`;
    const trial=map.trial || {};
    $('map-status').textContent=map.type==='trial'?`${map.name} · ${trial.cleared?'三重试炼已成':`第 ${trial.wave || 1} / 3 重`}`:map.name;
    if(lastMapId!==map.id){lastMapId=map.id;drawMap();}
    const skill=$('slot-skill');
    const weapon=currentWeapon(),attack=$('slot-attack');
    const attackLabel=weapon.kind==='bow'?'射箭':weapon.kind==='staff'?'灵弹':'挥剑';
    attack.querySelector('.slot-name').textContent=attackLabel;
    attack.title=`${weapon.name} · 鼠标左键 · ${attackLabel} · 射程 ${weapon.range}`;
    attack.setAttribute('aria-label',attack.title);
    if(attack.dataset.weapon!==weapon.type){attack.dataset.weapon=weapon.type;attack.querySelector('svg').innerHTML=icons[weapon.type] || icons.sword;}
    $('character-button').querySelector('span').textContent=weapon.kind==='staff'?'法':weaponNames[weapon.kind] || '剑';
    $('character-button').dataset.weapon=weapon.kind;
    $('hud').querySelector('.character-name').textContent=weapon.kind==='bow'?'无名弓修':weapon.kind==='staff'?'无名法修':'无名剑修';
    skill.querySelector('.slot-name').textContent=tech.name;
    skill.title=`${tech.name} · Q · 消耗 ${tech.manaCost} 灵力 · 间隔 ${tech.cooldown} 秒`;
    if(tech.gradeName)skill.title+=` · ${tech.gradeName} · 品阶倍率 ×${Number(tech.gradeMultiplier).toFixed(2)}`;
    skill.setAttribute('aria-label',skill.title);
    skill.classList.toggle('combo-ready',Boolean(tech.comboReady));
    skill.style.setProperty('--skill-color',tech.color || elementInfo(tech.element).color);
    if(skill.dataset.tech!==tech.id){skill.dataset.tech=tech.id;skill.querySelector('svg').innerHTML=icons[(tech.baseId || tech.id)==='sword'?'skill':tech.baseId || tech.id] || icons.skill;}
    const secondary=$('slot-secondary');
    secondary.disabled=!secondaryTech||p.realm<1;
    secondary.querySelector('.slot-name').textContent=secondaryTech?.name || (p.realm<1?'筑基副法':'未装副法');
    secondary.title=secondaryTech?`${secondaryTech.name} · F · 消耗 ${secondaryTech.manaCost} 灵力 · 间隔 ${secondaryTech.cooldown} 秒`:'筑基境后，在 K 中装入另一门功法作为 F 副法。';
    secondary.setAttribute('aria-label',secondary.title);
    secondary.classList.toggle('combo-ready',Boolean(secondaryTech?.comboReady));
    secondary.style.setProperty('--skill-color',secondaryTech?.color || '#7d9679');
    if(secondary.dataset.tech!==(secondaryTech?.id || 'none')){secondary.dataset.tech=secondaryTech?.id || 'none';secondary.querySelector('svg').innerHTML=icons[secondaryTech?.baseId || secondaryTech?.id] || icons.skill;}
    for (const def of slotDefs) {
      const slot = $(`slot-${def.id}`);
      const cd = def.id === 'attack' ? p.attackCd : def.id === 'dash' ? p.dashCd : def.id === 'skill' ? p.skillCd : def.id === 'secondary' ? p.secondaryCd : 0;
      const max = def.id === 'attack' ? weapon.cooldown || .36 : def.id === 'dash' ? 1.4 : def.id === 'secondary' ? secondaryTech?.cooldown || 1 : tech.cooldown;
      slot.querySelector('.cooldown').style.transform = `scaleY(${clamp((cd || 0)/max,0,1)})`;
      slot.querySelector('.cooldown-number').textContent = cd > .2 && def.id !== 'attack' ? cd.toFixed(1) : '';
      if (def.id === 'heal') slot.querySelector('.potion-count').textContent = p.potions;
    }
    const candidates=[];
    for(const npc of map.npcs || []){const d=Math.hypot(p.x-npc.x,p.y-npc.y);if(d<105)candidates.push({distance:d,label:npc.name});}
    for(const portal of map.portals || []){const d=Math.hypot(p.x-portal.x,p.y-portal.y);if(d<105)candidates.push({distance:d,label:`渡界 · ${portal.name}`});}
    for(const site of mapSites()){const d=Math.hypot(p.x-site.x,p.y-site.y);if(d<105&&!site.claimed)candidates.push({distance:d,label:`探查 · ${site.name}`});}
    for(const node of state.nodes || []){const d=Math.hypot(p.x-node.x,p.y-node.y);if(node.ready<=0&&d<90)candidates.push({distance:d,label:node.type==='relic'?'查看古迹':`采集${resourceInfo(node.type==='herb'?'herbs':node.type==='crystal'?'stones':node.type).name}`});}
    candidates.sort((a,b)=>a.distance-b.distance);
    const hint=candidates[0]?.label || '';
    $('interact-hint').classList.toggle('hidden', !hint || Boolean(modalKind) || state.dead);
    if (hint) $('interact-hint').querySelector('span').textContent = hint;
    const expedition=typeof Xian.expeditionInfo==='function'?Xian.expeditionInfo(state):null;
    if(expedition)updateExpeditionHUD(expedition);else{expeditionMarkup='';updateActivityHUD(activity);}
  }
  function updateActivityHUD(activity) {
    const panel=$('activity-panel');panel.classList.toggle('hidden',!activity);
    if(!activity){activityMarkup='';return;}
    const maxFloors=activity.type==='tower'?activity.maxFloors || 5:0,maxWaves=activity.type==='defense'?activity.maxWaves || 3:0;
    const progress=activity.completed?'历练完成':maxFloors?`第 ${activity.floor || activity.stage || 1} / ${maxFloors} 层`:maxWaves?`第 ${activity.wave || activity.stage || 1} / ${maxWaves} 波`:activity.type==='tribulation'?`${activity.rank}重雷劫`:'宗门历练';
    const target=activity.type==='bounty'?(state.enemies || []).length:activity.target || 0;
    const completed=activity.completed?target:activity.type==='bounty'?Math.max(0,target-(activity.remainingEnemies || 0)):activity.phase==='choice'&&activity.type==='tower'?activity.floor || activity.stage:activity.progress || 0;
    const completion=target>0?clamp(completed/target*100,0,100):0;
    const progressLabel=activity.type==='tribulation'?`已存活 ${Math.floor(completed)} / ${Math.ceil(target)} 秒`:activity.type==='bounty'?`已击败 ${Math.floor(completed)} / ${target}`:activity.type==='tower'?`已通过 ${Math.floor(completed)} / ${target} 层`:`已击退 ${Math.floor(completed)} / ${target} 波`;
    const crystal=activity.crystal;
    const choices=activity.choices || [];
    const warnings=(activity.warnings || []).map(w=>typeof w==='string'?w:w.message || w.description || w.name || '雷劫将至，离开预警区域').filter(Boolean);
    const resultMarkup=activity.completed?`<p class="activity-warning">${Object.keys(activity.reward || {}).length?`奖励已收取：${esc(resourcesText(activity.reward))}`:'额外奖励已达上限，通关记录已保存。'}</p><div class="activity-time"><span>自动返回青云宗</span><strong>${Math.max(0,Math.ceil(activity.returnRemaining ?? 2))} 秒</strong></div>`:'';
    const markup=`<div class="activity-heading"><span class="eyebrow">${esc(progress)}</span><button data-engine="activity:leave" ${activity.canLeave===false?'disabled':''}>${activity.completed?'立即返回 ↗':'退出历练 ↗'}</button></div><h3>${esc(activity.name)}</h3><p>${esc(activity.objective || activity.description || '')}</p>${target>0?`<div class="activity-progress"><span>${esc(progressLabel)}</span><i style="width:${completion}%"></i></div>`:''}${!activity.completed&&Number.isFinite(activity.timeRemaining)?`<div class="activity-time">${activity.type==='defense'?'守护剩余':'历练剩余'} <strong>${Math.max(0,Math.ceil(activity.timeRemaining))} 秒</strong></div>`:''}${resultMarkup}${crystal?`<div class="activity-crystal"><span>阵心 ${Math.ceil(crystal.hp)} / ${crystal.maxHp}</span><div><i style="width:${clamp(crystal.hp/crystal.maxHp*100,0,100)}%"></i></div></div>`:''}${warnings.length?`<p class="activity-warning">${esc([...new Set(warnings)].slice(-2).join(' · '))}</p>`:''}${choices.length?`<div class="activity-blessings">${choices.map(choice=>{const id=typeof choice==='string'?choice:choice.id;return `<button data-engine="activity:blessing:${esc(id)}"><strong>${esc(choice.label || choice.name || id)}</strong><small>${esc(choice.description || '')}</small></button>`;}).join('')}</div>`:''}`;
    if(markup!==activityMarkup){activityMarkup=markup;panel.innerHTML=markup;}
  }
  function drawMap() {
    if (!state) return;
    const canvas = $('minimap'), c = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height, map=currentMap();
    const sx = w/map.width, sy = h/map.height;
    const palette={jade:['#d4d9ba','#8bb3a2','#bbcb9f'],fire:['#e1ceb0','#bb9c73','#c8bb90'],snow:['#d7e3d7','#a6c8c6','#c5d7c4'],bamboo:['#cedbc0','#88b49b','#aecb9e'],dungeon:['#d7c9ac','#aa956f','#c0b690'],ice:['#d3e0da','#a1c6c8','#bbcfc5'],town:['#dfd9bf','#a1b59b','#d1c9a9'],harbor:['#c9dcd7','#85aaa9','#b6caba'],crypt:['#d5c4a3','#a29170','#c3b491'],sky:['#dde3d5','#a7c4be','#cbd7c5']}[map.theme] || ['#d4d9ba','#8bb3a2','#bbcb9f'];
    c.clearRect(0,0,w,h);c.fillStyle=palette[0];c.fillRect(0,0,w,h);
    if(map.id==='main'){c.fillStyle = '#bfcea2';c.fillRect(1600*sx,0,1600*sx,1300*sy);c.fillStyle = '#b0c6a1';c.fillRect(2250*sx,0,950*sx,h);}
    c.fillStyle=palette[2];c.beginPath();c.arc(map.hub.x*sx,map.hub.y*sy,map.hub.radius*sx,0,Math.PI*2);c.fill();
    c.strokeStyle='#647e4130';c.lineWidth=1;
    for(let x=0;x<3200;x+=400){c.beginPath();c.moveTo(x*sx,0);c.lineTo(x*sx,h);c.stroke();}
    for(let y=0;y<2400;y+=400){c.beginPath();c.moveTo(0,y*sy);c.lineTo(w,y*sy);c.stroke();}
    c.fillStyle=palette[1];for(const pond of map.ponds || []){c.beginPath();c.ellipse(pond.x*sx,pond.y*sy,pond.rx*sx,pond.ry*sy,0,0,Math.PI*2);c.fill();}
    c.fillStyle='#6b816546';for(const rock of map.obstacles || []){c.beginPath();c.arc(rock.x*sx,rock.y*sy,rock.radius*sx,0,Math.PI*2);c.fill();}
    c.strokeStyle='#59795980';c.lineWidth=2;for(const road of map.roads || []){c.beginPath();road.forEach((point,i)=>{const x=Array.isArray(point)?point[0]:point.x,y=Array.isArray(point)?point[1]:point.y;i?c.lineTo(x*sx,y*sy):c.moveTo(x*sx,y*sy);});c.stroke();}c.lineWidth=1;
    c.fillStyle='#a48442';c.save();c.translate(map.hub.x*sx,map.hub.y*sy);c.rotate(Math.PI/4);c.fillRect(-3,-3,6,6);c.restore();
    for(const npc of map.npcs || []){const info=catalog().NPC_CHARACTERS?.[npc.id] || catalog().WORLD_NPCS?.[npc.id];if(info){c.beginPath();c.arc(npc.x*sx,npc.y*sy,1.9,0,Math.PI*2);c.fillStyle=info.color || '#edd2a1';c.fill();}}
    for(const portal of map.portals || []){c.strokeStyle='#426f54';c.beginPath();c.arc(portal.x*sx,portal.y*sy,3,0,Math.PI*2);c.stroke();}
    for(const site of mapSites()){if(site.claimed)continue;c.save();c.translate(site.x*sx,site.y*sy);c.rotate(Math.PI/4);c.strokeStyle=site.unlocked===false?'#81917c':'#ddc481';c.strokeRect(-2,-2,4,4);c.restore();}
    for(const enemy of state.enemies || []){if(enemy.hp<=0||enemy.active===false||enemy.dormant)continue;c.beginPath();c.arc(enemy.x*sx,enemy.y*sy,enemy.boss?3.3:1.2,0,Math.PI*2);c.fillStyle=enemy.boss?(enemy.gated?'#a09975':'#a95d45'):'#b4785e88';c.fill();}
    c.strokeStyle='#36664f55';c.strokeRect(state.player.x*sx-17,state.player.y*sy-12,34,24);
    c.beginPath();c.arc(state.player.x*sx,state.player.y*sy,3,0,Math.PI*2);c.fillStyle='#285d46';c.shadowColor='#f8efcf';c.shadowBlur=8;c.fill();c.shadowBlur=0;
    c.fillStyle='#5b7555';c.font='8px serif';c.fillText('营地',map.hub.x*sx-12,map.hub.y*sy+14);
    if(map.id==='main'){c.fillText('落霞',1110*sx,1580*sy-8);c.fillText('青竹',1810*sx,350*sy);c.fillText('天门',2700*sx,1250*sy);}
  }
  function drawDestinationPreview(canvas,map) {
    const c=canvas.getContext('2d'),sx=canvas.width/map.width,sy=canvas.height/map.height;
    const colors={jade:['#d2d9b9','#83ac97'],fire:['#deceb0','#b49c73'],snow:['#d6e2d5','#9cbebd'],bamboo:['#cad9b9','#7da889'],dungeon:['#d4c6a7','#a18e69'],ice:['#d0dfd5','#93b9b8'],town:['#dfd9bf','#a1b59b'],harbor:['#c9dcd7','#85aaa9'],crypt:['#d5c4a3','#a29170'],sky:['#dde3d5','#a7c4be']}[map.theme] || ['#d2d9b9','#83ac97'];
    c.fillStyle=colors[0];c.fillRect(0,0,canvas.width,canvas.height);
    c.fillStyle='#a9bd9270';c.beginPath();c.arc(map.hub.x*sx,map.hub.y*sy,map.hub.radius*sx,0,Math.PI*2);c.fill();
    c.fillStyle=colors[1];for(const p of map.ponds){c.beginPath();c.ellipse(p.x*sx,p.y*sy,p.rx*sx,p.ry*sy,0,0,Math.PI*2);c.fill();}
    c.fillStyle='#667e5c55';for(const o of map.obstacles){c.beginPath();c.arc(o.x*sx,o.y*sy,o.radius*sx,0,Math.PI*2);c.fill();}
    c.strokeStyle='#7089638c';c.lineWidth=3;for(const road of map.roads || []){c.beginPath();road.forEach(([x,y],i)=>i?c.lineTo(x*sx,y*sy):c.moveTo(x*sx,y*sy));c.stroke();}
    c.font='11px serif';c.textAlign='center';c.fillStyle='#526b4b';c.fillText(mapCategory(map).safeName,map.hub.x*sx,map.hub.y*sy+18);
    c.fillStyle='#a48542';c.fillRect(map.hub.x*sx-3,map.hub.y*sy-3,6,6);
    for(const portal of map.portals){c.strokeStyle='#3c7355';c.lineWidth=2;c.beginPath();c.arc(portal.x*sx,portal.y*sy,5,0,Math.PI*2);c.stroke();c.fillStyle='#4d7453';c.fillText(portal.name,portal.x*sx,portal.y*sy-12);}
    for(const npc of map.npcs || []){const info=catalog().NPC_CHARACTERS?.[npc.id] || catalog().WORLD_NPCS?.[npc.id];if(info){c.fillStyle=info.color || '#eddfb4';c.fillRect(npc.x*sx-2,npc.y*sy-2,4,4);}}
    for(const site of entries('EXPLORATION_SITES').filter(site=>site.mapId===map.id)){const info=typeof Xian.siteInfo==='function'?Xian.siteInfo(state,site.id):site;if(info.claimed)continue;c.save();c.translate(site.x*sx,site.y*sy);c.rotate(Math.PI/4);c.strokeStyle=info.unlocked===false?'#99a48b':'#efce85';c.strokeRect(-3,-3,6,6);c.restore();}
    if(map.id===state.mapId){for(const e of state.enemies){if(e.hp<=0||e.dormant)continue;c.beginPath();c.arc(e.x*sx,e.y*sy,e.boss?4:2,0,Math.PI*2);c.fillStyle=e.boss?'#a25842':'#b4795d88';c.fill();}c.fillStyle='#316348';c.beginPath();c.arc(state.player.x*sx,state.player.y*sy,4,0,Math.PI*2);c.fill();}
  }
  function input() {
    const mx = (keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
    const my = (keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
    let aim;
    if (pointer.moved) aim = renderer.screenToWorld(pointer.x,pointer.y);
    else aim = {x:state.player.x+120,y:state.player.y};
    const current = {mx,my,aimX:aim.x,aimY:aim.y,attack:mouseAttack||Boolean(pending.attack),dash:Boolean(pending.dash),skill:Boolean(pending.skill),secondary:Boolean(pending.secondary),interact:Boolean(pending.interact)};
    pending = {};
    return current;
  }
  function loop(now) {
    const dt = Math.min(.05,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
    if(state){
      const alchemyRunning=modalKind==='alchemy'&&!state.dead&&typeof Xian.alchemyInfo==='function'&&Xian.isSafe(state)&&(typeof Xian.brewingInfo==='function'||Xian.alchemyInfo(state).near);
      const forgeRunning=modalKind==='forge'&&!state.dead&&typeof Xian.forgingInfo==='function'&&Xian.isSafe(state);
      const retreatRunning=modalKind==='cultivate'&&cultivationTab==='retreat'&&!state.dead&&typeof Xian.retreatInfo==='function'&&Xian.retreatInfo(state).active&&Xian.isSafe(state);
      const emptyInput=alchemyRunning||forgeRunning||retreatRunning;
      const active = (!modalKind || emptyInput) && !document.hidden;
      if(active){
        const beforeHp=state.player.hp,beforeAttack=state.player.attackCd,beforeDash=state.player.dashCd,beforeSkill=state.player.skillCd,beforeSecondary=state.player.secondaryCd || 0,beforeActivity=state.activity,beforeActivityPhase=beforeActivity?.phase;
        Xian.step(state,emptyInput?{}:input(),dt);
        if(state.activity?.phase==='complete'&&beforeActivityPhase!=='complete'){save();sound.fx('success');}
        if(beforeActivity&&!state.activity){pointer.moved=false;mapSelection=state.mapId;lastZone='';mapArrival();updateHUD();save();}
        if(state.player.hp<beforeHp-.1)sound.fx('hurt');
        if(state.player.attackCd>beforeAttack+.1)sound.fx('attack');
        if(state.player.dashCd>beforeDash+.1)sound.fx('dash');
        if(state.player.skillCd>beforeSkill+.1)sound.fx('skill');
        if((state.player.secondaryCd || 0)>beforeSecondary+.1)sound.fx('skill');
        if(state.interaction?.startsWith('worldlife:'))worldNpcPanel(state.interaction.slice(10));
        else if(state.interaction==='journey')routeStationPanel();
        else if(state.interaction?.startsWith('site:'))explorationPanel(state.interaction.slice(5));
        else if(state.interaction && (npcNames[state.interaction] || catalog().NPC_CHARACTERS?.[state.interaction] || state.interaction.startsWith('portal:')))npcPanel(state.interaction);
        saveTimer+=dt;
        if(saveTimer>=10){saveTimer=0;save();}
      }
      renderer.draw(state,active?dt:0);
      hudTimer+=dt;mapTimer+=dt;
      if(hudTimer>=.08){hudTimer=0;updateHUD();}
      if(['alchemy','forge'].includes(modalKind)&&typeof Xian.brewingInfo==='function')updateWorkbenches();
      else if(modalKind==='alchemy')updateAlchemyProgress();
      if(modalKind==='cultivate')updateRetreatProgress();
      if(mapTimer>=.18){mapTimer=0;drawMap();}
      const logs=Array.isArray(state.logs)?state.logs:[];
      if(logs.length && logs.join('\n')!==seenLogs.join('\n')){
        const fresh=logs.filter(log=>!seenLogs.includes(log));fresh.slice(-2).forEach(log=>notify(log));seenLogs=logs.slice();
      }
      if(state.dead&&!previouslyDead){previouslyDead=true;save();deathPanel();}
      if(state.won&&!previouslyWon){previouslyWon=true;save();sound.fx('success');victoryPanel();}
    }
    requestAnimationFrame(loop);
  }
  function bindUI() {
    $('action-bar').innerHTML=slotDefs.map(def=>`<button id="slot-${def.id}" class="action-slot" title="${def.desc}" aria-label="${def.desc}"><span class="slot-key">${def.key}</span>${svg(def.icon)}<span class="cooldown"></span><span class="cooldown-number"></span><span class="slot-name">${def.name}</span>${def.id==='heal'?'<span class="potion-count"></span>':''}</button>`).join('');
    for(const def of slotDefs)$(`slot-${def.id}`).addEventListener('click',()=>{if(!state||modalKind||state.dead)return;if(def.id==='heal')execute('heal');else pending[def.id]=true;});
    $('new-button').addEventListener('click',newJourney);
    $('continue-button').addEventListener('click',()=>{refreshSaved();if(savedData)start(savedData);});
    $('title-import-button').addEventListener('click',pickImport);
    $('title-help-button').addEventListener('click',helpPanel);
    $('import-file').addEventListener('change',event=>importSave(event.target.files[0]));
    $('character-button').addEventListener('click',()=>cultivatePanel());
    $('cultivation-button').addEventListener('click',()=>cultivatePanel());
    $('sect-button').addEventListener('click',sectPanel);
    $('bag-button').addEventListener('click',bagPanel);
    $('map-button').addEventListener('click',()=>mapPanel(true));
    $('technique-button').addEventListener('click',()=>{selectedTechnique=state.activeTechnique;techniquesPanel();});
    $('story-button').addEventListener('click',()=>storyPanel());
    $('help-button').addEventListener('click',helpPanel);
    $('pause-button').addEventListener('click',pausePanel);
    $('sound-button').addEventListener('click',sound.toggle);
    $('activity-panel').addEventListener('click',event=>{const action=event.target.closest('[data-engine]');if(action&&!action.disabled)execute(action.dataset.engine);else if(event.target.closest('[data-ui="route-choice"]'))routeStationPanel();});
    $('modal').addEventListener('change',event=>{const select=event.target.closest('[data-trait-choice]');if(select){const scroll=$('modal').querySelector('.panel-body')?.scrollTop || 0;selectedTraitTraining[select.dataset.traitChoice]=select.value;sectPanel();$('modal').querySelector('.panel-body').scrollTop=scroll;}});
    $('modal').addEventListener('click',event=>{
      const journalButton=event.target.closest('[data-journal-tab]');if(journalButton){journalTab=journalButton.dataset.journalTab;panelMessage='';storyPanel();return;}
      const questMap=event.target.closest('[data-quest-map]');if(questMap){questMapFilter=questMap.dataset.questMap;selectedWorldQuest='';worldQuestPanel();return;}
      const worldQuest=event.target.closest('[data-world-quest]');if(worldQuest){selectedWorldQuest=worldQuest.dataset.worldQuest;worldQuestPanel();return;}
      const worldMap=event.target.closest('[data-world-map]');if(worldMap){mapSelection=worldMap.dataset.worldMap;mapPanel();return;}
      const worldPerson=event.target.closest('[data-open-world-npc]');if(worldPerson){worldNpcPanel(worldPerson.dataset.openWorldNpc);return;}
      const track=event.target.closest('[data-track-world-quest]');if(track&&!track.disabled){trackedWorldQuest=trackedWorldQuest===track.dataset.trackWorldQuest?'':track.dataset.trackWorldQuest;try{localStorage.setItem(TRACK_KEY,trackedWorldQuest);}catch(_){}const kind=modalKind;if(kind.startsWith('worldnpc:'))worldNpcPanel(kind.slice(9));else worldQuestPanel();updateHUD();return;}
      const talent=event.target.closest('[data-talent]');if(talent){selectedTalent=talent.dataset.talent;talentPanel();return;}
      const techniqueTabButton=event.target.closest('[data-technique-tab]');if(techniqueTabButton){techniqueTab=techniqueTabButton.dataset.techniqueTab;panelMessage='';techniquesPanel();return;}
      const mindsetSlot=event.target.closest('[data-mindset-slot]');if(mindsetSlot&&!event.target.closest('[data-engine]')){selectedMindsetSlot=Number(mindsetSlot.dataset.mindsetSlot);techniquesPanel();return;}
      const openArts=event.target.closest('[data-open-arts]');if(openArts){techniqueTab='arts';selectedTechnique=openArts.dataset.openArts;techniquesPanel();return;}
      const relationshipTab=event.target.closest('[data-npc-tab]');if(relationshipTab){npcTab=relationshipTab.dataset.npcTab;panelMessage='';characterPanel(relationshipTab.dataset.npcId);return;}
      const routeButton=event.target.closest('[data-route]');if(routeButton){selectedRoute=routeButton.dataset.route;panelMessage='';sectPanel();return;}
      const orderRecipe=event.target.closest('[data-order-recipe]');if(orderRecipe){selectedOrder=orderRecipe.dataset.orderRecipe;panelMessage='';sectPanel();return;}
      const quantityButton=event.target.closest('[data-order-quantity]');if(quantityButton&&!quantityButton.disabled){orderQuantity+=Number(quantityButton.dataset.orderQuantity);sectPanel();return;}
      const workRecipe=event.target.closest('[data-work-recipe]');if(workRecipe&&!workRecipe.disabled){if(workRecipe.dataset.workKind==='forge')selectedForgeRecipe=workRecipe.dataset.workRecipe;else selectedAlchemyRecipe=workRecipe.dataset.workRecipe;panelMessage='';workshopPanel(workRecipe.dataset.workKind);return;}
      const workChoice=event.target.closest('[data-work-choice]');if(workChoice&&!workChoice.disabled){if(workChoice.dataset.workKind==='forge')selectedForgePattern=workChoice.dataset.workChoice;else selectedBrewCatalyst=workChoice.dataset.workChoice;panelMessage='';workshopPanel(workChoice.dataset.workKind);return;}
      const cultivationButton=event.target.closest('[data-cultivation-tab]');if(cultivationButton){cultivationTab=cultivationButton.dataset.cultivationTab;panelMessage='';cultivatePanel();return;}
      const daoButton=event.target.closest('[data-dao-node]');if(daoButton){selectedDao=daoButton.dataset.daoNode;panelMessage='';daoPanel();return;}
      const alchemyButton=event.target.closest('[data-alchemy-recipe]');if(alchemyButton){selectedAlchemyRecipe=alchemyButton.dataset.alchemyRecipe;panelMessage='';alchemyPanel();return;}
      const directionButton=event.target.closest('[data-direction]');if(directionButton){selectedTechnique=entries('TECHNIQUES').find(t=>(t.direction || t.baseId || t.id.split('_')[0])===directionButton.dataset.direction)?.id || 'sword';panelMessage='';techniquesPanel();return;}
      const sectTabButton=event.target.closest('[data-sect-tab]');if(sectTabButton){sectTab=sectTabButton.dataset.sectTab;panelMessage='';sectPanel();return;}
      const facilityButton=event.target.closest('[data-facility]');if(facilityButton){sectTab='facilities';selectedFacility=facilityButton.dataset.facility;panelMessage='';sectPanel();return;}
      const masterButton=event.target.closest('[data-master]');if(masterButton){masterPanel(masterButton.dataset.master);return;}
      const mapButton=event.target.closest('[data-map]');if(mapButton){mapSelection=mapButton.dataset.map;panelMessage='';mapPanel();return;}
      const techButton=event.target.closest('[data-tech]');if(techButton){selectedTechnique=techButton.dataset.tech;panelMessage='';techniquesPanel();return;}
      const bagButton=event.target.closest('[data-bag]');if(bagButton){bagTab=bagButton.dataset.bag;panelMessage='';bagPanel();return;}
      const engineButton=event.target.closest('[data-engine]');if(engineButton){execute(engineButton.dataset.engine);return;}
      const ui=event.target.closest('[data-ui]')?.dataset.ui;
      const actions={close:closeModal,cancel:closeModal,bag:bagPanel,cultivate:()=>cultivatePanel(),realm:()=>{cultivationTab='realm';cultivatePanel();},sect:sectPanel,routes:()=>{sectTab='routes';sectPanel();},'sect-map':()=>{mapSelection='sect';mapPanel();},root:()=>rootPanel(),map:()=>mapPanel(true),techniques:techniquesPanel,story:()=>storyPanel(),help:helpPanel,save:()=>{save(true);panelMessage='仙途已保存。';const e=$('panel-message');if(e)e.textContent=panelMessage;},export:exportSave,import:pickImport,home};
      if(actions[ui]){sound.fx('click');actions[ui]();}
    });
    $('modal-backdrop').addEventListener('click',event=>{if(event.target===$('modal-backdrop')&&!['death'].includes(modalKind))closeModal();});
    document.addEventListener('keydown',event=>{
      const key=event.key.toLowerCase();
      if(modalKind){
        if((key==='enter'||key===' ')&&event.target.matches('[data-mindset-slot]')){event.preventDefault();selectedMindsetSlot=Number(event.target.dataset.mindsetSlot);techniquesPanel();return;}
        if(key==='escape'&&modalKind!=='death'){event.preventDefault();if(['alchemy','forge'].includes(modalKind)||modalKind==='cultivate'&&typeof Xian.retreatInfo==='function'&&Xian.retreatInfo(state).active)pausePanel();else closeModal();}
        else if(state&&modalKind!=='death'&&!event.target.closest('input,textarea,select')){
          if(key==='m'){event.preventDefault();modalKind==='map'?closeModal():mapPanel(true);}
          if(key==='k'){event.preventDefault();modalKind==='techniques'?closeModal():techniquesPanel();}
          if(key==='j'){event.preventDefault();['story','storyteller'].includes(modalKind)?closeModal():storyPanel();}
          if(key==='b'){event.preventDefault();modalKind==='bag'?closeModal():bagPanel();}
          if(key==='l'){event.preventDefault();modalKind==='cultivate'?closeModal():cultivatePanel();}
          if(key==='n'){event.preventDefault();modalKind==='sect'?closeModal():sectPanel();}
        }
        if(key==='tab'){
          const nodes=[...$('modal').querySelectorAll('button:not(:disabled),input,a[href],[data-mindset-slot]')];
          const first=nodes[0],last=nodes[nodes.length-1];
          if(!first){event.preventDefault();return;}
          if(event.shiftKey&&(document.activeElement===first||document.activeElement===$('modal'))){event.preventDefault();last.focus();}
          else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===$('modal'))){event.preventDefault();first.focus();}
        }
        return;
      }
      if(!state||event.target.closest('input,textarea,select'))return;
      if([' ','arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','q','f','e','r','b','m','k','j','l','n','escape'].includes(key))event.preventDefault();
      if(event.repeat)return;
      if(key==='escape'){pausePanel();return;}
      if(key==='b'){bagPanel();return;}
      if(key==='m'){mapPanel(true);return;}
      if(key==='k'){selectedTechnique=state.activeTechnique;techniquesPanel();return;}
      if(key==='j'){storyPanel();return;}
      if(key==='l'){cultivatePanel();return;}
      if(key==='n'){sectPanel();return;}
      if(state.dead)return;
      keys.add(key);
      if(key===' ')pending.dash=true;
      if(key==='q')pending.skill=true;
      if(key==='f')pending.secondary=true;
      if(key==='e')pending.interact=true;
      if(key==='r')execute('heal');
    });
    document.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
    $('world').addEventListener('pointerdown',event=>{if(event.button===0&&state&&!modalKind&&!state.dead){mouseAttack=true;pointer={x:event.clientX,y:event.clientY,moved:true};event.preventDefault();sound.ensure();}});
    document.addEventListener('pointerup',()=>{mouseAttack=false;});
    $('world').addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY,moved:true};});
    $('world').addEventListener('contextmenu',event=>event.preventDefault());
    window.addEventListener('blur',()=>{clearInput();if(state&&!modalKind)pausePanel();});
    document.addEventListener('visibilitychange',()=>{clearInput();if(document.hidden)save();lastFrame=performance.now();});
    window.addEventListener('pagehide',()=>save());
    window.addEventListener('resize',()=>{renderer.resize();drawMap();});
  }
  try {
    if(!window.Xian||!window.XianRenderer)throw new Error('核心资源未能载入');
    renderer=new XianRenderer($('world'));
    renderer.resize();bindUI();refreshSaved();sound.updateButton();
    requestAnimationFrame(loop);
  } catch(error) {
    const box=$('boot-error');box.classList.remove('hidden');
    box.textContent=`游戏资源载入失败：${error.message}。请刷新页面，或确认网络连接后重试。`;
    console.error(error);
  }
})();
