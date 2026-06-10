// ═══════════════════════════════════════════════════════════
//  map.js — Dual-scale strategic/tactical renderer
//  ZOOM  ≤6 → strategic: formation clusters, supremacy overlays
//  ZOOM  ≥7 → tactical:  individual units spread in formation
// ═══════════════════════════════════════════════════════════

let _map          = null;
let _geojsonData  = null;

// ── Layers (rendered bottom→top) ───────────────────────────
let _lyrCountries  = null;   // GeoJSON country fills (always)
let _lyrNaval      = null;   // Naval control zones   (always)
let _lyrSupremacy  = null;   // Air supremacy circles (always)
let _lyrFrontLines = null;   // Front line segments   (when at war)
let _lyrFormations = null;   // Formation cluster markers (zoom < 7)
let _lyrTactical   = null;   // Individual unit markers   (zoom ≥ 7)
let _lyrStructures = null;   // Structure icons
let _lyrRoutes     = null;   // Movement order lines

// ── State ──────────────────────────────────────────────────
let _currentZoom     = 3;
let _zoomTimer       = null;
let _placeMode       = null;  // { label, callback } for build/recruit placement
let _routeObjects    = [];    // polylines + markers for active routes

// Country selection mini-map
let _selectMap   = null;
let _selectLayer = null;

// ── Init ───────────────────────────────────────────────────
async function initMap(savedView) {
  const center = savedView ? [savedView.lat, savedView.lng] : [20, 0];
  const zoom   = savedView ? savedView.zoom : 3;

  _map = L.map('map', {
    center, zoom,
    minZoom: 2, maxZoom: 14,
    zoomControl: false,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(_map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '', subdomains: 'abcd', maxZoom: 20,
  }).addTo(_map);

  _lyrCountries  = L.layerGroup().addTo(_map);
  _lyrNaval      = L.layerGroup().addTo(_map);
  _lyrSupremacy  = L.layerGroup().addTo(_map);
  _lyrFrontLines = L.layerGroup().addTo(_map);
  _lyrFormations = L.layerGroup().addTo(_map);
  _lyrTactical   = L.layerGroup().addTo(_map);
  _lyrStructures = L.layerGroup().addTo(_map);
  _lyrRoutes     = L.layerGroup().addTo(_map);

  const ok = await _loadGeoJSON();
  if (!ok) return false;

  _map.on('click', _onMapClick);
  _map.on('zoomend', _onZoomEnd);
  _map.on('moveend zoomend', _saveView);

  _currentZoom = zoom;
  _updateZoomMode();
  return true;
}

function _onMapClick(e) {
  if (_placeMode) {
    const cb = _placeMode.callback;
    _exitPlaceMode();
    cb(e.latlng.lat, e.latlng.lng);
    return;
  }
  if (window._selectedUnitId) {
    _handleMoveClick(e.latlng.lat, e.latlng.lng);
    return;
  }
  window._selectedUnitId = null;
  window._selectedFormation = null;
  if (typeof renderPanelForTab === 'function') renderPanelForTab(_activeTab || 'info');
}

function _onZoomEnd() {
  _currentZoom = _map.getZoom();
  _updateZoomMode();
  clearTimeout(_zoomTimer);
  _zoomTimer = setTimeout(() => {
    if (window.GS) {
      renderUnits(window.GS);
    }
  }, 120);
}

function _saveView() {
  if (!window.GS || !_map) return;
  const c = _map.getCenter();
  GS.map_view = { lat: c.lat, lng: c.lng, zoom: _map.getZoom() };
}

function _updateZoomMode() {
  const el = document.getElementById('zoom-mode-label');
  if (!el) return;
  if (_currentZoom >= ZOOM_TACTICAL) {
    el.textContent = 'TATICAL';
    el.style.color = '#c8a84b';
  } else if (_currentZoom >= ZOOM_PROVINCES) {
    el.textContent = 'REGIONAL';
    el.style.color = '#7ab8e8';
  } else {
    el.textContent = 'STRATEGIC';
    el.style.color = '#7aaa6a';
  }
}

// ── GeoJSON loading ────────────────────────────────────────
async function _loadGeoJSON() {
  if (_geojsonData) return true;
  try {
    const res = await fetch('countries.geojson');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    _geojsonData = await res.json();
    return true;
  } catch (e) {
    console.warn('GeoJSON load failed:', e.message);
    const el = document.getElementById('geojson-missing');
    if (el) el.style.display = 'flex';
    document.getElementById('loading-screen').style.display = 'none';
    return false;
  }
}

// ── Country layer ──────────────────────────────────────────
function renderCountries(state) {
  if (!_geojsonData || !_map) return;
  _lyrCountries.clearLayers();

  L.geoJSON(_geojsonData, {
    style(feature) {
      const name = feature.properties.ADMIN || feature.properties.name || '';
      return {
        color:       '#1a2230',
        weight:      0.8,
        fillColor:   getCountryFillColor(name, state),
        fillOpacity: getCountryFillOpacity(name, state),
      };
    },
    onEachFeature(feature, layer) {
      const name = feature.properties.ADMIN || feature.properties.name || '';
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        if (_placeMode || window._selectedUnitId) return;
        onCountryClick(name);
      });
      layer.on('mouseover', function() {
        this.setStyle({ weight: 2, color: '#c8a84b' });
      });
      layer.on('mouseout', function() {
        this.setStyle({ weight: 0.8, color: '#1a2230' });
        this.closeTooltip();
      });
    }
  }).addTo(_lyrCountries);
}

