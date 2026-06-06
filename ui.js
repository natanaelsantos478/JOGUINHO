// ═══════════════════════════════════════════════════════════
//  ui.js — Header, panels, modals, notifications
// ═══════════════════════════════════════════════════════════

let _activeTab = 'info';
let _selectedCountryForModal = null;
let _notifTimer = null;
let _activeResearchCat = 'aviacao';

const UNIT_REAL_PHOTOS = {
  infantry:        'https://commons.wikimedia.org/wiki/Special:FilePath/Soldiers_of_the_3rd_U.S._Infantry_Regiment.jpg',
  motorized:       'https://commons.wikimedia.org/wiki/Special:FilePath/M113-latrun-1.jpg',
  veh_light:       'https://commons.wikimedia.org/wiki/Special:FilePath/Stryker-latrun-1.jpg',
  veh_medium:      'https://commons.wikimedia.org/wiki/Special:FilePath/Bradley_IFV.jpg',
  tank_elite:      'https://commons.wikimedia.org/wiki/Special:FilePath/M1A2_Abrams_on_patrol.jpg',
  artillery:       'https://commons.wikimedia.org/wiki/Special:FilePath/M270_Multiple_Launch_Rocket_System.jpg',
  air3_drone:      'https://commons.wikimedia.org/wiki/Special:FilePath/MQ-1_Predator_unmanned_aircraft.jpg',
  air2_fighter:    'https://commons.wikimedia.org/wiki/Special:FilePath/F-16_Fighting_Falcon_in_flight.jpg',
  air2_helicopter: 'https://commons.wikimedia.org/wiki/Special:FilePath/AH-64D_Apache_Longbow.jpg',
  air1_stealth:    'https://commons.wikimedia.org/wiki/Special:FilePath/F-22_Raptor_edit1.jpg',
  air_transport:   'https://commons.wikimedia.org/wiki/Special:FilePath/C-17_Globemaster_III_top-view.jpg',
  nav3_patrol:     'https://commons.wikimedia.org/wiki/Special:FilePath/USCGC_Adak_WPB-1333.jpg',
  nav2_frigate:    'https://commons.wikimedia.org/wiki/Special:FilePath/USS_Klakring_FFG-42.jpg',
  nav1_destroyer:  'https://commons.wikimedia.org/wiki/Special:FilePath/USS_Arleigh_Burke_DDG-51.jpg',
  nav1_carrier:    'https://commons.wikimedia.org/wiki/Special:FilePath/USS_Ronald_Reagan_(CVN-76).jpg',
};

// Map each research item to a stable Wikipedia ARTICLE TITLE. We fetch that
// article's lead image at runtime via the MediaWiki API (origin=* → CORS ok).
// Article titles are far more stable than guessing exact image file names.
const RESEARCH_WIKI_TITLES = {
  // Aviação — Caças
  air2_f16_falcon:           'General Dynamics F-16 Fighting Falcon',
  air2_fa18_hornet:          'McDonnell Douglas F/A-18 Hornet',
  air1_eurofighter_typhoon:  'Eurofighter Typhoon',
  air1_f22_raptor:           'Lockheed Martin F-22 Raptor',
  // Bombardeiros
  air2_a10_warthog:          'Fairchild Republic A-10 Thunderbolt II',
  air2_su25_frogfoot:        'Sukhoi Su-25',
  air1_b2_spirit:            'Northrop Grumman B-2 Spirit',
  air1_b21_raider:           'Northrop Grumman B-21 Raider',
  // Helicópteros
  air2_apache_ah64:          'Boeing AH-64 Apache',
  air2_mi28_havoc:           'Mil Mi-28',
  air2_ka52_alligator:       'Kamov Ka-52',
  // Drones
  air3_bayraktar_tb2:        'Bayraktar TB2',
  air3_mq9_reaper:           'General Atomics MQ-9 Reaper',
  air3_rq4_global_hawk:      'Northrop Grumman RQ-4 Global Hawk',
  // Transporte
  air3_c130_hercules:        'Lockheed C-130 Hercules',
  airsup_c17_globemaster:    'Boeing C-17 Globemaster III',
  airsup_c5_galaxy:          'Lockheed C-5 Galaxy',
  // Terrestre — Infantaria
  sol_infantry_soldier:      'Infantry',
  sol_army_ranger:           '75th Ranger Regiment',
  sol_special_forces:        'United States Navy SEALs',
  sol_paratrooper:           'Paratrooper',
  // Veículos Leves
  veh1_humvee_hmmwv:         'Humvee',
  veh1_lav25_armored:        'LAV-25',
  veh1_oshkosh_matv:         'Oshkosh M-ATV',
  // IFV / APC
  veh1_m113_apc:             'M113 armored personnel carrier',
  veh2_bradley_m2:           'Bradley Fighting Vehicle',
  veh2_cv90_ifv:             'Combat Vehicle 90',
  veh2_bmp3_russian:         'BMP-3',
  // Tanques
  veh2_t90_tank:             'T-90',
  tank1_leopard2a7:          'Leopard 2',
  tank1_m1a2_abrams:         'M1 Abrams',
  tank1_t14_armata:          'T-14 Armata',
  // Artilharia
  veh2_m109_paladin:         'M109 howitzer',
  veh2_mlrs_m270:            'M270 Multiple Launch Rocket System',
  veh2_bm30_smerch:          'BM-30 Smerch',
  // Naval — Patrulha
  nav3_river_patrol:         'Patrol boat',
  nav3_visby_corvette:       'Visby-class corvette',
  nav3_lcs_freedom:          'Freedom-class littoral combat ship',
  // Fragatas
  nav2_fremm_frigate:        'FREMM multipurpose frigate',
  nav2_type26_frigate:       'Type 26 frigate',
  nav2_ticonderoga_cruiser:  'Ticonderoga-class cruiser',
  nav2_kirov_battlecruiser:  'Kirov-class battlecruiser',
  // Destróieres
  nav1_arleigh_burke:        'Arleigh Burke-class destroyer',
  nav1_type45_daring:        'Type 45 destroyer',
  nav1_zumwalt_destroyer:    'Zumwalt-class destroyer',
  // Submarinos
  nav2_losangeles_submarine: 'Los Angeles-class submarine',
  nav1_virginia_submarine:   'Virginia-class submarine',
  nav1_yasen_submarine:      'Yasen-class submarine',
  // Porta-Aviões
  nav1_kuznetsov_carrier:    'Soviet aircraft carrier Admiral Kuznetsov',
  nav1_queen_elizabeth_carrier: 'HMS Queen Elizabeth (R08)',
  nav1_gerald_ford_carrier:  'USS Gerald R. Ford',
  // Armamentos — Defesa Aérea
  grdsup_patriot_battery:    'MIM-104 Patriot',
  grdsup_s400_tel:           'S-400 missile system',
  grdsup_iron_dome:          'Iron Dome',
  // Mísseis
  wpn_cruise_missile:        'Tomahawk (missile)',
  wpn_antiship_missile:      'Anti-ship missile',
  wpn_bunker_buster:         'Bunker buster',
  // Anti-Tanque
  wpn_rpg:                   'RPG-7',
  wpn_antitank_missile:      'FGM-148 Javelin',
  // Munições
  wpn_artillery_shell:       'Shell (projectile)',
  wpn_cluster_bomb:          'Cluster munition',
  wpn_nuclear_warhead:       'Nuclear weapon',
  // Infraestrutura — Energia
  civ_power_plant:           'Power station',
  sup_solar_farm:            'Photovoltaic power station',
  sup_wind_farm:             'Wind farm',
  sup_hydro_dam:             'Hydroelectricity',
  sup_nuclear_plant:         'Nuclear power plant',
  // Aeroportos / Portos
  civ_airport:               'Airport',
  civ_seaport:               'Port',
  // Pesquisa
  sup_research_lab:          'Laboratory',
  civ_data_center:           'Data center',
  civ_university:            'University',
  // Comunicações
  civ_telecom_tower:         'Cell site',
  sup_sat_uplink:            'Satellite ground station',
  sup_sigint_station:        'Signals intelligence',
};

