const MemoryCache = require('greenborn-memory-cache');

function createCache(ttlMs = 3600000) {
  const store = new MemoryCache({
    ttlMs,
    cleanupIntervalMs: 30 * 60 * 1000
  });

  return {
    async get(key, fetchFn) {
      const cached = store.get(key);
      if (cached !== undefined) return cached;

      const value = await fetchFn();
      store.set(key, value, ttlMs);
      return value;
    },

    set(key, value) {
      store.set(key, value, ttlMs);
    },

    getIfPresent(key) {
      return store.get(key) ?? null;
    },

    invalidate(key) {
      store.delete(key);
    },

    invalidateAll() {
      store.clear();
    },

    destroy() {
      store.destroy();
    }
  };
}

module.exports = { createCache };
