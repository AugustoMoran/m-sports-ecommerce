const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getProfile, updateProfile, toggleFavorite, getFavorites, getAllUsers, deleteUser,
} = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/favorites', protect, getFavorites);
router.post('/favorites/:productId', protect, toggleFavorite);
router.delete('/favorites/:productId', protect, toggleFavorite);

// Admin
router.get('/', protect, adminOnly, getAllUsers);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
