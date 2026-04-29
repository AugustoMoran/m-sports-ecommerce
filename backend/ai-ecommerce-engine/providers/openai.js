/**
 * providers/openai.js — OpenAI Provider (Paid tier)
 *
 * SCALING PATH: When free-tier limits are insufficient, set:
 *   config.provider = 'openai'
 *   config.openaiApiKey = process.env.OPENAI_API_KEY
 *
 * That's the only change required — no engine code modifications.
 *
 * Recommended models:
 *   - gpt-4o-mini    ← Best cost/quality for ecommerce chat (~$0.15/1M tokens input)
 *   - gpt-4o         ← Highest quality, higher cost
 *   - gpt-3.5-turbo  ← Cheapest, acceptable quality
 *
 * DESIGN DECISION: Same interface as other providers. Uses native `https`
 * so this module has zero extra dependencies.
 */

const https = require('https');

const API_HOST = 'api.openai.com';
const DEFAULT_MODEL = 'gpt-4o-mini'; // Best value for ecommerce chat

/**
 * Generates a text response using the OpenAI Chat Completions API.
 *
 * @param {string} prompt   - Full prompt string
 * @param {Object} context  - Optional: { model, systemPrompt }
 * @param {string} apiKey   - OpenAI API key (required)
 * @returns {Promise<string>} AI response text
 */
async function generateResponse(prompt, context = {}, apiKey) {
  if (!apiKey) {
    throw new Error(
      '[OpenAI] API key is missing. Set OPENAI_API_KEY in your .env file. Get a key at https://platform.openai.com/api-keys'
    );
  }

  const model = context.model || DEFAULT_MODEL;

  // Split system instructions from user message if a system prompt is provided
  const messages = context.systemPrompt
    ? [
        { role: 'system', content: context.systemPrompt },
        { role: 'user',   content: prompt },
      ]
    : [{ role: 'user', content: prompt }];

  const body = JSON.stringify({
    model,
    messages,
    max_tokens:  300,
    temperature: 0.3,
    top_p:       0.8,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: API_HOST,
        path:     '/v1/chat/completions',
        method:   'POST',
        headers: {
          'Content-Type':   'application/json',
          'Authorization':  `Bearer ${apiKey}`,
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
              reject(new Error('[OpenAI] Rate limit or quota exceeded. Check your billing at https://platform.openai.com/usage'));
              return;
            }

            if (res.statusCode !== 200) {
              const msg = parsed?.error?.message || raw.slice(0, 200);
              reject(new Error(`[OpenAI] HTTP ${res.statusCode}: ${msg}`));
              return;
            }

            const text = parsed?.choices?.[0]?.message?.content;
            if (!text) {
              reject(new Error('[OpenAI] Empty response from API'));
              return;
            }

            resolve(text.trim());
          } catch (e) {
            reject(new Error(`[OpenAI] Failed to parse response: ${e.message}`));
          }
        });
      }
    );

    req.on('error', (e) => reject(new Error(`[OpenAI] Network error: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

module.exports = { generateResponse };
