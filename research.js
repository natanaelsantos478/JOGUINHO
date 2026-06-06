// ═══════════════════════════════════════════════════════════
//  research.js — Tech tree / Pesquisa
//  Categories → lines → levels. Each level unlocks a unit or
//  an infrastructure/weapon bonus. Recruiting a unit requires
//  BOTH the research completed AND a compatible structure tier.
//  Only ONE active research per category at a time.
// ═══════════════════════════════════════════════════════════

// Helper to build a unit-unlocking research level
function _ru(name, sheet, sprite, stats, reqStructure, cost, turns, desc) {
  return { name, sheet, sprite, unitKey: sprite, stats, reqStructure, cost, turns, desc: desc || '' };
}
// Helper to build a bonus (infra/weapon) research level (no unit)
function _rb(name, sheet, sprite, cost, turns, desc, effect) {
  return { name, sheet, sprite, bonus: true, cost, turns, desc: desc || '', effect: effect || {} };
}

// ── THE TREE ───────────────────────────────────────────────
const RESEARCH_TREE = {
  aviacao: {
    label: 'Aviação', sheet: 'sheet_air_level2.png', icon: 'air2_f16_falcon',
    lines: {
      cacas: {
        label: 'Caças',
        levels: [
          _ru('F-16 Falcon',   'sheet_air_level2.png', 'air2_f16_falcon',            { atk:4,  def:1,   speed:800,  energyCap:120, range:2000, domain:'air', cost:350,  manpower:1 }, { type:'airport', tier:1 }, 300,  2, 'Caça multifunção de 4ª geração.'),
          _ru('F/A-18 Hornet', 'sheet_air_level2.png', 'air2_fa18_hornet',           { atk:5,  def:1,   speed:850,  energyCap:130, range:2200, domain:'air', cost:480,  manpower:1 }, { type:'airport', tier:2 }, 600,  3, 'Caça naval polivalente.'),
          _ru('Eurofighter',   'sheet_air_level1.png', 'air1_eurofighter_typhoon',   { atk:6,  def:1.5, speed:1000, energyCap:140, range:2800, domain:'air', cost:650,  manpower:1 }, { type:'airport', tier:2 }, 1000, 4, 'Caça europeu de superioridade aérea.'),
          _ru('F-22 Raptor',   'sheet_air_level1.png', 'air1_f22_raptor',            { atk:8,  def:1,   speed:1200, energyCap:150, range:5000, domain:'air', cost:950,  manpower:1 }, { type:'airport', tier:3 }, 1800, 5, 'Caça stealth de 5ª geração.'),
        ],
      },
      bombardeiros: {
        label: 'Bombardeiros',
        levels: [
          _ru('A-10 Warthog',  'sheet_air_level2.png', 'air2_a10_warthog',  { atk:6,  def:2, speed:700, energyCap:140, range:1800, domain:'air', cost:450,  manpower:1 }, { type:'airport', tier:1 }, 400,  3, 'Avião de ataque ao solo.'),
          _ru('Su-25 Frogfoot','sheet_air_level2.png', 'air2_su25_frogfoot',{ atk:6,  def:2, speed:750, energyCap:150, range:1900, domain:'air', cost:520,  manpower:1 }, { type:'airport', tier:2 }, 700,  3, 'Caça de ataque blindado.'),
          _ru('B-2 Spirit',    'sheet_air_level1.png', 'air1_b2_spirit',    { atk:10, def:1, speed:900, energyCap:200, range:9000, domain:'air', cost:1500, manpower:1 }, { type:'airport', tier:3 }, 2500, 6, 'Bombardeiro stealth estratégico.'),
          _ru('B-21 Raider',   'sheet_air_level1.png', 'air1_b21_raider',   { atk:12, def:1, speed:950, energyCap:220, range:10000,domain:'air', cost:2200, manpower:1 }, { type:'airport', tier:3 }, 3500, 7, 'Bombardeiro stealth de nova geração.'),
        ],
      },
      helicopteros: {
        label: 'Helicópteros',
        levels: [
          _ru('Apache AH-64',  'sheet_air_level2.png', 'air2_apache_ah64',     { atk:3, def:1.5, speed:300, energyCap:100, range:600, domain:'air', cost:250, manpower:2 }, { type:'airport', tier:1 }, 250,  2, 'Helicóptero de ataque.'),
          _ru('Mi-28 Havoc',   'sheet_air_level2.png', 'air2_mi28_havoc',      { atk:4, def:1.5, speed:320, energyCap:110, range:650, domain:'air', cost:330, manpower:2 }, { type:'airport', tier:1 }, 450,  3, 'Helicóptero de ataque russo.'),
          _ru('Ka-52 Alligator','sheet_air_level2.png','air2_ka52_alligator',  { atk:5, def:2,   speed:330, energyCap:120, range:700, domain:'air', cost:420, manpower:2 }, { type:'airport', tier:2 }, 750,  4, 'Helicóptero coaxial avançado.'),
        ],
      },
      drones: {
        label: 'Drones',
        levels: [
          _ru('Bayraktar TB2', 'sheet_air_level3.png', 'air3_bayraktar_tb2',   { atk:2, def:0.5, speed:180, energyCap:80,  range:1500, domain:'air', cost:120, manpower:1 }, { type:'airport', tier:1 }, 150,  2, 'Drone armado tático.'),
          _ru('MQ-9 Reaper',   'sheet_air_level3.png', 'air3_mq9_reaper',      { atk:3, def:0.5, speed:200, energyCap:90,  range:1800, domain:'air', cost:180, manpower:1 }, { type:'airport', tier:1 }, 350,  3, 'Drone MALE de longa duração.'),
          _ru('RQ-4 Global Hawk','sheet_air_level3.png','air3_rq4_global_hawk', { atk:1, def:0.5, speed:250, energyCap:120, range:9000, domain:'air', cost:300, manpower:1 }, { type:'airport', tier:2 }, 700,  4, 'Drone de reconhecimento estratégico.'),
        ],
      },
      transporte: {
        label: 'Transporte',
        levels: [
          _ru('C-130 Hercules','sheet_air_level3.png', 'air3_c130_hercules',     { atk:0, def:0.5, speed:450, energyCap:200, range:6000, domain:'air', cost:200, manpower:3 }, { type:'airport', tier:1 }, 200,  2, 'Transporte tático.'),
          _ru('C-17 Globemaster','sheet_air_support.png','airsup_c17_globemaster',{ atk:0, def:0.5, speed:500, energyCap:250, range:8000, domain:'air', cost:350, manpower:3 }, { type:'airport', tier:2 }, 500,  3, 'Transporte estratégico pesado.'),
          _ru('C-5 Galaxy',    'sheet_air_support.png','airsup_c5_galaxy',       { atk:0, def:0.5, speed:520, energyCap:300, range:9000, domain:'air', cost:500, manpower:4 }, { type:'airport', tier:3 }, 900,  4, 'Maior transporte militar.'),
        ],
      },
    },
  },

  terrestre: {
    label: 'Terrestre', sheet: 'sheet_tanks_level1.png', icon: 'tank1_m1a2_abrams',
    lines: {
      infantaria: {
        label: 'Infantaria',
        levels: [
          _ru('Infantaria',       'sheet_soldiers.png', 'sol_infantry_soldier', { atk:1,   def:1.5, speed:20, energyCap:100, range:500, domain:'ground', cost:50,  manpower:10 }, { type:'barracks', tier:1 }, 100,  1, 'Tropa de infantaria padrão.'),
          _ru('Army Ranger',      'sheet_soldiers.png', 'sol_army_ranger',      { atk:2,   def:2,   speed:24, energyCap:110, range:550, domain:'ground', cost:90,  manpower:8  }, { type:'barracks', tier:1 }, 250,  2, 'Infantaria leve de elite.'),
          _ru('Forças Especiais', 'sheet_soldiers.png', 'sol_special_forces',   { atk:3,   def:2.5, speed:26, energyCap:120, range:600, domain:'ground', cost:160, manpower:6  }, { type:'barracks', tier:2 }, 600,  3, 'Operações especiais.'),
          _ru('Paraquedista',     'sheet_soldiers.png', 'sol_paratrooper',      { atk:3,   def:2,   speed:28, energyCap:130, range:700, domain:'ground', cost:200, manpower:6  }, { type:'barracks', tier:3 }, 1000, 4, 'Infantaria aerotransportada.'),
        ],
      },
      veiculos_leves: {
        label: 'Veículos Leves',
        levels: [
          _ru('Humvee',        'sheet_vehicles_light.png', 'veh1_humvee_hmmwv',  { atk:2,   def:2,   speed:80, energyCap:150, range:600, domain:'ground', cost:150, manpower:5 }, { type:'barracks', tier:1 }, 200,  2, 'Veículo utilitário leve.'),
          _ru('LAV-25',        'sheet_vehicles_light.png', 'veh1_lav25_armored', { atk:2.5, def:2.5, speed:90, energyCap:160, range:650, domain:'ground', cost:210, manpower:5 }, { type:'barracks', tier:1 }, 350,  2, 'Veículo blindado anfíbio.'),
          _ru('Oshkosh M-ATV', 'sheet_vehicles_light.png', 'veh1_oshkosh_matv',  { atk:3,   def:3,   speed:85, energyCap:170, range:700, domain:'ground', cost:280, manpower:5 }, { type:'barracks', tier:2 }, 650,  3, 'MRAP resistente a minas.'),
        ],
      },
      ifv: {
        label: 'Veículos de Combate',
        levels: [
          _ru('M113 APC',      'sheet_vehicles_light.png',  'veh1_m113_apc',     { atk:1.5, def:1.8, speed:60, energyCap:140, range:600, domain:'ground', cost:120, manpower:6 }, { type:'barracks', tier:1 }, 200,  2, 'Transporte blindado de tropas.'),
          _ru('Bradley M2',    'sheet_vehicles_medium.png', 'veh2_bradley_m2',   { atk:3,   def:2.5, speed:50, energyCap:180, range:500, domain:'ground', cost:220, manpower:5 }, { type:'barracks', tier:2 }, 450,  3, 'Veículo de combate de infantaria.'),
          _ru('CV90',          'sheet_vehicles_medium.png', 'veh2_cv90_ifv',     { atk:3.5, def:3,   speed:55, energyCap:190, range:550, domain:'ground', cost:320, manpower:5 }, { type:'barracks', tier:2 }, 700,  3, 'IFV nórdico moderno.'),
          _ru('BMP-3',         'sheet_vehicles_medium.png', 'veh2_bmp3_russian', { atk:4,   def:3,   speed:60, energyCap:190, range:550, domain:'ground', cost:380, manpower:5 }, { type:'barracks', tier:3 }, 1100, 4, 'IFV russo fortemente armado.'),
        ],
      },
      tanques: {
        label: 'Tanques',
        levels: [
          _ru('T-90',          'sheet_vehicles_medium.png', 'veh2_t90_tank',     { atk:4.5, def:3.5, speed:45, energyCap:200, range:450, domain:'ground', cost:450, manpower:4 }, { type:'barracks', tier:2 }, 600,  3, 'Tanque de batalha russo.'),
          _ru('Leopard 2A7',   'sheet_tanks_level1.png',    'tank1_leopard2a7',  { atk:5.5, def:4.5, speed:42, energyCap:210, range:420, domain:'ground', cost:600, manpower:3 }, { type:'barracks', tier:2 }, 1000, 4, 'Tanque alemão de ponta.'),
          _ru('M1A2 Abrams',   'sheet_tanks_level1.png',    'tank1_m1a2_abrams', { atk:6,   def:4.5, speed:40, energyCap:220, range:400, domain:'ground', cost:700, manpower:3 }, { type:'barracks', tier:3 }, 1500, 5, 'Tanque principal americano.'),
          _ru('T-14 Armata',   'sheet_tanks_level1.png',    'tank1_t14_armata',  { atk:7,   def:5,   speed:45, energyCap:230, range:420, domain:'ground', cost:900, manpower:3 }, { type:'barracks', tier:3 }, 2200, 6, 'Tanque de nova geração.'),
        ],
      },
      artilharia: {
        label: 'Artilharia',
        levels: [
          _ru('M109 Paladin',  'sheet_vehicles_medium.png', 'veh2_m109_paladin', { atk:4, def:1, speed:35, energyCap:160, range:300, domain:'ground', cost:280, manpower:4, attackRange:60 }, { type:'artillery_center', tier:1 }, 300,  2, 'Obus autopropulsado.'),
          _ru('MLRS M270',     'sheet_vehicles_medium.png', 'veh2_mlrs_m270',    { atk:5, def:1, speed:40, energyCap:170, range:320, domain:'ground', cost:380, manpower:4, attackRange:90 }, { type:'artillery_center', tier:2 }, 700,  3, 'Lançador múltiplo de foguetes.'),
          _ru('BM-30 Smerch',  'sheet_vehicles_medium.png', 'veh2_bm30_smerch',  { atk:6, def:1, speed:38, energyCap:180, range:340, domain:'ground', cost:500, manpower:4, attackRange:110 }, { type:'artillery_center', tier:3 }, 1300, 4, 'Lança-foguetes pesado.'),
        ],
      },
    },
  },

  naval: {
    label: 'Naval', sheet: 'sheet_naval_level1.png', icon: 'nav1_arleigh_burke',
    lines: {
      patrulha: {
        label: 'Patrulha / Corvetas',
        levels: [
          _ru('River Patrol',  'sheet_naval_level3.png', 'nav3_river_patrol',  { atk:1,   def:1,   speed:40, energyCap:100, range:2000, domain:'naval', cost:130, manpower:5  }, { type:'seaport', tier:1 }, 150,  2, 'Patrulha costeira.'),
          _ru('Visby Corvette','sheet_naval_level3.png', 'nav3_visby_corvette',{ atk:2,   def:2,   speed:38, energyCap:140, range:3000, domain:'naval', cost:220, manpower:8  }, { type:'seaport', tier:1 }, 350,  3, 'Corveta stealth.'),
          _ru('LCS Freedom',   'sheet_naval_level3.png', 'nav3_lcs_freedom',   { atk:3,   def:2.5, speed:45, energyCap:180, range:4000, domain:'naval', cost:350, manpower:12 }, { type:'seaport', tier:2 }, 700,  4, 'Navio de combate litorâneo.'),
        ],
      },
      fragatas: {
        label: 'Fragatas / Cruzadores',
        levels: [
          _ru('FREMM Frigate',     'sheet_naval_level2.png', 'nav2_fremm_frigate',       { atk:3, def:3,   speed:30, energyCap:200, range:5000, domain:'naval', cost:400,  manpower:20 }, { type:'seaport', tier:2 }, 600,  3, 'Fragata multifunção europeia.'),
          _ru('Type 26 Frigate',   'sheet_naval_level2.png', 'nav2_type26_frigate',      { atk:3.5,def:3.5, speed:30, energyCap:210, range:5500, domain:'naval', cost:520,  manpower:22 }, { type:'seaport', tier:2 }, 1000, 4, 'Fragata antissubmarino.'),
          _ru('Ticonderoga',       'sheet_naval_level2.png', 'nav2_ticonderoga_cruiser', { atk:5, def:4,   speed:32, energyCap:260, range:6500, domain:'naval', cost:700,  manpower:30 }, { type:'seaport', tier:3 }, 1600, 5, 'Cruzador Aegis.'),
          _ru('Kirov',             'sheet_naval_level2.png', 'nav2_kirov_battlecruiser', { atk:6, def:5,   speed:30, energyCap:320, range:7000, domain:'naval', cost:1100, manpower:40 }, { type:'seaport', tier:3 }, 2400, 6, 'Cruzador de batalha nuclear.'),
        ],
      },
      destroieres: {
        label: 'Destróieres',
        levels: [
          _ru('Arleigh Burke', 'sheet_naval_level1.png', 'nav1_arleigh_burke',       { atk:5,   def:4,   speed:35, energyCap:300, range:8000, domain:'naval', cost:700,  manpower:30 }, { type:'seaport', tier:3 }, 1400, 4, 'Destróier Aegis.'),
          _ru('Type 45 Daring','sheet_naval_level1.png', 'nav1_type45_daring',       { atk:5.5, def:4.5, speed:35, energyCap:320, range:8500, domain:'naval', cost:850,  manpower:32 }, { type:'seaport', tier:3 }, 1900, 5, 'Destróier de defesa aérea.'),
          _ru('Zumwalt',       'sheet_naval_level1.png', 'nav1_zumwalt_destroyer',   { atk:7,   def:5,   speed:35, energyCap:360, range:9000, domain:'naval', cost:1300, manpower:35 }, { type:'seaport', tier:3 }, 3000, 6, 'Destróier stealth furtivo.'),
        ],
      },
      submarinos: {
        label: 'Submarinos',
        levels: [
          _ru('Los Angeles',   'sheet_naval_level2.png', 'nav2_losangeles_submarine',{ atk:4, def:3, speed:30, energyCap:280, range:9000,  domain:'naval', cost:600,  manpower:25 }, { type:'seaport', tier:2 }, 800,  4, 'Submarino de ataque.'),
          _ru('Virginia',      'sheet_naval_level1.png', 'nav1_virginia_submarine',  { atk:6, def:4, speed:32, energyCap:340, range:12000, domain:'naval', cost:1000, manpower:30 }, { type:'seaport', tier:3 }, 1800, 5, 'Submarino nuclear de ataque.'),
          _ru('Yasen',         'sheet_naval_level1.png', 'nav1_yasen_submarine',     { atk:7, def:4, speed:33, energyCap:360, range:13000, domain:'naval', cost:1400, manpower:32 }, { type:'seaport', tier:3 }, 2600, 6, 'Submarino russo de cruzeiro.'),
        ],
      },
      porta_avioes: {
        label: 'Porta-Aviões',
        levels: [
          _ru('Kuznetsov',       'sheet_naval_level1.png', 'nav1_kuznetsov_carrier',        { atk:2, def:5, speed:25, energyCap:500, range:99999, domain:'naval', cost:1800, manpower:70 }, { type:'seaport', tier:3 }, 3000, 6, 'Porta-aviões russo.'),
          _ru('Queen Elizabeth', 'sheet_naval_level1.png', 'nav1_queen_elizabeth_carrier',  { atk:2, def:6, speed:25, energyCap:550, range:99999, domain:'naval', cost:2200, manpower:75 }, { type:'seaport', tier:3 }, 4000, 7, 'Porta-aviões britânico.'),
          _ru('Gerald Ford',     'sheet_naval_level1.png', 'nav1_gerald_ford_carrier',      { atk:3, def:6, speed:30, energyCap:600, range:99999, domain:'naval', cost:2800, manpower:90 }, { type:'seaport', tier:3 }, 5500, 8, 'Maior porta-aviões do mundo.'),
        ],
      },
    },
  },

  infraestrutura: {
    label: 'Infraestrutura', sheet: 'sheet_structures_civilian.png', icon: 'civ_power_plant',
    lines: {
      energia: {
        label: 'Energia',
        levels: [
          _rb('Usina Elétrica',  'sheet_structures_civilian.png', 'civ_power_plant',   400,  2, '+30 energia/turno.',  { energyPerTurn:30 }),
          _rb('Fazenda Solar',   'sheet_structures_support.png',  'sup_solar_farm',    800,  3, '+50 energia/turno.',  { energyPerTurn:50 }),
          _rb('Parque Eólico',   'sheet_structures_support.png',  'sup_wind_farm',     1400, 3, '+70 energia/turno.',  { energyPerTurn:70 }),
          _rb('Hidrelétrica',    'sheet_structures_support.png',  'sup_hydro_dam',     2200, 4, '+110 energia/turno.', { energyPerTurn:110 }),
          _rb('Usina Nuclear',   'sheet_structures_support.png',  'sup_nuclear_plant', 4000, 5, '+200 energia/turno. Requisito para armas nucleares.', { energyPerTurn:200, enablesNuclear:true }),
        ],
      },
      aeroportos: {
        label: 'Aeroportos',
        levels: [
          _rb('Aeroporto N1', 'sheet_structures_civilian.png', 'civ_airport', 500,  2, 'Permite construir aeroportos tier 1 nas cidades.', { maxStructureTier:{ airport:1 } }),
          _rb('Aeroporto N2', 'sheet_structures_civilian.png', 'civ_airport', 1200, 3, 'Permite aeroportos tier 2.', { maxStructureTier:{ airport:2 } }),
          _rb('Aeroporto N3', 'sheet_structures_civilian.png', 'civ_airport', 2500, 4, 'Permite aeroportos tier 3.', { maxStructureTier:{ airport:3 } }),
        ],
      },
      portos: {
        label: 'Portos',
        levels: [
          _rb('Porto N1', 'sheet_structures_civilian.png', 'civ_seaport', 500,  2, 'Permite construir portos tier 1.', { maxStructureTier:{ seaport:1 } }),
          _rb('Porto N2', 'sheet_structures_civilian.png', 'civ_seaport', 1200, 3, 'Permite portos tier 2.', { maxStructureTier:{ seaport:2 } }),
          _rb('Porto N3', 'sheet_structures_civilian.png', 'civ_seaport', 2500, 4, 'Permite portos tier 3.', { maxStructureTier:{ seaport:3 } }),
        ],
      },
      pesquisa: {
        label: 'Centros de Pesquisa',
        levels: [
          _rb('Laboratório',   'sheet_structures_support.png',  'sup_research_lab', 600,  2, '-10% custo de pesquisa.', { researchCostMult:0.9 }),
          _rb('Data Center',   'sheet_structures_civilian.png', 'civ_data_center',  1400, 3, '-10% tempo de pesquisa.', { researchTimeMult:0.9 }),
          _rb('Universidade',  'sheet_structures_civilian.png', 'civ_university',   2600, 4, '-20% custo de pesquisa.', { researchCostMult:0.8 }),
        ],
      },
      comunicacoes: {
        label: 'Comunicações',
        levels: [
          _rb('Torre Telecom', 'sheet_structures_civilian.png', 'civ_telecom_tower', 500,  2, '+1 alcance de visão.', { vision:1 }),
          _rb('Uplink Satélite','sheet_structures_support.png', 'sup_sat_uplink',    1300, 3, '+2 alcance de visão.', { vision:2 }),
          _rb('Estação SIGINT','sheet_structures_support.png',  'sup_sigint_station',2400, 4, 'Detecta unidades inimigas ocultas.', { sigint:true }),
        ],
      },
    },
  },

  armamentos: {
    label: 'Armamentos', sheet: 'sheet_weapons.png', icon: 'wpn_cruise_missile',
    lines: {
      defesa_aerea: {
        label: 'Defesa Aérea',
        levels: [
          _ru('Patriot',   'sheet_ground_support.png', 'grdsup_patriot_battery', { atk:4, def:5, speed:20, energyCap:160, range:300, domain:'ground', cost:400, manpower:6, attackRange:120, antiAir:true }, { type:'barracks', tier:2 }, 600,  3, 'Bateria antiaérea/antimíssil.'),
          _ru('S-400',     'sheet_ground_support.png', 'grdsup_s400_tel',        { atk:5, def:6, speed:20, energyCap:180, range:350, domain:'ground', cost:600, manpower:6, attackRange:160, antiAir:true }, { type:'barracks', tier:3 }, 1200, 4, 'Sistema SAM de longo alcance.'),
          _ru('Iron Dome', 'sheet_ground_support.png', 'grdsup_iron_dome',       { atk:3, def:8, speed:18, energyCap:200, range:250, domain:'ground', cost:800, manpower:6, attackRange:90,  antiAir:true }, { type:'barracks', tier:3 }, 1800, 5, 'Defesa contra foguetes.'),
        ],
      },
      misseis: {
        label: 'Mísseis',
        levels: [
          _rb('Míssil de Cruzeiro', 'sheet_weapons.png', 'wpn_cruise_missile',   1000, 3, 'Ataque de precisão a longa distância.', { strike:true }),
          _rb('Míssil Antinavio',   'sheet_weapons.png', 'wpn_antiship_missile', 1500, 4, '+30% dano contra navios.', { antiShipBonus:0.3 }),
          _rb('Bunker Buster',      'sheet_weapons.png', 'wpn_bunker_buster',    2200, 5, 'Penetra estruturas fortificadas.', { antiStructureBonus:0.5 }),
        ],
      },
      antitanque: {
        label: 'Anti-Tanque',
        levels: [
          _rb('RPG',              'sheet_weapons.png', 'wpn_rpg',             400, 2, 'Infantaria ganha capacidade antitanque.', { antiArmorBonus:0.2 }),
          _rb('Míssil Antitanque','sheet_weapons.png', 'wpn_antitank_missile',900, 3, '+30% dano contra blindados.', { antiArmorBonus:0.3 }),
        ],
      },
      municoes: {
        label: 'Munições',
        levels: [
          _rb('Projétil de Artilharia','sheet_weapons.png', 'wpn_artillery_shell', 500,  2, '+15% dano de artilharia.', { artilleryBonus:0.15 }),
          _rb('Bomba Cluster',         'sheet_weapons.png', 'wpn_cluster_bomb',    1100, 3, '+25% dano em área.',       { areaBonus:0.25 }),
        ],
      },
      nuclear: {
        label: 'Nuclear',
        levels: [
          _rb('Ogiva Nuclear', 'sheet_weapons.png', 'wpn_nuclear_warhead', 8000, 8, 'Arma de destruição em massa. Requer Usina Nuclear pesquisada + Silo de Mísseis na cidade.', { nuclear:true, requiresEffect:'enablesNuclear', requiresStructure:{ type:'missile_silo', tier:1 } }),
        ],
      },
    },
  },
};

