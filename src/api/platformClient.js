const STORAGE_KEYS = {
  games: 'chess-platform/games',
  analyses: 'chess-platform/analyses',
  user: 'chess-platform/user'
};

const memoryStore = new Map();

defaultStorageSetup();

function defaultStorageSetup() {
  if (!memoryStore.has(STORAGE_KEYS.games)) {
    memoryStore.set(STORAGE_KEYS.games, []);
  }
  if (!memoryStore.has(STORAGE_KEYS.analyses)) {
    memoryStore.set(STORAGE_KEYS.analyses, []);
  }
  if (!memoryStore.has(STORAGE_KEYS.user)) {
    memoryStore.set(STORAGE_KEYS.user, defaultUser());
  }
}

function defaultUser() {
  return {
    id: 'local-user',
    display_name: 'Player One',
    chess_username: '',
    ai_provider: 'local',
    ai_api_key: '',
    ai_model: '',
    ai_model_version: '',
    ai_region: '',
    ai_access_key: '',
    ai_secret_key: '',
    ai_session_token: '',
    created_at: Date.now()
  };
}

const hasBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function readStore(key, fallback) {
  if (hasBrowserStorage()) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (error) {
      console.warn('Failed to parse stored value', error);
    }
  }
  if (memoryStore.has(key)) {
    return memoryStore.get(key);
  }
  return fallback;
}

function writeStore(key, value) {
  if (hasBrowserStorage()) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
  memoryStore.set(key, value);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function matchesFilter(entry, filters = {}) {
  return Object.entries(filters).every(([key, target]) => {
    if (target === undefined || target === null) return true;
    return entry?.[key] === target;
  });
}

function sortRecords(records, sort = '-date') {
  if (!sort) return [...records];
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...records].sort((a, b) => {
    const aVal = a?.[field] ?? 0;
    const bVal = b?.[field] ?? 0;
    if (aVal === bVal) return 0;
    if (aVal > bVal) return desc ? -1 : 1;
    return desc ? 1 : -1;
  });
}

function generateId(prefix = 'rec') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}

function withLatency(value, delay = 120) {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

function upsertRecord(key, payload, options = {}) {
  const { uniqueKey } = options;
  const records = ensureArray(readStore(key, []));
  if (uniqueKey && payload?.[uniqueKey]) {
    const existing = records.find((record) => record[uniqueKey] === payload[uniqueKey]);
    if (existing) {
      return { collection: records, record: existing };
    }
  }

  const record = { ...payload };
  records.unshift(record);
  writeStore(key, records);
  return { collection: records, record };
}

function updateRecord(key, id, updates) {
  const records = ensureArray(readStore(key, []));
  let updated;
  const nextRecords = records.map((record) => {
    if (record.id !== id) return record;
    updated = { ...record, ...updates };
    return updated;
  });
  if (!updated) {
    throw new Error(`Record with id ${id} not found in ${key}`);
  }
  writeStore(key, nextRecords);
  return updated;
}

const Game = {
  async list(sort = '-date', limit = 50) {
    const records = sortRecords(ensureArray(readStore(STORAGE_KEYS.games, [])), sort);
    const sliced = typeof limit === 'number' ? records.slice(0, limit) : records;
    return withLatency(sliced);
  },
  async filter(filters = {}) {
    const records = ensureArray(readStore(STORAGE_KEYS.games, [])).filter((record) => matchesFilter(record, filters));
    return withLatency(records);
  },
  async create(payload = {}) {
    const record = {
      id: payload.id || generateId('game'),
      game_id: payload.game_id || payload.id || generateId('game'),
      created_at: payload.created_at || Math.floor(Date.now() / 1000),
      date: payload.date || Math.floor(Date.now() / 1000),
      ...payload
    };

    const result = upsertRecord(STORAGE_KEYS.games, record, { uniqueKey: 'game_id' });
    return withLatency(result.record);
  },
  async update(id, updates = {}) {
    const updated = updateRecord(STORAGE_KEYS.games, id, updates);
    return withLatency(updated);
  },
  async clear() {
    writeStore(STORAGE_KEYS.games, []);
    return withLatency([]);
  }
};

const Analysis = {
  async list(sort = '-analyzed_at') {
    const records = sortRecords(ensureArray(readStore(STORAGE_KEYS.analyses, [])), sort);
    return withLatency(records);
  },
  async filter(filters = {}) {
    const records = ensureArray(readStore(STORAGE_KEYS.analyses, [])).filter((record) => matchesFilter(record, filters));
    return withLatency(records);
  },
  async create(payload = {}) {
    const record = {
      id: payload.id || generateId('analysis'),
      analyzed_at: payload.analyzed_at || Math.floor(Date.now() / 1000),
      ...payload
    };

    const result = upsertRecord(STORAGE_KEYS.analyses, record, { uniqueKey: 'game_id' });
    return withLatency(result.record);
  },
  async update(id, updates = {}) {
    const updated = updateRecord(STORAGE_KEYS.analyses, id, updates);
    return withLatency(updated);
  },
  async clear() {
    writeStore(STORAGE_KEYS.analyses, []);
    return withLatency([]);
  }
};

const PlayerStats = {
  async list() {
    const games = ensureArray(readStore(STORAGE_KEYS.games, []));
    const analyses = ensureArray(readStore(STORAGE_KEYS.analyses, []));
    const stats = {
      total_games: games.length,
      analyzed_games: analyses.length,
      blunders: analyses.reduce((sum, item) => sum + (item.blunder_count || 0), 0),
      mistakes: analyses.reduce((sum, item) => sum + (item.mistake_count || 0), 0),
      updated_at: Date.now()
    };
    return withLatency([stats]);
  }
};

const auth = {
  async me() {
    const stored = readStore(STORAGE_KEYS.user, defaultUser());
    const user = { ...defaultUser(), ...stored };
    writeStore(STORAGE_KEYS.user, user);
    return withLatency(user);
  },
  async updateMe(updates = {}) {
    const current = await this.me();
    const updated = { ...current, ...updates, updated_at: Date.now() };
    writeStore(STORAGE_KEYS.user, updated);
    return withLatency(updated);
  }
};

export const platformClient = {
  entities: {
    Game,
    Analysis,
    PlayerStats
  },
  auth
};
