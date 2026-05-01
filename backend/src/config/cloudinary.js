const cloudinary = require('cloudinary').v2;

// Initialize cloudinary with environment variables
// This ensures variables are read at request time, not module load time
const initCloudinary = () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Initializing Cloudinary Configuration  ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('📋 Environment variables:');
  console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME || 'UNDEFINED'}`);
  console.log(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY || 'UNDEFINED'}`);
  console.log(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.substring(0, 15) + '...' : 'UNDEFINED'}`);
  
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    
    // Verify the config was set
    const config = cloudinary.config();
    console.log('\n✅ Configuration applied. Verifying state:');
    console.log(`   Config cloud_name: ${config.cloud_name || 'NOT SET'}`);
    console.log(`   Config api_key: ${config.api_key || 'NOT SET'}`);
    console.log(`   Config api_secret: ${config.api_secret ? config.api_secret.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log('✅ Cloudinary initialized successfully\n');
  } catch (err) {
    console.log('\n🔴 Error configuring Cloudinary:', err.message);
    console.log('Stack:', err.stack);
  }
  
  return cloudinary;
};

// Initialize on module load, but can be re-initialized if needed
initCloudinary();

/**
 * Returns current Cloudinary storage usage in MB and percentage of limit.
 */
const getStorageUsage = async () => {
  // Re-ensure config is correct before API call
  console.log('\n📊 Fetching storage usage...');
  const config = cloudinary.config();
  console.log(`   Using cloud_name: ${config.cloud_name}`);
  
  try {
    const result = await cloudinary.api.usage();
    const usedMB = result.storage.usage / (1024 * 1024);
    // credits.limit is in GB (1 credit = 1 GB on Cloudinary plans)
    const limitMB = result.credits?.limit
      ? Math.round(result.credits.limit * 1024)
      : parseInt(process.env.CLOUDINARY_STORAGE_LIMIT_MB || '25000', 10);
    const percentage = result.credits?.used_percent ?? (usedMB / limitMB) * 100;
    console.log('✅ Storage usage retrieved successfully\n');
    return { usedMB: usedMB.toFixed(2), limitMB, percentage: parseFloat(percentage).toFixed(1) };
  } catch (err) {
    console.log('🔴 Error getting storage usage:', err.message);
    console.log('Status:', err.status);
    console.log('Http Code:', err.http_code);
    throw err;
  }
};

module.exports = { cloudinary, getStorageUsage, initCloudinary };