// ── Register research units into UNIT_DEFS / UNIT_SPRITE_MAP ─
function _shortFromName(name) {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}
(function _registerResearchUnits() {
  if (typeof UNIT_DEFS === 'undefined' || typeof UNIT_SPRITE_MAP === 'undefined') return;
  for (const cat of Object.values(RESEARCH_TREE)) {
    for (const line of Object.values(cat.lines)) {
      for (const lvl of line.levels) {
        if (!lvl.unitKey || !lvl.stats) continue;
        const key = lvl.unitKey;
        if (!UNIT_DEFS[key]) {
          UNIT_DEFS[key] = Object.assign({ label: lvl.name, tier: 1 }, lvl.stats);
        }
        if (!UNIT_SPRITE_MAP[key]) {
          UNIT_SPRITE_MAP[key] = { sheet: lvl.sheet, sprite: lvl.sprite, short: _shortFromName(lvl.name) };
        }
      }
    }
  }
})();

// ── State helpers ──────────────────────────────────────────
function initResearchState() {
  return { completed: {}, active: {} }; // active: { categoryKey: { lineKey, levelIdx, turnsLeft, cost } }
}

function _researchId(catKey, lineKey, levelIdx) {
  return `${catKey}.${lineKey}.${levelIdx}`;
}

function isResearchCompleted(state, catKey, lineKey, levelIdx) {
  return !!(state.research && state.research.completed[_researchId(catKey, lineKey, levelIdx)]);
}

