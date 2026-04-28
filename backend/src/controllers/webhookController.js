const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const mercadopagoWebhook = async (req, res, next) => {
  try {
    // Validate signature if secret is set
    if (process.env.MP_WEBHOOK_SECRET) {
      const signature = req.headers['x-signature'] || '';
      const xRequestId = req.headers['x-request-id'] || '';
      const manifest = `id:${req.query['data.id']};request-id:${xRequestId};ts:${req.query.ts};`;
      const hmac = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(manifest).digest('hex');
      if (hmac !== signature.split('=')[1]) {
        return res.status(401).json({ message: 'Firma inválida.' });
      }
    }

    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data?.id;
      if (!paymentId) return res.sendStatus(200);

      // Fetch payment from MP API
      const MercadoPagoConfig = require('mercadopago').default;
      const { Payment } = require('mercadopago');
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      const externalRef = paymentData.external_reference;
      const status = paymentData.status; // approved, pending, rejected

      const statusMap = { approved: 'aprobado', pending: 'pendiente', rejected: 'rechazado' };
      const estadoPago = statusMap[status] || 'pendiente';

      const order = await Order.findById(externalRef);
      if (!order) return res.sendStatus(200);

      const wasAlreadyApproved = order.estadoPago === 'aprobado';

      order.estadoPago = estadoPago;
      order.mpPaymentId = paymentId;
      if (estadoPago === 'aprobado') order.metodoPago = 'mercadopago';
      await order.save();

      if (estadoPago === 'aprobado' && !wasAlreadyApproved && !order.stockDeducido) {
        // Deduct real stock only when payment is confirmed
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.producto, {
            $inc: { stock: -item.cantidad, vendidos: item.cantidad },
          });
        }
        order.stockDeducido = true;
        await order.save();

        // Clear the user's cart in DB
        if (order.usuario) {
          await Cart.findOneAndUpdate({ usuario: order.usuario }, { items: [] });
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.sendStatus(200); // Always return 200 to MP
  }
};

module.exports = { mercadopagoWebhook };
