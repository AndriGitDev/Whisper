// api/kv-mock.js
const store = new Map();

export const kv = {
  async set(key, value, options) {
    store.set(key, { value, options, createdAt: Date.now() });
    return 'OK';
  },
  async get(key) {
    const entry = store.get(key);
    if (!entry) return null;

    if (entry.options && entry.options.ex) {
      const expiryTime = entry.createdAt + (entry.options.ex * 1000);
      if (Date.now() > expiryTime) {
        store.delete(key);
        return null;
      }
    }
    return entry.value;
  },
  async del(key) {
    store.delete(key);
    return 1;
  },
  async ttl(key) {
      const entry = store.get(key);
      if (!entry) return -2; // Key does not exist

      if (entry.options && entry.options.ex) {
          const elapsedTime = (Date.now() - entry.createdAt) / 1000;
          const remaining_ttl = Math.round(entry.options.ex - elapsedTime);
          return remaining_ttl > 0 ? remaining_ttl : -2; // Return remaining time or -2 if expired
      }

      return -1; // Key exists but has no associated expire
  }
};
