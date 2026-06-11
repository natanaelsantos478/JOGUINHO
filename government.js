// ═══════════════════════════════════════════════════════════
//  government.js — Resources, ministries, structures, arsenal,
//  supplies, events. Every structure/weapon/supply/event sprite
//  from the sheets is represented here.
// ═══════════════════════════════════════════════════════════

// ── Structure definitions — all 48 sprites ─────────────────
// fx: passive per-turn effects when complete
//     money/oil/food/energy/manpower: +N per turn
//     satisfaction: +N per turn  ·  heal: HP/turn to units within 100km
const STRUCTURE_DEFS = {
  // ── MILITAR (sheet_structures_military.png — 16) ──
  mil_army_hq:           { label: 'QG do Exército',        turns: 12, cost: 1500, sheet: 'sheet_structures_military.png', emoji: '🎖️', effect: '+15% ataque global',        fx: {} },
  mil_nuclear_bunker:    { label: 'Bunker Nuclear',        turns: 20, cost: 3000, sheet: 'sheet_structures_military.png', emoji: '☢️', effect: 'Proteção extrema',          fx: {} },
  mil_missile_silo:      { label: 'Silo de Mísseis',       turns: 15, cost: 2000, sheet: 'sheet_structures_military.png', emoji: '🚀', effect: 'Ataque a longa distância',  fx: {} },
  mil_radar_station:     { label: 'Estação de Radar',      turns: 5,  cost: 400,  sheet: 'sheet_structures_military.png', emoji: '📡', effect: '+Visibilidade',             fx: {} },
  mil_airbase:           { label: 'Base Aérea',            turns: 8,  cost: 800,  sheet: 'sheet_structures_military.png', emoji: '✈️', effect: 'Abriga e reabastece aviões',fx: {} },
  mil_naval_base:        { label: 'Base Naval',            turns: 10, cost: 1000, sheet: 'sheet_structures_military.png', emoji: '⚓', effect: 'Abriga e repara navios',    fx: {} },
  mil_barracks:          { label: 'Quartel',               turns: 2,  cost: 200,  sheet: 'sheet_structures_military.png', emoji: '🏠', effect: '+3 manpower/turno',         fx: { manpower: 3 } },
  mil_antiair_gun:       { label: 'Bateria Antiaérea',     turns: 4,  cost: 350,  sheet: 'sheet_structures_military.png', emoji: '🎯', effect: 'Defesa contra aviões',      fx: {} },
  mil_watchtower:        { label: 'Torre de Vigia',        turns: 1,  cost: 80,   sheet: 'sheet_structures_military.png', emoji: '🗼', effect: 'Alerta antecipado',         fx: {} },
  mil_border_checkpoint: { label: 'Posto de Fronteira',    turns: 2,  cost: 120,  sheet: 'sheet_structures_military.png', emoji: '🛂', effect: 'Controle de fronteira',     fx: {} },
  mil_detention:         { label: 'Centro de Detenção',    turns: 5,  cost: 300,  sheet: 'sheet_structures_military.png', emoji: '🔒', effect: '+Segurança interna',        fx: {} },
  mil_command_bunker:    { label: 'Bunker de Comando',     turns: 10, cost: 1200, sheet: 'sheet_structures_military.png', emoji: '🪖', effect: 'Comando protegido',         fx: {} },
  mil_armory:            { label: 'Arsenal Militar',       turns: 4,  cost: 450,  sheet: 'sheet_structures_military.png', emoji: '🔫', effect: '-10% custo de armas',       fx: {} },
  mil_field_hospital:    { label: 'Hospital de Campo',     turns: 4,  cost: 350,  sheet: 'sheet_structures_military.png', emoji: '🏥', effect: 'Cura tropas próximas',      fx: { heal: 15 } },
  mil_fuel_depot:        { label: 'Depósito de Combustível', turns: 3, cost: 280, sheet: 'sheet_structures_military.png', emoji: '⛽', effect: '+20 petróleo/turno',        fx: { oil: 20 } },
  mil_ammo_factory:      { label: 'Fábrica de Munição',    turns: 7,  cost: 650,  sheet: 'sheet_structures_military.png', emoji: '💥', effect: 'Produz munição',            fx: { money: 15 } },

  // ── SUPORTE (sheet_structures_support.png — 16) ──
  sup_fob_supply:        { label: 'Base Avançada (FOB)',   turns: 1,  cost: 50,   sheet: 'sheet_structures_support.png', emoji: '⛺', effect: 'Recuperação em campo',       fx: {} },
  sup_engineer_depot:    { label: 'Depósito de Engenharia',turns: 3,  cost: 250,  sheet: 'sheet_structures_support.png', emoji: '🔧', effect: '-20% tempo de obras',        fx: {} },
  sup_logistics_hub:     { label: 'Centro Logístico',      turns: 3,  cost: 300,  sheet: 'sheet_structures_support.png', emoji: '🏭', effect: '-30% tempo obras próximas',  fx: {} },
  sup_farp_helipad:      { label: 'Heliponto FARP',        turns: 2,  cost: 180,  sheet: 'sheet_structures_support.png', emoji: '🚁', effect: 'Reabastece helicópteros',    fx: {} },
  sup_sat_uplink:        { label: 'Uplink de Satélite',    turns: 6,  cost: 550,  sheet: 'sheet_structures_support.png', emoji: '📶', effect: '+Inteligência',              fx: {} },
  sup_sigint_station:    { label: 'Estação SIGINT',        turns: 7,  cost: 600,  sheet: 'sheet_structures_support.png', emoji: '🛰️', effect: 'Intercepta comunicações',    fx: {} },
  sup_data_center:       { label: 'Data Center Militar',   turns: 8,  cost: 750,  sheet: 'sheet_structures_support.png', emoji: '💻', effect: '+Cyber defesa',              fx: { money: 20 } },
  sup_weather_station:   { label: 'Estação Meteorológica', turns: 3,  cost: 200,  sheet: 'sheet_structures_support.png', emoji: '🌦️', effect: 'Previsão para operações',    fx: {} },
  sup_nuclear_plant:     { label: 'Usina Nuclear',         turns: 16, cost: 2500, sheet: 'sheet_structures_support.png', emoji: '⚛️', effect: '+80 energia/turno',          fx: { energy: 80 } },
  sup_solar_farm:        { label: 'Fazenda Solar',         turns: 5,  cost: 400,  sheet: 'sheet_structures_support.png', emoji: '☀️', effect: '+25 energia/turno',          fx: { energy: 25 } },
  sup_wind_farm:         { label: 'Parque Eólico',         turns: 6,  cost: 450,  sheet: 'sheet_structures_support.png', emoji: '🌬️', effect: '+30 energia/turno',          fx: { energy: 30 } },
  sup_hydro_dam:         { label: 'Hidrelétrica',          turns: 14, cost: 1800, sheet: 'sheet_structures_support.png', emoji: '💧', effect: '+60 energia/turno',          fx: { energy: 60 } },
  sup_water_treatment:   { label: 'Tratamento de Água',    turns: 5,  cost: 350,  sheet: 'sheet_structures_support.png', emoji: '🚰', effect: '+1 satisfação/turno',        fx: { satisfaction: 1 } },
  sup_food_storage:      { label: 'Armazém de Alimentos',  turns: 3,  cost: 220,  sheet: 'sheet_structures_support.png', emoji: '🌾', effect: '+40 comida/turno',           fx: { food: 40 } },
  sup_research_lab:      { label: 'Laboratório de Pesquisa', turns: 9, cost: 900, sheet: 'sheet_structures_support.png', emoji: '🔬', effect: '+XP das tropas',             fx: {} },
  sup_training_academy:  { label: 'Academia de Treinamento', turns: 6, cost: 500, sheet: 'sheet_structures_support.png', emoji: '🎓', effect: '+5 manpower/turno',          fx: { manpower: 5 } },

  // ── CIVIL (sheet_structures_civilian.png — 16) ──
  civ_village:           { label: 'Vila',                  turns: 4,  cost: 300,  sheet: 'sheet_structures_civilian.png', emoji: '🏘️', effect: '+2 manpower, +10 comida',   fx: { manpower: 2, food: 10 } },
  civ_town:              { label: 'Cidade Pequena',        turns: 8,  cost: 700,  sheet: 'sheet_structures_civilian.png', emoji: '🏙️', effect: '+30💰, +4 manpower',        fx: { money: 30, manpower: 4 } },
  civ_city:              { label: 'Cidade',                turns: 12, cost: 1400, sheet: 'sheet_structures_civilian.png', emoji: '🌆', effect: '+60💰, +6 manpower',        fx: { money: 60, manpower: 6 } },
  civ_metropolis:        { label: 'Metrópole',             turns: 20, cost: 3000, sheet: 'sheet_structures_civilian.png', emoji: '🌇', effect: '+120💰, +10 manpower',      fx: { money: 120, manpower: 10 } },
  civ_airport:           { label: 'Aeroporto Civil',       turns: 12, cost: 1100, sheet: 'sheet_structures_civilian.png', emoji: '✈️', effect: '+40💰, pode virar base',    fx: { money: 40 } },
  civ_seaport:           { label: 'Porto Civil',           turns: 10, cost: 900,  sheet: 'sheet_structures_civilian.png', emoji: '🚢', effect: '+50💰 comércio',            fx: { money: 50 } },
  civ_highway:           { label: 'Rodovia',               turns: 6,  cost: 500,  sheet: 'sheet_structures_civilian.png', emoji: '🛣️', effect: '+Velocidade terrestre',     fx: {} },
  civ_railway:           { label: 'Ferrovia',              turns: 9,  cost: 800,  sheet: 'sheet_structures_civilian.png', emoji: '🚆', effect: '+Logística, +20💰',          fx: { money: 20 } },
  civ_oil_refinery:      { label: 'Refinaria de Petróleo', turns: 11, cost: 1200, sheet: 'sheet_structures_civilian.png', emoji: '🛢️', effect: '+50 petróleo/turno',        fx: { oil: 50 } },
  civ_power_plant:       { label: 'Usina Elétrica',        turns: 8,  cost: 700,  sheet: 'sheet_structures_civilian.png', emoji: '⚡', effect: '+30 energia/turno',         fx: { energy: 30 } },
  civ_telecom_tower:     { label: 'Torre de Telecom',      turns: 4,  cost: 320,  sheet: 'sheet_structures_civilian.png', emoji: '📡', effect: '+Comunicações, +10💰',      fx: { money: 10 } },
  civ_data_center:       { label: 'Data Center',           turns: 9,  cost: 850,  sheet: 'sheet_structures_civilian.png', emoji: '🖥️', effect: '+35💰/turno',                fx: { money: 35 } },
  civ_hospital:          { label: 'Hospital',              turns: 6,  cost: 500,  sheet: 'sheet_structures_civilian.png', emoji: '🏥', effect: '+1 satisfação/turno',       fx: { satisfaction: 1 } },
  civ_university:        { label: 'Universidade',          turns: 10, cost: 950,  sheet: 'sheet_structures_civilian.png', emoji: '🎓', effect: '+satisfação, +XP',          fx: { satisfaction: 0.5 } },
  civ_police_hq:         { label: 'Quartel de Polícia',    turns: 5,  cost: 380,  sheet: 'sheet_structures_civilian.png', emoji: '🚓', effect: '+Ordem interna',            fx: { satisfaction: 0.5 } },
  civ_government:        { label: 'Palácio do Governo',    turns: 15, cost: 2200, sheet: 'sheet_structures_civilian.png', emoji: '🏛️', effect: '+2 satisfação, +50💰',      fx: { satisfaction: 2, money: 50 } },
};

