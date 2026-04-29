/**
 * core/ragService.js — Retrieval-Augmented Generation
 *
 * DESIGN DECISION: The engine never touches the database directly.
 * Product data is fetched through injected `getProducts` and
 * `searchProductsSemantic` functions provided by the host application.
 * This keeps the engine 100% decoupled from any ORM or DB driver.
 *
 * RAG flow:
 *  1. Fetch relevant products via dependency injection
 *  2. Normalise product shape (handles Spanish & English field names)
 *  3. Build a grounded prompt (AI can only reference what's in context)
 *  4. Send to AI service → return structured result
 */

const { buildRAGPrompt } = require('./prompts');
const { log } = require('./logger');

// ─── Product normaliser ───────────────────────────────────────────────────────
/**
 * Normalises a product from any data source into a consistent shape.
 * Supports both the Spanish field names used in this project and common English names.
 *
 * @param {Object} raw - Raw product document from DB / API
 * @returns {Object} Normalised product
 */
function normalizeProduct(raw) {
  return {
    id:          String(raw._id || raw.id || ''),
    name:        raw.nombre    || raw.name        || 'Producto sin nombre',
    description: raw.descripcion || raw.description || '',
    price:       Number(raw.precio ?? raw.price ?? 0),
    salePrice:   raw.precioOferta != null ? Number(raw.precioOferta) : (raw.salePrice != null ? Number(raw.salePrice) : null),
    stock:       Number(raw.stock ?? 1),
    category:    raw.categoria || raw.category     || '',
    // Supports both array-of-objects (imagenes[].url) and plain strings
    image:       raw.imagenes?.[0]?.url || raw.image || raw.imageUrl || raw.imagen || '',
    url:         raw.slug      || raw.url          || '',
    tags:        raw.tags      || [],
    sales:       raw.vendidos  || raw.sales        || 0,
    featured:    raw.isFeatured || raw.featured     || false,
  };
}

// ─── Context builder ──────────────────────────────────────────────────────────
/**
 * Fetches and normalises products for the RAG context window.
 *
 * @param {string}   query        - User's search query
 * @param {Object}   dependencies - Injected data functions
 * @param {number}   maxProducts  - Max products to include in context
 * @returns {Promise<Object[]>}   Array of normalised products
 */
async function fetchProductContext(query, dependencies, maxProducts = 5) {
  const { getProducts, searchProductsSemantic } = dependencies;

  if (typeof getProducts !== 'function') {
    throw new Error('[AI-ENGINE] RAG requires a "getProducts" dependency function.');
  }

  try {
    // Prefer semantic search if available (vector embeddings, Atlas Search, etc.)
    const fetchFn = typeof searchProductsSemantic === 'function'
      ? searchProductsSemantic
      : getProducts;

    const raw = await fetchFn(query, { limit: maxProducts });

    if (!Array.isArray(raw) || raw.length === 0) return [];

    return raw.slice(0, maxProducts).map(normalizeProduct);
  } catch (err) {
    log('warn', 'RAG product fetch failed', { error: err.message });
    return [];
  }
}

// ─── RAG execution ────────────────────────────────────────────────────────────
/**
 * Full RAG pipeline: fetch products → build prompt → generate response.
 *
 * @param {string}   message      - User message
 * @param {Object}   dependencies - Injected { getProducts, searchProductsSemantic }
 * @param {Object}   aiService    - AI service instance { generateResponse }
 * @param {Object}   [options]
 * @param {number}   [options.maxProducts=5]
 * @param {Array}    [options.conversationHistory=[]]
 * @returns {Promise<{ text: string, products: Object[], usedRAG: boolean }>}
 */
async function executeRAG(message, dependencies, aiService, options = {}) {
  const { maxProducts = 5, conversationHistory = [] } = options;

  log('info', 'Executing RAG pipeline', { query: message.slice(0, 50) });

  // 1. Retrieve
  const products = await fetchProductContext(message, dependencies, maxProducts);

  // 2. Augment — build grounded prompt
  const prompt = buildRAGPrompt(message, products, conversationHistory);

  // 3. Generate — AI is strictly constrained to the context
  const aiText = await aiService.generateResponse(prompt, { products });

  // Return normalised shape for consumption by decisionEngine
  // Dedupe products by id to avoid duplicates in responses
  const deduped = [];
  const seen = new Set();
  for (const p of products) {
    if (!p.id || seen.has(p.id)) continue;
    seen.add(p.id);
    deduped.push({ id: p.id, name: p.name, price: p.price, url: p.url, image: p.image });
  }

  return {
    text: aiText,
    products: deduped,
    usedRAG: true,
  };
}

module.exports = { executeRAG, fetchProductContext, normalizeProduct };
