const { cloudinary } = require('../config/cloudinary');
const { getUsageReport } = require('../services/cloudinaryService');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'ecommerce',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Formato no permitido. Solo JPEG, PNG, WEBP.'));
    }
    cb(null, true);
  },
});

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió imagen.' });
    res.json({ url: req.file.path, publicId: req.file.filename });
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ message: 'publicId requerido.' });
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: 'Imagen eliminada.' });
  } catch (error) {
    next(error);
  }
};

const getStorageUsage = async (req, res, next) => {
  try {
    const report = await getUsageReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, uploadImage, deleteImage, getStorageUsage };
