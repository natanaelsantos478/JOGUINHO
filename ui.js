// ═══════════════════════════════════════════════════════════
//  ui.js — HUD, panels, modals, notifications (sprite-driven)
// ═══════════════════════════════════════════════════════════

let _activeTab = 'info';
let _notifTimer = null;
let _panelOpen  = false;
let _recruitCat = 'infantaria';

// ── Theme (dark/light) ─────────────────────────────────────
function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
  localStorage.setItem('wc_theme', theme);
}

function toggleTheme() {
  const current = localStorage.getItem('wc_theme') || 'dark';
  applyTheme(current === 'light' ? 'dark' : 'light');
}

// Apply saved theme as soon as ui.js loads
applyTheme(localStorage.getItem('wc_theme') || 'dark');

// ── Boot UI ────────────────────────────────────────────────
function showGameUI() {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('hud-top').style.display = 'flex';
  document.getElementById('hud-bottom').style.display = 'flex';
  document.getElementById('country-modal').classList.remove('visible');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.getElementById('btn-end-turn').addEventListener('click', doEndTurn);
  _hydrateHudIcons();
  togglePanel(); // open panel by default
}

// Fill the static HUD <img data-sprite="sheet:name"> slots
function _hydrateHudIcons() {
  document.querySelectorAll('img[data-sprite]').forEach(img => {
    const [sheet, name] = img.dataset.sprite.split(':');
    const url = spriteDataUrl(sheet, name, 48, 'square');
    if (url) { img.src = url; img.style.visibility = 'visible'; }
  });
}

function setLoadingMsg(msg) {
  const el = document.getElementById('loading-msg');
  if (el) el.textContent = msg;
}

// ── Panel open/close ───────────────────────────────────────
function togglePanel() {
  const p = document.getElementById('left-panel');
  _panelOpen = !_panelOpen;
  p.classList.toggle('open', _panelOpen);
  if (_panelOpen && window.GS) renderPanelForTab(_activeTab);
}

function showPanel() {
  if (!_panelOpen) togglePanel();
}

// ── Header ─────────────────────────────────────────────────
function updateHeader(state) {
  if (!state) return;
  const base = getCountryBaseData(state.player_country);
  const flagEl = document.getElementById('header-flag');
  if (flagEl) { flagEl.src = getFlagUrl(base.iso2); flagEl.style.display = ''; }
  _setTxt('header-country', state.player_country);
  _setTxt('header-turn',    `TURNO ${state.turn}`);
  _setTxt('res-money',    fmtNum(state.resources.money));
  _setTxt('res-oil',      fmtNum(state.resources.oil));
  _setTxt('res-food',     fmtNum(state.resources.food));
  _setTxt('res-energy',   fmtNum(state.resources.energy));
  _setTxt('res-manpower', fmtNum(state.resources.manpower));
}

