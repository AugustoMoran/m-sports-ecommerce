/**
 * core/intentDetector.js — Intent classification without AI
 *
 * DESIGN DECISION: Keyword detection runs first, always, at zero cost.
 * AI classification is an optional upgrade (smart mode only) and only
 * triggers when keyword matching returns 'fallback'.
 *
 * Intent taxonomy:
 *   greeting            — salutations, hellos
 *   product_search      — looking for a specific product
 *   product_recommendation — asking for suggestions
 *   price_query         — asking about pricing
 *   stock_check         — asking about availability
 *   order_status        — asking about an existing order
 *   fallback            — everything else
 */

const { log } = require('./logger');

// ─── Product cache ────────────────────────────────────────────────────────────
// Lazy-loaded: initialized when first chat message arrives, not on server start
let productKeywordCache = [];
let cacheExpiry = 0;
let Product = null; // Lazy import to avoid circular deps

/**
 * Lazy imports Product model only when needed
 */
function initProductModel() {
  if (!Product) {
    try {
      Product = require('../../models/Product');
    } catch (err) {
      log('warn', 'Could not load Product model for fuzzy search', { error: err.message });
    }
  }
  return Product;
}

/**
 * Gets cached product keywords, refreshing if > 5 minutes old.
 * Falls back gracefully if Product model unavailable.
 */
async function getProductKeywords() {
  const now = Date.now();
  
  // Return cached if valid
  if (cacheExpiry > now && productKeywordCache.length > 0) {
    log('debug', 'Using cached product keywords', { count: productKeywordCache.length });
    return productKeywordCache;
  }

  // Try to refresh from DB
  try {
    const ProductModel = initProductModel();
    if (!ProductModel) {
      return productKeywordCache; // Return stale cache if model unavailable
    }

    const products = await ProductModel.find({}, 'nombre descripcion tags');
    
    productKeywordCache = [];
    
    // Collect all keywords
    products.forEach(p => {
      if (p.nombre) {
        productKeywordCache.push({
          keyword: p.nombre.toLowerCase().trim(),
          type: 'nombre',
          _id: p._id
        });
      }
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(tag => {
          productKeywordCache.push({
            keyword: tag.toLowerCase().trim(),
            type: 'tag',
            _id: p._id
          });
        });
      }
    });

    cacheExpiry = now + 5 * 60 * 1000; // Cache for 5 minutes
    log('debug', 'Refreshed product keywords cache', { count: productKeywordCache.length });
    return productKeywordCache;
  } catch (err) {
    log('warn', 'Failed to load product keywords from DB', { error: err.message });
    return productKeywordCache; // Return stale cache on error
  }
}

/**
 * Searches products by fuzzy matching on keywords extracted from message.
 * Returns 'product_search' if any keyword matches, 'fallback' otherwise.
 */
async function detectProductByFuzzySearch(normalizedMessage) {
  try {
    // Get cached keywords (async, needs await)
    const productKeywords = await getProductKeywords();
    
    // Extract search terms from message (words > 3 chars)
    const messageTerms = normalizedMessage
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (messageTerms.length === 0) {
      return 'fallback';
    }
    if (productKeywords.length === 0) {
      return 'fallback';
    }

    // Check if any message term matches any product keyword
    for (const term of messageTerms) {
      for (const pkw of productKeywords) {
        // Fuzzy matching: term is substring of keyword or vice versa (soft match)
        // or exact match of first 3 chars (fuzzy match)
        if (
          pkw.keyword.includes(term) ||
          term.includes(pkw.keyword) ||
          pkw.keyword.startsWith(term.substring(0, 3))
        ) {
          log('debug', `Product detected by fuzzy search: "${pkw.keyword}"`, {
            messageTerms,
            matchType: pkw.type
          });
          return 'product_search';
        }
      }
    }

    return 'fallback';
  } catch (err) {
    log('warn', 'Fuzzy product search failed, using keywords only', { error: err.message });
    return 'fallback';
  }
}

