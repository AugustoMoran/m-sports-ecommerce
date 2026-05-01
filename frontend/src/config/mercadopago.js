/**
 * Initialize Mercado Pago SDK
 * This runs once when the app loads
 */
export const initializeMercadoPago = () => {
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
  
  if (!publicKey) {
    console.warn('⚠️ VITE_MP_PUBLIC_KEY not configured. Mercado Pago checkout will not work.');
    return;
  }

  // Check if MP SDK is loaded
  if (typeof window.mp === 'undefined') {
    console.warn('⚠️ Mercado Pago SDK not loaded. Make sure it\'s included in index.html');
    return;
  }

  console.log('🔐 Initializing Mercado Pago SDK...');
  console.log(`   Public Key: ${publicKey.substring(0, 20)}...`);
  
  try {
    window.mp.init({
      publicKey: publicKey,
    });
    console.log('✅ Mercado Pago SDK initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Mercado Pago SDK:', error);
  }
};
