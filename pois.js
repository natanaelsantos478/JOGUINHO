// ═══════════════════════════════════════════════════════════
//  pois.js — World seaports, military bases, and cities
//  Standalone browser JS — uses globals L (Leaflet),
//  getSpriteDataUrl / loadSpriteSheet from sprites.js
// ═══════════════════════════════════════════════════════════

window._poisLayer = null;

// ── Internal sub-arrays ────────────────────────────────────
const _poisPorts    = [];   // { dotMarker, fullMarker, tier }
const _poisMilitary = [];   // { dotMarker, fullMarker, tier }
const _poisCities   = [];   // { dotMarker, fullMarker, tier }

// ── Zoom thresholds ────────────────────────────────────────
// Below DOT_THRESHOLD → small colored dot; above → sprite icon
const POI_DOT_THRESHOLD = 5;

const POI_ZOOM = {
  city1:    2,   // capitals — visible from far away
  city2:    3,   // mega-cities
  port1:    2,   // major hub ports
  port2:    4,   // regional ports
  mil1:     3,   // major installations
  mil2:     6,   // smaller bases
};

// ══════════════════════════════════════════════════════════
//  DATA — SEAPORTS  (tier 1 = mega-hub, tier 2 = regional)
// ══════════════════════════════════════════════════════════
const SEAPORTS = [
  // ── Tier 1: Mega-hub ports ──────────────────────────────
  { name: 'Port of Shanghai',         city: 'Shanghai',       country: 'China',           lat: 31.2304,  lng: 121.4737,  tier: 1 },
  { name: 'Port of Singapore',        city: 'Singapore',      country: 'Singapore',       lat:  1.2897,  lng: 103.8597,  tier: 1 },
  { name: 'Port of Rotterdam',        city: 'Rotterdam',      country: 'Netherlands',     lat: 51.9225,  lng:   4.4792,  tier: 1 },
  { name: 'Port of Ningbo-Zhoushan',  city: 'Ningbo',         country: 'China',           lat: 29.8683,  lng: 121.5440,  tier: 1 },
  { name: 'Port of Guangzhou',        city: 'Guangzhou',      country: 'China',           lat: 22.9287,  lng: 113.3146,  tier: 1 },
  { name: 'Port of Busan',            city: 'Busan',          country: 'South Korea',     lat: 35.1028,  lng: 129.0403,  tier: 1 },
  { name: 'Port of Hong Kong',        city: 'Hong Kong',      country: 'China',           lat: 22.2855,  lng: 114.1577,  tier: 1 },
  { name: 'Port of Qingdao',          city: 'Qingdao',        country: 'China',           lat: 36.0671,  lng: 120.3826,  tier: 1 },
  { name: 'Port of Tianjin',          city: 'Tianjin',        country: 'China',           lat: 38.9922,  lng: 117.7219,  tier: 1 },
  { name: 'Jebel Ali Port',           city: 'Dubai',          country: 'UAE',             lat: 25.0019,  lng:  55.0613,  tier: 1 },
  { name: 'Port Klang',               city: 'Klang',          country: 'Malaysia',        lat:  3.0000,  lng: 101.4000,  tier: 1 },
  { name: 'Port of Antwerp',          city: 'Antwerp',        country: 'Belgium',         lat: 51.2993,  lng:   4.3714,  tier: 1 },
  { name: 'Port of Hamburg',          city: 'Hamburg',        country: 'Germany',         lat: 53.5753,  lng:   9.9669,  tier: 1 },
  { name: 'Port of Los Angeles',      city: 'Los Angeles',    country: 'USA',             lat: 33.7395,  lng: -118.2720, tier: 1 },
  { name: 'Port of Long Beach',       city: 'Long Beach',     country: 'USA',             lat: 33.7676,  lng: -118.1962, tier: 1 },
  { name: 'Port of New York/NJ',      city: 'New York',       country: 'USA',             lat: 40.6892,  lng:  -74.0445, tier: 1 },
  { name: 'Port of Savannah',         city: 'Savannah',       country: 'USA',             lat: 32.0835,  lng:  -81.0998, tier: 1 },
  { name: 'Port of Tokyo',            city: 'Tokyo',          country: 'Japan',           lat: 35.6197,  lng: 139.7747,  tier: 1 },
  { name: 'Port of Yokohama',         city: 'Yokohama',       country: 'Japan',           lat: 35.4437,  lng: 139.6380,  tier: 1 },
  { name: 'Port of Sydney',           city: 'Sydney',         country: 'Australia',       lat: -33.8523, lng: 151.2108,  tier: 1 },
  { name: 'Port of Melbourne',        city: 'Melbourne',      country: 'Australia',       lat: -37.8283, lng: 144.9255,  tier: 1 },
  { name: 'Port of Santos',           city: 'Santos',         country: 'Brazil',          lat: -23.9618, lng:  -46.3322, tier: 1 },
  { name: 'Port of Buenos Aires',     city: 'Buenos Aires',   country: 'Argentina',       lat: -34.5997, lng:  -58.3731, tier: 1 },
  { name: 'Mumbai Port',              city: 'Mumbai',         country: 'India',           lat: 18.9322,  lng:  72.8376,  tier: 1 },
  { name: 'Chennai Port',             city: 'Chennai',        country: 'India',           lat: 13.0948,  lng:  80.2969,  tier: 1 },
  { name: 'Port of Colombo',          city: 'Colombo',        country: 'Sri Lanka',       lat:  6.9497,  lng:  79.8429,  tier: 1 },
  { name: 'Piraeus Port',             city: 'Piraeus',        country: 'Greece',          lat: 37.9411,  lng:  23.6434,  tier: 1 },
  { name: 'Port of Istanbul',         city: 'Istanbul',       country: 'Turkey',          lat: 41.0082,  lng:  28.9784,  tier: 1 },
  { name: 'Felixstowe Port',          city: 'Felixstowe',     country: 'United Kingdom',  lat: 51.9636,  lng:   1.3511,  tier: 1 },
  { name: 'Port of Valencia',         city: 'Valencia',       country: 'Spain',           lat: 39.4476,  lng:  -0.3263,  tier: 1 },
  { name: 'Port of Barcelona',        city: 'Barcelona',      country: 'Spain',           lat: 41.3504,  lng:   2.1688,  tier: 1 },
  { name: 'Port of Marseille',        city: 'Marseille',      country: 'France',          lat: 43.3000,  lng:   5.3833,  tier: 1 },
  { name: 'Port of Le Havre',         city: 'Le Havre',       country: 'France',          lat: 49.4938,  lng:   0.1078,  tier: 1 },
  { name: 'Port of Genoa',            city: 'Genoa',          country: 'Italy',           lat: 44.4049,  lng:   8.9446,  tier: 1 },
  { name: 'Port of Naples',           city: 'Naples',         country: 'Italy',           lat: 40.8322,  lng:  14.2681,  tier: 1 },
  { name: 'Port of Durban',           city: 'Durban',         country: 'South Africa',    lat: -29.8687, lng:  31.0218,  tier: 1 },
  { name: 'Port of Lagos',            city: 'Lagos',          country: 'Nigeria',         lat:  6.4531,  lng:   3.3958,  tier: 1 },
  { name: 'Port of Mombasa',          city: 'Mombasa',        country: 'Kenya',           lat: -4.0435,  lng:  39.6682,  tier: 1 },
  { name: 'Port of Cape Town',        city: 'Cape Town',      country: 'South Africa',    lat: -33.9258, lng:  18.4232,  tier: 1 },
  { name: 'Port of Vancouver',        city: 'Vancouver',      country: 'Canada',          lat: 49.2827,  lng: -123.1207, tier: 1 },
  { name: 'Port of Montreal',         city: 'Montreal',       country: 'Canada',          lat: 45.5088,  lng:  -73.5545, tier: 1 },
  { name: 'Port of Halifax',          city: 'Halifax',        country: 'Canada',          lat: 44.6669,  lng:  -63.5713, tier: 1 },
  { name: 'Port of Callao',           city: 'Callao',         country: 'Peru',            lat: -12.0432, lng:  -77.1282, tier: 1 },
  { name: 'Port of Cartagena',        city: 'Cartagena',      country: 'Colombia',        lat: 10.3910,  lng:  -75.4794, tier: 1 },
  { name: 'Port of Colon',            city: 'Colon',          country: 'Panama',          lat:  9.3659,  lng:  -79.9000, tier: 1 },
  { name: 'Port of Shenzhen',         city: 'Shenzhen',       country: 'China',           lat: 22.5429,  lng: 113.9020,  tier: 1 },
  { name: 'Port of Kaohsiung',        city: 'Kaohsiung',      country: 'Taiwan',          lat: 22.6163,  lng: 120.2897,  tier: 1 },
  { name: 'Port of Tanjung Pelepas',  city: 'Johor Bahru',    country: 'Malaysia',        lat:  1.3626,  lng: 103.5514,  tier: 1 },
  { name: 'Port of Laem Chabang',     city: 'Chonburi',       country: 'Thailand',        lat: 13.0785,  lng: 100.8820,  tier: 1 },
  { name: 'Jawaharlal Nehru Port',    city: 'Navi Mumbai',    country: 'India',           lat: 18.9489,  lng:  72.9538,  tier: 1 },

  // ── Tier 2: Regional ports ──────────────────────────────
  { name: 'Port of Osaka',            city: 'Osaka',          country: 'Japan',           lat: 34.6537,  lng: 135.4636,  tier: 2 },
  { name: 'Port of Kobe',             city: 'Kobe',           country: 'Japan',           lat: 34.6901,  lng: 135.1955,  tier: 2 },
  { name: 'Port of Nagoya',           city: 'Nagoya',         country: 'Japan',           lat: 35.0744,  lng: 136.8894,  tier: 2 },
  { name: 'Port of Incheon',          city: 'Incheon',        country: 'South Korea',     lat: 37.4563,  lng: 126.7052,  tier: 2 },
  { name: 'Port of Guangzhou Nansha', city: 'Guangzhou',      country: 'China',           lat: 22.7500,  lng: 113.5333,  tier: 2 },
  { name: 'Port of Manila',           city: 'Manila',         country: 'Philippines',     lat: 14.5794,  lng: 120.9662,  tier: 2 },
  { name: 'Port of Jakarta',          city: 'Jakarta',        country: 'Indonesia',       lat: -6.1087,  lng: 106.8826,  tier: 2 },
  { name: 'Port of Ho Chi Minh',      city: 'Ho Chi Minh',    country: 'Vietnam',         lat: 10.7769,  lng: 106.7009,  tier: 2 },
  { name: 'Port of Hai Phong',        city: 'Hai Phong',      country: 'Vietnam',         lat: 20.8449,  lng: 106.6881,  tier: 2 },
  { name: 'Port of Klang North',      city: 'Klang',          country: 'Malaysia',        lat:  3.0400,  lng: 101.3900,  tier: 2 },
  { name: 'Port of Salalah',          city: 'Salalah',        country: 'Oman',            lat: 16.9382,  lng:  54.0012,  tier: 2 },
  { name: 'Port of Jeddah',           city: 'Jeddah',         country: 'Saudi Arabia',    lat: 21.5000,  lng:  39.1500,  tier: 2 },
  { name: 'Port of Dammam',           city: 'Dammam',         country: 'Saudi Arabia',    lat: 26.4367,  lng:  50.1033,  tier: 2 },
  { name: 'Port of Aden',             city: 'Aden',           country: 'Yemen',           lat: 12.7857,  lng:  45.0187,  tier: 2 },
  { name: 'Port of Karachi',          city: 'Karachi',        country: 'Pakistan',        lat: 24.8607,  lng:  67.0011,  tier: 2 },
  { name: 'Port of Chittagong',       city: 'Chittagong',     country: 'Bangladesh',      lat: 22.3399,  lng:  91.8155,  tier: 2 },
  { name: 'Port of Alexandroupoli',   city: 'Alexandroupoli', country: 'Greece',          lat: 40.8432,  lng:  25.8772,  tier: 2 },
  { name: 'Port of Alexandria',       city: 'Alexandria',     country: 'Egypt',           lat: 31.2001,  lng:  29.9187,  tier: 2 },
  { name: 'Port of Dakar',            city: 'Dakar',          country: 'Senegal',         lat: 14.6928,  lng: -17.4467,  tier: 2 },
  { name: 'Port of Abidjan',          city: 'Abidjan',        country: "Côte d'Ivoire",   lat:  5.3600,  lng:  -4.0083,  tier: 2 },
  { name: 'Port of Tema',             city: 'Tema',           country: 'Ghana',           lat:  5.6333,  lng:   0.0167,  tier: 2 },
  { name: 'Port of Dar es Salaam',    city: 'Dar es Salaam',  country: 'Tanzania',        lat: -6.8180,  lng:  39.2938,  tier: 2 },
  { name: 'Port of Maputo',           city: 'Maputo',         country: 'Mozambique',      lat: -25.9689, lng:  32.5732,  tier: 2 },
  { name: 'Port of Luanda',           city: 'Luanda',         country: 'Angola',          lat: -8.8159,  lng:  13.2306,  tier: 2 },
  { name: 'Port of Tunis',            city: 'Tunis',          country: 'Tunisia',         lat: 36.7980,  lng:  10.3090,  tier: 2 },
  { name: 'Port of Casablanca',       city: 'Casablanca',     country: 'Morocco',         lat: 33.5900,  lng:  -7.6167,  tier: 2 },
  { name: 'Port of Algiers',          city: 'Algiers',        country: 'Algeria',         lat: 36.7765,  lng:   3.0472,  tier: 2 },
  { name: 'Port of Tripoli',          city: 'Tripoli',        country: 'Libya',           lat: 32.9011,  lng:  13.1803,  tier: 2 },
  { name: 'Port of Rio de Janeiro',   city: 'Rio de Janeiro', country: 'Brazil',          lat: -22.8985, lng:  -43.1777, tier: 2 },
  { name: 'Port of Paranaguá',        city: 'Paranaguá',      country: 'Brazil',          lat: -25.5200, lng:  -48.5100, tier: 2 },
  { name: 'Port of Valparaíso',       city: 'Valparaíso',     country: 'Chile',           lat: -33.0432, lng:  -71.6202, tier: 2 },
  { name: 'Port of Guayaquil',        city: 'Guayaquil',      country: 'Ecuador',         lat: -2.1894,  lng:  -79.8891, tier: 2 },
  { name: 'Port of Veracruz',         city: 'Veracruz',       country: 'Mexico',          lat: 19.1960,  lng:  -96.1332, tier: 2 },
  { name: 'Port of Miami',            city: 'Miami',          country: 'USA',             lat: 25.7617,  lng:  -80.1918, tier: 2 },
  { name: 'Port of Seattle',          city: 'Seattle',        country: 'USA',             lat: 47.6062,  lng: -122.3321, tier: 2 },
  { name: 'Port of Houston',          city: 'Houston',        country: 'USA',             lat: 29.7604,  lng:  -95.3698, tier: 2 },
  { name: 'Port of New Orleans',      city: 'New Orleans',    country: 'USA',             lat: 29.9511,  lng:  -90.0715, tier: 2 },
  { name: 'Port of Baltimore',        city: 'Baltimore',      country: 'USA',             lat: 39.2904,  lng:  -76.6122, tier: 2 },
  { name: 'Port of Gdansk',           city: 'Gdansk',         country: 'Poland',          lat: 54.3520,  lng:  18.6466,  tier: 2 },
  { name: 'Port of Bremen',           city: 'Bremen',         country: 'Germany',         lat: 53.0793,  lng:   8.8017,  tier: 2 },
  { name: 'Port of Lisbon',           city: 'Lisbon',         country: 'Portugal',        lat: 38.7169,  lng:  -9.1395,  tier: 2 },
  { name: 'Port of Tallinn',          city: 'Tallinn',        country: 'Estonia',         lat: 59.4370,  lng:  24.7536,  tier: 2 },
  { name: 'Port of Riga',             city: 'Riga',           country: 'Latvia',          lat: 56.9460,  lng:  24.1059,  tier: 2 },
  { name: 'Port of Helsinki',         city: 'Helsinki',       country: 'Finland',         lat: 60.1699,  lng:  24.9384,  tier: 2 },
  { name: 'Port of Gothenburg',       city: 'Gothenburg',     country: 'Sweden',          lat: 57.7089,  lng:  11.9746,  tier: 2 },
];