function _setTxt(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function fmtNum(n) {
  n = Math.round(n);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

// ── Tab switching ──────────────────────────────────────────
function switchTab(tab) {
  _activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  renderPanelForTab(tab);
  showPanel();
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
    case 'research': el.innerHTML = renderResearchPanel(state); break;
    case 'gov':      el.innerHTML = renderGovPanel(state);      break;
    case 'diplo':    el.innerHTML = renderDiploPanel(state);    break;
    case 'log':      el.innerHTML = renderLogPanel(state);      break;
  }
}

// ── INFO PANEL ─────────────────────────────────────────────
function renderInfoPanel(state) {
  const country  = window._selectedCountry || state.player_country;
  const base     = getCountryBaseData(country);
  const isPlayer = country === state.player_country;
  const rel      = isPlayer ? null : getRelation(state, country);
  const relLabel = isPlayer ? 'SEU PAÍS' : relationLabel(rel);
  const relTag   = rel
    ? `<span class="diplo-tag diplo-${rel}">${relLabel}</span>`
    : `<span style="color:var(--gold);font-size:0.68rem">SEU PAÍS</span>`;

  const diploButtons = !isPlayer ? `
    <div class="panel-section">
      <div class="panel-title">AÇÕES DIPLOMÁTICAS</div>
      <button class="btn btn-danger btn-sm" onclick="uiDeclareWar('${country}')">${eventImg('evt_war_explosion', 16)} DECLARAR GUERRA</button>
      <button class="btn btn-success btn-sm" onclick="uiProposePeace('${country}')">${eventImg('evt_peace_handshake', 16)} PROPOR PAZ</button>
      <button class="btn btn-sm" onclick="uiProposeAlliance('${country}')">${eventImg('evt_alliance_flag', 16)} PROPOR ALIANÇA</button>
      <button class="btn btn-sm" onclick="uiSetEmbargo('${country}')">${eventImg('evt_econ_crisis', 16)} EMBARGO</button>
    </div>` : '';

  const myStats = isPlayer ? `
    <div class="panel-row"><span class="panel-label">Satisfação</span>
      <span class="panel-value ${state.satisfaction < 25 ? 'red' : state.satisfaction > 65 ? 'green' : ''}">${Math.round(state.satisfaction || 50)}%</span>
    </div>
    <div class="sat-bar"><div class="sat-fill" style="width:${Math.round(state.satisfaction || 50)}%;background:${(state.satisfaction||50) < 30 ? 'var(--red)' : (state.satisfaction||50) > 65 ? 'var(--green)' : 'var(--orange)'}"></div></div>
    <div class="panel-row"><span class="panel-label">Em guerra</span><span class="panel-value ${(state.at_war_with||[]).length ? 'red' : ''}">${(state.at_war_with||[]).length} frentes</span></div>
    <div class="panel-row"><span class="panel-label">Aliados</span><span class="panel-value green">${(state.allies||[]).length}</span></div>` : '';

  // Field manual legend — map movement sprites
  const LEGEND = [
    ['map_arrow_move',      'Ordem de movimento'],
    ['map_arrow_curve',     'Manobra de contorno'],
    ['map_path_dotted',     'Rota planejada'],
    ['map_waypoint_diamond','Ponto de destino'],
    ['map_patrol_route',    'Patrulha'],
    ['map_flank_zigzag',    'Flanqueamento'],
    ['map_retreat_dash',    'Recuo tático'],
    ['map_rotate_arrow',    'Reagrupar'],
    ['map_stop_x',          'Manter posição'],
    ['map_select_green',    'Unidade selecionada'],
    ['map_alert_orange',    'Em combate'],
    ['map_flag_blue',       'Capital / QG'],
    ['map_crosshair',       'Posicionamento'],
    ['map_area_effect',     'Zona de efeito'],
    ['map_front_line',      'Linha de frente'],
    ['map_grid_select',     'Seleção de área'],
  ];
  const legendHtml = `
    <div class="panel-section">
      <div class="panel-title">MANUAL DE CAMPO</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 8px">
        ${LEGEND.map(([sp, lbl]) => `
          <div style="display:flex;align-items:center;gap:6px">
            ${spriteImg('sheet_map_movement.png', sp, 18)}
            <span style="font-size:0.6rem;color:var(--muted)">${lbl}</span>
          </div>`).join('')}
      </div>
    </div>`;

  return `
    <div class="panel-section">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:10px;">
        <img src="${getFlagUrl(base.iso2)}" style="width:36px;height:24px;object-fit:cover;border-radius:2px;border:1px solid var(--border);flex-shrink:0" onerror="this.style.display='none'">
        <div>
          <div style="font-family:'Cinzel',serif;font-size:0.88rem;color:var(--gold)">${country}</div>
          <div style="margin-top:3px">${relTag}</div>
        </div>
      </div>
      <div class="panel-row"><span class="panel-label">População</span><span class="panel-value">${fmtNum(base.population)}</span></div>
      <div class="panel-row"><span class="panel-label">PIB</span><span class="panel-value gold">$${base.gdp}B</span></div>
      ${myStats}
    </div>
    ${diploButtons}
    <div class="panel-section">
      <button class="btn btn-sm" onclick="flyToCountry('${country}')">IR PARA ${country.toUpperCase()}</button>
    </div>
    ${isPlayer ? legendHtml : ''}`;
}

// ── MILITARY PANEL ─────────────────────────────────────────
function renderMilitaryPanel(state) {
  const mine  = (state.units || []).filter(u => u.country === state.player_country);
  const enemy = (state.units || []).filter(u => (state.at_war_with || []).includes(u.country));
  const zoom  = _getZoom();

  const modeHint = zoom < ZOOM_TACTICAL
    ? `<div style="font-size:0.64rem;color:var(--muted);margin-bottom:7px;padding:4px 6px;background:#0c1220;border-radius:3px;border:1px solid var(--border)">Vista estratégica — unidades agrupadas em formações. Zoom ${ZOOM_TACTICAL}+ para ver individualmente.</div>`
    : '';

  const unitCards = mine.map(u => {
    const def  = UNIT_DEFS[u.type] || {};
    const sel  = window._selectedUnitId === u.id;
    const hpPct = Math.round(u.hp);
    const enPct = Math.round(u.energy / u.energyCap * 100);
    const sd   = (typeof STANCE_DEFS !== 'undefined' && STANCE_DEFS[u.stance]) || null;
    const wps  = (u.waypoints || []).length;
    const statusLine = `<div style="font-size:0.58rem;color:var(--muted);display:flex;align-items:center;gap:5px;margin-top:1px">
      ${sd ? `${spriteImg('sheet_map_movement.png', sd.icon, 12)} ${sd.label}` : ''}
      ${wps ? `<span style="color:var(--orange)">· ${wps} waypoint${wps > 1 ? 's' : ''}</span>` : ''}
      ${u.inCombat ? `<span style="color:var(--red)">· EM COMBATE</span>` : ''}
    </div>`;
    return `
    <div class="unit-card${sel ? ' selected' : ''}" onclick="openUnitDetail('${u.id}')">
      <div style="display:flex;gap:8px;align-items:flex-start;">
        <div style="flex-shrink:0">${unitImg(u.type, 46)}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
            <span class="unit-name">${u.name}</span>
            <span class="unit-level">Lv${u.level}</span>
          </div>
          <div class="unit-type-label">${def.label || u.type}</div>
          ${statusLine}
          <div class="bar-row"><span class="bar-lbl">HP</span><div class="bar-track"><div class="bar-fill hp" style="width:${hpPct}%"></div></div><span style="font-size:0.58rem;color:var(--muted)">${hpPct}%</span></div>
          <div class="bar-row"><span class="bar-lbl">EN</span><div class="bar-track"><div class="bar-fill energy" style="width:${enPct}%"></div></div><span style="font-size:0.58rem;color:var(--muted)">${enPct}%</span></div>
          <div style="margin-top:5px;display:flex;gap:4px" onclick="event.stopPropagation()">
            <button class="btn btn-sm" style="margin:0;flex:1" onclick="uiSelectUnit('${u.id}')">MOVER</button>
            <button class="btn btn-sm btn-danger" style="margin:0;flex:1" onclick="uiDisbandUnit('${u.id}')">DISPENSAR</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  const enemyList = enemy.length ? `
    <div class="panel-section">
      <div class="panel-title">FORÇAS INIMIGAS (${enemy.length})</div>
      ${enemy.slice(0, 5).map(u => {
        const def = UNIT_DEFS[u.type] || {};
        return `<div class="unit-card" style="padding:6px 8px;display:flex;gap:7px;align-items:center">
          ${unitImg(u.type, 30)}
          <div>
            <div class="unit-name" style="font-size:0.65rem">${u.name}</div>
            <div style="font-size:0.6rem;color:var(--red)">${u.country} · ${def.label}</div>
          </div>
        </div>`;
      }).join('')}
      ${enemy.length > 5 ? `<div style="font-size:0.66rem;color:var(--muted);text-align:center;padding:4px">+${enemy.length-5} mais...</div>` : ''}
    </div>` : '';

  // Arsenal — weapons stockpile (sheet_weapons.png)
  const arsenal = state.arsenal || {};
  const bonus = Math.round(arsenalAtkBonus(state) * 100);
  const arsenalHtml = `
    <div class="panel-section">
      <div class="panel-title">ARSENAL ${bonus ? `<span style="color:var(--green);font-size:0.6rem">+${bonus}% ATK</span>` : ''}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px">
        ${Object.entries(WEAPON_DEFS).map(([k, def]) => {
          const qty = arsenal[k] || 0;
          const ok  = state.resources.money >= def.cost;
          return `<div class="arsenal-item${qty ? ' owned' : ''}${ok ? '' : ' locked'}" onclick="${ok ? `uiBuyWeapon('${k}')` : ''}" title="${def.label} — ${def.desc} — $${def.cost}">
            ${spriteImg('sheet_weapons.png', k, 36)}
            ${qty ? `<span class="arsenal-qty">×${qty}</span>` : `<span class="arsenal-cost">$${fmtNum(def.cost)}</span>`}
          </div>`;
        }).join('')}
      </div>
      <div style="font-size:0.58rem;color:var(--muted);margin-top:5px">Cada arma dá bônus passivo de ataque (até ×3 do mesmo tipo).</div>
    </div>`;

  return `
    <div class="panel-section">
      <div class="panel-title">SUAS FORÇAS (${mine.length})</div>
      ${modeHint}
      <button class="btn btn-success btn-sm" onclick="openRecruitModal()">+ RECRUTAR UNIDADE</button>
      ${mine.length === 0 ? '<p style="color:var(--muted);font-size:0.74rem;margin-top:8px">Nenhuma unidade. Recrute suas primeiras forças.</p>' : unitCards}
    </div>
    ${arsenalHtml}
    ${enemyList}`;
}

// ── BUILD PANEL ─────────────────────────────────────────────
function renderBuildPanel(state) {
  const inProgress = (state.structures || []).filter(s => !s.complete);
  const complete   = (state.structures || []).filter(s =>  s.complete);

  let html = '';
  if (inProgress.length) {
    html += `<div class="panel-section"><div class="panel-title">EM CONSTRUÇÃO</div>`;
    inProgress.forEach(s => {
      const def = STRUCTURE_DEFS[s.type] || { turns: 1 };
      const pct = Math.round((1 - s.turnsLeft / def.turns) * 100);
      html += `<div class="unit-card" style="padding:6px 8px;display:flex;gap:8px;align-items:center">
        ${def.sheet ? spriteImg(def.sheet, s.type, 32) : ''}
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.72rem">${s.label}</span>
            <span style="font-size:0.64rem;color:var(--orange)">${s.turnsLeft} turnos</span>
          </div>
          <div class="bar-track" style="height:4px;margin-top:4px"><div class="bar-fill" style="width:${pct}%;background:var(--orange)"></div></div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  Object.entries(STRUCTURE_CATEGORIES).forEach(([cat, types]) => {
    html += `<div class="panel-section"><div class="panel-title">${cat} (${types.length})</div><div class="build-grid">`;
    types.forEach(type => {
      const def = STRUCTURE_DEFS[type];
      if (!def) return;
      const owned = (state.structures || []).filter(s => s.type === type).length;
      const ok    = state.resources.money >= def.cost;
      html += `<div class="build-card${ok ? '' : ' locked'}" onclick="${ok ? `uiStartBuild('${type}')` : ''}" title="${def.effect}">
        ${spriteImg(def.sheet, type, 44)}
        <div class="build-card-name">${def.label}${owned ? ` <span style='color:var(--gold)'>×${owned}</span>` : ''}</div>
        <div class="build-card-cost" style="color:${ok ? 'var(--gold)' : 'var(--red)'}">$${fmtNum(def.cost)} · ${def.turns}t</div>
      </div>`;
    });
    html += `</div></div>`;
  });

  // Supplies store (sheet_supplies.png) — instant-use consumables
  html += `<div class="panel-section"><div class="panel-title">SUPRIMENTOS (USO IMEDIATO)</div><div class="build-grid">`;
  Object.entries(SUPPLY_DEFS).forEach(([k, def]) => {
    const ok = state.resources.money >= def.cost;
    html += `<div class="build-card${ok ? '' : ' locked'}" onclick="${ok ? `uiUseSupply('${k}')` : ''}" title="${def.desc}">
      ${spriteImg('sheet_supplies.png', k, 44)}
      <div class="build-card-name">${def.label}</div>
      <div class="build-card-cost" style="color:${ok ? 'var(--gold)' : 'var(--red)'}">$${fmtNum(def.cost)}</div>
    </div>`;
  });
  html += `</div></div>`;

  if (complete.length) {
    html += `<div class="panel-section"><div class="panel-title">CONCLUÍDAS (${complete.length})</div>`;
    complete.forEach(s => {
      const def = STRUCTURE_DEFS[s.type] || {};
      html += `<div class="panel-row" style="align-items:center"><span class="panel-label" style="display:flex;align-items:center;gap:6px">${def.sheet ? spriteImg(def.sheet, s.type, 20) : ''} ${s.label}</span><span class="panel-value green" style="font-size:0.6rem">ATIVA</span></div>`;
    });
    html += `</div>`;
  }

  return html || '<p style="color:var(--muted);font-size:0.74rem">Sem construções.</p>';
}

// ── RESEARCH PANEL ─────────────────────────────────────────
function renderResearchPanel(state) {
  if (typeof RESEARCH_TREE === 'undefined') {
    return '<p style="color:var(--muted);font-size:0.74rem">Módulo de pesquisa não carregado.</p>';
  }
  const research = state.research || {};
  let html = '';

  Object.entries(RESEARCH_TREE).forEach(([catKey, cat]) => {
    html += `<div class="panel-section">
      <div class="panel-title" style="display:flex;align-items:center;gap:8px">
        ${spriteImg(cat.sheet, cat.icon, 20)} ${cat.label}
      </div>`;

    Object.entries(cat.lines).forEach(([lineKey, line]) => {
      const catResearch = research[catKey] || {};
      const levelDone   = catResearch[lineKey] || 0;
      const active      = catResearch._active === lineKey;
      html += `<div style="margin-bottom:10px">
        <div style="font-size:0.62rem;color:var(--muted);margin-bottom:4px;letter-spacing:1px">${line.label.toUpperCase()}</div>
        <div style="display:flex;gap:3px;flex-wrap:wrap">`;

      line.levels.forEach((lvl, i) => {
        const done    = i < levelDone;
        const current = i === levelDone;
        const locked  = i > levelDone;
        const isActive = active && current;
        const turnsLeft = isActive ? (catResearch._turnsLeft || 0) : null;

        const bg = done    ? 'rgba(58,154,80,0.2)' :
                   isActive? 'rgba(200,168,75,0.15)' :
                   locked  ? 'rgba(20,24,30,0.5)' : 'rgba(30,40,55,0.6)';
        const border = done ? 'var(--green-dim)' : isActive ? 'var(--gold-dim)' : 'var(--border)';

        html += `<div style="flex:1;min-width:60px;padding:5px 4px;background:${bg};border:1px solid ${border};border-radius:4px;text-align:center;cursor:${current && !isActive ? 'pointer' : 'default'}"
          onclick="${current && !isActive ? `uiStartResearch('${catKey}','${lineKey}')` : ''}"
          title="${lvl.desc || lvl.name}">
          ${lvl.sheet ? spriteImg(lvl.sheet, lvl.sprite || lvl.name, 24) : ''}
          <div style="font-size:0.52rem;color:${done ? 'var(--green)' : isActive ? 'var(--gold)' : locked ? 'var(--muted)' : 'var(--text)'};margin-top:2px;line-height:1.2">${lvl.name}</div>
          ${done    ? '<div style="font-size:0.5rem;color:var(--green)">✓</div>' : ''}
          ${isActive? `<div style="font-size:0.5rem;color:var(--gold)">${turnsLeft}t</div>` : ''}
          ${current && !isActive ? `<div style="font-size:0.5rem;color:var(--gold)">$${lvl.cost}</div>` : ''}
        </div>`;
      });

      html += `</div></div>`;
    });
    html += `</div>`;
  });

  return html || '<p style="color:var(--muted)">Nenhuma pesquisa disponível.</p>';
}

function uiStartResearch(catKey, lineKey) {
  const state = window.GS;
  if (!state) return;
  if (typeof startResearch === 'function') {
    const result = startResearch(catKey, lineKey, state);
    if (result && !result.ok) { notify(result.reason, 'error'); return; }
  } else {
    // Simple fallback: deduct cost and mark active
    const cat  = RESEARCH_TREE[catKey];
    if (!cat) return;
    const line = cat.lines[lineKey];
    if (!line) return;
    const rr = state.research || {};
    if (!rr[catKey]) rr[catKey] = {};
    const lvl = rr[catKey][lineKey] || 0;
    if (lvl >= line.levels.length) return;
    const level = line.levels[lvl];
    if (state.resources.money < level.cost) { notify(`Sem fundos (precisa $${level.cost})`, 'error'); return; }
    state.resources.money -= level.cost;
    rr[catKey]._active    = lineKey;
    rr[catKey]._turnsLeft = level.turns;
    state.research = rr;
    notify(`Pesquisa iniciada: ${level.name} (${level.turns} turnos)`, 'info');
  }
  renderPanelForTab('research');
  saveGame(state);
}

// ── GOV PANEL ──────────────────────────────────────────────
function renderGovPanel(state) {
  const income   = Math.round(incomePerTurn(state.resources, state.ministries, (state.at_war_with||[]).length));
  const expenses = Math.round(expensesPerTurn(state.units || []));
  const balance  = income - expenses;

  let html = `
    <div class="panel-section">
      <div class="panel-title">ECONOMIA</div>
      <div class="panel-row"><span class="panel-label">Renda/turno</span><span class="panel-value green">+${fmtNum(income)}</span></div>
      <div class="panel-row"><span class="panel-label">Despesas/turno</span><span class="panel-value red">-${fmtNum(expenses)}</span></div>
      <div class="panel-row"><span class="panel-label">Saldo</span><span class="panel-value ${balance >= 0 ? 'green' : 'red'}">${balance >= 0 ? '+' : ''}${fmtNum(balance)}</span></div>
      <div class="panel-row"><span class="panel-label">Satisfação</span><span class="panel-value">${Math.round(state.satisfaction || 50)}%</span></div>
    </div>
    <div class="panel-section"><div class="panel-title">MINISTÉRIOS</div>`;

  Object.entries(MINISTRY_DEFS).forEach(([key, def]) => {
    const lvl  = (state.ministries || {})[key] || 1;
    const cost = ministryCost(lvl);
    const stars = '★'.repeat(lvl) + '☆'.repeat(Math.max(0, 4 - lvl));
    const ok    = state.resources.money >= cost && lvl < 4;
    html += `
      <div class="ministry-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-size:0.74rem">${def.label}</span>
          <span class="ministry-stars">${stars}</span>
        </div>
        <div style="font-size:0.6rem;color:var(--muted);margin-bottom:5px">${def.effect}</div>
        <button class="btn btn-sm btn-primary" style="margin:0" ${!ok ? 'disabled' : ''} onclick="uiUpgradeMinistry('${key}')">
          ${lvl >= 4 ? 'MÁXIMO' : `MELHORAR · $${fmtNum(cost)}`}
        </button>
      </div>`;
  });
  html += `</div>`;
  return html;
}

// ── DIPLO PANEL ────────────────────────────────────────────
function renderDiploPanel(state) {
  const groups = { war:[], alliance:[], truce:[], embargo:[] };
  const allNames = typeof getAllCountryNames === 'function' ? getAllCountryNames() : [];

  allNames.forEach(name => {
    if (name === state.player_country) return;
    const rel = getRelation(state, name);
    if (groups[rel]) groups[rel].push(name);
  });

  const cfg = [
    { key:'war',      label:'EM GUERRA', icon:'evt_war_explosion' },
    { key:'alliance', label:'ALIADOS',   icon:'evt_alliance_flag' },
    { key:'truce',    label:'TRÉGUA',    icon:'evt_peace_handshake' },
    { key:'embargo',  label:'EMBARGO',   icon:'evt_econ_crisis' },
  ];

  let html = '';
  cfg.forEach(({ key, label, icon }) => {
    if (!groups[key].length) return;
    html += `<div class="panel-section"><div class="panel-title" style="display:flex;align-items:center;gap:6px">${eventImg(icon, 18)} ${label} (${groups[key].length})</div>`;
    groups[key].forEach(name => {
      const base = getCountryBaseData(name);
      html += `<div class="unit-card" style="padding:6px 8px;display:flex;align-items:center;gap:7px;cursor:pointer" onclick="window._selectedCountry='${name}';switchTab('info')">
        <img src="${getFlagUrl(base.iso2)}" style="width:20px;height:14px;object-fit:cover;border-radius:2px;border:1px solid var(--border);flex-shrink:0" onerror="this.style.display='none'">
        <span style="flex:1;font-size:0.74rem">${name}</span>
        <span class="diplo-tag diplo-${key}" style="font-size:0.55rem">${key.toUpperCase()}</span>
      </div>`;
    });
    html += `</div>`;
  });

  return html || '<div class="panel-section"><p style="color:var(--muted);font-size:0.74rem">Sem relações diplomáticas ativas.</p></div>';
}

// ── LOG PANEL — with event sprite icons ────────────────────
function renderLogPanel(state) {
  const log = state.game_log || [];
  if (!log.length) return '<p style="color:var(--muted);font-size:0.74rem">Nenhum evento registrado.</p>';
  return `<div class="panel-section">${log.slice(0, 60).map(e => {
    const icon = typeof logEventIcon === 'function' ? logEventIcon(e) : null;
    return `<div class="log-entry" style="display:flex;align-items:flex-start;gap:6px">
      ${icon ? `<div style="flex-shrink:0;margin-top:1px">${eventImg(icon, 18)}</div>` : ''}
      <span>${e}</span>
    </div>`;
  }).join('')}</div>`;
}

// ── Formation panel (from map click) ──────────────────────
function showFormationPanel(fm, state) {
  switchTab('military');
  const el = document.getElementById('panel-content');
  if (!el) return;

  const isSelf  = fm.country === state.player_country;
  const isWar   = (state.at_war_with || []).includes(fm.country);
  const borderC = isSelf ? 'var(--gold)' : isWar ? 'var(--red)' : '#4a7aaf';
  const g = fm.byDomain.ground.length;
  const a = fm.byDomain.air.length;
  const n = fm.byDomain.naval.length;
  const comp = [a?`${a} aéreo`:'', g?`${g} terrestre`:'', n?`${n} naval`:''].filter(Boolean).join(' · ');

  el.innerHTML = `
    <div class="panel-section">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:${borderC};flex-shrink:0"></div>
        <span style="font-family:'Cinzel',serif;font-size:0.8rem;color:${borderC}">${fm.country}</span>
      </div>
      <div class="panel-row"><span class="panel-label">Unidades</span><span class="panel-value">${fm.total}</span></div>
      <div class="panel-row"><span class="panel-label">Composição</span><span class="panel-value" style="font-size:0.7rem">${comp}</span></div>
      <div class="panel-row"><span class="panel-label">HP médio</span>
        <span class="panel-value ${fm.avgHp > 60 ? 'green' : fm.avgHp > 30 ? 'orange' : 'red'}">${Math.round(fm.avgHp)}%</span>
      </div>
      ${isSelf ? `<button class="btn btn-primary btn-sm" onclick="flyTo(${fm.lat},${fm.lng},8)">VER INDIVIDUALMENTE →</button>` : ''}
    </div>
    <div class="panel-section">
      <div class="panel-title">UNIDADES (${fm.total})</div>
      ${fm.units.slice(0, 10).map(u => {
        const def = UNIT_DEFS[u.type] || {};
        return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border)">
          ${unitImg(u.type, 26)}
          <div style="flex:1;min-width:0">
            <div style="font-size:0.68rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u.name}</div>
            <div style="font-size:0.58rem;color:var(--muted)">${def.label || u.type}</div>
          </div>
          <span style="font-size:0.6rem;color:${u.hp>60?'var(--green)':u.hp>30?'var(--orange)':'var(--red)'}">${Math.round(u.hp)}%</span>
        </div>`;
      }).join('')}
      ${fm.units.length > 10 ? `<div style="font-size:0.64rem;color:var(--muted);text-align:center;padding:5px">+${fm.units.length-10} mais...</div>` : ''}
    </div>`;
}

function showUnitPanel(unit, state) {
  openUnitDetail(unit.id);
}

// ── Unit detail modal — sprite portrait + order buttons ────
function openUnitDetail(unitId) {
  const state = window.GS;
  if (!state) return;
  const unit = (state.units || []).find(u => u.id === unitId);
  if (!unit) return;
  const def = UNIT_DEFS[unit.type];
  if (!def) return;

  _setTxt('unit-detail-title', unit.name);

  // Big sprite portrait
  const photoEl    = document.getElementById('unit-detail-photo');
  const fallbackEl = document.getElementById('unit-detail-photo-fallback');
  const url = def.sheet ? spriteDataUrl(def.sheet, def.sprite, 360, 'square') : null;
  if (url) {
    photoEl.src = url; photoEl.style.display = 'block';
    fallbackEl.style.display = 'none';
  } else {
    photoEl.style.display = 'none';
    fallbackEl.style.display = 'flex';
    fallbackEl.textContent = def.emoji || '🪖';
  }

  const hpPct = Math.round(unit.hp);
  const enPct = Math.round(unit.energy / unit.energyCap * 100);
  const isOwnUnit = unit.country === state.player_country;

  const stanceDef = (typeof STANCE_DEFS !== 'undefined' && STANCE_DEFS[unit.stance]) || null;
  const routeInfo = (unit.waypoints && unit.waypoints.length)
    ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;padding:4px 8px;background:rgba(224,32,48,0.08);border:1px solid rgba(224,32,48,0.3);border-radius:4px">
        <span style="font-size:0.62rem;color:var(--orange)">Rota: ${unit.waypoints.length} waypoint${unit.waypoints.length > 1 ? 's' : ''} · ${typeof movementBudgetKm === 'function' ? Math.round(movementBudgetKm(unit)) + ' km/turno' : ''}</span>
        <button class="btn btn-danger btn-sm" style="margin:0;padding:2px 8px;font-size:0.56rem" onclick="clearUnitRoute('${unit.id}')">LIMPAR ROTA</button>
      </div>` : '';

  const orderButtons = isOwnUnit && typeof STANCE_DEFS !== 'undefined' ? `
    <div style="margin:10px 0 4px;border-top:1px solid var(--border);padding-top:8px">
      <div class="panel-title">ORDENS TÁTICAS</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">
        ${Object.entries(STANCE_DEFS).map(([stance, sd]) => `
          <button class="order-btn${unit.stance === stance ? ' active' : ''}" title="${sd.desc}"
            onclick="uiGiveOrder('${unit.id}','${stance}')">
            ${spriteImg('sheet_map_movement.png', sd.icon, 24)}
            <span>${sd.label.toUpperCase()}</span>
          </button>`).join('')}
      </div>
      ${stanceDef ? `<div style="font-size:0.6rem;color:var(--muted);margin-top:5px">${stanceDef.desc}</div>` : ''}
      ${routeInfo}
    </div>` : '';

  document.getElementById('unit-detail-stats').innerHTML = `
    <div style="font-family:'Cinzel',serif;font-size:0.74rem;color:var(--muted);margin-bottom:8px">${unit.country} · ${def.label} · ${levelName(unit.level)}</div>
    <div class="bar-row"><span class="bar-lbl">HP</span><div class="bar-track"><div class="bar-fill hp" style="width:${hpPct}%"></div></div><span style="font-size:0.6rem;color:var(--muted)">${hpPct}%</span></div>
    <div class="bar-row"><span class="bar-lbl">EN</span><div class="bar-track"><div class="bar-fill energy" style="width:${enPct}%"></div></div><span style="font-size:0.6rem;color:var(--muted)">${enPct}%</span></div>
    <div style="margin:10px 0 8px;border-top:1px solid var(--border);padding-top:8px">
      <div class="panel-row"><span class="panel-label">Ataque</span><span class="panel-value">${def.atk}</span></div>
      <div class="panel-row"><span class="panel-label">Defesa</span><span class="panel-value">${def.def}</span></div>
      <div class="panel-row"><span class="panel-label">Velocidade</span><span class="panel-value">${def.speed} km/h</span></div>
      <div class="panel-row"><span class="panel-label">Alcance</span><span class="panel-value">${def.range} km</span></div>
      <div class="panel-row"><span class="panel-label">Categoria</span><span class="panel-value gold">${def.catLabel || def.domain}</span></div>
      <div class="panel-row"><span class="panel-label">Esquadrão</span><span class="panel-value">×${unit.squadSize}</span></div>
      <div class="panel-row"><span class="panel-label">XP</span><span class="panel-value">${unit.xp}/${XP_THRESHOLDS[unit.level] || '—'}</span></div>
    </div>
    ${orderButtons}
    ${isOwnUnit ? `
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="btn btn-primary btn-sm" style="margin:0;flex:1" onclick="document.getElementById('unit-detail-modal').classList.remove('visible');uiSelectUnit('${unit.id}')">MOVER NO MAPA</button>
        <button class="btn btn-danger btn-sm" style="margin:0;flex:1" onclick="document.getElementById('unit-detail-modal').classList.remove('visible');uiDisbandUnit('${unit.id}')">DISPENSAR</button>
      </div>` : ''}`;

  document.getElementById('unit-detail-modal').classList.add('visible');
}

