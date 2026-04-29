const { normalizeProduct } = require('../core/ragService');
const { fuzzyMatch, similarityScore } = require('../utils/fuzzyMatch');

const PLUGIN_NAME = 'recommendation';

// ─── Contextual search mapping ──────────────────────────────────────────────
// Maps user context words (weather, season, occasion) to relevant product tags
// Now searches actual product tags/categories instead of hardcoding
const CONTEXTUAL_SEARCHES = {
  'frio':        ['buzo', 'abrigo', 'campera', 'remera'],
  'calor':       ['remera', 'short', 'camiseta'],
  'lluvia':      ['abrigo', 'campera', 'buzo'],
  'invierno':    ['buzo', 'abrigo', 'campera'],
  'verano':      ['remera', 'short', 'camiseta'],
  'regalo':      ['remera', 'zapatilla', 'buzo'],
  'abrigarse':   ['buzo', 'abrigo', 'campera', 'remera'],
  'calentar':    ['buzo', 'abrigo', 'remera'],
  'deporte':     ['remera', 'zapatilla', 'short'],
  'formal':      ['remera', 'pantalon', 'zapato'],
  'casual':      ['remera', 'pantalon', 'zapatilla'],
};

// Add common product keywords/synonyms to improve matching for user queries
// (plural/singular, accents, informal words)
CONTEXTUAL_SEARCHES['pantalon'] = ['pantalon', 'pantalón', 'pantalon jogger', 'pantalon jeans', 'pantalon de vestir', 'pantalon cargo'];
CONTEXTUAL_SEARCHES['pantalones'] = CONTEXTUAL_SEARCHES['pantalon'];
CONTEXTUAL_SEARCHES['jeans'] = ['jean', 'pantalon jeans', 'pantalones'];
CONTEXTUAL_SEARCHES['zapato'] = ['zapato', 'zapatilla', 'zapatillas'];
CONTEXTUAL_SEARCHES['zapatos'] = CONTEXTUAL_SEARCHES['zapato'];

/**
 * Extracts contextual search terms from message
 * Returns array of search terms mapped from context words
 */