// ══════════════════════════════════════════════════════════
//  DATA — MILITARY BASES
//  type: 'air' | 'naval' | 'army'
//  sprite: mil_airbase | mil_naval_base | mil_army_hq
// ══════════════════════════════════════════════════════════
const MILITARY_BASES = [
  // ── USA — Tier 1 ───────────────────────────────────────
  { name: 'Camp Pendleton',             country: 'USA',         lat: 33.2700,  lng: -117.4147, tier: 1, type: 'army'  },
  { name: 'Fort Liberty (Bragg)',        country: 'USA',         lat: 35.1390,  lng:  -79.0063, tier: 1, type: 'army'  },
  { name: 'Fort Cavazos (Hood)',         country: 'USA',         lat: 31.1350,  lng:  -97.7811, tier: 1, type: 'army'  },
  { name: 'Fort Campbell',              country: 'USA',         lat: 36.6531,  lng:  -87.4736, tier: 1, type: 'army'  },
  { name: 'Lackland Air Force Base',    country: 'USA',         lat: 29.3844,  lng:  -98.6203, tier: 1, type: 'air'   },
  { name: 'Edwards Air Force Base',     country: 'USA',         lat: 34.9050,  lng: -117.8838, tier: 1, type: 'air'   },
  { name: 'Ramstein Air Base',          country: 'Germany',     lat: 49.4369,  lng:   7.6003,  tier: 1, type: 'air'   },
  { name: 'Yokota Air Base',            country: 'Japan',       lat: 35.7485,  lng: 139.3480,  tier: 1, type: 'air'   },
  { name: 'Kadena Air Base',            country: 'Japan',       lat: 26.3551,  lng: 127.7690,  tier: 1, type: 'air'   },
  { name: 'Diego Garcia Naval Base',    country: 'UK/USA',      lat: -7.3133,  lng:  72.4228,  tier: 1, type: 'naval' },
  { name: 'Pearl Harbor Naval Station', country: 'USA',         lat: 21.3569,  lng: -157.9742, tier: 1, type: 'naval' },
  { name: 'Norfolk Naval Station',      country: 'USA',         lat: 36.9476,  lng:  -76.3288, tier: 1, type: 'naval' },
  { name: 'Bagram Airfield',            country: 'Afghanistan', lat: 34.9460,  lng:  69.2650,  tier: 1, type: 'air'   },
  { name: 'Camp Lejeune',               country: 'USA',         lat: 34.6773,  lng:  -77.3370, tier: 1, type: 'army'  },
  { name: 'JBLM Fort Lewis',            country: 'USA',         lat: 47.0951,  lng: -122.5800, tier: 1, type: 'army'  },
  { name: 'Fort Wainwright',            country: 'USA',         lat: 64.8270,  lng: -147.6540, tier: 1, type: 'army'  },
  { name: 'Eglin Air Force Base',       country: 'USA',         lat: 30.4832,  lng:  -86.5255, tier: 1, type: 'air'   },
  { name: 'Wright-Patterson AFB',       country: 'USA',         lat: 39.8263,  lng:  -84.0483, tier: 1, type: 'air'   },
  { name: 'Langley Air Force Base',     country: 'USA',         lat: 37.0832,  lng:  -76.3597, tier: 1, type: 'air'   },
  { name: 'MacDill Air Force Base',     country: 'USA',         lat: 27.8493,  lng:  -82.5219, tier: 1, type: 'air'   },
  { name: 'Naval Base San Diego',       country: 'USA',         lat: 32.6713,  lng: -117.1574, tier: 1, type: 'naval' },
  { name: 'Naval Base Kitsap',          country: 'USA',         lat: 47.5641,  lng: -122.6320, tier: 1, type: 'naval' },
  { name: 'Camp Humphreys',             country: 'South Korea', lat: 36.9711,  lng: 127.0322,  tier: 1, type: 'army'  },
  { name: 'Osan Air Base',              country: 'South Korea', lat: 37.0900,  lng: 127.0300,  tier: 1, type: 'air'   },
  { name: 'Incirlik Air Base',          country: 'Turkey',      lat: 37.0021,  lng:  35.4258,  tier: 1, type: 'air'   },
  { name: 'Aviano Air Base',            country: 'Italy',       lat: 46.0314,  lng:  12.5974,  tier: 1, type: 'air'   },
  { name: 'Naval Air Station Sigonella',country: 'Italy',       lat: 37.4017,  lng:  14.9225,  tier: 1, type: 'naval' },
  { name: 'Rota Naval Station',         country: 'Spain',       lat: 36.6450,  lng:  -6.3500,  tier: 1, type: 'naval' },

  // ── Russia — Tier 1 ────────────────────────────────────
  { name: 'Severomorsk (Northern Fleet)', country: 'Russia',    lat: 69.0758,  lng:  33.4164,  tier: 1, type: 'naval' },
  { name: 'Vladivostok Pacific Fleet',  country: 'Russia',      lat: 43.1150,  lng: 131.8857,  tier: 1, type: 'naval' },
  { name: 'Kant Air Base',              country: 'Kyrgyzstan',  lat: 42.8567,  lng:  74.8458,  tier: 1, type: 'air'   },
  { name: 'Tartus Naval Base',          country: 'Syria',       lat: 34.8920,  lng:  35.8860,  tier: 1, type: 'naval' },
  { name: 'Khmeimim Air Base',          country: 'Syria',       lat: 35.4011,  lng:  35.9478,  tier: 1, type: 'air'   },
  { name: 'Baltiysk Naval Base',        country: 'Russia',      lat: 54.6514,  lng:  19.9033,  tier: 1, type: 'naval' },
  { name: 'Sevastopol Naval Base',      country: 'Russia/Ukraine', lat: 44.6166, lng: 33.5254, tier: 1, type: 'naval' },
  { name: 'Engels Air Base',            country: 'Russia',      lat: 51.4628,  lng:  46.1961,  tier: 1, type: 'air'   },
  { name: 'Saratov-Dyomin',            country: 'Russia',      lat: 51.5651,  lng:  46.1019,  tier: 1, type: 'army'  },

  // ── China — Tier 1 ─────────────────────────────────────
  { name: 'Sanya Naval Base (Yulin)',   country: 'China',       lat: 18.2273,  lng: 109.5792,  tier: 1, type: 'naval' },
  { name: 'Zhanjiang Naval Base',       country: 'China',       lat: 21.1900,  lng: 110.3900,  tier: 1, type: 'naval' },
  { name: 'Qingdao Naval Base',         country: 'China',       lat: 36.0671,  lng: 120.3826,  tier: 1, type: 'naval' },
  { name: 'Djibouti Support Base',      country: 'Djibouti',    lat: 11.5720,  lng:  43.1480,  tier: 1, type: 'naval' },
  { name: 'Lhasa Air Base',             country: 'China',       lat: 29.9030,  lng:  91.0590,  tier: 1, type: 'air'   },
  { name: 'Shenyang Military Region HQ',country: 'China',       lat: 41.8057,  lng: 123.4315,  tier: 1, type: 'army'  },

  // ── UK — Tier 1 ────────────────────────────────────────
  { name: 'RAF Brize Norton',           country: 'United Kingdom', lat: 51.7497, lng: -1.5836,  tier: 1, type: 'air'   },
  { name: 'HMNB Portsmouth',            country: 'United Kingdom', lat: 50.8001, lng: -1.1104,  tier: 1, type: 'naval' },
  { name: 'HMNB Clyde (Faslane)',       country: 'United Kingdom', lat: 56.0333, lng: -4.8242,  tier: 1, type: 'naval' },
  { name: 'RAF Lakenheath',             country: 'United Kingdom', lat: 52.4093, lng:  0.5605,  tier: 1, type: 'air'   },
  { name: 'HMNB Devonport',             country: 'United Kingdom', lat: 50.3705, lng: -4.1743,  tier: 1, type: 'naval' },

  // ── France — Tier 1 ────────────────────────────────────
  { name: 'Toulon Naval Base',          country: 'France',      lat: 43.1107,  lng:   5.9319,  tier: 1, type: 'naval' },
  { name: 'Camp Lemonnier (Djibouti)', country: 'Djibouti',    lat: 11.5470,  lng:  43.1476,  tier: 1, type: 'army'  },
  { name: 'BA 125 Istres',             country: 'France',      lat: 43.5228,  lng:   4.9239,  tier: 1, type: 'air'   },

  // ── NATO / Allied Europe — Tier 1 ──────────────────────
  { name: 'Kleine Brogel Air Base',     country: 'Belgium',     lat: 51.1683,  lng:   5.4700,  tier: 1, type: 'air'   },
  { name: 'Büchel Air Base',            country: 'Germany',     lat: 50.1739,  lng:   7.0633,  tier: 1, type: 'air'   },
  { name: 'Volkel Air Base',            country: 'Netherlands', lat: 51.6561,  lng:   5.7075,  tier: 1, type: 'air'   },
  { name: 'Ämari Air Base',             country: 'Estonia',     lat: 59.2603,  lng:  24.2083,  tier: 1, type: 'air'   },
  { name: 'Mihail Kogalniceanu AB',     country: 'Romania',     lat: 44.3621,  lng:  28.4881,  tier: 1, type: 'air'   },
  { name: 'Camp Bondsteel',             country: 'Kosovo',      lat: 42.3599,  lng:  21.3538,  tier: 1, type: 'army'  },

  // ── Tier 2 bases ───────────────────────────────────────
  { name: 'Fort Drum',                  country: 'USA',         lat: 44.0558,  lng:  -75.7782, tier: 2, type: 'army'  },
  { name: 'Fort Stewart',               country: 'USA',         lat: 31.8693,  lng:  -81.6093, tier: 2, type: 'army'  },
  { name: 'Fort Bliss',                 country: 'USA',         lat: 31.8117,  lng: -106.4213, tier: 2, type: 'army'  },
  { name: 'Fort Carson',                country: 'USA',         lat: 38.7399,  lng: -104.7899, tier: 2, type: 'army'  },
  { name: 'Hill Air Force Base',        country: 'USA',         lat: 41.1244,  lng: -111.9729, tier: 2, type: 'air'   },
  { name: 'Dyess Air Force Base',       country: 'USA',         lat: 32.4208,  lng:  -99.8548, tier: 2, type: 'air'   },
  { name: 'Minot Air Force Base',       country: 'USA',         lat: 48.4158,  lng: -101.3578, tier: 2, type: 'air'   },
  { name: 'Naval Station Mayport',      country: 'USA',         lat: 30.3910,  lng:  -81.4253, tier: 2, type: 'naval' },
  { name: 'Naval Station Rota',         country: 'Spain',       lat: 36.6453,  lng:  -6.3497,  tier: 2, type: 'naval' },
  { name: 'Guantanamo Bay Naval Base',  country: 'Cuba',        lat: 19.9060,  lng:  -75.1009, tier: 2, type: 'naval' },
  { name: 'Al Udeid Air Base',          country: 'Qatar',       lat: 25.1174,  lng:  51.3149,  tier: 2, type: 'air'   },
  { name: 'Ali Al Salem Air Base',      country: 'Kuwait',      lat: 29.3439,  lng:  47.5202,  tier: 2, type: 'air'   },
  { name: 'Ain al-Asad Air Base',       country: 'Iraq',        lat: 33.7856,  lng:  42.4415,  tier: 2, type: 'air'   },
  { name: 'Al-Taji Base',               country: 'Iraq',        lat: 33.5199,  lng:  44.2639,  tier: 2, type: 'army'  },
  { name: 'Mihail Kogalniceanu Base',   country: 'Romania',     lat: 44.3621,  lng:  28.4881,  tier: 2, type: 'air'   },
  { name: 'Powidz Air Base',            country: 'Poland',      lat: 52.3793,  lng:  17.8537,  tier: 2, type: 'air'   },
  { name: 'Lask Air Base',              country: 'Poland',      lat: 51.5512,  lng:  19.1793,  tier: 2, type: 'air'   },
  { name: 'Novorossiysk Naval Base',    country: 'Russia',      lat: 44.7238,  lng:  37.7687,  tier: 2, type: 'naval' },
  { name: 'Murmansk Army HQ',           country: 'Russia',      lat: 68.9585,  lng:  33.0827,  tier: 2, type: 'army'  },
  { name: 'Ulan-Ude Air Base',          country: 'Russia',      lat: 51.8078,  lng: 107.6383,  tier: 2, type: 'air'   },
  { name: 'Khabarovsk Military Base',   country: 'Russia',      lat: 48.4827,  lng: 135.0840,  tier: 2, type: 'army'  },
  { name: 'Guangzhou Military Region',  country: 'China',       lat: 23.1291,  lng: 113.2644,  tier: 2, type: 'army'  },
  { name: 'Jinan Military Region',      country: 'China',       lat: 36.6512,  lng: 117.1201,  tier: 2, type: 'army'  },
  { name: 'Chengdu Military Region',    country: 'China',       lat: 30.5728,  lng: 104.0668,  tier: 2, type: 'army'  },
  { name: 'Kashgar Air Base',           country: 'China',       lat: 39.5428,  lng:  76.0199,  tier: 2, type: 'air'   },
  { name: 'RAF Lossiemouth',            country: 'United Kingdom', lat: 57.7052, lng: -3.3389,  tier: 2, type: 'air'   },
  { name: 'RAF Coningsby',              country: 'United Kingdom', lat: 53.0930, lng: -0.1667,  tier: 2, type: 'air'   },
  { name: 'BA 701 Salon-de-Provence',   country: 'France',      lat: 43.6064,  lng:   5.1092,  tier: 2, type: 'air'   },
  { name: 'Decimomannu Air Base',       country: 'Italy',       lat: 39.3544,  lng:   8.9725,  tier: 2, type: 'air'   },
  { name: 'Souda Bay Naval Base',       country: 'Greece',      lat: 35.5308,  lng:  24.0714,  tier: 2, type: 'naval' },
  { name: 'Larissa Air Base',           country: 'Greece',      lat: 39.6513,  lng:  22.4651,  tier: 2, type: 'air'   },
  { name: 'Akrotiri RAF',               country: 'Cyprus',      lat: 34.5887,  lng:  32.9878,  tier: 2, type: 'air'   },
  { name: 'Konya Air Base',             country: 'Turkey',      lat: 37.9791,  lng:  32.5639,  tier: 2, type: 'air'   },
  { name: 'Balikesir Air Base',         country: 'Turkey',      lat: 39.6192,  lng:  27.9260,  tier: 2, type: 'air'   },
  { name: 'Cam Ranh Bay',               country: 'Vietnam',     lat: 11.9989,  lng: 109.2190,  tier: 2, type: 'naval' },
  { name: 'Changi Naval Base',          country: 'Singapore',   lat:  1.3644,  lng: 104.0028,  tier: 2, type: 'naval' },
  { name: 'HMAS Garden Island',         country: 'Australia',   lat: -33.8583, lng: 151.2247,  tier: 2, type: 'naval' },
  { name: 'RAAF Base Williamtown',      country: 'Australia',   lat: -32.7950, lng: 151.8333,  tier: 2, type: 'air'   },
  { name: 'RAAF Base Darwin',           country: 'Australia',   lat: -12.4239, lng: 130.8769,  tier: 2, type: 'air'   },
  { name: 'Subic Bay Naval Base',       country: 'Philippines', lat: 14.8000,  lng: 120.2700,  tier: 2, type: 'naval' },
  { name: 'Deversoir Air Base',         country: 'Egypt',       lat: 30.3539,  lng:  32.5525,  tier: 2, type: 'air'   },
];