// effective cost/time after infra bonuses
function _researchMultipliers(state) {
  let costMult = 1, timeMult = 1;
  if (state.research) {
    for (const id of Object.keys(state.research.completed)) {
      const lvl = _levelById(id);
      if (lvl && lvl.effect) {
        if (lvl.effect.researchCostMult) costMult *= lvl.effect.researchCostMult;
        if (lvl.effect.researchTimeMult) timeMult *= lvl.effect.researchTimeMult;
      }
    }
  }
  return { costMult, timeMult };
}

function _levelById(id) {
  const [catKey, lineKey, idxStr] = id.split('.');
  const cat = RESEARCH_TREE[catKey];
  if (!cat || !cat.lines[lineKey]) return null;
  return cat.lines[lineKey].levels[Number(idxStr)] || null;
}

// what state is a given cell in?
function getResearchCellState(state, catKey, lineKey, levelIdx) {
  const r = state.research || initResearchState();
  if (isResearchCompleted(state, catKey, lineKey, levelIdx)) return { status: 'completed' };
  const active = r.active[catKey];
  if (active && active.lineKey === lineKey && active.levelIdx === levelIdx) {
    return { status: 'active', turnsLeft: active.turnsLeft };
  }
  // previous level must be done
  if (levelIdx > 0 && !isResearchCompleted(state, catKey, lineKey, levelIdx - 1)) {
    return { status: 'locked', reason: 'Pesquise o nível anterior' };
  }
  // category already busy with another research
  if (active) return { status: 'blocked', reason: 'Categoria ocupada com outra pesquisa' };
  return { status: 'available' };
}

