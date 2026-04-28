const express = require('express');
const router = express.Router();
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const {
  createOrder, getMyOrders, getOrderByCode, getAllOrders, updateOrder, dispatchOrder, finalizeOrder, deleteOrder,
} = require('../controllers/orderController');

// Public: create order (guest or logged-in)
router.post('/', optionalAuth, createOrder);

// Public: track by code
router.get('/track/:codigo', getOrderByCode);

// Authenticated user
router.get('/my', protect, getMyOrders);

// Admin
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id', protect, adminOnly, updateOrder);
router.post('/dispatch', protect, adminOnly, dispatchOrder);
router.post('/:id/finalize', protect, adminOnly, finalizeOrder);
router.delete('/:id', protect, adminOnly, deleteOrder);

module.exports = router;
