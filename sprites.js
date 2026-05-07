// ═══════════════════════════════════════════════════════════
//  sprites.js — Sprite sheet loading + rendering utilities
// ═══════════════════════════════════════════════════════════

let _spriteCoords = null;
const _imageCache = {};

// Unit type → sheet + specific sprite name + short text fallback
const UNIT_SPRITE_MAP = {
  infantry:        { sheet: 'sheet_soldiers.png',          sprite: 'sol_infantry_soldier',     short: 'INF'     },
  motorized:       { sheet: 'sheet_ground_support.png',    sprite: null,                        short: 'MOT'     },
  veh_light:       { sheet: 'sheet_vehicles_light.png',    sprite: 'veh1_humvee_hmmwv',        short: 'V.LEV'   },
  veh_medium:      { sheet: 'sheet_vehicles_medium.png',   sprite: 'veh2_bradley_m2',          short: 'V.MED'   },
  tank_elite:      { sheet: 'sheet_tanks_level1.png',      sprite: 'tank1_m1a2_abrams',        short: 'TANQ'    },
  artillery:       { sheet: 'sheet_ground_support.png',    sprite: null,                        short: 'ARTIL'   },
  air3_drone:      { sheet: 'sheet_air_level3.png',        sprite: 'air3_mq9_reaper',          short: 'DRONE'   },
  air2_fighter:    { sheet: 'sheet_air_level2.png',        sprite: 'air2_f16_falcon',          short: 'CACA'    },
  air2_helicopter: { sheet: 'sheet_air_level2.png',        sprite: null,                        short: 'HELI'    },
  air1_stealth:    { sheet: 'sheet_air_level1.png',        sprite: 'air1_f35_lightning',       short: 'STEALTH' },
  air_transport:   { sheet: 'sheet_air_support.png',       sprite: null,                        short: 'TRANS'   },
  nav3_patrol:     { sheet: 'sheet_naval_level3.png',      sprite: 'nav3_lcs_freedom',         short: 'PATROL'  },
  nav2_frigate:    { sheet: 'sheet_naval_level2.png',      sprite: 'nav2_ticonderoga_cruiser', short: 'FRIG'    },
  nav1_destroyer:  { sheet: 'sheet_naval_level1.png',      sprite: 'nav1_gerald_ford_carrier', short: 'DESTR'   },
  nav1_carrier:    { sheet: 'sheet_naval_level1.png',      sprite: 'nav1_gerald_ford_carrier', short: 'CARRIER' },
};

// Structure short labels for map markers and UI
const STRUCTURE_LABELS = {
  mil_barracks:       'QUARTEL',
  mil_airbase:        'BASE AER',
  mil_naval_base:     'BASE NAV',
  mil_radar_station:  'RADAR',
  mil_missile_silo:   'SILO',
  mil_nuclear_bunker: 'BUNKER',
  sup_fob_supply:     'CAMPO',
  sup_logistics_hub:  'LOGIST',
  mil_field_hospital: 'HOSP',
  civ_hospital:       'HOSPITAL',
  civ_power_plant:    'USINA',
  civ_seaport:        'PORTO',
  civ_airport:        'AERO',
};

async function initSprites() {
  try {
    const res = await fetch('sprites_coords.json');
    if (res.ok) {
      _spriteCoords = await res.json();
      const sheets = [...new Set(Object.values(UNIT_SPRITE_MAP).map(m => m.sheet).filter(Boolean))];
      await Promise.all(sheets.map(s => _loadSheet(s)));
      console.log('Sprites loaded:', Object.keys(_spriteCoords.sheets || {}).length, 'sheets');
    }
  } catch (e) {
    console.warn('sprites_coords.json not found — using text fallback');
    _spriteCoords = null;
  }
}

async function _loadSheet(sheetName) {
  if (_imageCache[sheetName]) return _imageCache[sheetName];
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => { _imageCache[sheetName] = img; resolve(img); };
    img.onerror = () => { _imageCache[sheetName] = null; resolve(null); };
    img.src = sheetName;
  });
}

function _getSprite(sheetName, spriteName) {
  if (!_spriteCoords || !_spriteCoords.sheets) return null;
  const sheet = _spriteCoords.sheets[sheetName];
  if (!sheet || !sheet.sprites) return null;
  if (spriteName && sheet.sprites[spriteName]) return sheet.sprites[spriteName];
  return Object.values(sheet.sprites)[0] || null;
}

