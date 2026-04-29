const { cloudinary } = require('../config/cloudinary');
const { getUsageReport } = require('../services/cloudinaryService');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    
    const baseParams = {
      folder: 'ecommerce',
      resource_type: isVideo ? 'video' : 'image',
    };

    if (isVideo) {
      return {
        ...baseParams,
        allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
      };
    } else {
      return {
        ...baseParams,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      };
    }
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB para videos
  fileFilter: (req, file, cb) => {
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const allowed = [...allowedImages, ...allowedVideos];
    
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Formato no permitido. Solo JPEG, PNG, WEBP, MP4, WEBM, MOV, AVI.'));
    }
    cb(null, true);
  },
});

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió archivo.' });
    res.json({ url: req.file.path, publicId: req.file.filename });
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { publicId, isVideo } = req.body;
    if (!publicId) return res.status(400).json({ message: 'publicId requerido.' });
    
    // Detectar si es video por el parámetro o intentar ambos
    const resourceType = isVideo ? 'video' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {
      // Si falla como imagen, intentar como video
      if (resourceType === 'image') {
        return cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      }
      throw new Error('No se pudo eliminar el archivo.');
    });
    
    res.json({ message: 'Archivo eliminado.' });
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
