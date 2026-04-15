// ═══════════════════════════════════════════════════════════
//  government.js — Resources, ministries, structures, events
// ═══════════════════════════════════════════════════════════

// ── Structure definitions ──────────────────────────────────
const STRUCTURE_DEFS = {
  // MILITARY
  mil_barracks:        { label: 'Quartel',               turns: 2,  cost: 200,  req: 'village', emoji: '🏠', effect: 'Produz infantaria' },
  mil_airbase:         { label: 'Base Aérea',            turns: 8,  cost: 800,  req: 'city',    emoji: '✈️', effect: 'Abriga aviões' },
  mil_naval_base:      { label: 'Base Naval',            turns: 10, cost: 1000, req: 'coastal', emoji: '⚓', effect: 'Abriga navios' },
  mil_radar_station:   { label: 'Estação de Radar',      turns: 5,  cost: 400,  req: 'any',     emoji: '📡', effect: '+Visibilidade' },
  mil_missile_silo:    { label: 'Silo de Mísseis',       turns: 15, cost: 2000, req: 'remote',  emoji: '🚀', effect: 'Ataque a longa distância' },
  mil_nuclear_bunker:  { label: 'Bunker Nuclear',        turns: 20, cost: 3000, req: 'any',     emoji: '☢️', effect: '+Proteção extrema' },
  // SUPPORT
  sup_fob_supply:      { label: 'Acampamento',           turns: 1,  cost: 50,   req: 'any',     emoji: '⛺', effect: 'Recuperação em campo' },
  sup_logistics_hub:   { label: 'Centro Logístico',      turns: 3,  cost: 300,  req: 'any',     emoji: '🏭', effect: '-30% tempo de construção próxima' },
  mil_field_hospital:  { label: 'Hospital de Campo',     turns: 4,  cost: 350,  req: 'any',     emoji: '🏥', effect: 'Cura tropas próximas' },
  // CIVILIAN
  civ_hospital:        { label: 'Hospital',              turns: 6,  cost: 500,  req: 'city',    emoji: '🏥', effect: '+Satisfação' },
  civ_power_plant:     { label: 'Usina',                 turns: 8,  cost: 700,  req: 'city',    emoji: '⚡', effect: '+Energia/turno' },
  civ_seaport:         { label: 'Porto Civil',           turns: 10, cost: 900,  req: 'coastal', emoji: '🚢', effect: '+Comércio' },
  civ_airport:         { label: 'Aeroporto Civil',       turns: 12, cost: 1100, req: 'city',    emoji: '✈️', effect: '+Comércio, pode virar base' },
};

// ── Ministry definitions ────────────────────────────────────
const MINISTRY_DEFS = {
  defense:         { label: '🛡️ Defesa',          effect: '+10% ataque por nível' },
  finance:         { label: '💰 Finanças',         effect: '+15% renda por nível' },
  health:          { label: '🏥 Saúde',            effect: '+satisfação' },
  education:       { label: '🎓 Educação',         effect: '+XP das tropas' },
  infrastructure:  { label: '🔧 Infraestrutura',  effect: '-tempo construção, +velocidade' },
  intelligence:    { label: '🔬 Inteligência',    effect: '+espionagem' },
  foreign:         { label: '🌐 Rel. Exteriores', effect: 'facilita alianças' },
};

function ministryCost(currentLevel) {
  return [0, 500, 1200, 2500, 5000][currentLevel] || 9999;
}

// ── Country data (base GDP and population from ISO) ─────────
// Used when starting a new game
const COUNTRY_BASE_DATA = {
  'Brazil':          { gdp: 2081, population: 215000000, iso2: 'br' },
  'United States':   { gdp: 25000,population: 331000000, iso2: 'us' },
  'China':           { gdp: 17700,population: 1410000000,iso2: 'cn' },
  'Russia':          { gdp: 1775, population: 145000000, iso2: 'ru' },
  'Germany':         { gdp: 4100, population: 83000000,  iso2: 'de' },
  'France':          { gdp: 2940, population: 67000000,  iso2: 'fr' },
  'United Kingdom':  { gdp: 3100, population: 67000000,  iso2: 'gb' },
  'Japan':           { gdp: 4230, population: 125000000, iso2: 'jp' },
  'India':           { gdp: 3180, population: 1393000000,iso2: 'in' },
  'Canada':          { gdp: 2140, population: 38000000,  iso2: 'ca' },
  'Australia':       { gdp: 1700, population: 26000000,  iso2: 'au' },
  'South Korea':     { gdp: 1800, population: 52000000,  iso2: 'kr' },
  'Argentina':       { gdp: 630,  population: 45000000,  iso2: 'ar' },
  'Mexico':          { gdp: 1300, population: 130000000, iso2: 'mx' },
  'Turkey':          { gdp: 1000, population: 84000000,  iso2: 'tr' },
  'Saudi Arabia':    { gdp: 1060, population: 35000000,  iso2: 'sa' },
  'Italy':           { gdp: 2170, population: 60000000,  iso2: 'it' },
  'Spain':           { gdp: 1430, population: 47000000,  iso2: 'es' },
  'Iran':            { gdp: 368,  population: 86000000,  iso2: 'ir' },
  'North Korea':     { gdp: 18,   population: 26000000,  iso2: 'kp' },
};

