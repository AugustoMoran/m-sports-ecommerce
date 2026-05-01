const { cloudinary, initCloudinary } = require('../config/cloudinary');
const { getUsageReport } = require('../services/cloudinaryService');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Ensure cloudinary is initialized BEFORE creating storage
const getUpload = () => {
  console.log('🔵 Creating upload middleware...');
  
  // Reinitialize cloudinary with current env vars
  console.log('🔵 Initializing Cloudinary for upload...');
  console.log(`   Current config - cloud_name: ${cloudinary.config().cloud_name}`);
  console.log(`   Current config - api_key: ${cloudinary.config().api_key}`);
  initCloudinary();
  console.log(`   After init - cloud_name: ${cloudinary.config().cloud_name}`);
  console.log(`   After init - api_key: ${cloudinary.config().api_key}`);
  
  try {
    const storage = new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => {
        console.log(`📁 Processing file: ${file.originalname}, type: ${file.mimetype}`);
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

    console.log('✅ CloudinaryStorage created successfully');

    const upload = multer({
      storage,
      limits: { fileSize: 100 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        console.log(`🔍 File filter: ${file.originalname}, mimetype: ${file.mimetype}`);
        const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
        const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
        const allowed = [...allowedImages, ...allowedVideos];
        
        if (!allowed.includes(file.mimetype)) {
          console.log(`❌ File type rejected: ${file.mimetype}`);
          return cb(new Error('Formato no permitido. Solo JPEG, PNG, WEBP, MP4, WEBM, MOV, AVI.'));
        }
        console.log(`✅ File type accepted: ${file.mimetype}`);
        cb(null, true);
      },
    });

    console.log('✅ Multer instance created successfully');
    return upload;
  } catch (err) {
    console.log('🔴 Error creating upload middleware:', err.message);
    console.log('   Stack:', err.stack);
    throw err;
  }
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió archivo.' });
    console.log('✅ Upload successful:', req.file.path);
    res.json({ url: req.file.path, publicId: req.file.filename });
  } catch (error) {
    console.log('🔴 Upload error:', error.message);
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { publicId, isVideo } = req.body;
    if (!publicId) return res.status(400).json({ message: 'publicId requerido.' });
    
    // Re-ensure cloudinary is initialized
    initCloudinary();
    
    const resourceType = isVideo ? 'video' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {
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

module.exports = { getUpload, uploadImage, deleteImage, getStorageUsage };