// ══════════════════════════════════════════════════════════
//  DATA — CITIES
//  tier 1 = capital, tier 2 = major non-capital
// ══════════════════════════════════════════════════════════
const CITIES = [
  // ── TIER 1 — World Capitals ────────────────────────────

  // Africa
  { name: 'Algiers',          country: 'Algeria',                  lat: 36.7372,  lng:   3.0865,  tier: 1, pop: 2800000 },
  { name: 'Luanda',           country: 'Angola',                   lat: -8.8368,  lng:  13.2343,  tier: 1, pop: 2800000 },
  { name: 'Porto-Novo',       country: 'Benin',                    lat:  6.3654,  lng:   2.4183,  tier: 1, pop: 264000  },
  { name: 'Gaborone',         country: 'Botswana',                 lat: -24.6282, lng:  25.9231,  tier: 1, pop: 231000  },
  { name: 'Ouagadougou',      country: 'Burkina Faso',             lat: 12.3714,  lng:  -1.5197,  tier: 1, pop: 2200000 },
  { name: 'Gitega',           country: 'Burundi',                  lat: -3.4271,  lng:  29.9252,  tier: 1, pop: 42000   },
  { name: 'Yaoundé',          country: 'Cameroon',                 lat:  3.8480,  lng:  11.5021,  tier: 1, pop: 2765000 },
  { name: 'Bangui',           country: 'Central African Republic', lat:  4.3612,  lng:  18.5550,  tier: 1, pop: 833000  },
  { name: "N'Djamena",        country: 'Chad',                     lat: 12.1048,  lng:  15.0445,  tier: 1, pop: 1323000 },
  { name: 'Moroni',           country: 'Comoros',                  lat: -11.7022, lng:  43.2551,  tier: 1, pop: 60000   },
  { name: 'Kinshasa',         country: 'Democratic Republic of Congo', lat: -4.3317, lng: 15.3200, tier: 1, pop: 14342000 },
  { name: 'Brazzaville',      country: 'Republic of Congo',        lat: -4.2634,  lng:  15.2429,  tier: 1, pop: 2388000 },
  { name: 'Djibouti',         country: 'Djibouti',                 lat: 11.5720,  lng:  43.1450,  tier: 1, pop: 524000  },
  { name: 'Cairo',            country: 'Egypt',                    lat: 30.0444,  lng:  31.2357,  tier: 1, pop: 10107000 },
  { name: 'Malabo',           country: 'Equatorial Guinea',        lat:  3.7500,  lng:   8.7833,  tier: 1, pop: 297000  },
  { name: 'Asmara',           country: 'Eritrea',                  lat: 15.3381,  lng:  38.9318,  tier: 1, pop: 963000  },
  { name: 'Addis Ababa',      country: 'Ethiopia',                 lat:  9.0320,  lng:  38.7469,  tier: 1, pop: 3638000 },
  { name: 'Libreville',       country: 'Gabon',                    lat:  0.3924,  lng:   9.4536,  tier: 1, pop: 813000  },
  { name: 'Banjul',           country: 'Gambia',                   lat: 13.4531,  lng: -16.5775,  tier: 1, pop: 31000   },
  { name: 'Accra',            country: 'Ghana',                    lat:  5.5600,  lng:  -0.2057,  tier: 1, pop: 2514000 },
  { name: 'Conakry',          country: 'Guinea',                   lat:  9.5370,  lng: -13.6773,  tier: 1, pop: 1667000 },
  { name: 'Bissau',           country: 'Guinea-Bissau',            lat: 11.8636,  lng: -15.5977,  tier: 1, pop: 388000  },
  { name: 'Yamoussoukro',     country: "Côte d'Ivoire",            lat:  6.8206,  lng:  -5.2767,  tier: 1, pop: 213000  },
  { name: 'Nairobi',          country: 'Kenya',                    lat: -1.2921,  lng:  36.8219,  tier: 1, pop: 4398000 },
  { name: 'Maseru',           country: 'Lesotho',                  lat: -29.3167, lng:  27.4833,  tier: 1, pop: 330000  },
  { name: 'Monrovia',         country: 'Liberia',                  lat:  6.2907,  lng: -10.7605,  tier: 1, pop: 1258000 },
  { name: 'Tripoli',          country: 'Libya',                    lat: 32.8872,  lng:  13.1913,  tier: 1, pop: 1158000 },
  { name: 'Antananarivo',     country: 'Madagascar',               lat: -18.9137, lng:  47.5362,  tier: 1, pop: 3058000 },
  { name: 'Lilongwe',         country: 'Malawi',                   lat: -13.9669, lng:  33.7873,  tier: 1, pop: 989000  },
  { name: 'Bamako',           country: 'Mali',                     lat: 12.6392,  lng:  -8.0029,  tier: 1, pop: 2709000 },
  { name: 'Nouakchott',       country: 'Mauritania',               lat: 18.0735,  lng: -15.9582,  tier: 1, pop: 1030000 },
  { name: 'Port Louis',       country: 'Mauritius',                lat: -20.1619, lng:  57.4989,  tier: 1, pop: 149000  },
  { name: 'Rabat',            country: 'Morocco',                  lat: 34.0209,  lng:  -6.8416,  tier: 1, pop: 577000  },
  { name: 'Maputo',           country: 'Mozambique',               lat: -25.9692, lng:  32.5732,  tier: 1, pop: 1191000 },
  { name: 'Windhoek',         country: 'Namibia',                  lat: -22.5597, lng:  17.0832,  tier: 1, pop: 431000  },
  { name: 'Niamey',           country: 'Niger',                    lat: 13.5116,  lng:   2.1254,  tier: 1, pop: 1302000 },
  { name: 'Abuja',            country: 'Nigeria',                  lat:  9.0765,  lng:   7.3986,  tier: 1, pop: 3600000 },
  { name: 'Kigali',           country: 'Rwanda',                   lat: -1.9706,  lng:  30.1044,  tier: 1, pop: 1132000 },
  { name: 'São Tomé',         country: 'São Tomé and Príncipe',    lat:  0.3365,  lng:   6.7273,  tier: 1, pop: 90000   },
  { name: 'Dakar',            country: 'Senegal',                  lat: 14.7167,  lng: -17.4677,  tier: 1, pop: 3137000 },
  { name: 'Victoria',         country: 'Seychelles',               lat: -4.6191,  lng:  55.4513,  tier: 1, pop: 28000   },
  { name: 'Freetown',         country: 'Sierra Leone',             lat:  8.4657,  lng: -13.2317,  tier: 1, pop: 1056000 },
  { name: 'Mogadishu',        country: 'Somalia',                  lat:  2.0469,  lng:  45.3182,  tier: 1, pop: 2587000 },
  { name: 'Pretoria',         country: 'South Africa',             lat: -25.7461, lng:  28.1881,  tier: 1, pop: 741000  },
  { name: 'Juba',             country: 'South Sudan',              lat:  4.8594,  lng:  31.5713,  tier: 1, pop: 525000  },
  { name: 'Khartoum',         country: 'Sudan',                    lat: 15.5518,  lng:  32.5324,  tier: 1, pop: 6160000 },
  { name: 'Mbabane',          country: 'Eswatini',                 lat: -26.3208, lng:  31.1449,  tier: 1, pop: 68000   },
  { name: 'Dodoma',           country: 'Tanzania',                 lat: -6.1630,  lng:  35.7516,  tier: 1, pop: 410000  },
  { name: 'Lomé',             country: 'Togo',                     lat:  6.1375,  lng:   1.2123,  tier: 1, pop: 837000  },
  { name: 'Tunis',            country: 'Tunisia',                  lat: 36.8190,  lng:  10.1658,  tier: 1, pop: 693000  },
  { name: 'Kampala',          country: 'Uganda',                   lat:  0.3476,  lng:  32.5825,  tier: 1, pop: 2100000 },
  { name: 'Lusaka',           country: 'Zambia',                   lat: -15.4167, lng:  28.2833,  tier: 1, pop: 2774000 },
  { name: 'Harare',           country: 'Zimbabwe',                 lat: -17.8252, lng:  31.0335,  tier: 1, pop: 1542000 },

  // Americas
  { name: 'Kabul',            country: 'Afghanistan',              lat: 34.5289,  lng:  69.1725,  tier: 1, pop: 4222000 },
  { name: 'Tirana',           country: 'Albania',                  lat: 41.3317,  lng:  19.8319,  tier: 1, pop: 475000  },
  { name: 'Andorra la Vella', country: 'Andorra',                  lat: 42.5078,  lng:   1.5211,  tier: 1, pop: 22000   },
  { name: 'Buenos Aires',     country: 'Argentina',                lat: -34.6118, lng:  -58.3960, tier: 1, pop: 15370000 },
  { name: 'Nassau',           country: 'Bahamas',                  lat: 25.0480,  lng:  -77.3554, tier: 1, pop: 280000  },
  { name: 'Bridgetown',       country: 'Barbados',                 lat: 13.1132,  lng:  -59.5988, tier: 1, pop: 110000  },
  { name: 'Belmopan',         country: 'Belize',                   lat: 17.2534,  lng:  -88.7713, tier: 1, pop: 22000   },
  { name: 'Sucre',            country: 'Bolivia',                  lat: -19.0477, lng:  -65.2593, tier: 1, pop: 337000  },
  { name: 'Brasília',         country: 'Brazil',                   lat: -15.7975, lng:  -47.8919, tier: 1, pop: 4646000 },
  { name: 'Ottawa',           country: 'Canada',                   lat: 45.4215,  lng:  -75.6919, tier: 1, pop: 994000  },
  { name: 'Santiago',         country: 'Chile',                    lat: -33.4489, lng:  -70.6693, tier: 1, pop: 6310000 },
  { name: 'Bogotá',           country: 'Colombia',                 lat:  4.7110,  lng:  -74.0721, tier: 1, pop: 7412000 },
  { name: 'San José',         country: 'Costa Rica',               lat:  9.9281,  lng:  -84.0907, tier: 1, pop: 342000  },
  { name: 'Havana',           country: 'Cuba',                     lat: 23.1136,  lng:  -82.3666, tier: 1, pop: 2130000 },
  { name: 'Roseau',           country: 'Dominica',                 lat: 15.3010,  lng:  -61.3888, tier: 1, pop: 15000   },
  { name: 'Santo Domingo',    country: 'Dominican Republic',       lat: 18.4861,  lng:  -69.9312, tier: 1, pop: 965000  },
  { name: 'Quito',            country: 'Ecuador',                  lat: -0.2295,  lng:  -78.5243, tier: 1, pop: 1661000 },
  { name: 'San Salvador',     country: 'El Salvador',              lat: 13.6894,  lng:  -89.1872, tier: 1, pop: 568000  },
  { name: "Saint George's",   country: 'Grenada',                  lat: 12.0530,  lng:  -61.7519, tier: 1, pop: 40000   },
  { name: 'Guatemala City',   country: 'Guatemala',                lat: 14.6349,  lng:  -90.5069, tier: 1, pop: 994000  },
  { name: 'Georgetown',       country: 'Guyana',                   lat:  6.8013,  lng:  -58.1551, tier: 1, pop: 235000  },
  { name: 'Port-au-Prince',   country: 'Haiti',                    lat: 18.5425,  lng:  -72.3386, tier: 1, pop: 2618000 },
  { name: 'Tegucigalpa',      country: 'Honduras',                 lat: 14.0818,  lng:  -87.2068, tier: 1, pop: 1363000 },
  { name: 'Kingston',         country: 'Jamaica',                  lat: 17.9971,  lng:  -76.7936, tier: 1, pop: 580000  },
  { name: 'Mexico City',      country: 'Mexico',                   lat: 19.4326,  lng:  -99.1332, tier: 1, pop: 9209944 },
  { name: 'Managua',          country: 'Nicaragua',                lat: 12.1328,  lng:  -86.2726, tier: 1, pop: 1048000 },
  { name: 'Panama City',      country: 'Panama',                   lat:  8.9936,  lng:  -79.5197, tier: 1, pop: 880691 },
  { name: 'Asunción',         country: 'Paraguay',                 lat: -25.2867, lng:  -57.6470, tier: 1, pop: 524000  },
  { name: 'Lima',             country: 'Peru',                     lat: -12.0464, lng:  -77.0428, tier: 1, pop: 10883000 },
  { name: 'Basseterre',       country: 'Saint Kitts and Nevis',    lat: 17.2948,  lng:  -62.7261, tier: 1, pop: 14000   },
  { name: 'Castries',         country: 'Saint Lucia',              lat: 14.0101,  lng:  -60.9875, tier: 1, pop: 22000   },
  { name: 'Kingstown',        country: 'Saint Vincent',            lat: 13.1600,  lng:  -61.2248, tier: 1, pop: 27000   },
  { name: 'Paramaribo',       country: 'Suriname',                 lat:  5.8664,  lng:  -55.1669, tier: 1, pop: 241000  },
  { name: 'Port of Spain',    country: 'Trinidad and Tobago',      lat: 10.6596,  lng:  -61.5000, tier: 1, pop: 544000  },
  { name: 'Montevideo',       country: 'Uruguay',                  lat: -34.9011, lng:  -56.1645, tier: 1, pop: 1381000 },
  { name: 'Washington D.C.',  country: 'USA',                      lat: 38.9072,  lng:  -77.0369, tier: 1, pop: 705749  },
  { name: 'Caracas',          country: 'Venezuela',                lat: 10.4806,  lng:  -66.9036, tier: 1, pop: 2900000 },

  // Asia
  { name: 'Yerevan',          country: 'Armenia',                  lat: 40.1872,  lng:  44.5152,  tier: 1, pop: 1075000 },
  { name: 'Baku',             country: 'Azerbaijan',               lat: 40.4093,  lng:  49.8671,  tier: 1, pop: 2236000 },
  { name: 'Manama',           country: 'Bahrain',                  lat: 26.2154,  lng:  50.5832,  tier: 1, pop: 157000  },
  { name: 'Dhaka',            country: 'Bangladesh',               lat: 23.8103,  lng:  90.4125,  tier: 1, pop: 10356000 },
  { name: 'Thimphu',          country: 'Bhutan',                   lat: 27.4716,  lng:  89.6386,  tier: 1, pop: 115000  },
  { name: 'Bandar Seri Begawan', country: 'Brunei',               lat:  4.9431,  lng: 114.9425,  tier: 1, pop: 100000  },
  { name: 'Phnom Penh',       country: 'Cambodia',                 lat: 11.5625,  lng: 104.9160,  tier: 1, pop: 2129000 },
  { name: 'Beijing',          country: 'China',                    lat: 39.9042,  lng: 116.4074,  tier: 1, pop: 21540000 },
  { name: 'Nicosia',          country: 'Cyprus',                   lat: 35.1856,  lng:  33.3823,  tier: 1, pop: 330000  },
  { name: 'Tbilisi',          country: 'Georgia',                  lat: 41.6938,  lng:  44.8015,  tier: 1, pop: 1118000 },
  { name: 'New Delhi',        country: 'India',                    lat: 28.6139,  lng:  77.2090,  tier: 1, pop: 11007800 },
  { name: 'Jakarta',          country: 'Indonesia',                lat: -6.2088,  lng: 106.8456,  tier: 1, pop: 10562088 },
  { name: 'Tehran',           country: 'Iran',                     lat: 35.6892,  lng:  51.3890,  tier: 1, pop: 9260000 },
  { name: 'Baghdad',          country: 'Iraq',                     lat: 33.3406,  lng:  44.4009,  tier: 1, pop: 7323000 },
  { name: 'Jerusalem',        country: 'Israel',                   lat: 31.7683,  lng:  35.2137,  tier: 1, pop: 936400  },
  { name: 'Tokyo',            country: 'Japan',                    lat: 35.6762,  lng: 139.6503,  tier: 1, pop: 13960000 },
  { name: 'Amman',            country: 'Jordan',                   lat: 31.9522,  lng:  35.9334,  tier: 1, pop: 4007000 },
  { name: 'Nur-Sultan (Astana)', country: 'Kazakhstan',            lat: 51.1694,  lng:  71.4491,  tier: 1, pop: 1029000 },
  { name: 'Kuwait City',      country: 'Kuwait',                   lat: 29.3759,  lng:  47.9774,  tier: 1, pop: 2990000 },
  { name: 'Bishkek',          country: 'Kyrgyzstan',               lat: 42.8746,  lng:  74.5698,  tier: 1, pop: 1074000 },
  { name: 'Vientiane',        country: 'Laos',                     lat: 17.9757,  lng: 102.6331,  tier: 1, pop: 820000  },
  { name: 'Beirut',           country: 'Lebanon',                  lat: 33.8938,  lng:  35.5018,  tier: 1, pop: 2200000 },
  { name: 'Kuala Lumpur',     country: 'Malaysia',                 lat:  3.1390,  lng: 101.6869,  tier: 1, pop: 1769000 },
  { name: 'Malé',             country: 'Maldives',                 lat:  4.1755,  lng:  73.5093,  tier: 1, pop: 133000  },
  { name: 'Ulaanbaatar',      country: 'Mongolia',                 lat: 47.8864,  lng: 106.9057,  tier: 1, pop: 1466000 },
  { name: 'Naypyidaw',        country: 'Myanmar',                  lat: 19.7450,  lng:  96.1297,  tier: 1, pop: 1160000 },
  { name: 'Kathmandu',        country: 'Nepal',                    lat: 27.7172,  lng:  85.3240,  tier: 1, pop: 1442000 },
  { name: 'Islamabad',        country: 'Pakistan',                 lat: 33.7215,  lng:  73.0433,  tier: 1, pop: 1014825 },
  { name: 'Manila',           country: 'Philippines',              lat: 14.5995,  lng: 120.9842,  tier: 1, pop: 1846513 },
  { name: 'Doha',             country: 'Qatar',                    lat: 25.2854,  lng:  51.5310,  tier: 1, pop: 633000  },
  { name: 'Moscow',           country: 'Russia',                   lat: 55.7558,  lng:  37.6176,  tier: 1, pop: 12500000 },
  { name: 'Riyadh',           country: 'Saudi Arabia',             lat: 24.7136,  lng:  46.6753,  tier: 1, pop: 7676654 },
  { name: 'Singapore',        country: 'Singapore',                lat:  1.3521,  lng: 103.8198,  tier: 1, pop: 5850000 },
  { name: 'Seoul',            country: 'South Korea',              lat: 37.5665,  lng: 126.9780,  tier: 1, pop: 9776000 },
  { name: 'Colombo',          country: 'Sri Lanka',                lat:  6.9271,  lng:  79.8612,  tier: 1, pop: 752000  },
  { name: 'Damascus',         country: 'Syria',                    lat: 33.5138,  lng:  36.2765,  tier: 1, pop: 2392000 },
  { name: 'Taipei',           country: 'Taiwan',                   lat: 25.0330,  lng: 121.5654,  tier: 1, pop: 2704000 },
  { name: 'Dushanbe',         country: 'Tajikistan',               lat: 38.5598,  lng:  68.7737,  tier: 1, pop: 863000  },
  { name: 'Bangkok',          country: 'Thailand',                 lat: 13.7563,  lng: 100.5018,  tier: 1, pop: 10539000 },
  { name: 'Dili',             country: 'Timor-Leste',              lat: -8.5586,  lng: 125.5736,  tier: 1, pop: 234000  },
  { name: 'Ankara',           country: 'Turkey',                   lat: 39.9334,  lng:  32.8597,  tier: 1, pop: 5747000 },
  { name: 'Ashgabat',         country: 'Turkmenistan',             lat: 37.9601,  lng:  58.3261,  tier: 1, pop: 809000  },
  { name: 'Abu Dhabi',        country: 'UAE',                      lat: 24.4539,  lng:  54.3773,  tier: 1, pop: 1483000 },
  { name: 'Tashkent',         country: 'Uzbekistan',               lat: 41.2995,  lng:  69.2401,  tier: 1, pop: 2485900 },
  { name: 'Hanoi',            country: 'Vietnam',                  lat: 21.0285,  lng: 105.8542,  tier: 1, pop: 8053663 },
  { name: "Sana'a",           country: 'Yemen',                    lat: 15.3694,  lng:  44.1910,  tier: 1, pop: 2957000 },

  // Europe
  { name: 'Vienna',           country: 'Austria',                  lat: 48.2082,  lng:  16.3738,  tier: 1, pop: 1911191 },
  { name: 'Minsk',            country: 'Belarus',                  lat: 53.9045,  lng:  27.5615,  tier: 1, pop: 2020600 },
  { name: 'Brussels',         country: 'Belgium',                  lat: 50.8503,  lng:   4.3517,  tier: 1, pop: 1208542 },
  { name: 'Sarajevo',         country: 'Bosnia and Herzegovina',   lat: 43.8519,  lng:  18.3866,  tier: 1, pop: 275524  },
  { name: 'Sofia',            country: 'Bulgaria',                 lat: 42.6977,  lng:  23.3219,  tier: 1, pop: 1307439 },
  { name: 'Zagreb',           country: 'Croatia',                  lat: 45.8150,  lng:  15.9819,  tier: 1, pop: 806341  },
  { name: 'Prague',           country: 'Czech Republic',           lat: 50.0755,  lng:  14.4378,  tier: 1, pop: 1324277 },
  { name: 'Copenhagen',       country: 'Denmark',                  lat: 55.6761,  lng:  12.5683,  tier: 1, pop: 794128  },
  { name: 'Tallinn',          country: 'Estonia',                  lat: 59.4370,  lng:  24.7536,  tier: 1, pop: 447081  },
  { name: 'Helsinki',         country: 'Finland',                  lat: 60.1699,  lng:  24.9384,  tier: 1, pop: 658864  },
  { name: 'Paris',            country: 'France',                   lat: 48.8566,  lng:   2.3522,  tier: 1, pop: 2140526 },
  { name: 'Berlin',           country: 'Germany',                  lat: 52.5200,  lng:  13.4050,  tier: 1, pop: 3769000 },
  { name: 'Athens',           country: 'Greece',                   lat: 37.9838,  lng:  23.7275,  tier: 1, pop: 664046  },
  { name: 'Budapest',         country: 'Hungary',                  lat: 47.4979,  lng:  19.0402,  tier: 1, pop: 1752286 },
  { name: 'Reykjavik',        country: 'Iceland',                  lat: 64.1265,  lng: -21.8174,  tier: 1, pop: 131136  },
  { name: 'Dublin',           country: 'Ireland',                  lat: 53.3498,  lng:  -6.2603,  tier: 1, pop: 553165  },
  { name: 'Rome',             country: 'Italy',                    lat: 41.9028,  lng:  12.4964,  tier: 1, pop: 2872800 },
  { name: 'Pristina',         country: 'Kosovo',                   lat: 42.6629,  lng:  21.1655,  tier: 1, pop: 214000  },
  { name: 'Riga',             country: 'Latvia',                   lat: 56.9460,  lng:  24.1059,  tier: 1, pop: 632614  },
  { name: 'Vaduz',            country: 'Liechtenstein',            lat: 47.1410,  lng:   9.5209,  tier: 1, pop: 5800    },
  { name: 'Vilnius',          country: 'Lithuania',                lat: 54.6872,  lng:  25.2797,  tier: 1, pop: 592389  },
  { name: 'Luxembourg City',  country: 'Luxembourg',               lat: 49.6116,  lng:   6.1319,  tier: 1, pop: 128514  },
  { name: 'Skopje',           country: 'North Macedonia',          lat: 41.9981,  lng:  21.4254,  tier: 1, pop: 544086  },
  { name: 'Valletta',         country: 'Malta',                    lat: 35.8997,  lng:  14.5147,  tier: 1, pop: 5827    },
  { name: 'Chișinău',         country: 'Moldova',                  lat: 47.0105,  lng:  28.8638,  tier: 1, pop: 532513  },
  { name: 'Monaco',           country: 'Monaco',                   lat: 43.7384,  lng:   7.4246,  tier: 1, pop: 38300   },
  { name: 'Podgorica',        country: 'Montenegro',               lat: 42.4304,  lng:  19.2594,  tier: 1, pop: 177000  },
  { name: 'Amsterdam',        country: 'Netherlands',              lat: 52.3676,  lng:   4.9041,  tier: 1, pop: 921402  },
  { name: 'Oslo',             country: 'Norway',                   lat: 59.9139,  lng:  10.7522,  tier: 1, pop: 693491  },
  { name: 'Warsaw',           country: 'Poland',                   lat: 52.2297,  lng:  21.0122,  tier: 1, pop: 1793579 },
  { name: 'Lisbon',           country: 'Portugal',                 lat: 38.7169,  lng:  -9.1399,  tier: 1, pop: 548703  },
  { name: 'Bucharest',        country: 'Romania',                  lat: 44.4268,  lng:  26.1025,  tier: 1, pop: 1883425 },
  { name: 'San Marino',       country: 'San Marino',               lat: 43.9424,  lng:  12.4578,  tier: 1, pop: 4100    },
  { name: 'Belgrade',         country: 'Serbia',                   lat: 44.7866,  lng:  20.4489,  tier: 1, pop: 1688667 },
  { name: 'Bratislava',       country: 'Slovakia',                 lat: 48.1486,  lng:  17.1077,  tier: 1, pop: 475503  },
  { name: 'Ljubljana',        country: 'Slovenia',                 lat: 46.0569,  lng:  14.5058,  tier: 1, pop: 284355  },
  { name: 'Madrid',           country: 'Spain',                    lat: 40.4168,  lng:  -3.7038,  tier: 1, pop: 3223334 },
  { name: 'Stockholm',        country: 'Sweden',                   lat: 59.3293,  lng:  18.0686,  tier: 1, pop: 975551  },
  { name: 'Bern',             country: 'Switzerland',              lat: 46.9480,  lng:   7.4474,  tier: 1, pop: 134794  },
  { name: 'Kyiv',             country: 'Ukraine',                  lat: 50.4501,  lng:  30.5234,  tier: 1, pop: 2967360 },
  { name: 'London',           country: 'United Kingdom',           lat: 51.5074,  lng:  -0.1278,  tier: 1, pop: 9002488 },
  { name: 'Vatican City',     country: 'Vatican City',             lat: 41.9029,  lng:  12.4534,  tier: 1, pop: 800     },

  // Oceania
  { name: 'Canberra',         country: 'Australia',                lat: -35.2809, lng: 149.1300,  tier: 1, pop: 431000  },
  { name: 'Suva',             country: 'Fiji',                     lat: -18.1416, lng: 178.4419,  tier: 1, pop: 93970   },
  { name: 'South Tarawa',     country: 'Kiribati',                 lat:  1.3282,  lng: 172.9784,  tier: 1, pop: 63017   },
  { name: 'Majuro',           country: 'Marshall Islands',         lat:  7.1164,  lng: 171.1857,  tier: 1, pop: 31000   },
  { name: 'Palikir',          country: 'Micronesia',               lat:  6.9248,  lng: 158.1618,  tier: 1, pop: 6600    },
  { name: 'Wellington',       country: 'New Zealand',              lat: -41.2865, lng: 174.7762,  tier: 1, pop: 215000  },
  { name: 'Melekeok',         country: 'Palau',                    lat:  7.4843,  lng: 134.6276,  tier: 1, pop: 350     },
  { name: 'Port Moresby',     country: 'Papua New Guinea',         lat: -9.4438,  lng: 147.1803,  tier: 1, pop: 364145  },
  { name: 'Apia',             country: 'Samoa',                    lat: -13.8314, lng: -171.7518, tier: 1, pop: 36735   },
  { name: 'Honiara',          country: 'Solomon Islands',          lat: -9.4456,  lng: 160.0568,  tier: 1, pop: 84520   },
  { name: "Nuku'alofa",       country: 'Tonga',                    lat: -21.1394, lng: -175.2049, tier: 1, pop: 24000   },
  { name: 'Funafuti',         country: 'Tuvalu',                   lat: -8.5211,  lng: 179.1983,  tier: 1, pop: 6320    },
  { name: 'Port Vila',        country: 'Vanuatu',                  lat: -17.7333, lng: 168.3167,  tier: 1, pop: 51000   },

  // ── TIER 2 — Major non-capital cities ─────────────────
  { name: 'São Paulo',        country: 'Brazil',          lat: -23.5505, lng:  -46.6333, tier: 2, pop: 22429800 },
  { name: 'Shanghai',         country: 'China',           lat: 31.2304,  lng:  121.4737, tier: 2, pop: 26320000 },
  { name: 'Mumbai',           country: 'India',           lat: 19.0760,  lng:   72.8777, tier: 2, pop: 20667656 },
  { name: 'Lagos',            country: 'Nigeria',         lat:  6.5244,  lng:    3.3792, tier: 2, pop: 14800000 },
  { name: 'Osaka',            country: 'Japan',           lat: 34.6937,  lng:  135.5023, tier: 2, pop: 19165000 },
  { name: 'Istanbul',         country: 'Turkey',          lat: 41.0082,  lng:   28.9784, tier: 2, pop: 15519267 },
  { name: 'Kinshasa',         country: 'DR Congo',        lat: -4.3317,  lng:   15.3200, tier: 2, pop: 14342000 },
  { name: 'Guangzhou',        country: 'China',           lat: 23.1291,  lng:  113.2644, tier: 2, pop: 16865000 },
  { name: 'Los Angeles',      country: 'USA',             lat: 34.0522,  lng: -118.2437, tier: 2, pop: 3979576  },
  { name: 'Chicago',          country: 'USA',             lat: 41.8781,  lng:  -87.6298, tier: 2, pop: 2693976  },
  { name: 'Houston',          country: 'USA',             lat: 29.7604,  lng:  -95.3698, tier: 2, pop: 2304580  },
  { name: 'New York',         country: 'USA',             lat: 40.7128,  lng:  -74.0060, tier: 2, pop: 8336817  },
  { name: 'Rio de Janeiro',   country: 'Brazil',          lat: -22.9068, lng:  -43.1729, tier: 2, pop: 13458075 },
  { name: 'Lima',             country: 'Peru',            lat: -12.0464, lng:  -77.0428, tier: 2, pop: 10555782 },
  { name: 'Bogotá',           country: 'Colombia',        lat:  4.7110,  lng:  -74.0721, tier: 2, pop: 7412566  },
  { name: 'Dhaka',            country: 'Bangladesh',      lat: 23.8103,  lng:   90.4125, tier: 2, pop: 10356500 },
  { name: 'Karachi',          country: 'Pakistan',        lat: 24.8607,  lng:   67.0011, tier: 2, pop: 16093786 },
  { name: 'Chongqing',        country: 'China',           lat: 29.5630,  lng:  106.5516, tier: 2, pop: 32000000 },
  { name: 'Wuhan',            country: 'China',           lat: 30.5928,  lng:  114.3055, tier: 2, pop: 12326518 },
  { name: 'Shenzhen',         country: 'China',           lat: 22.5431,  lng:  114.0579, tier: 2, pop: 13026600 },
  { name: 'Bangalore',        country: 'India',           lat: 12.9716,  lng:   77.5946, tier: 2, pop: 12207000 },
  { name: 'Hyderabad',        country: 'India',           lat: 17.3850,  lng:   78.4867, tier: 2, pop: 10004000 },
  { name: 'Ahmedabad',        country: 'India',           lat: 23.0225,  lng:   72.5714, tier: 2, pop: 7650000  },
  { name: 'Chennai',          country: 'India',           lat: 13.0827,  lng:   80.2707, tier: 2, pop: 7800000  },
  { name: 'Kolkata',          country: 'India',           lat: 22.5726,  lng:   88.3639, tier: 2, pop: 14681000 },
  { name: 'Milan',            country: 'Italy',           lat: 45.4654,  lng:    9.1859, tier: 2, pop: 1378689  },
  { name: 'Barcelona',        country: 'Spain',           lat: 41.3874,  lng:    2.1686, tier: 2, pop: 1620343  },
  { name: 'Lyon',             country: 'France',          lat: 45.7640,  lng:    4.8357, tier: 2, pop: 516092   },
  { name: 'Marseille',        country: 'France',          lat: 43.2965,  lng:    5.3698, tier: 2, pop: 861635   },
  { name: 'Manchester',       country: 'United Kingdom',  lat: 53.4808,  lng:   -2.2426, tier: 2, pop: 553230   },
  { name: 'Birmingham',       country: 'United Kingdom',  lat: 52.4862,  lng:   -1.8904, tier: 2, pop: 1141816  },
  { name: 'Cologne',          country: 'Germany',         lat: 50.9333,  lng:    6.9500, tier: 2, pop: 1084394  },
  { name: 'Frankfurt',        country: 'Germany',         lat: 50.1109,  lng:    8.6821, tier: 2, pop: 763380   },
  { name: 'Munich',           country: 'Germany',         lat: 48.1351,  lng:   11.5820, tier: 2, pop: 1471508  },
  { name: 'Hamburg',          country: 'Germany',         lat: 53.5753,  lng:    9.9969, tier: 2, pop: 1899160  },
  { name: 'St. Petersburg',   country: 'Russia',          lat: 59.9311,  lng:   30.3609, tier: 2, pop: 5384342  },
  { name: 'Novosibirsk',      country: 'Russia',          lat: 54.9885,  lng:   82.9207, tier: 2, pop: 1620162  },
  { name: 'Vladivostok',      country: 'Russia',          lat: 43.1331,  lng:  131.9113, tier: 2, pop: 606653   },
  { name: 'Yekaterinburg',    country: 'Russia',          lat: 56.8389,  lng:   60.6057, tier: 2, pop: 1495066  },
  { name: 'Almaty',           country: 'Kazakhstan',      lat: 43.2220,  lng:   76.8512, tier: 2, pop: 2000900  },
  { name: 'Lahore',           country: 'Pakistan',        lat: 31.5204,  lng:   74.3587, tier: 2, pop: 13095000 },
  { name: 'Peshawar',         country: 'Pakistan',        lat: 34.0151,  lng:   71.5249, tier: 2, pop: 1970042  },
  { name: 'Faisalabad',       country: 'Pakistan',        lat: 31.4504,  lng:   73.1350, tier: 2, pop: 3675000  },
  { name: 'Chittagong',       country: 'Bangladesh',      lat: 22.3569,  lng:   91.7832, tier: 2, pop: 2581643  },
  { name: 'Medellín',         country: 'Colombia',        lat:  6.2442,  lng:  -75.5812, tier: 2, pop: 2572157  },
  { name: 'Cali',             country: 'Colombia',        lat:  3.4516,  lng:  -76.5320, tier: 2, pop: 2445281  },
  { name: 'Guadalajara',      country: 'Mexico',          lat: 20.6597,  lng: -103.3496, tier: 2, pop: 1495182  },
  { name: 'Monterrey',        country: 'Mexico',          lat: 25.6866,  lng: -100.3161, tier: 2, pop: 1135550  },
  { name: 'Casablanca',       country: 'Morocco',         lat: 33.5731,  lng:   -7.5898, tier: 2, pop: 3752000  },
  { name: 'Alexandria',       country: 'Egypt',           lat: 31.2001,  lng:   29.9187, tier: 2, pop: 5200000  },
  { name: 'Kano',             country: 'Nigeria',         lat: 12.0022,  lng:    8.5919, tier: 2, pop: 3848885  },
  { name: 'Ibadan',           country: 'Nigeria',         lat:  7.3775,  lng:    3.9470, tier: 2, pop: 3649000  },
  { name: 'Abidjan',          country: "Côte d'Ivoire",   lat:  5.3600,  lng:   -4.0083, tier: 2, pop: 5013447  },
  { name: 'Kumasi',           country: 'Ghana',           lat:  6.6884,  lng:   -1.6244, tier: 2, pop: 3878429  },
  { name: 'Addis Ababa',      country: 'Ethiopia',        lat:  9.0320,  lng:   38.7469, tier: 2, pop: 3638000  },
  { name: 'Dar es Salaam',    country: 'Tanzania',        lat: -6.7924,  lng:   39.2083, tier: 2, pop: 6368000  },
  { name: 'Johannesburg',     country: 'South Africa',    lat: -26.2041, lng:   28.0473, tier: 2, pop: 5635127  },
  { name: 'Cape Town',        country: 'South Africa',    lat: -33.9249, lng:   18.4241, tier: 2, pop: 4618000  },
  { name: 'Durban',           country: 'South Africa',    lat: -29.8587, lng:   31.0218, tier: 2, pop: 3442361  },
  { name: 'Tianjin',          country: 'China',           lat: 39.0842,  lng:  117.2009, tier: 2, pop: 15600000 },
  { name: 'Nanjing',          country: 'China',           lat: 32.0603,  lng:  118.7969, tier: 2, pop: 8505500  },
  { name: 'Hong Kong',        country: 'China',           lat: 22.3193,  lng:  114.1694, tier: 2, pop: 7496981  },
  { name: 'Toronto',          country: 'Canada',          lat: 43.6510,  lng:  -79.3470, tier: 2, pop: 2930000  },
  { name: 'Vancouver',        country: 'Canada',          lat: 49.2827,  lng: -123.1207, tier: 2, pop: 675218   },
  { name: 'Sydney',           country: 'Australia',       lat: -33.8688, lng:  151.2093, tier: 2, pop: 5312000  },
  { name: 'Melbourne',        country: 'Australia',       lat: -37.8136, lng:  144.9631, tier: 2, pop: 5078193  },
  { name: 'Nairobi',          country: 'Kenya',           lat: -1.2921,  lng:   36.8219, tier: 2, pop: 4398000  },
];

