const MercadoPagoConfig = require('mercadopago').default;
const { Preference } = require('mercadopago');

let mpClient;

const getClient = () => {
  if (!mpClient) {
    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error('❌ MP_ACCESS_TOKEN no configurado en variables de entorno');
    }
    console.log('🔑 Inicializando cliente de Mercado Pago...');
    mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  }
  return mpClient;
};

const createPreference = async (order) => {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  Creating Mercado Pago Preference       ║');
    console.log('╚════════════════════════════════════════╝');
    
    // Check token
    console.log('🔐 Checking MP_ACCESS_TOKEN...');
    console.log(`   Token present: ${process.env.MP_ACCESS_TOKEN ? 'YES' : 'NO'}`);
    if (process.env.MP_ACCESS_TOKEN) {
      console.log(`   Token length: ${process.env.MP_ACCESS_TOKEN.length}`);
      console.log(`   Token prefix: ${process.env.MP_ACCESS_TOKEN.substring(0, 20)}...`);
    }
    
    const client = getClient();
    const preference = new Preference(client);

    console.log('\n📦 Processing order items...');
    const items = order.items.map((item) => ({
      id: item.producto.toString(),
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: Number(item.precio),
      currency_id: 'ARS',
      picture_url: item.imagen || undefined,
    }));
    console.log(`   Items count: ${items.length}`);
    console.log(`   Items: ${JSON.stringify(items.map(i => ({ title: i.title, qty: i.quantity, price: i.unit_price })))}`);

    const isLocalhost = process.env.FRONTEND_URL?.includes('localhost');
    console.log(`\n🌐 FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);
    console.log(`   Is localhost: ${isLocalhost}`);

    const body = {
      items,
      external_reference: order._id.toString(),
      back_urls: {
        success: `${process.env.FRONTEND_URL}/orden/confirmacion?status=success&order=${order._id}`,
        failure: `${process.env.FRONTEND_URL}/orden/confirmacion?status=failure&order=${order._id}`,
        pending: `${process.env.FRONTEND_URL}/orden/confirmacion?status=pending&order=${order._id}`,
      },
    };

    // auto_return requires publicly accessible back_urls (not localhost)
    if (!isLocalhost) {
      body.auto_return = 'approved';
    }

    if (process.env.BACKEND_URL) {
      body.notification_url = `${process.env.BACKEND_URL}/api/webhook/mercadopago`;
    }

    console.log('\n📤 Request body prepared:');
    console.log(`   Items: ${body.items.length}`);
    console.log(`   External reference: ${body.external_reference}`);
    console.log(`   Back URLs configured: YES`);
    console.log(`   Auto return: ${body.auto_return ? 'YES' : 'NO'}`);
    console.log(`   Notification URL: ${body.notification_url ? 'YES' : 'NO'}`);
    
    console.log('\n💳 Calling preference.create()...');
    const result = await preference.create({ body });
    console.log('✅ Preference created successfully');
    console.log(`   ID: ${result.id}`);
    console.log(`   Init point: ${result.init_point ? 'YES' : 'NO'}\n`);

    return result;
  } catch (error) {
    console.error('\n🔴 ERROR creating Mercado Pago preference:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Type: ${error.name}`);
    console.error(`   Status: ${error.status}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   Stack: ${error.stack}`);
    throw error;
  }
};

module.exports = { createPreference };
