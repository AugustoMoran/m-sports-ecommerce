/**
 * core/logger.js — Lightweight engine logger & stats tracker
 *
 * DESIGN DECISION: No external logging library dependency.
 * Stats are kept in-memory; the host app can retrieve them via engine.getStats().
 * Replace console calls with any logger (winston, pino) by swapping the `output` function.
 */

// ─── Internal stats store ─────────────────────────────────────────────────────
const _stats = {
  totalRequests: 0,
  aiRequests: 0,
  cacheHits: 0,
  errors: 0,
  intents: {},   // { [intentName]: count }
  queries: {},   // { [normalizedQuery]: count }
};

// ─── Output adapter ───────────────────────────────────────────────────────────
// Swap this function to redirect logs to winston, pino, etc.
function output(level, message, meta) {
  const ts = new Date().toISOString();
  const prefix = `[AI-ENGINE] [${ts}] [${level.toUpperCase()}]`;
  if (Object.keys(meta).length) {
    console.log(prefix, message, meta);
  } else {
    console.log(prefix, message);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
function log(level, message, meta = {}) {
  // Skip debug logs unless explicitly enabled
  if (level === 'debug' && process.env.AI_ENGINE_DEBUG !== 'true') return;
  output(level, message, meta);
}

/**
 * Records a completed request for stats.
 * @param {string} intent   - Detected intent name
 * @param {string} query    - Original user message (will be truncated)
 * @param {boolean} usedAI  - Whether an AI provider was called
 */
function trackRequest(intent, query, usedAI = false) {
  _stats.totalRequests++;
  if (usedAI) _stats.aiRequests++;

  // Intent frequency
  _stats.intents[intent] = (_stats.intents[intent] || 0) + 1;

  // Query frequency — truncate and normalise to avoid unbounded growth
  const key = query.toLowerCase().trim().slice(0, 60);
  _stats.queries[key] = (_stats.queries[key] || 0) + 1;
}

function trackError(error, context = '') {
  _stats.errors++;
  log('error', `[${context}] ${error?.message || String(error)}`);
}

function trackCacheHit() {
  _stats.cacheHits++;
}

/**
 * Returns a snapshot of current stats with derived rankings.
 */
function getStats() {
  return {
    totalRequests: _stats.totalRequests,
    aiRequests: _stats.aiRequests,
    cacheHits: _stats.cacheHits,
    errors: _stats.errors,
    aiUsagePercent:
      _stats.totalRequests > 0
        ? Math.round((_stats.aiRequests / _stats.totalRequests) * 100)
        : 0,
    topIntents: Object.entries(_stats.intents)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([intent, count]) => ({ intent, count })),
    topQueries: Object.entries(_stats.queries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count })),
  };
}

function resetStats() {
  Object.assign(_stats, {
    totalRequests: 0,
    aiRequests: 0,
    cacheHits: 0,
    errors: 0,
    intents: {},
    queries: {},
  });
}

module.exports = { log, trackRequest, trackError, trackCacheHit, getStats, resetStats };
