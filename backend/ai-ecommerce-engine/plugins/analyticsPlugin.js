/**
 * plugins/analyticsPlugin.js — Conversation & product analytics tracker
 *
 * DESIGN DECISION: Analytics are always non-blocking. A failure in this plugin
 * never affects the user-facing chat response. The plugin returns `null` so
 * the engine continues normally after analytics are recorded.
 *
 * Default storage: in-memory (useful for single-instance deployments).
 * Production path: provide an `onEvent` callback to forward events to your
 * analytics service, database, or message queue.
 *
 * Data collected:
 *  - Intent frequency (what users ask about most)
 *  - Search queries (what products users look for)
 *  - Products shown (which products get surfaced)
 *  - Response sources (how often cache/AI/plugins are used)
 */

const PLUGIN_NAME = 'analytics';

/**
 * Creates an analytics plugin instance.
 *
 * @param {Object} [options]
 * @param {Function} [options.onEvent]        - async (event) => void  Custom event sink
 * @param {boolean}  [options.trackIntents=true]
 * @param {boolean}  [options.trackSearches=true]
 * @param {boolean}  [options.trackProducts=true]
 * @param {boolean}  [options.trackSources=true]
 * @param {number}   [options.maxStoredEvents=500] - Max events kept in memory
 */
function createAnalyticsPlugin(options = {}) {
  const {
    onEvent          = null,
    trackIntents     = true,
    trackSearches    = true,
    trackProducts    = true,
    trackSources     = true,
    maxStoredEvents  = 500,
  } = options;

  // ─── In-memory store ─────────────────────────────────────────────────────
  const store = {
    events:       [],
    intents:      new Map(),  // intent → count
    searches:     new Map(),  // query  → count
    products:     new Map(),  // productId → { name, count, lastSeen }
    sources:      new Map(),  // source (rag/cache/plugin/…) → count
    sessions:     new Set(),  // unique session ids
  };

  // ─── Internal helpers ────────────────────────────────────────────────────
  function record(type, data) {
    const event = { type, timestamp: new Date().toISOString(), ...data };

    store.events.push(event);
    // Prevent unbounded memory growth
    if (store.events.length > maxStoredEvents) {
      store.events = store.events.slice(-Math.floor(maxStoredEvents * 0.8));
    }

    // Forward to external sink (non-blocking)
    if (typeof onEvent === 'function') {
      Promise.resolve(onEvent(event)).catch(() => {});
    }
  }

  function incrementMap(map, key, extra = {}) {
    const existing = map.get(key) || { count: 0 };
    map.set(key, { ...existing, ...extra, count: existing.count + 1 });
  }

  // ─── Plugin handler ──────────────────────────────────────────────────────
  /**
   * Called by the engine AFTER every response is generated.
   * Runs asynchronously and always returns null (no response modification).
   */
  async function handle(message, _dependencies, engineCtx = {}) {
    try {
      const { intent, response, sessionId, usedAI } = engineCtx;

      if (sessionId) store.sessions.add(sessionId);

      // Intent tracking
      if (trackIntents && intent) {
        incrementMap(store.intents, intent);
        record('intent', { intent, sessionId });
      }

      // Search query tracking
      if (trackSearches && ['product_search', 'product_recommendation'].includes(intent)) {
        const query = message.toLowerCase().trim().slice(0, 100);
        incrementMap(store.searches, query);
        record('search', { query, intent, sessionId });
      }

      // Products surfaced tracking
      if (trackProducts && response?.products?.length > 0) {
        for (const p of response.products) {
          incrementMap(store.products, String(p.id), {
            name:     p.name,
            lastSeen: new Date().toISOString(),
          });
        }
        record('products_shown', {
          productIds: response.products.map((p) => p.id),
          intent,
          sessionId,
        });
      }

      // Response source tracking (cache / plugin / rag / ai / fallback)
      if (trackSources && response?.source) {
        incrementMap(store.sources, response.source);
        record('source_used', { source: response.source, usedAI, sessionId });
      }
    } catch {
      // Analytics must never crash the engine
    }

    return null; // Don't modify the response
  }

  // ─── Public reporting ────────────────────────────────────────────────────
  /**
   * Returns a structured analytics report.
   * @param {number} [topN=10] - How many top entries to include per dimension
   */
  function getReport(topN = 10) {
    const sortedMap = (map, n) =>
      [...map.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, n)
        .map(([key, val]) => ({ key, ...val }));

    return {
      totalEvents:    store.events.length,
      uniqueSessions: store.sessions.size,
      topIntents:     sortedMap(store.intents,  topN),
      topSearches:    sortedMap(store.searches, topN),
      topProducts:    sortedMap(store.products, topN),
      sourcesBreakdown: [...store.sources.entries()].map(([source, val]) => ({
        source,
        count: val.count,
      })),
    };
  }

  return {
    name:      PLUGIN_NAME,
    handle,
    getReport,
    /** Direct access to raw store for custom integrations */
    getStore: () => store,
  };
}

module.exports = { createAnalyticsPlugin };
