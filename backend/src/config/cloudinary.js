const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Returns current Cloudinary storage usage in MB and percentage of limit.
 */
const getStorageUsage = async () => {
  const result = await cloudinary.api.usage();
  const usedMB = result.storage.usage / (1024 * 1024);
  // credits.limit is in GB (1 credit = 1 GB on Cloudinary plans)
  const limitMB = result.credits?.limit
    ? Math.round(result.credits.limit * 1024)
    : parseInt(process.env.CLOUDINARY_STORAGE_LIMIT_MB || '25000', 10);
  const percentage = result.credits?.used_percent ?? (usedMB / limitMB) * 100;
  return { usedMB: usedMB.toFixed(2), limitMB, percentage: parseFloat(percentage).toFixed(1) };
};

module.exports = { cloudinary, getStorageUsage };
