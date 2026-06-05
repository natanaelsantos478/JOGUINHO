// ═══════════════════════════════════════════════════════════
//  save.js — Supabase persistence layer
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://tgeomsnxfcqwrxijjvek.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnZW9tc254ZmNxd3J4aWpqdmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDAxMjEsImV4cCI6MjA4ODExNjEyMX0.5c_DvW3KlTd1p75oMDXrRZNmggFrVUbwO9Dk0fqapD4';
const SAVE_TABLE  = 'world_conquest_save';
const SAVE_ID     = 'player_save';

let _db = null;
let _saveTimer = null;

function initSupabase() {
  _db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

async function loadGame() {
  try {
    const { data, error } = await _db
      .from(SAVE_TABLE)
      .select('*')
      .eq('id', SAVE_ID)
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
      id:             SAVE_ID,
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
    await _db.from(SAVE_TABLE).delete().eq('id', SAVE_ID);
  } catch (e) { /* ignore */ }
}
