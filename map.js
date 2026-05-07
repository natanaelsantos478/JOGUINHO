// ═══════════════════════════════════════════════════════════
//  map.js — Leaflet map, country layers, unit markers
// ═══════════════════════════════════════════════════════════

let _map = null;
let _countriesLayer = null;
let _unitsLayer = null;
let _structuresLayer = null;
let _routeLines = [];
let _geojsonData = null;
let _placeUnitMode = null;      // { unit, onPlace, onCancel, countryName }
let _placeHighlightLayer = null;
let _placeHintEl = null;

// ── Initialise main game map ───────────────────────────────
async function initMap(savedView) {
  const center = savedView ? [savedView.lat, savedView.lng] : [20, 0];
  const zoom   = savedView ? savedView.zoom : 3;

  _map = L.map('map', {
    center,
    zoom,
    minZoom: 2,
    maxZoom: 12,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(_map);

  _countriesLayer  = L.layerGroup().addTo(_map);
  _unitsLayer      = L.layerGroup().addTo(_map);
  _structuresLayer = L.layerGroup().addTo(_map);

  const loaded = await _loadGeoJSON();
  if (!loaded) return false;

  _map.on('click', (e) => {
    if (_placeUnitMode) {
      const { onPlace, countryName } = _placeUnitMode;
      const lat = e.latlng.lat, lng = e.latlng.lng;
      if (countryName && _geojsonData) {
        const feature = _geojsonData.features.find(f =>
          (f.properties.ADMIN || f.properties.name || '') === countryName
        );
        if (feature && !_pointInFeature(lat, lng, feature)) {
          if (typeof notify === 'function') notify(`Posicione a unidade dentro de ${countryName}`, 'error');
          return;
        }
      }
      _cancelPlaceMode();
      onPlace(lat, lng);
      return;
    }
    if (window._selectedUnitId) {
      _handleMapClickForMove(e.latlng.lat, e.latlng.lng);
    } else {
      window._selectedUnitId = null;
      renderPanelForTab('military');
    }
  });

  _map.on('moveend zoomend', () => {
    if (window.GS) {
      const c = _map.getCenter();
      GS.map_view = { lat: c.lat, lng: c.lng, zoom: _map.getZoom() };
    }
  });

  return true;
}

// ── Place-unit mode ────────────────────────────────────────
function enterPlaceUnitMode(unit, onPlace, onCancel, countryName) {
  _placeUnitMode = { unit, onPlace, onCancel: onCancel || null, countryName: countryName || null };
  if (_map) _map.getContainer().style.cursor = 'crosshair';
  if (countryName) {
    _showPlaceHighlight(countryName);
    _showPlaceHint(unit.name, countryName);
  }
}

function cancelPlaceUnitMode() {
  const mode = _placeUnitMode;
  _cancelPlaceMode();
  if (mode && mode.onCancel) mode.onCancel();
}

function _cancelPlaceMode() {
  _placeUnitMode = null;
  if (_map) _map.getContainer().style.cursor = '';
  _clearPlaceHighlight();
  _clearPlaceHint();
}

function _showPlaceHighlight(countryName) {
  if (!_geojsonData || !_map) return;
  const feature = _geojsonData.features.find(f =>
    (f.properties.ADMIN || f.properties.name || '') === countryName
  );
  if (!feature) return;
  _placeHighlightLayer = L.geoJSON(feature, {
    style: { color: '#c8a84b', weight: 2, fillColor: '#c8a84b', fillOpacity: 0.12, dashArray: '6 4' }
  }).addTo(_map);
}

function _clearPlaceHighlight() {
  if (_placeHighlightLayer && _map) {
    _map.removeLayer(_placeHighlightLayer);
    _placeHighlightLayer = null;
  }
}

function _showPlaceHint(unitName, countryName) {
  if (!_map) return;
  _clearPlaceHint();
  const el = document.createElement('div');
  el.id = 'place-unit-hint';
  el.style.cssText = [
    'position:absolute', 'bottom:50px', 'left:50%', 'transform:translateX(-50%)',
    'background:rgba(15,19,24,0.94)', 'border:1px solid #c8a84b', 'border-radius:6px',
    'padding:10px 16px', 'z-index:1000', 'display:flex', 'align-items:center', 'gap:12px',
    'font-family:Cinzel,serif', 'color:#c8a84b', 'font-size:0.8rem', 'white-space:nowrap',
    'pointer-events:auto', 'box-shadow:0 4px 20px rgba(0,0,0,0.6)'
  ].join(';');
  el.innerHTML = `
    <span>Clique em <strong>${countryName}</strong> para posicionar <strong>${unitName}</strong></span>
    <button onclick="cancelPlaceUnitMode()" style="
      background:#1a0508;border:1px solid rgba(192,37,58,0.7);color:#c0253a;
      font-family:Cinzel,serif;font-size:0.72rem;padding:4px 10px;
      border-radius:3px;cursor:pointer;letter-spacing:0.5px;
    ">CANCELAR</button>
  `;
  const container = _map.getContainer();
  container.style.position = 'relative';
  container.appendChild(el);
  _placeHintEl = el;
}

function _clearPlaceHint() {
  if (_placeHintEl) { _placeHintEl.remove(); _placeHintEl = null; }
}

// ── Point-in-polygon (ray-casting) for GeoJSON ────────────
function _pointInRing(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function _pointInFeature(lat, lng, feature) {
  const geom = feature && feature.geometry;
  if (!geom) return false;
  const inPoly = (poly) => {
    if (!_pointInRing(lat, lng, poly[0])) return false;
    for (let h = 1; h < poly.length; h++) { if (_pointInRing(lat, lng, poly[h])) return false; }
    return true;
  };
  if (geom.type === 'Polygon')      return inPoly(geom.coordinates);
  if (geom.type === 'MultiPolygon') return geom.coordinates.some(p => inPoly(p));
  return false;
}

// ── Country selection map (modal) ──────────────────────────
let _selectMap = null;
let _selectLayer = null;

async function initSelectMap() {
  if (_selectMap) return;
  _selectMap = L.map('country-select-map', {
    center: [20, 0], zoom: 2, minZoom: 1, maxZoom: 5,
    zoomControl: true,
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '', subdomains: 'abcd', maxZoom: 20,
  }).addTo(_selectMap);

  _selectLayer = L.layerGroup().addTo(_selectMap);
  await _loadGeoJSON();
  if (_geojsonData) {
    L.geoJSON(_geojsonData, {
      style: { color: '#1e2535', weight: 1, fillColor: '#1a3a6a', fillOpacity: 0.2 },
      onEachFeature(feature, layer) {
        layer.on('click', () => {
          const name = feature.properties.ADMIN || feature.properties.name;
          selectCountryByName(name);
        });
        layer.on('mouseover', function() { this.setStyle({ fillOpacity: 0.4 }); });
        layer.on('mouseout',  function() { this.setStyle({ fillOpacity: 0.2 }); });
      }
    }).addTo(_selectLayer);
  }
  setTimeout(() => _selectMap.invalidateSize(), 100);
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
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('geojson-missing').style.display = 'flex';
    return false;
  }
}

// ── Country layer rendering ────────────────────────────────
function renderCountries(state) {
  if (!_geojsonData || !_map) return;
  _countriesLayer.clearLayers();

  L.geoJSON(_geojsonData, {
    style(feature) {
      const name = feature.properties.ADMIN || feature.properties.name || '';
      return {
        color:        '#1e2535',
        weight:       1,
        fillColor:    getCountryFillColor(name, state),
        fillOpacity:  getCountryFillOpacity(name, state),
      };
    },
    onEachFeature(feature, layer) {
      const name = feature.properties.ADMIN || feature.properties.name || '';
      layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onCountryClick(name, state);
      });
      layer.on('mouseover', function() {
        this.setStyle({ weight: 2, color: '#c8a84b' });
        this.bindTooltip(
          `<div style="font-family:'Cinzel',serif;font-size:0.8rem;color:#c8a84b;background:#0f1318;border:1px solid #1e2535;padding:4px 8px;border-radius:4px;">${name}</div>`,
          { sticky: true, className: '' }
        ).openTooltip();
      });
      layer.on('mouseout', function() {
        this.setStyle({ weight: 1, color: '#1e2535' });
        this.closeTooltip();
      });
    }
  }).addTo(_countriesLayer);
}

