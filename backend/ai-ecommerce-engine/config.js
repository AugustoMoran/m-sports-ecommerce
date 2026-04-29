/**
 * config.js — Global configuration for AI Engine
 *
 * DESIGN DECISION: All behaviour is driven by this config.
 * Changing `mode` or `provider` is the ONLY thing needed to scale from free to paid.
 * No business logic code needs to change.
 */

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  // Execution mode — controls how aggressively AI is used
  mode: 'balanced', // 'cheap' | 'balanced' | 'smart'

  // Primary AI provider (FREE TIER DEFAULTS)
  provider: 'gemini', // 'groq' | 'mistral' | 'openai' (claude) | 'gemini' | 'huggingface'

  // Fallback provider chain (used if primary fails and fallbackEnabled = true)
  // Priority: groq → mistral → openai (claude)
  fallbackProvider: 'groq',
  fallbackEnabled: true,

  // Cache
  useCache: true,
  cacheTTL: 300_000, // 5 minutes (ms)

  // Products returned in RAG context
  maxProducts: 5,

  // Prevent runaway AI costs — requests per minute cap
  maxAIRequestsPerMinute: 20,

  // API keys — always read from env, never hardcoded
  groqApiKey: process.env.GROQ_API_KEY || '',
  mistralApiKey: process.env.MISTRAL_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '', // Claude (paid/optional)
  geminiApiKey: process.env.GEMINI_API_KEY || '', // Deprecated
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || '', // Backup only

  // Optional: custom cache adapter (must implement get/set/delete/clear)
  cacheAdapter: null,
};

// ─── Mode presets ─────────────────────────────────────────────────────────────
// Each mode tunes cost vs quality. Users can still override individual fields.
const MODE_PRESETS = {
  /**
   * cheap — AI is NEVER called. Only keyword detection, plugins, and static replies.
   * Use when: you want zero AI cost, or as a safe default.
   */
  cheap: {
    useAI: false,
    maxProducts: 3,
    useCache: true,
    fallbackEnabled: false,
  },

  /**
   * balanced — AI used when needed + recommendation plugin handles product search.
   * Combines keyword detection, RAG, and plugins for best reliability.
   * Default mode. Best for production with free tier APIs.
   */
  balanced: {
    useAI: true,
    maxProducts: 8,      // ← Más contexto para RAG
    useCache: true,
    fallbackEnabled: true,
    useRAG: true,        // ← Forzar RAG pipeline
    usePlugins: true,    // ← Plugins activos
  },

  /**
   * smart — AI used more freely. Semantic intent classification. Larger context.
   * Use when: you have a paid provider and quality matters more than cost.
   */
  smart: {
    useAI: true,
    maxProducts: 8,
    useCache: false,
    fallbackEnabled: true,
  },
};

// ─── Build config ─────────────────────────────────────────────────────────────
/**
 * Merges user config with defaults and mode presets.
 * Explicit user overrides always win over mode presets.
 *
 * @param {Partial<DEFAULT_CONFIG>} userConfig
 * @returns {Object} Resolved config
 */
function buildConfig(userConfig = {}) {
  const mode = userConfig.mode || DEFAULT_CONFIG.mode;
  const preset = MODE_PRESETS[mode] || MODE_PRESETS.balanced;

  // Layer order: defaults → mode preset → user overrides
  const resolved = { ...DEFAULT_CONFIG, ...preset, ...userConfig };

  // Ensure mode is set (userConfig might not have set it explicitly)
  resolved.mode = mode;

  return resolved;
}

module.exports = { DEFAULT_CONFIG, MODE_PRESETS, buildConfig };