function getResearchCost(state, catKey, lineKey, levelIdx) {
  const lvl = RESEARCH_TREE[catKey].lines[lineKey].levels[levelIdx];
  const { costMult } = _researchMultipliers(state);
  return Math.round(lvl.cost * costMult);
}

function getResearchTurns(state, catKey, lineKey, levelIdx) {
  const lvl = RESEARCH_TREE[catKey].lines[lineKey].levels[levelIdx];
  const { timeMult } = _researchMultipliers(state);
  return Math.max(1, Math.round(lvl.turns * timeMult));
}

// start a research (deduct money, occupy category slot)
function startResearch(state, catKey, lineKey, levelIdx) {
  if (!state.research) state.research = initResearchState();
  const cell = getResearchCellState(state, catKey, lineKey, levelIdx);
  if (cell.status !== 'available') return { ok: false, reason: cell.reason || 'Indisponível' };
  const cost = getResearchCost(state, catKey, lineKey, levelIdx);
  if ((state.resources.money || 0) < cost) return { ok: false, reason: 'Recursos insuficientes' };

  // nuclear prerequisite check
  const lvl = RESEARCH_TREE[catKey].lines[lineKey].levels[levelIdx];
  if (lvl.effect && lvl.effect.requiresEffect) {
    const hasReq = Object.keys(state.research.completed).some(id => {
      const l = _levelById(id);
      return l && l.effect && l.effect[lvl.effect.requiresEffect];
    });
    if (!hasReq) return { ok: false, reason: 'Requer pesquisa pré-requisito (ver descrição)' };
  }

  state.resources.money -= cost;
  const turns = getResearchTurns(state, catKey, lineKey, levelIdx);
  state.research.active[catKey] = { lineKey, levelIdx, turnsLeft: turns, cost };
  return { ok: true, turns, label: lvl.name };
}

