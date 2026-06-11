// ═══════════════════════════════════════════════════════════
//  units.js — Unit catalog (all sprite sheets), movement, combat
// ═══════════════════════════════════════════════════════════

// ── Catalog generation ─────────────────────────────────────
// Every sprite from the combat/support sheets becomes a recruitable
// unit. Stats derive from the category base + per-sprite variance.

const UNIT_CATEGORIES = {
  infantaria:  { label: 'INFANTARIA',        sheet: 'sheet_soldiers.png',         domain: 'ground', tier: 1, emoji: '🪖', base: { atk: 1.2, def: 1.6, speed: 20,   energyCap: 100, range: 500,  cost: 60,   manpower: 10 } },
  veic_leve:   { label: 'VEÍCULOS LEVES',    sheet: 'sheet_vehicles_light.png',   domain: 'ground', tier: 2, emoji: '🚙', base: { atk: 2,   def: 2,   speed: 80,   energyCap: 150, range: 650,  cost: 150,  manpower: 5  } },
  veic_medio:  { label: 'VEÍCULOS MÉDIOS',   sheet: 'sheet_vehicles_medium.png',  domain: 'ground', tier: 2, emoji: '🚛', base: { atk: 3.2, def: 2.6, speed: 55,   energyCap: 180, range: 550,  cost: 240,  manpower: 5  } },
  tanques:     { label: 'TANQUES',           sheet: 'sheet_tanks_level1.png',     domain: 'ground', tier: 3, emoji: '🛡️', base: { atk: 5,   def: 4.2, speed: 42,   energyCap: 200, range: 420,  cost: 520,  manpower: 4  } },
  apoio_terra: { label: 'APOIO TERRESTRE',   sheet: 'sheet_ground_support.png',   domain: 'ground', tier: 2, emoji: '📡', base: { atk: 0.8, def: 2.2, speed: 45,   energyCap: 170, range: 600,  cost: 210,  manpower: 6  } },
  caca_elite:  { label: 'CAÇAS DE ELITE',    sheet: 'sheet_air_level1.png',       domain: 'air',    tier: 3, emoji: '🛩️', base: { atk: 6,   def: 1.2, speed: 1200, energyCap: 150, range: 4500, cost: 850,  manpower: 1  } },
  aeronaves:   { label: 'AERONAVES',         sheet: 'sheet_air_level2.png',       domain: 'air',    tier: 2, emoji: '✈️', base: { atk: 4,   def: 1.2, speed: 800,  energyCap: 130, range: 2200, cost: 380,  manpower: 1  } },
  drones:      { label: 'DRONES & TREINO',   sheet: 'sheet_air_level3.png',       domain: 'air',    tier: 1, emoji: '🚁', base: { atk: 2,   def: 0.7, speed: 280,  energyCap: 90,  range: 1600, cost: 140,  manpower: 1  } },
  apoio_aereo: { label: 'APOIO AÉREO',       sheet: 'sheet_air_support.png',      domain: 'air',    tier: 2, emoji: '🛫', base: { atk: 0.6, def: 1,   speed: 550,  energyCap: 220, range: 7000, cost: 260,  manpower: 3  } },
  nav_capital: { label: 'NAVIOS CAPITAIS',   sheet: 'sheet_naval_level1.png',     domain: 'naval',  tier: 3, emoji: '🛳️', base: { atk: 5.5, def: 4.6, speed: 32,   energyCap: 350, range: 9000, cost: 950,  manpower: 35 } },
  nav_escolta: { label: 'CRUZADORES & FRAGATAS', sheet: 'sheet_naval_level2.png', domain: 'naval',  tier: 2, emoji: '🚢', base: { atk: 3.4, def: 3.2, speed: 32,   energyCap: 220, range: 5500, cost: 430,  manpower: 20 } },
  nav_patrulha:{ label: 'PATRULHA COSTEIRA', sheet: 'sheet_naval_level3.png',     domain: 'naval',  tier: 1, emoji: '⛵', base: { atk: 1.4, def: 1.2, speed: 45,   energyCap: 110, range: 2200, cost: 140,  manpower: 6  } },
  apoio_naval: { label: 'APOIO NAVAL',       sheet: 'sheet_naval_support.png',    domain: 'naval',  tier: 1, emoji: '⚓', base: { atk: 0.5, def: 1.6, speed: 26,   energyCap: 260, range: 6000, cost: 200,  manpower: 12 } },
};

