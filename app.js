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
  const catalog = () => Xian.CONTENT || window.XianContent || {};
  const entries = key => Object.values(catalog()[key] || {});
  const mapDetails = id => {
    const meta=Xian.mapInfo(id);
    return {...meta,unlocked:Boolean(state&&state.player.realm >= (meta.realmRequired || 0)),visited:Boolean(state?.progress?.visited?.includes(id)),trial:state?.trials?.[id] || null};
  };
  const currentMap = () => mapDetails(state?.mapId || 'main');
  const gradeName = id => (catalog().ROOT_GRADES || {})[id]?.name || id;
  const elementInfo = id => (catalog().ELEMENTS || {})[id] || {name:id,color:'#dcc18b'};
  const itemInfo = id => (catalog().ITEMS || {})[id] || {id,name:id,description:''};
  const resourceInfo = id => (catalog().RESOURCES || {})[id] || {id,name:id};
  const resourcesText = value => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(entry => typeof entry === 'string' ? entry : `${itemInfo(entry.id || entry.item).name} × ${entry.count || entry.amount || 1}`).join(' · ');
    return Object.entries(value).filter(([,n]) => typeof n === 'number' && n > 0).map(([id,n]) => `${id==='xp'?'修为':resourceInfo(id).name === id ? itemInfo(id).name : resourceInfo(id).name} ${n}`).join(' · ');
  };
  const keys = new Set();
  const npcNames = {master:'凌云真人',forge:'铸剑台',alchemy:'灵药炉',shrine:'归元祠',waygate:'山海渡口',merchant:'云游商人',storyteller:'守卷人'};
  const npcPoints = {master:[440,1680],forge:[670,1800],alchemy:[380,1900],shrine:[580,1970]};
  const slotDefs = [
    {id:'attack',name:'剑诀',key:'鼠标',icon:'sword',desc:'剑诀 · 鼠标左键，近身挥剑'},
    {id:'skill',name:'御剑',key:'Q',icon:'skill',desc:'御剑诀 · Q，消耗灵力释放远程攻击'},
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
    if (kind === 'cultivate') content = content.replace('</p>', `</p>${rootMarkup()}`);
    $('modal').classList.toggle('wide-modal', ['map','techniques','bag','story','master','storyteller','merchant','alchemy','forge'].includes(kind));
    $('modal').innerHTML = `<header class="modal-header"><div><span class="eyebrow">${esc(eyebrow)}</span><h2 id="modal-title">${esc(title)}</h2></div>${closeable ? '<button class="modal-close" data-ui="close" aria-label="关闭面板">×</button>' : ''}</header>${content}`;
    $('modal-backdrop').classList.remove('hidden');
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
    if(['story','master','storyteller'].includes(kind)){
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
    showModal('pause', '山静，剑亦静', 'JOURNEY AT REST', `<p class="lede">暂歇片刻。山海会等你归来。</p><div class="modal-actions">${button('继续游历','close','main')}${button('修为与境界','cultivate')}${button('山海舆图','map')}${button('六道功法','techniques')}${button('见闻与任务','story')}${button('行囊','bag')}${button('游玩指引','help')}</div><h3>仙途存档</h3><p>进度每 10 秒自动保存。导出备份可在另一台电脑上继续旅程。旧版存档会保留已有修为并迁移到山海新篇。</p><div class="modal-actions">${button('立即保存','save')}${button('导出存档','export','subtle')}${button('导入存档','import','subtle')}${button('返回首页','home','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">ESC · 继续游戏</div>`);
  }
  function helpPanel() {
    showModal('help','初入山海','THE WAY OF THE SWORD',`<p class="lede">这是一段可以亲手走过的仙途。移动、瞄准与闪避，都是你自己的选择。</p><div class="keys-table"><div><kbd>W A S D / ↑↓←→</kbd>移动</div><div><kbd>鼠标左键</kbd>瞄准并挥剑</div><div><kbd>Q</kbd>御剑诀 · 消耗灵力</div><div><kbd>Space</kbd>踏风步 · 短暂闪避</div><div><kbd>E</kbd>采集 / 道院交互</div><div><kbd>R</kbd>服用回春丹</div><div><kbd>B</kbd>行囊 / 使用装备</div><div><kbd>M</kbd>世界舆图 / 安全渡界</div><div><kbd>K</kbd>学习 / 修习 / 装入 Q</div><div><kbd>J</kbd>故事抉择 / 委托 / 手记</div><div><kbd>Esc</kbd>暂停 / 关闭面板</div></div><h3>循序渐进，问道长生</h3><p>从西南方青云观出发。在山野斩妖、采集灵草与灵晶，积攒修为和灵石。回道院炼丹、锻剑、休养；达到修为门槛后，在凌云真人处突破境界。</p><p>依次挑战苍牙狼王、千年木灵和天门守卫。更高的境界才足以解开后两位守关者的封印。观察地面上的攻击预警，用踏风步躲开。</p><h3>山海新篇</h3><p>灵根有五等品质与八种属性；功法相契会得到实际增益。从安全营地打开 M 可前往六片山海，野外可亲自走到传送门按 E。洞天包含三重试炼，首次通关有独有奖励。</p><p>拜访云游商人获取残卷，按 K 学习功法、修习重数并装入 Q。按 B 查看八类灵材、丹药、典籍与三类装备，炼制或购买后需要亲手使用与装备。按 J 与山海人物作出抉择、领取委托奖励；选择会改变你的实际所得与人缘。</p><p class="modal-note">小地图金色菱形是道院，红色标记是守关者。气血耗尽后可回道院重整旗鼓，已有的境界与斩妖进度会保留。面板打开时游戏暂停。</p><div class="modal-actions">${button(state?'我已知晓，继续游历':'我已知晓','close','main')}</div>`);
  }
  function statsCard(name, value, suffix = '') {return `<div class="stat-card"><small>${name}</small><strong>${esc(value)}${suffix ? `<em> ${esc(suffix)}</em>` : ''}</strong></div>`;}
  function rootMarkup() {
    const r = Xian.rootInfo(state), selected = (r.elements || []).map(e => typeof e === 'string' ? e : e.id);
    return `<section class="root-card"><div class="root-heading"><span class="eyebrow">天赋灵根</span><strong>${esc(r.name || gradeName(r.grade))}</strong><span>修为倍率 ×${Number(r.cultivationMultiplier || 1).toFixed(2)}</span></div><div class="element-row">${entries('ELEMENTS').map(e => `<span class="element-chip ${selected.includes(e.id) ? 'attuned' : ''}" style="--element:${esc(e.color || '#dcc18b')}" title="${esc(e.description || '')}">${esc(e.name)}</span>`).join('')}</div><p>${esc(r.description)}${r.affinityBonus ? ` · 相契功法增益 ${Math.round(r.affinityBonus*100)}%` : ''}</p></section>`;
  }
  function rootPanel(reveal = false) {
    if(state.dead)return deathPanel();
    const r = Xian.rootInfo(state);
    showModal('root', reveal ? '灵根初显' : '先天灵根', 'EIGHT VEINS · A PATH OF YOUR OWN', `<p class="lede">${reveal ? '归元祠映出你的先天灵根。天赋是起点，选择与历练才是你自己的仙途。' : '灵根影响修为成长，与相契属性的功法相辅相成。'}</p><div class="root-reveal">${esc(r.name || gradeName(r.grade))}</div>${rootMarkup()}<div class="grade-legend">${entries('ROOT_GRADES').map(g => `<span class="${g.id === r.grade ? 'selected' : ''}">${esc(g.name)}</span>`).join('')}</div><p class="modal-note">灵根随本次旅程确定，存档会保留其品质与属性。打开功法面板，选择与你灵根相契的修行之路。</p><div class="modal-actions">${button(reveal ? '执剑入山海' : '继续游历','close','main')}${button('查看六道功法','techniques','subtle')}</div>`);
  }
  function mapPanel(reset = false) {
    if(state.dead)return deathPanel();
    if(reset)mapSelection=state.mapId || 'main';
    const maps = entries('MAPS'), m = mapDetails(mapSelection);
    const current = currentMap(), safe = Xian.isSafe(state), realmNames=['炼气','筑基','金丹','元婴'];
    const trial = m.trial || {};
    showModal('map','山海舆图','SIX REALMS · BEYOND THE MOUNTAINS',`<div class="atlas-layout"><section class="atlas"><div class="atlas-decoration" aria-hidden="true"><span>北冥</span><span>山海</span><span>赤霄</span></div><div class="atlas-nodes">${maps.map(map => {const info=mapDetails(map.id);return `<button class="atlas-node ${map.id === mapSelection ? 'selected' : ''} ${map.id === state.mapId ? 'current' : ''} ${info.unlocked ? '' : 'locked'}" data-map="${esc(map.id)}" style="--map-color:${map.theme === 'fire' || map.theme === 'dungeon' ? '#d29068' : map.theme === 'snow' || map.theme === 'ice' ? '#a7cbe3' : '#9ac6a6'}"><span class="atlas-symbol">${map.type === 'trial' ? '◇' : '✦'}</span><strong>${esc(map.name)}</strong><small>${map.id === state.mapId ? '当前所在' : info.unlocked ? info.visited ? '曾经抵达' : '未曾踏足' : `${realmNames[map.realmRequired || 0]}境开启`}</small></button>`;}).join('')}</div><div class="atlas-key">✦ 山川原野　◇ 洞天试炼　<span>当前：${esc(current.name)}</span></div></section><aside class="destination-card"><span class="eyebrow">${m.type === 'trial' ? '洞天 · 三重试炼' : '山川 · 自由探索'}</span><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p><div class="destination-meta"><span>入境要求</span><strong>${realmNames[m.realmRequired || 0]}境</strong><span>踏足状态</span><strong>${m.visited ? '已抵达' : '未抵达'}</strong>${m.type === 'trial' ? `<span>试炼进度</span><strong>${trial.cleared ? '已通关' : `第 ${trial.wave || 1} / 3 重`}</strong><span>通关次数</span><strong>${trial.clears || 0}</strong>` : ''}</div><p class="modal-note">${!m.unlocked ? `此地封印尚未解除，需要${realmNames[m.realmRequired || 0]}境。` : !safe ? '请返回当前地图的安全营地，或亲自走到传送门，按 E 渡界。' : m.id === state.mapId ? '你正身处此界。沿地图中的道路游历，寻找灵材与守关者。' : '当前位于安全营地，可以通过山海渡口前往此界。'}</p><div class="modal-actions">${m.id !== state.mapId ? `<button class="modal-button main" data-engine="travel:${esc(m.id)}" ${!m.unlocked || !safe ? 'disabled' : ''}>${m.unlocked ? '启程前往' : '境界未至'}</button>` : button('继续探索','close','main')}</div></aside></div>${panelFeedback()}<div class="shortcut-footer">M · 山海舆图　ESC · 关闭</div>`);
  }
  function techniquesPanel() {
    if(state.dead)return deathPanel();
    const all=entries('TECHNIQUES');
    if(!all.some(t=>t.id===selectedTechnique))selectedTechnique=state.activeTechnique || 'sword';
    const selected=Xian.techniqueInfo(state,selectedTechnique), el=elementInfo(selected.element);
    const book=entries('ITEMS').find(i=>i.type==='book'&&i.technique===selected.id);
    const count=book?(state.inventory[book.id] || 0):0;
    showModal('techniques','六道功法','SCHOOLS OF THE IMMORTAL ART',`<p class="compact-lede">功法随灵根相契。学习后可修至三重，择一法装入 Q；各门功法带来不同的战斗变化。</p><div class="techniques-layout"><div class="technique-list">${all.map(t=>{const info=Xian.techniqueInfo(state,t.id),element=elementInfo(t.element);return `<button class="technique-choice ${selectedTechnique===t.id?'selected':''}" data-tech="${esc(t.id)}" style="--element:${esc(element.color || t.color || '#d8c18b')}"><span class="technique-sigil">${esc(element.name || t.name.slice(0,1))}</span><div><strong>${esc(t.name)}</strong><small>${info.known ? `${info.level} / 3 重` : '未习得'}${state.activeTechnique===t.id?' · 当前 Q':''}</small></div>${info.affinity>0 ? '<span class="affinity-tag">相契</span>' : ''}</button>`;}).join('')}</div><section class="technique-detail" style="--element:${esc(el.color || selected.color || '#dcc18b')}"><span class="eyebrow">${esc(el.name)}系 · ${selected.known ? `${selected.level} 重` : '尚未习得'}</span><h3>${esc(selected.name)}</h3><p>${esc(selected.description)}</p><div class="stat-grid">${statsCard('灵力消耗',selected.manaCost)}${statsCard('施法间隔',Number(selected.cooldown).toFixed(1),'秒')}${statsCard('属性契合',`+${Math.round((selected.affinity || 0)*100)}%`)}</div>${selected.known ? `<h3>修习下一重</h3><p>${selected.level>=3?'功法已修至三重，术意圆满。':`${esc(resourcesText(selected.trainCost))} · ${selected.trainRealm ? '筑基' : '炼气'}境可修。`}</p>` : `<h3>功法传承</h3><p>${book ? `${esc(book.name)} · 持有 ${count} 本。可从云游商人、山野或试炼奖励中寻找。` : '在山海历练中寻找功法传承。'}</p>`}<div class="modal-actions">${selected.known ? `<button class="modal-button main" data-engine="technique:${esc(selected.id)}" ${state.activeTechnique===selected.id?'disabled':''}>${state.activeTechnique===selected.id?'已装入 Q':'装入 Q'}</button>${selected.level<3?actionButton('修习功法',`train:${selected.id}`):''}` : `<button class="modal-button main" data-engine="learn:${esc(selected.id)}" ${count<1?'disabled':''}>参悟功法</button>`}${button('查看灵根','root','subtle')}</div></section></div>${panelFeedback()}<div class="shortcut-footer">K · 功法　Q · 施放当前功法　ESC · 关闭</div>`);
  }
  function storyPanel(kind = 'story') {
    if(state.dead)return deathPanel();
    const story=Xian.storyInfo(state), quests=Xian.questsInfo(state), journal=story.journal || [];
    const dialogue=kind==='master'||kind==='storyteller';
    showModal(kind,dialogue?(currentMap().npcs.find(n=>n.id===kind)?.name || npcNames[kind]):'山海见闻','STORIES · CHOICES · PROMISES',`<section class="story-chapter"><span class="eyebrow">${story.completed?'此卷已成':`第 ${Number(story.chapter)+1} 章`}</span><h3>${esc(story.title)}</h3><p>${esc(story.text)}</p>${story.requirements?.length?`<div class="story-requirements">${story.requirements.map(text=>`<span>${story.ready?'✓':'◇'} ${esc(text)}</span>`).join('')}</div>`:''}${story.completed?'<p class="modal-note">这一卷已写尽。你留下的选择与足迹，皆存于见闻。</p>':`<div class="story-options">${(story.options || []).map(option=>`<button class="story-option" data-engine="story:${esc(option.id)}" ${!story.ready?'disabled':''}><strong>${esc(option.label)}</strong><span>${esc(option.description)}</span></button>`).join('')}</div>${!story.ready?'<p class="modal-note">此段因缘尚待历练。完成上述条件后，可继续与道院人物交谈。</p>':''}`}</section><h3>山海委托 <span class="section-count">${quests.filter(q=>q.completed).length} / ${quests.length}</span></h3><div class="quests-list">${quests.map(q=>`<article class="quest-card ${q.completed?'completed':''}"><div><strong>${esc(q.name)}</strong><p>${esc(q.description)}</p><small>${esc(resourcesText(q.reward))}</small></div><div class="quest-action"><span>${Math.min(q.progress || 0,q.target || 0)} / ${q.target}</span><button class="modal-button ${q.ready&&!q.completed?'main':'subtle'}" data-engine="claim:${esc(q.id)}" ${q.completed||!q.ready?'disabled':''}>${q.completed?'已领取':q.ready?'领取奖励':'尚未完成'}</button></div></article>`).join('')}</div><h3>旅途手记</h3><div class="journal-list">${journal.length?journal.slice().reverse().map(entry=>`<article><span>${Math.floor((entry.time || 0)/60)} 分钟 · ${esc(entry.title || `第 ${Number(entry.chapter)+1} 章`)}</span><p>${esc(entry.text || entry)}</p></article>`).join(''):'<p class="empty-state">尚未落笔。去与凌云真人交谈，写下旅途的第一段因缘。</p>'}</div><div class="modal-actions">${button('修为与境界','cultivate','subtle')}${button('继续游历','close','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">J · 见闻与任务　ESC · 关闭</div>`);
  }
  function inventoryCard(item) {
    const source=itemInfo(item.id), type=item.type || source.type;
    const color=source.element ? elementInfo(source.element).color : '#d4c48e';
    let actions='';
    if(type==='equipment')actions=`<button class="modal-button ${item.equipped?'subtle':'main'}" data-engine="equip:${esc(item.id)}" ${item.equipped?'disabled':''}>${item.equipped?'已装备':'装备'}</button>`;
    else if(type==='book')actions=actionButton('参悟',`learn:${source.technique}`,'main');
    else if(type==='consumable' && item.usable !== false)actions=actionButton('使用',`use:${item.id}`,'main');
    return `<article class="bag-item" style="--element:${esc(color)}"><div class="bag-item-icon">${svg(type==='equipment'?(source.slot==='weapon'?'sword':'forge'):type==='book'?'skill':source.id==='herbs'?'herb':type==='resource'?'stone':'potion')}</div><div class="bag-item-copy"><div class="item-heading"><strong>${esc(item.name)}</strong><span>× ${item.count}</span></div><small>${esc(item.grade || source.grade || '')}${source.slot ? ` · ${source.slot==='weapon'?'佩剑':source.slot==='robe'?'法衣':'灵饰'}` : ''}</small><p>${esc(item.description || source.description)}</p>${source.stats?`<span class="item-stats">${esc(statBonuses(source.stats))}</span>`:''}</div>${actions?`<div class="bag-item-action">${actions}</div>`:''}</article>`;
  }
  function statBonuses(stats) {
    const names={attack:'攻击',maxHp:'气血上限',maxMp:'灵力上限',defense:'护体',speed:'移速',xpMultiplier:'修为倍率',manaRegen:'灵力回复',crit:'会心'};
    return Object.entries(stats || {}).map(([id,n])=>`${names[id] || id} ${n>=0?'+':''}${n}`).join(' · ');
  }
  function cultivatePanel(kind = 'cultivate') {
    if (state.dead) return deathPanel();
    const s = Xian.stats(state), p = state.player;
    const bosses = [['wolfKing','苍牙狼王'],['ancientTree','千年木灵'],['guardian','天门守卫']];
    const defeated = state.quests.bosses || [];
    const realmNames = ['炼气','筑基','金丹','元婴'];
    const bossGate = p.realm === 0 ? '斩杀苍牙狼王' : p.realm === 1 ? '斩杀千年木灵' : '斩杀天门守卫';
    showModal(kind, kind === 'master' ? '凌云真人' : '修为与境界', 'THE IMMORTAL PATH', `<p class="lede">${kind === 'master' ? '「剑在手中，道在足下。莫求速成，先问本心。」' : `${esc(s.realmName)}之境，一剑问长生。`}</p><div class="realm-path">${realmNames.map((name,i) => `<div class="realm-step ${i === p.realm ? 'current' : i < p.realm ? 'complete' : ''}">${name}</div>`).join('')}</div><div class="stat-grid">${statsCard('气血上限',s.maxHp)}${statsCard('灵力上限',s.maxMp)}${statsCard('剑诀威力',s.attack)}${statsCard('斩妖',state.quests.kills)}${statsCard('淬炼',p.weapon,'重')}${statsCard('灵石',p.stones)}</div><div class="cultivation-progress"><div class="progress-caption"><span>${p.realm >= 3 ? '已臻元婴' : '距下一境界'}</span><span>${p.realm >= 3 ? `修为 ${Math.floor(p.xp)}` : `修为 ${Math.floor(p.xp)} / ${s.xpNeeded}`}</span></div><div class="track"><i style="width:${(p.realm >= 3 ? 100 : clamp(p.xp/s.xpNeeded*100,0,100))}%"></i></div></div>${p.realm < 3 ? `<p class="modal-note">突破要求：修为达到 ${s.xpNeeded}，并${bossGate}。突破需在道院中完成。</p>` : '<p class="modal-note">你已踏入元婴之境。山海辽阔，仙途尚长。</p>'}<div class="boss-list">${bosses.map(([id,name]) => `<div class="boss-row"><span>${name}</span><span class="${defeated.includes(id) ? 'done' : ''}">${defeated.includes(id) ? '已破关' : '未破关'}</span></div>`).join('')}</div><div class="modal-actions">${p.realm < 3 ? actionButton('尝试突破','breakthrough','main') : ''}${actionButton('打坐调息','meditate')}${button('继续游历','close','subtle')}</div>${panelFeedback()}`);
  }
  function bagPanel() {
    if (state.dead) return deathPanel();
    const inventory=[...entries('RESOURCES').map(r=>({...itemInfo(r.id),count:state.player[r.id] || 0})),...Xian.inventoryInfo(state).filter(item=>item.type!=='resource')];
    const types={resources:'resource',consumables:'consumable',equipment:'equipment',books:'book'};
    const filtered=inventory.filter(item=>item.type===types[bagTab]);
    const slots={weapon:'佩剑',robe:'法衣',charm:'灵饰'};
    showModal('bag','行囊','GATHER · CRAFT · EQUIP',`<div class="equipment-strip">${Object.entries(slots).map(([slot,name])=>`<div><small>${name}</small><strong>${esc(state.equipment[slot]?itemInfo(state.equipment[slot]).name:'未装备')}</strong></div>`).join('')}</div><div class="panel-tabs" role="tablist" aria-label="行囊分类">${Object.entries({resources:'灵材',consumables:'丹药与符箓',equipment:'装备',books:'功法典籍'}).map(([id,label])=>`<button role="tab" aria-selected="${bagTab===id}" class="${bagTab===id?'selected':''}" data-bag="${id}">${label} <small>${inventory.filter(i=>i.type===types[id]).length}</small></button>`).join('')}</div><div class="bag-grid">${filtered.length?filtered.map(inventoryCard).join(''):'<p class="empty-state">此处尚空。探索山野、采集灵材，或拜访云游商人，充实行囊。</p>'}</div><div class="bag-summary"><span>剑诀威力 ${Xian.stats(state).attack} · 佩剑淬炼 ${state.player.weapon} 重</span>${button('查看属性','cultivate','subtle')}${button('功法修习','techniques','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">B · 行囊　R · 服用回春丹　ESC · 关闭</div>`);
  }
  function craftingPanel(kind = 'alchemy') {
    const isForge=kind==='forge', recipes=entries('RECIPES').filter(recipe=>{
      const outputs=Object.keys(recipe.output || {}).map(itemInfo);
      return outputs.some(item=>item.type===(isForge?'equipment':'consumable'));
    });
    const p=state.player;
    const legacyForge=isForge?`<div class="recipe-row"><div class="recipe-copy"><strong>佩剑淬炼 · ${p.weapon} 重</strong><p>当前威力 ${Xian.stats(state).attack}，淬炼提升 4 点威力。<br>${p.weapon>=6?'已达六重。':`下次消耗 ${40+p.weapon*35} 灵石、${1+Math.floor(p.weapon/2)} 株灵草。`}<br>当前境界上限 ${Math.min(6,2+p.realm*2)} 重。</p></div>${actionButton('淬炼佩剑','upgrade','main')}</div>`:'';
    showModal(kind,isForge?'铸剑台':'灵药炉',isForge?'FORGE · 灵材化为锋芒':'ALCHEMY · 草木炼为丹心',`<p class="compact-lede">${isForge?'灵铁、精魄与灵材可炼为不同的佩剑、法衣与灵饰；制作后到行囊装备。':'山川灵材各有所用。炼成的丹药与符箓可在行囊中使用，战斗中的回春丹仍按 R 服用。'}</p><div class="resource-wallet">${entries('RESOURCES').map(r=>`<span>${esc(r.name)} <b>${state.player[r.resourceField || r.id] || 0}</b></span>`).join('')}</div>${legacyForge}<div class="recipe-list">${recipes.map(recipe=>`<article class="recipe-row"><div class="recipe-copy"><strong>${esc(recipe.name)}</strong><p>${esc(recipe.description)}<br><span class="recipe-cost">${esc(resourcesText(recipe.cost))}</span><br>产出 ${esc(resourcesText(recipe.output))}${recipe.realmRequired ? ` · ${['炼气','筑基','金丹','元婴'][recipe.realmRequired]}境可制` : ''}</p></div><button class="modal-button main" data-engine="craft:${esc(recipe.id)}" ${p.realm < (recipe.realmRequired || 0)?'disabled':''}>${isForge?'炼制':'开炉'}</button></article>`).join('')}</div><div class="modal-actions">${button('查看行囊','bag','subtle')}${button('继续游历','close','subtle')}</div>${panelFeedback()}`);
  }
  function vendorPanel() {
    const stock=entries('ITEMS').filter(item=>Number.isFinite(item.price)&&item.price>0);
    showModal('merchant','云游商人','TRAVELING MERCHANT · 山海互通',`<p class="compact-lede">「山川有别，百物相生。你需要的机缘，也许正在我的行囊中。」</p><div class="vendor-balance">现有灵石 <strong>${state.player.stones}</strong><span>典籍可解锁功法；丹药、装备购买后存入行囊。</span></div><div class="vendor-grid">${stock.map(item=>`<article class="vendor-item"><div><span class="eyebrow">${esc(item.grade)} · ${item.type==='book'?'典籍':item.type==='equipment'?'装备':item.type==='resource'?'灵材':'消耗品'}</span><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p></div><div class="vendor-buy"><span>${item.price} 灵石</span>${actionButton('购买',`buy:${item.id}`,state.player.stones>=item.price?'main':'subtle')}</div></article>`).join('')}</div><div class="modal-actions">${button('查看行囊','bag','subtle')}${button('告辞','close','subtle')}</div>${panelFeedback()}`);
  }
  function portalPanel(target) {
    const m=mapDetails(target);
    showModal(`portal:${target}`,m.name,'THRESHOLD · 山海一线',`<p class="lede">传送门中，另一片山海正向你敞开。</p><p>${esc(m.description)}</p><p class="modal-note">${m.unlocked?`${m.type==='trial'?'踏入此地，将迎来三重试炼。':'沿途有不同的灵材、妖兽与守关者。'}渡界后从当地营地出发，可随时返回安全营地离开。`:`需达到${['炼气','筑基','金丹','元婴'][m.realmRequired]}境才可进入。`}</p><div class="modal-actions"><button class="modal-button main" data-engine="travel:${esc(target)}" ${m.unlocked?'':'disabled'}>穿过传送门</button>${button('暂不前往','close','subtle')}</div>${panelFeedback()}`);
  }
  function npcPanel(kind) {
    if (kind === 'master' || kind === 'storyteller') return storyPanel(kind);
    if (kind === 'waygate') return mapPanel(true);
    if (kind === 'merchant') return vendorPanel();
    if (kind.startsWith('portal:')) return portalPanel(kind.slice(7));
    if (kind === 'alchemy' || kind === 'forge') return craftingPanel(kind);
    const p = state.player;
    if (kind === 'alchemy') {
      showModal('alchemy','灵药炉','ALCHEMY · 炼化山川灵气',`<p class="lede">炉火不息，药香长存。灵草炼为回春丹，助你走过凶险山野。</p><div class="recipe-row"><div class="recipe-copy"><strong>炼制回春丹 × 2</strong><p>消耗 2 株灵草、8 枚灵石。<br>现有灵草 ${p.herbs} · 灵石 ${p.stones} · 回春丹 ${p.potions}</p></div>${actionButton('开炉炼丹','craft','main')}</div><p>回春丹回复 42% 气血与 25% 灵力，战斗中按 R 服用。气血和灵力都充盈时不会消耗丹药。</p><div class="modal-actions">${button('离开丹炉','close','subtle')}</div>${panelFeedback()}`);
    } else if (kind === 'forge') {
      const cost = 40 + p.weapon * 35, herbs = 1 + Math.floor(p.weapon / 2), cap = Math.min(6, 2 + p.realm * 2);
      showModal('forge','铸剑台','THE BLADE REFORGED',`<p class="lede">百炼成钢，剑随心长。将一路所得灵石，铸入你的佩剑。</p><div class="recipe-row"><div class="recipe-copy"><strong>灵剑 · ${p.weapon === 0 ? '未淬炼' : `${p.weapon} 重`}</strong><p>当前剑诀威力 ${Xian.stats(state).attack}。淬炼后威力增加 4。<br>${p.weapon >= 6 ? '灵剑已达六重，剑意圆满。' : `下次淬炼：${cost} 灵石 + ${herbs} 株灵草。`}<br>现有灵石 ${p.stones} · 灵草 ${p.herbs}</p></div>${actionButton('淬炼灵剑','upgrade','main')}</div><p class="modal-note">当前境界最多可淬炼至 ${cap} 重。突破境界可提高上限；材料不足时不会消耗材料。</p><div class="modal-actions">${button('离开铸剑台','close','subtle')}</div>${panelFeedback()}`);
    } else {
      showModal('shrine','归元祠','REST · 归于山海',`<p class="lede">「流水不争先，争的是滔滔不绝。」</p><p>在道院打坐可恢复全部气血和灵力。隔一段历练时光，调息还能增加少量修为。</p><div class="stat-grid">${statsCard('当前气血',Math.ceil(p.hp),`/ ${Xian.stats(state).maxHp}`)}${statsCard('当前灵力',Math.ceil(p.mp),`/ ${Xian.stats(state).maxMp}`)}${statsCard('修为',Math.floor(p.xp))}</div><div class="modal-actions">${actionButton('打坐调息','meditate','main')}${button('继续游历','close','subtle')}</div>${panelFeedback()}`);
    }
  }
  function deathPanel() {
    showModal('death','此身暂歇，仙途未尽','THE PATH CONTINUES',`<p class="lede">山海凶险，胜败寻常。回到青云观，整顿行囊，再问长生。</p><p>重整旗鼓会损失少量灵石和当前修为。已突破的境界、佩剑品阶与斩妖进度会保留。</p><div class="modal-actions">${actionButton('重返青云观','revive','main')}${button('导出存档','export','subtle')}</div>`,false);
  }
  function victoryPanel() {
    showModal('victory','山海问剑，终得回响','THE MOUNTAINS REMEMBER',`<div class="victory-seal">问道</div><p class="lede">天门守卫已败，山海封印尽解。<br>这一路，你从凡尘执剑，走到了山海之巅。</p><div class="stat-grid">${statsCard('斩妖',state.quests.kills)}${statsCard('当前境界',Xian.stats(state).realmName)}${statsCard('游历时长',Math.floor(state.time/60),'分钟')}</div><p>你的仙途已保存。可以继续探索、回道院突破，或导出这一程的存档。</p><div class="modal-actions">${button('继续游历','close','main')}${button('查看修为','cultivate')}${button('导出存档','export','subtle')}</div>`);
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
    else if (id === 'revive' && !state.dead) {previouslyDead = false;closeModal();notify('已回到青云观。气血与灵力恢复，仙途仍在。');}
    else if (kind === 'bag') bagPanel();
    else if (kind === 'map') mapPanel();
    else if (kind === 'techniques') techniquesPanel();
    else if (['story','master','storyteller'].includes(kind)) storyPanel(kind);
    else if (kind === 'merchant') vendorPanel();
    else if (kind === 'cultivate') cultivatePanel(kind);
    else if (['forge','alchemy','shrine'].includes(kind)) npcPanel(kind);
    else if (kind.startsWith('portal:')) portalPanel(kind.slice(7));
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
    $('xp-fill').style.width = `${(p.realm >= 3 ? 100 : clamp(p.xp/s.xpNeeded*100,0,100))}%`;
    $('objective').textContent = Xian.objective(state);
    const zone = Xian.zoneAt(p.x,p.y,state);
    if (zone.name !== lastZone) {lastZone = zone.name;$('zone-name').textContent = zone.name;}
    const map=currentMap(),r=Xian.rootInfo(state),tech=Xian.techniqueInfo(state);
    $('root-chip').textContent=r.name || gradeName(r.grade);
    $('root-chip').title=`${(r.elements || []).map(e=>typeof e==='string'?elementInfo(e).name:e.name).join(' / ')}灵根 · 点击角色查看`;
    const trial=map.trial || {};
    $('map-status').textContent=map.type==='trial'?`${map.name} · ${trial.cleared?'三重试炼已成':`第 ${trial.wave || 1} / 3 重`}`:map.name;
    if(lastMapId!==map.id){lastMapId=map.id;drawMap();}
    const skill=$('slot-skill');
    skill.querySelector('.slot-name').textContent=tech.name;
    skill.title=`${tech.name} · Q · 消耗 ${tech.manaCost} 灵力 · 间隔 ${tech.cooldown} 秒`;
    skill.setAttribute('aria-label',skill.title);
    skill.style.setProperty('--skill-color',tech.color || elementInfo(tech.element).color);
    if(skill.dataset.tech!==tech.id){skill.dataset.tech=tech.id;skill.querySelector('svg').innerHTML=icons[tech.id==='sword'?'skill':tech.id] || icons.skill;}
    for (const def of slotDefs) {
      const slot = $(`slot-${def.id}`);
      const cd = def.id === 'attack' ? p.attackCd : def.id === 'dash' ? p.dashCd : def.id === 'skill' ? p.skillCd : 0;
      const max = def.id === 'attack' ? .36 : def.id === 'dash' ? 1.4 : tech.cooldown;
      slot.querySelector('.cooldown').style.transform = `scaleY(${clamp((cd || 0)/max,0,1)})`;
      slot.querySelector('.cooldown-number').textContent = cd > .2 && def.id !== 'attack' ? cd.toFixed(1) : '';
      if (def.id === 'heal') slot.querySelector('.potion-count').textContent = p.potions;
    }
    let hint = '';
    for (const npc of map.npcs || []) if (Math.hypot(p.x-npc.x,p.y-npc.y) < 105) {hint = npc.name;break;}
    if(!hint)for(const portal of map.portals || [])if(Math.hypot(p.x-portal.x,p.y-portal.y)<110){hint=`渡界 · ${portal.name}`;break;}
    if (!hint) for (const node of state.nodes || []) if (node.ready <= 0 && Math.hypot(p.x-node.x,p.y-node.y) < 90) {hint = node.type==='relic'?'查看古迹':`采集${resourceInfo(node.type==='herb'?'herbs':node.type==='crystal'?'stones':node.type).name}`;break;}
    $('interact-hint').classList.toggle('hidden', !hint || Boolean(modalKind) || state.dead);
    if (hint) $('interact-hint').querySelector('span').textContent = hint;
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
    for(const portal of map.portals || []){c.strokeStyle='#c8f1dc';c.beginPath();c.arc(portal.x*sx,portal.y*sy,3,0,Math.PI*2);c.stroke();}
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
    if(map.id===state.mapId){for(const e of state.enemies){if(e.hp<=0||e.dormant)continue;c.beginPath();c.arc(e.x*sx,e.y*sy,e.boss?4:2,0,Math.PI*2);c.fillStyle=e.boss?'#f1b681':'#e9c28a77';c.fill();}c.fillStyle='#f7f3ce';c.beginPath();c.arc(state.player.x*sx,state.player.y*sy,4,0,Math.PI*2);c.fill();}
  }
  function input() {
    const mx = (keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
    const my = (keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
    let aim;
    if (pointer.moved) aim = renderer.screenToWorld(pointer.x,pointer.y);
    else aim = {x:state.player.x+120,y:state.player.y};
    const current = {mx,my,aimX:aim.x,aimY:aim.y,attack:mouseAttack||Boolean(pending.attack),dash:Boolean(pending.dash),skill:Boolean(pending.skill),interact:Boolean(pending.interact)};
    pending = {};
    return current;
  }
  function loop(now) {
    const dt = Math.min(.05,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
    if(state){
      const active = !modalKind && !document.hidden;
      if(active){
        const beforeHp=state.player.hp,beforeAttack=state.player.attackCd,beforeDash=state.player.dashCd,beforeSkill=state.player.skillCd;
        Xian.step(state,input(),dt);
        if(state.player.hp<beforeHp-.1)sound.fx('hurt');
        if(state.player.attackCd>beforeAttack+.1)sound.fx('attack');
        if(state.player.dashCd>beforeDash+.1)sound.fx('dash');
        if(state.player.skillCd>beforeSkill+.1)sound.fx('skill');
        if(state.interaction && (npcNames[state.interaction] || state.interaction.startsWith('portal:')))npcPanel(state.interaction);
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
    $('bag-button').addEventListener('click',bagPanel);
    $('map-button').addEventListener('click',()=>mapPanel(true));
    $('technique-button').addEventListener('click',()=>{selectedTechnique=state.activeTechnique;techniquesPanel();});
    $('story-button').addEventListener('click',()=>storyPanel());
    $('help-button').addEventListener('click',helpPanel);
    $('pause-button').addEventListener('click',pausePanel);
    $('sound-button').addEventListener('click',sound.toggle);
    $('modal').addEventListener('click',event=>{
      const mapButton=event.target.closest('[data-map]');if(mapButton){mapSelection=mapButton.dataset.map;panelMessage='';mapPanel();return;}
      const techButton=event.target.closest('[data-tech]');if(techButton){selectedTechnique=techButton.dataset.tech;panelMessage='';techniquesPanel();return;}
      const bagButton=event.target.closest('[data-bag]');if(bagButton){bagTab=bagButton.dataset.bag;panelMessage='';bagPanel();return;}
      const engineButton=event.target.closest('[data-engine]');if(engineButton){execute(engineButton.dataset.engine);return;}
      const ui=event.target.closest('[data-ui]')?.dataset.ui;
      const actions={close:closeModal,cancel:closeModal,bag:bagPanel,cultivate:()=>cultivatePanel(),root:()=>rootPanel(),map:()=>mapPanel(true),techniques:techniquesPanel,story:()=>storyPanel(),help:helpPanel,save:()=>{save(true);panelMessage='仙途已保存。';const e=$('panel-message');if(e)e.textContent=panelMessage;},export:exportSave,import:pickImport,home};
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
          if(key==='j'){event.preventDefault();['story','master','storyteller'].includes(modalKind)?closeModal():storyPanel();}
          if(key==='b'){event.preventDefault();modalKind==='bag'?closeModal():bagPanel();}
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
      if([' ','arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','q','e','r','b','m','k','j','escape'].includes(key))event.preventDefault();
      if(event.repeat)return;
      if(key==='escape'){pausePanel();return;}
      if(key==='b'){bagPanel();return;}
      if(key==='m'){mapPanel(true);return;}
      if(key==='k'){selectedTechnique=state.activeTechnique;techniquesPanel();return;}
      if(key==='j'){storyPanel();return;}
      if(state.dead)return;
      keys.add(key);
      if(key===' ')pending.dash=true;
      if(key==='q')pending.skill=true;
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