// Cache of resolved title → image URL so we only hit the API once each.
const _wikiPhotoCache = {};

// Load the lead image of a Wikipedia article into an <img>. Sets a placeholder
// first (caller does that); swaps in the real photo when it resolves. Guards
// against races by stamping imgEl.dataset.wikiTitle.
function loadWikiPhoto(title, imgEl) {
  if (!title || !imgEl) return;
  imgEl.dataset.wikiTitle = title;
  const apply = (src) => {
    if (src && imgEl.dataset.wikiTitle === title) {
      imgEl.src = src;
      imgEl.style.display = 'block';
    }
  };
  if (_wikiPhotoCache[title]) { apply(_wikiPhotoCache[title]); return; }
  const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*'
    + '&prop=pageimages&piprop=original%7Cthumbnail&pithumbsize=640&redirects=1'
    + '&titles=' + encodeURIComponent(title);
  fetch(url)
    .then(r => r.json())
    .then(d => {
      const pages = d && d.query && d.query.pages;
      if (!pages) return;
      const p = Object.values(pages)[0] || {};
      const src = (p.original && p.original.source) || (p.thumbnail && p.thumbnail.source);
      if (src) { _wikiPhotoCache[title] = src; apply(src); }
    })
    .catch(() => { /* keep sprite placeholder */ });
}

// ── Sprite helper: retorna <img> ou div texto ──────────────
function _unitImgHtml(unitType, size) {
  size = size || 40;
  const dataUrl = (typeof getUnitSpriteDataUrl === 'function')
    ? getUnitSpriteDataUrl(unitType, size) : null;
  const map = (typeof UNIT_SPRITE_MAP !== 'undefined') ? UNIT_SPRITE_MAP[unitType] : null;
  const short = map ? map.short : '?';
  if (dataUrl) {
    return `<img src="${dataUrl}" width="${size}" height="${size}" style="border-radius:50%;border:2px solid var(--border);flex-shrink:0;" />`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#0b0e13;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--gold);font-family:'Cinzel',serif;font-weight:700;flex-shrink:0;">${short}</div>`;
}

// ── Boot UI ────────────────────────────────────────────────
function showGameUI() {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('header').style.display = 'flex';
  document.getElementById('side-panel').style.display = 'flex';
  document.getElementById('country-modal').classList.remove('visible');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('btn-end-turn').addEventListener('click', doEndTurn);
}

function setLoadingMsg(msg) {
  const el = document.getElementById('loading-msg');
  if (el) el.textContent = msg;
}

// ── Header ─────────────────────────────────────────────────
function updateHeader(state) {
  const base = getCountryBaseData(state.player_country);
  document.getElementById('header-flag').src = getFlagUrl(base.iso2);
  document.getElementById('header-country').textContent = state.player_country;
  document.getElementById('header-turn').textContent    = `Turno ${state.turn}`;
  document.getElementById('res-money').textContent      = fmtNum(state.resources.money);
  document.getElementById('res-oil').textContent        = fmtNum(state.resources.oil);
  document.getElementById('res-food').textContent       = fmtNum(state.resources.food);
  document.getElementById('res-energy').textContent     = fmtNum(state.resources.energy);
  document.getElementById('res-manpower').textContent   = fmtNum(state.resources.manpower);
}

function fmtNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'k';
  return String(Math.round(n));
}

// ── Tab switching ──────────────────────────────────────────
function switchTab(tab) {
  _activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  renderPanelForTab(tab);
}

function renderPanelForTab(tab) {
  _activeTab = tab;
  const el = document.getElementById('panel-content');
  if (!el || !window.GS) return;
  const state = window.GS;

  switch (tab) {
    case 'info':     el.innerHTML = renderInfoPanel(state);     break;
    case 'military': el.innerHTML = renderMilitaryPanel(state); break;
    case 'research': el.innerHTML = renderResearchPanel(state); break;
    case 'build':    el.innerHTML = renderBuildPanel(state);    break;
    case 'gov':      el.innerHTML = renderGovPanel(state);      break;
    case 'diplo':    el.innerHTML = renderDiploPanel(state);    break;
    case 'log':      el.innerHTML = renderLogPanel(state);      break;
  }
  attachPanelEvents(tab, state);
}

