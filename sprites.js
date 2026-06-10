// ═══════════════════════════════════════════════════════════
//  sprites.js — Sprite sheet loading + rendering utilities
//  All 20 sheets / 252 sprites are preloaded and addressable
// ═══════════════════════════════════════════════════════════

let _spriteCoords  = null;   // parsed sprites_coords.json
const _imageCache   = {};    // sheetName → HTMLImageElement
const _dataUrlCache = {};    // "sheet|sprite|size|shape" → dataURL

const ALL_SHEETS = [
  'sheet_air_level1.png',  'sheet_air_level2.png',  'sheet_air_level3.png',
  'sheet_air_support.png', 'sheet_tanks_level1.png',
  'sheet_vehicles_light.png', 'sheet_vehicles_medium.png',
  'sheet_naval_level1.png', 'sheet_naval_level2.png', 'sheet_naval_level3.png',
  'sheet_naval_support.png', 'sheet_ground_support.png',
  'sheet_soldiers.png', 'sheet_map_movement.png', 'sheet_icons_events.png',
  'sheet_structures_civilian.png', 'sheet_structures_support.png',
  'sheet_structures_military.png', 'sheet_supplies.png', 'sheet_weapons.png',
];

async function initSprites() {
  try {
    const res = await fetch('sprites_coords.json');
    if (res.ok) {
      _spriteCoords = await res.json();
      await Promise.all(ALL_SHEETS.map(s => _loadSheet(s)));
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

// ── Core: sprite → dataURL (cached) ────────────────────────
// shape: 'square' (rounded card) | 'round' (circular clip)
function spriteDataUrl(sheetName, spriteName, size, shape) {
  size  = size  || 64;
  shape = shape || 'square';
  const key = `${sheetName}|${spriteName}|${size}|${shape}`;
  if (_dataUrlCache[key]) return _dataUrlCache[key];

  const img = _imageCache[sheetName];
  const sp  = _getSprite(sheetName, spriteName);
  if (!img || !sp) return null;

  const cvs = document.createElement('canvas');
  cvs.width = size; cvs.height = size;
  const ctx = cvs.getContext('2d');
  if (shape === 'round') {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
  }
  ctx.drawImage(img, sp.x, sp.y, sp.w, sp.h, 0, 0, size, size);
  const url = cvs.toDataURL();
  _dataUrlCache[key] = url;
  return url;
}

// ── HTML helpers ───────────────────────────────────────────
function spriteImg(sheetName, spriteName, size, extraStyle) {
  size = size || 40;
  const url = spriteDataUrl(sheetName, spriteName, Math.min(128, size * 2), 'square');
  if (!url) return `<span style="font-size:${Math.round(size*0.7)}px">▪</span>`;
  return `<img src="${url}" width="${size}" height="${size}" draggable="false" style="display:block;border-radius:6px;${extraStyle || ''}">`;
}

function spriteImgRound(sheetName, spriteName, size, borderColor) {
  size = size || 40;
  const url = spriteDataUrl(sheetName, spriteName, Math.min(128, size * 2), 'round');
  if (!url) return `<span style="font-size:${Math.round(size*0.7)}px">▪</span>`;
  const bc = borderColor || 'var(--border)';
  return `<img src="${url}" width="${size}" height="${size}" draggable="false" style="display:block;border-radius:50%;border:2px solid ${bc};box-sizing:border-box;">`;
}

// Unit portrait — reads sheet/sprite from UNIT_DEFS
function unitImg(unitType, size, shape) {
  const def = (typeof UNIT_DEFS !== 'undefined') ? UNIT_DEFS[unitType] : null;
  if (def && def.sheet) {
    return shape === 'round'
      ? spriteImgRound(def.sheet, def.sprite, size)
      : spriteImg(def.sheet, def.sprite, size);
  }
  const emoji = def ? (def.emoji || '❓') : '❓';
  return `<div style="width:${size}px;height:${size}px;border-radius:6px;background:#0c1220;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.55)}px">${emoji}</div>`;
}

// Map-movement order icon (sheet_map_movement.png)
function mapIconUrl(name, size) {
  return spriteDataUrl('sheet_map_movement.png', name, size || 48, 'square');
}

// Event icon (sheet_icons_events.png)
function eventImg(name, size) {
  return spriteImg('sheet_icons_events.png', name, size || 22);
}

// ── Leaflet unit icon (tactical view) ──────────────────────
function createUnitIconSync(unitType, isPlayer, isEnemy) {
  const def  = (typeof UNIT_DEFS !== 'undefined') ? UNIT_DEFS[unitType] : null;
  const size = 38;
  const borderColor = isPlayer ? '#c8a84b' : isEnemy ? '#c0253a' : '#3a4a5a';

  const url = def && def.sheet ? spriteDataUrl(def.sheet, def.sprite, size * 2, 'round') : null;
  if (url) {
    return L.divIcon({
      html: `<div class="unit-marker" style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${borderColor};overflow:hidden;box-sizing:border-box;box-shadow:0 1px 6px rgba(0,0,0,.7),0 0 8px ${borderColor}33;background:#0a0e16;"><img src="${url}" width="${size-4}" height="${size-4}" style="display:block;" /></div>`,
      className: '',
      iconSize:   [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }

  const emoji = def ? (def.emoji || '❓') : '❓';
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:#0a0e16;border-radius:50%;border:2px solid ${borderColor};display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;">${emoji}</div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// ── Leaflet structure icon — uses real structure sprites ───
function createStructureIcon(structType, complete) {
  const def = (typeof STRUCTURE_DEFS !== 'undefined') ? STRUCTURE_DEFS[structType] : null;
  const size = 34;
  const url = def && def.sheet ? spriteDataUrl(def.sheet, def.sprite || structType, size * 2, 'square') : null;
  if (url) {
    const dim = complete === false ? 'filter:grayscale(.8) brightness(.6);' : '';
    return L.divIcon({
      html: `<div style="width:${size}px;height:${size}px;border-radius:6px;border:1px solid #2a3448;overflow:hidden;box-shadow:0 1px 5px rgba(0,0,0,.7);${dim}"><img src="${url}" width="${size}" height="${size}" style="display:block"></div>`,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }
  const emoji = def ? (def.emoji || '🏗️') : '🏗️';
  return L.divIcon({
    html: `<div style="font-size:20px;text-shadow:0 0 6px rgba(0,0,0,0.9);">${emoji}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// ── Leaflet marker built from a map_movement sprite ────────
function createMapSpriteIcon(spriteName, size) {
  size = size || 26;
  const url = mapIconUrl(spriteName, size * 2);
  if (!url) return null;
  return L.divIcon({
    html: `<img src="${url}" width="${size}" height="${size}" style="display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,.8))">`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function getFlagUrl(iso2) {
  if (!iso2) return '';
  return `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`;
}
