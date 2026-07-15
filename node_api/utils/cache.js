function createCache(ttlMs = 3600000) {
  const store = new Map();

  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key);
    }
  }, 1800000);
  interval.unref();

  return {
    async get(key, fetchFn) {
      const entry = store.get(key);
      if (entry && entry.expiresAt > Date.now()) return entry.value;

      const value = await fetchFn();
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    },

    set(key, value) {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },

    getIfPresent(key) {
      const entry = store.get(key);
      if (entry && entry.expiresAt > Date.now()) return entry.value;
      return null;
    },

    invalidate(key) {
      store.delete(key);
    },

    invalidateAll() {
      store.clear();
    },

    destroy() {
      clearInterval(interval);
      store.clear();
    }
  };
}

module.exports = { createCache };