// ── Recruit modal — full catalog with category tabs ────────
function openRecruitModal() {
  const state = window.GS;
  if (!state) return;
  _renderRecruitCatTabs();
  _renderRecruitGrid();
  document.getElementById('recruit-modal').classList.add('visible');
}

function _renderRecruitCatTabs() {
  const tabsEl = document.getElementById('recruit-cat-tabs');
  if (!tabsEl) return;
  tabsEl.innerHTML = Object.entries(UNIT_CATEGORIES).map(([key, cat]) => {
    const first = (UNIT_CATALOG_BY_CAT[key] || [])[0];
    return `<button class="recruit-cat-btn${_recruitCat === key ? ' active' : ''}" onclick="switchRecruitCat('${key}')" title="${cat.label}">
      ${first ? spriteImg(cat.sheet, first, 30) : cat.emoji}
    </button>`;
  }).join('');
}

function switchRecruitCat(key) {
  _recruitCat = key;
  _renderRecruitCatTabs();
  _renderRecruitGrid();
}

function _renderRecruitGrid() {
  const state = window.GS;
  const gridEl = document.getElementById('recruit-modal-content');
  if (!gridEl || !state) return;
  const cat   = UNIT_CATEGORIES[_recruitCat];
  const types = UNIT_CATALOG_BY_CAT[_recruitCat] || [];

  gridEl.innerHTML = `
    <div class="recruit-section-label">${cat.label} — ${types.length} unidades</div>
    <div class="recruit-grid">
      ${types.map(type => {
        const def = UNIT_DEFS[type];
        const ok  = canRecruit(type, state.resources);
        return `<div class="recruit-card${ok ? '' : ' locked'}" onclick="${ok ? `uiRecruit('${type}')` : ''}">
          <div class="recruit-card-img">${spriteImg(def.sheet, def.sprite, 72)}</div>
          <div class="recruit-card-name">${def.label}</div>
          <div class="recruit-card-stats">
            <span title="Ataque">⚔ ${def.atk}</span>
            <span title="Defesa">🛡 ${def.def}</span>
            <span title="Velocidade">➤ ${def.speed}</span>
          </div>
          <div class="recruit-card-cost" style="color:${ok ? 'var(--gold)' : 'var(--red)'}">$${fmtNum(def.cost)} · ${def.manpower} MP</div>
        </div>`;
      }).join('')}
    </div>`;
}

