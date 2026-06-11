// ═══════════════════════════════════════════════════════════
//  ai_gemini.js — DeepSeek AI para países IA
// ═══════════════════════════════════════════════════════════

const DEEPSEEK_API_KEY = 'sk-f5e4907cb55f433a8ba970a02f05ef48';
const DEEPSEEK_URL     = 'https://api.deepseek.com/v1/chat/completions';

// Países controlados pelo Gemini (rotaciona grupos a cada turno)
const GEMINI_COUNTRIES = [
  'United States','Russia','China','Germany','France',
  'United Kingdom','Japan','India','Brazil','Turkey',
  'Saudi Arabia','Iran','North Korea','Pakistan','South Korea',
  'Australia','Canada','Argentina','Mexico','Italy',
];

// Centroids para spawn de unidades IA
const AI_CENTROIDS = {
  'United States':  { lat: 38,  lng: -97  },
  'Russia':         { lat: 60,  lng: 90   },
  'China':          { lat: 35,  lng: 103  },
  'Germany':        { lat: 51,  lng: 10   },
  'France':         { lat: 46,  lng: 2    },
  'United Kingdom': { lat: 55,  lng: -3   },
  'Japan':          { lat: 36,  lng: 138  },
  'India':          { lat: 20,  lng: 77   },
  'Brazil':         { lat: -14, lng: -51  },
  'Canada':         { lat: 56,  lng: -96  },
  'Australia':      { lat: -25, lng: 133  },
  'Turkey':         { lat: 39,  lng: 35   },
  'Saudi Arabia':   { lat: 23,  lng: 45   },
  'Iran':           { lat: 32,  lng: 53   },
  'North Korea':    { lat: 40,  lng: 127  },
  'South Korea':    { lat: 36,  lng: 128  },
  'Pakistan':       { lat: 30,  lng: 70   },
  'Argentina':      { lat: -38, lng: -63  },
  'Mexico':         { lat: 23,  lng: -102 },
  'Italy':          { lat: 41,  lng: 12   },
  'Spain':          { lat: 40,  lng: -4   },
  'Algeria':        { lat: 28,  lng: 2    },
  'Egypt':          { lat: 27,  lng: 30   },
  'Nigeria':        { lat: 9,   lng: 8    },
  'Ethiopia':       { lat: 9,   lng: 40   },
  'South Africa':   { lat: -29, lng: 25   },
  'Indonesia':      { lat: -2,  lng: 118  },
  'Ukraine':        { lat: 49,  lng: 32   },
  'Poland':         { lat: 52,  lng: 20   },
};

// Coordenadas costeiras para spawn de navios (países com acesso marítimo real)
const NAVAL_CENTROIDS = {
  'United States':  { lat: 36.8,  lng: -75.9  },  // Virginia Beach / Atlantic
  'Russia':         { lat: 43.1,  lng: 131.9  },  // Vladivostok
  'China':          { lat: 22.3,  lng: 114.2  },  // South China Sea
  'France':         { lat: 43.3,  lng: 5.4    },  // Marseille
  'United Kingdom': { lat: 50.8,  lng: -1.1   },  // Portsmouth
  'Japan':          { lat: 34.7,  lng: 136.9  },  // Nagoya Bay
  'India':          { lat: 15.5,  lng: 73.8   },  // Arabian Sea
  'Brazil':         { lat: -22.9, lng: -43.2  },  // Rio de Janeiro
  'Australia':      { lat: -33.9, lng: 151.2  },  // Sydney
  'Turkey':         { lat: 36.8,  lng: 36.1   },  // Iskenderun Bay
  'Saudi Arabia':   { lat: 21.5,  lng: 39.2   },  // Jeddah
  'Iran':           { lat: 26.5,  lng: 56.3   },  // Strait of Hormuz
  'North Korea':    { lat: 40.5,  lng: 129.6  },  // East Sea
  'South Korea':    { lat: 35.1,  lng: 129.0  },  // Busan
  'Pakistan':       { lat: 24.9,  lng: 67.0   },  // Karachi
  'Argentina':      { lat: -38.0, lng: -57.6  },  // Mar del Plata
  'Mexico':         { lat: 19.2,  lng: -104.0 },  // Manzanillo
  'Canada':         { lat: 44.6,  lng: -63.6  },  // Halifax
  'Italy':          { lat: 40.8,  lng: 14.3   },  // Naples
  'Spain':          { lat: 36.5,  lng: -6.3   },  // Cadiz
  'Indonesia':      { lat: -6.1,  lng: 106.8  },  // Jakarta Bay
  'South Africa':   { lat: -33.9, lng: 18.4   },  // Cape Town
  'Egypt':          { lat: 31.2,  lng: 29.9   },  // Alexandria
  'Nigeria':        { lat: 6.4,   lng: 3.4    },  // Lagos
};

