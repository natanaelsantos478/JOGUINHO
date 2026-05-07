// ═══════════════════════════════════════════════════════════
//  units.js — Unit definitions, movement, combat
// ═══════════════════════════════════════════════════════════

// ── Unit definitions ───────────────────────────────────────
const UNIT_DEFS = {
  // GROUND
  infantry:        { label: 'Infantaria',         atk: 1,   def: 1.5, speed: 20,   energyCap: 100, range: 500,  tier: 1, domain: 'ground', cost: 50,  manpower: 10 },
  motorized:       { label: 'Motorizado',          atk: 1.5, def: 1,   speed: 60,   energyCap: 120, range: 800,  tier: 1, domain: 'ground', cost: 80,  manpower: 8  },
  veh_light:       { label: 'Veiculo Leve',        atk: 2,   def: 2,   speed: 80,   energyCap: 150, range: 600,  tier: 2, domain: 'ground', cost: 150, manpower: 5  },
  veh_medium:      { label: 'Veiculo Medio',       atk: 3,   def: 2.5, speed: 50,   energyCap: 180, range: 500,  tier: 2, domain: 'ground', cost: 220, manpower: 5  },
  tank_elite:      { label: 'Tanque de Elite',     atk: 5,   def: 4,   speed: 40,   energyCap: 200, range: 400,  tier: 3, domain: 'ground', cost: 500, manpower: 3  },
  artillery:       { label: 'Artilharia',          atk: 4,   def: 1,   speed: 30,   energyCap: 160, range: 300,  tier: 2, domain: 'ground', cost: 280, manpower: 4,  attackRange: 80 },
  // AIR
  air3_drone:      { label: 'Drone',               atk: 2,   def: 0.5, speed: 200,  energyCap: 80,  range: 1500, tier: 1, domain: 'air',    cost: 120, manpower: 1  },
  air2_fighter:    { label: 'Caca',                atk: 4,   def: 1,   speed: 800,  energyCap: 120, range: 2000, tier: 2, domain: 'air',    cost: 350, manpower: 1  },
  air2_helicopter: { label: 'Helicoptero',         atk: 3,   def: 1.5, speed: 300,  energyCap: 100, range: 600,  tier: 2, domain: 'air',    cost: 250, manpower: 2  },
  air1_stealth:    { label: 'Caca Stealth',        atk: 6,   def: 1,   speed: 1200, energyCap: 150, range: 5000, tier: 3, domain: 'air',    cost: 800, manpower: 1  },
  air_transport:   { label: 'Transporte Aereo',    atk: 0,   def: 0.5, speed: 500,  energyCap: 200, range: 8000, tier: 1, domain: 'air',    cost: 200, manpower: 3  },
  // NAVAL
  nav3_patrol:     { label: 'Patrulha Naval',      atk: 1,   def: 1,   speed: 40,   energyCap: 100, range: 2000, tier: 1, domain: 'naval',  cost: 130, manpower: 5  },
  nav2_frigate:    { label: 'Fragata',             atk: 3,   def: 3,   speed: 30,   energyCap: 200, range: 5000, tier: 2, domain: 'naval',  cost: 400, manpower: 20 },
  nav1_destroyer:  { label: 'Destroier',           atk: 5,   def: 4,   speed: 35,   energyCap: 300, range: 8000, tier: 3, domain: 'naval',  cost: 700, manpower: 30 },
  nav1_carrier:    { label: 'Porta-Avioes',        atk: 2,   def: 5,   speed: 25,   energyCap: 500, range: 99999,tier: 3, domain: 'naval',  cost: 2000,manpower: 80 },
};

// Terrain speed multipliers
const TERRAIN_SPEED = { road: 1.0, plain: 0.7, mountain: 0.4, sea: 0.0, air: 1.0 };

// XP thresholds per level
const XP_THRESHOLDS = [0, 100, 300, 600, 1000];
const LEVEL_NAMES   = ['Recruta', 'Elite', 'Veterano', 'Experiente', 'Lendario'];

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
  return (distKm / def.range) * unit.energyCap;
}

function canMove(unit, destLat, destLng) {
  if (unit.energy <= 5) return { ok: false, reason: 'Sem energia. Unidade em descanso.' };
  const dist = haversineKm(unit.lat, unit.lng, destLat, destLng);
  const drain = energyForDistance(unit, dist);
  if (drain > unit.energy) return { ok: false, reason: `Energia insuficiente (necessario ${Math.round(drain / unit.energyCap * 100)}%, disponivel ${Math.round(unit.energy / unit.energyCap * 100)}%)` };
  return { ok: true, dist, drain };
}

function moveUnit(unit, destLat, destLng) {
  const check = canMove(unit, destLat, destLng);
  if (!check.ok) return check;
  unit.energy = Math.max(0, unit.energy - check.drain);
  unit.lat = destLat;
  unit.lng = destLng;
  unit.resting = unit.energy <= 5;
  return { ok: true };
}

// ── Energy recovery ────────────────────────────────────────
function recoverEnergy(unit, locationType) {
  const rates = { field: 5, camp: 15, village: 25, city: 40, metropolis: 60 };
  const rate = rates[locationType] || 5;
  unit.energy = Math.min(unit.energyCap, unit.energy + rate);
  if (unit.energy > 10) unit.resting = false;
}

// ── Combat ─────────────────────────────────────────────────
function resolveCombat(attackers, defenders) {
  const atkForce = attackers.reduce((sum, u) => {
    const def = UNIT_DEFS[u.type];
    const lvlBonus = 1 + (u.level - 1) * 0.1;
    const energyFactor = Math.max(0.3, u.energy / u.energyCap);
    return sum + def.atk * lvlBonus * energyFactor * u.squadSize;
  }, 0);

  const defForce = defenders.reduce((sum, u) => {
    const def = UNIT_DEFS[u.type];
    const lvlBonus = 1 + (u.level - 1) * 0.1;
    const energyFactor = Math.max(0.3, u.energy / u.energyCap);
    return sum + def.def * lvlBonus * energyFactor * 1.1 * u.squadSize;
  }, 0);

  const ratio = defForce === 0 ? 99 : atkForce / defForce;

  let result, atkLoss, defLoss;
  if (ratio >= 1.5) {
    result = 'decisive_victory'; atkLoss = 0;   defLoss = 0.5;
  } else if (ratio >= 1.0) {
    result = 'victory';          atkLoss = 0.2; defLoss = 0.6;
  } else if (ratio >= 0.7) {
    result = 'stalemate';        atkLoss = 0.3; defLoss = 0.3;
  } else {
    result = 'defeat';           atkLoss = 0.6; defLoss = 0.1;
  }

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