function getCountryBaseData(name) {
  return COUNTRY_BASE_DATA[name] || { gdp: 300, population: 10000000, iso2: 'un' };
}

// ── Initial resources for a country ───────────────────────
function initResources(countryName) {
  const data = getCountryBaseData(countryName);
  return {
    money:    Math.round(data.gdp * 10),
    oil:      500,
    food:     1000,
    energy:   800,
    manpower: Math.round(data.population / 100000),
  };
}

function incomePerTurn(resources, ministries, atWarCount) {
  const base = Math.round(resources.money * 0.05); // 5% of current money as income
  const finBonus = 1 + (ministries.finance - 1) * 0.15;
  const warPenalty = 1 - atWarCount * 0.1;
  return Math.max(10, Math.round(base * finBonus * Math.max(0.3, warPenalty)));
}

function expensesPerTurn(units) {
  // Each unit costs money per turn based on tier
  return units.reduce((sum, u) => {
    const def = UNIT_DEFS[u.type];
    return sum + (def ? def.tier * 5 : 5);
  }, 0);
}

// ── Turn processing ────────────────────────────────────────
function processTurn(state) {
  const events = [];

  // Income
  const atWarCount = (state.at_war_with || []).length;
  const income = incomePerTurn(state.resources, state.ministries, atWarCount);
  const expenses = expensesPerTurn(state.units || []);
  state.resources.money = Math.max(0, state.resources.money + income - expenses);

  // Oil consumption (vehicles + air)
  const oilDrain = (state.units || []).filter(u => ['motorized','veh_light','veh_medium','tank_elite','air3_drone','air2_fighter','air2_helicopter','air1_stealth','air_transport'].includes(u.type)).length * 3;
  state.resources.oil = Math.max(0, state.resources.oil - oilDrain);

  // Food consumption
  const foodDrain = (state.units || []).length * 2;
  state.resources.food = Math.max(0, state.resources.food - foodDrain);

  // Natural recovery
  state.resources.oil    = Math.min(9999, state.resources.oil    + 30);
  state.resources.food   = Math.min(9999, state.resources.food   + 50);
  state.resources.energy = Math.min(9999, state.resources.energy + 20);
  state.resources.manpower = Math.min(9999, state.resources.manpower + 5);

  // Civ power plants
  const powerPlants = (state.structures || []).filter(s => s.type === 'civ_power_plant' && s.complete).length;
  state.resources.energy += powerPlants * 30;

  // Seaports boost
  const seaports = (state.structures || []).filter(s => s.type === 'civ_seaport' && s.complete).length;
  state.resources.money += seaports * 50;

  // Energy recovery for units
  (state.units || []).forEach(u => recoverEnergy(u, 'field'));

  // Satisfaction
  updateSatisfaction(state, atWarCount, income, expenses);

  // Random events (5% chance)
  if (Math.random() < 0.05) {
    const ev = randomEvent(state);
    if (ev) events.push(ev);
  }

  // Advance constructions
  progressConstruction(state, events);

  // Field hospital healing
  const hospitals = (state.structures || []).filter(s => s.type === 'mil_field_hospital' && s.complete);
  hospitals.forEach(h => {
    (state.units || []).filter(u => u.country === state.player_country && haversineKm(u.lat, u.lng, h.lat, h.lng) < 100).forEach(u => healUnit(u, 15));
  });

  state.game_log.unshift(`[Turno ${state.turn}] Renda: +${income}💰, Despesas: -${expenses}💰`);
  events.forEach(e => state.game_log.unshift(e));

  state.turn++;
  return events;
}

// ── Satisfaction ───────────────────────────────────────────
function updateSatisfaction(state, atWarCount, income, expenses) {
  if (!state.satisfaction) state.satisfaction = 50;
  let delta = 0;
  if (atWarCount === 0) delta += 1;
  else delta -= atWarCount * 3;
  if (income > expenses * 1.5) delta += 1;
  if (income < expenses) delta -= 2;
  const hospitals = (state.structures || []).filter(s => s.type === 'civ_hospital' && s.complete).length;
  delta += hospitals * 0.5;
  const healthMin = state.ministries.health || 1;
  delta += (healthMin - 1) * 0.5;
  state.satisfaction = Math.max(0, Math.min(100, state.satisfaction + delta));
}

