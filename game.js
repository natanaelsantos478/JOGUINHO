// ═══════════════════════════════════════════════════════════
//  game.js — Main orchestrator, GameState, init, end turn
// ═══════════════════════════════════════════════════════════

window.GS = null;

// ── Bootstrap ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  setLoadingMsg('Conectando...');
  initSupabase();

  setLoadingMsg('Carregando sprites...');
  await initSprites();
  buildUnitCatalog();

  document.getElementById('loading-screen').style.display = 'none';
  showLoginScreen();
});

// ── Login / world selection flow ───────────────────────────
function showLoginScreen() {
  document.getElementById('worlds-screen').classList.remove('visible');
  document.getElementById('create-world-modal').classList.remove('visible');
  document.getElementById('login-screen').classList.add('visible');
  const saved = localStorage.getItem('wc_player_name') || '';
  document.getElementById('login-name-input').value = saved;
}

function _getPlayerName() {
  const name = (document.getElementById('login-name-input').value || '').trim();
  if (!name) { notify('Digite seu nome de comandante', 'error'); return null; }
  localStorage.setItem('wc_player_name', name);
  return name;
}

function loginCreateWorld() {
  const name = _getPlayerName();
  if (!name) return;
  window._pendingPlayerName = name;
  document.getElementById('world-name-input').value = `Mundo de ${name}`;
  document.getElementById('create-world-modal').classList.add('visible');
}

function closeCreateWorldModal() {
  document.getElementById('create-world-modal').classList.remove('visible');
}

async function submitCreateWorld() {
  const worldName = (document.getElementById('world-name-input').value || '').trim();
  if (!worldName) { notify('Digite um nome para o mundo', 'error'); return; }
  const playerName = window._pendingPlayerName || localStorage.getItem('wc_player_name') || 'Jogador';
  document.getElementById('create-world-modal').classList.remove('visible');
  document.getElementById('login-screen').classList.remove('visible');
  document.getElementById('loading-screen').style.display = 'flex';
  setLoadingMsg('Criando mundo...');
  const world = await createWorld(worldName, playerName);
  if (!world) {
    document.getElementById('loading-screen').style.display = 'none';
    showLoginScreen();
    alert('Erro ao criar mundo. Verifique a conexão e tente novamente.');
    return;
  }
  await _startGame(world, playerName);
}

async function loginBrowseWorlds() {
  const name = _getPlayerName();
  if (!name) return;
  window._pendingPlayerName = name;
  document.getElementById('login-screen').classList.remove('visible');
  document.getElementById('worlds-screen').classList.add('visible');
  _renderWorldsList();
}

