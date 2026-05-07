// ═══════════════════════════════════════════════════════════
//  game.js — Main orchestrator, GameState, init, end turn
// ═══════════════════════════════════════════════════════════

window.GS = null;

// ── Bootstrap ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  setLoadingMsg('Conectando ao Supabase...');
  initSupabase();

  setLoadingMsg('Carregando sprites...');
  await initSprites();

  setLoadingMsg('Verificando save...');
  const save = await loadGame();

  if (save && save.player_country) {
    setLoadingMsg('Restaurando jogo salvo...');
    window.GS = buildStateFromSave(save);

    setLoadingMsg('Carregando mapa...');
    const ok = await initMap(window.GS.map_view);
    if (!ok) return;

    showGameUI();
    renderAll();
    notify(`Jogo carregado — Turno ${window.GS.turn}`, 'info');
  } else {
    setLoadingMsg('Carregando mapa de paises...');
    const res = await fetch('countries.geojson').catch(() => null);
    if (!res || !res.ok) {
      document.getElementById('loading-screen').style.display = 'none';
      document.getElementById('geojson-missing').style.display = 'flex';
      return;
    }
    await showCountryModal();
  }
});

// ── Build state from Supabase row ──────────────────────────
function buildStateFromSave(row) {
  const res = row.resources || {};
  const baseResources = {
    money:    res.money    || 0,
    oil:      res.oil      || 0,
    food:     res.food     || 0,
    energy:   res.energy   || 0,
    manpower: res.manpower || 0,
  };
  return {
    player_country: row.player_country,
    turn:           row.turn || 1,
    resources:      baseResources,
    units:          row.units    || [],
    structures:     res.structures || [],
    diplomacy:      row.diplomacy  || {},
    at_war_with:    row.at_war_with || [],
    allies:         row.allies      || [],
    ministries:     res.ministries  || initMinistries(),
    satisfaction:   res.satisfaction != null ? res.satisfaction : 50,
    map_view:       row.map_view   || null,
    game_log:       row.game_log   || [],
  };
}

// ── New game init ──────────────────────────────────────────
async function confirmCountrySelection(countryName) {
  document.getElementById('country-modal').classList.remove('visible');
  document.getElementById('loading-screen').style.display = 'flex';
  setLoadingMsg('Iniciando nova campanha...');

  const resources = initResources(countryName);

  window.GS = {
    player_country: countryName,
    turn:           1,
    resources,
    units:          [],
    structures:     [],
    diplomacy:      {},
    at_war_with:    [],
    allies:         [],
    ministries:     initMinistries(),
    satisfaction:   50,
    map_view:       null,
    game_log:       [`[Turno 1] Campanha iniciada como ${countryName}`],
  };

  setLoadingMsg('Carregando mapa...');
  const ok = await initMap(null);
  if (!ok) return;

  showGameUI();
  renderAll();
  flyToCountry(countryName);

  saveGame(window.GS);
  notify(`Bem-vindo, Lider de ${countryName}!`, 'info');
}

// ── Render everything ──────────────────────────────────────
function renderAll() {
  const state = window.GS;
  updateHeader(state);
  renderCountries(state);
  renderUnits(state);
  renderStructures(state);
  renderPanelForTab(_activeTab);
}

// ── End turn ───────────────────────────────────────────────
async function doEndTurn() {
  if (!window.GS) return;
  const btn = document.getElementById('btn-end-turn');
  btn.disabled = true;
  btn.textContent = 'PROCESSANDO...';

  const state = window.GS;

  // 1. Player turn
  const events = processTurn(state);

  // 2. AI turns (Gemini + simples)
  const allNames = getAllCountryNames();
  let aiEvents = [];
  try {
    aiEvents = await aiTurnsWithGemini(state, allNames);
  } catch (e) {
    console.warn('aiTurnsWithGemini falhou, usando fallback:', e);
    aiEvents = aiTurns(state, allNames);
  }
  aiEvents.forEach(e => state.game_log.unshift(e));

  // 3. Check game-over
  if ((state.satisfaction || 50) < 10) {
    notify('Golpe de Estado! A satisfacao chegou a 0. Voce perdeu!', 'error');
  }

  // 4. Re-render
  renderAll();

  if (events.length > 0 || aiEvents.length > 0) {
    notify([...events, ...aiEvents][0], 'info');
  }

  // 5. Save
  saveGame(state);

  btn.disabled = false;
  btn.textContent = 'FIM DE TURNO';
}

// ── Reset / new game ───────────────────────────────────────
async function resetGame() {
  if (!confirm('Apagar o save e comecar uma nova campanha?')) return;
  await deleteSave();
  window.GS = null;
  location.reload();
}

window.resetGame = resetGame;
window.renderAll = renderAll;
