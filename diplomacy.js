// ═══════════════════════════════════════════════════════════
//  diplomacy.js — AI countries, diplomatic relations, war
// ═══════════════════════════════════════════════════════════

// ── AI Personalities ───────────────────────────────────────
const AI_PERSONALITIES = {
  aggressive:   ['Russia', 'North Korea', 'Iran', 'Iraq', 'Syria'],
  defensive:    ['Switzerland', 'Canada', 'Sweden', 'Norway', 'Austria', 'New Zealand'],
  expansionist: ['China', 'United States', 'India', 'Turkey', 'Brazil', 'Pakistan'],
  economic:     ['Japan', 'Germany', 'France', 'South Korea', 'Singapore', 'Netherlands'],
};

function getPersonality(countryName) {
  for (const [type, list] of Object.entries(AI_PERSONALITIES)) {
    if (list.includes(countryName)) return type;
  }
  return 'defensive';
}

// ── Diplomatic status ──────────────────────────────────────
// state.diplomacy = { 'Russia': 'war', 'Brazil': 'alliance', ... }
// Valid values: 'neutral' | 'war' | 'alliance' | 'truce' | 'embargo'

function getRelation(state, countryName) {
  return (state.diplomacy || {})[countryName] || 'neutral';
}

function setRelation(state, countryName, rel) {
  if (!state.diplomacy) state.diplomacy = {};
  state.diplomacy[countryName] = rel;
  state.at_war_with = Object.entries(state.diplomacy).filter(([,v]) => v === 'war').map(([k]) => k);
  state.allies      = Object.entries(state.diplomacy).filter(([,v]) => v === 'alliance').map(([k]) => k);
}

// ── Player diplomatic actions ─────────────────────────────
function declareWar(state, targetCountry) {
  if (getRelation(state, targetCountry) === 'war') return { ok: false, reason: 'Ja em guerra' };
  setRelation(state, targetCountry, 'war');
  state.satisfaction = Math.max(0, (state.satisfaction || 50) - 10);
  state.game_log.unshift(`[Turno ${state.turn}] GUERRA declarada contra ${targetCountry}!`);
  return { ok: true };
}

function proposePeace(state, targetCountry) {
  if (getRelation(state, targetCountry) !== 'war') return { ok: false, reason: 'Nao estamos em guerra' };
  const aiAccepts = Math.random() > 0.4;
  if (aiAccepts) {
    setRelation(state, targetCountry, 'truce');
    state.game_log.unshift(`[Turno ${state.turn}] Paz firmada com ${targetCountry}`);
    return { ok: true, accepted: true };
  } else {
    state.game_log.unshift(`[Turno ${state.turn}] ${targetCountry} recusou a paz`);
    return { ok: true, accepted: false };
  }
}

function proposeAlliance(state, targetCountry) {
  const rel = getRelation(state, targetCountry);
  if (rel === 'war') return { ok: false, reason: 'Em guerra com este pais' };
  if (rel === 'alliance') return { ok: false, reason: 'Ja sao aliados' };
  const foreignLv = (state.ministries || {}).foreign || 1;
  const threshold = Math.max(0.1, 0.7 - foreignLv * 0.1);
  const accepted = Math.random() > threshold;
  if (accepted) {
    setRelation(state, targetCountry, 'alliance');
    state.game_log.unshift(`[Turno ${state.turn}] Alianca formada com ${targetCountry}`);
    return { ok: true, accepted: true };
  } else {
    state.game_log.unshift(`[Turno ${state.turn}] ${targetCountry} recusou a alianca`);
    return { ok: true, accepted: false };
  }
}

function setEmbargo(state, targetCountry) {
  setRelation(state, targetCountry, 'embargo');
  state.game_log.unshift(`[Turno ${state.turn}] Embargo economico imposto a ${targetCountry}`);
  return { ok: true };
}

function breakAlliance(state, targetCountry) {
  setRelation(state, targetCountry, 'neutral');
  state.satisfaction = Math.max(0, (state.satisfaction || 50) - 5);
  state.game_log.unshift(`[Turno ${state.turn}] Alianca com ${targetCountry} encerrada`);
  return { ok: true };
}

// ── AI turn logic (simples - usado como fallback) ─────────
function aiTurns(state, allCountryNames) {
  const player = state.player_country;
  const events = [];

  allCountryNames.forEach(name => {
    if (name === player) return;
    const personality = getPersonality(name);
    const rel = getRelation(state, name);

    if (personality === 'aggressive' && rel === 'neutral') {
      const playerStrength = (state.units || []).filter(u => u.country === player).length;
      if (playerStrength < 3 && Math.random() < 0.03) {
        setRelation(state, name, 'war');
        state.satisfaction = Math.max(0, (state.satisfaction || 50) - 8);
        events.push(`[IA] ${name} declarou guerra a voce!`);
      }
    }

    if (personality === 'economic' && rel === 'neutral' && Math.random() < 0.015) {
      setRelation(state, name, 'alliance');
      events.push(`[IA] ${name} propoe uma alianca.`);
    }

    if (rel === 'war' && Math.random() < 0.04) {
      setRelation(state, name, 'truce');
      events.push(`[IA] ${name} pediu cessar-fogo.`);
    }
  });

  return events;
}

// ── Utility ────────────────────────────────────────────────
function relationColor(rel) {
  const map = { war: '#c0253a', alliance: '#2a7a4a', truce: '#6a6860', embargo: '#8b4513', neutral: '#1a3a6a' };
  return map[rel] || map.neutral;
}

function relationLabel(rel) {
  const map = { war: 'Guerra', alliance: 'Aliado', truce: 'Tregua', embargo: 'Embargo', neutral: 'Neutro' };
  return map[rel] || map.neutral;
}

function getCountryFillColor(countryName, state) {
  if (countryName === state.player_country) return '#c8a84b';
  const rel = getRelation(state, countryName);
  return relationColor(rel);
}

function getCountryFillOpacity(countryName, state) {
  if (countryName === state.player_country) return 0.4;
  const rel = getRelation(state, countryName);
  if (rel === 'war') return 0.35;
  if (rel === 'alliance') return 0.30;
  return 0.0;
}
