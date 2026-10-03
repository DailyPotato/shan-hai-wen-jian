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
  const keys = new Set();
  const npcNames = {master:'凌云真人',forge:'铸剑台',alchemy:'灵药炉',shrine:'聚灵阵'};
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
    if (!data) notify('仙途已启。先与凌云真人交谈，或前往东侧山野历练。');
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
    $('modal').innerHTML = `<header class="modal-header"><div><span class="eyebrow">${esc(eyebrow)}</span><h2 id="modal-title">${esc(title)}</h2></div>${closeable ? '<button class="modal-close" data-ui="close" aria-label="关闭面板">×</button>' : ''}</header>${content}`;
    $('modal-backdrop').classList.remove('hidden');
    $('modal').focus();
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
    showModal('pause', '山静，剑亦静', 'JOURNEY AT REST', `<p class="lede">暂歇片刻。山海会等你归来。</p><div class="modal-actions">${button('继续游历','close','main')}${button('修为与境界','cultivate')}${button('行囊','bag')}${button('游玩指引','help')}</div><h3>仙途存档</h3><p>进度每 10 秒自动保存。导出备份可在另一台电脑上继续旅程。</p><div class="modal-actions">${button('立即保存','save')}${button('导出存档','export','subtle')}${button('导入存档','import','subtle')}${button('返回首页','home','subtle')}</div>${panelFeedback()}<div class="shortcut-footer">ESC · 继续游戏</div>`);
  }
  function helpPanel() {
    showModal('help','初入山海','THE WAY OF THE SWORD',`<p class="lede">这是一段可以亲手走过的仙途。移动、瞄准与闪避，都是你自己的选择。</p><div class="keys-table"><div><kbd>W A S D / ↑↓←→</kbd>移动</div><div><kbd>鼠标左键</kbd>瞄准并挥剑</div><div><kbd>Q</kbd>御剑诀 · 消耗灵力</div><div><kbd>Space</kbd>踏风步 · 短暂闪避</div><div><kbd>E</kbd>采集 / 道院交互</div><div><kbd>R</kbd>服用回春丹</div><div><kbd>B</kbd>打开行囊</div><div><kbd>Esc</kbd>暂停 / 关闭面板</div></div><h3>循序渐进，问道长生</h3><p>从西南方青云观出发。在山野斩妖、采集灵草与灵晶，积攒修为和灵石。回道院炼丹、锻剑、休养；达到修为门槛后，在凌云真人处突破境界。</p><p>依次挑战苍牙狼王、千年木灵和天门守卫。更高的境界才足以解开后两位守关者的封印。观察地面上的攻击预警，用踏风步躲开。</p><p class="modal-note">小地图金色菱形是道院，红色标记是守关者。气血耗尽后可回道院重整旗鼓，已有的境界与斩妖进度会保留。面板打开时游戏暂停。</p><div class="modal-actions">${button(state?'我已知晓，继续游历':'我已知晓','close','main')}</div>`);
  }
  function statsCard(name, value, suffix = '') {return `<div class="stat-card"><small>${name}</small><strong>${esc(value)}${suffix ? `<em> ${esc(suffix)}</em>` : ''}</strong></div>`;}
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
    const p = state.player;
    showModal('bag','行囊','WHAT THE JOURNEY BRINGS',`<p class="lede">山中所得，皆为仙途所用。</p><div class="inventory-grid"><div class="inventory-item">${svg('stone')}<strong>${p.stones}</strong><div class="item-name">灵石</div><small>锻剑与炼丹的材料<br>从妖物和灵晶中获得</small></div><div class="inventory-item">${svg('herb')}<strong>${p.herbs}</strong><div class="item-name">灵草</div><small>炼制回春丹的材料<br>靠近灵草按 E 采集</small></div><div class="inventory-item">${svg('potion')}<strong>${p.potions}</strong><div class="item-name">回春丹</div><small>回复 42% 气血<br>与 25% 灵力</small></div></div><h3>随身佩剑</h3><div class="recipe-row"><div class="recipe-copy"><strong>灵剑 · ${p.weapon === 0 ? '未淬炼' : `${p.weapon} 重`}</strong><p>剑诀威力 ${Xian.stats(state).attack}。在道院铸剑台提升佩剑品阶。</p></div>${button('查看修为','cultivate','subtle')}</div><div class="modal-actions">${actionButton('服用回春丹','heal','main')}${button('继续游历','close','subtle')}</div>${panelFeedback()}`);
  }
  function npcPanel(kind) {
    if (kind === 'master') return cultivatePanel('master');
    const p = state.player;
    if (kind === 'alchemy') {
      showModal('alchemy','灵药炉','ALCHEMY · 炼化山川灵气',`<p class="lede">炉火不息，药香长存。灵草炼为回春丹，助你走过凶险山野。</p><div class="recipe-row"><div class="recipe-copy"><strong>炼制回春丹 × 2</strong><p>消耗 2 株灵草、8 枚灵石。<br>现有灵草 ${p.herbs} · 灵石 ${p.stones} · 回春丹 ${p.potions}</p></div>${actionButton('开炉炼丹','craft','main')}</div><p>回春丹回复 42% 气血与 25% 灵力，战斗中按 R 服用。气血和灵力都充盈时不会消耗丹药。</p><div class="modal-actions">${button('离开丹炉','close','subtle')}</div>${panelFeedback()}`);
    } else if (kind === 'forge') {
      const cost = 40 + p.weapon * 35, herbs = 1 + Math.floor(p.weapon / 2), cap = Math.min(6, 2 + p.realm * 2);
      showModal('forge','铸剑台','THE BLADE REFORGED',`<p class="lede">百炼成钢，剑随心长。将一路所得灵石，铸入你的佩剑。</p><div class="recipe-row"><div class="recipe-copy"><strong>灵剑 · ${p.weapon === 0 ? '未淬炼' : `${p.weapon} 重`}</strong><p>当前剑诀威力 ${Xian.stats(state).attack}。淬炼后威力增加 4。<br>${p.weapon >= 6 ? '灵剑已达六重，剑意圆满。' : `下次淬炼：${cost} 灵石 + ${herbs} 株灵草。`}<br>现有灵石 ${p.stones} · 灵草 ${p.herbs}</p></div>${actionButton('淬炼灵剑','upgrade','main')}</div><p class="modal-note">当前境界最多可淬炼至 ${cap} 重。突破境界可提高上限；材料不足时不会消耗材料。</p><div class="modal-actions">${button('离开铸剑台','close','subtle')}</div>${panelFeedback()}`);
    } else {
      showModal('shrine','聚灵阵','REST · 归于山海',`<p class="lede">「流水不争先，争的是滔滔不绝。」</p><p>在道院打坐可恢复全部气血和灵力。隔一段历练时光，调息还能增加少量修为。</p><div class="stat-grid">${statsCard('当前气血',Math.ceil(p.hp),`/ ${Xian.stats(state).maxHp}`)}${statsCard('当前灵力',Math.ceil(p.mp),`/ ${Xian.stats(state).maxMp}`)}${statsCard('修为',Math.floor(p.xp))}</div><div class="modal-actions">${actionButton('打坐调息','meditate','main')}${button('继续游历','close','subtle')}</div>${panelFeedback()}`);
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
    Xian.action(state,id);
    const result = state.lastAction;
    panelMessage = result?.message || (Array.isArray(state.logs) ? state.logs[state.logs.length-1] : '') || '';
    sound.fx(result?.ok === false ? 'fail' : 'success');
    if (id === 'revive' && !state.dead) {previouslyDead = false;closeModal();notify('已回到青云观。气血与灵力恢复，仙途仍在。');}
    else if (kind === 'bag') bagPanel();
    else if (kind === 'cultivate' || kind === 'master') cultivatePanel(kind);
    else if (['forge','alchemy','shrine'].includes(kind)) npcPanel(kind);
    updateHUD(); save();
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
    const zone = Xian.zoneAt(p.x,p.y);
    if (zone.name !== lastZone) {lastZone = zone.name;$('zone-name').textContent = zone.name;}
    for (const def of slotDefs) {
      const slot = $(`slot-${def.id}`);
      const cd = def.id === 'attack' ? p.attackCd : def.id === 'dash' ? p.dashCd : def.id === 'skill' ? p.skillCd : 0;
      const max = def.id === 'attack' ? .36 : def.id === 'dash' ? 1.4 : 7;
      slot.querySelector('.cooldown').style.transform = `scaleY(${clamp((cd || 0)/max,0,1)})`;
      slot.querySelector('.cooldown-number').textContent = cd > .2 && def.id !== 'attack' ? cd.toFixed(1) : '';
      if (def.id === 'heal') slot.querySelector('.potion-count').textContent = p.potions;
    }
    let hint = '';
    for (const [kind,[x,y]] of Object.entries(npcPoints)) if (Math.hypot(p.x-x,p.y-y) < 105) {hint = npcNames[kind];break;}
    if (!hint) for (const node of state.nodes || []) if (node.ready <= 0 && Math.hypot(p.x-node.x,p.y-node.y) < 90) {hint = node.type === 'herb' ? '采集灵草' : '开采灵晶';break;}
    $('interact-hint').classList.toggle('hidden', !hint || Boolean(modalKind) || state.dead);
    if (hint) $('interact-hint').querySelector('span').textContent = hint;
  }
  function drawMap() {
    if (!state) return;
    const canvas = $('minimap'), c = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const sx = w/3200, sy = h/2400;
    c.clearRect(0,0,w,h);c.fillStyle = '#325446';c.fillRect(0,0,w,h);
    c.fillStyle = '#244c41';c.fillRect(1600*sx,0,1600*sx,1300*sy);
    c.fillStyle = '#405b4a';c.fillRect(2250*sx,0,950*sx,h);
    c.fillStyle = '#65826b';c.beginPath();c.arc(500*sx,1800*sy,340*sx,0,Math.PI*2);c.fill();
    c.strokeStyle='#dac99628';c.lineWidth=1;
    for(let x=0;x<3200;x+=400){c.beginPath();c.moveTo(x*sx,0);c.lineTo(x*sx,h);c.stroke();}
    for(let y=0;y<2400;y+=400){c.beginPath();c.moveTo(0,y*sy);c.lineTo(w,y*sy);c.stroke();}
    c.fillStyle='#7da69a';for(const [x,y,rx,ry] of [[1350,700,230,155],[2430,2000,160,120]]){c.beginPath();c.ellipse(x*sx,y*sy,rx*sx,ry*sy,0,0,Math.PI*2);c.fill();}
    c.strokeStyle='#c7bfa15c';c.beginPath();c.moveTo(500*sx,1800*sy);c.lineTo(1450*sx,1580*sy);c.lineTo(2020*sx,650*sy);c.lineTo(2790*sx,650*sy);c.stroke();
    c.fillStyle='#e6cc8e';c.save();c.translate(500*sx,1800*sy);c.rotate(Math.PI/4);c.fillRect(-3,-3,6,6);c.restore();
    for(const enemy of state.enemies || []){if(enemy.hp<=0)continue;c.beginPath();c.arc(enemy.x*sx,enemy.y*sy,enemy.boss?3.3:1.2,0,Math.PI*2);c.fillStyle=enemy.boss?(enemy.gated?'#bbab8e':'#e6a278'):'#c58e6c99';c.fill();}
    c.strokeStyle='#e8e5bc55';c.strokeRect(state.player.x*sx-17,state.player.y*sy-12,34,24);
    c.beginPath();c.arc(state.player.x*sx,state.player.y*sy,3,0,Math.PI*2);c.fillStyle='#f4efc1';c.shadowColor='#f1ecba';c.shadowBlur=8;c.fill();c.shadowBlur=0;
    c.fillStyle='#e5e7becc';c.font='9px serif';c.fillText('青云',500*sx-12,1800*sy+14);c.fillText('落霞',1110*sx,1580*sy-8);c.fillText('青竹',1810*sx,350*sy);c.fillText('天门',2700*sx,1250*sy);
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
        if(state.interaction && npcNames[state.interaction])npcPanel(state.interaction);
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
    $('help-button').addEventListener('click',helpPanel);
    $('pause-button').addEventListener('click',pausePanel);
    $('sound-button').addEventListener('click',sound.toggle);
    $('modal').addEventListener('click',event=>{
      const engineButton=event.target.closest('[data-engine]');if(engineButton){execute(engineButton.dataset.engine);return;}
      const ui=event.target.closest('[data-ui]')?.dataset.ui;
      const actions={close:closeModal,cancel:closeModal,bag:bagPanel,cultivate:()=>cultivatePanel(),help:helpPanel,save:()=>{save(true);panelMessage='仙途已保存。';const e=$('panel-message');if(e)e.textContent=panelMessage;},export:exportSave,import:pickImport,home};
      if(actions[ui]){sound.fx('click');actions[ui]();}
    });
    $('modal-backdrop').addEventListener('click',event=>{if(event.target===$('modal-backdrop')&&!['death'].includes(modalKind))closeModal();});
    document.addEventListener('keydown',event=>{
      const key=event.key.toLowerCase();
      if(modalKind){
        if(key==='escape'&&modalKind!=='death'){event.preventDefault();closeModal();}
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
      if([' ','arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','q','e','r','b','escape'].includes(key))event.preventDefault();
      if(event.repeat)return;
      if(key==='escape'){pausePanel();return;}
      if(key==='b'){bagPanel();return;}
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
