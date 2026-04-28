const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCart, syncCart, addItem, updateItem, removeItem, clearCart,
} = require('../controllers/cartController');

router.get('/', protect, getCart);
router.post('/sync', protect, syncCart);
router.post('/add', protect, addItem);
router.put('/:productoId', protect, updateItem);
router.delete('/:productoId', protect, removeItem);
router.delete('/', protect, clearCart);

module.exports = router;
