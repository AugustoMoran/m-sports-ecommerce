/**
 * ai-ecommerce-engine/example/server.js
 *
 * Minimal standalone Express server showing how to use the AI Engine
 * as a black box, with a MongoDB Product model injected as dependencies.
 *
 * Run with:
 *   GEMINI_API_KEY=your_key node example/server.js
 *
 * Test with:
 *   curl -X POST http://localhost:3001/chat \
 *     -H "Content-Type: application/json" \
 *     -d '{"message":"busco zapatillas rojas"}'
 */

require('dotenv').config();

const express   = require('express');
const mongoose  = require('mongoose');

// ── Import the engine (black box) ─────────────────────────────────────────────
const {
  createAIEngine,
  createRecommendationPlugin,
  createAnalyticsPlugin,
} = require('../index');

// ── Example Product schema (minimal) ─────────────────────────────────────────
// In your real app this is your existing Product model
const productSchema = new mongoose.Schema({
  nombre:      String,
  descripcion: String,
  precio:      Number,
  precioOferta:Number,
  stock:       { type: Number, default: 0 },
  imagenes:    [{ url: String, publicId: String }],
  tags:        [String],
  isActive:    { type: Boolean, default: true },
  deletedAt:   { type: Date, default: null },
  vendidos:    { type: Number, default: 0 },
});
productSchema.index({ nombre: 'text', descripcion: 'text', tags: 'text' });
const Product = mongoose.model('Product', productSchema);

// ── Engine setup ──────────────────────────────────────────────────────────────
const engine = createAIEngine({
  mode:             'balanced',
  provider:         'gemini',
  fallbackProvider: 'huggingface',
  fallbackEnabled:  true,
  useCache:         true,
  maxProducts:      5,
  maxAIRequestsPerMinute: 15,

  geminiApiKey:      process.env.GEMINI_API_KEY,
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,

  plugins: [
    createRecommendationPlugin({ maxRecommendations: 4 }),
    createAnalyticsPlugin(),
  ],
});

// ── Dependency adapter ────────────────────────────────────────────────────────
// The engine only knows about these functions — not about mongoose
const dependencies = {
  async getProducts(query, opts = {}) {
    const limit = Math.min(opts.limit || 10, 50);
    return Product.find({
      isActive:  true,
      deletedAt: null,
      $or: [
        { nombre:      { $regex: query, $options: 'i' } },
        { descripcion: { $regex: query, $options: 'i' } },
        { tags:        { $in: [new RegExp(query, 'i')] } },
      ],
    })
      .select('_id nombre descripcion precio precioOferta stock imagenes tags vendidos')
      .limit(limit)
      .lean();
  },

  async getProductById(id) {
    return Product.findOne({ _id: id, isActive: true, deletedAt: null }).lean();
  },

  // Future: replace with Atlas Vector Search / Pinecone
  async searchProductsSemantic(query, opts) {
    return this.getProducts(query, opts);
  },
};

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '10kb' }));

/**
 * POST /chat
 * Body: { message, sessionId?, conversationHistory? }
 */
app.post('/chat', async (req, res) => {
  const { message, sessionId, conversationHistory = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  const response = await engine.handleMessage(message, dependencies, {
    sessionId,
    conversationHistory,
  });

  res.json(response);
});

/** GET /chat/stats — Engine usage statistics */
app.get('/chat/stats', (_req, res) => res.json(engine.getStats()));

/** DELETE /chat/cache — Clear response cache */
app.delete('/chat/cache', (_req, res) => {
  engine.clearCache();
  res.json({ message: 'Cache cleared' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT   = process.env.PORT     || 3001;
const MONGO  = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-engine-example';

mongoose
  .connect(MONGO)
  .then(() => {
    console.log(`[Example] MongoDB connected: ${MONGO}`);
    app.listen(PORT, () => {
      console.log(`[Example] Chat server running → http://localhost:${PORT}/chat`);
      console.log(`[Example] Stats            → http://localhost:${PORT}/chat/stats`);
    });
  })
  .catch((err) => {
    console.error('[Example] MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
