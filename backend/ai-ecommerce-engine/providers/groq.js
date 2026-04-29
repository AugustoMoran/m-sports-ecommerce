/**
 * providers/groq.js — Groq Provider (Free tier, 🔥 FASTEST)
 *
 * Groq offers blazing-fast inference with generous free tier.
 * Best for ecommerce: real-time chat responses.
 *
 * Get API key: https://console.groq.com/keys
 * Models available:
 *   - llama-3.1-70b-versatile  ← Recommended for chat
 *   - mixtral-8x7b-32768
 *   - llama-3.1-8b-instant
 */

const https = require('https');

const API_HOST = 'api.groq.com';
const DEFAULT_MODEL = 'llama-3.1-8b-instant'; // ✅ Modelo seguro y activo

/**
 * Generates a text response using Groq API (fastest inference).
 *
 * @param {string} prompt   - Full prompt string
 * @param {Object} context  - Optional: { model, systemPrompt }
 * @param {string} apiKey   - Groq API key (required)
 * @returns {Promise<string>} AI response text
 */
async function generateResponse(prompt, context = {}, apiKey) {
  if (!apiKey) {
    throw new Error(
      '[Groq] API key is missing. Set GROQ_API_KEY in your .env file. Get a key at https://console.groq.com/keys'
    );
  }

  const model = context.model || DEFAULT_MODEL;

  const messages = context.systemPrompt
    ? [
        { role: 'system', content: context.systemPrompt },
        { role: 'user', content: prompt },
      ]
    : [{ role: 'user', content: prompt }];

  const body = JSON.stringify({
    model,
    messages,
    max_tokens: 300,
    temperature: 0.3,
    top_p: 0.8,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: API_HOST,
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);

            if (res.statusCode === 429) {
              reject(new Error('[Groq] Rate limit exceeded'));
              return;
            }

            if (res.statusCode !== 200) {
              const msg = parsed?.error?.message || raw.slice(0, 200);
              reject(new Error(`[Groq] HTTP ${res.statusCode}: ${msg}`));
              return;
            }

            const text = parsed?.choices?.[0]?.message?.content;
            if (!text) {
              reject(new Error('[Groq] Empty response from API'));
              return;
            }

            resolve(text.trim());
          } catch (e) {
            reject(new Error(`[Groq] Failed to parse response: ${e.message}`));
          }
        });
      }
    );

    req.on('error', (e) => reject(new Error(`[Groq] Network error: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

module.exports = { generateResponse };
