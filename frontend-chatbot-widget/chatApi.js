/**
 * chatApi.js — Chat API service
 *
 * Simple fetch-based service for the chat widget.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
