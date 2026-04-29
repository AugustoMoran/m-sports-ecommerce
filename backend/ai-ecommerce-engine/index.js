/**
 * index.js — AI Ecommerce Engine — Public API
 *
 * This is the single entry point for the library.
 * Everything the consumer needs is exported from here.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   const { createAIEngine } = require('./ai-ecommerce-engine');
 *
 *   const engine = createAIEngine({
 *     mode: 'balanced',
 *     provider: 'gemini',
 *     geminiApiKey: process.env.GEMINI_API_KEY,
 *     plugins: [recommendationPlugin, analyticsPlugin],
 *   });
 *
 *   const response = await engine.handleMessage('Busco zapatillas', dependencies, {
 *     sessionId: 'user-123',
 *     conversationHistory: [],
 *   });
 *   // response → { text, products, intent, actions, meta }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEPENDENCY INJECTION CONTRACT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   dependencies = {
 *     getProducts(query, options)           → Promise<Product[]>   REQUIRED
 *     getProductById(id)                    → Promise<Product>     optional
 *     searchProductsSemantic(query, opts)   → Promise<Product[]>   optional (future)
 *   }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RESPONSE SHAPE (always returned, even on errors)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   {
 *     text:     string,
 *     products: [{ id, name, price, url, image }],
 *     intent:   string,
 *     actions:  [{ type, label, url }],
 *     meta:     { source, mode, sessionId }
 *   }
 */

const { buildConfig }     = require('./config');
const { createCache }     = require('./core/cache');
const { createAIService } = require('./core/aiService');
const { detectIntent }    = require('./core/intentDetector');
const { decide }          = require('./core/decisionEngine');
const {
  log,
  trackRequest,
  trackError,
  trackCacheHit,
  getStats,
} = require('./core/logger');

// ─── Validation helpers ───────────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 500;

function validateMessage(message) {
  if (typeof message !== 'string') return 'El mensaje debe ser texto.';
  if (message.trim().length === 0)  return 'Por favor, escribe un mensaje.';
  return null;
}

// ─── Error response factory ───────────────────────────────────────────────────
function errorResponse(text, meta = {}) {
  return {
    text,
    products: [],
    intent:   'fallback',
    actions:  [],
    meta:     { source: 'error', ...meta },
  };
}

// ─── Main factory ─────────────────────────────────────────────────────────────
/**
 * Creates a fully configured AI Engine instance.
 *
 * @param {Object} userConfig
 * @param {string} [userConfig.mode='balanced']              - 'cheap' | 'balanced' | 'smart'
 * @param {string} [userConfig.provider='gemini']            - Primary AI provider
 * @param {string} [userConfig.fallbackProvider='huggingface'] - Fallback provider
 * @param {boolean}[userConfig.fallbackEnabled=false]        - Enable fallback provider
 * @param {boolean}[userConfig.useCache=true]                - Enable response cache
 * @param {number} [userConfig.cacheTTL=300000]              - Cache TTL in ms
 * @param {number} [userConfig.maxProducts=5]                - Products per RAG context
 * @param {number} [userConfig.maxAIRequestsPerMinute=20]    - Rate limit
 * @param {string} [userConfig.geminiApiKey]                 - Gemini API key
 * @param {string} [userConfig.huggingfaceApiKey]            - HuggingFace token
 * @param {string} [userConfig.openaiApiKey]                 - OpenAI API key
 * @param {Array}  [userConfig.plugins=[]]                   - Plugin instances
 * @param {Object} [userConfig.cacheAdapter]                 - Custom cache adapter
 *
 * @returns {{
 *   handleMessage: (message, dependencies, options?) => Promise<Object>,
 *   getStats:      () => Object,
 *   clearCache:    () => void,
 *   getConfig:     () => Object,
 * }}
 */