// Países sem saída para o mar (terrestres) — nunca recebem navios
const LANDLOCKED = new Set([
  'Germany','Austria','Switzerland','Hungary','Czech Republic','Slovakia',
  'Belarus','Moldova','Serbia','Bosnia and Herzegovina','North Macedonia',
  'Mongolia','Kazakhstan','Uzbekistan','Turkmenistan','Kyrgyzstan','Tajikistan',
  'Afghanistan','Nepal','Bhutan','Ethiopia','Uganda','Rwanda','Burundi',
  'Chad','Niger','Mali','Burkina Faso','Central African Republic','South Sudan',
  'Zambia','Zimbabwe','Malawi','Botswana','Lesotho','Eswatini',
  'Bolivia','Paraguay','Luxembourg','Liechtenstein','San Marino','Vatican',
  'Armenia','Azerbaijan','Iraq', // Iraq has tiny coast, ignore for simplicity
]);

let _geminiTurnCounter = 0;

// ── Chamada à API DeepSeek ────────────────────────────────
async function callGeminiAI(prompt) {
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model:       'deepseek-chat',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens:  600,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (!res.ok) { console.warn('DeepSeek HTTP', res.status); return null; }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.warn('DeepSeek falhou:', e.message);
    return null;
  }
}

function _parseGeminiActions(text) {
  if (!text) return [];
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return [];
    const parsed = JSON.parse(m[0]);
    return Array.isArray(parsed.actions) ? parsed.actions : [];
  } catch { return []; }
}

// ── Turno IA principal (substitui aiTurns de diplomacy.js) ─
async function aiTurnsWithGemini(state, allCountryNames) {
  _geminiTurnCounter++;
  const events = [];

  // 1. Gemini decide ações diplomáticas para 5 países por turno
  await _geminiDiplomacyTurn(state, events);

  // 2. Spawn de unidades para países maiores (a cada 3 turnos)
  if (_geminiTurnCounter % 3 === 0) {
    _aiSpawnForMajors(state, events);
  }

  // 3. Movimentação e combate de unidades IA
  _aiMoveAndFight(state, events);

  // 4. Lógica simples de fallback para países não cobertos por Gemini
  _simpleFallbackAI(state, allCountryNames, events);

  return events;
}