function onCountryClick(name) {
  window._selectedCountry = name;
  window._selectedFormation = null;
  if (typeof switchTab === 'function') switchTab('info');
  else if (typeof renderPanelForTab === 'function') renderPanelForTab('info');
  if (typeof showPanel === 'function') showPanel();
}

// ── Unit rendering (main entry) ────────────────────────────
function renderUnits(state) {
  if (!_map || !state) return;

  const zoom = _currentZoom;

  if (zoom >= ZOOM_TACTICAL) {
    // TACTICAL: individual units spread in formation
    _lyrFormations.clearLayers();
    _renderTacticalUnits(state);
  } else {
    // STRATEGIC/REGIONAL: formation cluster icons
    _lyrTactical.clearLayers();
    _renderFormationClusters(state, zoom);
  }

  // Control zones and front lines always re-render
  _renderAirSupremacy(state);
  _renderNavalZones(state);
  _renderFrontLines(state);
}

// ── Strategic: formation cluster icons ────────────────────
function _renderFormationClusters(state, zoom) {
  _lyrFormations.clearLayers();
  const formations = clusterUnits(state.units || [], zoom);
  if (!formations) return;

  formations.forEach(fm => {
    const html = formationIconHtml(fm, state);
    const sz   = Math.min(60, 34 + Math.sqrt(fm.total) * 2);
    const icon = L.divIcon({
      html: `<div style="position:relative;">${html}</div>`,
      className: '',
      iconSize:   [sz, sz],
      iconAnchor: [sz / 2, sz / 2],
    });

    const marker = L.marker([fm.lat, fm.lng], { icon, zIndexOffset: 500 });

    marker.on('click', e => {
      L.DomEvent.stopPropagation(e);
      window._selectedFormation = fm;
      window._selectedUnitId    = null;
      if (typeof showFormationPanel === 'function') showFormationPanel(fm, state);
      if (typeof showPanel === 'function') showPanel();
    });

    marker.on('mouseover', function() {
      const isSelf = fm.country === state.player_country;
      const isWar  = (state.at_war_with || []).includes(fm.country);
      const rel    = isSelf ? 'SUAS FORÇAS' : isWar ? 'INIMIGO' : fm.country;
      const a = fm.byDomain.air.length;
      const g = fm.byDomain.ground.length;
      const n = fm.byDomain.naval.length;
      const parts = [g ? `${g} terrestre` : '', a ? `${a} aéreo` : '', n ? `${n} naval` : ''].filter(Boolean).join(', ');
      this.bindTooltip(
        `<div style="background:#080c14;border:1px solid #1c2438;padding:6px 10px;border-radius:4px;font-family:'Cinzel',serif;font-size:0.75rem;">
          <div style="color:#c8a84b;margin-bottom:2px">${fm.country}</div>
          <div style="color:#7aaa6a">${rel}</div>
          <div style="color:#ccc9bc;font-size:0.7rem">${parts}</div>
          <div style="color:#888;font-size:0.68rem">HP médio: ${Math.round(fm.avgHp)}%</div>
        </div>`,
        { className: '', permanent: false, sticky: true }
      ).openTooltip();
    });
    marker.on('mouseout', function() { this.closeTooltip(); });

    marker.addTo(_lyrFormations);
    fm._marker = marker;
  });
}

