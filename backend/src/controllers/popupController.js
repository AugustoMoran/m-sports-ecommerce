const PopupConfig = require('../models/PopupConfig');

// GET /api/popup — público, devuelve la config activa (o defaults)
const getPopupConfig = async (req, res, next) => {
  try {
    let config = await PopupConfig.findOne();
    if (!config) {
      // Crear registro con defaults si no existe
      config = await PopupConfig.create({});
    }
    res.json(config);
  } catch (err) {
    next(err);
  }
};

// PUT /api/popup — solo admin
const updatePopupConfig = async (req, res, next) => {
  try {
    let config = await PopupConfig.findOne();
    if (!config) {
      config = await PopupConfig.create(req.body);
    } else {
      Object.assign(config, req.body);
      await config.save();
    }
    res.json(config);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPopupConfig, updatePopupConfig };
