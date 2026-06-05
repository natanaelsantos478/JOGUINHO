// ═══════════════════════════════════════════════════════════
//  ui.js — Header, panels, modals, notifications
// ═══════════════════════════════════════════════════════════

let _activeTab = 'info';
let _selectedCountryForModal = null;
let _notifTimer = null;

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
    case 'build':    el.innerHTML = renderBuildPanel(state);    break;
    case 'gov':      el.innerHTML = renderGovPanel(state);      break;
    case 'diplo':    el.innerHTML = renderDiploPanel(state);    break;
    case 'log':      el.innerHTML = renderLogPanel(state);      break;
  }
  attachPanelEvents(tab, state);
}

// ── INFO PANEL ─────────────────────────────────────────────
function renderInfoPanel(state) {
  const country  = window._selectedCountry  || state.player_country;
  const province = window._selectedProvince || null;
  const base     = getCountryBaseData(country);
  const isPlayer = country === state.player_country;
  const rel      = isPlayer ? 'Seu pais' : relationLabel(getRelation(state, country));

  const provinceSection = province ? `
    <div class="panel-section">
      <div class="panel-title">PROVINCIA / ESTADO</div>
      <div style="font-family:'Cinzel',serif;font-size:0.95rem;color:var(--gold);margin-bottom:6px;">${province}</div>
      <div style="font-size:0.8rem;color:var(--muted);margin-bottom:8px;">${country}</div>
      ${isPlayer ? `<button class="btn-primary btn-success" onclick="uiRecruitInProvince()">+ RECRUTAR AQUI</button>` : ''}
    </div>
  ` : '';

  return `
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
    const hpPct = Math.round(u.hp);
    const enPct = Math.round(u.energy / u.energyCap * 100);
    const xpPct = u.level < 5 ? Math.round((u.xp / (XP_THRESHOLDS[u.level] || 1)) * 100) : 100;
    return `
      <div class="unit-card ${selected ? 'selected' : ''}" onclick="uiSelectUnit('${u.id}')">
        <div class="unit-card-header" style="gap:10px;align-items:flex-start;">
          ${_unitImgHtml(u.type, 44)}
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
              <span class="unit-name" style="font-size:0.78rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${u.name}</span>
              <span class="unit-level">Lv${u.level}</span>
            </div>
            <div style="font-size:0.7rem;color:var(--muted);margin-bottom:5px">${def ? def.label : u.type} — ${levelName(u.level)}</div>
            <div class="unit-bars">
              <div class="bar-row"><span class="bar-label">HP</span><div class="bar-track"><div class="bar-fill hp" style="width:${hpPct}%"></div></div><span style="font-size:0.68rem;color:var(--muted)">${hpPct}%</span></div>
              <div class="bar-row"><span class="bar-label">EN</span><div class="bar-track"><div class="bar-fill energy" style="width:${enPct}%"></div></div><span style="font-size:0.68rem;color:var(--muted)">${enPct}%</span></div>
              <div class="bar-row"><span class="bar-label">XP</span><div class="bar-track"><div class="bar-fill xp" style="width:${xpPct}%"></div></div><span style="font-size:0.68rem;color:var(--muted)">${u.xp}xp</span></div>
            </div>
          </div>
        </div>
        <div style="margin-top:8px;display:flex;gap:6px;">
          <button class="btn-primary" style="flex:1;padding:4px 6px;font-size:0.7rem" onclick="uiSelectUnit('${u.id}');event.stopPropagation()">MOVER</button>
          <button class="btn-primary btn-danger" style="flex:1;padding:4px 6px;font-size:0.7rem" onclick="uiDisbandUnit('${u.id}');event.stopPropagation()">DISPENSAR</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="panel-section">
      <div class="panel-title">SUAS FORCAS (${playerUnits.length})</div>
      <button class="btn-primary btn-success" onclick="openRecruitModal()">+ RECRUTAR UNIDADE</button>
      ${playerUnits.length === 0 ? '<p style="color:var(--muted);font-size:0.82rem;margin-top:8px">Sem unidades. Recrute sua primeira forca.</p>' : unitCards}
    </div>
    ${enemyUnits.length > 0 ? `
    <div class="panel-section">
      <div class="panel-title">FORCAS INIMIGAS VISIVEIS (${enemyUnits.length})</div>
      ${enemyUnits.slice(0, 8).map(u => {
        const def = UNIT_DEFS[u.type];
        return `<div class="unit-card"><div class="unit-card-header"><span class="unit-name">${u.name}</span><span class="unit-level" style="color:var(--red)">${u.country}</span></div><div style="font-size:0.72rem;color:var(--muted)">${def ? def.label : u.type} — HP ${Math.round(u.hp)}%</div></div>`;
      }).join('')}
    </div>
    ` : ''}
  `;
}

// ── BUILD PANEL ────────────────────────────────────────────
function renderBuildPanel(state) {
  const inProgress = (state.structures || []).filter(s => !s.complete);
  const complete   = (state.structures || []).filter(s => s.complete);

  const cats = [
    { label: 'MILITARES', keys: ['mil_barracks','mil_airbase','mil_naval_base','mil_radar_station','mil_missile_silo','mil_nuclear_bunker'] },
    { label: 'SUPORTE',   keys: ['sup_fob_supply','sup_logistics_hub','mil_field_hospital'] },
    { label: 'CIVIS',     keys: ['civ_hospital','civ_power_plant','civ_seaport','civ_airport'] },
  ];

  const buildButtons = cats.map(cat => `
    <div class="panel-title" style="margin-top:12px">${cat.label}</div>
    ${cat.keys.map(key => {
      const def = STRUCTURE_DEFS[key];
      const canAfford = state.resources.money >= def.cost;
      return `<button class="btn-primary" ${canAfford ? '' : 'disabled'} onclick="uiStartBuild('${key}')" style="text-align:left;font-size:0.75rem;padding:6px 10px;margin:2px 0">
        ${def.label} <span style="color:var(--muted);float:right">${def.cost} MON / ${def.turns}t</span>
      </button>`;
    }).join('')}
  `).join('');

  return `
    <div class="panel-section">
      <div class="panel-title">CONSTRUIR</div>
      <p style="color:var(--muted);font-size:0.78rem;margin-bottom:8px">Clique para posicionar no mapa</p>
      ${buildButtons}
    </div>

    ${inProgress.length > 0 ? `
    <div class="panel-section">
      <div class="panel-title">EM ANDAMENTO (${inProgress.length})</div>
      ${inProgress.map(s => `
        <div class="structure-card">
          <div class="structure-header">
            <span class="structure-name">${s.label}</span>
            <span class="structure-status">${s.turnsLeft} turno${s.turnsLeft > 1 ? 's' : ''}</span>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${complete.length > 0 ? `
    <div class="panel-section">
      <div class="panel-title">CONCLUIDAS (${complete.length})</div>
      ${complete.map(s => `
        <div class="structure-card">
          <div class="structure-header">
            <span class="structure-name">${s.label}</span>
            <span class="structure-status" style="color:var(--green)">OK</span>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
  `;
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
      <button class="btn-primary btn-danger" onclick="resetGame()" style="margin-top:8px">NOVA CAMPANHA</button>
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

// ── Recruit modal ──────────────────────────────────────────
function openRecruitModal() {
  const modal = document.getElementById('recruit-modal');
  const list  = document.getElementById('recruit-list');
  const state = window.GS;

  const cats = [
    { label: 'TERRESTRE', types: ['infantry','motorized','veh_light','veh_medium','tank_elite','artillery'] },
    { label: 'AEREO',     types: ['air3_drone','air2_fighter','air2_helicopter','air1_stealth','air_transport'] },
    { label: 'NAVAL',     types: ['nav3_patrol','nav2_frigate','nav1_destroyer','nav1_carrier'] },
  ];

  list.innerHTML = cats.map(cat => `
    <div style="margin-bottom:12px">
      <div style="font-family:'Cinzel',serif;font-size:0.75rem;color:var(--muted);letter-spacing:1px;margin-bottom:6px">${cat.label}</div>
      ${cat.types.map(type => {
        const def = UNIT_DEFS[type];
        const ok  = canRecruit(type, state.resources);
        return `
          <div class="recruit-item${ok ? '' : ' disabled-item'}" onclick="${ok ? `uiRecruit('${type}')` : ''}">
            ${_unitImgHtml(type, 40)}
            <div class="recruit-item-info" style="margin-left:10px;flex:1;">
              <div style="font-size:0.85rem">${def.label} <span style="font-size:0.7rem;color:var(--muted)">(Tier ${def.tier})</span></div>
              <div style="font-size:0.72rem;color:var(--muted)">ATQ:${def.atk} DEF:${def.def} VEL:${def.speed}km/h</div>
            </div>
            <div class="recruit-item-cost">${ok ? '' : 'X '}<span>${def.cost} MON</span> / ${def.manpower} MAN</div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

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
      unit.lat = lat + (Math.random() - 0.5) * 0.5;
      unit.lng = lng + (Math.random() - 0.5) * 0.5;
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