// ── Gemini: decisões diplomáticas ─────────────────────────
async function _geminiDiplomacyTurn(state, events) {
  const player = state.player_country;
  const available = GEMINI_COUNTRIES.filter(n => n !== player);
  const startIdx = (_geminiTurnCounter - 1) * 5 % available.length;
  const batch = [];
  for (let i = 0; i < 5; i++) batch.push(available[(startIdx + i) % available.length]);

  const warsWith    = (state.at_war_with || []).join(', ') || 'nenhum';
  const alliesList  = (state.allies      || []).join(', ') || 'nenhum';
  const pUnits      = (state.units || []).filter(u => u.country === player).length;

  const statusLines = batch.map(n => {
    const rel = getRelation(state, n);
    const base = getCountryBaseData(n);
    const aiUnits = (state.units || []).filter(u => u.country === n).length;
    return `  ${n} (PIB $${base.gdp}B, ${aiUnits} tropas, relacao_com_jogador=${rel})`;
  }).join('\n');

  const prompt = `Voce e a IA de um jogo de estrategia. Jogador: ${player} (turno ${state.turn}, ${pUnits} tropas, em guerra com: ${warsWith}, aliados: ${alliesList}).

Paises que voce controla agora:
${statusLines}

Para cada pais escolha UMA acao: declare_war, propose_peace, propose_alliance, set_embargo, recruit_units, stay_neutral.
Regras: so declare guerra se tiver sentido geopolitico real. Prefira diplomacia ou recruit_units. Nao declare guerra se ja for aliado.

Responda SOMENTE JSON valido:
{"actions":[{"country":"Nome","action":"acao","reason":"motivo breve em pt-BR"}]}`;

  const text = await callGeminiAI(prompt);
  const actions = _parseGeminiActions(text);

  actions.forEach(({ country, action, reason }) => {
    if (!country || country === player) return;
    const rel = getRelation(state, country);
    const note = reason ? ` (${reason})` : '';

    switch (action) {
      case 'declare_war':
        if (rel !== 'war' && rel !== 'alliance') {
          setRelation(state, country, 'war');
          state.satisfaction = Math.max(0, (state.satisfaction || 50) - 8);
          events.push(`[IA-GEMINI] ${country} declarou guerra a voce!${note}`);
        }
        break;
      case 'propose_peace':
        if (rel === 'war') {
          setRelation(state, country, 'truce');
          events.push(`[IA-GEMINI] ${country} propoe cessar-fogo.${note}`);
        }
        break;
      case 'propose_alliance':
        if (rel === 'neutral' || rel === 'truce') {
          setRelation(state, country, 'alliance');
          events.push(`[IA-GEMINI] ${country} propoe alianca!${note}`);
        }
        break;
      case 'set_embargo':
        if (rel === 'neutral') {
          setRelation(state, country, 'embargo');
          events.push(`[IA-GEMINI] ${country} impoe embargo economico.${note}`);
        }
        break;
      case 'recruit_units':
        _aiSpawnOneUnit(state, country, events);
        break;
    }
  });

  if (actions.length === 0 && text) {
    console.log('Gemini nao retornou JSON valido:', text.slice(0, 100));
  }
}

// ── Spawn de unidades IA ───────────────────────────────────
function _aiSpawnForMajors(state, events) {
  const player = state.player_country;
  GEMINI_COUNTRIES.filter(n => n !== player).forEach(country => {
    const existing = (state.units || []).filter(u => u.country === country).length;
    if (existing >= 5) return;
    // Apenas países com relação diferente de neutral em relação ao jogador têm chance
    const rel = getRelation(state, country);
    if (rel === 'neutral' && Math.random() > 0.25) return;
    _aiSpawnOneUnit(state, country, events);
  });
}

function _aiSpawnOneUnit(state, countryName, events) {
  const centroid = AI_CENTROIDS[countryName];
  if (!centroid) return;
  const existing = (state.units || []).filter(u => u.country === countryName).length;
  if (existing >= 8) return;

  const base = getCountryBaseData(countryName);
  const isLandlocked = LANDLOCKED.has(countryName);
  const hasNaval = !!NAVAL_CENTROIDS[countryName];

  // Pick unit type — never naval for landlocked or countries without coast data
  let unitType;
  if (base.gdp >= 10000) {
    const pool = isLandlocked || !hasNaval
      ? ['tank_elite','air2_fighter','air1_stealth']
      : ['tank_elite','air2_fighter','nav1_destroyer'];
    unitType = pool[Math.floor(Math.random() * pool.length)];
  } else if (base.gdp >= 3000) {
    const pool = isLandlocked || !hasNaval
      ? ['veh_medium','air2_helicopter','air3_drone']
      : ['veh_medium','air2_helicopter','nav2_frigate'];
    unitType = pool[Math.floor(Math.random() * pool.length)];
  } else if (base.gdp >= 1000) {
    const pool = isLandlocked || !hasNaval
      ? ['motorized','air3_drone','infantry']
      : ['motorized','air3_drone','nav3_patrol'];
    unitType = pool[Math.floor(Math.random() * pool.length)];
  } else {
    unitType = 'infantry';
  }

  // Use coastal centroid for naval units
  const isNaval = unitType.startsWith('nav');
  const spawnBase = isNaval ? NAVAL_CENTROIDS[countryName] : centroid;
  const jitter = isNaval ? 1.5 : 5;

  const unit = createUnit(
    unitType, countryName,
    spawnBase.lat + (Math.random() - 0.5) * jitter,
    spawnBase.lng + (Math.random() - 0.5) * jitter,
    1
  );
  if (!state.units) state.units = [];
  state.units.push(unit);
  events.push(`[IA] ${countryName} recrutou ${UNIT_DEFS[unitType].label}: ${unit.name}`);
}