const STRUCTURE_CATEGORIES = {
  MILITAR: Object.keys(STRUCTURE_DEFS).filter(k => k.startsWith('mil_')),
  SUPORTE: Object.keys(STRUCTURE_DEFS).filter(k => k.startsWith('sup_')),
  CIVIL:   Object.keys(STRUCTURE_DEFS).filter(k => k.startsWith('civ_')),
};

// ── Arsenal — all 16 weapon sprites ─────────────────────────
// Passive combat bonuses while owned (stacking, capped in arsenalAtkBonus)
const WEAPON_DEFS = {
  wpn_nuclear_warhead:  { label: 'Ogiva Nuclear',         cost: 5000, atk: 0.20, desc: 'Dissuasão máxima · +20% ataque' },
  wpn_cruise_missile:   { label: 'Míssil de Cruzeiro',    cost: 1200, atk: 0.08, desc: 'Ataque de precisão · +8% ataque' },
  wpn_bunker_buster:    { label: 'Bomba Anti-Bunker',     cost: 900,  atk: 0.06, desc: 'Penetra fortificações · +6% ataque' },
  wpn_cluster_bomb:     { label: 'Bomba de Fragmentação', cost: 700,  atk: 0.05, desc: 'Área ampla · +5% ataque' },
  wpn_torpedo:          { label: 'Torpedo Pesado',        cost: 600,  atk: 0.04, desc: 'Guerra naval · +4% ataque' },
  wpn_depth_charge:     { label: 'Carga de Profundidade', cost: 400,  atk: 0.03, desc: 'Anti-submarino · +3% ataque' },
  wpn_antiship_missile: { label: 'Míssil Antinavio',      cost: 800,  atk: 0.06, desc: 'Afunda navios · +6% ataque' },
  wpn_antitank_missile: { label: 'Míssil Anticarro',      cost: 500,  atk: 0.04, desc: 'Destrói blindados · +4% ataque' },
  wpn_landmine:         { label: 'Mina Terrestre',        cost: 150,  atk: 0.01, desc: 'Defesa de área · +1% ataque' },
  wpn_antitank_mine:    { label: 'Mina Anticarro',        cost: 250,  atk: 0.02, desc: 'Bloqueia blindados · +2% ataque' },
  wpn_naval_mine:       { label: 'Mina Naval',            cost: 300,  atk: 0.02, desc: 'Nega rotas marítimas · +2% ataque' },
  wpn_magnetic_mine:    { label: 'Mina Magnética',        cost: 350,  atk: 0.02, desc: 'Detecção magnética · +2% ataque' },
  wpn_artillery_shell:  { label: 'Munição de Artilharia', cost: 200,  atk: 0.02, desc: 'Suprime posições · +2% ataque' },
  wpn_mortar:           { label: 'Morteiro',              cost: 180,  atk: 0.01, desc: 'Apoio de infantaria · +1% ataque' },
  wpn_rpg:              { label: 'Lança-Foguetes RPG',    cost: 220,  atk: 0.02, desc: 'Antiblindagem leve · +2% ataque' },
  wpn_manpads:          { label: 'MANPADS Antiaéreo',     cost: 450,  atk: 0.03, desc: 'Derruba aeronaves · +3% ataque' },
};

