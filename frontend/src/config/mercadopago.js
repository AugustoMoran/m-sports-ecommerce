/**
 * Initialize Mercado Pago SDK
 * Waits for SDK to load before initializing
 */
export const initializeMercadoPago = () => {
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
  
  if (!publicKey) {
    console.warn('⚠️ VITE_MP_PUBLIC_KEY not configured. Mercado Pago checkout will not work.');
    return;
  }

  // Wait for SDK to load (max 5 attempts)
  let attempts = 0;
  const maxAttempts = 5;
  
  const initialize = () => {
    if (typeof window.mp !== 'undefined') {
      console.log('✅ Mercado Pago SDK initialized');
      try {
        window.mp.init({
          publicKey: publicKey,
        });
      } catch (error) {
        console.error('❌ Error initializing MP SDK:', error);
      }
    } else if (attempts < maxAttempts) {
      attempts++;
      console.log(`⏳ Waiting for MP SDK to load... (${attempts}/${maxAttempts})`);
      setTimeout(initialize, 500);
    } else {
      console.warn('⚠️ Mercado Pago SDK did not load after 2.5s. Check index.html');
    }
  };

  initialize();
};
