const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { sendOrderConfirmationToUser, sendOrderNotificationToAdmin } = require('../utils/sendNotifications');

const mercadopagoWebhook = async (req, res, next) => {
  try {
    // Parse raw body (it's received as Buffer because of express.raw() middleware)
    let body = req.body;
    if (Buffer.isBuffer(body)) {
      try {
        body = JSON.parse(body.toString());
        console.log('✅ Raw body parseado a JSON');
      } catch (parseErr) {
        console.error('❌ Error parseando raw body:', parseErr.message);
        console.log('📋 Raw body:', req.body.toString());
        body = {};
      }
    }

    // Log full request for diagnostics
    console.log('🔔 Webhook recibido completo:');
    console.log('   Query params:', req.query);
    console.log('   Body (parsed):', body);
    console.log('   Headers:', { 'x-signature': req.headers['x-signature'], 'x-request-id': req.headers['x-request-id'] });

    // MercadoPago v2 sends data in body as JSON: { type: "payment", data: { id: 123 } }
    const type = body?.type || req.query.type;
    const dataId = body?.data?.id || req.query['data.id'];
    
    console.log('📋 Parsed webhook data:', { type, dataId });

    // Validate signature if secret is set
    if (process.env.MP_WEBHOOK_SECRET && req.query.id) {
      const signature = req.headers['x-signature'] || '';
      const xRequestId = req.headers['x-request-id'] || '';
      const ts = req.query.ts || '';
      const manifest = `id:${req.query.id};request-id:${xRequestId};ts:${ts};`;
      
      console.log(`🔐 Validando firma:
      Manifest: ${manifest}
      Secret: ${process.env.MP_WEBHOOK_SECRET.substring(0, 10)}...
      Signature: ${signature}`);
      
      const hmac = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(manifest).digest('hex');
      const signatureParts = signature.split('=');
      
      console.log(`🔐 HMAC calculado: ${hmac}`);
      console.log(`🔐 HMAC esperado: ${signatureParts[1]}`);
      
      if (hmac !== signatureParts[1]) {
        console.warn('⚠️  Firma inválida en webhook - continuando de todas formas para diagnosticar');
        // En desarrollo: continuar. En prod: return res.status(401).json({ message: 'Firma inválida.' });
      } else {
        console.log('✅ Firma válida');
      }
    } else {
      console.log('⚠️  No hay MP_WEBHOOK_SECRET o id en query - saltando validación de firma');
    }

    if (type === 'payment') {
      const paymentId = dataId || req.query.id;
      if (!paymentId) {
        console.log('⚠️  Sin paymentId, ignorando webhook');
        return res.sendStatus(200);
      }

      console.log(`📊 Procesando pago ID: ${paymentId}`);

      // Fetch payment from MP API
      const MercadoPagoConfig = require('mercadopago').default;
      const { Payment } = require('mercadopago');
      
      if (!process.env.MP_ACCESS_TOKEN) {
        console.error('❌ MP_ACCESS_TOKEN no configurado');
        return res.sendStatus(500);
      }
      
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
      const payment = new Payment(client);
      
      let paymentData;
      try {
        paymentData = await payment.get({ id: paymentId });
      } catch (error) {
        console.error('❌ Error obteniendo datos de pago desde MP:', error.message);
        return res.sendStatus(500);
      }

      // 🔴 VALIDACIÓN 1: Datos de pago incompletos
      if (!paymentData || !paymentData.status || !paymentData.external_reference) {
        console.error('❌ Datos de pago incompletos:', { 
          hasData: !!paymentData, 
          hasStatus: !!paymentData?.status,
          hasRef: !!paymentData?.external_reference 
        });
        return res.sendStatus(400);
      }

      const externalRef = paymentData.external_reference;
      const status = paymentData.status; // approved, pending, rejected

      console.log(`🔍 Pago ${paymentId}: status=${status}, externalRef=${externalRef}`);

      // 🔴 VALIDACIÓN CRÍTICA: Si el pago NO está aprobado, SOLO actualizar estado y salir
      if (status !== 'approved') {
        console.log(`⚠️  Pago ${paymentId} no aprobado (status=${status}). Actualizando estado solamente.`);
        
        const order = await Order.findById(externalRef);
        if (!order) {
          console.error(`❌ Orden no encontrada: ${externalRef}`);
          return res.sendStatus(200);
        }

        const statusMap = { approved: 'aprobado', pending: 'pendiente', rejected: 'rechazado' };
        order.estadoPago = statusMap[status] || 'pendiente';
        order.mpPaymentId = paymentId;
        await order.save();
        
        console.log(`💾 Orden ${order.codigo} actualizada a estado: ${order.estadoPago} (NO se envía email)`);
        return res.sendStatus(200); // ✅ SALIR SIN ENVIAR EMAIL
      }

      // ✅ A partir de aquí, sabemos que status === 'approved'
      console.log(`✅ Pago APROBADO ${paymentId}`);

      const order = await Order.findById(externalRef);
      if (!order) {
        console.error(`❌ Orden no encontrada: ${externalRef}`);
        return res.sendStatus(200);
      }

      console.log(`📦 Orden encontrada: ${order.codigo}`);

      // 🔴 VALIDACIÓN 2: Verificar que el monto coincida
      const montoDiferencia = Math.abs((paymentData.transaction_amount || 0) - order.total);
      if (montoDiferencia > 1) { // Permitir diferencia de $1 por redondeo
        console.error(`❌ Monto NO coincide: MP=${paymentData.transaction_amount}, Orden=${order.total}`);
        return res.sendStatus(400);
      }

      // 🔴 PROTECCIÓN: Si ya fue procesada, ignorar webhook duplicado
      if (order.estadoPago === 'aprobado') {
        console.log(`⚠️  Orden ${order.codigo} ya fue procesada. Ignorando webhook duplicado.`);
        return res.sendStatus(200);
      }

      // Actualizar orden como aprobada
      order.estadoPago = 'aprobado';
      order.mpPaymentId = paymentId;
      order.metodoPago = 'mercadopago';
      
      // Ensure envio is 'pendiente' for admin to dispatch
      if (!order.estadoEnvio || order.estadoEnvio === 'pendiente') {
        order.estadoEnvio = 'pendiente';
      }
      
      // Clear the user's cart in DB
      if (order.usuario) {
        await Cart.findOneAndUpdate({ usuario: order.usuario }, { items: [] });
        console.log(`🛒 Carrito limpiado para usuario ${order.usuario}`);
      }
      
      await order.save();
      console.log(`💾 Orden actualizada: ${order.codigo} → Estado: APROBADO`);

      // 📧 ENVIAR EMAIL SOLO PORQUE EL PAGO FUE APROBADO
      let emailRecipient = null;
      if (order.usuario) {
        const User = require('../models/User');
        const user = await User.findById(order.usuario);
        emailRecipient = user?.email;
      } else {
        emailRecipient = order.guestData?.email;
      }

      console.log(`📧 Enviando email de confirmación a: ${emailRecipient}`);

      if (emailRecipient) {
        sendOrderConfirmationToUser(emailRecipient, order)
          .then(() => console.log(`✅ Email enviado a ${emailRecipient}`))
          .catch(err => console.error(`❌ Error enviando email a ${emailRecipient}:`, err.message));
      } else {
        console.error(`❌ Sin emailRecipient para orden ${order.codigo}`);
      }

      // 📧 ENVIAR EMAIL AL ADMIN CON PAGO APROBADO
      const populatedOrder = await Order.findById(order._id).populate('usuario');
      sendOrderNotificationToAdmin(populatedOrder)
        .then(() => console.log(`✅ Notificación admin enviada con pago APROBADO para orden ${order.codigo}`))
        .catch(err => console.error(`❌ Error en notificación admin:`, err.message));

      // IMPORTANTE: Stock se descuenta SOLO cuando admin finaliza la orden,
      // NO cuando se aprueba el pago. Esto permite control administrativo.
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook error:', error.message, error.stack);
    res.sendStatus(200); // Always return 200 to MP
  }
};

module.exports = { mercadopagoWebhook };
