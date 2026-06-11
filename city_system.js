// ═══════════════════════════════════════════════════════════
//  city_system.js — City levels, structures, unit unlocks
// ═══════════════════════════════════════════════════════════

// ── City level metadata ────────────────────────────────────
const CITY_LEVEL_META = {
  1: { name: 'Aldeia',          slots: 2, genMult: 0.5  },
  2: { name: 'Cidade',          slots: 4, genMult: 1.0  },
  3: { name: 'Metrópole',       slots: 6, genMult: 1.5  },
  4: { name: 'Capital Global',  slots: 9, genMult: 2.5  },
};

// ── Structure definitions ──────────────────────────────────
// Each structure has tiers (1..maxTier).
// costsPerTier[i] = cost to build/upgrade to tier i+1.
// requiredAdmin = admin_center tier needed to unlock this structure.
// usesSlot = false means it doesn't count toward city slot limit.
const STRUCT_DEFS = {
  admin_center: {
    label:            'Centro Administrativo',
    sheet:            'sheet_structures_civilian.png',
    sprite:           'civ_metropolis',
    maxTier:          4,
    costsPerTier:     [200, 800, 2500, 7000],
    requiredCityLvl:  [1, 2, 3, 4],
    usesSlot:         false,
    description: [
      'Habilita construção de Quartéis',
      'Habilita Base de Artilharia e Radar',
      'Habilita Aeroporto, Porto, Base Militar',
      'Habilita Silo, Bunker, Usina Nuclear',
    ],
  },
  barracks: {
    label:            'Quartel',
    sheet:            'sheet_structures_military.png',
    sprite:           'mil_army_hq',
    maxTier:          3,
    costsPerTier:     [300, 700, 1800],
    requiredCityLvl:  [1, 2, 3],
    requiredAdmin:    1,
    units: {
      1: ['infantry', 'motorized'],
      2: ['infantry', 'motorized', 'veh_light', 'veh_medium'],
      3: ['infantry', 'motorized', 'veh_light', 'veh_medium', 'tank_elite'],
    },
  },
  artillery_center: {
    label:            'Base de Artilharia',
    sheet:            'sheet_structures_military.png',
    sprite:           'mil_radar_station',
    maxTier:          3,
    costsPerTier:     [600, 1500, 3500],
    requiredCityLvl:  [2, 3, 4],
    requiredAdmin:    2,
    units: {
      1: ['artillery'],
      2: ['artillery', 'veh_medium'],
      3: ['artillery', 'tank_elite'],
    },
  },
  airport: {
    label:            'Aeroporto',
    sheet:            'sheet_structures_civilian.png',
    sprite:           'civ_airport',
    maxTier:          3,
    costsPerTier:     [1000, 2500, 6000],
    requiredCityLvl:  [2, 3, 4],
    requiredAdmin:    3,
    units: {
      1: ['air3_drone', 'air2_helicopter'],
      2: ['air3_drone', 'air2_helicopter', 'air2_fighter', 'air_transport'],
      3: ['air3_drone', 'air2_helicopter', 'air2_fighter', 'air_transport', 'air1_stealth'],
    },
  },
  seaport: {
    label:            'Porto',
    sheet:            'sheet_structures_civilian.png',
    sprite:           'civ_seaport',
    maxTier:          3,
    costsPerTier:     [800, 2000, 5000],
    requiredCityLvl:  [2, 3, 4],
    requiredAdmin:    3,
    coastal:          true,
    units: {
      1: ['nav3_patrol'],
      2: ['nav3_patrol', 'nav2_frigate'],
      3: ['nav3_patrol', 'nav2_frigate', 'nav1_destroyer', 'nav1_carrier'],
    },
  },
  radar_station: {
    label:            'Estação de Radar',
    sheet:            'sheet_structures_military.png',
    sprite:           'mil_radar_station',
    maxTier:          2,
    costsPerTier:     [500, 1500],
    requiredCityLvl:  [2, 3],
    requiredAdmin:    2,
  },
  missile_silo: {
    label:            'Silo de Mísseis',
    sheet:            'sheet_structures_military.png',
    sprite:           'mil_missile_silo',
    maxTier:          2,
    costsPerTier:     [5000, 15000],
    requiredCityLvl:  [3, 4],
    requiredAdmin:    4,
  },
  nuclear_plant: {
    label:            'Usina Nuclear',
    sheet:            'sheet_structures_civilian.png',
    sprite:           'civ_seaport',
    maxTier:          1,
    costsPerTier:     [12000],
    requiredCityLvl:  [4],
    requiredAdmin:    4,
  },
  nuclear_bunker: {
    label:            'Bunker Nuclear',
    sheet:            'sheet_structures_military.png',
    sprite:           'mil_nuclear_bunker',
    maxTier:          1,
    costsPerTier:     [20000],
    requiredCityLvl:  [4],
    requiredAdmin:    4,
    requiredOther:    { nuclear_plant: 1 },
  },
};