function arsenalAtkBonus(state) {
  const a = state.arsenal || {};
  let bonus = 0;
  Object.entries(a).forEach(([k, qty]) => {
    const def = WEAPON_DEFS[k];
    if (def) bonus += def.atk * Math.min(qty, 3); // each weapon stacks up to 3×
  });
  return Math.min(bonus, 0.6); // global cap +60%
}

function buyWeapon(type, state) {
  const def = WEAPON_DEFS[type];
  if (!def) return { ok: false, reason: 'Arma inválida' };
  const hasArmory = (state.structures || []).some(s => s.type === 'mil_armory' && s.complete);
  const cost = hasArmory ? Math.round(def.cost * 0.9) : def.cost;
  if (state.resources.money < cost) return { ok: false, reason: `Sem fundos (precisa ${cost}💰)` };
  state.resources.money -= cost;
  if (!state.arsenal) state.arsenal = {};
  state.arsenal[type] = (state.arsenal[type] || 0) + 1;
  state.game_log.unshift(`[Turno ${state.turn}] Arsenal: ${def.label} adquirido`);
  return { ok: true };
}

// ── Suprimentos — all 16 supply sprites ─────────────────────
// Instant-use consumables
const SUPPLY_DEFS = {
  sup_airdrop_crate:   { label: 'Suprimento Aéreo',      cost: 300, desc: '+30 energia em todas as tropas',    use(s) { (s.units||[]).filter(u=>u.country===s.player_country).forEach(u => u.energy = Math.min(u.energyCap, u.energy + u.energyCap*0.3)); return 'Suprimentos lançados! +30% energia nas tropas'; } },
  sup_ammo_crates:     { label: 'Caixas de Munição',     cost: 250, desc: 'Tropas recuperam prontidão',        use(s) { (s.units||[]).filter(u=>u.country===s.player_country).forEach(u => u.inCombat = false); return 'Munição distribuída! Tropas prontas'; } },
  sup_fuel_drum:       { label: 'Tambores de Combustível', cost: 200, desc: '+200 petróleo',                   use(s) { s.resources.oil += 200; return '+200 petróleo'; } },
  sup_food_boxes:      { label: 'Rações de Combate',     cost: 150, desc: '+300 comida',                       use(s) { s.resources.food += 300; return '+300 comida'; } },
  sup_field_radio:     { label: 'Rádio de Campo',        cost: 180, desc: '+50 XP em todas as tropas',         use(s) { (s.units||[]).filter(u=>u.country===s.player_country).forEach(u => addXp(u, 50)); return '+50 XP nas tropas'; } },
  sup_sat_dish:        { label: 'Antena de Satélite',    cost: 350, desc: 'Revela inimigos (intel)',           use(s) { return 'Satélite ativo — posições inimigas atualizadas'; } },
  sup_generator:       { label: 'Gerador de Campo',      cost: 220, desc: '+250 energia',                      use(s) { s.resources.energy += 250; return '+250 energia'; } },
  sup_water_purifier:  { label: 'Purificador de Água',   cost: 160, desc: '+2 satisfação',                     use(s) { s.satisfaction = Math.min(100, (s.satisfaction||50)+2); return '+2 satisfação'; } },
  sup_medical_kit:     { label: 'Kit Médico',            cost: 200, desc: '+20 HP em todas as tropas',         use(s) { (s.units||[]).filter(u=>u.country===s.player_country).forEach(u => healUnit(u, 20)); return '+20 HP nas tropas'; } },
  sup_blood_plasma:    { label: 'Plasma Sanguíneo',      cost: 280, desc: '+35 HP em todas as tropas',         use(s) { (s.units||[]).filter(u=>u.country===s.player_country).forEach(u => healUnit(u, 35)); return '+35 HP nas tropas'; } },
  sup_stretcher:       { label: 'Equipe de Resgate',     cost: 120, desc: 'Revive tropas críticas (+15 HP <30%)', use(s) { (s.units||[]).filter(u=>u.country===s.player_country && u.hp<30).forEach(u => healUnit(u, 15)); return 'Feridos resgatados'; } },
  sup_defibrillator:   { label: 'Desfibrilador',         cost: 240, desc: 'Cura total na tropa mais ferida',   use(s) { const m=(s.units||[]).filter(u=>u.country===s.player_country).sort((a,b)=>a.hp-b.hp)[0]; if(m) m.hp=100; return m?`${m.name} totalmente curado`:'Sem tropas'; } },
  sup_barbed_wire:     { label: 'Arame Farpado',         cost: 100, desc: '+defesa temporária (1 satisfação)', use(s) { s.satisfaction = Math.min(100,(s.satisfaction||50)+1); return 'Defesas reforçadas'; } },
  sup_sandbags:        { label: 'Sacos de Areia',        cost: 80,  desc: '+defesa temporária (1 satisfação)', use(s) { s.satisfaction = Math.min(100,(s.satisfaction||50)+1); return 'Posições fortificadas'; } },
  sup_field_tent:      { label: 'Acampamento de Campo',  cost: 140, desc: '+15 energia nas tropas',            use(s) { (s.units||[]).filter(u=>u.country===s.player_country).forEach(u => recoverEnergy(u, 'camp')); return 'Tropas descansadas'; } },
  sup_pontoon_bridge:  { label: 'Ponte Flutuante',       cost: 320, desc: '+30 manpower (engenharia)',         use(s) { s.resources.manpower += 30; return '+30 manpower'; } },
};