function onCountryClick(name, state) {
  if (window._selectedUnitId) return;
  window._selectedCountry = name;
  renderPanelForTab('info');
  switchTab('info');
}

// ── Unit markers ───────────────────────────────────────────
function renderUnits(state) {
  if (!_map) return;
  _unitsLayer.clearLayers();

  (state.units || []).forEach(unit => {
    const isPlayer = unit.country === state.player_country;
    const icon = createUnitIconSync(unit.type, isPlayer);

    const marker = L.marker([unit.lat, unit.lng], {
      icon,
      title: unit.name,
      zIndexOffset: isPlayer ? 1000 : 0,
    });

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      onUnitClick(unit.id, state);
    });

    marker.bindTooltip(_buildUnitTooltip(unit), {
      className: '',
      offset: [0, -20],
    });

    marker.addTo(_unitsLayer);
    unit._marker = marker;
  });
}

function _buildUnitTooltip(unit) {
  const def = UNIT_DEFS[unit.type];
  const lvName = levelName(unit.level);
  const hpPct  = Math.round(unit.hp);
  const enPct  = Math.round(unit.energy / unit.energyCap * 100);
  return `<div class="unit-tooltip">
    <div class="unit-tooltip-name">${unit.name}</div>
    <div>${def ? def.label : unit.type} — ${lvName}</div>
    <div>HP ${hpPct}%  EN ${enPct}%  Esq x${unit.squadSize}</div>
  </div>`;
}