function createAIEngine(userConfig = {}) {
  const config  = buildConfig(userConfig);
  const plugins = Array.isArray(userConfig.plugins) ? userConfig.plugins : [];

  log('info', 'AI Engine initialised', {
    mode:     config.mode,
    provider: config.provider,
    useAI:    config.useAI,
    cache:    config.useCache,
    plugins:  plugins.map((p) => p.name || 'unnamed'),
  });

  // Initialise subsystems
  const cache     = config.useCache ? createCache(config) : null;
  const aiService = config.useAI    ? createAIService(config) : null;

  // ── handleMessage ──────────────────────────────────────────────────────
  /**
   * Processes a user message and returns a structured response.
   *
   * @param {string} message       - Raw user message
   * @param {Object} dependencies  - { getProducts, getProductById?, searchProductsSemantic? }
   * @param {Object} [options]
   * @param {string} [options.sessionId]            - Session identifier for analytics
   * @param {Array}  [options.conversationHistory]  - [{ role, content }]
   * @returns {Promise<{ text, products, intent, actions, meta }>}
   */
  async function handleMessage(message, dependencies = {}, options = {}) {
    const { sessionId = null, conversationHistory = [], products: optionProducts = [] } = options;

    // ── Input validation ──────────────────────────────────────────────────
    const validationError = validateMessage(message);
    if (validationError) {
      return errorResponse(validationError, { source: 'validation' });
    }

    const safeMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);

    try {
      // ── 1. Intent detection ─────────────────────────────────────────────
      const { intent, normalized } = await detectIntent(safeMessage, {
        // AI intent classification only in smart mode (costs tokens)
        useAIClassification: config.mode === 'smart' && config.useAI,
        aiClassifier: aiService
          ? (msg) => {
              const { buildIntentClassificationPrompt } = require('./core/prompts');
              return aiService.generateResponse(buildIntentClassificationPrompt(msg));
            }
          : null,
      });

      // ── 2. Decision / response generation ──────────────────────────────
      const requestConfig = { ...config, conversationHistory, products: optionProducts };

      const response = await decide(
        safeMessage,
        normalized,
        intent,
        dependencies,
        aiService,
        cache,
        requestConfig,
        plugins
      );

      // ── 3. Post-response analytics (non-blocking) ───────────────────────
      const analyticsCtx = {
        intent,
        response,
        sessionId,
        usedAI: ['rag', 'ai'].includes(response.source),
      };

      for (const plugin of plugins) {
        if (plugin.name === 'analytics' && typeof plugin.handle === 'function') {
          plugin.handle(safeMessage, dependencies, analyticsCtx).catch(() => {});
        }
      }

      // ── 4. Stats tracking ───────────────────────────────────────────────
      trackRequest(intent, safeMessage, analyticsCtx.usedAI);
      if (response.source === 'cache') trackCacheHit();

      // ── 5. Return normalised response ───────────────────────────────────
      return {
        text:     response.text     || '',
        products: response.products || [],
        intent:   response.intent   || intent,
        actions:  response.actions  || [],
        meta: {
          source:    response.source,
          mode:      config.mode,
          sessionId,
        },
      };
    } catch (err) {
      trackError(err, 'handleMessage');
      return errorResponse(
        'Ocurrió un error procesando tu mensaje. Por favor, intenta de nuevo.',
        { error: err.message }
      );
    }
  }

  // ── Public interface ─────────────────────────────────────────────────────
  return {
    handleMessage,

    /** Returns engine usage statistics */
    getStats,

    /** Clears the response cache */
    clearCache() {
      if (cache) cache.clear();
      log('info', 'Cache cleared manually');
    },

    /** Returns a copy of the resolved config (no API keys) */
    getConfig() {
      const { geminiApiKey, huggingfaceApiKey, openaiApiKey, ...safe } = config;
      return { ...safe };
    },
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  createAIEngine,
  // Re-export plugin factories so consumers can import from the root package
  createRecommendationPlugin: require('./plugins/recommendationPlugin').createRecommendationPlugin,
  createAnalyticsPlugin:      require('./plugins/analyticsPlugin').createAnalyticsPlugin,
};
