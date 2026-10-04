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
  let sectTab = 'missions';
  let selectedFacility = 'garden';
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
  const mapSites = () => typeof Xian.activityInfo==='function'&&Xian.activityInfo(state)?[]:entries('EXPLORATION_SITES').filter(site=>site.mapId===state?.mapId).map(site=>({...site,...(typeof Xian.siteInfo==='function'?Xian.siteInfo(state,site.id):{}),unlocked:state.player.realm>=(site.realmRequired || 0)}));
  const gradeName = id => (catalog().ROOT_GRADES || {})[id]?.name || id;
  const elementInfo = id => (catalog().ELEMENTS || {})[id] || {name:id,color:'#dcc18b'};
  const itemInfo = id => (catalog().ITEMS || {})[id] || {id,name:id,description:''};
  const resourceInfo = id => (catalog().RESOURCES || {})[id] || {id,name:id};
  const resourcesText = value => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(entry => typeof entry === 'string' ? entry : `${itemInfo(entry.id || entry.item).name} × ${entry.count || entry.amount || 1}`).join(' · ');
    return Object.entries(value).filter(([,n]) => typeof n === 'number' && n > 0).map(([id,n]) => `${id==='xp'?'修为':id==='contribution'?'宗门贡献':resourceInfo(id).name === id ? itemInfo(id).name : resourceInfo(id).name} ${n}`).join(' · ');
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
    $('modal').classList.toggle('wide-modal', kind.startsWith('npc:') || ['map','techniques','bag','story','master','storyteller','merchant','alchemy','forge','cultivate','sect'].includes(kind));
    $('modal').innerHTML = `<header class="modal-header"><div><span class="eyebrow">${esc(eyebrow)}</span><h2 id="modal-title">${esc(title)}</h2></div>${closeable ? '<button class="modal-close" data-ui="close" aria-label="关闭面板">×</button>' : ''}</header>${content}`;
    $('modal-backdrop').classList.remove('hidden');
    if(kind.startsWith('npc:')){
      const info=Xian.npcInfo(state,kind.slice(4)),commission=info.commission;
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
    if(['story','storyteller'].includes(kind)){
      const relations=Xian.storyInfo(state).relations || {}, row=document.createElement('div');row.className='story-relations';
      row.textContent=`仁心 ${relations.mercy || 0}　求道 ${relations.wisdom || 0}　锋芒 ${relations.valor || 0}　·　抉择与委托须在安全驿站中完成`;
      $('modal').querySelector('.story-chapter').appendChild(row);
    }
    $('modal').focus();
    $('modal').scrollTop=0;
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
    showModal('help','初入山海','THE PATH OF THE IMMORTAL',`<p class="lede">亲手走过山海。移动、瞄准、闪避、武器与道术，组成你的战斗之道。</p><div class="keys-table"><div><kbd>W A S D / ↑↓←→</kbd>移动</div><div><kbd>鼠标左键</kbd>剑、弓或法杖普通攻击</div><div><kbd>Q</kbd>施放主法</div><div><kbd>F</kbd>筑基后施放副法</div><div><kbd>Space</kbd>踏风步 · 短暂闪避</div><div><kbd>E</kbd>人物 / 采集 / 古迹交互</div><div><kbd>R</kbd>服用回春丹</div><div><kbd>L</kbd>修行 / 境界突破</div><div><kbd>N</kbd>宗门事务 / 历练 / 兑换</div><div><kbd>B</kbd>行囊 / 使用 / 装备</div><div><kbd>M</kbd>世界舆图 / 安全渡界</div><div><kbd>K</kbd>功法传承 / 重数 / 主副法</div><div><kbd>J</kbd>故事抉择 / 委托 / 手记</div><div><kbd>Esc</kbd>暂停 / 关闭面板</div></div><h3>修行与突破</h3><p>从青云观出发，在山野斩妖、采集与探索，积攒修为和灵材。按 L 查看全部 ${realmCatalog().length} 个境界、当前突破条件与下一境的内容。条件满足后，在安全营地的独立修行界面突破；头像与暂停菜单也能进入。突破会开启更强的历练与传承。</p><h3>器物与道法</h3><p>剑近身挥斩，弓远程射箭，法杖释放灵弹。按 B 装备，普攻随武器改变；按 K 查看当前武器的射程、攻击间隔与功法相契倍率。筑基后可装入 F 副法，主副法各自计时，六秒内五行相生会增强道术并返还灵力。功法可搭配各类武器，相契武器能增强道术效果，换武器后仍可施放已选择的功法。</p><p>每门功法的黄、玄、地、天、仙品阶固定，更高品阶是另一门独立法门，须另行取得经卷并参悟。功法重数可修习提升，消耗实际灵材。灵根与装备的属性相契也会增强功法。购买或炼成的丹药、典籍和装备须在行囊中亲手使用。</p><h3>山门与历练</h3><p>从安全营地打开 M 前往宗门山门，按 N 拜入门下、参加历练并用贡献兑换器物。筑基后可建设药园、铸兵阁与藏经阁，调整五行方位、招募并派驻同门；产出最多存三批，须主动领取。宗门历练按境界逐步开启：清剿悬赏、守护阵心、五层试炼塔与渡劫。塔层间可选择祝福；历练中通过左侧进度查看目标、剩余时间与阵心气血，也可以随时退出回宗门。</p><h3>人物与山野机缘</h3><p>靠近山海人物按 E。初谈立场与赠礼只能选择一次，之后可继续请教、接取委托，或支付灵材使用人物服务。凌云真人讲山门与巡山，顾清玄讲功法与器物，守卷人负责山海故事。人物对话随你的修为和历练推进。</p><p>山野中有古迹、灵藏与采集机缘。靠近按 E 查看条件与奖励，探索所得存入行囊。不同地图与洞天有独有妖兽、灵材和试炼奖励；按 J 查看尚未完成的因缘与旅途手记。</p><p class="modal-note">小地图金色菱形是营地，红色标记是守关者，菱形探索标记代表山野机缘。面板打开时游戏暂停。浏览器自动保存仙途，导出存档可备份或在另一台电脑继续。</p><div class="modal-actions">${button(state?'继续游历':'我已知晓','close','main')}</div>`);
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
    showModal('map','山海舆图','MOUNTAINS · SECTS · HIDDEN REALMS',`<div class="atlas-layout"><section class="atlas"><div class="atlas-decoration" aria-hidden="true"><span>北冥</span><span>山海</span><span>赤霄</span></div><div class="atlas-nodes">${maps.map(map => {const info=mapDetails(map.id);return `<button class="atlas-node ${map.id === mapSelection ? 'selected' : ''} ${map.id === state.mapId ? 'current' : ''} ${info.unlocked ? '' : 'locked'}" data-map="${esc(map.id)}" style="--map-color:${map.theme === 'fire' || map.theme === 'dungeon' ? '#d29068' : map.theme === 'snow' || map.theme === 'ice' ? '#a7cbe3' : '#9ac6a6'}"><span class="atlas-symbol">${map.type === 'trial' ? '◇' : '✦'}</span><strong>${esc(map.name)}</strong><small>${map.id === state.mapId ? '当前所在' : info.unlocked ? info.visited ? '曾经抵达' : '未曾踏足' : `${realmNames[map.realmRequired || 0]}境开启`}</small></button>`;}).join('')}</div><div class="atlas-key">✦ 山川原野　◇ 洞天试炼　<span>当前：${esc(current.name)}</span></div></section><aside class="destination-card"><span class="eyebrow">${m.type === 'trial' ? '洞天 · 三重试炼' : '山川 · 自由探索'}</span><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p><div class="destination-meta"><span>入境要求</span><strong>${realmNames[m.realmRequired || 0]}境</strong><span>踏足状态</span><strong>${m.visited ? '已抵达' : '未抵达'}</strong>${m.type === 'trial' ? `<span>试炼进度</span><strong>${trial.cleared ? '已通关' : `第 ${trial.wave || 1} / 3 重`}</strong><span>通关次数</span><strong>${trial.clears || 0}</strong>` : ''}</div><p class="modal-note">${!m.unlocked ? `此地封印尚未解除，需要${realmNames[m.realmRequired || 0]}境。` : !safe ? activity ? '当前正在宗门历练中。先通过左侧历练界面退出，返回宗门后再渡界。' : '请返回当前地图的安全营地，或亲自走到传送门，按 E 渡界。' : m.id === state.mapId ? '你正身处此界。沿地图中的道路游历，寻找灵材与守关者。' : '当前位于安全营地，可以通过山海渡口前往此界。'}</p><div class="modal-actions">${m.id !== state.mapId ? `<button class="modal-button main" data-engine="travel:${esc(m.id)}" ${!m.unlocked || !safe ? 'disabled' : ''}>${m.unlocked ? '启程前往' : '境界未至'}</button>` : button('继续探索','close','main')}</div></aside></div>${panelFeedback()}<div class="shortcut-footer">M · 山海舆图　ESC · 关闭</div>`);
  }
  function techniquesPanel() {
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
    showModal('techniques','山海道法','SEVEN PATHS · DISTINCT ARTS',`<p class="compact-lede">${all.length} 门道法，各有固定品阶与独立传承。选择修炼方向，再查看具体法门。重数代表熟练；主法装入 Q，筑基后可装入另一门副法 F。</p><div class="directions-row" role="tablist" aria-label="修炼方向">${baseIds.filter(id=>all.some(t=>directionOf(t)===id)).map(id=>{const t=all.find(t=>directionOf(t)===id),e=elementInfo(t.element),known=all.filter(t=>directionOf(t)===id&&Xian.techniqueInfo(state,t.id).known).length,total=all.filter(t=>directionOf(t)===id).length;return `<button role="tab" aria-selected="${direction===id}" class="${direction===id?'selected':''}" data-direction="${id}" style="--element:${esc(e.color)}"><strong>${esc(catalog().TECHNIQUE_DIRECTIONS?.[id]?.name || labels[id])}</strong><small>${known} / ${total} 已习得</small></button>`;}).join('')}</div><div class="techniques-layout"><div class="technique-list">${group.map(t=>{const info=Xian.techniqueInfo(state,t.id);return `<button class="technique-choice ${selectedTechnique===t.id?'selected':''}" data-tech="${esc(t.id)}" style="--element:${esc(el.color)}"><span class="technique-sigil" style="color:${esc(info.gradeColor || '#d8c690')};border-color:${esc(info.gradeColor || '#d8c690')}">${esc((info.gradeName || '黄阶').slice(0,1))}</span><div><strong>${esc(t.name)}</strong><small>${info.known?`${info.level} / ${info.maxLevel || 3} 重`:'尚未习得'}${state.activeTechnique===t.id?' · 当前 Q':state.secondaryTechnique===t.id?' · 当前 F':''}</small><span class="technique-grade-badge" style="--grade-color:${esc(info.gradeColor || '#d8c690')}">${esc(info.gradeName || '黄阶')} · 固定品阶</span></div></button>`;}).join('')}</div><section class="technique-detail" style="--element:${esc(el.color)}"><span class="eyebrow">${esc(el.name)}系 · ${esc(selected.gradeName || '黄阶')} · ${selected.known?`${selected.level} 重`:'尚未习得'}</span><h3>${esc(selected.name)}</h3><p>${esc(selected.description)}</p><div class="fixed-grade-note"><span>此法品阶固定</span><strong style="color:${esc(selected.gradeColor || '#d8c690')}">${esc(selected.gradeName || '黄阶')}</strong><small>其他品阶是另一门法门，须各自取得传承并参悟。</small></div><div class="stat-grid">${statsCard('灵力消耗',selected.manaCost)}${statsCard('施法间隔',Number(selected.cooldown).toFixed(1),'秒')}${statsCard('道术倍率',`×${Number(selected.multiplier || 1).toFixed(2)}`)}</div><div class="weapon-compatibility"><div><span>当前武器 · ${esc(weaponNames[weapon.kind] || weapon.kind)}</span><strong>${esc(weapon.name)}</strong></div><p>${esc(weapon.description || '')}</p><div class="weapon-values"><span>普攻射程 ${weapon.range}</span><span>攻击间隔 ${Number(weapon.cooldown).toFixed(2)} 秒</span></div><p class="weapon-match ${selected.weaponCompatible?'matched':''}">${selected.weaponCompatible?'武器相契':'相契武器'} · ${esc(weaponNames[selected.preferredWeapon] || selected.preferredWeapon || '剑')} · 道术倍率 ×${Number(selected.weaponBonus || 1).toFixed(2)}<br>可使用其他武器施放，相契武器增强效果。属性相契增益 +${Math.round((selected.affinity || 0)*100)}%。</p></div><section class="technique-inheritance"><h3>传承与参悟</h3><p>${esc(source)}</p>${book?`<p>持有${esc(book.name)} ${bookCount} 本${selected.learnRealm?` · ${esc(realmName(selected.learnRealm))}境可参悟`:''}</p>`:''}${selected.learnRequirements?.length?`<div class="story-requirements">${selected.learnRequirements.map(req=>`<span>${esc(typeof req==='string'?req:req.label || req.description)}</span>`).join('')}</div>`:''}${acquire&&!selected.known?`<p class="inheritance-cost">换卷所需：${esc(resourcesText(selected.acquireCost))}</p><button class="modal-button ${selected.canAcquire?'main':'subtle'}" data-engine="acquire:${esc(selected.id)}" ${selected.canAcquire?'':'disabled'}>向宗门换取经卷</button>${selected.acquireReason?`<p class="promotion-reason">${esc(selected.acquireReason)}</p>`:''}`:''}${!selected.known?`<div class="modal-actions"><button class="modal-button main" data-engine="learn:${esc(selected.id)}" ${canLearn?'':'disabled'}>参悟此法</button></div>${selected.learnReason?`<p class="promotion-reason">${esc(selected.learnReason)}</p>`:''}`:`<h3>功法重数</h3><p>${selected.level>=3?'此法已修至三重。':`修习下一重：${esc(resourcesText(selected.trainCost))} · ${esc(realmName(selected.trainRealm || 0))}境可修。`}</p>${selected.level<3?actionButton('修习下一重',`train:${selected.id}`,'subtle'):''}`}</section><section class="secondary-technique"><div class="secondary-heading"><h3>主法 Q · 副法 F</h3><span>${currentSecondary?`副法：${esc(currentSecondary.name)}`:'副法尚未装入'}</span></div><div class="combo-detail ${selected.comboReady?'ready':''}"><span>${comboElement?`${esc(comboElement)} → ${esc(el.name)} · 五行相生`:'此法的连携'}</span><strong>${selected.comboElement?`${selected.comboReady?'连携已就绪':'六秒内相生'} · ×${selected.comboReady?Number(selected.comboMultiplier || 1.25).toFixed(2):'1.25'}`:'不参与五行相生'}</strong><small>${selected.comboElement?'先施放前一属性，再施放此法，可增强效果并返还 6 灵力。':'此法独立施放，主副法冷却仍各自计时。'}</small></div><div class="modal-actions"><button class="modal-button ${canQ?'main':'subtle'}" data-engine="technique:${esc(selected.id)}" ${canQ?'':'disabled'}>${state.activeTechnique===selected.id?'当前主法 Q':'装入 Q'}</button><button class="modal-button ${canF?'main':'subtle'}" data-engine="secondary:${esc(selected.id)}" ${canF?'':'disabled'}>${state.secondaryTechnique===selected.id?'当前副法 F':'装入 F'}</button>${state.secondaryTechnique?'<button class="modal-button subtle" data-engine="secondary:none">卸下副法</button>':''}</div>${state.player.realm<1?'<p class="promotion-reason">筑基境开启 F 副法，主副法需选不同的法门。</p>':!selected.known?'<p class="promotion-reason">先参悟此法，再装入主法或副法。</p>':''}</section><div class="modal-actions">${button('查看灵根','root','subtle')}</div></section></div>${panelFeedback()}<div class="shortcut-footer">K · 道法　Q · 主法　F · 副法　ESC · 关闭</div>`);
  }
  function characterPortrait(id,info) {
    const colors={elder:'#b5b294',disciple:'#7ebbb3',herbalist:'#9fbc7c',hunter:'#b89b70',broker:'#bc999e',fireArtisan:'#d69a76',snowHealer:'#a6cddc',trialKeeper:'#a5c0a0'};
    const color=info.color || colors[id] || '#abc1aa';
    const hat=id==='hunter'?'<path d="M47 50 76 29 107 50 96 56H58Z" fill="#b3a06e"/>':id==='broker'?'<path d="M59 41h36v-12H64Z" fill="#35483c"/>':id==='elder'?'<path d="M73 69 86 69 83 86 73 88Z" fill="#d8d7b9"/>':'<path d="M77 35v-9m-8 5h17" fill="none" stroke="#d7d4a9" stroke-width="3"/>';
    const accessory=id==='herbalist'?'<path d="M39 123v-34m0 20c-12 0-14-13-10-16 9 0 14 10 10 16Zm0-9c12-1 14-13 10-17-10 0-13 10-10 17Z" fill="#90b580"/>':id==='fireArtisan'?'<path d="m115 87-11 4 3 15 13-5Zm-5 14-6 28" fill="#bfa481"/>':id==='snowHealer'?'<path d="M117 89v36m-15-26 30 17m-30 0 30-17" fill="none" stroke="#b6e3ee" stroke-width="2"/>':id==='hunter'?'<path d="M111 69v67m0-67q30 34 0 67m0-67 14 34-14 33" fill="none" stroke="#aeb58c" stroke-width="2"/>':id==='broker'?'<path d="m112 90 16 6-5 22-16-6Z" fill="#cdb487"/><path d="m114 97 10 5m-11 2 9 5" stroke="#637457"/>':'<path d="M113 66v77m-6-69 6-11 7 11" fill="none" stroke="#d3bd80" stroke-width="3"/>';
    return `<svg viewBox="0 0 160 175" role="img" aria-label="${esc(info.name)}人物立绘"><defs><linearGradient id="npc-back" x2="0" y2="1"><stop stop-color="#31513e"/><stop offset="1" stop-color="#102c20"/></linearGradient></defs><rect x="5" y="5" width="150" height="165" fill="url(#npc-back)" stroke="${esc(color)}" stroke-opacity=".25"/><circle cx="103" cy="49" r="27" fill="${esc(color)}" opacity=".1"/><path d="M5 137 35 107l26 30 30-37 39 35 25-26v61H5Z" fill="#5c795c" opacity=".18"/><ellipse cx="79" cy="151" rx="37" ry="8" fill="#092016" opacity=".5"/><path d="m66 71 27 1 15 69-13 11H61l-11-12Z" fill="${esc(color)}"/><path d="m66 72 13 22 15-22M79 94v51m-20-33 36-1" fill="none" stroke="#e3dcc0" stroke-opacity=".6" stroke-width="2"/><path d="m65 76-17 45 14 5 11-35m23-15 17 43-13 6-12-34" fill="${esc(color)}" stroke="#213e2b" stroke-width="1"/><path d="m69 147-4 11h13v-13m8 0v13h13l-6-11" fill="#254336"/><circle cx="79" cy="57" r="15" fill="#c7b99b"/><path d="M63 59c-5-22 31-28 33-1l-7-13-17-1Z" fill="#294130"/><path d="m70 62 5 0m9 0h5" stroke="#3d5342" stroke-width="1.5"/>${hat}${accessory}</svg>`;
  }
  function characterPanel(id) {
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
    const s=Xian.stats(state),p=state.player,terminal=finalRealm();
    const info=typeof Xian.cultivationInfo==='function'?Xian.cultivationInfo(state):{realmIndex:p.realm,realmName:s.realmName,nextRealmName:realmName(p.realm+1),xp:p.xp,xpNeeded:s.xpNeeded,requirements:[],ready:false,reason:'先积累修为与历练，再回安全营地修行。',unlocks:[]};
    const requirements=info.requirements || [],unlocks=info.unlocks || [];
    const nextRealm=realmCatalog()[p.realm+1],weapon=currentWeapon();
    showModal('cultivate','修行与突破','THE IMMORTAL PATH',`<p class="lede">${esc(info.realmName)}之境。历练凝为修为，突破开启下一段仙途。</p><div class="realm-path">${realmCatalog().map((r,i)=>`<div class="realm-step ${i===p.realm?'current':i<p.realm?'complete':''}"><span>${esc(r.realmName || r.name)}</span><small>${i<p.realm?'已突破':i===p.realm?'当前境界':'尚未到达'}</small></div>`).join('')}</div>${rootMarkup()}<div class="cultivation-layout"><section class="breakthrough-card"><span class="eyebrow">${terminal?'仙途圆满':'下一境界'}</span><h3>${terminal?esc(info.realmName):esc(info.nextRealmName)}</h3><div class="cultivation-progress"><div class="progress-caption"><span>修为积累</span><span>${Math.floor(info.xp)}${terminal?'':` / ${info.xpNeeded}`}</span></div><div class="track"><i style="width:${terminal?100:clamp(info.xp/info.xpNeeded*100,0,100)}%"></i></div></div>${terminal?'<p class="modal-note">这一程的境界已修至圆满。仍可历练洞天、磨炼武器与道术，完成宗门事务。</p>':`<div class="breakthrough-requirements">${requirements.map(req=>`<div class="requirement-row ${req.met?'met':''}"><span>${req.met?'✓':'◇'}</span><div><strong>${esc(req.label)}</strong>${Number.isFinite(req.current)&&Number.isFinite(req.target)?`<small>${Math.min(req.current,req.target)} / ${req.target}</small>`:''}</div><small>${req.met?'已满足':'尚待历练'}</small></div>`).join('')}</div>${info.cost&&Object.keys(info.cost).length?`<p class="breakthrough-cost">突破消耗：${esc(resourcesText(info.cost))}</p>`:''}<button class="modal-button main breakthrough-button" data-engine="breakthrough" ${info.ready?'':'disabled'}>突破至${esc(info.nextRealmName)}</button>${info.reason?`<p class="promotion-reason">${esc(info.reason)}</p>`:''}`}</section><section class="realm-unlocks"><span class="eyebrow">${terminal?'当前修为':'突破所得'}</span><h3>${terminal?'道途已成':'新的力量与机缘'}</h3>${nextRealm?`<div class="realm-gains"><span>气血基础 ${realmCatalog()[p.realm]?.maxHp || 0} → ${nextRealm.maxHp}</span><span>灵力基础 ${realmCatalog()[p.realm]?.maxMp || 0} → ${nextRealm.maxMp}</span><span>攻击基础 ${realmCatalog()[p.realm]?.attack || 0} → ${nextRealm.attack}</span></div>`:''}${unlocks.length?`<div class="unlock-list">${unlocks.map(unlock=>`<article><strong>${esc(unlock.name)}</strong><p>${esc(unlock.description)}</p></article>`).join('')}</div>`:'<p class="empty-state">继续探索山海，完成尚未写尽的因缘。</p>'}</section></div><div class="stat-grid cultivation-stats">${statsCard('气血上限',s.maxHp)}${statsCard('灵力上限',s.maxMp)}${statsCard('攻击威力',Math.round(s.attack))}${statsCard('当前武器',weapon.name)}${statsCard('武器淬炼',p.weapon,'重')}${statsCard('灵石',p.stones)}</div><div class="modal-actions">${actionButton('打坐调息','meditate','subtle')}${button('继续游历','close','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">L · 修行与突破　ESC · 关闭</div>`);
  }
  function bagPanel() {
    if (state.dead) return deathPanel();
    const inventory=[...entries('RESOURCES').map(r=>({...itemInfo(r.id),count:state.player[r.id] || 0})),...Xian.inventoryInfo(state).filter(item=>item.type!=='resource')];
    const types={resources:'resource',consumables:'consumable',equipment:'equipment',books:'book'};
    const filtered=inventory.filter(item=>item.type===types[bagTab]);
    const slots={weapon:'武器',robe:'法衣',charm:'灵饰'};
    showModal('bag','行囊','GATHER · CRAFT · EQUIP',`<div class="equipment-strip">${Object.entries(slots).map(([slot,name])=>`<div><small>${name}</small><strong>${esc(state.equipment[slot]?itemInfo(state.equipment[slot]).name:'未装备')}</strong></div>`).join('')}</div><div class="panel-tabs" role="tablist" aria-label="行囊分类">${Object.entries({resources:'灵材',consumables:'丹药与符箓',equipment:'装备',books:'功法典籍'}).map(([id,label])=>`<button role="tab" aria-selected="${bagTab===id}" class="${bagTab===id?'selected':''}" data-bag="${id}">${label} <small>${inventory.filter(i=>i.type===types[id]).length}</small></button>`).join('')}</div><div class="bag-grid">${filtered.length?filtered.map(inventoryCard).join(''):'<p class="empty-state">此处尚空。探索山野、采集灵材，或拜访云游商人，充实行囊。</p>'}</div><div class="bag-summary"><span>攻击威力 ${Xian.stats(state).attack} · 武器淬炼 ${state.player.weapon} 重</span>${button('功法修习','techniques','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">B · 行囊　R · 服用回春丹　ESC · 关闭</div>`);
  }
  function craftingPanel(kind = 'alchemy') {
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
    if(sectTab==='facilities')body=sectFacilitiesMarkup(info,atSect);
    else if(sectTab==='disciples')body=sectDisciplesMarkup(info,atSect);
    else body=`<div class="sect-mission-grid">${missions.map(m=>{const enabled=joined&&atSect&&m.unlocked;return `<article class="sect-mission ${m.unlocked?'':'locked'}"><span class="eyebrow">${esc(realmName(m.realmRequired || 0))}境历练</span><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p><div class="mission-reward"><span>本次完成</span><strong>${esc(resourcesText(m.reward || m.firstReward)) || '本次无资源奖励'}</strong>${m.id==='tribulation'?`<span>雷劫难度</span><strong>${m.rank || 1} 重雷劫</strong>`:''}</div><button class="modal-button ${enabled?'main':'subtle'}" data-engine="sect:mission:${esc(m.id)}" ${enabled?'':'disabled'}>开始历练</button>${!enabled?`<p class="promotion-reason">${esc(!joined?'先拜入宗门。':activity?'先完成或退出当前历练。':!m.unlocked?m.reason || `需达到${realmName(m.realmRequired || 0)}境。`:!atSect?'返回宗门安全区域，方可开始历练。':'暂不可用。')}</p>`:''}</article>`;}).join('')}</div><h3>贡献兑换</h3><div class="sect-supplies">${supplies.map(s=>`<article><div><strong>${esc(s.name)}</strong><p>所得：${esc(resourcesText(s.reward))}</p><span>${esc(resourcesText(s.cost))}</span>${!s.available?`<small>${esc(s.reason || '当前尚不能兑换。')}</small>`:''}</div><button class="modal-button ${s.available?'main':'subtle'}" data-engine="sect:exchange:${esc(s.id)}" ${s.available?'':'disabled'}>兑换</button></article>`).join('')}</div>`;
    showModal('sect','宗门事务','THE SECT · DUTY AND LEGACY',`<div class="sect-banner"><div><span class="eyebrow">${esc(catalog().MAPS?.sect?.name || '宗门山门')}</span><h3>${joined?'同道共问长生':'山门待君入'}</h3><p>${joined?'历练积累贡献，建设设施、安排弟子与五行方位，让山门随你的仙途成长。':'亲自到山门拜入宗门，领取入门器物与传承，开启贡献与历练。'}</p></div><div class="sect-rank"><span>${esc(info.rankName || (typeof info.rank==='object'?info.rank.name:joined?'记名弟子':'未入门'))}</span><strong>${info.contribution || 0}</strong><small>可用贡献 · 累计 ${info.totalContribution || 0}</small></div></div>${!joined?`<div class="sect-join"><p>${atSect?'你已来到宗门山门，可以拜入门下。':'拜入宗门须亲自前往山门。打开 M，可从安全营地渡界。'}</p><button class="modal-button main" data-engine="sect:join" ${atSect?'':'disabled'}>拜入宗门</button>${!atSect?button('前往宗门山门','sect-map','subtle'):''}</div>`:''}<div class="panel-tabs" role="tablist" aria-label="宗门事务分类">${Object.entries({missions:'宗门历练',facilities:'山门建设',disciples:'弟子分工'}).map(([id,label])=>`<button role="tab" aria-selected="${sectTab===id}" class="${sectTab===id?'selected':''}" data-sect-tab="${id}">${label}</button>`).join('')}</div>${!atSect&&joined?'<p class="modal-note">此处可查看山门进展。返回宗门安全区域后，才能办理建设、派驻、招募与领取。</p>':''}${body}<div class="modal-actions">${!atSect?button('查看宗门山门','sect-map','subtle'):''}${button('查看行囊','bag','subtle')}${button('继续游历','close','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">N · 宗门事务　ESC · 关闭</div>`);
  }
  function sectFacilitiesMarkup(info,atSect) {
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
  function sectDisciplesMarkup(info,atSect) {
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
    const scrollTop=$('modal').scrollTop;
    Xian.action(state,id);
    const result = state.lastAction;
    panelMessage = result?.message || (Array.isArray(state.logs) ? state.logs[state.logs.length-1] : '') || '';
    sound.fx(result?.ok === false ? 'fail' : 'success');
    if (id.startsWith('travel:') && result?.ok) {
      closeModal();pointer.moved=false;mapSelection=state.mapId;lastZone='';
      mapArrival();notify(`已抵达${currentMap().name}。`);
    }
    else if ((id.startsWith('sect:mission:') || id === 'activity:leave') && result?.ok) {
      closeModal();pointer.moved=false;lastZone='';mapArrival();notify(result.message || (id==='activity:leave'?'已返回宗门。':'历练已经开始。'));
    }
    else if (id === 'revive' && !state.dead) {previouslyDead = false;closeModal();notify('已回到青云观。气血与灵力恢复，仙途仍在。');}
    else if (kind === 'bag') bagPanel();
    else if (kind === 'map') mapPanel();
    else if (kind === 'techniques') techniquesPanel();
    else if (kind.startsWith('npc:')) characterPanel(kind.slice(4));
    else if (kind === 'master') masterPanel();
    else if (kind === 'sect') sectPanel();
    else if (['story','storyteller'].includes(kind)) storyPanel(kind);
    else if (kind === 'merchant') vendorPanel();
    else if (kind === 'cultivate') cultivatePanel(kind);
    else if (['forge','alchemy','shrine','cultivation'].includes(kind)) npcPanel(kind);
    else if (kind.startsWith('portal:')) portalPanel(kind.slice(7));
    else if (kind.startsWith('site:')) explorationPanel(kind.slice(5));
    if(modalKind)$('modal').scrollTop=scrollTop;
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
    $('objective').textContent = activity?.completed || activity?.failed ? Xian.objective(state) : activity?.objective || Xian.objective(state);
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
    updateActivityHUD(activity);
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
    const palette={jade:['#325446','#7da69a','#65826b'],fire:['#754b3e','#d07e48','#af8265'],snow:['#839dad','#bee0eb','#a5bdc3'],bamboo:['#346651','#679e9b','#81aa80'],dungeon:['#513c33','#c87142','#997456'],ice:['#597e9d','#90cae7','#9cbdca']}[map.theme] || ['#325446','#7da69a','#65826b'];
    c.clearRect(0,0,w,h);c.fillStyle=palette[0];c.fillRect(0,0,w,h);
    if(map.id==='main'){c.fillStyle = '#244c41';c.fillRect(1600*sx,0,1600*sx,1300*sy);c.fillStyle = '#405b4a';c.fillRect(2250*sx,0,950*sx,h);}
    c.fillStyle=palette[2];c.beginPath();c.arc(map.hub.x*sx,map.hub.y*sy,map.hub.radius*sx,0,Math.PI*2);c.fill();
    c.strokeStyle='#dac99628';c.lineWidth=1;
    for(let x=0;x<3200;x+=400){c.beginPath();c.moveTo(x*sx,0);c.lineTo(x*sx,h);c.stroke();}
    for(let y=0;y<2400;y+=400){c.beginPath();c.moveTo(0,y*sy);c.lineTo(w,y*sy);c.stroke();}
    c.fillStyle=palette[1];for(const pond of map.ponds || []){c.beginPath();c.ellipse(pond.x*sx,pond.y*sy,pond.rx*sx,pond.ry*sy,0,0,Math.PI*2);c.fill();}
    c.fillStyle='#141e2566';for(const rock of map.obstacles || []){c.beginPath();c.arc(rock.x*sx,rock.y*sy,rock.radius*sx,0,Math.PI*2);c.fill();}
    c.strokeStyle='#e9d8b655';c.lineWidth=2;for(const road of map.roads || []){c.beginPath();road.forEach((point,i)=>{const x=Array.isArray(point)?point[0]:point.x,y=Array.isArray(point)?point[1]:point.y;i?c.lineTo(x*sx,y*sy):c.moveTo(x*sx,y*sy);});c.stroke();}c.lineWidth=1;
    c.fillStyle='#e6cc8e';c.save();c.translate(map.hub.x*sx,map.hub.y*sy);c.rotate(Math.PI/4);c.fillRect(-3,-3,6,6);c.restore();
    for(const npc of map.npcs || [])if(catalog().NPC_CHARACTERS?.[npc.id]){c.beginPath();c.arc(npc.x*sx,npc.y*sy,1.9,0,Math.PI*2);c.fillStyle=catalog().NPC_CHARACTERS[npc.id].color || '#edd2a1';c.fill();}
    for(const portal of map.portals || []){c.strokeStyle='#c8f1dc';c.beginPath();c.arc(portal.x*sx,portal.y*sy,3,0,Math.PI*2);c.stroke();}
    for(const site of mapSites()){if(site.claimed)continue;c.save();c.translate(site.x*sx,site.y*sy);c.rotate(Math.PI/4);c.strokeStyle=site.unlocked===false?'#81917c':'#ddc481';c.strokeRect(-2,-2,4,4);c.restore();}
    for(const enemy of state.enemies || []){if(enemy.hp<=0||enemy.active===false||enemy.dormant)continue;c.beginPath();c.arc(enemy.x*sx,enemy.y*sy,enemy.boss?3.3:1.2,0,Math.PI*2);c.fillStyle=enemy.boss?(enemy.gated?'#bbab8e':'#e6a278'):'#d29b7688';c.fill();}
    c.strokeStyle='#e8e5bc55';c.strokeRect(state.player.x*sx-17,state.player.y*sy-12,34,24);
    c.beginPath();c.arc(state.player.x*sx,state.player.y*sy,3,0,Math.PI*2);c.fillStyle='#f4efc1';c.shadowColor='#f1ecba';c.shadowBlur=8;c.fill();c.shadowBlur=0;
    c.fillStyle='#f0edd0cc';c.font='9px serif';c.fillText('营地',map.hub.x*sx-12,map.hub.y*sy+14);
    if(map.id==='main'){c.fillText('落霞',1110*sx,1580*sy-8);c.fillText('青竹',1810*sx,350*sy);c.fillText('天门',2700*sx,1250*sy);}
  }
  function drawDestinationPreview(canvas,map) {
    const c=canvas.getContext('2d'),sx=canvas.width/map.width,sy=canvas.height/map.height;
    const colors={jade:['#4e7055','#8abcb0'],fire:['#805340','#db9161'],snow:['#8eacb6','#c9e9ef'],bamboo:['#3d7355','#a4cb9c'],dungeon:['#654435','#d7804f'],ice:['#688eae','#bde7f6']}[map.theme] || ['#4e7055','#8abcb0'];
    c.fillStyle=colors[0];c.fillRect(0,0,canvas.width,canvas.height);
    c.fillStyle='#bccfae22';c.beginPath();c.arc(map.hub.x*sx,map.hub.y*sy,map.hub.radius*sx,0,Math.PI*2);c.fill();
    c.fillStyle=colors[1];for(const p of map.ponds){c.beginPath();c.ellipse(p.x*sx,p.y*sy,p.rx*sx,p.ry*sy,0,0,Math.PI*2);c.fill();}
    c.fillStyle='#11292078';for(const o of map.obstacles){c.beginPath();c.arc(o.x*sx,o.y*sy,o.radius*sx,0,Math.PI*2);c.fill();}
    c.strokeStyle='#dfd4a766';c.lineWidth=3;for(const road of map.roads || []){c.beginPath();road.forEach(([x,y],i)=>i?c.lineTo(x*sx,y*sy):c.moveTo(x*sx,y*sy));c.stroke();}
    c.font='11px serif';c.textAlign='center';c.fillStyle='#eee4bd';c.fillText('安全营地',map.hub.x*sx,map.hub.y*sy+18);
    c.fillStyle='#e5d294';c.fillRect(map.hub.x*sx-3,map.hub.y*sy-3,6,6);
    for(const portal of map.portals){c.strokeStyle='#defbdd';c.lineWidth=2;c.beginPath();c.arc(portal.x*sx,portal.y*sy,5,0,Math.PI*2);c.stroke();c.fillStyle='#f6ecc2';c.fillText(portal.name,portal.x*sx,portal.y*sy-12);}
    for(const npc of map.npcs || [])if(catalog().NPC_CHARACTERS?.[npc.id]){c.fillStyle=catalog().NPC_CHARACTERS[npc.id].color || '#eddfb4';c.fillRect(npc.x*sx-2,npc.y*sy-2,4,4);}
    for(const site of entries('EXPLORATION_SITES').filter(site=>site.mapId===map.id)){const info=typeof Xian.siteInfo==='function'?Xian.siteInfo(state,site.id):site;if(info.claimed)continue;c.save();c.translate(site.x*sx,site.y*sy);c.rotate(Math.PI/4);c.strokeStyle=info.unlocked===false?'#99a48b':'#efce85';c.strokeRect(-3,-3,6,6);c.restore();}
    if(map.id===state.mapId){for(const e of state.enemies){if(e.hp<=0||e.dormant)continue;c.beginPath();c.arc(e.x*sx,e.y*sy,e.boss?4:2,0,Math.PI*2);c.fillStyle=e.boss?'#f1b681':'#e9c28a77';c.fill();}c.fillStyle='#f7f3ce';c.beginPath();c.arc(state.player.x*sx,state.player.y*sy,4,0,Math.PI*2);c.fill();}
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
      const active = !modalKind && !document.hidden;
      if(active){
        const beforeHp=state.player.hp,beforeAttack=state.player.attackCd,beforeDash=state.player.dashCd,beforeSkill=state.player.skillCd,beforeSecondary=state.player.secondaryCd || 0,beforeActivity=state.activity,beforeActivityPhase=beforeActivity?.phase;
        Xian.step(state,input(),dt);
        if(state.activity?.phase==='complete'&&beforeActivityPhase!=='complete'){save();sound.fx('success');}
        if(beforeActivity&&!state.activity){pointer.moved=false;mapSelection=state.mapId;lastZone='';mapArrival();updateHUD();save();}
        if(state.player.hp<beforeHp-.1)sound.fx('hurt');
        if(state.player.attackCd>beforeAttack+.1)sound.fx('attack');
        if(state.player.dashCd>beforeDash+.1)sound.fx('dash');
        if(state.player.skillCd>beforeSkill+.1)sound.fx('skill');
        if((state.player.secondaryCd || 0)>beforeSecondary+.1)sound.fx('skill');
        if(state.interaction?.startsWith('site:'))explorationPanel(state.interaction.slice(5));
        else if(state.interaction && (npcNames[state.interaction] || catalog().NPC_CHARACTERS?.[state.interaction] || state.interaction.startsWith('portal:')))npcPanel(state.interaction);
        saveTimer+=dt;
        if(saveTimer>=10){saveTimer=0;save();}
      }
      renderer.draw(state,active?dt:0);
      hudTimer+=dt;mapTimer+=dt;
      if(hudTimer>=.08){hudTimer=0;updateHUD();}
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
    $('activity-panel').addEventListener('click',event=>{const action=event.target.closest('[data-engine]');if(action&&!action.disabled)execute(action.dataset.engine);});
    $('modal').addEventListener('click',event=>{
      const directionButton=event.target.closest('[data-direction]');if(directionButton){selectedTechnique=entries('TECHNIQUES').find(t=>(t.direction || t.baseId || t.id.split('_')[0])===directionButton.dataset.direction)?.id || 'sword';panelMessage='';techniquesPanel();return;}
      const sectTabButton=event.target.closest('[data-sect-tab]');if(sectTabButton){sectTab=sectTabButton.dataset.sectTab;panelMessage='';sectPanel();return;}
      const facilityButton=event.target.closest('[data-facility]');if(facilityButton){sectTab='facilities';selectedFacility=facilityButton.dataset.facility;panelMessage='';sectPanel();return;}
      const masterButton=event.target.closest('[data-master]');if(masterButton){masterPanel(masterButton.dataset.master);return;}
      const mapButton=event.target.closest('[data-map]');if(mapButton){mapSelection=mapButton.dataset.map;panelMessage='';mapPanel();return;}
      const techButton=event.target.closest('[data-tech]');if(techButton){selectedTechnique=techButton.dataset.tech;panelMessage='';techniquesPanel();return;}
      const bagButton=event.target.closest('[data-bag]');if(bagButton){bagTab=bagButton.dataset.bag;panelMessage='';bagPanel();return;}
      const engineButton=event.target.closest('[data-engine]');if(engineButton){execute(engineButton.dataset.engine);return;}
      const ui=event.target.closest('[data-ui]')?.dataset.ui;
      const actions={close:closeModal,cancel:closeModal,bag:bagPanel,cultivate:()=>cultivatePanel(),sect:sectPanel,'sect-map':()=>{mapSelection='sect';mapPanel();},root:()=>rootPanel(),map:()=>mapPanel(true),techniques:techniquesPanel,story:()=>storyPanel(),help:helpPanel,save:()=>{save(true);panelMessage='仙途已保存。';const e=$('panel-message');if(e)e.textContent=panelMessage;},export:exportSave,import:pickImport,home};
      if(actions[ui]){sound.fx('click');actions[ui]();}
    });
    $('modal-backdrop').addEventListener('click',event=>{if(event.target===$('modal-backdrop')&&!['death'].includes(modalKind))closeModal();});
    document.addEventListener('keydown',event=>{
      const key=event.key.toLowerCase();
      if(modalKind){
        if(key==='escape'&&modalKind!=='death'){event.preventDefault();closeModal();}
        else if(state&&modalKind!=='death'&&!event.target.closest('input,textarea,select')){
          if(key==='m'){event.preventDefault();modalKind==='map'?closeModal():mapPanel(true);}
          if(key==='k'){event.preventDefault();modalKind==='techniques'?closeModal():techniquesPanel();}
          if(key==='j'){event.preventDefault();['story','storyteller'].includes(modalKind)?closeModal():storyPanel();}
          if(key==='b'){event.preventDefault();modalKind==='bag'?closeModal():bagPanel();}
          if(key==='l'){event.preventDefault();modalKind==='cultivate'?closeModal():cultivatePanel();}
          if(key==='n'){event.preventDefault();modalKind==='sect'?closeModal():sectPanel();}
        }
        if(key==='tab'){
          const nodes=[...$('modal').querySelectorAll('button:not(:disabled),input,a[href]')];
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