// advance all active researches one turn (called from processTurn)
function progressResearch(state, events) {
  if (!state.research || !state.research.active) return;
  for (const catKey of Object.keys(state.research.active)) {
    const a = state.research.active[catKey];
    a.turnsLeft -= 1;
    if (a.turnsLeft <= 0) {
      const id = _researchId(catKey, a.lineKey, a.levelIdx);
      state.research.completed[id] = true;
      const lvl = RESEARCH_TREE[catKey].lines[a.lineKey].levels[a.levelIdx];
      delete state.research.active[catKey];
      if (events) events.unshift(`[PESQUISA] Concluída: ${lvl.name}`);
    }
  }
}

// ── Gating: is a unit type researched & structure-available? ─
function _playerHasStructure(state, type, tier) {
  if (!state.cities) return false;
  for (const cs of Object.values(state.cities)) {
    if (cs.country !== state.player_country) continue;
    if ((cs.structures || {})[type] >= tier) return true;
  }
  return false;
}

function isUnitResearched(state, unitKey) {
  if (!state.research) return false;
  for (const id of Object.keys(state.research.completed)) {
    const lvl = _levelById(id);
    if (lvl && lvl.unitKey === unitKey) return true;
  }
  return false;
}

// returns { researched, structure, ok, reqStructure }
function getUnitRecruitGate(state, unitKey) {
  // find the research level that defines this unit
  let found = null;
  for (const cat of Object.values(RESEARCH_TREE)) {
    for (const line of Object.values(cat.lines)) {
      for (const lvl of line.levels) {
        if (lvl.unitKey === unitKey) { found = lvl; break; }
      }
    }
  }
  if (!found) {
    // legacy unit not in tree → allow (resources only)
    return { researched: true, structure: true, ok: true, reqStructure: null };
  }
  const researched = isUnitResearched(state, unitKey);
  const req = found.reqStructure || null;
  const structure = req ? _playerHasStructure(state, req.type, req.tier) : true;
  return { researched, structure, ok: researched && structure, reqStructure: req };
}

// all unit keys unlocked (researched), regardless of structure
function getResearchedUnitKeys(state) {
  const keys = [];
  if (!state.research) return keys;
  for (const id of Object.keys(state.research.completed)) {
    const lvl = _levelById(id);
    if (lvl && lvl.unitKey) keys.push(lvl.unitKey);
  }
  return keys;
}

// max structure tier allowed by infra research (for city build menu)
function getMaxStructureTierFromResearch(state, structType) {
  let max = 0;
  if (!state.research) return max;
  for (const id of Object.keys(state.research.completed)) {
    const lvl = _levelById(id);
    if (lvl && lvl.effect && lvl.effect.maxStructureTier && lvl.effect.maxStructureTier[structType]) {
      max = Math.max(max, lvl.effect.maxStructureTier[structType]);
    }
  }
  return max;
}

// total bonus energy/turn from infra research
function getResearchEnergyBonus(state) {
  let e = 0;
  if (!state.research) return e;
  for (const id of Object.keys(state.research.completed)) {
    const lvl = _levelById(id);
    if (lvl && lvl.effect && lvl.effect.energyPerTurn) e += lvl.effect.energyPerTurn;
  }
  return e;
}

// expose
window.RESEARCH_TREE = RESEARCH_TREE;