// ── CITY PANEL helpers ──────────────────────────────────────
function _renderCityPanel(state, cityData) {
  const cs = (typeof getOrInitCity === 'function') ? getOrInitCity(cityData) : null;
  if (!cs) return '';

  const meta     = (typeof CITY_LEVEL_META !== 'undefined') ? CITY_LEVEL_META[cs.level] : null;
  const levelName = meta ? meta.name : `Nivel ${cs.level}`;
  const slots    = (typeof getCitySlots  === 'function') ? getCitySlots(cs)  : '?';
  const usedSlots= (typeof getUsedSlots  === 'function') ? getUsedSlots(cs)  : '?';
  const isPlayer = cityData.country === state.player_country;

  // structures list
  const STRUCT_LABELS = (typeof STRUCT_DEFS !== 'undefined') ? STRUCT_DEFS : {};
  const structRows = Object.entries(cs.structures || {}).map(([t, tier]) => {
    const def = STRUCT_LABELS[t];
    const img = (typeof getCityStructureImgHtml === 'function') ? getCityStructureImgHtml(t, 24) : '';
    return `<div class="panel-row" style="gap:8px;">
      ${img}
      <span class="panel-label" style="flex:1">${def ? def.label : t}</span>
      <span class="panel-value">Tier ${tier}</span>
    </div>`;
  }).join('');

  // available builds (player's cities only)
  let buildsHtml = '';
  if (isPlayer && typeof getAvailableBuilds === 'function') {
    const builds = getAvailableBuilds(cs);
    if (builds.length > 0) {
      buildsHtml = `<div class="panel-title" style="margin-top:12px">CONSTRUIR / MELHORAR</div>` +
        builds.map(b => `
          <button class="btn-primary${b.canAfford ? '' : ''}" ${b.canAfford ? '' : 'disabled'}
            onclick="uiBuildCityStructure('${cityData.name}','${b.type}')"
            style="text-align:left;font-size:0.73rem;padding:5px 8px;margin:2px 0">
            ${b.label} <span style="color:var(--muted)">Tier ${b.curTier}→${b.nextTier}</span>
            <span style="float:right;color:${b.canAfford ? 'var(--gold)' : 'var(--red)'}">$${b.cost}</span>
          </button>`).join('');
    } else {
      buildsHtml = `<div class="panel-title" style="margin-top:12px">CONSTRUIR / MELHORAR</div><p style="color:var(--muted);font-size:0.78rem">Nenhuma construção disponível.</p>`;
    }
  }

  const starsFull  = '★'.repeat(cs.level);
  const starsEmpty = '☆'.repeat(4 - cs.level);

  return `
    <div class="panel-section">
      <div class="panel-title">CIDADE</div>
      <div style="font-family:'Cinzel',serif;font-size:1rem;color:var(--gold);margin-bottom:4px">${cs.name}</div>
      <div style="font-size:0.8rem;color:var(--muted);margin-bottom:8px">${cs.country}${cs.coastal ? ' — Costeira' : ''}</div>
      <div class="panel-row">
        <span class="panel-label">Nível</span>
        <span class="panel-value gold">${levelName} <span style="font-size:0.85rem">${starsFull}${starsEmpty}</span></span>
      </div>
      <div class="panel-row">
        <span class="panel-label">Slots usados</span>
        <span class="panel-value">${usedSlots} / ${slots}</span>
      </div>
      ${meta ? `<div class="panel-row"><span class="panel-label">Multiplicador</span><span class="panel-value">×${meta.genMult}</span></div>` : ''}
    </div>
    <div class="panel-section">
      <div class="panel-title">ESTRUTURAS</div>
      ${structRows || '<p style="color:var(--muted);font-size:0.78rem">Sem estruturas.</p>'}
      ${buildsHtml}
    </div>
  `;
}

// ── INFO PANEL ─────────────────────────────────────────────
function renderInfoPanel(state) {
  const country  = window._selectedCountry  || state.player_country;
  const province = window._selectedProvince || null;
  const base     = getCountryBaseData(country);
  const isPlayer = country === state.player_country;
  const rel      = isPlayer ? 'Seu pais' : relationLabel(getRelation(state, country));

  // If a city was clicked, show city panel at top
  const citySection = window._selectedCity && window._selectedCity.country === country
    ? _renderCityPanel(state, window._selectedCity)
    : '';

  const provinceSection = province ? `
    <div class="panel-section">
      <div class="panel-title">PROVINCIA / ESTADO</div>
      <div style="font-family:'Cinzel',serif;font-size:0.95rem;color:var(--gold);margin-bottom:6px;">${province}</div>
      <div style="font-size:0.8rem;color:var(--muted);margin-bottom:8px;">${country}</div>
      ${isPlayer ? `<button class="btn-primary btn-success" onclick="uiRecruitInProvince()">+ RECRUTAR AQUI</button>` : ''}
    </div>
  ` : '';

  return `
    ${citySection}
    ${provinceSection}
    <div class="panel-section">
      <div class="panel-title">INFORMACOES — ${province ? 'PAIS' : 'SELECAO'}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <img src="${getFlagUrl(base.iso2)}" style="width:40px;height:27px;object-fit:cover;border-radius:3px;border:1px solid var(--border);" onerror="this.style.display='none'" />
        <div>
          <div style="font-family:'Cinzel',serif;font-size:0.95rem;color:var(--gold)">${country}</div>
          <div style="font-size:0.8rem;color:var(--muted)">${rel}</div>
        </div>
      </div>
      <div class="panel-row"><span class="panel-label">Populacao</span><span class="panel-value">${fmtNum(base.population)}</span></div>
      <div class="panel-row"><span class="panel-label">PIB</span><span class="panel-value">$${base.gdp}B</span></div>
      ${isPlayer ? `<div class="panel-row"><span class="panel-label">Satisfacao</span><span class="panel-value ${state.satisfaction < 20 ? 'red' : state.satisfaction > 60 ? 'green' : ''}">${Math.round(state.satisfaction || 50)}%</span></div>` : ''}
    </div>

    ${!isPlayer ? `
    <div class="panel-section">
      <div class="panel-title">ACOES DIPLOMATICAS</div>
      <button class="btn-primary btn-danger" onclick="uiDeclareWar('${country}')">DECLARAR GUERRA</button>
      <button class="btn-primary btn-success" onclick="uiProposePeace('${country}')">PROPOR PAZ</button>
      <button class="btn-primary" onclick="uiProposeAlliance('${country}')">PROPOR ALIANCA</button>
      <button class="btn-primary" onclick="uiSetEmbargo('${country}')">EMBARGO ECONOMICO</button>
    </div>
    ` : ''}

    <div class="panel-section">
      <div class="panel-title">CONTROLES</div>
      <button class="btn-primary" onclick="flyToCountry('${country}')">IR PARA ${country.toUpperCase()}</button>
    </div>
  `;
}