function onUnitClick(unitId, state) {
  const unit = (state.units || []).find(u => u.id === unitId);
  if (!unit) return;
  const isPlayer = unit.country === state.player_country;

  if (isPlayer) {
    if (window._selectedUnitId === unitId) {
      window._selectedUnitId = null;
      clearRouteLines();
    } else {
      window._selectedUnitId = unitId;
      notify(`${unit.name} selecionado — clique no mapa para mover`, 'info');
    }
  }
  renderPanelForTab('military');
  switchTab('military');
}

function _handleMapClickForMove(lat, lng) {
  if (!window._selectedUnitId) return;
  const unit = (window.GS.units || []).find(u => u.id === window._selectedUnitId);
  if (!unit) { window._selectedUnitId = null; return; }

  const result = moveUnit(unit, lat, lng);
  if (result.ok) {
    clearRouteLines();
    animateUnitMove(unit, lat, lng, () => {
      renderUnits(window.GS);
      renderPanelForTab('military');
      saveGame(window.GS);
    });
    notify(`${unit.name} em movimento`, 'info');
  } else {
    notify(result.reason, 'error');
  }
  window._selectedUnitId = null;
}

// ── Route animation ────────────────────────────────────────
function clearRouteLines() {
  _routeLines.forEach(l => _map.removeLayer(l));
  _routeLines = [];
}

function drawRouteLine(fromLat, fromLng, toLat, toLng) {
  const line = L.polyline([[fromLat, fromLng], [toLat, toLng]], {
    color: '#c8a84b', weight: 2, dashArray: '6 4', opacity: 0.7
  }).addTo(_map);
  _routeLines.push(line);
}

function animateUnitMove(unit, destLat, destLng, onDone) {
  drawRouteLine(unit.lat, unit.lng, destLat, destLng);
  if (unit._marker) {
    unit._marker.setLatLng([destLat, destLng]);
  }
  setTimeout(() => {
    clearRouteLines();
    if (onDone) onDone();
  }, 800);
}

// ── Structure markers ──────────────────────────────────────
function renderStructures(state) {
  if (!_map) return;
  _structuresLayer.clearLayers();

  (state.structures || []).forEach(s => {
    if (!s.lat || !s.lng) return;
    const icon = createStructureIcon(s.type, s.complete);
    const marker = L.marker([s.lat, s.lng], { icon });
    const status = s.complete ? 'Concluida' : `Em construcao: ${s.turnsLeft} turno${s.turnsLeft !== 1 ? 's' : ''}`;
    marker.bindTooltip(
      `<div style="background:#0f1318;border:1px solid #1e2535;padding:4px 8px;border-radius:4px;font-size:0.8rem;color:#ccc9bc;">${s.label} — ${status}</div>`,
      { className: '' }
    );
    marker.addTo(_structuresLayer);
  });
}

