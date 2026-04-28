const express = require('express');
const router = express.Router();
const { getPopupConfig, updatePopupConfig } = require('../controllers/popupController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getPopupConfig);
router.put('/', protect, adminOnly, updatePopupConfig);

module.exports = router;
