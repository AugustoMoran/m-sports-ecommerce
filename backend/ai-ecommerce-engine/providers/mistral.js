/**
 * providers/mistral.js — Mistral Provider (Chat Completions API)
 *
 * Mistral offers good quality with generous free tier (2M tokens/month).
 * Uses standard Chat Completions endpoint.
 *
 * Get API key: https://console.mistral.ai/api-keys
 */

const https = require('https');

const API_HOST = 'api.mistral.ai';
const DEFAULT_MODEL = 'mistral-small';

/**
 * Generates a text response using Mistral Chat Completions API.
 *
 * @param {string} prompt   - Full prompt string
 * @param {Object} context  - Optional: { model, systemPrompt }
 * @param {string} apiKey   - Mistral API key (required)
 * @returns {Promise<string>} AI response text
 */
async function generateResponse(prompt, context = {}, apiKey) {
  if (!apiKey) {
    throw new Error(
      '[Mistral] API key is missing. Set MISTRAL_API_KEY in your .env file. Get a key at https://console.mistral.ai/api-keys'
    );
  }

  const model = context.model || DEFAULT_MODEL;

  // Standard chat messages format
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
        path: '/v1/chat/completions',
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
              reject(new Error('[Mistral] Rate limit exceeded'));
              return;
            }

            if (res.statusCode !== 200) {
              const msg = parsed?.error?.message || parsed?.detail || raw.slice(0, 200);
              reject(new Error(`[Mistral] HTTP ${res.statusCode}: ${msg}`));
              return;
            }

            // Standard chat completions response format
            const text = parsed?.choices?.[0]?.message?.content;
            if (!text) {
              reject(new Error('[Mistral] Empty response from API'));
              return;
            }

            resolve(text.trim());
          } catch (e) {
            reject(new Error(`[Mistral] Failed to parse response: ${e.message}`));
          }
        });
      }
    );

    req.on('error', (e) => reject(new Error(`[Mistral] Network error: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

module.exports = { generateResponse };