function _renderSpriteToDataUrl(sheetName, spriteName, size) {
  const img = _imageCache[sheetName];
  const sp  = _getSprite(sheetName, spriteName);
  if (!img || !sp) return null;
  const cvs = document.createElement('canvas');
  cvs.width = size; cvs.height = size;
  const ctx = cvs.getContext('2d');
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, sp.x, sp.y, sp.w, sp.h, 0, 0, size, size);
  return cvs.toDataURL();
}

// Synchronous icon — sprite if available, else short text label
function createUnitIconSync(unitType, isPlayer) {
  const map = UNIT_SPRITE_MAP[unitType] || { short: '???' };
  const size = 36;
  const borderColor = isPlayer ? 'rgba(200,168,75,0.7)' : 'rgba(192,37,58,0.7)';
  const bg          = isPlayer ? '#1a1506' : '#1a0508';
  const textColor   = isPlayer ? '#c8a84b' : '#c0253a';

  if (_spriteCoords && map.sheet && _imageCache[map.sheet]) {
    const dataUrl = _renderSpriteToDataUrl(map.sheet, map.sprite, size);
    if (dataUrl) {
      return L.divIcon({
        html: `<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${borderColor};overflow:hidden;box-sizing:border-box;"><img src="${dataUrl}" width="${size}" height="${size}" style="display:block;" /></div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });
    }
  }

  // Text fallback
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border-radius:50%;border:2px solid ${borderColor};display:flex;align-items:center;justify-content:center;font-size:8px;font-family:'Cinzel',serif;color:${textColor};font-weight:700;letter-spacing:0.5px;line-height:1;text-align:center;">${map.short || '?'}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Async version
async function createUnitIcon(unitType, level, isPlayer) {
  const map = UNIT_SPRITE_MAP[unitType] || { short: '???' };
  const size = 40;
  const textColor = isPlayer ? '#c8a84b' : '#c0253a';
  const bg = isPlayer ? '#1a1506' : '#1a0508';
  const bc = isPlayer ? 'rgba(200,168,75,0.7)' : 'rgba(192,37,58,0.7)';

  if (_spriteCoords && map.sheet) {
    const img = await _loadSheet(map.sheet);
    if (img) {
      const dataUrl = _renderSpriteToDataUrl(map.sheet, map.sprite, size);
      if (dataUrl) {
        const badge = level > 1 ? `<div style="position:absolute;bottom:-4px;right:-4px;background:#0a0c10;border:1px solid #8a6f2e;border-radius:3px;font-size:0.6rem;color:#c8a84b;padding:1px 3px;font-family:'Cinzel',serif;">Lv${level}</div>` : '';
        return L.divIcon({
          html: `<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${bc};overflow:hidden;">${'<img src="' + dataUrl + '" width="' + size + '" height="' + size + '" />'}${badge}</div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });
      }
    }
  }

  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border-radius:50%;border:2px solid ${bc};display:flex;align-items:center;justify-content:center;font-size:9px;font-family:'Cinzel',serif;color:${textColor};font-weight:700;">${map.short || '?'}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Structure marker — styled text label (no emoji)
function createStructureIcon(structType, isComplete) {
  const label = STRUCTURE_LABELS[structType] || structType.toUpperCase().slice(0, 6);
  const bg    = isComplete ? '#0f1318' : '#110d05';
  const color = isComplete ? '#c8a84b' : '#8a6f2e';
  const border = isComplete ? '#1e2535' : '#3a2f10';
  return L.divIcon({
    html: `<div style="background:${bg};border:1px solid ${border};border-radius:3px;padding:2px 5px;font-size:8px;color:${color};font-family:'Cinzel',serif;font-weight:700;white-space:nowrap;letter-spacing:0.5px;">${label}</div>`,
    className: '',
    iconSize: null,
    iconAnchor: [0, 0],
  });
}

// Exposta globalmente para uso nos painéis
function getUnitSpriteDataUrl(unitType, size) {
  size = size || 36;
  const map = UNIT_SPRITE_MAP[unitType];
  if (!map || !map.sheet) return null;
  return _renderSpriteToDataUrl(map.sheet, map.sprite, size);
}

function getFlagUrl(iso2) {
  if (!iso2) return '';
  return `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`;
}
