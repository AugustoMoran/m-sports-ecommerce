const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getCoupons, validateCoupon, createCoupon, updateCoupon, deleteCoupon,
} = require('../controllers/couponController');

// Public: validate a coupon
router.post('/validate', validateCoupon);

// Admin
router.get('/', protect, adminOnly, getCoupons);
router.post('/', protect, adminOnly, createCoupon);
router.put('/:id', protect, adminOnly, updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

module.exports = router;
