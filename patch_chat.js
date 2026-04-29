const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/src/controllers/chatController.js');
let src = fs.readFileSync(filePath, 'utf8');

// Find the start of handleChat
const startMarker = 'async function handleChat(req, res) {';
const startIdx = src.indexOf(startMarker);
if (startIdx === -1) { console.error('Could not find handleChat'); process.exit(1); }

// Find module.exports after handleChat
const exportsMarker = '\nmodule.exports = {';
const exportsIdx = src.indexOf(exportsMarker, startIdx);
if (exportsIdx === -1) { console.error('Could not find module.exports'); process.exit(1); }

const PRODUCT_KEYWORDS = [
  'remera','camiseta','camiseta',
  'pantalon','pantalones','jean','jeans','jogger',
  'zapatilla','zapato','bota',
  'buzo','campera','rompeviento',
  'short','bermuda','
  'gorra','medias','mochila',
  'camisa','vestido','abrigo','chaleco',
  'libro','lapicera','goma','regla','tijera',
  'celular','telefono','electronico',
  'accesorio','bolso','cartera',
].join("','");

const newHandleChat = `async function handleChat(req, res) {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'El campo "message" es requerido.' });
  }

  const dependencies = buildDependencies();

  // Fetch all active products (full data with imagenes) for price-sort use cases
  const allActive = await Product.find({ isActive: true, deletedAt: null })
    .select('_id nombre precio precioOferta stock imagenes tags vendidos')
    .populate('categoria', 'nombre')
    .lean();

  const msg = message.trim();

  // Helper: map a DB product to the outgoing JSON shape
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
    .replace(/\\bvermuda[s]?\\b/g, 'bermuda')
    .replace(/\\bvermud[o]?\\b/g, 'bermuda')
    .replace(/\\bbombacha[s]?\\b/g, 'pantalon')
    .replace(/\\bpolo[s]?\\b/g, 'remera')
    .replace(/\\btop[s]?\\b/g, 'remera')
    .replace(/\\bteléfono[s]?\\b/g, 'celular')
    .replace(/\\btelefono[s]?\\b/g, 'celular');

  // Known product category keywords (used for category-scoped filtering)
  const PRODUCT_KEYWORDS = [
    'remera','remeras','camiseta','camisetas',
    'pantalon','pantalones','jean','jeans','jogger','jogging',
    'zapatilla','zapatillas','zapato','zapatos','bota','botas','calzado',
    'buzo','buzos','campera','camperas','rompeviento',
    'short','shorts','bermuda','bermudas',
    'gorra','gorras','medias','mochila','mochilas',
    'camisa','camisas','vestido','vestidos','abrigo','abrigos','chaleco',
    'libro','libros','lapicera','lapiceras','goma','regla','tijera',
    'celular','celulares','telefono','electronico','electronicos',
    'accesorio','accesorios','bolso','bolsos','cartera','carteras',
  ];

  function extractProductKeyword(text) {
    for (const kw of PRODUCT_KEYWORDS) {
      if (new RegExp('\\\\b' + kw + '\\\\b').test(text)) return kw;
    }
    return null;
  }

  const productKeyword = extractProductKeyword(msgNorm);

  // ── Intent flags ────────────────────────────────────────────────────────────
  const isAvoid    = /\\bno (lo m[aá]s barato|m[aá]s barato|barat[ao])\\b/i.test(msg);
  const isPriceLow = !isAvoid && /\\b(lo m[aá]s barato|m[aá]s barato|de menor (valor|precio)|m[aá]s econ[oó]mico|barat[ao]s?|econ[oó]mic[ao]s?|m[aá]s barat[ao])\\b/i.test(msg);
  const isPriceHigh = /\\b(lo m[aá]s caro|m[aá]s caro|m[aá]s car[ao]|caro|costoso|premium)\\b/i.test(msg);
  const isGift     = /\\b(regalar|regalo|regalos|de regalo|para regalar)\\b/i.test(msg);
  const isCatalog  = /\\b(qu[eé] tienen|qu[eé] tien[eé]s|qu[eé] hay|disponible|cat[aá]logo|mostrame todo|todo lo que tienen|qu[eé] venden|qu[eé] ofrecen)\\b/i.test(msg);
  const isRecommend = /\\b(recomend|suger|qu[eé] me d[aá]s|qu[eé] me mostr[aá]s)\\b/i.test(msg);
  const isCompare  = /\\b(compar[aá]|versus|vs\\.?)\\b/i.test(msg);

  let selected = [];
  let intent = 'unknown';
  let text = '';

  // ── 1. Avoid cheapest ──────────────────────────────────────────────────────
  if (isAvoid) {
    const sorted = allActive.slice().sort((a, b) =>
      (Number(a.precioOferta||a.precio||Infinity)) - (Number(b.precioOferta||b.precio||Infinity)));
    selected = sorted.slice(1, 5);
    intent = 'avoid_cheapest';
    text = selected.length ? 'Aca van opciones por encima de la mas barata:' : 'No encontre alternativas';

  // ── 2. Category + Price (e.g., "la remera mas barata") ────────────────────
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
      : (Number(b.precioOferta||b.precio||0))       - (Number(a.precioOferta||a.precio||0))
    );
    const wantsOne = isPriceLow
      ? /\\blo m[aá]s barato\\b|\\bm[aá]s barat[ao]\\b/i.test(msg)
      : /\\blo m[aá]s caro\\b|\\bm[aá]s car[ao]\\b/i.test(msg);
    selected = results.slice(0, wantsOne ? 1 : 3);
    intent = isPriceLow ? 'filter_price_low' : 'filter_price_high';
    const adj = isPriceLow
      ? (wantsOne ? 'la mas barata' : 'las mas baratas')
      : (wantsOne ? 'la mas cara'  : 'las mas caras');
    text = 'Aca ' + (wantsOne ? 'esta' : 'estan') + ' ' + adj + ' en ' + productKeyword + ':';

  // ── 3. Global price low ────────────────────────────────────────────────────
  } else if (isPriceLow) {
    const sorted = allActive.slice().sort((a, b) =>
      (Number(a.precioOferta||a.precio||Infinity)) - (Number(b.precioOferta||b.precio||Infinity)));
    const wantsOne = /\\blo m[aá]s barato\\b/i.test(msg);
    selected = sorted.slice(0, wantsOne ? 1 : 3);
    intent = 'filter_price_low';
    text = selected.length
      ? (wantsOne ? 'Aca esta el mas barato:' : 'Aca estan las opciones mas economicas:')
      : 'No encontre productos';

  // ── 4. Global price high ───────────────────────────────────────────────────
  } else if (isPriceHigh) {
    const sorted = allActive.slice().sort((a, b) =>
      (Number(b.precioOferta||b.precio||0)) - (Number(a.precioOferta||a.precio||0)));
    const wantsOne = /\\blo m[aá]s caro\\b/i.test(msg);
    selected = sorted.slice(0, wantsOne ? 1 : 3);
    intent = 'filter_price_high';
    text = selected.length
      ? (wantsOne ? 'Aca esta el mas caro:' : 'Las opciones mas premium:')
      : 'No encontre productos';

  // ── 5. Gift recommendations ────────────────────────────────────────────────
  } else if (isGift) {
    const sorted = allActive.slice().sort((a, b) => Number(b.vendidos||0) - Number(a.vendidos||0));
    selected = sorted.slice(0, 4);
    intent = 'recommend';
    text = selected.length ? 'Para regalar, te recomiendo estas opciones populares:' : 'No encontre productos';

  // ── 6. Catalog browse ("que tienen disponible?") ──────────────────────────
  } else if (isCatalog) {
    const sorted = allActive.slice().sort((a, b) => Number(b.vendidos||0) - Number(a.vendidos||0));
    selected = sorted.slice(0, 4);
    intent = 'catalog';
    text = selected.length ? 'Aca van algunos de nuestros productos mas populares:' : 'No tenemos productos disponibles por el momento';

  // ── 7. General recommendation ─────────────────────────────────────────────
  } else if (isRecommend) {
    const sorted = allActive.slice().sort((a, b) => Number(b.vendidos||0) - Number(a.vendidos||0));
    selected = sorted.slice(0, 4);
    intent = 'recommend';
    text = selected.length ? 'Te dejo las opciones mas populares:' : 'No encontre productos';

  // ── 8. Compare ────────────────────────────────────────────────────────────
  } else if (isCompare) {
    const results = await dependencies.getProducts(msg, { limit: 3 });
    selected = results.length ? results : allActive.slice()
      .sort((a, b) => (Number(a.precioOferta||a.precio||Infinity)) - (Number(b.precioOferta||b.precio||Infinity)))
      .slice(0, 3);
    intent = 'compare';
    text = selected.length ? 'Compara estas opciones:' : 'No encontre productos para comparar';

  // ── 9. Generic search ─────────────────────────────────────────────────────
  } else {
    const results = await dependencies.getProducts(msg, { limit: 4 });
    if (results.length > 0) {
      selected = results;
      intent = 'search';
      text = 'Encontre estos productos:';
    } else if (productKeyword) {
      // Specific product searched but not in catalog → honest answer
      return res.json({
        text: 'No tenemos ' + productKeyword + 's en este momento',
        products: [],
        intent: 'no_results',
        actions: [],
      });
    } else {
      // Truly ambiguous (greetings, gibberish, very vague) → show popular
      const sorted = allActive.slice().sort((a, b) => Number(b.vendidos||0) - Number(a.vendidos||0));
      selected = sorted.slice(0, 3);
      intent = selected.length ? 'catalog' : 'no_results';
      text = selected.length ? 'Aca van algunos de nuestros productos mas populares:' : 'No encontre productos con ese criterio';
    }
  }

  if (selected.length === 0) {
    return res.json({ text: 'No encontre productos con ese criterio', products: [], intent: 'no_results', actions: [] });
  }

  const outProducts = selected.slice(0, 4).map(toOut);
  const actions = outProducts.map(p => ({ type: 'view_product', label: 'Ver ' + p.name, url: p.url }));

  return res.json({ text, products: outProducts, intent, actions });
}
`;

// Replace from handleChat to just before module.exports
const before = src.slice(0, startIdx);
const after = src.slice(exportsIdx);
const newSrc = before + newHandleChat + '\n' + after;

fs.writeFileSync(filePath, newSrc, 'utf8');
console.log('chatController.js patched successfully. Lines: ' + newSrc.split('\n').length);