function closeRecruitModal() {
  document.getElementById('recruit-modal').classList.remove('visible');
}

// ── Country selection modal ────────────────────────────────
async function showCountryModal() {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('country-modal').classList.add('visible');
  _renderCountryModalHero();
  await initSelectMap();
  populateCountryList('');
}

// Decorative hero strip on the country modal using unit sprites
function _renderCountryModalHero() {
  const el = document.getElementById('country-modal-hero');
  if (!el) return;
  const PICKS = [
    ['sheet_soldiers.png',      'sol_special_forces'],
    ['sheet_tanks_level1.png',  'tank1_m1a2_abrams'],
    ['sheet_air_level1.png',    'air1_f22_raptor'],
    ['sheet_naval_level1.png',  'nav1_gerald_ford_carrier'],
    ['sheet_air_level2.png',    'air2_apache_ah64'],
    ['sheet_vehicles_medium.png','veh2_patriot_launcher'],
  ];
  el.innerHTML = PICKS.map(([sheet, name]) =>
    `<div class="hero-chip">${spriteImg(sheet, name, 52)}</div>`
  ).join('');
}

function populateCountryList(query) {
  const names = typeof getAllCountryNames === 'function' ? getAllCountryNames() : [];
  const q     = (query || '').toLowerCase();
  const list  = document.getElementById('country-list');
  if (!list) return;
  const filtered = q ? names.filter(n => n.toLowerCase().includes(q)) : names;
  list.innerHTML = filtered.map(n =>
    `<div class="country-list-item${window._pendingCountry === n ? ' selected' : ''}" onclick="selectCountryByName('${n}')">${n}</div>`
  ).join('');
}