// ── Tactical: individual units spread in formation ─────────
function _renderTacticalUnits(state) {
  _lyrTactical.clearLayers();

  // Group units by (country, proximity) to get formations
  const allUnits   = state.units || [];
  const formations = clusterUnits(allUnits, 6); // cluster as if zoom=6 for positions
  if (!formations) {
    // fallback: render all units at their actual positions
    allUnits.forEach(u => _renderSingleUnit(u, state));
    return;
  }

  formations.forEach(fm => {
    const spread = spreadFormation(fm);
    spread.forEach(({ unit, lat, lng }) => {
      _renderSingleUnit(unit, state, lat, lng);
    });
  });
}

function _renderSingleUnit(unit, state, overrideLat, overrideLng) {
  const lat = overrideLat != null ? overrideLat : unit.lat;
  const lng = overrideLng != null ? overrideLng : unit.lng;
  const isPlayer  = unit.country === state.player_country;
  const isEnemy   = (state.at_war_with || []).includes(unit.country);
  const isAlly    = (state.allies || []).includes(unit.country);
  const isSelected = window._selectedUnitId === unit.id;

  const icon = createUnitIconSync(unit.type, isPlayer);
  const marker = L.marker([lat, lng], {
    icon,
    zIndexOffset: isPlayer ? 1000 : isEnemy ? 500 : 0,
  });

  const def  = UNIT_DEFS[unit.type] || {};
  const lvNm = levelName(unit.level);
  const hpColor = unit.hp > 60 ? '#4aaa5a' : unit.hp > 30 ? '#d4a020' : '#c0253a';

  marker.bindTooltip(
    `<div style="background:#080c14;border:1px solid #1c2438;padding:6px 10px;border-radius:4px;min-width:140px;font-family:'Cinzel',serif;">
      <div style="color:#c8a84b;font-size:0.78rem;margin-bottom:3px">${unit.name}</div>
      <div style="color:#888;font-size:0.68rem;margin-bottom:4px">${unit.country} · ${def.label || unit.type} · ${lvNm}</div>
      <div style="display:flex;gap:4px;align-items:center;">
        <span style="font-size:0.65rem;color:#888;width:16px">HP</span>
        <div style="flex:1;height:4px;background:#1c2438;border-radius:2px"><div style="height:4px;width:${unit.hp}%;background:${hpColor};border-radius:2px"></div></div>
        <span style="font-size:0.65rem;color:${hpColor}">${Math.round(unit.hp)}%</span>
      </div>
      <div style="display:flex;gap:4px;align-items:center;margin-top:2px">
        <span style="font-size:0.65rem;color:#888;width:16px">EN</span>
        <div style="flex:1;height:4px;background:#1c2438;border-radius:2px"><div style="height:4px;width:${Math.round(unit.energy / unit.energyCap * 100)}%;background:#4a7aaf;border-radius:2px"></div></div>
        <span style="font-size:0.65rem;color:#4a7aaf">${Math.round(unit.energy / unit.energyCap * 100)}%</span>
      </div>
    </div>`,
    { className: '', sticky: true }
  );

  marker.on('click', e => {
    L.DomEvent.stopPropagation(e);
    onUnitClick(unit.id, state);
  });

  marker.addTo(_lyrTactical);
  unit._marker = marker;

  // Draw pending move arrow if exists
  if (unit.pendingLat != null && isPlayer) {
    _drawRouteArrow(lat, lng, unit.pendingLat, unit.pendingLng, '#c8a84b', true);
  }
}

// ── Air supremacy circles ──────────────────────────────────
function _renderAirSupremacy(state) {
  _lyrSupremacy.clearLayers();
  const zones = calcAirSupremacy(state.units || [], state);

  zones.forEach(z => {
    const fillC   = z.friendly ? 'rgba(60,160,80,0.05)'   : 'rgba(180,40,60,0.05)';
    const strokeC = z.friendly ? 'rgba(60,160,80,0.35)'   : 'rgba(180,40,60,0.35)';

    L.circle([z.lat, z.lng], {
      radius:       z.radius,
      color:        strokeC,
      weight:       1,
      dashArray:    '6 8',
      fillColor:    fillC,
      fillOpacity:  1,
      interactive:  false,
      className:    'supremacy-ring',
    }).addTo(_lyrSupremacy);
  });
}