function extractContextualSearch(message) {
  const normalized = message.toLowerCase();
  for (const [contextWord, searchTerms] of Object.entries(CONTEXTUAL_SEARCHES)) {
    // match as whole word to avoid substrings triggering (e.g., 'mas' inside other words)
    const re = new RegExp(`\\b${contextWord.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(normalized)) {
      return searchTerms; // Return ALL search terms for this context
    }
  }
  return null;
}

/**
 * Creates a recommendation plugin instance.
 *
 * @param {Object} [options]
 * @param {number} [options.maxRecommendations=4]    - Max products to return
 * @param {number} [options.priceTolerancePercent=30] - ±% for price range matching
 * @param {number} [options.productPoolSize=25]       - How many products to score from
 */
function createRecommendationPlugin(options = {}) {
  const {
    maxRecommendations    = 4,
    priceTolerancePercent = 30,
    productPoolSize       = 25,
  } = options;

  // ─── Scoring ────────────────────────────────────────────────────────────
  function scoreProduct(product, queryWords, context) {
    const { targetCategory, priceRange, excludeIds } = context;
    let score = 0;

    // Exclude products already shown in this session
    if (excludeIds.includes(product.id)) return -1;

    // Must have stock
    if (product.stock <= 0) return -1;
    score += 10;
    if (product.stock > 10) score += 5;

    // Category match
    if (targetCategory) {
      const cat = String(product.category || '').toLowerCase();
      if (cat === targetCategory) score += 20;
      else if (cat.includes(targetCategory) || targetCategory.includes(cat)) score += 10;
    }

    // Price range
    if (priceRange && product.price > 0) {
      if (product.price >= priceRange.min && product.price <= priceRange.max) score += 15;
    }

    // Name keyword overlap with user query — give stronger boost to exact/startsWith matches
    if (queryWords.length > 0) {
      const name = (product.name || '').toLowerCase();
      for (const word of queryWords) {
        if (!word) continue;
        if (name === word) score += 30;               // exact match
        else if (name.startsWith(word)) score += 15;  // starts with
        else if (word.length > 2 && name.includes(word)) score += 5; // partial
      }
    }

    // Featured / popular product boost
    if (product.featured) score += 8;
    if (product.sales > 0) score += Math.min(product.sales, 10);

    return score;
  }

  // ─── Context extraction ──────────────────────────────────────────────────
  /**
   * Extracts recommendation context from conversation history and existing products.
   * If the user was already shown products, we use their category/price as hints.
   */
  function buildContext(existingProducts, excludeIds) {
    const context = {
      targetCategory: null,
      priceRange:     null,
      excludeIds:     excludeIds.map(String),
    };

    if (existingProducts.length === 0) return context;

    // Category hint — use the most common category in shown products
    const cats = existingProducts
      .map((p) => String(p.category || '').toLowerCase())
      .filter(Boolean);

    if (cats.length > 0) {
                  // If user asked for a descriptor (like 'estampadas') but none of the returned products match that descriptor,
                  // avoid claiming exact matches exist. Instead give a cautious phrasing.
                  const userLower = String(message || '').toLowerCase();
                  const descriptorRequested = /estamp|estampa|estampadas|lisa|rayas|rayada|floral/i.test(userLower);
                  let descriptorMatched = false;
                  if (descriptorRequested) {
                    for (const p of scored) {
                      const name = String(p.name || '').toLowerCase();
                      const tags = (p.tags || []).join(' ').toLowerCase();
                      if (/estamp|estampa|estampadas|lisa|rayas|rayada|floral/i.test(name) || /estamp|estampa|estampadas|lisa|rayas|rayada|floral/i.test(tags)) {
                        descriptorMatched = true;
                        break;
                      }
                    }
                  }

                  if (descriptorRequested && !descriptorMatched) {
                    // Cautious phrasing if no exact descriptor matches
                    if (top2Names.length === 2) {
                      introText = `No encontramos ${humanLabel} exactamente, pero podrías considerar ${top2Names[0]} o ${top2Names[1]}.`;
                    } else if (top2Names.length === 1) {
                      introText = `No encontramos ${humanLabel} exactamente, pero podrías considerar ${top2Names[0]}.`;
                    } else {
                      introText = `No encontramos ${humanLabel} exactas, pero tengo algunas opciones que podrían interesarte.`;
                    }
                  } else {
                    if (top2Names.length === 2) {
                      introText = `Si buscas ${humanLabel}, te podría interesar ${top2Names[0]} o ${top2Names[1]}.`;
                    } else if (top2Names.length === 1) {
                      introText = `Si buscas ${humanLabel}, te recomendaría ${top2Names[0]}.`;
                    } else {
                      introText = `Si buscas ${humanLabel}, tengo varias opciones disponibles.`;
                    }
                  }
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const delta = avg * (priceTolerancePercent / 100);
      context.priceRange = { min: Math.max(0, avg - delta), max: avg + delta };
    }

    return context;
  }

  // ─── Plugin handler ──────────────────────────────────────────────────────
  /**
   * @param {string} message      - User message
   * @param {Object} dependencies - { getProducts }
   * @param {Object} engineCtx    - { intent, existingProducts, conversationHistory, products }
   * @returns {Promise<Object|null>} Structured response or null to pass to next layer
   */
  async function handle(message, dependencies, engineCtx = {}) {
    const { getProducts } = dependencies;

    console.log('[RECOMMENDATION PLUGIN] Called with:', {
      message: message.slice(0, 50),
      hasGetProducts: typeof getProducts === 'function',
      engineCtx,
    });

    if (typeof getProducts !== 'function') {
      console.log('[RECOMMENDATION PLUGIN] getProducts is NOT a function!');
      return null;
    }

    // Only activate for recommendation / search intents
    const { intent, existingProducts = [], products = [] } = engineCtx;
    console.log('[RECOMMENDATION PLUGIN] Intent:', intent, 'Will handle:', ['product_recommendation', 'product_search'].includes(intent));
    // Support price queries as well (e.g., "lo más barato", "de menor valor")
    const willHandle = ['product_recommendation', 'product_search', 'price_query'].includes(intent);
    console.log('[RECOMMENDATION PLUGIN] Intent:', intent, 'Will handle:', willHandle);
    if (!willHandle) return null;

    try {
      // ── 1. Try contextual search first (e.g. "frio" → search for buzos, abrigos)
      const contextTerms = extractContextualSearch(message);
      // If contextTerms exist, also find which context key matched (e.g. 'regalo')
      const matchedContextKey = Object.keys(CONTEXTUAL_SEARCHES).find(k => message.toLowerCase().includes(k));
      let searchQuery = null;
      let contextualMatched = false;
      
      if (contextTerms && contextTerms.length > 0) {
        console.log('[RECOMMENDATION PLUGIN] Contextual match found:', contextTerms);
        contextualMatched = true;
        
        // If available products are passed, filter them by context tags
        if (products && products.length > 0) {
          console.log('[RECOMMENDATION PLUGIN] Filtering available products by context tags:', contextTerms);
          const contextFiltered = products.filter(p => 
            p.tags && p.tags.some(tag => 
              contextTerms.some(term => tag.toLowerCase().includes(term.toLowerCase()))
            )
          );
          
          if (contextFiltered.length > 0) {
            console.log('[RECOMMENDATION PLUGIN] Context filter found', contextFiltered.length, 'matching products');
            // Normalize and dedupe contextFiltered
            const normalized = contextFiltered.map(normalizeProduct);
            const seen = new Set();
            const uniq = [];
            for (const p of normalized) {
              if (!p.id || seen.has(p.id)) continue;
              seen.add(p.id);
              uniq.push(p);
            }

            let scored = uniq
              .filter(p => p.stock > 0)
              .slice(0, 8)
              .map(p => ({
                id:        p.id,
                name:      p.name,
                price:     p.price,
                salePrice: p.salePrice,
                stock:     p.stock,
                image:     p.image,
                url:       p.url || `/producto/${p.id}`,
                tags:      p.tags,
                category:  p.category,
              }));

            // Filter out generic names that equal the context label or are too short
            const ctxLower = (contextTerms && contextTerms[0]) ? String(contextTerms[0]).toLowerCase() : '';
            scored = scored.filter(p => {
              const lname = (p.name || '').toLowerCase();
              if (!lname || lname.length <= 3) return false;
              if (ctxLower && lname === ctxLower) return false;
              return true;
            }).slice(0, maxRecommendations);

            if (scored.length > 0) {
              // Respuesta conversacional, no lista
              const top2Names = scored.slice(0, 2).map(p => p.name);
              // Derive a human-friendly label for the context (prefer the matched context key like 'regalo')
              const contextLabel = matchedContextKey || ((contextTerms && contextTerms[0]) ? String(contextTerms[0]) : (searchQuery || 'esto'));
              const humanLabel = contextLabel.toLowerCase() === 'regalo' ? 'un regalo' : contextLabel;
              let introText;
              if (top2Names.length === 2) {
                introText = `Si buscas ${humanLabel}, te recomendaría ${top2Names[0]} o ${top2Names[1]}.`;
              } else if (top2Names.length === 1) {
                introText = `Si buscas ${humanLabel}, la mejor opción es ${top2Names[0]}.`;
              } else {
                introText = `Si buscas ${humanLabel}, tenemos varias opciones.`;
              }

              return {
                text: introText,
                products: scored,
                intent,
                actions: scored.map((p) => ({
                  type:  'view_product',
                  label: `Ver ${p.name}`,
                  url:   p.url,
                })),
              };
            }
          }
        }
        
        // If no products available or context filter didn't work, search by first term
        searchQuery = contextTerms[0];
      }
      
      // ── 2. If no contextual match, normalize query normally
      if (!searchQuery) {
        // Check if user explicitly wants all products (be conservative: require words like "todos" or "mostrar todos")
        if (message.toLowerCase().match(/\b(?:todos?|catalogo|catálogo|lista|mostrar todos|ver todos|mostrar el catálogo)\b/i)) {
          searchQuery = 'todos'; // Special signal for getProducts to return all
        } else {
          const normalizedQuery = message
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // remove accents
            .replace(/[^\w\s]/g, ' ')         // punctuation → space
            .split(/\s+/)
            .filter(w => w.length > 3)       // words > 3 chars
            .join(' ');
          searchQuery = normalizedQuery || message;
        }
      }
      
      console.log('[RECOMMENDATION PLUGIN] Search query:', searchQuery, '(contextual:', contextualMatched, ')');

      // Detect explicit price-sorting intent inside message as a fallback
      const preferLowPrice = intent === 'price_query' || /mas barato|más barato|menor valor|de menor|barato|de menor precio/i.test(message);

      // Build context early so we can pass price/category filters to getProducts
      const excludeIds = existingProducts.map((p) => String(p.id || p._id));
      const context = buildContext(existingProducts, excludeIds);

      // ── 3. Fetch products from database (propagate filters shared with productService)
      const getProductsOptions = {
        limit: productPoolSize,
        sort: preferLowPrice ? 'price-asc' : undefined,
      };
      if (context && context.priceRange) {
        getProductsOptions.minPrice = context.priceRange.min;
        getProductsOptions.maxPrice = context.priceRange.max;
      }

      const raw = await getProducts(searchQuery, getProductsOptions);
      console.log('[RECOMMENDATION PLUGIN] Got', raw?.length || 0, 'products from getProducts');
      if (!Array.isArray(raw) || raw.length === 0) {
        console.log('[RECOMMENDATION PLUGIN] No products found for query, trying contextual fallbacks');

        // Try each contextual search term for the matched context (if any)
        const matchedContextKey = Object.keys(CONTEXTUAL_SEARCHES).find(k => message.toLowerCase().includes(k));
        if (matchedContextKey && CONTEXTUAL_SEARCHES[matchedContextKey]) {
          const searchTerms = CONTEXTUAL_SEARCHES[matchedContextKey];
          for (const term of searchTerms) {
            const fallbackOptions = { limit: productPoolSize, sort: preferLowPrice ? 'price-asc' : undefined };
            if (context && context.priceRange) {
              fallbackOptions.minPrice = context.priceRange.min;
              fallbackOptions.maxPrice = context.priceRange.max;
            }
            const found = await getProducts(term, fallbackOptions);
            if (Array.isArray(found) && found.length > 0) {
              console.log('[RECOMMENDATION PLUGIN] Fallback found', found.length, 'products with term:', term);
              // Let main scoring logic below handle these products by setting raw
              raw = found;
              break;
            }
          }
        }

        // If still no products, do NOT return arbitrary 'all products' — let engine continue to RAG/fallback
        if (!Array.isArray(raw) || raw.length === 0) {
          console.log('[RECOMMENDATION PLUGIN] No contextual products found; deferring to engine (RAG/fallback)');
          return null;
        }
        
        // Score fallback products (from last-found raw) based on message keywords
        const productsNorm = (raw || []).map(normalizeProduct);
        const queryWords = message.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

        let scored = productsNorm
          .map((p) => ({ p, score: scoreProduct(p, queryWords, context) }))
          .filter(({ score }) => score > 0);

        if (preferLowPrice) {
          scored.sort((a, b) => {
            const pa = Number(a.p.price || Infinity);
            const pb = Number(b.p.price || Infinity);
            if (pa === pb) return b.score - a.score;
            return pa - pb;
          });
        } else {
          scored.sort((a, b) => b.score - a.score);
        }

        scored = scored.slice(0, maxRecommendations).map(({ p }) => ({
          id:    p.id,
          name:  p.name,
          price: p.price,
          url:   p.url,
          image: p.image,
          stock: p.stock,
        }));

        console.log('[RECOMMENDATION PLUGIN] Fallback scoring returned', scored.length, 'products');
        if (scored.length === 0) return null;

        // Respuesta conversacional sin lista numerada
        const top2 = scored.slice(0, 2);
        let fallbackText;
        if (top2.length === 2) {
          fallbackText = `Te podría interesar ${top2[0].name} o ${top2[1].name}.`;
        } else if (top2.length === 1) {
          fallbackText = `Tenemos ${top2[0].name} disponible que podría ser lo que buscas.`;
        } else {
          fallbackText = 'Tenemos varios productos que podría interesarte.';
        }
        
        return {
          text: fallbackText,
          products: scored,
          intent,
          actions: scored.map((p) => ({
            type:  'view_product',
            label: `Ver ${p.name}`,
            url:   p.url,
          })),
        };
      }

      const productsNorm = raw.map(normalizeProduct);
      const queryWords = message.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

        // Dedupe and filter generic names
        const seenIds = new Set();
        const uniqProducts = productsNorm.filter(p => {
          if (!p.id) return false;
          if (seenIds.has(p.id)) return false;
          seenIds.add(p.id);
          return true;
        });

        let scored = uniqProducts
          .map((p) => ({ p, score: scoreProduct(p, queryWords, context) }))
          .filter(({ score }) => score > 0);

        // If user asked for cheaper products, prefer ordering by price ascending
        if (preferLowPrice) {
          scored.sort((a, b) => {
            const pa = Number(a.p.price || Infinity);
            const pb = Number(b.p.price || Infinity);
            if (pa === pb) return b.score - a.score; // tiebreaker: higher score
            return pa - pb; // lower price first
          });
        } else {
          scored.sort((a, b) => b.score - a.score);
        }

        scored = scored.slice(0, maxRecommendations).map(({ p }) => ({
          id:    p.id,
          name:  p.name,
          price: p.price,
          url:   p.url,
          image: p.image,
          stock: p.stock,
        }));

      console.log('[RECOMMENDATION PLUGIN] Returning', scored.length, 'scored products');
      if (scored.length === 0) return null;

      // Respuesta conversacional sin lista numerada
      const top2 = scored.slice(0, 2);
      let responseText;
      
      if (contextualMatched && contextTerms && contextTerms.length > 0) {
        const contextLabel = matchedContextKey || contextTerms[0];
        const humanLabel = String(contextLabel).toLowerCase() === 'regalo' ? 'un regalo' : contextLabel;
        if (top2.length === 2) {
          responseText = `Si buscas ${humanLabel}, te podría interesar ${top2[0].name} o ${top2[1].name}.`;
        } else if (top2.length === 1) {
          responseText = `Si buscas ${humanLabel}, te recomendaría ${top2[0].name}.`;
        } else {
          responseText = `Si buscas ${humanLabel}, tengo varias opciones disponibles.`;
        }
      } else if (intent === 'product_recommendation') {
        if (top2.length === 2) {
          responseText = `Te recomendaría ${top2[0].name} o quizás ${top2[1].name}.`;
        } else if (top2.length === 1) {
          responseText = `Te recomendaría ${top2[0].name}.`;
        } else {
          responseText = 'Tengo buenas opciones para ofrecerte.';
        }
      } else {
        if (top2.length === 2) {
          responseText = `Encontré ${top2[0].name} y ${top2[1].name} que podrían interesarte.`;
        } else if (top2.length === 1) {
          responseText = `Encontré ${top2[0].name} disponible para vos.`;
        } else {
          responseText = 'Encontré varios productos disponibles.';
        }
      }

      return {
        text: responseText,
        products: scored,
        intent,
        actions: scored.map((p) => ({
          type:  'view_product',
          label: `Ver ${p.name}`,
          url:   p.url,
        })),
      };
    } catch (err) {
      console.log('[RECOMMENDATION PLUGIN] ERROR:', err.message);
      // Plugin failures are non-blocking — engine continues to next layer
      return null;
    }
  }

  return { name: PLUGIN_NAME, handle };
}

module.exports = { createRecommendationPlugin };
