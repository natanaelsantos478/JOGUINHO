// ═══════════════════════════════════════════════════════════
//  save.js — Supabase persistence layer
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://tgeomsnxfcqwrxijjvek.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8MoHM6-LrvozvGFGLfNpZg_F6G2fMhF';
const SAVE_TABLE  = 'world_conquest_save';

let _db = null;
let _saveTimer = null;
let _currentSaveId = 'player_save';   // updated by setCurrentSave()

function initSupabase() {
  _db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Called from game.js when a world/player is selected
function setCurrentSave(worldId, playerName) {
  const safe = (playerName || 'player').replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 24);
  _currentSaveId = worldId ? `wc_${worldId}_${safe}` : 'player_save';
}

async function loadGame() {
  try {
    const { data, error } = await _db
      .from(SAVE_TABLE)
      .select('*')
      .eq('id', _currentSaveId)
      .maybeSingle();

    if (error) { console.warn('Load error:', error.message); return null; }
    return data || null;
  } catch (e) {
    console.warn('loadGame exception:', e);
    return null;
  }
}

function saveGame(state) {
  clearTimeout(_saveTimer);
  _setSaveIndicator('saving');
  _saveTimer = setTimeout(() => _doSave(state), 2000);
}

async function _doSave(state) {
  try {
    const resourcesPayload = {
      ...state.resources,
      ministries:   state.ministries,
      satisfaction: state.satisfaction,
      structures:   state.structures,
    };

    const payload = {
      id:             _currentSaveId,
      world_id:       state.world_id || null,
      player_name:    state.player_name || null,
      player_country: state.player_country,
      turn:           state.turn,
      resources:      resourcesPayload,
      units:          state.units,
      diplomacy:      state.diplomacy,
      at_war_with:    state.at_war_with,
      allies:         state.allies,
      map_view:       state.map_view,
      game_log:       state.game_log.slice(-200),
    };

    const { error } = await _db
      .from(SAVE_TABLE)
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Save error:', error.message);
      _setSaveIndicator('error');
    } else {
      _setSaveIndicator('saved');
    }
  } catch (e) {
    console.warn('_doSave exception:', e);
    _setSaveIndicator('error');
  }
}

function _setSaveIndicator(status) {
  const el = document.getElementById('save-indicator');
  if (!el) return;
  if (status === 'saving') { el.textContent = 'Salvando...'; el.style.color = 'var(--muted)'; }
  else if (status === 'saved') { el.textContent = 'Salvo'; el.style.color = 'var(--green)'; }
  else { el.textContent = 'Erro ao salvar'; el.style.color = 'var(--red)'; }
}

async function deleteSave() {
  try {
    await _db.from(SAVE_TABLE).delete().eq('id', _currentSaveId);
  } catch (e) { /* ignore */ }
}

// ── Worlds API ──────────────────────────────────────────────
async function loadWorlds() {
  try {
    const { data, error } = await _db
      .from('wc_worlds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) { console.warn('loadWorlds error:', error.message); return []; }
    return data || [];
  } catch (e) {
    console.warn('loadWorlds exception:', e);
    return [];
  }
}

async function createWorld(name, hostName) {
  try {
    const { data, error } = await _db
      .from('wc_worlds')
      .insert({ name, host_name: hostName })
      .select()
      .single();
    if (error) { console.warn('createWorld error:', error.message); return null; }
    return data;
  } catch (e) {
    console.warn('createWorld exception:', e);
    return null;
  }
}

async function getPlayerSaveForWorld(worldId, playerName) {
  const safe = (playerName || 'player').replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 24);
  const saveId = `wc_${worldId}_${safe}`;
  try {
    const { data, error } = await _db
      .from(SAVE_TABLE)
      .select('*')
      .eq('id', saveId)
      .maybeSingle();
    if (error) return null;
    return data || null;
  } catch { return null; }
}
