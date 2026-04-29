/**
 * core/decisionEngine.js — Response routing and priority orchestration
 *
 * DESIGN DECISION: A single function `decide()` owns all routing logic.
 * Priority order (highest to lowest):
 *
 *   1. Direct response   — Static replies for greetings and simple intents (zero cost)
 *   2. Cache hit         — Exact-match cache on normalized message + intent
 *   3. Plugins           — External handlers (recommendations, etc.) run before AI
 *   4. RAG               — Product-grounded AI response (preferred AI path)
 *   5. Pure AI           — No product context (last AI resort)
 *   6. Static fallback   — When everything else fails
 *
 * The engine minimises AI calls by exhausting cheaper options first.
 */

const { log } = require('./logger');
const { executeRAG } = require('./ragService');

// ─── Static direct responses ──────────────────────────────────────────────────
const DIRECT_RESPONSES = {
  greeting: [
    '¡Hola! 👋 Soy tu asistente de compras. ¿Qué estás buscando hoy?',
    '¡Bienvenido/a! Estoy aquí para ayudarte. ¿Buscas algún producto en particular?',
    '¡Hola! ¿En qué puedo ayudarte? Puedo recomendarte productos, consultar precios y verificar disponibilidad.',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Cache key combines the intent and a normalised slice of the message.
 * Short enough to hit on rephrased queries, specific enough to avoid false hits.
 */
function buildCacheKey(intent, normalized) {
  return `${intent}:${normalized.slice(0, 80)}`;
}

/**
 * Runs plugins in registration order until one returns a non-null result.
 * Plugin failures are caught and logged; they never block the response.
 *
 * @param {string}   message
 * @param {Object}   dependencies
 * @param {Object}   context      - { intent, conversationHistory }
 * @param {Array}    plugins
 * @returns {Promise<{ result: Object, pluginName: string } | null>}
 */
async function runPlugins(message, dependencies, context, plugins) {
  for (const plugin of plugins) {
    if (typeof plugin.handle !== 'function') continue;
    try {
      const result = await plugin.handle(message, dependencies, context);
      if (result != null) {
        return { result, pluginName: plugin.name };
      }
    } catch (err) {
      log('warn', `Plugin "${plugin.name}" threw an error`, { error: err.message });
    }
  }
  return null;
}

// ─── Decision function ────────────────────────────────────────────────────────
/**
 * Determines the best response strategy and executes it.
 *
 * @param {string}   message         - Original user message
 * @param {string}   normalized      - Normalised message (from intentDetector)
 * @param {string}   intent          - Detected intent
 * @param {Object}   dependencies    - Injected data functions { getProducts, ... }
 * @param {Object|null} aiService    - AI service (null in 'cheap' mode)
 * @param {Object|null} cache        - Cache instance (null if disabled)
 * @param {Object}   config          - Resolved engine config
 * @param {Array}    [plugins=[]]    - Registered plugin instances
 * @returns {Promise<{ text, products, intent, actions, source }>}
 */
async function decide(
  message,
  normalized,
  intent,
  dependencies,
  aiService,
  cache,
  config,
  plugins = []
) {
  const { useCache, useAI, maxProducts, conversationHistory = [], products = [] } = config;
  const cacheKey = buildCacheKey(intent, normalized);

  // ─── Build dynamic fallback based on available products ──────────────────
  const buildFallback = () => {
    let fallbackText = '';
    
    if (products && products.length > 0) {
      // Obtener 2-3 productos aleatorios para sugerir de forma natural
      // Deduplicate available products by id/name
      const uniq = [];
      const seenIds = new Set();
      for (const p of products) {
        const id = p._id ? String(p._id) : (p.id ? String(p.id) : p.nombre);
        if (!id || seenIds.has(id)) continue;
        seenIds.add(id);
        uniq.push(p);
      }
      const randomProducts = uniq.sort(() => Math.random() - 0.5).slice(0, 3);
      const productNames = randomProducts.map(p => p.nombre || p.name).filter(Boolean);
      
      if (productNames.length >= 2) {
        const names = productNames.slice(0, 2);
        // Respuesta conversacional, no lista
        fallbackText = `¿Buscás ${names[0]} o ${names[1]}? Tenemos varias opciones disponibles.`;
      } else if (productNames.length === 1) {
        fallbackText = `¿Te interesa una ${productNames[0]}? O podés contarme qué buscás.`;
      } else {
        fallbackText = 'Contame qué estás buscando y te ayudo a encontrarlo.';
      }
    } else {
      fallbackText = 'Contame qué buscás y te muestro lo que tenemos disponible.';
    }
    
    return {
      text: fallbackText,
      products: [],
      intent: 'fallback',
      actions: [],
    };
  };
  
  const FALLBACK = buildFallback();

  // ── 1. Direct response ───────────────────────────────────────────────────
  const directOptions = DIRECT_RESPONSES[intent];
  if (directOptions) {
    log('info', 'Decision: direct response', { intent });
    return {
      text: pickRandom(directOptions),
      products: [],
      intent,
      actions: [],
      source: 'direct',
    };
  }

  // ── 2. Cache hit ─────────────────────────────────────────────────────────
  if (useCache && cache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      log('info', 'Decision: cache hit', { intent });
      return { ...cached, source: 'cache' };
    }
  }

  // ── 3. Plugins ───────────────────────────────────────────────────────────
  const pluginCtx = { intent, conversationHistory };
  const pluginMatch = await runPlugins(message, dependencies, pluginCtx, plugins);

  if (pluginMatch) {
    log('info', `Decision: plugin "${pluginMatch.pluginName}"`, { intent });
    const result = { ...pluginMatch.result, intent, source: 'plugin' };

    if (useCache && cache) cache.set(cacheKey, result);
    return result;
  }

  // ── 4. RAG (AI grounded in product data) ─────────────────────────────────
  if (useAI && aiService && typeof dependencies.getProducts === 'function') {
    try {
      log('info', 'Decision: RAG', { intent });
      const rag = await executeRAG(message, dependencies, aiService, {
        maxProducts,
        conversationHistory,
      });

      // If products found, show them. No need for AI fluff.
      if (rag.products && rag.products.length > 0) {
        // Dedupe rag.products just in case and normalise fields
        const seenIds2 = new Set();
        const productsClean = [];
        for (const p of rag.products) {
          if (!p.id || seenIds2.has(p.id)) continue;
          seenIds2.add(p.id);
          productsClean.push({ id: String(p.id), name: p.name || p.nombre || 'Producto', price: p.price || 0, url: p.url || '', image: p.image || '' });
        }

        const result = {
          text: rag.text,
          products: productsClean,
          intent,
          actions: productsClean.map((p) => ({ type: 'view_product', label: `Ver ${p.name}`, url: p.url })),
          source: 'rag',
        };

        if (useCache && cache) cache.set(cacheKey, result);
        return result;
      }

      // No products found. If intent is product-related, return fallback instead of AI.
      // This prevents Pure AI from making up suggestions.
      if (intent === 'product_search' || intent === 'product_recommendation') {
        log('info', 'RAG found no products for product-related query - using fallback');
        if (useCache && cache) cache.set(cacheKey, FALLBACK);
        return FALLBACK;
      }

      // For OTHER intents: also use fallback to avoid generic AI babble
      // This ensures ONLY products from BD are recommended, no made-up content
      log('info', 'RAG returned no products - using fallback instead of Pure AI');
      if (useCache && cache) cache.set(cacheKey, FALLBACK);
      return FALLBACK;
    } catch (err) {
      log('warn', 'RAG failed, using fallback', { error: err.message });
      return FALLBACK;
    }
  }

  // ── 5. No Pure AI - only use what's in the database ─────────────────────
  // If RAG didn't find products, return fallback. Never generate made-up content.
  log('info', 'No RAG available - using fallback');
  return FALLBACK;
}

module.exports = { decide };