function filterCountryList(q) { populateCountryList(q); }

function selectCountryByName(name) {
  if (!name) return;
  window._pendingCountry = name;
  document.querySelectorAll('.country-list-item').forEach(el => {
    el.classList.toggle('selected', el.textContent === name);
  });
  const base = getCountryBaseData(name);
  const col  = document.getElementById('country-selected-info');
  if (col) {
    col.innerHTML = `
      <img src="${getFlagUrl(base.iso2)}" style="width:46px;height:30px;object-fit:cover;border-radius:3px;border:1px solid var(--border);display:block;margin:0 auto 10px" onerror="this.style.display='none'">
      <div style="font-family:'Cinzel',serif;font-size:0.84rem;color:var(--gold);text-align:center;margin-bottom:8px">${name}</div>
      <div class="panel-row"><span class="panel-label">PIB</span><span class="panel-value">$${base.gdp}B</span></div>
      <div class="panel-row"><span class="panel-label">Pop.</span><span class="panel-value">${fmtNum(base.population)}</span></div>`;
  }
  if (typeof flyToCountry === 'function') flyToCountry(name);
}

// ── Notification — with event icon support ─────────────────
function notify(msg, type) {
  const el = document.getElementById('notify');
  if (!el) return;
  const icon = typeof logEventIcon === 'function' ? logEventIcon(msg) : null;
  el.innerHTML = icon ? `<span style="display:inline-flex;vertical-align:middle;margin-right:6px">${eventImg(icon, 20)}</span>${msg}` : msg;
  el.className   = `visible ${type || 'info'}`;
  clearTimeout(_notifTimer);
  _notifTimer = setTimeout(() => { el.className = ''; }, 3800);
}

