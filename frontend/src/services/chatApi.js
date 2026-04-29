/**
 * services/chatApi.js — Chat API service
 *
 * Simple fetch-based service (no RTK Query) because the chat is
 * stateful/interactive — caching doesn't apply here.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Sends a message to the AI chat endpoint.
 *
 * @param {string}   message
 * @param {string}   sessionId
 * @param {Array}    conversationHistory  - [{ role: 'user'|'assistant', content }]
 * @returns {Promise<{ text, products, intent, actions, meta }>}
 */
export async function sendChatMessage(message, sessionId, conversationHistory = []) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ message, sessionId, conversationHistory }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al conectar con el asistente.');
  }

  return res.json();
}