function useSupply(type, state) {
  const def = SUPPLY_DEFS[type];
  if (!def) return { ok: false, reason: 'Item inválido' };
  if (state.resources.money < def.cost) return { ok: false, reason: `Sem fundos (precisa ${def.cost}💰)` };
  state.resources.money -= def.cost;
  const msg = def.use(state);
  state.game_log.unshift(`[Turno ${state.turn}] Suprimento: ${def.label} — ${msg}`);
  return { ok: true, msg };
}

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

  // Oil consumption (anything that isn't infantry burns fuel)
  const oilDrain = (state.units || []).filter(u => {
    const def = UNIT_DEFS[u.type];
    return def && def.sheet !== 'sheet_soldiers.png';
  }).length * 3;
  state.resources.oil = Math.max(0, state.resources.oil - oilDrain);

  // Food consumption
  const foodDrain = (state.units || []).length * 2;
  state.resources.food = Math.max(0, state.resources.food - foodDrain);

  // Natural recovery
  state.resources.oil    = Math.min(9999, state.resources.oil    + 30);
  state.resources.food   = Math.min(9999, state.resources.food   + 50);
  state.resources.energy = Math.min(9999, state.resources.energy + 20);
  state.resources.manpower = Math.min(9999, state.resources.manpower + 5);

  // Structure passive effects (generic fx processing)
  (state.structures || []).filter(s => s.complete).forEach(s => {
    const def = STRUCTURE_DEFS[s.type];
    if (!def || !def.fx) return;
    const fx = def.fx;
    if (fx.money)    state.resources.money    += fx.money;
    if (fx.oil)      state.resources.oil      += fx.oil;
    if (fx.food)     state.resources.food     += fx.food;
    if (fx.energy)   state.resources.energy   += fx.energy;
    if (fx.manpower) state.resources.manpower += fx.manpower;
    if (fx.satisfaction) state.satisfaction = Math.min(100, (state.satisfaction || 50) + fx.satisfaction);
    if (fx.heal) {
      (state.units || []).filter(u => u.country === state.player_country && haversineKm(u.lat, u.lng, s.lat, s.lng) < 100)
        .forEach(u => healUnit(u, fx.heal));
    }
  });

  // Energy recovery for units
  (state.units || []).forEach(u => recoverEnergy(u, 'field'));

  // Satisfaction
  updateSatisfaction(state, atWarCount, income, expenses);

  // Random events (8% chance)
  if (Math.random() < 0.08) {
    const ev = randomEvent(state);
    if (ev) events.push(ev);
  }

  // Advance constructions
  progressConstruction(state, events);

  state.game_log.unshift(`[Turno ${state.turn}] Renda: +${income}💰, Despesas: -${expenses}💰`);
  events.forEach(e => state.game_log.unshift(e));

  // Advance active research projects
  _progressResearch(state, events);

  state.turn++;
  return events;
}

