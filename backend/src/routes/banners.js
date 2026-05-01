const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, adminOnly } = require('../middleware/auth');

// Test endpoint - ver datos crudos de banners
router.get('/test/debug', async (req, res, next) => {
  try {
    const Banner = require('../models/Banner');
    const banners = await Banner.find({ activo: true }).lean();
    res.json({
      count: banners.length,
      banners: banners.map(b => ({
        _id: b._id,
        titulo: b.titulo,
        video: b.video,
        imagen: b.imagen,
        mostrarTexto: b.mostrarTexto,
        mostrarBoton: b.mostrarBoton,
        autoplay: b.autoplay,
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', getBanners);
router.post('/', protect, adminOnly, createBanner);
router.put('/:id', protect, adminOnly, updateBanner);
router.delete('/:id', protect, adminOnly, deleteBanner);

module.exports = router;