// ── Diplomatic actions ─────────────────────────────────────
function uiDeclareWar(country) {
  if (!window.GS) return;
  const r = declareWar(window.GS, country);
  if (r.ok) { renderAll(); saveGame(window.GS); notify(`Guerra declarada contra ${country}!`, 'error'); }
  else notify(r.reason, 'error');
}
function uiProposePeace(country) {
  if (!window.GS) return;
  const r = proposePeace(window.GS, country);
  if (r.ok) { renderAll(); saveGame(window.GS); notify(r.accepted ? `Paz com ${country}` : `${country} recusou`, r.accepted ? 'success' : 'error'); }
}
function uiProposeAlliance(country) {
  if (!window.GS) return;
  const r = proposeAlliance(window.GS, country);
  if (r.ok) { renderAll(); saveGame(window.GS); notify(r.accepted ? `Aliança com ${country}!` : `${country} recusou`, r.accepted ? 'success' : 'error'); }
  else notify(r.reason, 'error');
}
function uiSetEmbargo(country) {
  if (!window.GS) return;
  setEmbargo(window.GS, country);
  renderAll(); saveGame(window.GS); notify(`Embargo a ${country}`, 'info');
}

// ── Unit actions ───────────────────────────────────────────
function uiSelectUnit(unitId) {
  if (!window.GS) return;
  const unit = (window.GS.units || []).find(u => u.id === unitId);
  if (!unit) return;
  window._selectedUnitId = unitId;
  notify(`${unit.name} — clique no mapa para mover`, 'info');
  _setTxt('selection-info', `${unit.name} — clique no mapa para mover`);
  flyTo(unit.lat, unit.lng, Math.max(8, _getZoom()));
}
function uiDisbandUnit(unitId) {
  if (!window.GS || !confirm('Dispensar esta unidade?')) return;
  window.GS.units = (window.GS.units || []).filter(u => u.id !== unitId);
  renderAll(); saveGame(window.GS); notify('Unidade dispensada.', 'info');
}
function uiGiveOrder(unitId, stance) {
  if (!window.GS) return;
  const unit = (window.GS.units || []).find(u => u.id === unitId);
  if (!unit) return;
  unit.stance = stance;
  const sd = (typeof STANCE_DEFS !== 'undefined') ? STANCE_DEFS[stance] : null;
  // Stationary stances cancel the route; mobile stances need waypoints to act
  if (sd && sd.speedMult === 0) {
    unit.waypoints = [];
    drawAllPendingRoutes();
  } else if (!unit.waypoints || !unit.waypoints.length) {
    document.getElementById('unit-detail-modal').classList.remove('visible');
    uiSelectUnit(unitId);
    notify(`${unit.name} — ${sd ? sd.label : stance}: clique no mapa para traçar a rota`, 'info');
    saveGame(window.GS);
    return;
  }
  saveGame(window.GS);
  openUnitDetail(unitId); // refresh order buttons
  notify(`${unit.name} — ${sd ? sd.label : stance}`, 'info');
}

