const MercadoPagoConfig = require('mercadopago').default;
const { Preference } = require('mercadopago');

let mpClient;

const getClient = () => {
  if (!mpClient) {
    mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  }
  return mpClient;
};

const createPreference = async (order) => {
  const preference = new Preference(getClient());

  const items = order.items.map((item) => ({
    id: item.producto.toString(),
    title: item.nombre,
    quantity: item.cantidad,
    unit_price: Number(item.precio),
    currency_id: 'ARS',
    picture_url: item.imagen || undefined,
  }));

  const isLocalhost = process.env.FRONTEND_URL?.includes('localhost');

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

  const result = await preference.create({ body });

  return result;
};

module.exports = { createPreference };
