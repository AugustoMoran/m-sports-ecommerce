/**
 * core/cache.js — In-memory response cache
 *
 * DESIGN DECISION: This module hides the cache implementation behind a simple
 * interface (get/set/delete/clear). Swapping to Redis requires only providing
 * a compatible adapter via `config.cacheAdapter` — no engine code changes.
 *
 * Required adapter interface:
 *   get(key)                    → value | null
 *   set(key, value, ttl?)       → void
 *   delete(key)                 → void
 *   clear()                     → void
 */

// ─── In-memory implementation ─────────────────────────────────────────────────
class MemoryCache {
  /**
   * @param {number} defaultTTL - Default time-to-live in milliseconds
   */
  constructor(defaultTTL = 300_000) {
    this._store = new Map();
    this._defaultTTL = defaultTTL;
  }

  _isExpired(entry) {
    return Date.now() > entry.expiresAt;
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (this._isExpired(entry)) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttl = this._defaultTTL) {
    this._store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  delete(key) {
    this._store.delete(key);
  }

  clear() {
    this._store.clear();
  }

  size() {
    return this._store.size;
  }

  /**
   * Removes expired entries. Call on a periodic interval if needed.
   * The engine does not call this automatically to stay side-effect-free.
   */
  cleanup() {
    for (const [key, entry] of this._store.entries()) {
      if (this._isExpired(entry)) this._store.delete(key);
    }
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────
/**
 * Creates a cache instance.
 * Uses the custom adapter if provided, otherwise falls back to MemoryCache.
 *
 * @param {Object} config
 * @param {Object} [config.cacheAdapter] - Optional external adapter (e.g. Redis wrapper)
 * @param {number} [config.cacheTTL=300000] - Default TTL in ms
 * @returns {MemoryCache|cacheAdapter}
 */
function createCache(config = {}) {
  const { cacheAdapter, cacheTTL = 300_000 } = config;

  if (cacheAdapter) {
    // Validate the adapter implements the required interface
    const required = ['get', 'set', 'delete', 'clear'];
    for (const method of required) {
      if (typeof cacheAdapter[method] !== 'function') {
        throw new Error(
          `[AI-ENGINE] Cache adapter is missing required method: "${method}"`
        );
      }
    }
    return cacheAdapter;
  }

  return new MemoryCache(cacheTTL);
}

module.exports = { MemoryCache, createCache };