// ── Build on map click mode ────────────────────────────────
let _buildMode = null;

function enterBuildMode(structType) {
  _buildMode = structType;
  const def = STRUCTURE_DEFS[structType];
  notify(`Clique no mapa para posicionar: ${def.label}`, 'info');
  _map.once('click', (e) => {
    if (!_buildMode) return;
    const type = _buildMode;
    _buildMode = null;
    const result = startConstruction(type, window.GS, e.latlng.lat, e.latlng.lng);
    if (result.ok) {
      notify(`Construcao iniciada: ${result.structure.label}`, 'info');
      renderStructures(window.GS);
      renderPanelForTab('build');
      saveGame(window.GS);
    } else {
      notify(result.reason, 'error');
    }
  });
}

// ── Fly to country — animated ──────────────────────────────
function flyToCountry(name) {
  if (!_map) return;

  // Step 1: always zoom out to world view first so the animation is visible
  _map.setZoom(2, { animate: false });

  // Step 2: try to find the GeoJSON feature and fly to its bounds
  if (_geojsonData) {
    try {
      const feature = _geojsonData.features.find(f =>
        (f.properties.ADMIN || f.properties.name || '') === name
      );
      if (feature) {
        const layer = L.geoJSON(feature);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          setTimeout(() => {
            _map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 7, duration: 1.8 });
          }, 100);
          return;
        }
      }
    } catch (e) {
      console.warn('flyToCountry GeoJSON error:', e);
    }
  }

  // Fallback: fly to centroid using AI_CENTROIDS table
  const centroid = (typeof AI_CENTROIDS !== 'undefined' && AI_CENTROIDS[name])
    ? AI_CENTROIDS[name]
    : _FALLBACK_CENTROIDS[name];

  if (centroid) {
    setTimeout(() => {
      _map.flyTo([centroid.lat, centroid.lng], 5, { duration: 1.8 });
    }, 100);
  }
}

// Centroids de fallback para os países mais comuns
const _FALLBACK_CENTROIDS = {
  'Brazil': { lat: -14, lng: -51 }, 'United States': { lat: 38, lng: -97 },
  'Russia': { lat: 60, lng: 90 },   'China': { lat: 35, lng: 103 },
  'Germany': { lat: 51, lng: 10 },  'France': { lat: 46, lng: 2 },
  'United Kingdom': { lat: 55, lng: -3 }, 'Japan': { lat: 36, lng: 138 },
  'India': { lat: 20, lng: 77 },    'Canada': { lat: 56, lng: -96 },
  'Australia': { lat: -25, lng: 133 }, 'Argentina': { lat: -38, lng: -63 },
  'Mexico': { lat: 23, lng: -102 }, 'South Korea': { lat: 36, lng: 128 },
  'Turkey': { lat: 39, lng: 35 },   'Saudi Arabia': { lat: 23, lng: 45 },
  'Italy': { lat: 41, lng: 12 },    'Spain': { lat: 40, lng: -4 },
  'Iran': { lat: 32, lng: 53 },     'North Korea': { lat: 40, lng: 127 },
  'Algeria': { lat: 28, lng: 2 },   'Egypt': { lat: 27, lng: 30 },
  'Nigeria': { lat: 9, lng: 8 },    'South Africa': { lat: -29, lng: 25 },
  'Indonesia': { lat: -2, lng: 118 },'Ukraine': { lat: 49, lng: 32 },
  'Poland': { lat: 52, lng: 20 },   'Pakistan': { lat: 30, lng: 70 },
};

function flyTo(lat, lng, zoom) {
  if (_map) _map.flyTo([lat, lng], zoom || 5, { duration: 1.2 });
}

function invalidateMap() {
  if (_map) _map.invalidateSize();
}

// ── Country list for selection modal ──────────────────────
function getAllCountryNames() {
  if (!_geojsonData) return [];
  return _geojsonData.features
    .map(f => f.properties.ADMIN || f.properties.name || '')
    .filter(Boolean)
    .sort();
}
