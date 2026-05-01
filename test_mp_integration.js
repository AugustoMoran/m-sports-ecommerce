/**
 * Test Mercado Pago integration
 * Run with: node test_mp_integration.js
 */
require('dotenv').config({ path: './backend/.env' });

const MercadoPagoConfig = require('mercadopago').default;
const { Preference } = require('mercadopago');

console.log('\n=== MERCADO PAGO INTEGRATION TEST ===\n');

// Check environment variables
console.log('1️⃣  Environment Variables:');
console.log(`   MP_ACCESS_TOKEN present: ${process.env.MP_ACCESS_TOKEN ? 'YES ✅' : 'NO ❌'}`);
console.log(`   MP_PUBLIC_KEY present: ${process.env.MP_PUBLIC_KEY ? 'YES ✅' : 'NO ❌'}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);
console.log(`   BACKEND_URL: ${process.env.BACKEND_URL || 'NOT SET'}`);

if (!process.env.MP_ACCESS_TOKEN) {
  console.log('\n❌ ERROR: MP_ACCESS_TOKEN not found!');
  process.exit(1);
}

// Test MercadoPago client initialization
console.log('\n2️⃣  Initializing MercadoPago Client:');
try {
  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  console.log('   ✅ Client created successfully');
} catch (err) {
  console.log(`   ❌ Error: ${err.message}`);
  process.exit(1);
}

// Test creating a preference
console.log('\n3️⃣  Testing Preference Creation:');
const testPreference = async () => {
  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    const body = {
      items: [
        {
          id: '1',
          title: 'Test Product',
          quantity: 1,
          unit_price: 100,
          currency_id: 'ARS',
        }
      ],
      external_reference: 'TEST-' + Date.now(),
      back_urls: {
        success: `${process.env.FRONTEND_URL}/test/success`,
        failure: `${process.env.FRONTEND_URL}/test/failure`,
        pending: `${process.env.FRONTEND_URL}/test/pending`,
      },
      auto_return: 'approved',
    };

    console.log(`   Request: ${JSON.stringify(body, null, 2)}`);
    
    const result = await preference.create({ body });
    
    console.log('\n   ✅ Preference Created Successfully!');
    console.log(`   Preference ID: ${result.id}`);
    console.log(`   Init Point: ${result.init_point}`);
    console.log(`   Sandbox Init Point: ${result.sandbox_init_point}`);
    
    return result;
  } catch (error) {
    console.log('\n   ❌ Error Creating Preference:');
    console.log(`   Message: ${error.message}`);
    console.log(`   Status: ${error.status}`);
    console.log(`   Code: ${error.code}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
};

testPreference();
