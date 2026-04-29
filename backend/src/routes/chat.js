/**
 * src/routes/chat.js
 *
 * Chat API routes. Mount at /api/chat in app.js.
 *
 * Routes:
 *   POST   /api/chat           — Main chat endpoint (public)
 *   GET    /api/chat/stats     — Engine stats      (admin only)
 *   GET    /api/chat/analytics — Analytics report  (admin only)
 *   DELETE /api/chat/cache     — Clear cache       (admin only)
 */

const express = require('express');
const router  = express.Router();

const {
  handleChat,
  getChatStats,
  getChatAnalytics,
  clearChatCache,
} = require('../controllers/chatController');

const { protect, adminOnly } = require('../middleware/auth');

// ── Public ────────────────────────────────────────────────────────────────────
// Anyone (including unauthenticated visitors) can chat
router.post('/', handleChat);

// ── Admin only ────────────────────────────────────────────────────────────────
// Wrap in auth middleware to protect operational endpoints
router.get(   '/stats',     protect, adminOnly, getChatStats);
router.get(   '/analytics', protect, adminOnly, getChatAnalytics);
router.delete('/cache',     protect, adminOnly, clearChatCache);

module.exports = router;