async function _renderWorldsList() {
  const list = document.getElementById('worlds-list');
  list.innerHTML = '<p class="worlds-empty">Carregando...</p>';
  const worlds = await loadWorlds();
  if (!worlds.length) {
    list.innerHTML = '<p class="worlds-empty">Nenhum mundo criado ainda. Seja o primeiro!</p>';
    return;
  }
  list.innerHTML = worlds.map(w => {
    const age = _worldAge(w.created_at);
    const safeName = (w.name || '').replace(/"/g, '&quot;');
    return `
      <div class="world-card" onclick="enterWorld('${w.id}','${safeName}')">
        <div class="world-card-info">
          <div class="world-card-name">${w.name || 'Mundo'}</div>
          <div class="world-card-meta">Criado por ${w.host_name || 'Desconhecido'}</div>
        </div>
        <div class="world-card-age">${age.value}<span>${age.unit}</span></div>
      </div>`;
  }).join('');
  clearInterval(window._worldCounterInterval);
  window._worldCounterInterval = setInterval(_renderWorldsList, 60000);
}

function _worldAge(createdAt) {
  const ms    = Date.now() - new Date(createdAt).getTime();
  const days  = Math.floor(ms / 86400000);
  const hours = Math.floor(ms / 3600000);
  const mins  = Math.floor(ms / 60000);
  if (days  >= 1) return { value: days,  unit: days  === 1 ? 'dia'  : 'dias'  };
  if (hours >= 1) return { value: hours, unit: hours === 1 ? 'hora' : 'horas' };
  return               { value: Math.max(1, mins), unit: 'min' };
}

async function enterWorld(worldId, worldName) {
  clearInterval(window._worldCounterInterval);
  const playerName = window._pendingPlayerName || localStorage.getItem('wc_player_name') || 'Jogador';
  document.getElementById('worlds-screen').classList.remove('visible');
  document.getElementById('loading-screen').style.display = 'flex';
  setLoadingMsg('Entrando no mundo...');
  await _startGame({ id: worldId, name: worldName }, playerName);
}

async function _startGame(world, playerName) {
  setCurrentSave(world.id, playerName);
  setLoadingMsg('Verificando save...');
  const save = await loadGame();
  if (save && save.player_country) {
    setLoadingMsg('Restaurando partida...');
    window.GS = buildStateFromSave(save, world, playerName);
    setLoadingMsg('Carregando mapa...');
    const ok = await initMap(window.GS.map_view);
    if (!ok) return;
    if (typeof initPlayerCities === 'function') initPlayerCities(window.GS.player_country);
    showGameUI();
    renderAll();
    notify(`${world.name} — Turno ${window.GS.turn}`, 'info');
  } else {
    setLoadingMsg('Carregando mapa de países...');
    const res = await fetch('countries.geojson').catch(() => null);
    if (!res || !res.ok) {
      document.getElementById('loading-screen').style.display = 'none';
      document.getElementById('geojson-missing').style.display = 'flex';
      return;
    }
    window._pendingWorld = world;
    window._pendingPlayerName = playerName;
    await showCountryModal();
  }
}

// ── Build state from Supabase row ──────────────────────────
function buildStateFromSave(row, world, playerName) {
  const res = row.resources || {};
  return {
    player_country: row.player_country,
    world_id:       (world && world.id)   || row.world_id   || null,
    world_name:     (world && world.name) || null,
    player_name:    playerName || row.player_name || null,
    turn:           row.turn || 1,
    resources: {
      money:    res.money    || 0,
      oil:      res.oil      || 0,
      food:     res.food     || 0,
      energy:   res.energy   || 0,
      manpower: res.manpower || 0,
    },
    units:        row.units      || [],
    structures:   res.structures || row.structures || [],
    research:     (res.research && Object.keys(res.research).length) ? res.research : initResearchState(),
    cities:       row.cities     || {},
    diplomacy:    row.diplomacy  || {},
    at_war_with:  row.at_war_with || [],
    allies:       row.allies      || [],
    ministries:   res.ministries  || initMinistries(),
    arsenal:      res.arsenal     || {},
    satisfaction: res.satisfaction != null ? res.satisfaction : 50,
    map_view:     row.map_view   || null,
    game_log:     row.game_log   || [],
  };
}

// ── New game init ──────────────────────────────────────────
async function confirmCountrySelection(countryName) {
  document.getElementById('country-modal').classList.remove('visible');
  document.getElementById('loading-screen').style.display = 'flex';
  setLoadingMsg('Iniciando campanha...');

  const world      = window._pendingWorld      || { id: null, name: 'Partida Local' };
  const playerName = window._pendingPlayerName || localStorage.getItem('wc_player_name') || 'Jogador';
  const resources  = initResources(countryName);

  window.GS = {
    player_country: countryName,
    world_id:       world.id,
    world_name:     world.name,
    player_name:    playerName,
    turn:           1,
    resources,
    units:          [],
    structures:     [],
    research:       initResearchState(),
    cities:         {},
    diplomacy:      {},
    at_war_with:    [],
    allies:         [],
    ministries:     initMinistries(),
    arsenal:        {},
    satisfaction:   50,
    map_view:       null,
    game_log:       [`[Turno 1] Campanha iniciada como ${countryName}`],
  };

  setLoadingMsg('Carregando mapa...');
  const ok = await initMap(null);
  if (!ok) return;

  if (typeof initPlayerCities === 'function') initPlayerCities(countryName);

  showGameUI();
  renderAll();
  flyToCountry(countryName);
  saveGame(window.GS);
  notify(`Bem-vindo, ${playerName}! Lider de ${countryName}`, 'info');
}

// ── Render everything ──────────────────────────────────────
function renderAll() {
  const state = window.GS;
  updateHeader(state);
  renderCountries(state);
  renderUnits(state);
  renderStructures(state);
  renderPanelForTab(_activeTab);
  // Refresh city markers so structure dots stay up to date
  if (typeof updatePoisMarkers === 'function' && typeof getMap === 'function' && getMap()) {
    updatePoisMarkers(getMap().getZoom());
  }
}

// ── End turn ───────────────────────────────────────────────
async function doEndTurn() {
  if (!window.GS) return;
  const btn = document.getElementById('btn-end-turn');
  btn.disabled = true;
  btn.textContent = 'PROCESSANDO...';

  const state  = window.GS;
  const events = processTurn(state);

  const allNames = getAllCountryNames();
  let aiEvents = [];
  try {
    aiEvents = await aiTurnsWithGemini(state, allNames);
  } catch (e) {
    console.warn('aiTurnsWithGemini falhou, usando fallback:', e);
    aiEvents = aiTurns(state, allNames);
  }
  aiEvents.forEach(e => state.game_log.unshift(e));

  if ((state.satisfaction || 50) < 10) {
    notify('Golpe de Estado! A satisfacao chegou a 0. Voce perdeu!', 'error');
  }

  renderAll();
  if (events.length > 0 || aiEvents.length > 0) {
    notify([...events, ...aiEvents][0], 'info');
  }
  saveGame(state);

  btn.disabled = false;
  btn.textContent = 'FIM DE TURNO';
}

// ── Menu principal (volta sem apagar save) ─────────────────
function goToMainMenu() {
  document.getElementById('header').style.display    = 'none';
  document.getElementById('side-panel').style.display= 'none';
  window._selectedUnitId   = null;
  window._selectedCountry  = null;
  window._selectedProvince = null;
  window._selectedCity     = null;
  showLoginScreen();
}

// ── Reset / new game ───────────────────────────────────────
async function resetGame() {
  if (!confirm('Apagar o save e comecar uma nova campanha?')) return;
  await deleteSave();
  window.GS = null;
  location.reload();
}

window.goToMainMenu       = goToMainMenu;
window.resetGame          = resetGame;
window.renderAll          = renderAll;
window.showLoginScreen    = showLoginScreen;
window.loginCreateWorld   = loginCreateWorld;
window.loginBrowseWorlds  = loginBrowseWorlds;
window.submitCreateWorld  = submitCreateWorld;
window.closeCreateWorldModal = closeCreateWorldModal;
window.enterWorld         = enterWorld;
