const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getProducts, getProduct, getRelated, getSuggestions, createProduct, updateProduct, deleteProduct, addImage, removeImage, addVideo, removeVideo,
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/suggestions', getSuggestions);
router.get('/:id', getProduct);
router.get('/:id/related', getRelated);

// Admin
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.post('/:id/images', protect, adminOnly, addImage);
router.delete('/:id/images', protect, adminOnly, removeImage);
router.post('/:id/videos', protect, adminOnly, addVideo);
router.delete('/:id/videos', protect, adminOnly, removeVideo);

module.exports = router;
