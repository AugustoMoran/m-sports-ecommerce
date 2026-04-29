const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/src/controllers/chatController.js');

const content = `/**
 * src/controllers/chatController.js
 *
 * Integrates the AI Engine with this project's MongoDB Product model.
 *
 * DESIGN DECISION: This controller is the only place that knows about both
 * the engine AND the database. It acts as the adapter layer:
 *
 *   MongoDB Product (Spanish fields) ──► normalised dependency functions ──► AI Engine
 *
 * The engine receives plain functions — it never imports mongoose or Product directly.
 */

const Product = require('../models/Product');
const { fuzzyMatch } = require('../../ai-ecommerce-engine/utils/fuzzyMatch');
const {
  createAIEngine,
  createRecommendationPlugin,
  createAnalyticsPlugin,
} = require('../../ai-ecommerce-engine');

// ─── Engine initialisation (singleton) ───────────────────────────────────────

const analyticsPlugin = createAnalyticsPlugin({
  onEvent: process.env.NODE_ENV === 'development' ? async () => {} : null,
});

const recommendationPlugin = createRecommendationPlugin({
  maxRecommendations:    4,
  priceTolerancePercent: 35,
  productPoolSize:       30,
});

const engine = createAIEngine({
  mode:             process.env.AI_ENGINE_MODE || 'balanced',
  provider:         process.env.AI_PROVIDER   || 'gemini',
  fallbackProvider: process.env.AI_FALLBACK   || 'huggingface',
  fallbackEnabled:  process.env.AI_FALLBACK   ? true : false,
  useCache:         true,
  cacheTTL:         5 * 60 * 1000,
  maxProducts:      5,
  maxAIRequestsPerMinute: Number(process.env.AI_RPM) || 20,

  geminiApiKey:      process.env.GEMINI_API_KEY,
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
  openaiApiKey:      process.env.OPENAI_API_KEY,

  plugins: [recommendationPlugin, analyticsPlugin],
});

// ─── Dependency adapter ───────────────────────────────────────────────────────

function buildDependencies() {
  const getProducts = async (query, opts = {}) => {
    const limit = Math.min(opts.limit || 10, 50);

    console.log('[getProducts] Query:', query, 'Limit:', limit);

    const ofertaRegex = /(oferta|descuento|promocion|promoción|rebaja|sale|liquidación)/i;
    const filtrarOferta = ofertaRegex.test(query);

    if (!query || query.trim().length === 0 || query.toLowerCase().match(/^(todos?|catalogo|catálogo|lista)$/i)) {
      let all = await Product.find({ isActive: true, deletedAt: null })
        .select('_id nombre descripcion precio precioOferta stock imagenes tags vendidos isActive')
        .populate('categoria', 'nombre')
        .limit(limit)
        .lean();
      if (filtrarOferta) all = all.filter(p => p.precioOferta != null);
      return all;
    }

    if (query.trim().length < 2) return [];

    const searchTerms = query.toLowerCase().split(/\\s+/).filter(t => t.length > 0);
    const expandedTerms = [];
    for (const term of searchTerms) {
      expandedTerms.push(term);
      if (term.endsWith('s') && term.length > 3) expandedTerms.push(term.slice(0, -1));
      if (!term.endsWith('s')) expandedTerms.push(term + 's');
    }

    console.log('[getProducts] Expanded search terms:', expandedTerms);

    let allProducts = await Product.find({ isActive: true, deletedAt: null })
      .select('_id nombre descripcion precio precioOferta stock imagenes tags vendidos isActive')
      .populate('categoria', 'nombre')
      .lean();

    if (filtrarOferta) allProducts = allProducts.filter(p => p.precioOferta != null);

    const allProductNames = allProducts.map(p => p.nombre);
    const fuzzyExpandedTerms = expandedTerms.flatMap(term => {
      const m = fuzzyMatch(term, allProductNames, 0.65);
      return m.length > 0 ? m : [term];
    });

    console.log('[getProducts] Fuzzy-expanded terms:', fuzzyExpandedTerms);

    return allProducts.filter(p => {
      const n = fuzzyExpandedTerms.some(t => p.nombre.toLowerCase().includes(t.toLowerCase()));
      const d = p.descripcion && fuzzyExpandedTerms.some(t => p.descripcion.toLowerCase().includes(t.toLowerCase()));
      const g = p.tags && fuzzyExpandedTerms.some(t => p.tags.some(tag => tag.toLowerCase().includes(t.toLowerCase())));
      return n || d || g;
    }).slice(0, limit);
  };

  const getProductById = async (id) =>
    Product.findOne({ _id: id, isActive: true, deletedAt: null }).populate('categoria', 'nombre').lean();

  const searchProductsSemantic = async (query, opts = {}) => getProducts(query, opts);

  const getAvailableProducts = async (limit = 50) => {
    try {
      const products = await Product.find({ isActive: true, deletedAt: null })
        .select('_id nombre precio precioOferta stock imagenes tags vendidos')
        .populate('categoria', 'nombre')
        .limit(limit)
        .lean();
      return products.map(p => ({
        id: p._id,
        nombre: p.nombre,
        precio: p.precioOferta || p.precio,
        stock: p.stock,
        tags: p.tags || [],
        categoria: p.categoria?.nombre,
      }));
    } catch (err) {
      return [];
    }
  };

  return { getProducts, getProductById, searchProductsSemantic, getAvailableProducts };
}

// ─── Route handlers ───────────────────────────────────────────────────────────

async function handleChat(req, res) {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'El campo "message" es requerido.' });
  }

  const dependencies = buildDependencies();

  // Fetch all active products (with imagenes) for price-sort operations
  const allActive = await Product.find({ isActive: true, deletedAt: null })
    .select('_id nombre precio precioOferta stock imagenes tags vendidos')
    .populate('categoria', 'nombre')
    .lean();

  const msg = message.trim();

  // Helper: DB product → outgoing JSON shape
  function toOut(p) {
    const id    = String(p._id || p.id || '').trim();
    const name  = String(p.nombre || p.name || '').trim();
    const price = Number(p.precioOferta || p.precio || p.price || 0) || 0;
    const image = (p.imagenes && p.imagenes[0] && p.imagenes[0].url) || p.image || '';
    const url   = p.url || (id ? '/producto/' + id : '');
    return { id, name, price, image, url };
  }

  // Normalize common typos/variants before intent detection
  const msgNorm = msg
    .toLowerCase()
    .replace(/\\bvermudas?\\b/g, 'bermuda')
    .replace(/\\bpolo[s]?\\b/g, 'remera')
    .replace(/\\btops?\\b/g, 'remera')
    .replace(/\\btelefono[s]?\\b/g, 'celular')
    .replace(/\\bteléfono[s]?\\b/g, 'celular')
    .replace(/\\bzapatillas?\\b/g, 'zapatilla');

  // Known product category keywords (for category-scoped price filtering and honest "not found")
  const PRODUCT_KEYWORDS = [
    'remera', 'remeras', 'camiseta', 'camisetas',
    'pantalon', 'pantalones', 'jean', 'jeans', 'jogger', 'jogging', 'calza',
    'zapatilla', 'zapatillas', 'zapato', 'zapatos', 'bota', 'botas', 'calzado',
    'buzo', 'buzos', 'campera', 'camperas', 'rompeviento', 'parka',
    'short', 'shorts', 'bermuda', 'bermudas',
    'gorra', 'gorras', 'medias', 'mochila', 'mochilas', 'rinonera',
    'camisa', 'camisas', 'vestido', 'vestidos', 'abrigo', 'abrigos', 'chaleco',
    'libro', 'libros', 'lapicera', 'lapiceras', 'goma', 'regla', 'tijera',
    'celular', 'celulares', 'electronico', 'electronicos',
    'accesorio', 'accesorios', 'bolso', 'bolsos', 'cartera', 'carteras',
    'perfume', 'perfumes', 'crema', 'shampoo',
  ];

  function extractProductKeyword(text) {
    for (const kw of PRODUCT_KEYWORDS) {
      if (new RegExp('\\\\b' + kw + '\\\\b').test(text)) return kw;
    }
    return null;
  }

  const productKeyword = extractProductKeyword(msgNorm);

  // ── Intent flags ────────────────────────────────────────────────────────────
  const isAvoid     = /\\bno (lo m[aá]s barato|m[aá]s barato|barat[ao])\\b/i.test(msg);
  const isPriceLow  = !isAvoid && /\\b(lo m[aá]s barato|m[aá]s barato|de menor (valor|precio)|m[aá]s econ[oó]mico|barat[ao]s?|econ[oó]mic[ao]s?|m[aá]s barat[ao])\\b/i.test(msg);
  const isPriceHigh = /\\b(lo m[aá]s caro|m[aá]s caro|m[aá]s car[ao]|caro|costoso|premium)\\b/i.test(msg);
  const isGift      = /\\b(regalar|regalo|regalos|de regalo|para regalar)\\b/i.test(msg);
  const isCatalog   = /\\b(qu[eé] tienen|qu[eé] tien[eé]s|qu[eé] hay|disponible|cat[aá]logo|mostrame todo|todo lo que tienen|qu[eé] venden|qu[eé] ofrecen|tenés algo|tienen algo)\\b/i.test(msg);
  const isRecommend = /\\b(recomend|suger|qu[eé] me d[aá]s|qu[eé] me mostr[aá]s|qu[eé] me suger[ií]s)\\b/i.test(msg);
  const isCompare   = /\\b(compar[aá]|versus|vs\\.?)\\b/i.test(msg);

  let selected = [];
  let intent   = 'unknown';
  let text     = '';

  // ── 1. Avoid cheapest ──────────────────────────────────────────────────────
  if (isAvoid) {
    const sorted = allActive.slice()
      .sort((a, b) => (Number(a.precioOferta||a.precio||Infinity)) - (Number(b.precioOferta||b.precio||Infinity)));
    selected = sorted.slice(1, 5);
    intent   = 'avoid_cheapest';
    text     = selected.length ? 'Aca van opciones por encima de la mas barata:' : 'No encontre alternativas';

  // ── 2. Category + price ("la remera mas barata") ──────────────────────────
  } else if ((isPriceLow || isPriceHigh) && productKeyword) {
    const results = await dependencies.getProducts(productKeyword, { limit: 20 });
    if (results.length === 0) {
      return res.json({
        text: 'No tenemos ' + productKeyword + 's en este momento',
        products: [],
        intent: 'no_results',
        actions: [],
      });
    }
    results.sort((a, b) => isPriceLow
      ? (Number(a.precioOferta||a.precio||Infinity)) - (Number(b.precioOferta||b.precio||Infinity))
      : (Number(b.precioOferta||b.precio||0))       - (Number(a.precioOferta||a.precio||0)));
    const wantsOne = isPriceLow
      ? /\\blo m[aá]s barato\\b|\\bm[aá]s barat[ao]\\b/i.test(msg)
      : /\\blo m[aá]s caro\\b|\\bm[aá]s car[ao]\\b/i.test(msg);
    selected = results.slice(0, wantsOne ? 1 : 3);
    intent   = isPriceLow ? 'filter_price_low' : 'filter_price_high';
    const adj = isPriceLow
      ? (wantsOne ? 'la mas barata' : 'las mas baratas')
      : (wantsOne ? 'la mas cara'   : 'las mas caras');
    text = 'Aca ' + (wantsOne ? 'esta' : 'estan') + ' ' + adj + ' en ' + productKeyword + ':';

  // ── 3. Global price low ────────────────────────────────────────────────────
  } else if (isPriceLow) {
    const sorted = allActive.slice()
      .sort((a, b) => (Number(a.precioOferta||a.precio||Infinity)) - (Number(b.precioOferta||b.precio||Infinity)));
    const wantsOne = /\\blo m[aá]s barato\\b/i.test(msg);
    selected = sorted.slice(0, wantsOne ? 1 : 3);
    intent   = 'filter_price_low';
    text     = selected.length
      ? (wantsOne ? 'Aca esta el mas barato:' : 'Aca estan las opciones mas economicas:')
      : 'No encontre productos';

  // ── 4. Global price high ───────────────────────────────────────────────────
  } else if (isPriceHigh) {
    const sorted = allActive.slice()
      .sort((a, b) => (Number(b.precioOferta||b.precio||0)) - (Number(a.precioOferta||a.precio||0)));
    const wantsOne = /\\blo m[aá]s caro\\b/i.test(msg);
    selected = sorted.slice(0, wantsOne ? 1 : 3);
    intent   = 'filter_price_high';
    text     = selected.length
      ? (wantsOne ? 'Aca esta el mas caro:' : 'Las opciones mas premium:')
      : 'No encontre productos';

  // ── 5. Gift recommendations ────────────────────────────────────────────────
  } else if (isGift) {
    const sorted = allActive.slice().sort((a, b) => Number(b.vendidos||0) - Number(a.vendidos||0));
    selected = sorted.slice(0, 4);
    intent   = 'recommend';
    text     = selected.length ? 'Para regalar, te recomiendo estas opciones populares:' : 'No encontre productos';

  // ── 6. Catalog browse ("que tienen disponible?") ──────────────────────────
  } else if (isCatalog) {
    const sorted = allActive.slice().sort((a, b) => Number(b.vendidos||0) - Number(a.vendidos||0));
    selected = sorted.slice(0, 4);
    intent   = 'catalog';
    text     = selected.length ? 'Aca van algunos de nuestros productos mas populares:' : 'No tenemos productos disponibles por el momento';

  // ── 7. General recommendation ─────────────────────────────────────────────
  } else if (isRecommend) {
    const sorted = allActive.slice().sort((a, b) => Number(b.vendidos||0) - Number(a.vendidos||0));
    selected = sorted.slice(0, 4);
    intent   = 'recommend';
    text     = selected.length ? 'Te dejo las opciones mas populares:' : 'No encontre productos';

  // ── 8. Compare ────────────────────────────────────────────────────────────
  } else if (isCompare) {
    const results = await dependencies.getProducts(msg, { limit: 3 });
    selected = results.length ? results : allActive.slice()
      .sort((a, b) => (Number(a.precioOferta||a.precio||Infinity)) - (Number(b.precioOferta||b.precio||Infinity)))
      .slice(0, 3);
    intent   = 'compare';
    text     = selected.length ? 'Compara estas opciones:' : 'No encontre productos para comparar';

  // ── 9. Generic search ─────────────────────────────────────────────────────
  } else {
    const results = await dependencies.getProducts(msg, { limit: 4 });
    if (results.length > 0) {
      selected = results;
      intent   = 'search';
      text     = 'Encontre estos productos:';
    } else if (productKeyword) {
      // Specific product searched but not in catalog → honest answer
      return res.json({
        text: 'No tenemos ' + productKeyword + 's en este momento',
        products: [],
        intent: 'no_results',
        actions: [],
      });
    } else {
      // Vague / greeting / gibberish → show popular as soft catalog
      const sorted = allActive.slice().sort((a, b) => Number(b.vendidos||0) - Number(a.vendidos||0));
      selected = sorted.slice(0, 3);
      intent   = selected.length ? 'catalog' : 'no_results';
      text     = selected.length ? 'Aca van algunos de nuestros productos mas populares:' : 'No encontre productos con ese criterio';
    }
  }

  if (selected.length === 0) {
    return res.json({ text: 'No encontre productos con ese criterio', products: [], intent: 'no_results', actions: [] });
  }

  const outProducts = selected.slice(0, 4).map(toOut);
  const actions = outProducts.map(p => ({ type: 'view_product', label: 'Ver ' + p.name, url: p.url }));

  return res.json({ text, products: outProducts, intent, actions });
}

/**
 * GET /api/chat/stats
 */
function getChatStats(req, res) {
  res.json(engine.getStats());
}

/**
 * GET /api/chat/analytics
 */
function getChatAnalytics(req, res) {
  res.json(analyticsPlugin.getReport());
}

/**
 * DELETE /api/chat/cache
 */
function clearChatCache(req, res) {
  engine.clearCache();
  res.json({ message: 'Cache del chat limpiado correctamente.' });
}

module.exports = {
  handleChat,
  getChatStats,
  getChatAnalytics,
  clearChatCache,
};
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done. Lines:', content.split('\n').length);
