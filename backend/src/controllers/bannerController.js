const Banner = require('../models/Banner');

const getBanners = async (req, res, next) => {
  try {
    const soloActivos = req.query.activos === 'true';
    const filter = soloActivos ? { activo: true } : {};
    const banners = await Banner.find(filter).sort({ orden: 1, createdAt: 1 });
    res.json(banners);
  } catch (err) {
    next(err);
  }
};

const createBanner = async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch (err) {
    next(err);
  }
};

const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!banner) return res.status(404).json({ message: 'Banner no encontrado' });
    res.json(banner);
  } catch (err) {
    next(err);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner no encontrado' });
    res.json({ message: 'Banner eliminado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBanners, createBanner, updateBanner, deleteBanner };
