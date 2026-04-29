/**
 * providers/huggingface.js — HuggingFace Inference API Provider
 *
 * FREE fallback provider. Uses instruction-tuned models via the public API.
 * Free tier: ~1,000 requests/day (no key), more with a free HF account.
 *
 * Recommended free models (set via context.model):
 *   - mistralai/Mistral-7B-Instruct-v0.3  ← best quality, free tier
 *   - microsoft/Phi-3-mini-4k-instruct    ← fast, small, surprisingly capable
 *   - HuggingFaceH4/zephyr-7b-beta        ← good instruction following
 *
 * Get a free token: https://huggingface.co/settings/tokens
 *
 * DESIGN DECISION: Same interface as other providers — only this file
 * knows about HuggingFace's API format.
 */

const https = require('https');

const API_HOST = 'api-inference.huggingface.co';
const DEFAULT_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';

/**
 * Generates a text response using the HuggingFace Inference API.
 *
 * @param {string} prompt   - Full prompt (will be wrapped in Mistral chat template)
 * @param {Object} context  - Optional: { model }
 * @param {string} [apiKey] - HuggingFace token (optional but increases rate limits)
 * @returns {Promise<string>} AI response text
 */
async function generateResponse(prompt, context = {}, apiKey) {
  const model = context.model || DEFAULT_MODEL;

  // Mistral instruct template — works with most HF instruction models
  const formattedPrompt = `<s>[INST] ${prompt} [/INST]`;

  const body = JSON.stringify({
    inputs: formattedPrompt,
    parameters: {
      max_new_tokens:  250,
      temperature:     0.3,
      top_p:           0.85,
      return_full_text: false, // Only return the newly generated tokens
      do_sample:       true,
    },
    options: {
      wait_for_model: true, // Wait if model is loading instead of erroring
    },
  });

  const headers = {
    'Content-Type':   'application/json',
    'Content-Length': Buffer.byteLength(body),
  };

  // Token is optional but improves rate limits significantly
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: API_HOST,
        path:     `/models/${model}`,
        method:   'POST',
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);

            // Model is warming up — caller should retry after ~20s
            if (res.statusCode === 503) {
              reject(new Error('[HuggingFace] Model is loading. Retry in ~20 seconds.'));
              return;
            }

            if (res.statusCode === 429) {
              reject(new Error('[HuggingFace] Rate limit exceeded. Add a HF token for higher limits.'));
              return;
            }

            if (res.statusCode !== 200) {
              const msg = parsed?.error || raw.slice(0, 200);
              reject(new Error(`[HuggingFace] HTTP ${res.statusCode}: ${msg}`));
              return;
            }

            // Response is an array of generation objects
            const text = Array.isArray(parsed)
              ? parsed[0]?.generated_text
              : parsed?.generated_text;

            if (!text) {
              reject(new Error(`[HuggingFace] Empty or unexpected response: ${raw.slice(0, 200)}`));
              return;
            }

            resolve(text.trim());
          } catch (e) {
            reject(new Error(`[HuggingFace] Failed to parse response: ${e.message}`));
          }
        });
      }
    );

    req.on('error', (e) => reject(new Error(`[HuggingFace] Network error: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

module.exports = { generateResponse };