// ── Movimentação e combate de unidades IA ─────────────────
function _aiMoveAndFight(state, events) {
  const player  = state.player_country;
  const atWar   = state.at_war_with || [];
  const pUnits  = (state.units || []).filter(u => u.country === player);

  if (pUnits.length === 0) return;

  const unitsToRemove = new Set();

  (state.units || []).forEach(unit => {
    if (unit.country === player) return;
    if (!atWar.includes(unit.country)) return;
    if (unitsToRemove.has(unit.id)) return;

    // Encontra unidade jogador mais próxima
    let nearest = null, minDist = Infinity;
    pUnits.forEach(pu => {
      if (unitsToRemove.has(pu.id)) return;
      const d = haversineKm(unit.lat, unit.lng, pu.lat, pu.lng);
      if (d < minDist) { minDist = d; nearest = pu; }
    });
    if (!nearest) return;

    if (minDist < 200 && unit.energy > 15) {
      // Combate
      const result = resolveCombat([unit], [nearest]);
      unit.energy = Math.max(0, unit.energy - 25);
      if (result.result === 'decisive_victory' || result.result === 'victory') {
        events.push(`[COMBATE] ${unit.country}: ${unit.name} atacou ${nearest.name}! (${result.result})`);
        if (nearest.hp <= 0) unitsToRemove.add(nearest.id);
      } else if (result.result === 'defeat') {
        events.push(`[COMBATE] ${nearest.name} repeliu ${unit.name}!`);
        if (unit.hp <= 0) unitsToRemove.add(unit.id);
      } else {
        events.push(`[COMBATE] Combate indeciso entre ${unit.country} e ${player}.`);
      }
    } else if (unit.energy > 10) {
      // Avança em direção à unidade do jogador
      const frac = Math.min(0.06, (unit.energy / unit.energyCap) * 0.08);
      unit.lat += (nearest.lat - unit.lat) * frac;
      unit.lng += (nearest.lng - unit.lng) * frac;
      unit.energy = Math.max(0, unit.energy - 8);
    }
  });

  if (unitsToRemove.size > 0) {
    state.units = state.units.filter(u => !unitsToRemove.has(u.id));
  }
}

// ── Fallback simples (mantém comportamento base para os demais) ─
function _simpleFallbackAI(state, allCountryNames, events) {
  const player = state.player_country;
  const geminiSet = new Set(GEMINI_COUNTRIES);

  allCountryNames.forEach(name => {
    if (name === player || geminiSet.has(name)) return;
    const personality = getPersonality(name);
    const rel = getRelation(state, name);

    if (personality === 'aggressive' && rel === 'neutral') {
      const pStrength = (state.units || []).filter(u => u.country === player).length;
      if (pStrength < 3 && Math.random() < 0.03) {
        setRelation(state, name, 'war');
        state.satisfaction = Math.max(0, (state.satisfaction || 50) - 8);
        events.push(`[IA] ${name} declarou guerra a voce!`);
      }
    }
    if (personality === 'economic' && rel === 'neutral' && Math.random() < 0.012) {
      setRelation(state, name, 'alliance');
      events.push(`[IA] ${name} propoe alianca.`);
    }
    if (rel === 'war' && Math.random() < 0.04) {
      setRelation(state, name, 'truce');
      events.push(`[IA] ${name} pede cessar-fogo.`);
    }
  });
}