// ── MILITARY PANEL ─────────────────────────────────────────
function renderMilitaryPanel(state) {
  const playerUnits = (state.units || []).filter(u => u.country === state.player_country);
  const enemyUnits  = (state.units || []).filter(u => u.country !== state.player_country);

  const unitCards = playerUnits.map(u => {
    const def = UNIT_DEFS[u.type];
    const selected = window._selectedUnitId === u.id;
    const hpPct  = Math.round(u.hp);
    const enPct  = Math.round(u.energy / u.energyCap * 100);
    const xpPct  = u.level < 5 ? Math.round((u.xp / (XP_THRESHOLDS[u.level] || 1)) * 100) : 100;
    const hasPending = u.pendingLat != null;
    return `
      <div class="unit-card${selected ? ' selected' : ''}" style="display:flex;gap:10px;align-items:flex-start;padding:10px;" onclick="openUnitDetail('${u.id}')">
        <div style="flex-shrink:0;cursor:pointer;">
          ${_unitImgHtml(u.type, 64)}
          ${hasPending ? `<div style="text-align:center;font-size:0.6rem;color:#e02030;margin-top:3px;font-family:'Cinzel',serif;">EM MARCHA</div>` : ''}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span class="unit-name" style="font-size:0.8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${u.name}</span>
            <span class="unit-level">Lv${u.level}</span>
          </div>
          <div style="font-size:0.68rem;color:#5a7a55;margin-bottom:6px">${def ? def.label : u.type}</div>
          <div class="unit-bars">
            <div class="bar-row"><span class="bar-label" style="color:#5a7a55">HP</span><div class="bar-track"><div class="bar-fill hp" style="width:${hpPct}%"></div></div><span style="font-size:0.65rem;color:#5a7a55">${hpPct}%</span></div>
            <div class="bar-row"><span class="bar-label" style="color:#5a7a55">EN</span><div class="bar-track"><div class="bar-fill energy" style="width:${enPct}%"></div></div><span style="font-size:0.65rem;color:#5a7a55">${enPct}%</span></div>
            <div class="bar-row"><span class="bar-label" style="color:#5a7a55">XP</span><div class="bar-track"><div class="bar-fill xp" style="width:${xpPct}%"></div></div><span style="font-size:0.65rem;color:#5a7a55">${u.xp}xp</span></div>
          </div>
          <div style="margin-top:8px;display:flex;gap:5px;" onclick="event.stopPropagation()">
            <button class="btn-military" style="flex:1;padding:4px 5px;font-size:0.65rem" onclick="uiSelectUnit('${u.id}')">MOVER</button>
            <button class="btn-military danger" style="flex:1;padding:4px 5px;font-size:0.65rem" onclick="uiDisbandUnit('${u.id}')">DISPENSAR</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="panel-section">
      <div class="panel-title">SUAS FORÇAS (${playerUnits.length})</div>
      <button class="btn-military success" onclick="openRecruitModal()">+ RECRUTAR UNIDADE</button>
      ${playerUnits.length === 0 ? '<p style="color:#5a7a55;font-size:0.82rem;margin-top:8px">Sem unidades. Recrute sua primeira força.</p>' : unitCards}
    </div>
    ${enemyUnits.length > 0 ? `
    <div class="panel-section">
      <div class="panel-title">FORÇAS INIMIGAS (${enemyUnits.length})</div>
      ${enemyUnits.slice(0, 6).map(u => {
        const def = UNIT_DEFS[u.type];
        return `<div class="unit-card" style="display:flex;gap:8px;align-items:center;padding:8px;">
          ${_unitImgHtml(u.type, 40)}
          <div>
            <div class="unit-name" style="font-size:0.75rem">${u.name}</div>
            <div style="font-size:0.68rem;color:#c06060">${u.country} — ${def ? def.label : u.type}</div>
          </div>
        </div>`;
      }).join('')}
    </div>
    ` : ''}
  `;
}

// ── UNIT DETAIL MODAL ──────────────────────────────────────
function openUnitDetail(unitId) {
  const state = window.GS;
  if (!state) return;
  const unit = (state.units || []).find(u => u.id === unitId);
  if (!unit) return;
  const def = UNIT_DEFS[unit.type];
  if (!def) return;

  const modal = document.getElementById('unit-detail-modal');
  const photo = document.getElementById('unit-detail-photo');
  const fallback = document.getElementById('unit-detail-photo-fallback');
  const nameEl = document.getElementById('unit-detail-name');
  const typeEl = document.getElementById('unit-detail-type');
  const statsEl = document.getElementById('unit-detail-stats');

  // Photo: sprite as instant placeholder, then swap in a real Wikipedia photo.
  fallback.style.display = 'none';
  const spriteUrl = (typeof getUnitSpriteDataUrl === 'function') ? getUnitSpriteDataUrl(unit.type, 256) : null;
  if (spriteUrl) {
    photo.src = spriteUrl; photo.style.display = 'block';
  } else {
    photo.style.display = 'none';
    fallback.style.display = 'flex';
    fallback.innerHTML = _unitImgHtml(unit.type, 80);
  }
  photo.dataset.wikiTitle = '';
  const wikiTitle = RESEARCH_WIKI_TITLES[unit.type];
  if (wikiTitle) {
    photo.style.display = 'block'; fallback.style.display = 'none';
    loadWikiPhoto(wikiTitle, photo);
  }

  nameEl.textContent = unit.name;
  const domainLabel = { ground: 'TERRESTRE', air: 'AEREO', naval: 'NAVAL' }[def.domain] || def.domain;
  typeEl.textContent = `${def.label.toUpperCase()} — ${domainLabel} — TIER ${def.tier}`;

  const hpPct  = Math.round(unit.hp);
  const enPct  = Math.round(unit.energy / unit.energyCap * 100);
  const xpPct  = unit.level < 5 ? Math.round((unit.xp / (XP_THRESHOLDS[unit.level] || 1)) * 100) : 100;

  statsEl.innerHTML = `
    <div class="detail-stat-row"><span class="detail-stat-label">Nível</span><span class="detail-stat-value">${unit.level} — ${levelName(unit.level)}</span></div>
    <div class="detail-stat-row"><span class="detail-stat-label">HP</span><span class="detail-stat-value">${hpPct}%</span></div>
    <div class="detail-stat-row"><span class="detail-stat-label">Energia</span><span class="detail-stat-value">${enPct}%</span></div>
    <div class="detail-stat-row"><span class="detail-stat-label">XP</span><span class="detail-stat-value">${unit.xp} / ${XP_THRESHOLDS[unit.level] || '—'}</span></div>
    <div class="detail-stat-row"><span class="detail-stat-label">Ataque</span><span class="detail-stat-value">${def.atk}</span></div>
    <div class="detail-stat-row"><span class="detail-stat-label">Defesa</span><span class="detail-stat-value">${def.def}</span></div>
    <div class="detail-stat-row"><span class="detail-stat-label">Velocidade</span><span class="detail-stat-value">${def.speed} km/h</span></div>
    <div class="detail-stat-row"><span class="detail-stat-label">Alcance</span><span class="detail-stat-value">${def.range} km</span></div>
    <div class="detail-stat-row"><span class="detail-stat-label">País</span><span class="detail-stat-value">${unit.country}</span></div>
    <div class="detail-stat-row" style="border:none"><span class="detail-stat-label">Posição</span><span class="detail-stat-value">${unit.lat.toFixed(2)}°, ${unit.lng.toFixed(2)}°</span></div>
  `;

  modal.classList.add('visible');
}

function closeUnitDetail() {
  document.getElementById('unit-detail-modal').classList.remove('visible');
}

// ── BUILD PANEL ────────────────────────────────────────────
function renderBuildPanel(state) {
  const cities = window.GS && window.GS.cities
    ? Object.values(window.GS.cities).filter(cs => cs.country === state.player_country)
    : [];

  if (cities.length === 0) {
    return `
      <div class="panel-section">
        <div class="panel-title">SUAS CIDADES</div>
        <p style="color:var(--muted);font-size:0.82rem;margin-top:8px">Clique em uma cidade no mapa para gerenciar construções.</p>
      </div>
    `;
  }

  const CITY_LEVEL_META_LOCAL = (typeof CITY_LEVEL_META !== 'undefined') ? CITY_LEVEL_META : {};

  const cityCards = cities.map(cs => {
    const meta = CITY_LEVEL_META_LOCAL[cs.level] || {};
    const levelName = meta.name || `Nivel ${cs.level}`;
    const slots     = (typeof getCitySlots  === 'function') ? getCitySlots(cs)  : '?';
    const usedSlots = (typeof getUsedSlots  === 'function') ? getUsedSlots(cs)  : '?';
    const structCount = Object.keys(cs.structures || {}).length;
    const starsFull  = '★'.repeat(cs.level || 0);
    const starsEmpty = '☆'.repeat(Math.max(0, 4 - (cs.level || 0)));
    return `
      <div class="structure-card" style="margin-bottom:10px;">
        <div style="font-family:'Cinzel',serif;font-size:0.9rem;color:var(--gold);margin-bottom:4px;">${cs.name}</div>
        <div style="font-size:0.78rem;color:var(--gold);margin-bottom:4px;">${starsFull}${starsEmpty} <span style="color:var(--muted)">${levelName}</span></div>
        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px;">Slots: ${usedSlots}/${slots} — Estruturas: ${structCount}</div>
        <button class="btn-primary btn-success" style="padding:5px 10px;font-size:0.72rem;" onclick="uiSelectCity('${cs.name.replace(/'/g, "\\'")}')">GERENCIAR</button>
      </div>
    `;
  }).join('');

  return `
    <div class="panel-section">
      <div class="panel-title">SUAS CIDADES (${cities.length})</div>
      ${cityCards}
    </div>
  `;
}

function uiSelectCity(cityName) {
  if (!window.GS || !window.GS.cities || !window.GS.cities[cityName]) return;
  const cs = window.GS.cities[cityName];
  window._selectedCity     = cs;
  window._selectedCountry  = cs.country;
  window._selectedProvince = null;
  switchTab('info');
}

// ── GOVERNMENT PANEL ───────────────────────────────────────
function renderGovPanel(state) {
  const sat = Math.round(state.satisfaction || 50);
  const satColor = sat < 20 ? 'red' : sat > 60 ? 'green' : '';
  const satBar = `<div class="bar-track" style="height:8px;flex:1"><div class="bar-fill" style="width:${sat}%;background:${sat < 30 ? 'var(--red)' : sat < 60 ? '#c8a84b' : 'var(--green)'};height:8px"></div></div>`;

  const ministryCards = Object.entries(MINISTRY_DEFS).map(([key, def]) => {
    const level = (state.ministries || {})[key] || 1;
    const cost  = ministryCost(level);
    const stars = '★'.repeat(level) + '☆'.repeat(5 - level);
    const canAfford = state.resources.money >= cost && level < 5;
    return `
      <div class="ministry-card">
        <div class="ministry-header">
          <span class="ministry-name">${def.label}</span>
          <span class="ministry-level">Nivel ${level}</span>
        </div>
        <div class="ministry-stars">${stars}</div>
        <div style="font-size:0.75rem;color:var(--muted);margin:4px 0">${def.effect}</div>
        <button class="btn-primary" ${canAfford ? '' : 'disabled'} onclick="uiUpgradeMinistry('${key}')" style="padding:4px 8px;font-size:0.72rem;margin-top:4px">
          ${level < 5 ? `MELHORAR (${cost} MON)` : 'MAXIMO'}
        </button>
      </div>
    `;
  }).join('');

  const atWarCount = (state.at_war_with || []).length;
  const income   = incomePerTurn(state.resources, state.ministries || {}, atWarCount);
  const expenses = expensesPerTurn(state.units || []);

  return `
    <div class="panel-section">
      <div class="panel-title">SITUACAO DO GOVERNO</div>
      <div class="panel-row"><span class="panel-label">Satisfacao Popular</span><span class="panel-value ${satColor}">${sat}%</span></div>
      <div style="display:flex;align-items:center;gap:8px;margin:4px 0 10px">${satBar}<span style="font-size:0.75rem;color:var(--muted)">${sat < 20 ? 'RISCO DE REVOLUCAO!' : sat < 40 ? 'Baixa' : sat < 70 ? 'Estavel' : 'Alta'}</span></div>
      <div class="panel-row"><span class="panel-label">Renda/turno</span><span class="panel-value green">+${income} MON</span></div>
      <div class="panel-row"><span class="panel-label">Despesas/turno</span><span class="panel-value red">-${expenses} MON</span></div>
      <div class="panel-row"><span class="panel-label">Saldo</span><span class="panel-value ${income > expenses ? 'green' : 'red'}">${income > expenses ? '+' : ''}${income - expenses} MON</span></div>
      <div class="panel-row"><span class="panel-label">Em guerra com</span><span class="panel-value red">${atWarCount} paises</span></div>
    </div>
    <div class="panel-section">
      <div class="panel-title">MINISTERIOS</div>
      ${ministryCards}
    </div>
    <div class="panel-section">
      <div class="panel-title">MODO TESTE</div>
      <button class="btn-primary${(state._cheatMode ? ' btn-success' : '')}" onclick="uiToggleCheat()">
        RECURSOS INFINITOS: ${state._cheatMode ? 'ATIVO ✓' : 'OFF'}
      </button>
      <button class="btn-primary" onclick="uiGiveResources()" style="margin-top:2px">RECURSOS AGORA</button>
    </div>
    <div class="panel-section">
      <button class="btn-primary" onclick="goToMainMenu()" style="margin-top:2px">MENU PRINCIPAL</button>
      <button class="btn-primary btn-danger" onclick="resetGame()" style="margin-top:4px">NOVA CAMPANHA</button>
    </div>
  `;
}

// ── DIPLOMACY PANEL ────────────────────────────────────────
function renderDiploPanel(state) {
  const allNames = getAllCountryNames().slice(0, 60);
  const groups = {
    'Em Guerra':  allNames.filter(n => getRelation(state, n) === 'war'),
    'Aliados':    allNames.filter(n => getRelation(state, n) === 'alliance'),
    'Tregua':     allNames.filter(n => getRelation(state, n) === 'truce'),
    'Embargo':    allNames.filter(n => getRelation(state, n) === 'embargo'),
  };

  const sections = Object.entries(groups).filter(([, list]) => list.length > 0).map(([title, list]) => `
    <div class="panel-title" style="margin-top:12px">${title}</div>
    ${list.map(name => {
      const base = getCountryBaseData(name);
      return `
        <div class="diplo-card">
          <div class="diplo-header">
            <img class="diplo-flag" src="${getFlagUrl(base.iso2)}" onerror="this.style.display='none'" />
            <span class="diplo-name">${name}</span>
          </div>
          <button class="btn-primary" style="padding:4px 8px;font-size:0.72rem" onclick="window._selectedCountry='${name}';switchTab('info')">Ver detalhes</button>
        </div>
      `;
    }).join('')}
  `).join('');

  return `
    <div class="panel-section">
      <div class="panel-title">RELACOES DIPLOMATICAS</div>
      ${sections || '<p style="color:var(--muted);font-size:0.85rem">Nenhuma relacao especial ativa.</p>'}
    </div>
    <div class="panel-section">
      <div class="panel-title">ACOES</div>
      <p style="color:var(--muted);font-size:0.8rem">Clique em um pais no mapa ou na aba INFO para acoes diplomaticas.</p>
    </div>
  `;
}

// ── LOG PANEL ──────────────────────────────────────────────
function renderLogPanel(state) {
  const entries = (state.game_log || []).slice(0, 100);
  if (entries.length === 0) return '<p style="color:var(--muted);font-size:0.85rem;text-align:center;margin-top:20px">Sem eventos registrados.</p>';

  const html = entries.map(e => {
    let cls = 'log-entry';
    if (e.includes('GUERRA') || e.includes('declarou guerra') || e.includes('COMBATE') || e.includes('DERROTA')) cls += ' war';
    else if (e.includes('paz') || e.includes('Paz') || e.includes('alianca') || e.includes('cessar-fogo')) cls += ' peace';
    else if (e.includes('[EVENTO]') || e.includes('[CONSTRUCAO]') || e.includes('[IA')) cls += ' important';
    return `<div class="${cls}">${e}</div>`;
  }).join('');

  return `<div class="panel-section"><div class="panel-title">REGISTRO DE EVENTOS</div>${html}</div>`;
}

function attachPanelEvents(tab, state) {}

// ── Research panel ─────────────────────────────────────────
function uiSetResearchCat(catKey) { _activeResearchCat = catKey; renderPanelForTab('research'); }

function renderResearchPanel(state) {
  if (!state.research) state.research = initResearchState();
  const cats = Object.entries(RESEARCH_TREE);

  // active summary
  const activeSummary = Object.entries(state.research.active).map(([catKey, a]) => {
    const lvl = RESEARCH_TREE[catKey].lines[a.lineKey].levels[a.levelIdx];
    return `<div class="panel-row"><span class="panel-label">${RESEARCH_TREE[catKey].label}</span><span class="panel-value gold">${lvl.name} — ${a.turnsLeft}t</span></div>`;
  }).join('');

  const catTabs = cats.map(([k, c]) =>
    `<button class="rsch-cat-btn${k === _activeResearchCat ? ' active' : ''}" onclick="uiSetResearchCat('${k}')">${c.label}</button>`
  ).join('');

  const cat = RESEARCH_TREE[_activeResearchCat];
  const linesHtml = Object.entries(cat.lines).map(([lineKey, line]) => {
    const cells = line.levels.map((lvl, idx) => {
      const cell = getResearchCellState(state, _activeResearchCat, lineKey, idx);
      const url = (typeof getSpriteDataUrl === 'function') ? getSpriteDataUrl(lvl.sheet, lvl.sprite, 64) : null;
      const img = url
        ? `<img src="${url}" />`
        : `<div style="width:100%;height:42px;border-radius:3px;background:#1a2a10;display:flex;align-items:center;justify-content:center;color:#8aaa70;font-size:0.6rem;">${lvl.name.slice(0,3)}</div>`;
      let badge = '', meta = '';
      if (cell.status === 'completed') { badge = `<span class="rsch-cell-badge done">✓</span>`; meta = 'Concluído'; }
      else if (cell.status === 'active') { badge = `<span class="rsch-cell-badge prog">⏳</span>`; meta = `${cell.turnsLeft}t restantes`; }
      else { meta = `$${getResearchCost(state, _activeResearchCat, lineKey, idx)} / ${getResearchTurns(state, _activeResearchCat, lineKey, idx)}t`; }
      return `<div class="rsch-cell ${cell.status}" onclick="uiOpenResearchDetail('${_activeResearchCat}','${lineKey}',${idx})">
        ${badge}
        <div class="rsch-cell-col">Nv${idx+1}</div>
        ${img}
        <div class="rsch-cell-name">${lvl.name}</div>
        <div class="rsch-cell-meta">${meta}</div>
      </div>`;
    }).join('');
    return `<div class="rsch-line"><div class="rsch-line-label">${line.label}</div><div class="rsch-row">${cells}</div></div>`;
  }).join('');

  return `
    ${activeSummary ? `<div class="panel-section"><div class="panel-title">EM PESQUISA</div>${activeSummary}</div>` : ''}
    <div class="panel-section">
      <div class="panel-title">ÁRVORE DE PESQUISA</div>
      <div class="rsch-cat-tabs">${catTabs}</div>
      ${linesHtml}
    </div>
  `;
}

function uiOpenResearchDetail(catKey, lineKey, levelIdx) {
  const state = window.GS; if (!state) return;
  const lvl = RESEARCH_TREE[catKey].lines[lineKey].levels[levelIdx];
  const cell = getResearchCellState(state, catKey, lineKey, levelIdx);
  const modal = document.getElementById('research-detail-modal');
  const photo = document.getElementById('research-detail-photo');
  // Show the sprite immediately as a placeholder, then swap in a real photo
  // fetched from Wikipedia (if we have an article title for this item).
  const spriteUrl = (typeof getSpriteDataUrl === 'function') ? getSpriteDataUrl(lvl.sheet, lvl.sprite, 256) : null;
  if (spriteUrl) { photo.src = spriteUrl; photo.style.display = 'block'; } else { photo.style.display = 'none'; }
  photo.dataset.wikiTitle = '';
  const wikiTitle = RESEARCH_WIKI_TITLES[lvl.sprite];
  if (wikiTitle) loadWikiPhoto(wikiTitle, photo);
  document.getElementById('research-detail-name').textContent = lvl.name;
  document.getElementById('research-detail-meta').textContent =
    `${RESEARCH_TREE[catKey].label} — ${RESEARCH_TREE[catKey].lines[lineKey].label} — Nível ${levelIdx+1}`;
  document.getElementById('research-detail-desc').textContent = lvl.desc || '';

  // stats (if unit)
  let statsHtml = '';
  if (lvl.stats) {
    const s = lvl.stats;
    statsHtml = `
      <div class="detail-stat-row"><span class="detail-stat-label">Ataque</span><span class="detail-stat-value">${s.atk}</span></div>
      <div class="detail-stat-row"><span class="detail-stat-label">Defesa</span><span class="detail-stat-value">${s.def}</span></div>
      <div class="detail-stat-row"><span class="detail-stat-label">Velocidade</span><span class="detail-stat-value">${s.speed} km/h</span></div>
      <div class="detail-stat-row"><span class="detail-stat-label">Custo recrutamento</span><span class="detail-stat-value">$${s.cost} / ${s.manpower} MAN</span></div>
      ${lvl.reqStructure ? `<div class="detail-stat-row"><span class="detail-stat-label">Requer estrutura</span><span class="detail-stat-value">${lvl.reqStructure.type} T${lvl.reqStructure.tier}</span></div>` : ''}`;
  } else if (lvl.effect) {
    statsHtml = `<div class="detail-stat-row"><span class="detail-stat-label">Efeito</span><span class="detail-stat-value">${lvl.desc}</span></div>`;
  }
  document.getElementById('research-detail-stats').innerHTML = statsHtml;

  // action button
  const actions = document.getElementById('research-detail-actions');
  if (cell.status === 'available') {
    const cost = getResearchCost(state, catKey, lineKey, levelIdx);
    const turns = getResearchTurns(state, catKey, lineKey, levelIdx);
    const afford = (state.resources.money || 0) >= cost;
    actions.innerHTML = `<button class="btn-military success" ${afford ? '' : 'disabled'} onclick="uiStartResearch('${catKey}','${lineKey}',${levelIdx})" style="text-align:center;">PESQUISAR — $${cost} / ${turns}t</button>`;
  } else if (cell.status === 'completed') {
    actions.innerHTML = `<div style="color:#60c060;text-align:center;font-family:'Cinzel',serif;font-size:0.8rem;">✓ PESQUISA CONCLUÍDA</div>`;
  } else if (cell.status === 'active') {
    actions.innerHTML = `<div style="color:#c0a030;text-align:center;font-family:'Cinzel',serif;font-size:0.8rem;">⏳ EM ANDAMENTO — ${cell.turnsLeft} turnos</div>`;
  } else {
    actions.innerHTML = `<div style="color:#c06060;text-align:center;font-size:0.8rem;">${cell.reason || 'Indisponível'}</div>`;
  }
  modal.classList.add('visible');
}

function closeResearchDetail() { document.getElementById('research-detail-modal').classList.remove('visible'); }

function uiStartResearch(catKey, lineKey, levelIdx) {
  const r = startResearch(window.GS, catKey, lineKey, levelIdx);
  if (r.ok) {
    notify(`Pesquisa iniciada: ${r.label} (${r.turns} turnos)`, 'info');
    updateHeader(window.GS);
    closeResearchDetail();
    renderPanelForTab('research');
    saveGame(window.GS);
  } else {
    notify(r.reason, 'error');
  }
}

function _researchUnitsByDomain(domain) {
  const out = [];
  for (const cat of Object.values(RESEARCH_TREE)) {
    for (const line of Object.values(cat.lines)) {
      for (const lvl of line.levels) {
        if (lvl.unitKey && lvl.stats && lvl.stats.domain === domain) out.push(lvl.unitKey);
      }
    }
  }
  return out;
}

// ── Recruit modal ──────────────────────────────────────────
function openRecruitModal() {
  const modal = document.getElementById('recruit-modal');
  const list  = document.getElementById('recruit-list');
  const state = window.GS;

  if (!state.research) state.research = initResearchState();

  const cats = [
    { label: 'TERRESTRE', types: _researchUnitsByDomain('ground') },
    { label: 'AEREO',     types: _researchUnitsByDomain('air') },
    { label: 'NAVAL',     types: _researchUnitsByDomain('naval') },
  ];

  list.innerHTML = cats.map(cat => {
    if (!cat.types.length) return '';
    const rows = cat.types.map(type => {
      const def = UNIT_DEFS[type];
      if (!def) return '';
      const gate = (typeof getUnitRecruitGate === 'function')
        ? getUnitRecruitGate(state, type)
        : { researched: true, structure: true, ok: true, reqStructure: null };

      // Not yet researched → compact locked row
      if (!gate.researched) {
        return `<div class="recruit-item disabled-item" style="cursor:not-allowed;">
          ${_unitImgHtml(type, 56)}
          <div class="recruit-item-info" style="margin-left:10px;flex:1;">
            <div style="font-size:0.85rem">🔒 ${def.label}</div>
            <div style="font-size:0.72rem;color:var(--muted)">Pesquise primeiro</div>
          </div>
        </div>`;
      }

      const afford   = canRecruit(type, state.resources);
      const ok       = gate.ok && afford;
      let reason = '';
      if (!gate.structure) {
        const r = gate.reqStructure;
        reason = r ? `Requer ${r.type} T${r.tier}` : 'Estrutura necessária';
      } else if (!afford) {
        reason = 'Recursos insuficientes';
      }
      return `<div class="recruit-item${ok ? '' : ' disabled-item'}" ${ok ? `onclick="uiRecruit('${type}')"` : 'style="cursor:not-allowed;"'}>
        ${_unitImgHtml(type, 56)}
        <div class="recruit-item-info" style="margin-left:10px;flex:1;">
          <div style="font-size:0.85rem">${def.label} <span style="font-size:0.7rem;color:var(--muted)">(Tier ${def.tier})</span></div>
          <div style="font-size:0.72rem;color:var(--muted)">ATQ:${def.atk} DEF:${def.def} VEL:${def.speed}km/h</div>
          ${reason ? `<div style="font-size:0.68rem;color:var(--red)">${reason}</div>` : ''}
        </div>
        <div class="recruit-item-cost"><span>${def.cost} MON</span> / ${def.manpower} MAN</div>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:12px">
      <div style="font-family:'Cinzel',serif;font-size:0.75rem;color:var(--muted);letter-spacing:1px;margin-bottom:6px">${cat.label}</div>
      ${rows}
    </div>`;
  }).join('');

  modal.classList.add('visible');
}

function closeRecruitModal() {
  document.getElementById('recruit-modal').classList.remove('visible');
}

// ── Country selection modal ────────────────────────────────
async function showCountryModal() {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('country-modal').classList.add('visible');
  await initSelectMap();
  populateCountryList('');
}

function populateCountryList(query) {
  const list = document.getElementById('country-list');
  const names = getAllCountryNames().filter(n => n.toLowerCase().includes(query.toLowerCase()));
  list.innerHTML = names.slice(0, 100).map(name => {
    const base = getCountryBaseData(name);
    const sel  = name === _selectedCountryForModal;
    return `
      <div class="country-list-item ${sel ? 'selected' : ''}" onclick="selectCountryByName('${name.replace(/'/g,"\\'")}')">
        <img class="country-list-flag" src="${getFlagUrl(base.iso2)}" onerror="this.style.display='none'" />
        <span class="country-list-name">${name}</span>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('country-search');
  if (search) search.addEventListener('input', e => populateCountryList(e.target.value));

  const confirmBtn = document.getElementById('btn-confirm-country');
  if (confirmBtn) confirmBtn.addEventListener('click', () => {
    if (_selectedCountryForModal) confirmCountrySelection(_selectedCountryForModal);
  });
});

function selectCountryByName(name) {
  _selectedCountryForModal = name;
  const base = getCountryBaseData(name);

  document.getElementById('country-info-panel').innerHTML = `
    <img class="info-flag" src="${getFlagUrl(base.iso2)}" onerror="this.style.display='none'" />
    <div class="info-name">${name}</div>
    <div class="info-row">Populacao: <span>${fmtNum(base.population)}</span></div>
    <div class="info-row">PIB: <span>$${base.gdp}B</span></div>
    <div class="info-row">Inicio: <span>${fmtNum(Math.round(base.gdp * 10))} MON | ${Math.round(base.population / 100000)} MAN</span></div>
  `;

  document.getElementById('btn-confirm-country').disabled = false;
  populateCountryList(document.getElementById('country-search').value);
}

// ── Notification ───────────────────────────────────────────
function notify(msg, type = 'info') {
  const el = document.getElementById('notification');
  if (!el) return;
  clearTimeout(_notifTimer);
  el.textContent = msg;
  el.className = `show ${type}`;
  _notifTimer = setTimeout(() => el.className = '', 4000);
}

// ── Inline action handlers ─────────────────────────────────
function uiDeclareWar(country) {
  const r = declareWar(window.GS, country);
  if (r.ok) {
    renderCountries(window.GS);
    renderPanelForTab('info');
    saveGame(window.GS);
    notify(`GUERRA declarada contra ${country}!`, 'error');
  } else notify(r.reason, 'error');
}

function uiProposePeace(country) {
  const r = proposePeace(window.GS, country);
  if (r.ok && r.accepted) {
    renderCountries(window.GS);
    renderPanelForTab(_activeTab);
    saveGame(window.GS);
    notify(`Paz firmada com ${country}`, 'info');
  } else if (r.ok) {
    notify(`${country} recusou a paz`, 'error');
  } else notify(r.reason, 'error');
}

function uiProposeAlliance(country) {
  const r = proposeAlliance(window.GS, country);
  if (r.ok && r.accepted) {
    renderCountries(window.GS);
    renderPanelForTab(_activeTab);
    saveGame(window.GS);
    notify(`Alianca com ${country} formada!`, 'info');
  } else if (r.ok) {
    notify(`${country} recusou a alianca`, 'error');
  } else notify(r.reason, 'error');
}

function uiSetEmbargo(country) {
  setEmbargo(window.GS, country);
  renderCountries(window.GS);
  renderPanelForTab(_activeTab);
  saveGame(window.GS);
  notify(`Embargo aplicado a ${country}`, 'info');
}

function uiSelectUnit(unitId) {
  window._selectedUnitId = unitId;
  const unit = (window.GS.units || []).find(u => u.id === unitId);
  if (unit) {
    flyTo(unit.lat, unit.lng, 6);
    notify(`${unit.name} — clique no mapa para mover`, 'info');
  }
  renderPanelForTab('military');
}

function uiDisbandUnit(unitId) {
  const idx = (window.GS.units || []).findIndex(u => u.id === unitId);
  if (idx === -1) return;
  const unit = window.GS.units[idx];
  window.GS.units.splice(idx, 1);
  window.GS.resources.manpower += Math.floor((UNIT_DEFS[unit.type] || {}).manpower || 0);
  renderUnits(window.GS);
  renderPanelForTab('military');
  saveGame(window.GS);
  notify(`${unit.name} dispensado`, 'info');
}

function uiRecruit(type) {
  const state = window.GS;
  if (!canRecruit(type, state.resources)) { notify('Recursos insuficientes', 'error'); return; }

  deductRecruitCost(type, state.resources);
  const unit = createUnit(type, state.player_country, 0, 0, 1);
  closeRecruitModal();
  updateHeader(state);

  enterPlaceUnitMode(
    unit,
    (lat, lng) => {
      unit.lat = lat;
      unit.lng = lng;
      if (!state.units) state.units = [];
      state.units.push(unit);
      state.game_log.unshift(`[Turno ${state.turn}] Recrutado: ${UNIT_DEFS[unit.type].label} — ${unit.name}`);
      renderUnits(state);
      renderPanelForTab('military');
      saveGame(state);
      notify(`${unit.name} posicionado`, 'info');
      flyTo(lat, lng, 6);
    },
    () => {
      const def = UNIT_DEFS[unit.type];
      state.resources.money    += def.cost;
      state.resources.manpower += def.manpower;
      updateHeader(state);
      notify('Recrutamento cancelado — recursos reembolsados', 'info');
    },
    state.player_country
  );
}

function uiStartBuild(type) {
  closeBuildModal();
  enterBuildMode(type);
}

function closeBuildModal() {
  document.getElementById('build-modal').classList.remove('visible');
}

function uiRecruitInProvince() {
  // Abre modal de recrutamento; após escolher a unidade, o placement
  // vai diretamente para a província selecionada no painel
  openRecruitModal();
}

function uiUpgradeMinistry(name) {
  const r = upgradeMinistry(name, window.GS);
  if (r.ok) {
    notify(`${MINISTRY_DEFS[name].label} melhorado!`, 'info');
    updateHeader(window.GS);
    renderPanelForTab('gov');
    saveGame(window.GS);
  } else notify(r.reason, 'error');
}

function uiBuildCityStructure(cityName, structureType) {
  if (!window.GS || !window.GS.cities || !window.GS.cities[cityName]) return;
  const cs = window.GS.cities[cityName];
  const r  = buildCityStructure(cs, structureType);
  if (r.ok) {
    notify(`${r.label} — Tier ${r.nextTier} construído em ${cityName}!`, 'info');
    updateHeader(window.GS);
    renderPanelForTab('info');
    saveGame(window.GS);
  } else {
    notify(r.reason, 'error');
  }
}

function uiToggleCheat() {
  if (!window.GS) return;
  window.GS._cheatMode = !window.GS._cheatMode;
  if (window.GS._cheatMode) uiGiveResources();
  renderPanelForTab('gov');
  notify(`Recursos infinitos: ${window.GS._cheatMode ? 'ATIVO' : 'OFF'}`, 'info');
}

function uiGiveResources() {
  if (!window.GS) return;
  const r = window.GS.resources;
  r.money    = 999999;
  r.oil      = 9999;
  r.food     = 9999;
  r.energy   = 9999;
  r.manpower = 9999;
  updateHeader(window.GS);
  notify('Recursos máximos concedidos!', 'info');
}
