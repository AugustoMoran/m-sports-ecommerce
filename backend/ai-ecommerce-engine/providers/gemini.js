/**
 * providers/gemini.js — Google Gemini AI Provider
 *
 * DEFAULT provider. FREE tier limits (as of 2025):
 *   - gemini-2.0-flash-lite: 30 RPM, 1,500 RPD, 1M TPM  ← cheapest / fastest
 *   - gemini-1.5-flash:      15 RPM, 1,500 RPD, 1M TPM  ← higher quality
 *
 * Get your free API key: https://aistudio.google.com/app/apikey
 *
 * DESIGN DECISION: Uses Node's built-in `https` module — no extra dependencies.
 * The function signature is standardised: generateResponse(prompt, context, apiKey)
 * so any provider can be swapped in without changing callers.
 */

const https = require('https');

const API_HOST = 'generativelanguage.googleapis.com';
const DEFAULT_MODEL = 'gemini-2.0-flash-lite'; // Best free-tier cost/quality ratio

/**
 * Generates a text response using the Gemini API.
 *
 * @param {string} prompt   - Full prompt (system + user message)
 * @param {Object} context  - Optional: { model }
 * @param {string} apiKey   - Gemini API key
 * @returns {Promise<string>} AI response text
 */
async function generateResponse(prompt, context = {}, apiKey) {
  if (!apiKey) {
    throw new Error(
      '[Gemini] API key is missing. Get a free key at https://aistudio.google.com/app/apikey and set GEMINI_API_KEY in your .env'
    );
  }

  const model = context.model || DEFAULT_MODEL;
  const path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,       // Low temperature = factual, consistent responses
      maxOutputTokens: 300,   // Keep answers short to save tokens
      topP: 0.8,
      topK: 40,
    },
    // Balanced safety — avoid over-blocking product queries
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: API_HOST,
        path,
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);

            if (res.statusCode !== 200) {
              const msg = parsed?.error?.message || raw.slice(0, 200);
              reject(new Error(`[Gemini] HTTP ${res.statusCode}: ${msg}`));
              return;
            }

            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
              // Model may have been blocked by safety filters
              const reason = parsed?.candidates?.[0]?.finishReason || 'unknown';
              reject(new Error(`[Gemini] Empty response. finishReason: ${reason}`));
              return;
            }

            resolve(text.trim());
          } catch (e) {
            reject(new Error(`[Gemini] Failed to parse response: ${e.message}`));
          }
        });
      }
    );

    req.on('error', (e) => reject(new Error(`[Gemini] Network error: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

module.exports = { generateResponse };
