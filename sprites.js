// ═══════════════════════════════════════════════════════════
//  sprites.js — Sprite sheet loading + rendering utilities
// ═══════════════════════════════════════════════════════════

let _spriteCoords = null;   // parsed sprites_coords.json
const _imageCache = {};     // sheetName → HTMLImageElement

// Unit type → sheet + specific sprite name + fallback emoji
const UNIT_SPRITE_MAP = {
  infantry:        { sheet: 'sheet_soldiers.png',        sprite: 'sol_infantry_soldier',     emoji: '🪖' },
  motorized:       { sheet: 'sheet_ground_support.png',  sprite: null,                        emoji: '🚗' },
  veh_light:       { sheet: 'sheet_vehicles_light.png',  sprite: 'veh1_humvee_hmmwv',        emoji: '🚙' },
  veh_medium:      { sheet: 'sheet_vehicles_medium.png', sprite: 'veh2_bradley_m2',          emoji: '🚛' },
  tank_elite:      { sheet: 'sheet_tanks_level1.png',    sprite: 'tank1_m1a2_abrams',        emoji: '🛡️' },
  artillery:       { sheet: 'sheet_ground_support.png',  sprite: null,                        emoji: '💣' },
  air3_drone:      { sheet: 'sheet_air_level3.png',      sprite: 'air3_mq9_reaper',          emoji: '🚁' },
  air2_fighter:    { sheet: 'sheet_air_level2.png',      sprite: 'air2_f16_falcon',          emoji: '✈️' },
  air2_helicopter: { sheet: 'sheet_air_level2.png',      sprite: null,                        emoji: '🚁' },
  air1_stealth:    { sheet: 'sheet_air_level1.png',      sprite: 'air1_f35_lightning',       emoji: '🛩️' },
  air_transport:   { sheet: 'sheet_air_support.png',     sprite: null,                        emoji: '🛫' },
  nav3_patrol:     { sheet: 'sheet_naval_level3.png',    sprite: 'nav3_lcs_freedom',         emoji: '⛵' },
  nav2_frigate:    { sheet: 'sheet_naval_level2.png',    sprite: 'nav2_ticonderoga_cruiser', emoji: '🚢' },
  nav1_destroyer:  { sheet: 'sheet_naval_level1.png',    sprite: 'nav1_gerald_ford_carrier', emoji: '🛳️' },
  nav1_carrier:    { sheet: 'sheet_naval_level1.png',    sprite: 'nav1_gerald_ford_carrier', emoji: '⚓' },
};

const STRUCTURE_SPRITE_MAP = {
  mil_barracks:       { sheet: 'sheet_structures_military.png', emoji: '🏠' },
  mil_airbase:        { sheet: 'sheet_structures_military.png', emoji: '✈️' },
  mil_naval_base:     { sheet: 'sheet_structures_military.png', emoji: '⚓' },
  mil_radar_station:  { sheet: 'sheet_structures_military.png', emoji: '📡' },
  mil_missile_silo:   { sheet: 'sheet_structures_military.png', emoji: '🚀' },
  mil_nuclear_bunker: { sheet: 'sheet_structures_military.png', emoji: '☢️' },
  sup_fob_supply:     { sheet: 'sheet_structures_support.png',  emoji: '⛺' },
  sup_logistics_hub:  { sheet: 'sheet_structures_support.png',  emoji: '🏭' },
  mil_field_hospital: { sheet: 'sheet_structures_support.png',  emoji: '🏥' },
  civ_hospital:       { sheet: 'sheet_structures_civilian.png', emoji: '🏥' },
  civ_power_plant:    { sheet: 'sheet_structures_civilian.png', emoji: '⚡' },
  civ_seaport:        { sheet: 'sheet_structures_civilian.png', emoji: '🚢' },
  civ_airport:        { sheet: 'sheet_structures_civilian.png', emoji: '✈️' },
};

async function initSprites() {
  try {
    const res = await fetch('/IMAGES/sprites_coords.json');
    if (res.ok) {
      _spriteCoords = await res.json();
      // Pre-load all referenced sheets so createUnitIconSync can render synchronously
      const sheets = [...new Set(Object.values(UNIT_SPRITE_MAP).map(m => m.sheet).filter(Boolean))];
      await Promise.all(sheets.map(s => _loadSheet(s)));
      console.log('Sprites loaded:', Object.keys(_spriteCoords.sheets || {}).length, 'sheets');
    }
  } catch (e) {
    console.warn('sprites_coords.json not found — using emoji fallback');
    _spriteCoords = null;
  }
}

async function _loadSheet(sheetName) {
  if (_imageCache[sheetName]) return _imageCache[sheetName];
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => { _imageCache[sheetName] = img; resolve(img); };
    img.onerror = () => { _imageCache[sheetName] = null; resolve(null); };
    img.src = `/IMAGES/${sheetName}`;
  });
}

function _getSprite(sheetName, spriteName) {
  if (!_spriteCoords || !_spriteCoords.sheets) return null;
  const sheet = _spriteCoords.sheets[sheetName];
  if (!sheet || !sheet.sprites) return null;
  if (spriteName && sheet.sprites[spriteName]) return sheet.sprites[spriteName];
  return Object.values(sheet.sprites)[0] || null;
}

// Draws a unit sprite onto a canvas DataURL; returns null on failure
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

// Synchronous icon — uses cached sprite if available, else emoji
function createUnitIconSync(unitType, isPlayer) {
  const map = UNIT_SPRITE_MAP[unitType] || { emoji: '❓' };
  const size = 36;
  const borderColor = isPlayer ? 'rgba(200,168,75,0.7)' : 'rgba(192,37,58,0.7)';
  const bg          = isPlayer ? '#1a1506' : '#1a0508';

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

  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border-radius:50%;border:2px solid ${borderColor};display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;">${map.emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Async version (kept for completeness; map.js uses the sync version)
async function createUnitIcon(unitType, level, isPlayer) {
  const map = UNIT_SPRITE_MAP[unitType] || { sheet: null, emoji: '❓' };
  const size = 40;

  if (_spriteCoords && map.sheet) {
    const img = await _loadSheet(map.sheet);
    if (img) {
      const dataUrl = _renderSpriteToDataUrl(map.sheet, map.sprite, size);
      if (dataUrl) {
        const badge = level > 1 ? `<div style="position:absolute;bottom:-4px;right:-4px;background:#0a0c10;border:1px solid #8a6f2e;border-radius:3px;font-size:0.6rem;color:#c8a84b;padding:1px 3px;font-family:'Cinzel',serif;">Lv${level}</div>` : '';
        return L.divIcon({
          html: `<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${isPlayer ? 'rgba(200,168,75,0.7)' : 'rgba(192,37,58,0.7)'};overflow:hidden;">${'<img src="' + dataUrl + '" width="' + size + '" height="' + size + '" />'}${badge}</div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });
      }
    }
  }

  const bg = isPlayer ? '#1a1506' : '#1a0508';
  const bc = isPlayer ? 'rgba(200,168,75,0.7)' : 'rgba(192,37,58,0.7)';
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border-radius:50%;border:2px solid ${bc};display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;">${map.emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Synchronous emoji icon for structures
function createStructureIcon(structType) {
  const map = STRUCTURE_SPRITE_MAP[structType] || { emoji: '🏗️' };
  return L.divIcon({
    html: `<div style="font-size:20px;text-shadow:0 0 6px rgba(0,0,0,0.9);">${map.emoji}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function getFlagUrl(iso2) {
  if (!iso2) return '';
  return `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`;
}