// ─── Keyword maps ─────────────────────────────────────────────────────────────
// Each intent has an array of trigger keywords/phrases (lowercase, no accents).
// Partial matches are supported (e.g. "recomiend" matches "recomiendame", "recomiendas").
const INTENT_KEYWORDS = {
  greeting: [
    'hola', 'hi', 'hello', 'buenas', 'buenos dias', 'buenas tardes',
    'buenas noches', 'buen dia', 'hey', 'ey', 'saludos',
    'como estas', 'good morning', 'good afternoon', 'buenos',
  ],

  product_search: [
    'busco', 'buscar', 'encontrar', 'quiero', 'necesito', 'tiene', 'tienen',
    'hay ', 'teneis', 'vendeis', 'venden', 'muestrame', 'mostrar', 'ver ',
    'search', 'find', 'looking for', 'do you have', 'show me', 'dame',
    'quiero ver', 'me interesa', 'zapato', 'zapatos', 'zapatilla', 'zapatillas',
    'remera', 'remeras', 'pants', 'camiseta', 'camisetas', 'buzo', 'buzos',
    'abrigo', 'abrigos', 'campera', 'camperas', 'falda', 'faldas', 'blusa', 'blusas', 'vestido', 'vestidos',
    'todos los', 'todo', 'catalogo', 'catálogo', 'lista de',
    'celular', 'celulares', 'telefono', 'telefonos', 'laptop', 'computadora',
    'tablet', 'smartwatch', 'auriculares', 'monitor', 'teclado', 'mouse',
  ],

  product_recommendation: [
    'recomiend', 'sugerencia', 'sugerir', 'que me recomiendas', 'cual es mejor',
    'mejor opcion', 'mejor producto', 'que compro', 'que me compro',
    'recommend', 'suggest', 'best ', 'popular', 'mas vendido', 'destacado',
    'que esta de moda', 'tendencia', 'que llevan', 'que usan',
    'algo para', 'regalo', 'frio', 'calor', 'calentar', 'abrigarse',
    'lluvia', 'verano', 'invierno', 'primavera', 'otoño',
  ],

  price_query: [
    'precio', 'cuanto cuesta', 'cuanto sale', 'costo', 'vale ', 'cuanto vale',
    'cuanto es', 'tarifa', 'precio de', 'precio del', 'cuanto cobran',
    'price', 'cost', 'how much', 'que precio', 'barato', 'economico',
    'oferta', 'descuento', 'promocion',
  ],

  stock_check: [
    'stock', 'disponible', 'en stock', 'tenes', 'queda ', 'quedan ',
    'agotado', 'out of stock', 'availability', 'available', 'hay stock',
    'cuando llega', 'cuando tienen', 'podras conseguir',
  ],

  order_status: [
    'pedido', 'orden', 'order', 'compra', 'donde esta', 'seguimiento',
    'tracking', 'enviado', 'entrega', 'delivery', 'estado de', 'llego',
    'cuando llega', 'numero de pedido',
  ],
};

// ─── Text normalisation ───────────────────────────────────────────────────────
/**
 * Normalises a message for keyword matching.
 * Lowercases, removes accents, strips punctuation, collapses whitespace.
 */
function normalizeMessage(message) {
  return message
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^\w\s]/g, ' ')        // punctuation → space
    .replace(/\s+/g, ' ');           // collapse spaces
}

// ─── Keyword scoring ──────────────────────────────────────────────────────────
/**
 * Scores each intent by counting keyword matches.
 * Returns the intent with the highest score, or 'fallback' if no match.
 */
function detectIntentByKeywords(normalizedText) {
  const scores = {};

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    scores[intent] = 0;
    for (const kw of keywords) {
      if (normalizedText.includes(kw)) {
        // Longer keywords get a higher weight (more specific = more confident)
        scores[intent] += kw.length > 6 ? 2 : 1;
      }
    }
  }

  const best = Object.entries(scores).reduce(
    (top, [intent, score]) => (score > top.score ? { intent, score } : top),
    { intent: 'fallback', score: 0 }
  );

  return best.score > 0 ? best.intent : 'fallback';
}

// ─── Main detector ────────────────────────────────────────────────────────────
/**
 * Detects the intent of a user message.
 * Keyword detection runs first (free). AI classification runs only if:
 *   - keyword result is 'fallback'
 *   - useAIClassification = true
 *   - aiClassifier function is provided
 *
 * @param {string}   message
 * @param {Object}   [options]
 * @param {boolean}  [options.useAIClassification=false]
 * @param {Function} [options.aiClassifier]  async (message) => intentString
 * @returns {Promise<{ intent: string, method: 'keywords'|'ai', normalized: string }>}
 */
async function detectIntent(message, options = {}) {
  const { useAIClassification = false, aiClassifier = null } = options;

  const normalized = normalizeMessage(message);
  // Heuristic: if user asks "algo para X" or mentions "regalo", prefer recommendation intent
  if (/\balgo para\b/.test(normalized) || /\bpara\s+(regalo|cumple|navidad|aniversario|regalos?)\b/.test(normalized)) {
    log('debug', `Intent heuristic matched: product_recommendation`, { normalized });
    return { intent: 'product_recommendation', method: 'heuristic', normalized };
  }
  const keywordIntent = detectIntentByKeywords(normalized);

  // Keyword result is confident — use it
  if (keywordIntent !== 'fallback') {
    log('debug', `Intent via keywords: ${keywordIntent}`, { normalized });
    return { intent: keywordIntent, method: 'keywords', normalized };
  }

  // Try fuzzy product search (zero cost, looks at product DB)
  const fuzzyIntent = await detectProductByFuzzySearch(normalized);
  if (fuzzyIntent === 'product_search') {
    log('debug', `Intent via fuzzy product search: product_search`, { normalized });
    return { intent: 'product_search', method: 'fuzzy', normalized };
  }

  // Try AI classification (smart mode only, avoids unnecessary API calls)
  if (useAIClassification && typeof aiClassifier === 'function') {
    try {
      const rawIntent = await aiClassifier(message);
      const validIntents = [...Object.keys(INTENT_KEYWORDS), 'fallback'];
      const aiIntent = validIntents.includes(rawIntent?.trim()) ? rawIntent.trim() : 'fallback';
      log('debug', `Intent via AI: ${aiIntent}`, { normalized });
      return { intent: aiIntent, method: 'ai', normalized };
    } catch (err) {
      log('warn', 'AI intent classification failed, using fallback', { error: err.message });
    }
  }

  log('debug', 'Intent: fallback', { normalized });
  return { intent: 'fallback', method: 'keywords', normalized };
}

module.exports = { detectIntent, normalizeMessage, detectIntentByKeywords, getProductKeywords };
