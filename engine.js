(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Xian = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
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

  function zoneAt(x, y) {
    if (x > 2250) return { id: 'ruins', name: '天门遗迹', level: 2, color: '#9e9ace' };
    if (x > 1600 && y < 1300) return { id: 'bamboo', name: '青竹秘境', level: 1, color: '#8ac4a9' };
    if (x < 900 && y > 1400) return { id: 'hub', name: '青云观', level: 0, color: '#e6c991' };
    return { id: 'meadow', name: '落霞原', level: 0, color: '#b8ce8b' };
  }

  function stats(state) {
    const r = REALMS[clamp(Math.floor(state.player.realm), 0, 3)];
    return { ...r, attack: r.attack + state.player.weapon * 4 };
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

  function createGame(seed = 123) {
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

  function blocked(x, y, radius) {
    if (x < radius + 25 || x > WIDTH - radius - 25 || y < radius + 25 || y > HEIGHT - radius - 25) return true;
    for (const p of PONDS) {
      if (((x - p.x) / (p.rx + radius)) ** 2 + ((y - p.y) / (p.ry + radius)) ** 2 < 1) return true;
    }
    return OBSTACLES.some(o => Math.hypot(x - o.x, y - o.y) < o.radius + radius);
  }

  function move(entity, dx, dy, radius, avoidHub) {
    const pieces = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 14));
    for (let i = 0; i < pieces; i++) {
      const nx = entity.x + dx / pieces, ny = entity.y + dy / pieces;
      const legal = (x, y) => !blocked(x, y, radius) && (!avoidHub || Math.hypot(x - HUB.x, y - HUB.y) > HUB.radius + radius);
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
    if (state.dead || p.invuln > 0 || safe(p)) return false;
    p.hp = Math.max(0, p.hp - amount); p.invuln = 0.55; p.hit = 0.2;
    effect(state, 'damage', p.x, p.y - 38, 0.7, 0, { amount: Math.round(amount), color: '#fa998b' });
    effect(state, 'impact', p.x, p.y, 0.3, 35, { color: '#ee977e' });
    if (finite(x) && finite(y)) {
      const d = Math.hypot(p.x - x, p.y - y) || 1;
      move(p, (p.x - x) / d * 18, (p.y - y) / d * 18, 18, false);
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
      move(enemy, (enemy.x - state.player.x) / d * push, (enemy.y - state.player.y) / d * push, enemy.radius, true);
    }
    if (enemy.hp > 0) return;
    enemy.telegraph = 0;
    const t = ENEMY[enemy.type];
    state.player.xp += t.xp;
    state.quests.kills++;
    state.drops.push({ x: enemy.x, y: enemy.y, type: 'stones', amount: t.stones });
    if (enemy.boss) {
      if (!state.quests.bosses.includes(enemy.type)) state.quests.bosses.push(enemy.type);
      state.drops.push({ x: enemy.x + 28, y: enemy.y, type: 'potions', amount: 3 });
      state.player.mp = Math.min(stats(state).maxMp, state.player.mp + 45);
      log(state, `${enemy.name}已伏诛！获得 ${t.xp} 修为，拾取灵石与回春丹。`);
      effect(state, 'burst', enemy.x, enemy.y, 1.3, enemy.radius * 3, { color: '#e9c476' });
      if (enemy.type === 'guardian') { state.won = true; log(state, '天门重开，山海归宁。你已完成问剑之旅，仍可继续游历。'); }
    } else {
      enemy.respawn = 65;
      if (random(state) < 0.3) state.drops.push({ x: enemy.x + 20, y: enemy.y, type: 'herbs', amount: 1 });
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

  function cast(state) {
    const p = state.player;
    if (state.dead || p.skillCd > 0) return;
    if (p.mp < 28) { outcome(state, 'skill', false, '灵力不足。服用回春丹或返回道观调息。'); return; }
    p.mp -= 28; p.skillCd = 7;
    effect(state, 'burst', p.x, p.y, 0.65, 210, { color: '#8fe2df' });
    effect(state, 'ring', p.x, p.y, 0.5, 210, { color: '#b6efea' });
    for (const offset of [-0.14, 0, 0.14]) {
      const angle = p.facing + offset;
      state.projectiles.push({ x: p.x + Math.cos(angle) * 28, y: p.y + Math.sin(angle) * 28,
        vx: Math.cos(angle) * 520, vy: Math.sin(angle) * 520, life: 1.2, radius: 7,
        owner: 'player', sourceId: 'player', damage: stats(state).attack * 1.8 });
    }
    for (const e of state.enemies) {
      if (e.hp > 0 && !e.gated && distance(e, p) < 210 + e.radius) {
        hurtEnemy(state, e, stats(state).attack * 1.5, 28);
        if (!e.boss) e.stun = 0.85;
      }
    }
  }

  function shoot(state, e, angle, speed, damage, radius) {
    state.projectiles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 3.6, radius: radius || 9, owner: 'enemy', sourceId: e.id, damage });
  }

  function beginAttack(state, e) {
    const p = state.player;
    e.mode = 'windup'; e.attackX = p.x; e.attackY = p.y;
    e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    if (e.boss) {
      e.phase++;
      e.attackTimer = e.type === 'wolfKing' ? 0.85 : 1.05;
      const aoe = e.type === 'wolfKing' ? 110 : e.type === 'ancientTree' ? 130 : 148;
      effect(state, 'warning', p.x, p.y, e.attackTimer, aoe, { color: '#dc795e', sourceId: e.id });
      if (e.type === 'wolfKing') effect(state, 'warning', e.x, e.y, e.attackTimer, 85, { angle: e.facing, targetX: p.x, targetY: p.y, sourceId: e.id });
    } else {
      e.attackTimer = e.type === 'golem' ? 0.8 : 0.58;
      const ranged = e.type === 'spirit';
      effect(state, 'warning', ranged ? e.x : e.attackX, ranged ? e.y : e.attackY,
        e.attackTimer, ranged ? 32 : e.type === 'golem' ? 65 : 45, { color: '#dca478', sourceId: e.id });
    }
    e.telegraph = e.attackTimer;
  }

  function finishAttack(state, e) {
    const p = state.player, t = ENEMY[e.type];
    if (e.boss) {
      const radius = e.type === 'wolfKing' ? 110 : e.type === 'ancientTree' ? 130 : 148;
      if (e.type === 'wolfKing') {
        const d = Math.hypot(e.attackX - e.x, e.attackY - e.y);
        if (d > 1) move(e, (e.attackX - e.x) / d * Math.min(d, 380), (e.attackY - e.y) / d * Math.min(d, 380), e.radius, true);
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
      e.cooldown = e.type === 'wolfKing' ? 1.65 : e.type === 'ancientTree' ? 1.9 : 1.65;
    } else if (e.type === 'spirit') {
      shoot(state, e, Math.atan2(e.attackY - e.y, e.attackX - e.x), 230, t.damage, 9);
      e.cooldown = 1.8;
    } else {
      effect(state, 'impact', e.attackX, e.attackY, 0.25, e.type === 'golem' ? 65 : 45, { color: '#d4a67c' });
      const reach = e.type === 'golem' ? 82 : 62;
      if (Math.hypot(p.x - e.attackX, p.y - e.attackY) < reach && distance(p, e) < t.range + 50) hurtPlayer(state, t.damage, e.x, e.y);
      e.cooldown = e.type === 'golem' ? 1.55 : 1.05;
    }
    e.attackTimer = 0; e.telegraph = 0; e.mode = 'chase';
  }

  function enemyStep(state, e, dt) {
    const p = state.player, t = ENEMY[e.type];
    e.hit = Math.max(0, e.hit - dt); e.stun = Math.max(0, e.stun - dt);
    e.gated = e.boss && p.realm < t.realm;
    e.vx = 0; e.vy = 0;
    if (e.hp <= 0) {
      if (!e.boss) {
        e.respawn -= dt;
        if (e.respawn <= 0 && distance(e, p) > 520 && distance({ x: e.homeX, y: e.homeY }, p) > 440) {
          Object.assign(e, enemyAt(e.type, e.homeX, e.homeY, Number(e.id.split('-')[1])));
        }
      }
      return;
    }
    if (e.gated || e.stun > 0) return;
    e.cooldown = Math.max(0, e.cooldown - dt);
    if (e.mode === 'windup') {
      if (state.dead || safe(p)) { e.mode = 'patrol'; e.attackTimer = 0; e.telegraph = 0; return; }
      e.attackTimer -= dt;
      e.telegraph = Math.max(0, e.attackTimer);
      if (e.attackTimer <= 0) finishAttack(state, e);
      return;
    }
    const d = distance(e, p), homeDistance = Math.hypot(e.x - e.homeX, e.y - e.homeY);
    const leash = e.boss ? 660 : 460;
    const engaged = !state.dead && !safe(p) && d < t.aggro && homeDistance < leash;
    let tx, ty, speed;
    if (engaged) {
      e.mode = 'chase'; e.facing = Math.atan2(p.y - e.y, p.x - e.x);
      if (d < t.range && e.cooldown <= 0) { beginAttack(state, e); return; }
      const desired = e.type === 'spirit' ? 240 : e.type === 'ancientTree' ? 260 : e.type === 'guardian' ? 170 : 45;
      if (d > desired) { tx = p.x; ty = p.y; speed = t.speed; }
      else if (e.type === 'spirit' && d < 150) { tx = e.x + (e.x - p.x); ty = e.y + (e.y - p.y); speed = t.speed * 0.75; }
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
    if (direction > 5) {
      e.vx = (tx - e.x) / direction * speed; e.vy = (ty - e.y) / direction * speed;
      move(e, e.vx * dt, e.vy * dt, e.radius, true);
    }
  }

  function interact(state) {
    if (state.dead) return outcome(state, 'interact', false, '灵身已散，先在归元祠重聚灵身。');
    const p = state.player;
    const npc = NPCS.filter(n => distance(n, p) < 105).sort((a, b) => distance(a, p) - distance(b, p))[0];
    if (npc) { state.interaction = npc.id; return outcome(state, 'interact', true, ''); }
    const node = state.nodes.filter(n => n.ready <= 0 && distance(n, p) < 90).sort((a, b) => distance(a, p) - distance(b, p))[0];
    if (!node) return outcome(state, 'interact', false, '靠近灵草、灵晶或道观人物，按 E 交互。');
    node.ready = node.type === 'herb' ? 75 : 95;
    if (node.type === 'herb') {
      p.herbs += 2; p.xp += 6; state.quests.herbs += 2;
      effect(state, 'heal', node.x, node.y, 0.55, 35, { color: '#a2dfb7' });
      outcome(state, 'interact', true, '采得 2 株灵草，获得 6 修为。');
    } else {
      p.stones += 12; p.xp += 5;
      effect(state, 'burst', node.x, node.y, 0.55, 38, { color: '#9fdedc' });
      outcome(state, 'interact', true, '采得 12 灵石，获得 5 修为。');
    }
    questCheck(state);
    return state;
  }

  function action(state, id) {
    const p = state.player, s = stats(state);
    if (id === 'revive') {
      if (!state.dead) return outcome(state, id, false, '灵身尚在，无须重聚。');
      const loss = Math.floor(p.stones * 0.12);
      p.stones -= loss; p.xp = Math.max(0, p.xp - Math.min(45, Math.floor(p.xp * 0.08)));
      p.x = 550; p.y = 1780; p.hp = s.maxHp; p.mp = s.maxMp; p.invuln = 2;
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
    if (!safe(p)) return outcome(state, id, false, '此事须返回青云观的安全范围内进行。');
    if (id === 'meditate') {
      p.hp = s.maxHp; p.mp = s.maxMp;
      if (state.meditationCd <= 0) {
        const gained = 12 + p.realm * 6;
        p.xp += gained; state.meditationCd = 60;
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
    const p = state.player, s = stats(state);
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
        move(p, p.dashX * 830 * dt, p.dashY * 830 * dt, 18, false); p.dashTime = Math.max(0, p.dashTime - dt);
        effect(state, 'trail', p.x, p.y, 0.25, 17, { angle: p.facing, color: '#a2dbdf' });
      } else move(p, mx * s.speed * dt, my * s.speed * dt, 18, false);
      p.mp = Math.min(s.maxMp, p.mp + dt * (safe(p) ? 6 : 2.5));
      if (safe(p)) p.hp = Math.min(s.maxHp, p.hp + dt * 3);
      if (input.attack) sword(state);
      if (input.skill) cast(state);
      if (input.interact) interact(state);
    } else p.moving = false;
    state.enemies.forEach(e => enemyStep(state, e, dt));
    for (const b of state.projectiles) {
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (blocked(b.x, b.y, b.radius) || (b.owner === 'enemy' && Math.hypot(b.x - HUB.x, b.y - HUB.y) < HUB.radius)) b.life = 0;
      if (b.life > 0 && b.owner === 'player') {
        for (const e of state.enemies) {
          if (e.hp > 0 && !e.gated && Math.hypot(e.x - b.x, e.y - b.y) < b.radius + e.radius) {
            hurtEnemy(state, e, b.damage, 7); b.life = 0;
            effect(state, 'impact', b.x, b.y, 0.23, 22, { color: '#a5e4e3' });
            break;
          }
        }
      }
      if (b.life > 0 && b.owner === 'enemy' && !state.dead && Math.hypot(p.x - b.x, p.y - b.y) < b.radius + 18) {
        hurtPlayer(state, b.damage, b.x - b.vx, b.y - b.vy); b.life = 0;
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
    return state;
  }

  function objective(state) {
    const p = state.player, s = stats(state);
    if (state.dead) return '灵身已散 · 点击重聚灵身，返回青云观';
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
    return JSON.stringify({
      version: 1, seed: state.seed, rng: state.rng, time: state.time, player: state.player,
      enemies: state.enemies, nodes: state.nodes, projectiles: state.projectiles,
      drops: state.drops, logs: state.logs, quests: state.quests, questRewards: state.questRewards,
      won: state.won, dead: state.dead, meditationCd: state.meditationCd
    });
  }

  function deserialize(json) {
    const fail = () => { throw new Error('存档无效或不兼容，请选择有效的山海问剑存档。'); };
    if (typeof json !== 'string' || json.length > 500000) fail();
    let data; try { data = JSON.parse(json); } catch (_) { fail(); }
    if (!data || typeof data !== 'object' || data.version !== 1) fail();
    const number = (v, lo, hi, integer) => {
      if (!finite(v) || v < lo || v > hi || (integer && !Number.isInteger(v))) fail();
      return v;
    };
    const boolean = v => { if (typeof v !== 'boolean') fail(); return v; };
    const state = createGame(number(data.seed, 1, 4294967295, true));
    state.rng = number(data.rng, 1, 4294967295, true); state.time = number(data.time, 0, 1e9);
    const savedPlayer = data.player;
    if (!savedPlayer || typeof savedPlayer !== 'object') fail();
    const p = state.player;
    p.realm = number(savedPlayer.realm, 0, 3, true); p.weapon = number(savedPlayer.weapon, 0, 6, true);
    const s = stats(state);
    p.x = number(savedPlayer.x, 43, WIDTH - 43); p.y = number(savedPlayer.y, 43, HEIGHT - 43);
    if (blocked(p.x, p.y, 17)) fail();
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

  return { createGame, step, interact, action, serialize, deserialize, stats, objective, zoneAt,
    WIDTH, HEIGHT, HUB, PONDS, OBSTACLES, REALMS, NPCS, ENEMY };
});