function _progressResearch(state, events) {
  if (typeof RESEARCH_TREE === 'undefined') return;
  const research = state.research || {};
  Object.entries(research).forEach(([catKey, catState]) => {
    const activeKey = catState._active;
    if (!activeKey) return;
    const cat  = RESEARCH_TREE[catKey];
    const line = cat && cat.lines && cat.lines[activeKey];
    if (!line) return;
    const lvl = catState[activeKey] || 0;
    if (lvl >= line.levels.length) { catState._active = null; return; }
    catState._turnsLeft = Math.max(0, (catState._turnsLeft || 0) - 1);
    if (catState._turnsLeft <= 0) {
      catState[activeKey] = lvl + 1;
      catState._active    = null;
      const level = line.levels[lvl];
      events.push(`[PESQUISA] 🔬 ${level.name} concluída!`);
    }
  });
}

// ── Satisfaction ───────────────────────────────────────────
function updateSatisfaction(state, atWarCount, income, expenses) {
  if (!state.satisfaction) state.satisfaction = 50;
  let delta = 0;
  if (atWarCount === 0) delta += 1;
  else delta -= atWarCount * 3;
  if (income > expenses * 1.5) delta += 1;
  if (income < expenses) delta -= 2;
  const healthMin = state.ministries.health || 1;
  delta += (healthMin - 1) * 0.5;
  state.satisfaction = Math.max(0, Math.min(100, state.satisfaction + delta));
}