// ── Map unit type → which structure tier unlocks it ────────
// Built by scanning STRUCT_DEFS.units on first call.
let _unitUnlockMap = null;

function _buildUnitUnlockMap() {
  _unitUnlockMap = {}; // unitType → { structType, minTier }
  for (const [structType, def] of Object.entries(STRUCT_DEFS)) {
    if (!def.units) continue;
    for (const [tier, unitList] of Object.entries(def.units)) {
      for (const u of unitList) {
        if (!_unitUnlockMap[u]) {
          _unitUnlockMap[u] = { structType, minTier: Number(tier) };
        }
      }
    }
  }
}

// ── Geometry helper ────────────────────────────────────────
function _cityDistKm(lat1, lng1, lat2, lng2) {
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (lat2 - lat1) * d2r, dLng = (lng2 - lng1) * d2r;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function _nearestInList(list, lat, lng, maxKm) {
  let best = null, bestD = maxKm;
  for (const item of list) {
    const d = _cityDistKm(lat, lng, item.lat, item.lng);
    if (d < bestD) { bestD = d; best = item; }
  }
  return best;
}

// ── Default city level from country GDP ────────────────────
function _defaultCityLevel(cityData) {
  const base = (typeof getCountryBaseData === 'function')
    ? getCountryBaseData(cityData.country) : null;
  const gdp = base ? base.gdp : 100;
  if (cityData.tier === 1) {          // capital
    if (gdp >= 10000) return 4;
    if (gdp >= 3000)  return 3;
    return 2;
  }
  // mega-city (tier 2 in pois)
  if (gdp >= 5000) return 3;
  return 2;
}

// ── Default structures for a new city ─────────────────────
function _defaultStructures(cityData, cityLevel) {
  const s = {};

  // Admin center: always present
  s.admin_center = Math.max(1, Math.min(cityLevel - 1, 3));

  // Barracks: capitals always start with one
  if (cityData.tier === 1) {
    s.barracks = Math.max(1, Math.min(cityLevel - 1, 3));
  } else if (cityLevel >= 3) {
    s.barracks = 1;
  }

  // Airport: scan AIRPORTS array (from airports.js)
  if (typeof AIRPORTS !== 'undefined') {
    const near = _nearestInList(AIRPORTS, cityData.lat, cityData.lng, 60);
    if (near) s.airport = near.tier;  // 1, 2, or 3
  }

  // Seaport: scan SEAPORTS array (from pois.js)
  if (typeof SEAPORTS !== 'undefined') {
    const near = _nearestInList(SEAPORTS, cityData.lat, cityData.lng, 80);
    if (near) s.seaport = Math.min(near.tier, 2); // cap at 2 naturally
  }

  return s;
}

// ── is this city considered coastal? ──────────────────────
function _isCoastal(lat, lng) {
  if (typeof SEAPORTS !== 'undefined') {
    return !!_nearestInList(SEAPORTS, lat, lng, 150);
  }
  return false;
}

// ── Public: get-or-init a city's game state ────────────────
function getOrInitCity(cityData) {
  if (!window.GS) return null;
  if (!window.GS.cities) window.GS.cities = {};
  const key = cityData.name;
  if (!window.GS.cities[key]) {
    const level = _defaultCityLevel(cityData);
    window.GS.cities[key] = {
      name:       cityData.name,
      country:    cityData.country,
      lat:        cityData.lat,
      lng:        cityData.lng,
      tier:       cityData.tier,
      level,
      coastal:    _isCoastal(cityData.lat, cityData.lng),
      structures: _defaultStructures(cityData, level),
    };
  }
  return window.GS.cities[key];
}

// ── Initialize all cities for player country ───────────────
function initPlayerCities(playerCountry) {
  if (!window.GS) return;
  if (!window.GS.cities) window.GS.cities = {};
  if (typeof CITIES === 'undefined') return;
  CITIES.filter(c => c.country === playerCountry).forEach(c => getOrInitCity(c));
}

// ── Slot accounting ────────────────────────────────────────
function getCitySlots(cityState) {
  return (CITY_LEVEL_META[cityState.level] || CITY_LEVEL_META[1]).slots;
}

function getUsedSlots(cityState) {
  let n = 0;
  for (const [t] of Object.entries(cityState.structures || {})) {
    if (STRUCT_DEFS[t] && STRUCT_DEFS[t].usesSlot !== false) n++;
  }
  return n;
}

// ── What can be built/upgraded here? ──────────────────────
function getAvailableBuilds(cityState) {
  const res = [];
  const adminLvl = (cityState.structures || {}).admin_center || 0;
  const hasSlot  = getUsedSlots(cityState) < getCitySlots(cityState);

  for (const [type, def] of Object.entries(STRUCT_DEFS)) {
    const curTier  = (cityState.structures || {})[type] || 0;
    const nextTier = curTier + 1;
    if (nextTier > def.maxTier) continue;

    // city level requirement
    if (cityState.level < (def.requiredCityLvl[nextTier - 1] || 99)) continue;
    // admin level requirement
    if (def.requiredAdmin && adminLvl < def.requiredAdmin) continue;
    // coastal requirement
    if (def.coastal && !cityState.coastal) continue;
    // other structure requirement
    if (def.requiredOther) {
      const met = Object.entries(def.requiredOther)
        .every(([k, v]) => ((cityState.structures || {})[k] || 0) >= v);
      if (!met) continue;
    }
    // slot check: new builds need a free slot; upgrades don't
    if (curTier === 0 && !hasSlot && def.usesSlot !== false) continue;

    // infra research gate for airport/seaport tiers
    if ((type === 'airport' || type === 'seaport') && typeof getMaxStructureTierFromResearch === 'function') {
      if (getMaxStructureTierFromResearch(window.GS, type) < nextTier) continue;
    }

    const cost      = def.costsPerTier[nextTier - 1] || 9999;
    const canAfford = !!(window.GS && (window.GS.resources.money || 0) >= cost);
    res.push({ type, label: def.label, curTier, nextTier, cost, canAfford });
  }
  return res;
}

// ── Execute a build ────────────────────────────────────────
function buildCityStructure(cityState, structureType) {
  const def = STRUCT_DEFS[structureType];
  if (!def) return { ok: false, reason: 'Estrutura desconhecida' };
  const cur  = (cityState.structures || {})[structureType] || 0;
  const next = cur + 1;
  if (next > def.maxTier) return { ok: false, reason: 'Nível máximo' };
  const cost = def.costsPerTier[next - 1] || 9999;
  if (!window.GS || window.GS.resources.money < cost)
    return { ok: false, reason: 'Recursos insuficientes' };
  window.GS.resources.money -= cost;
  if (!cityState.structures) cityState.structures = {};
  cityState.structures[structureType] = next;
  return { ok: true, label: def.label, nextTier: next };
}

// ── Unit unlock query ──────────────────────────────────────
function getUnlockedUnits(playerCountry) {
  if (!window.GS || !window.GS.cities) return [];
  const set = new Set();
  for (const cs of Object.values(window.GS.cities)) {
    if (cs.country !== playerCountry) continue;
    for (const [structType, tier] of Object.entries(cs.structures || {})) {
      const def = STRUCT_DEFS[structType];
      if (!def || !def.units) continue;
      (def.units[tier] || []).forEach(u => set.add(u));
    }
  }
  return [...set];
}

function canRecruitUnitType(unitType, playerCountry) {
  return getUnlockedUnits(playerCountry).includes(unitType);
}

// ── Sprite helper for city panel ───────────────────────────
function getCityStructureImgHtml(structType, size) {
  size = size || 32;
  const def = STRUCT_DEFS[structType];
  if (!def) return '';
  const dataUrl = (typeof getSpriteDataUrl === 'function')
    ? getSpriteDataUrl(def.sheet, def.sprite, size) : null;
  if (dataUrl) {
    return `<img src="${dataUrl}" width="${size}" height="${size}" style="border-radius:4px;border:1px solid var(--border);flex-shrink:0;" />`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:4px;background:#0b0e13;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:7px;color:var(--gold);font-family:'Cinzel',serif;flex-shrink:0;">${def.label.slice(0,3)}</div>`;
}