// Pretty label from sprite name: 'air1_f35_lightning' → 'F35 Lightning'
function _spritePrettyName(spriteName) {
  return spriteName
    .replace(/^[a-z]+\d*_/, '')
    .split('_')
    .map(w => (/\d/.test(w) || w.length <= 2) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Deterministic 0..1 hash from a string (per-sprite stat variance)
function _nameHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
}

const UNIT_DEFS = {};            // spriteName → def (full catalog)
const UNIT_CATALOG_BY_CAT = {};  // catKey → [spriteName, ...]

function buildUnitCatalog() {
  if (!_spriteCoords || !_spriteCoords.sheets) return;
  Object.entries(UNIT_CATEGORIES).forEach(([catKey, cat]) => {
    const sheet = _spriteCoords.sheets[cat.sheet];
    if (!sheet || !sheet.sprites) return;
    UNIT_CATALOG_BY_CAT[catKey] = [];
    Object.keys(sheet.sprites).forEach((spriteName, idx) => {
      const v = _nameHash(spriteName);          // 0..1 variance
      const m = 0.85 + v * 0.45;                // 0.85..1.3 multiplier
      const b = cat.base;
      UNIT_DEFS[spriteName] = {
        label:     _spritePrettyName(spriteName),
        cat:       catKey,
        catLabel:  cat.label,
        sheet:     cat.sheet,
        sprite:    spriteName,
        domain:    cat.domain,
        tier:      cat.tier,
        emoji:     cat.emoji,
        atk:       Math.round(b.atk * m * 10) / 10,
        def:       Math.round(b.def * (1.15 - v * 0.3) * 10) / 10,
        speed:     Math.round(b.speed * (0.9 + v * 0.25)),
        energyCap: Math.round(b.energyCap * (0.9 + v * 0.3)),
        range:     Math.round(b.range * (0.85 + v * 0.4)),
        cost:      Math.round(b.cost * (1 + idx * 0.07) * m),
        manpower:  Math.max(1, Math.round(b.manpower * (0.85 + v * 0.3))),
      };
      UNIT_CATALOG_BY_CAT[catKey].push(spriteName);
    });
  });

  // Legacy save compatibility: old type keys alias to catalog entries
  const LEGACY = {
    infantry:        'sol_infantry_soldier',
    motorized:       'veh1_humvee_hmmwv',
    veh_light:       'veh1_humvee_hmmwv',
    veh_medium:      'veh2_bradley_m2',
    tank_elite:      'tank1_m1a2_abrams',
    artillery:       'tank1_pzh2000_howitzer',
    air3_drone:      'air3_mq9_reaper',
    air2_fighter:    'air2_f16_falcon',
    air2_helicopter: 'air2_apache_ah64',
    air1_stealth:    'air1_f35_lightning',
    air_transport:   'airsup_c17_globemaster',
    nav3_patrol:     'nav3_lcs_freedom',
    nav2_frigate:    'nav2_ticonderoga_cruiser',
    nav1_destroyer:  'nav1_arleigh_burke',
    nav1_carrier:    'nav1_gerald_ford_carrier',
  };
  Object.entries(LEGACY).forEach(([oldKey, newKey]) => {
    if (UNIT_DEFS[newKey] && !UNIT_DEFS[oldKey]) UNIT_DEFS[oldKey] = UNIT_DEFS[newKey];
  });
}

// Terrain speed multipliers
const TERRAIN_SPEED = { road: 1.0, plain: 0.7, mountain: 0.4, sea: 0.0, air: 1.0 };

// ── Stances / Ordens táticas ───────────────────────────────
// Each stance changes speed, combat power and energy drain.
const STANCE_DEFS = {
  hold:    { label: 'Manter Posição', icon: 'map_stop_x',        speedMult: 0,   atkMult: 1.0,  defMult: 1.25, energyMult: 1.0, desc: 'Parado e entrincheirado. +25% defesa.' },
  march:   { label: 'Marchar',        icon: 'map_arrow_move',    speedMult: 1.0, atkMult: 1.0,  defMult: 1.0,  energyMult: 1.0, desc: 'Movimento padrão pelos waypoints.' },
  forced:  { label: 'Marcha Forçada', icon: 'map_arrow_curve',   speedMult: 1.6, atkMult: 0.85, defMult: 0.7,  energyMult: 2.0, desc: '+60% velocidade, mas -30% defesa e gasta 2× energia.' },
  patrol:  { label: 'Patrulhar',      icon: 'map_patrol_route',  speedMult: 0.6, atkMult: 1.1,  defMult: 1.1,  energyMult: 0.8, desc: 'Vai e volta entre os waypoints. +10% atk/def.' },
  flank:   { label: 'Flanquear',      icon: 'map_flank_zigzag',  speedMult: 1.2, atkMult: 1.25, defMult: 0.85, energyMult: 1.3, desc: 'Manobra agressiva. +25% ataque, -15% defesa.' },
  retreat: { label: 'Recuar',         icon: 'map_retreat_dash',  speedMult: 1.4, atkMult: 0.5,  defMult: 0.9,  energyMult: 1.2, desc: 'Retirada rápida. -50% ataque, +40% velocidade.' },
  ambush:  { label: 'Emboscada',      icon: 'map_crosshair',     speedMult: 0,   atkMult: 1.4,  defMult: 1.1,  energyMult: 0.5, desc: 'Parado e oculto. +40% ataque no primeiro choque.' },
};

// Hours of operational movement per turn
const HOURS_PER_TURN = 6;

// km a unit can cover this turn given stance and level
function movementBudgetKm(unit) {
  const st = STANCE_DEFS[unit.stance] || STANCE_DEFS.march;
  if (st.speedMult === 0) return 0;
  return getUnitSpeed(unit) * HOURS_PER_TURN * st.speedMult;
}

// ── Per-turn waypoint movement ──────────────────────────────
// Units advance along their waypoint queue, limited by speed
// and energy. Returns log events.
function processUnitMovement(state) {
  const events = [];
  (state.units || []).forEach(u => {
    if (!u.waypoints || !u.waypoints.length) return;
    const def = UNIT_DEFS[u.type];
    if (!def) return;
    const st = STANCE_DEFS[u.stance] || STANCE_DEFS.march;
    let budget = movementBudgetKm(u);
    if (budget <= 0) return;

    const drainPerKm = (1 / def.range) * u.energyCap * st.energyMult;

    while (budget > 0 && u.waypoints.length) {
      const wp = u.waypoints[0];
      const d  = haversineKm(u.lat, u.lng, wp.lat, wp.lng);
      if (d < 1) { _advanceWaypoint(u, events); continue; }

      const maxByEnergy = drainPerKm > 0 ? (u.energy - 5) / drainPerKm : Infinity;
      const step = Math.min(budget, d, Math.max(0, maxByEnergy));
      if (step < 0.5) {
        if (u.energy <= 10) {
          u.resting = true;
          events.push(`⚠️ ${u.name} sem energia — descansando em campo`);
        }
        break;
      }

      const f = step / d;
      u.lat += (wp.lat - u.lat) * f;
      u.lng += (wp.lng - u.lng) * f;
      u.energy = Math.max(0, u.energy - step * drainPerKm);
      budget -= step;

      if (f >= 0.999) _advanceWaypoint(u, events);
    }
  });
  return events;
}

function _advanceWaypoint(u, events) {
  const wp = u.waypoints.shift();
  if (u.stance === 'patrol') {
    // Patrol loops: completed waypoint goes to the back of the queue
    u.waypoints.push(wp);
    if (u.waypoints.length === 1) u.waypoints = []; // single-point patrol = stop
  } else if (!u.waypoints.length) {
    events.push(`📍 ${u.name} chegou ao destino`);
    if (u.stance === 'march' || u.stance === 'forced') u.stance = 'hold';
  }
}

// ── Auto-engagement: combat triggers when hostiles are close ─
const ENGAGE_RANGE_KM = 80;

function processCombatEngagements(state) {
  const events = [];
  const hostiles = (state.units || []).filter(u => (state.at_war_with || []).includes(u.country) && u.hp > 0);
  const friendly = (state.units || []).filter(u => u.country === state.player_country && u.hp > 0);
  if (!hostiles.length || !friendly.length) {
    (state.units || []).forEach(u => u.inCombat = false);
    return events;
  }

  // Cluster engaged units into battles by proximity
  const engagedF = new Set(), engagedH = new Set();
  friendly.forEach(f => hostiles.forEach(h => {
    if (haversineKm(f.lat, f.lng, h.lat, h.lng) < ENGAGE_RANGE_KM) {
      engagedF.add(f); engagedH.add(h);
    }
  }));

  (state.units || []).forEach(u => u.inCombat = engagedF.has(u) || engagedH.has(u));

  if (engagedF.size) {
    const atk = [...engagedF], dfd = [...engagedH];
    const r = resolveCombat(atk, dfd);
    const lbl = { decisive_victory: '🏆 VITÓRIA DECISIVA', victory: '⚔️ Vitória', stalemate: '🛡️ Impasse', defeat: '💥 Derrota' }[r.result];
    events.push(`⚔️ Batalha (${atk.length}×${dfd.length} unidades): ${lbl} — razão de força ${r.ratio}`);

    // Remove destroyed units
    const dead = (state.units || []).filter(u => u.hp <= 0);
    dead.forEach(u => events.push(`💀 ${u.name} (${u.country}) destruído em combate`));
    state.units = (state.units || []).filter(u => u.hp > 0);

    // Ambush is single-use: after the first clash the unit reverts to hold
    atk.forEach(u => { if (u.stance === 'ambush') u.stance = 'hold'; });
  }
  return events;
}

// XP thresholds per level
const XP_THRESHOLDS = [0, 100, 300, 600, 1000];
const LEVEL_NAMES   = ['Recruta', 'Elite', 'Veterano', 'Experiente', 'Lendário'];

let _unitIdCounter = 1;

// ── Factory ────────────────────────────────────────────────
function createUnit(type, country, lat, lng, squadSize = 1) {
  const def = UNIT_DEFS[type];
  if (!def) throw new Error(`Unknown unit type: ${type}`);
  return {
    id:        `u${Date.now()}_${_unitIdCounter++}`,
    type,
    country,
    lat,
    lng,
    hp:        100,
    energy:    def.energyCap,
    energyCap: def.energyCap,
    xp:        0,
    level:     1,
    squadSize: Math.max(1, Math.min(10, squadSize)),
    name:      _generateUnitName(type),
    waypoints: [],
    stance:    'hold',   // hold | patrol | flank | retreat
    inCombat:  false,
    resting:   false,
  };
}

function _generateUnitName(type) {
  const def = UNIT_DEFS[type];
  const adjectives = ['Alpha', 'Bravo', 'Delta', 'Echo', 'Foxtrot', 'Ghost', 'Iron', 'Shadow', 'Storm', 'Thunder'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${adj} ${def.label}`;
}

// ── Movement ───────────────────────────────────────────────
function getUnitSpeed(unit) {
  const def = UNIT_DEFS[unit.type];
  const lvlBonus = 1 + (unit.level - 1) * 0.05;
  return def.speed * lvlBonus;
}

// Distance in km between two lat/lng points (Haversine)
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Energy drain: proportional to distance and speed
function energyForDistance(unit, distKm) {
  const def = UNIT_DEFS[unit.type];
  // Full range consumes full energy cap
  return (distKm / def.range) * unit.energyCap;
}

function canMove(unit, destLat, destLng) {
  if (unit.energy <= 5) return { ok: false, reason: 'Sem energia. Unidade em descanso.' };
  const dist = haversineKm(unit.lat, unit.lng, destLat, destLng);
  const drain = energyForDistance(unit, dist);
  if (drain > unit.energy) return { ok: false, reason: `Energia insuficiente (${Math.round(drain)}% necessário, ${Math.round(unit.energy)}% disponível)` };
  return { ok: true, dist, drain };
}

function moveUnit(unit, destLat, destLng) {
  const check = canMove(unit, destLat, destLng);
  if (!check.ok) return check;
  unit.energy = Math.max(0, unit.energy - check.drain);
  unit.lat = destLat;
  unit.lng = destLng;
  unit.resting = unit.energy <= 5;
  return { ok: true, dist: check.dist };
}

// ── Energy recovery ────────────────────────────────────────
function recoverEnergy(unit, locationType) {
  // locationType: 'field' | 'camp' | 'village' | 'city' | 'metropolis'
  const rates = { field: 5, camp: 15, village: 25, city: 40, metropolis: 60 };
  const rate = rates[locationType] || 5;
  unit.energy = Math.min(unit.energyCap, unit.energy + rate);
  if (unit.energy > 10) unit.resting = false;
}

// ── Combat ─────────────────────────────────────────────────
function resolveCombat(attackers, defenders) {
  const gs = window.GS;
  const arsenalBonus = (gs && typeof arsenalAtkBonus === 'function') ? arsenalAtkBonus(gs) : 0;

  const _force = (u, useAtk) => {
    const def = UNIT_DEFS[u.type];
    if (!def) return 0;
    const lvlBonus = 1 + (u.level - 1) * 0.1;
    const energyFactor = Math.max(0.3, u.energy / u.energyCap);
    const isPlayer = gs && u.country === gs.player_country;
    const wpn = isPlayer ? 1 + arsenalBonus : 1;
    const st  = STANCE_DEFS[u.stance] || STANCE_DEFS.march;
    const stanceMult = useAtk ? st.atkMult : st.defMult;
    const stat = useAtk ? def.atk : def.def * 1.1; // defender bonus
    return stat * lvlBonus * energyFactor * u.squadSize * wpn * stanceMult;
  };

  const atkForce = attackers.reduce((sum, u) => sum + _force(u, true), 0);
  const defForce = defenders.reduce((sum, u) => sum + _force(u, false), 0);

  const ratio = defForce === 0 ? 99 : atkForce / defForce;

  let result, atkLoss, defLoss;
  if (ratio >= 1.5) {
    result = 'decisive_victory'; atkLoss = 0; defLoss = 0.5;
  } else if (ratio >= 1.0) {
    result = 'victory';          atkLoss = 0.2; defLoss = 0.6;
  } else if (ratio >= 0.7) {
    result = 'stalemate';        atkLoss = 0.3; defLoss = 0.3;
  } else {
    result = 'defeat';           atkLoss = 0.6; defLoss = 0.1;
  }

  // Apply losses and energy drain
  attackers.forEach(u => {
    u.hp     = Math.max(0, u.hp - atkLoss * 100);
    u.energy = Math.max(0, u.energy - 20);
    addXp(u, result === 'defeat' ? 10 : result === 'stalemate' ? 30 : 100);
  });
  defenders.forEach(u => {
    u.hp     = Math.max(0, u.hp - defLoss * 100);
    u.energy = Math.max(0, u.energy - 20);
    addXp(u, result === 'decisive_victory' ? 10 : 30);
  });

  return { result, ratio: Math.round(ratio * 100) / 100, atkLoss, defLoss };
}

// ── XP / Levelling ────────────────────────────────────────
function addXp(unit, amount) {
  unit.xp += amount;
  while (unit.level < 5 && unit.xp >= XP_THRESHOLDS[unit.level]) {
    unit.level++;
  }
}

function levelName(level) {
  return LEVEL_NAMES[level - 1] || 'Recruta';
}

// ── Unit repair / heal ─────────────────────────────────────
function healUnit(unit, amount) {
  unit.hp = Math.min(100, unit.hp + amount);
}

// ── City type for location ────────────────────────────────
function locationTypeForCity(cityLevel) {
  const map = { 1: 'village', 2: 'city', 3: 'city', 4: 'city', 5: 'metropolis' };
  return map[cityLevel] || 'field';
}

// ── Recruit cost check ───────────────────────────────────
function canRecruit(type, resources) {
  const def = UNIT_DEFS[type];
  if (!def) return false;
  return resources.money >= def.cost && resources.manpower >= def.manpower;
}

function deductRecruitCost(type, resources) {
  const def = UNIT_DEFS[type];
  resources.money    -= def.cost;
  resources.manpower -= def.manpower;
}
