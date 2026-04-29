/**
 * core/aiService.js — AI provider orchestration layer
 *
 * DESIGN DECISION: This module is the only place that knows about providers.
 * The rest of the engine calls `aiService.generateResponse()` and never
 * imports a provider directly. To switch from Gemini to OpenAI, change config only.
 *
 * Features:
 *  - Lazy provider loading (require only when needed)
 *  - Per-minute rate limiting (prevents runaway costs)
 *  - Automatic fallback to secondary provider on error
 *  - Request timeout (15s default)
 */

const { log, trackError } = require('./logger');

// ─── Provider registry ────────────────────────────────────────────────────────
// Lazy loaders: providers are only require()'d when actually used
// Priority: groq (fastest, free) → mistral (free) → openai/claude (paid/optional)
const PROVIDERS = {
  groq:        () => require('../providers/groq'),
  mistral:     () => require('../providers/mistral'),
  openai:      () => require('../providers/openai'),
  gemini:      () => require('../providers/gemini'),
  huggingface: () => require('../providers/huggingface'),
};

// ─── Rate limiter (sliding window) ───────────────────────────────────────────
class RateLimiter {
  constructor(maxPerMinute) {
    this._max = maxPerMinute;
    this._timestamps = [];
  }

  canProceed() {
    const cutoff = Date.now() - 60_000;
    this._timestamps = this._timestamps.filter((t) => t > cutoff);
    return this._timestamps.length < this._max;
  }

  record() {
    this._timestamps.push(Date.now());
  }
}

// ─── Timeout helper ───────────────────────────────────────────────────────────
function withTimeout(promise, ms = 20_000) { // ← Aumentado de 15s a 20s para Groq/Mistral
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`AI request timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// ─── Factory ─────────────────────────────────────────────────────────────────
/**
 * Creates an AI service instance bound to the given configuration.
 *
 * @param {Object} config - Resolved engine config
 * @returns {{ generateResponse: (prompt: string, context?: Object) => Promise<string> }}
 */
function createAIService(config) {
  const {
    provider: primaryName = 'groq',
    fallbackProvider: fallbackName = 'mistral',
    fallbackEnabled = true,
    maxAIRequestsPerMinute = 20,
    groqApiKey,
    mistralApiKey,
    openaiApiKey,
    geminiApiKey,
    huggingfaceApiKey,
  } = config;

  const apiKeys = {
    groq: groqApiKey,
    mistral: mistralApiKey,
    openai: openaiApiKey,
    gemini: geminiApiKey,
    huggingface: huggingfaceApiKey,
  };

  const rateLimiter = new RateLimiter(maxAIRequestsPerMinute);

  /**
   * Loads a provider module and returns a bound generate function.
   * @param {string} name - Provider name
   */
  function loadProvider(name) {
    const factory = PROVIDERS[name];
    if (!factory) {
      throw new Error(`[AI-ENGINE] Unknown provider: "${name}". Available: ${Object.keys(PROVIDERS).join(', ')}`);
    }
    const module = factory();
    const key = apiKeys[name];
    return (prompt, ctx) => module.generateResponse(prompt, ctx, key);
  }

  /**
   * Generates a response from the configured AI provider.
   * Falls back to secondary provider if primary fails and fallback is enabled.
   * Includes detailed error logging for debugging.
   *
   * @param {string} prompt   - Full prompt string
   * @param {Object} [context] - Passed through to provider (e.g. { model })
   * @returns {Promise<string>} Raw AI text response
   */
  async function generateResponse(prompt, context = {}) {
    if (!rateLimiter.canProceed()) {
      throw new Error('[AI-ENGINE] AI rate limit reached. Try again in a moment.');
    }

    const primary = loadProvider(primaryName);

    try {
      rateLimiter.record();
      log('debug', `[${primaryName.toUpperCase()}] Sending request...`);
      const response = await withTimeout(primary(prompt, context));
      log('info', `✅ AI response from ${primaryName}`, { chars: response?.length });
      return response;
    } catch (primaryError) {
      trackError(primaryError, `provider:${primaryName}`);
      log('warn', `❌ ${primaryName} failed: ${primaryError.message}`);

      if (!fallbackEnabled || !fallbackName || fallbackName === primaryName) {
        log('error', `[${primaryName}] No fallback available`);
        throw primaryError;
      }

      log('warn', `↪️ Falling back to ${fallbackName}...`);

      const fallback = loadProvider(fallbackName);
      try {
        rateLimiter.record();
        log('debug', `[${fallbackName.toUpperCase()}] Sending request...`);
        const response = await withTimeout(fallback(prompt, context));
        log('info', `✅ AI response from fallback ${fallbackName}`, { chars: response?.length });
        return response;
      } catch (fallbackError) {
        trackError(fallbackError, `provider:${fallbackName}`);
        log('error', `❌ ${fallbackName} failed: ${fallbackError.message}`);
        log('error', '[AI-ENGINE] All AI providers failed.');
        throw new Error('[AI-ENGINE] All AI providers failed. Check API keys and quotas.');
      }
    }
  }

  return { generateResponse };
}

module.exports = { createAIService };
