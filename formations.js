// ═══════════════════════════════════════════════════════════
//  formations.js — Clustering, tactical spread, control zones
// ═══════════════════════════════════════════════════════════

const ZOOM_TACTICAL  = 7;   // ≥7: individual units visible
const ZOOM_PROVINCES = 5;   // ≥5: province borders visible

// Grid cell size (degrees) per zoom range
function _gridDeg(zoom) {
  if (zoom <= 3) return 18;
  if (zoom <= 5) return 9;
  return 4;
}

// ── Cluster units into formation groups ───────────────────
// Returns null if zoom >= ZOOM_TACTICAL (render individually)
function clusterUnits(units, zoom) {
  if (!units || units.length === 0) return [];
  if (zoom >= ZOOM_TACTICAL) return null;

  const deg  = _gridDeg(zoom);
  const grid = new Map();

  for (const u of units) {
    if (u.lat == null || u.lng == null) continue;
    const gx  = Math.floor(u.lng / deg);
    const gy  = Math.floor(u.lat / deg);
    const key = `${u.country}||${gx},${gy}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(u);
  }

  return [...grid.values()].map(_buildFormation);
}

function _buildFormation(units) {
  let sumLat = 0, sumLng = 0;
  const byDomain = { ground: [], air: [], naval: [] };

  for (const u of units) {
    sumLat += u.lat;
    sumLng += u.lng;
    const d = (UNIT_DEFS[u.type] || {}).domain || 'ground';
    byDomain[d].push(u);
  }

  const lat    = sumLat / units.length;
  const lng    = sumLng / units.length;
  const avgHp  = units.reduce((s, u) => s + u.hp, 0) / units.length;
  const g = byDomain.ground.length;
  const a = byDomain.air.length;
  const n = byDomain.naval.length;
  const domain = a > g && a > n ? 'air' : n > g ? 'naval' : 'ground';

  const topUnit = units.reduce((best, u) => {
    const bt = (UNIT_DEFS[best.type] || {}).tier || 0;
    const ut = (UNIT_DEFS[u.type]   || {}).tier || 0;
    return ut > bt ? u : best;
  }, units[0]);

  return {
    id:       units.map(u => u.id).sort().join('-'),
    lat, lng,
    country:  units[0].country,
    units, byDomain,
    total:    units.length,
    avgHp,
    topUnit, domain,
    inCombat: units.some(u => u.inCombat),
  };
}

// ── Spread individual units into formation pattern ─────────
// Returns [{unit, lat, lng}, ...]
function spreadFormation(formation) {
  const { byDomain, lat, lng, total } = formation;
  const out = [];

  const spread = Math.min(0.35, 0.035 * Math.sqrt(Math.max(1, total)));

  _placeV(byDomain.air,     lat + spread * 0.8,  lng, spread * 0.6,  out);
  _placeGrid(byDomain.ground, lat,                lng, spread,        out);
  _placeLine(byDomain.naval,  lat - spread * 0.7, lng, spread * 0.8,  out);

  return out;
}

function _placeGrid(units, cLat, cLng, spread, out) {
  if (!units.length) return;
  const cols = Math.max(1, Math.ceil(Math.sqrt(units.length)));
  const rows = Math.ceil(units.length / cols);
  units.forEach((u, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    out.push({
      unit: u,
      lat:  cLat + (row - (rows - 1) / 2) * spread * 0.38,
      lng:  cLng + (col - (cols - 1) / 2) * spread * 0.5,
    });
  });
}

function _placeV(units, cLat, cLng, spread, out) {
  if (!units.length) return;
  units.forEach((u, i) => {
    const side = i % 2 === 0 ? 1 : -1;
    const idx  = Math.floor(i / 2);
    out.push({
      unit: u,
      lat:  cLat - idx * spread * 0.28,
      lng:  cLng + side * (idx + 0.5) * spread * 0.45,
    });
  });
}

function _placeLine(units, cLat, cLng, spread, out) {
  if (!units.length) return;
  units.forEach((u, i) => {
    const off = (i - (units.length - 1) / 2) * spread * 0.5;
    out.push({ unit: u, lat: cLat, lng: cLng + off });
  });
}

// ── Air supremacy zones ─────────────────────────────────────
function calcAirSupremacy(units, gs) {
  if (!gs || !units) return [];
  const out = [];
  for (const u of units) {
    const def = UNIT_DEFS[u.type];
    if (!def || def.domain !== 'air' || u.hp <= 10) continue;
    const radius   = Math.min(def.range * 500, 2_500_000); // half-range in meters
    const friendly = u.country === gs.player_country || (gs.allies || []).includes(u.country);
    const hostile  = (gs.at_war_with || []).includes(u.country);
    out.push({ lat: u.lat, lng: u.lng, radius, friendly, hostile, unit: u });
  }
  return out;
}

// ── Naval control zones ─────────────────────────────────────
function calcNavalZones(units, gs) {
  if (!gs || !units) return [];
  return units
    .filter(u => {
      const d = (UNIT_DEFS[u.type] || {}).domain;
      return d === 'naval' && u.hp > 0;
    })
    .map(u => ({
      lat: u.lat, lng: u.lng, radius: 240_000,
      friendly: u.country === gs.player_country || (gs.allies || []).includes(u.country),
      hostile:  (gs.at_war_with || []).includes(u.country),
    }));
}

// ── Front line segments ─────────────────────────────────────
function calcFrontLines(units, gs) {
  if (!gs || !units) return [];

  const friendly = units.filter(u =>
    u.country === gs.player_country || (gs.allies || []).includes(u.country)
  );
  const hostile = units.filter(u => (gs.at_war_with || []).includes(u.country));
  if (!friendly.length || !hostile.length) return [];

  const MAX_KM  = 1500;
  const segments = [];
  const seen    = new Set();

  for (const f of friendly) {
    let nearest = null, nearDist = Infinity;
    for (const h of hostile) {
      const d = haversineKm(f.lat, f.lng, h.lat, h.lng);
      if (d < nearDist) { nearest = h; nearDist = d; }
    }
    if (!nearest || nearDist > MAX_KM) continue;

    const key = [f.id, nearest.id].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);

    const mLat = (f.lat + nearest.lat) / 2;
    const mLng = (f.lng + nearest.lng) / 2;
    const dLat = nearest.lat - f.lat;
    const dLng = nearest.lng - f.lng;
    const len  = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
    const pLat = -dLng / len;
    const pLng =  dLat / len;
    const ext  = Math.min(5, nearDist / 150);

    segments.push([
      [mLat + pLat * ext, mLng + pLng * ext],
      [mLat - pLat * ext, mLng - pLng * ext],
    ]);
  }
  return segments;
}

// ── Formation icon HTML ─────────────────────────────────────
function formationIconHtml(formation, gs) {
  const pc = gs.player_country;
  const isSelf  = formation.country === pc;
  const isAlly  = (gs.allies || []).includes(formation.country);
  const isWar   = (gs.at_war_with || []).includes(formation.country);

  const borderC = isSelf  ? '#c8a84b'
                : isAlly  ? '#4a9adf'
                : isWar   ? '#c0253a'
                : '#3a4a5a';

  const hpColor = formation.avgHp > 60 ? '#4aaa5a'
                : formation.avgHp > 30 ? '#d4a020'
                : '#c0253a';

  const domainIcon = formation.domain === 'air'    ? '✈'
                   : formation.domain === 'naval'  ? '⚓'
                   : '★';

  const a = formation.byDomain.air.length;
  const n = formation.byDomain.naval.length;
  const g = formation.byDomain.ground.length;

  const compositionHtml = [
    a ? `<span style="color:#7ab8e8">${a}✈</span>` : '',
    n ? `<span style="color:#5a8ac8">${n}⚓</span>` : '',
    g ? `<span style="color:#7aaa6a">${g}★</span>` : '',
  ].filter(Boolean).join(' ');

  const pulse = formation.inCombat
    ? 'animation:formPulse 1.2s ease-in-out infinite;' : '';

  const sz = Math.min(60, 34 + Math.sqrt(formation.total) * 2);

  return `<div class="formation-icon" style="
    width:${sz}px;height:${sz}px;
    background:rgba(8,12,20,0.92);
    border:2px solid ${borderC};
    border-radius:50%;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    cursor:pointer;
    box-shadow:0 0 ${isSelf ? 10 : 4}px ${borderC}44;
    ${pulse}
  ">
    <div style="font-size:${sz*0.28}px;color:${borderC};line-height:1">${domainIcon}</div>
    <div style="font-size:${sz*0.2}px;color:${hpColor};font-family:'Cinzel',serif;font-weight:700;line-height:1.1">${formation.total}</div>
  </div>
  <div style="
    position:absolute;top:-16px;left:50%;transform:translateX(-50%);
    background:rgba(8,12,20,0.85);border:1px solid ${borderC}55;
    border-radius:3px;padding:1px 4px;
    font-size:9px;color:${borderC};white-space:nowrap;
    font-family:'Cinzel',serif;
  ">${compositionHtml || formation.total}</div>`;
}