// ── Build / recruit / arsenal / supplies ───────────────────
function uiStartBuild(structType) {
  if (typeof enterBuildMode === 'function') enterBuildMode(structType);
}

function uiRecruit(unitType) {
  if (!window.GS) return;
  const state = window.GS;
  if (!canRecruit(unitType, state.resources)) { notify('Recursos insuficientes.', 'error'); return; }
  deductRecruitCost(unitType, state.resources);
  closeRecruitModal();

  const coords = _getCapitalCoords(state.player_country);
  const unit   = createUnit(unitType, state.player_country, coords.lat, coords.lng);
  state.units.push(unit);

  if (typeof enterPlaceMode === 'function') {
    enterPlaceMode(unit.name, (lat, lng) => {
      unit.lat = lat; unit.lng = lng;
      renderAll(); saveGame(state);
      notify(`${unit.name} posicionado!`, 'success');
    });
    flyTo(coords.lat, coords.lng, Math.max(5, _getZoom()));
  } else {
    renderAll(); saveGame(state);
    notify(`${unit.name} recrutado!`, 'success');
  }
}

function uiBuyWeapon(type) {
  if (!window.GS) return;
  const r = buyWeapon(type, window.GS);
  if (r.ok) { renderAll(); saveGame(window.GS); notify(`${WEAPON_DEFS[type].label} adicionado ao arsenal!`, 'success'); }
  else notify(r.reason, 'error');
}