// ── Random events — all 16 event sprites ───────────────────
const RANDOM_EVENTS = [
  { id: 'war_breakout',   icon: 'evt_war_explosion',      apply(s) { s.satisfaction = Math.max(0,(s.satisfaction||50)-4); return `[EVENTO] Tensão militar global! -4 satisfação`; } },
  { id: 'peace_talks',    icon: 'evt_peace_handshake',    apply(s) { s.satisfaction = Math.min(100,(s.satisfaction||50)+5); return `[EVENTO] Negociações de paz avançam! +5 satisfação`; } },
  { id: 'alliance_offer', icon: 'evt_alliance_flag',      apply(s) { s.resources.money += 200; return `[EVENTO] Acordo comercial com aliados! +200💰`; } },
  { id: 'betrayal',       icon: 'evt_betrayal_sword',     apply(s) { const l = Math.round(s.resources.money*0.05); s.resources.money=Math.max(0,s.resources.money-l); return `[EVENTO] Traição diplomática! -${l}💰`; } },
  { id: 'disease',        icon: 'evt_disease_biohazard',  apply(s) { s.satisfaction = Math.max(0,(s.satisfaction||50)-8); s.resources.manpower=Math.max(0,s.resources.manpower-10); return `[EVENTO] Surto de doença! -8 satisfação, -10 manpower`; } },
  { id: 'famine',         icon: 'evt_famine_coin',        apply(s) { s.resources.food = Math.max(0, s.resources.food - 200); return `[EVENTO] Escassez de alimentos! -200 comida`; } },
  { id: 'disaster',       icon: 'evt_disaster_storm',     apply(s) { s.satisfaction = Math.max(0,(s.satisfaction||50)-5); const c=(s.structures||[]).filter(x=>x.complete); if(c.length){const t=c[Math.floor(Math.random()*c.length)];t.complete=false;t.turnsLeft=2;return `[EVENTO] Desastre natural! ${t.label} danificada`;} return `[EVENTO] Desastre natural! -5 satisfação`; } },
  { id: 'econ_crisis',    icon: 'evt_econ_crisis',        apply(s) { const l = Math.round(s.resources.money*0.1); s.resources.money=Math.max(0,s.resources.money-l); return `[EVENTO] Crise econômica! -${l}💰`; } },
  { id: 'revolution',     icon: 'evt_revolution_fist',    apply(s) { s.satisfaction = Math.max(0,(s.satisfaction||50)-10); return `[EVENTO] Protestos em massa! -10 satisfação`; } },
  { id: 'coup_attempt',   icon: 'evt_coup_crown',         apply(s) { s.satisfaction = Math.max(0,(s.satisfaction||50)-6); s.resources.manpower=Math.max(0,s.resources.manpower-15); return `[EVENTO] Tentativa de golpe frustrada! -6 satisfação`; } },
  { id: 'election',       icon: 'evt_election_ballot',    apply(s) { s.satisfaction = Math.min(100,(s.satisfaction||50)+6); return `[EVENTO] Eleições democráticas! +6 satisfação`; } },
  { id: 'assassination',  icon: 'evt_assassination',      apply(s) { s.satisfaction = Math.max(0,(s.satisfaction||50)-7); return `[EVENTO] Atentado contra autoridade! -7 satisfação`; } },
  { id: 'nuclear_scare',  icon: 'evt_nuclear_radiation',  apply(s) { s.satisfaction = Math.max(0,(s.satisfaction||50)-5); return `[EVENTO] Alerta nuclear! -5 satisfação`; } },
  { id: 'cyber_attack',   icon: 'evt_cyber_attack',       apply(s) { const l=Math.round(s.resources.energy*0.15); s.resources.energy=Math.max(0,s.resources.energy-l); return `[EVENTO] Ataque cibernético! -${l} energia`; } },
  { id: 'terrorism',      icon: 'evt_terrorist_bomb',     apply(s) { s.satisfaction = Math.max(0,(s.satisfaction||50)-6); return `[EVENTO] Atentado terrorista! -6 satisfação`; } },
  { id: 'insurgency',     icon: 'evt_insurgency',         apply(s) { s.resources.manpower=Math.max(0,s.resources.manpower-20); return `[EVENTO] Insurgência armada! -20 manpower`; } },
];

