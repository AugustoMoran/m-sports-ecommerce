const { cloudinary, initCloudinary } = require('../config/cloudinary');
const { getUsageReport } = require('../services/cloudinaryService');
const multer = require('multer');

// Memory storage that allows us to process uploads manually to Cloudinary
const memoryStorage = multer.memoryStorage();

// Create multer with memory storage - we'll upload to Cloudinary manually
const getUpload = () => {
  console.log('\n🔵 Creating upload middleware (using manual Cloudinary upload)...');
  
  const upload = multer({
    storage: memoryStorage,
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

  console.log('✅ Multer instance created successfully\n');
  return upload;
};

// Function to upload buffer to Cloudinary using SDK
const uploadToCloudinary = async (fileBuffer, filename, mimetype) => {
  console.log(`\n📤 Uploading ${filename} to Cloudinary via SDK...`);
  
  try {
    // Create a stream from buffer for Cloudinary SDK
    const stream = require('stream');
    const readable = new stream.Readable();
    readable.push(fileBuffer);
    readable.push(null);

    return new Promise((resolve, reject) => {
      const isVideo = mimetype.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'ecommerce',
          public_id: filename.split('.')[0],
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            console.log(`🔴 Cloudinary upload error:`, error.message);
            reject(error);
          } else {
            console.log(`✅ Upload successful!`);
            console.log(`   Public ID: ${result.public_id}`);
            console.log(`   URL: ${result.secure_url}`);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
            });
          }
        }
      );

      readable.pipe(uploadStream);
    });
  } catch (err) {
    console.log(`🔴 Error uploading to Cloudinary:`, err.message);
    throw err;
  }
};

const uploadImage = async (req, res, next) => {
  try {
    const upload = getUpload();
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('🔴 Multer error:', err.message);
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      try {
        // Now upload the file from memory to Cloudinary
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        console.log('\n✅ File uploaded successfully');
        console.log(`   URL: ${uploadResult.url}`);
        console.log(`   Public ID: ${uploadResult.publicId}`);

        res.json({
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          width: uploadResult.width,
          height: uploadResult.height,
        });
      } catch (cloudinaryErr) {
        console.error('🔴 Cloudinary upload error:', cloudinaryErr.message);
        res.status(500).json({ message: 'Error uploading to Cloudinary: ' + cloudinaryErr.message });
      }
    });
  } catch (error) {
    console.error('🔴 Upload error:', error);
    res.status(500).json({ message: error.message || 'Error uploading image' });
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { publicId, isVideo } = req.body;
    if (!publicId) {
      console.log('❌ No publicId provided for deletion');
      return res.status(400).json({ message: 'publicId requerido.' });
    }
    
    // Re-ensure cloudinary is initialized
    initCloudinary();
    
    const resourceType = isVideo ? 'video' : 'image';
    console.log(`🗑️  Attempting to delete ${resourceType}: ${publicId}`);
    
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {
      if (resourceType === 'image') {
        console.log('   Retrying as video...');
        return cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      }
      throw new Error('No se pudo eliminar el archivo.');
    });
    
    console.log('✅ File deleted successfully');
    res.json({ message: 'Archivo eliminado.' });
  } catch (error) {
    console.log('🔴 Delete error:', error.message);
    next(error);
  }
};

const getStorageUsage = async (req, res, next) => {
  try {
    const report = await getUsageReport();
    res.json(report);
  } catch (error) {
    console.log('🔴 Storage usage error:', error.message);
    // Return safe default values instead of throwing error
    res.json({
      usedMB: '0.00',
      limitMB: 25000,
      percentage: '0.0',
      alert: false,
      threshold: 80,
      error: 'Unable to fetch from Cloudinary API',
      available: false
    });
  }
};

module.exports = { getUpload, uploadImage, deleteImage, getStorageUsage };