function uiUseSupply(type) {
  if (!window.GS) return;
  const r = useSupply(type, window.GS);
  if (r.ok) { renderAll(); saveGame(window.GS); notify(r.msg, 'success'); }
  else notify(r.reason, 'error');
}

function uiUpgradeMinistry(key) {
  if (!window.GS) return;
  const r = upgradeMinistry(key, window.GS);
  if (r.ok) { renderAll(); saveGame(window.GS); notify(`${MINISTRY_DEFS[key].label} melhorado!`, 'success'); }
  else notify(r.reason, 'error');
}

function uiRecruitInProvince() { openRecruitModal(); }

// ── Capital coords ─────────────────────────────────────────
const CAPITAL_COORDS = {
  'Brazil':          { lat: -15.77, lng: -47.93 },
  'United States':   { lat:  38.89, lng: -77.03 },
  'China':           { lat:  39.92, lng: 116.38 },
  'Russia':          { lat:  55.75, lng:  37.62 },
  'Germany':         { lat:  52.52, lng:  13.40 },
  'France':          { lat:  48.85, lng:   2.35 },
  'United Kingdom':  { lat:  51.51, lng:  -0.13 },
  'Japan':           { lat:  35.68, lng: 139.69 },
  'India':           { lat:  28.61, lng:  77.21 },
  'Canada':          { lat:  45.42, lng: -75.69 },
  'Australia':       { lat: -35.30, lng: 149.12 },
  'South Korea':     { lat:  37.57, lng: 126.98 },
  'Argentina':       { lat: -34.60, lng: -58.38 },
  'Mexico':          { lat:  19.43, lng: -99.13 },
  'Turkey':          { lat:  39.93, lng:  32.87 },
  'Saudi Arabia':    { lat:  24.69, lng:  46.72 },
  'Italy':           { lat:  41.90, lng:  12.49 },
  'Spain':           { lat:  40.42, lng:  -3.70 },
  'Iran':            { lat:  35.69, lng:  51.42 },
  'North Korea':     { lat:  39.02, lng: 125.75 },
};
function _getCapitalCoords(country) {
  return CAPITAL_COORDS[country] || { lat: 20, lng: 0 };
}
function _getZoom() {
  const m = (typeof getMap === 'function') ? getMap() : null;
  return m ? m.getZoom() : 3;
}