function randomEvent(state) {
  const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  return ev.apply(state);
}

// Find the event icon sprite for a log message
function logEventIcon(msg) {
  if (!msg.includes('[EVENTO]')) return null;
  const KEYWORDS = [
    ['doença', 'evt_disease_biohazard'], ['Crise econômica', 'evt_econ_crisis'],
    ['Desastre', 'evt_disaster_storm'], ['Boom', 'evt_alliance_flag'],
    ['paz', 'evt_peace_handshake'], ['Traição', 'evt_betrayal_sword'],
    ['alimentos', 'evt_famine_coin'], ['Protestos', 'evt_revolution_fist'],
    ['golpe', 'evt_coup_crown'], ['Eleições', 'evt_election_ballot'],
    ['Atentado contra', 'evt_assassination'], ['nuclear', 'evt_nuclear_radiation'],
    ['cibernético', 'evt_cyber_attack'], ['terrorista', 'evt_terrorist_bomb'],
    ['Insurgência', 'evt_insurgency'], ['Tensão militar', 'evt_war_explosion'],
    ['comercial', 'evt_alliance_flag'], ['Espionagem', 'evt_cyber_attack'],
  ];
  for (const [kw, icon] of KEYWORDS) if (msg.includes(kw)) return icon;
  return 'evt_disaster_storm';
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

  // Logistics hub nearby (-30%), engineer depot anywhere (-20%)
  const hub = (state.structures || []).find(s => s.type === 'sup_logistics_hub' && s.complete && haversineKm(lat, lng, s.lat, s.lng) < 200);
  const eng = (state.structures || []).some(s => s.type === 'sup_engineer_depot' && s.complete);
  let mult = 1;
  if (hub) mult *= 0.7;
  if (eng) mult *= 0.8;
  const turns = Math.max(1, Math.round(def.turns * mult));

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
        events.push(`[CONSTRUÇÃO] ${s.emoji} ${s.label} concluída!`);
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