// ══════════════════════════════════════════════════════════
//  HELPERS — sprite icon builder
// ══════════════════════════════════════════════════════════

function _makePoiDotIcon(color, size) {
  const s = size || 6;
  return L.divIcon({
    html: `<div style="width:${s}px;height:${s}px;border-radius:50%;background:${color};box-shadow:0 0 4px rgba(0,0,0,0.7);pointer-events:auto;"></div>`,
    className: '',
    iconSize:   [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

function _makePoiIcon(dataUrl, size, borderColor, bg, label) {
  if (dataUrl) {
    return L.divIcon({
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${borderColor};overflow:hidden;box-sizing:border-box;pointer-events:auto;"><img src="${dataUrl}" width="${size}" height="${size}" style="display:block;border-radius:50%;" /></div>`,
      className: '',
      iconSize:   [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }
  // CSS fallback
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${borderColor};background:${bg};display:flex;align-items:center;justify-content:center;font-size:7px;font-family:monospace;color:#fff;font-weight:700;pointer-events:auto;">${label}</div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ══════════════════════════════════════════════════════════
//  BUILD MARKERS
// ══════════════════════════════════════════════════════════

function _buildPortMarkers(civDataUrl) {
  _poisPorts.length = 0;
  for (const p of SEAPORTS) {
    const dotColor = p.tier === 1 ? '#4090e0' : '#6aaeee';
    const dotSize  = p.tier === 1 ? 7 : 5;
    const dotIcon  = _makePoiDotIcon(dotColor, dotSize);
    const tip = `<b>${p.name}</b><br>${p.city}, ${p.country}<br><i>Porto (Tier ${p.tier})</i>`;
    const dotMarker  = L.marker([p.lat, p.lng], { icon: dotIcon,  interactive: true }).bindTooltip(tip, { direction: 'top', offset: [0, -4]  });
    const fullMarker = L.marker([p.lat, p.lng], { icon: fullIcon, interactive: true }).bindTooltip(tip, { direction: 'top', offset: [0, -10] });
    _poisPorts.push({ dotMarker, fullMarker, tier: p.tier });
  }
}

function _buildMilitaryMarkers(milAirDataUrl, milNavDataUrl, milArmyDataUrl) {
  _poisMilitary.length = 0;
  for (const b of MILITARY_BASES) {
    let dataUrl, borderColor, bg, label, dotColor;
    if (b.type === 'air') {
      dataUrl = milAirDataUrl; borderColor = '#a0c020'; bg = '#1a2005'; label = 'AIR'; dotColor = '#b8d840';
    } else if (b.type === 'naval') {
      dataUrl = milNavDataUrl; borderColor = '#2080c0'; bg = '#051540'; label = 'NAV'; dotColor = '#3090d0';
    } else {
      dataUrl = milArmyDataUrl; borderColor = '#c05020'; bg = '#200a05'; label = 'HQ'; dotColor = '#e06030';
    }
    const dotSize    = b.tier === 1 ? 7 : 5;
    const dotIcon    = _makePoiDotIcon(dotColor, dotSize);
    const fullIcon   = _makePoiIcon(dataUrl, 20, borderColor, bg, label);
    const tip = `<b>${b.name}</b><br>${b.country}<br><i>Base Militar — ${b.type} (Tier ${b.tier})</i>`;
    const dotMarker  = L.marker([b.lat, b.lng], { icon: dotIcon,  interactive: true }).bindTooltip(tip, { direction: 'top', offset: [0, -4]  });
    const fullMarker = L.marker([b.lat, b.lng], { icon: fullIcon, interactive: true }).bindTooltip(tip, { direction: 'top', offset: [0, -10] });
    _poisMilitary.push({ dotMarker, fullMarker, tier: b.tier });
  }
}

function _buildCityMarkers(metropolisDataUrl, cityDataUrl) {
  _poisCities.length = 0;
  for (const c of CITIES) {
    const isCapital   = c.tier === 1;
    const size        = isCapital ? 22 : 18;
    const dataUrl     = isCapital ? metropolisDataUrl : cityDataUrl;
    const borderColor = isCapital ? '#f0c040' : '#c0a030';
    const bg          = isCapital ? '#2a1e00' : '#1a1500';
    const label       = isCapital ? 'CAP' : 'CITY';
    const dotColor    = isCapital ? '#f0c040' : '#c8a030';
    const dotSize     = isCapital ? 8 : 6;
    const dotIcon     = _makePoiDotIcon(dotColor, dotSize);
    const fullIcon    = _makePoiIcon(dataUrl, size, borderColor, bg, label);
    const popStr      = c.pop ? `<br>Pop: ${c.pop.toLocaleString()}` : '';
    const tip = `<b>${c.name}</b><br>${c.country}${popStr}`;
    const dotMarker  = L.marker([c.lat, c.lng], { icon: dotIcon,  interactive: true }).bindTooltip(tip, { direction: 'top', offset: [0, -4]         });
    const fullMarker = L.marker([c.lat, c.lng], { icon: fullIcon, interactive: true }).bindTooltip(tip, { direction: 'top', offset: [0, -size/2 - 2] });
    const clickHandler = () => { if (typeof onCityMapClick === 'function') onCityMapClick(c); };
    dotMarker.on('click',  clickHandler);
    fullMarker.on('click', clickHandler);
    _poisCities.push({ dotMarker, fullMarker, tier: c.tier });
  }
}

// ══════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════

async function initPoisLayer(map) {
  window._poisLayer = L.layerGroup().addTo(map);

  // Load all needed sheets in parallel
  const [civSheet, milSheet] = await Promise.all([
    loadSpriteSheet('sheet_structures_civilian.png'),
    loadSpriteSheet('sheet_structures_military.png'),
  ]);

  // Retrieve data URLs for each sprite type
  const portDataUrl      = getSpriteDataUrl('sheet_structures_civilian.png',  'civ_seaport',   20);
  const metropolisDataUrl= getSpriteDataUrl('sheet_structures_civilian.png',  'civ_metropolis', 22);
  const cityDataUrl      = getSpriteDataUrl('sheet_structures_civilian.png',  'civ_city',       18);
  const milAirDataUrl    = getSpriteDataUrl('sheet_structures_military.png',  'mil_airbase',    20);
  const milNavDataUrl    = getSpriteDataUrl('sheet_structures_military.png',  'mil_naval_base', 20);
  const milArmyDataUrl   = getSpriteDataUrl('sheet_structures_military.png',  'mil_army_hq',    20);

  // Build internal marker arrays
  _buildPortMarkers(portDataUrl);
  _buildMilitaryMarkers(milAirDataUrl, milNavDataUrl, milArmyDataUrl);
  _buildCityMarkers(metropolisDataUrl, cityDataUrl);

  // Initial render based on current zoom
  const zoom = map.getZoom ? map.getZoom() : 3;
  updatePoisMarkers(zoom);
}

function updatePoisMarkers(zoom) {
  if (!window._poisLayer) return;
  window._poisLayer.clearLayers();
  const useDot = zoom < POI_DOT_THRESHOLD;

  for (const item of _poisCities) {
    const threshold = item.tier === 1 ? POI_ZOOM.city1 : POI_ZOOM.city2;
    if (zoom < threshold) continue;
    window._poisLayer.addLayer(useDot ? item.dotMarker : item.fullMarker);
  }

  for (const item of _poisPorts) {
    const threshold = item.tier === 1 ? POI_ZOOM.port1 : POI_ZOOM.port2;
    if (zoom < threshold) continue;
    window._poisLayer.addLayer(useDot ? item.dotMarker : item.fullMarker);
  }

  for (const item of _poisMilitary) {
    const threshold = item.tier === 1 ? POI_ZOOM.mil1 : POI_ZOOM.mil2;
    if (zoom < threshold) continue;
    window._poisLayer.addLayer(useDot ? item.dotMarker : item.fullMarker);
  }
}