// ── Naval control zones ────────────────────────────────────
function _renderNavalZones(state) {
  _lyrNaval.clearLayers();
  const zones = calcNavalZones(state.units || [], state);

  zones.forEach(z => {
    const fillC   = z.friendly ? 'rgba(40,100,180,0.04)'  : 'rgba(140,30,50,0.04)';
    const strokeC = z.friendly ? 'rgba(40,100,180,0.3)'   : 'rgba(140,30,50,0.3)';
    L.circle([z.lat, z.lng], {
      radius: z.radius, color: strokeC, weight: 0.8,
      dashArray: '4 10', fillColor: fillC, fillOpacity: 1, interactive: false,
    }).addTo(_lyrNaval);
  });
}

// ── Front lines ─────────────────────────────────────────────
function _renderFrontLines(state) {
  _lyrFrontLines.clearLayers();
  if (!(state.at_war_with || []).length) return;
  const segments = calcFrontLines(state.units || [], state);

  segments.forEach(seg => {
    L.polyline(seg, {
      color:     '#c87020',
      weight:    2.5,
      dashArray: '10 7',
      opacity:   0.75,
      interactive: false,
      className: 'front-line',
    }).addTo(_lyrFrontLines);
  });
}

// ── Structure markers ──────────────────────────────────────
function renderStructures(state) {
  if (!_map) return;
  _lyrStructures.clearLayers();
  (state.structures || []).forEach(s => {
    if (!s.lat || !s.lng) return;
    const icon = createStructureIcon(s.type);
    const m    = L.marker([s.lat, s.lng], { icon });
    const def  = STRUCTURE_DEFS[s.type] || {};
    m.bindTooltip(
      `<div style="background:#080c14;border:1px solid #1c2438;padding:4px 8px;border-radius:4px;font-size:0.78rem;color:#ccc9bc;">
        ${def.emoji || ''} ${s.label || def.label}${s.complete ? '' : ` (${s.turnsLeft} turnos)`}
      </div>`, { className: '' }
    );
    m.addTo(_lyrStructures);
  });
}

// ── Unit interaction ───────────────────────────────────────
function onUnitClick(unitId, state) {
  const unit     = (state.units || []).find(u => u.id === unitId);
  if (!unit) return;
  const isPlayer = unit.country === state.player_country;

  if (isPlayer) {
    if (window._selectedUnitId === unitId) {
      window._selectedUnitId = null;
      clearRoutes();
    } else {
      window._selectedUnitId = unitId;
      notify(`${unit.name} selecionado — clique no mapa para mover`, 'info');
    }
  }

  window._selectedFormation = null;
  if (typeof showUnitPanel === 'function') showUnitPanel(unit, state);
  if (typeof showPanel === 'function') showPanel();
}

function _handleMoveClick(lat, lng) {
  if (!window._selectedUnitId || !window.GS) return;
  const unit = (window.GS.units || []).find(u => u.id === window._selectedUnitId);
  if (!unit) { window._selectedUnitId = null; return; }

  const result = moveUnit(unit, lat, lng);
  if (result.ok) {
    clearRoutes();
    animateUnitMove(unit, lat, lng, () => {
      renderUnits(window.GS);
      if (typeof renderPanelForTab === 'function') renderPanelForTab('military');
      saveGame(window.GS);
    });
    notify(`${unit.name} em movimento (${Math.round(result.dist)}km)`, 'info');
  } else {
    notify(result.reason, 'error');
  }
  window._selectedUnitId = null;
}

// ── Route lines ────────────────────────────────────────────
function clearRoutes() {
  _routeObjects.forEach(o => { if (_map.hasLayer(o)) _map.removeLayer(o); });
  _routeObjects = [];
}