// ── Random events ──────────────────────────────────────────
const RANDOM_EVENTS = [
  {
    id: 'disease',
    label: '🦠 Surto de Doença',
    apply(state) {
      state.satisfaction = Math.max(0, (state.satisfaction || 50) - 8);
      state.resources.manpower = Math.max(0, state.resources.manpower - 10);
      return `[EVENTO] 🦠 Surto de doença! -8 satisfação, -10 manpower`;
    }
  },
  {
    id: 'economic_crisis',
    label: '📉 Crise Econômica',
    apply(state) {
      const loss = Math.round(state.resources.money * 0.1);
      state.resources.money = Math.max(0, state.resources.money - loss);
      return `[EVENTO] 📉 Crise econômica! -${loss}💰`;
    }
  },
  {
    id: 'natural_disaster',
    label: '🌪️ Desastre Natural',
    apply(state) {
      state.satisfaction = Math.max(0, (state.satisfaction || 50) - 5);
      const completed = (state.structures || []).filter(s => s.complete);
      if (completed.length > 0) {
        const target = completed[Math.floor(Math.random() * completed.length)];
        target.complete = false;
        target.turnsLeft = 2;
        return `[EVENTO] 🌪️ Desastre natural! ${target.label} danificada.`;
      }
      return `[EVENTO] 🌪️ Desastre natural! -5 satisfação`;
    }
  },
  {
    id: 'boom',
    label: '📈 Boom Econômico',
    apply(state) {
      const gain = Math.round(state.resources.money * 0.15);
      state.resources.money += gain;
      state.satisfaction = Math.min(100, (state.satisfaction || 50) + 5);
      return `[EVENTO] 📈 Boom econômico! +${gain}💰, +5 satisfação`;
    }
  },
  {
    id: 'volunteer',
    label: '🙋 Voluntários',
    apply(state) {
      state.resources.manpower += 20;
      return `[EVENTO] 🙋 Onda de voluntários! +20 manpower`;
    }
  },
  {
    id: 'espionage',
    label: '🕵️ Espionagem Detectada',
    apply(state) {
      const loss = Math.round((state.resources.oil || 0) * 0.05);
      state.resources.oil = Math.max(0, state.resources.oil - loss);
      return `[EVENTO] 🕵️ Espionagem detectada! -${loss}🛢️`;
    }
  },
];

function randomEvent(state) {
  const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  return ev.apply(state);
}

// ── Constructions ──────────────────────────────────────────
function canBuild(type, state, lat, lng) {
  const def = STRUCTURE_DEFS[type];
  if (!def) return { ok: false, reason: 'Tipo inválido' };
  if (state.resources.money < def.cost) return { ok: false, reason: `Sem dinheiro (precisa ${def.cost}💰)` };
  return { ok: true };
}

function startConstruction(type, state, lat, lng) {
  const def = STRUCTURE_DEFS[type];
  const check = canBuild(type, state, lat, lng);
  if (!check.ok) return check;

  state.resources.money -= def.cost;

  // Check for logistics hub nearby (-30%)
  const hub = (state.structures || []).find(s => s.type === 'sup_logistics_hub' && s.complete && haversineKm(lat, lng, s.lat, s.lng) < 200);
  const turns = hub ? Math.max(1, Math.round(def.turns * 0.7)) : def.turns;

  const structure = {
    id:        `s${Date.now()}`,
    type,
    label:     def.label,
    emoji:     def.emoji,
    lat,
    lng,
    country:   state.player_country,
    turnsLeft: turns,
    complete:  false,
  };

  if (!state.structures) state.structures = [];
  state.structures.push(structure);
  state.game_log.unshift(`[Turno ${state.turn}] Construção iniciada: ${def.emoji} ${def.label} (${turns} turnos)`);
  return { ok: true, structure };
}

function progressConstruction(state, events) {
  (state.structures || []).forEach(s => {
    if (!s.complete) {
      s.turnsLeft--;
      if (s.turnsLeft <= 0) {
        s.complete = true;
        s.turnsLeft = 0;
        const msg = `[CONSTRUÇÃO] ${s.emoji} ${s.label} concluída!`;
        events.push(msg);
      }
    }
  });
}

// ── Ministry upgrade ───────────────────────────────────────
function upgradeMinistry(name, state) {
  if (!state.ministries) state.ministries = {};
  const current = state.ministries[name] || 1;
  if (current >= 5) return { ok: false, reason: 'Nível máximo atingido' };
  const cost = ministryCost(current);
  if (state.resources.money < cost) return { ok: false, reason: `Sem fundos (precisa ${cost}💰)` };
  state.resources.money -= cost;
  state.ministries[name] = current + 1;
  const def = MINISTRY_DEFS[name];
  state.game_log.unshift(`[Turno ${state.turn}] ${def.label} atualizado para nível ${current + 1}`);
  return { ok: true };
}

// ── Initial ministry state ─────────────────────────────────
function initMinistries() {
  return { defense: 1, finance: 1, health: 1, education: 1, infrastructure: 1, intelligence: 1, foreign: 1 };
}
