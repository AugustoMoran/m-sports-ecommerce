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
  console.log(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.substring(0, 20) + '... (length: ' + process.env.CLOUDINARY_API_SECRET.length + ')' : 'UNDEFINED'}`);
  
  try {
    const configObj = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    };
    
    console.log('\n📝 Calling cloudinary.config() with:');
    console.log(`   cloud_name: ${configObj.cloud_name}`);
    console.log(`   api_key: ${configObj.api_key}`);
    console.log(`   api_secret length: ${configObj.api_secret ? configObj.api_secret.length : 0}`);
    
    cloudinary.config(configObj);
    
    // Verify the config was set
    const config = cloudinary.config();
    console.log('\n✅ cloudinary.config() executed. Verifying state:');
    console.log(`   Config cloud_name: ${config.cloud_name || 'NOT SET'}`);
    console.log(`   Config api_key: ${config.api_key || 'NOT SET'}`);
    console.log(`   Config api_secret: ${config.api_secret ? 'SET (length: ' + config.api_secret.length + ')' : 'NOT SET'}`);
    console.log('✅ Cloudinary initialized successfully\n');
  } catch (err) {
    console.log('\n🔴 Error configuring Cloudinary:', err.message);
    console.log('Error type:', err.name);
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
  console.log(`   Cloud name: ${config.cloud_name}`);
  console.log(`   API Key: ${config.api_key ? '✓ SET' : '✗ NOT SET'}`);
  console.log(`   API Secret: ${config.api_secret ? '✓ SET (length: ' + config.api_secret.length + ')' : '✗ NOT SET'}`);
  
  try {
    // First try the main API call
    console.log('   Calling cloudinary.api.usage()...');
    const result = await cloudinary.api.usage();
    
    console.log('   Raw result:', JSON.stringify(result, null, 2));
    
    const usedMB = result.storage.usage / (1024 * 1024);
    // credits.limit is in GB (1 credit = 1 GB on Cloudinary plans)
    const limitMB = result.credits?.limit
      ? Math.round(result.credits.limit * 1024)
      : parseInt(process.env.CLOUDINARY_STORAGE_LIMIT_MB || '25000', 10);
    const percentage = result.credits?.used_percent ?? (usedMB / limitMB) * 100;
    console.log('✅ Storage usage retrieved successfully');
    console.log(`   Used: ${usedMB.toFixed(2)} MB / Limit: ${limitMB} MB`);
    console.log(`   Percentage: ${percentage}%\n`);
    return { usedMB: usedMB.toFixed(2), limitMB, percentage: parseFloat(percentage).toFixed(1), available: true };
  } catch (err) {
    console.log('🔴 Error getting storage usage:');
    console.log('   Message:', err.message);
    console.log('   Status:', err.status);
    console.log('   Http Code:', err.http_code);
    console.log('   Full Error:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    
    // Try to get at least basic account info to verify credentials work
    try {
      console.log('\n   Attempting fallback: cloudinary.api.resources() to verify auth...');
      const resources = await cloudinary.api.resources({ max_results: 1 });
      console.log('   ✓ Auth verified! Account is accessible');
      console.log('   But usage() endpoint failed - this may require account upgrade');
    } catch (fallbackErr) {
      console.log('   ✗ Auth failed - credentials may be invalid');
      console.log('   Error:', fallbackErr.message);
    }
    
    // Return default safe values instead of throwing
    console.log('\n⚠️ Returning default storage values\n');
    return { 
      usedMB: '0.00', 
      limitMB: 25000, 
      percentage: '0.0',
      error: 'Unable to fetch from Cloudinary API',
      available: false 
    };
  }
};

module.exports = { cloudinary, getStorageUsage, initCloudinary };