function _drawRouteArrow(fromLat, fromLng, toLat, toLng, color, dashed) {
  const line = L.polyline([[fromLat, fromLng], [toLat, toLng]], {
    color: color || '#c8a84b',
    weight: 2,
    dashArray: dashed ? '6 4' : null,
    opacity: 0.7,
  }).addTo(_lyrRoutes);
  _routeObjects.push(line);
  return line;
}

function animateUnitMove(unit, destLat, destLng, onDone) {
  clearRoutes();
  _drawRouteArrow(unit.lat, unit.lng, destLat, destLng, '#c8a84b', true);
  if (unit._marker) unit._marker.setLatLng([destLat, destLng]);
  setTimeout(() => {
    clearRoutes();
    if (onDone) onDone();
  }, 700);
}

// ── Build mode (click map to place structure) ──────────────
let _buildMode = null;

function enterBuildMode(structType) {
  _buildMode = structType;
  const def = STRUCTURE_DEFS[structType] || {};
  notify(`${def.emoji || ''} Clique no mapa: ${def.label}`, 'info');
  _map.once('click', e => {
    if (!_buildMode) return;
    const type = _buildMode;
    _buildMode = null;
    const result = startConstruction(type, window.GS, e.latlng.lat, e.latlng.lng);
    if (result.ok) {
      notify(`Construção iniciada: ${result.structure.emoji} ${result.structure.label}`, 'info');
      renderStructures(window.GS);
      if (typeof renderPanelForTab === 'function') renderPanelForTab('build');
      saveGame(window.GS);
    } else {
      notify(result.reason, 'error');
    }
  });
}

// ── Place mode (click map to place unit) ──────────────────
function enterPlaceMode(label, callback) {
  _placeMode = { label, callback };
  if (_map) _map.getContainer().style.cursor = 'crosshair';
  notify(`${label} — Clique no mapa para posicionar`, 'info');
}

function _exitPlaceMode() {
  _placeMode = null;
  if (_map) _map.getContainer().style.cursor = '';
}

// ── Navigate ───────────────────────────────────────────────
function flyToCountry(name) {
  if (!_geojsonData || !_map) return;
  const f = _geojsonData.features.find(f => (f.properties.ADMIN || f.properties.name) === name);
  if (!f) return;
  _map.fitBounds(L.geoJSON(f).getBounds(), { padding: [60, 60], maxZoom: 6, animate: true, duration: 1 });
}

function flyTo(lat, lng, zoom) {
  if (_map) _map.flyTo([lat, lng], zoom || 5, { duration: 1.1 });
}

function invalidateMap() {
  if (_map) setTimeout(() => _map.invalidateSize(), 50);
}

function getMap() { return _map; }
function getCurrentZoom() { return _currentZoom; }

// ── Country selection modal map ────────────────────────────
async function initSelectMap() {
  if (_selectMap) return;
  _selectMap = L.map('country-select-map', {
    center: [20, 0], zoom: 2, minZoom: 1, maxZoom: 5,
    zoomControl: true,
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '', subdomains: 'abcd',
  }).addTo(_selectMap);
  _selectLayer = L.layerGroup().addTo(_selectMap);
  await _loadGeoJSON();
  if (_geojsonData) {
    L.geoJSON(_geojsonData, {
      style: { color: '#1e2535', weight: 1, fillColor: '#1a3a6a', fillOpacity: 0.2 },
      onEachFeature(feature, layer) {
        const name = feature.properties.ADMIN || feature.properties.name;
        layer.on('click', () => selectCountryByName(name));
        layer.on('mouseover', function() { this.setStyle({ fillOpacity: 0.45 }); });
        layer.on('mouseout',  function() { this.setStyle({ fillOpacity: 0.2  }); });
      }
    }).addTo(_selectLayer);
  }
  setTimeout(() => _selectMap.invalidateSize(), 150);
}

// ── Country list ───────────────────────────────────────────
function getAllCountryNames() {
  if (!_geojsonData) return [];
  return _geojsonData.features
    .map(f => f.properties.ADMIN || f.properties.name || '')
    .filter(Boolean).sort();
}

// ── getSpriteDataUrl (needed by ui.js) ─────────────────────
function getUnitSpriteDataUrl(unitType, size) {
  const map = UNIT_SPRITE_MAP[unitType];
  if (!map || !map.sheet) return null;
  return _renderSpriteToDataUrl(map.sheet, map.sprite, size || 40);
}
