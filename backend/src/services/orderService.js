const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const generateOrderCode = require('../utils/generateOrderCode');
const {
  sendOrderConfirmationToUser,
  sendOrderNotificationToAdmin,
  sendShippingCodeEmail,
} = require('../utils/sendNotifications');

const createOrder = async ({ userId, guestData, items, cuponCodigo, metodoPago }) => {
  // Validate and build items
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findOne({ _id: item.producto, isActive: true });
    if (!product) throw Object.assign(new Error(`Producto no encontrado: ${item.producto}`), { statusCode: 404 });

    if (product.stock < item.cantidad) {
      throw Object.assign(
        new Error(`Stock insuficiente para: ${product.nombre} (disponible: ${product.stock})`),
        { statusCode: 400 }
      );
    }

    // Validar talla solo si el producto tiene tallas habilitadas
    if (product.tallas?.habilitadas?.length > 0 && item.talla) {
      if (!product.tallas.habilitadas.includes(item.talla)) {
        throw Object.assign(new Error(`Talla no disponible: ${item.talla}`), { statusCode: 400 });
      }
    }
    
    // Validar color solo si el producto tiene colores
    if (product.colores?.length > 0 && item.color) {
      const colorDisponible = product.colores.find(c => c.nombre === item.color || c.codigo === item.color);
      if (!colorDisponible || !colorDisponible.habilitado) {
        throw Object.assign(new Error(`Color no disponible: ${item.color}`), { statusCode: 400 });
      }
    }

    orderItems.push({
      producto: product._id,
      nombre: product.nombre,
      precio: product.precioOferta || product.precio,
      cantidad: item.cantidad,
      imagen: product.imagenes[0]?.url || '',
      talla: item.talla,
      color: item.color,
    });
    subtotal += (product.precioOferta || product.precio) * item.cantidad;
  }

  // Handle coupon
  let descuento = 0;
  if (cuponCodigo) {
    const coupon = await Coupon.findOne({ codigo: cuponCodigo.toUpperCase() });
    if (!coupon || !coupon.isValid()) {
      throw Object.assign(new Error('Cupón inválido o vencido.'), { statusCode: 400 });
    }
    if (subtotal < coupon.minimoCompra) {
      throw Object.assign(new Error(`Mínimo de compra: $${coupon.minimoCompra}`), { statusCode: 400 });
    }
    descuento = coupon.tipo === 'porcentaje'
      ? subtotal * (coupon.valor / 100)
      : coupon.valor;
    coupon.usosActuales += 1;
    await coupon.save();
  }

  const total = Math.max(0, subtotal - descuento);

  // Generate unique code
  let codigo;
  let attempts = 0;
  do {
    codigo = generateOrderCode();
    attempts++;
    if (attempts > 20) throw new Error('No se pudo generar código de orden único.');
  } while (await Order.findOne({ codigo }));

  const order = await Order.create({
    codigo,
    usuario: userId || null,
    guestData: userId ? undefined : guestData,
    items: orderItems,
    subtotal,
    descuento,
    total,
    cupon: cuponCodigo ? cuponCodigo.toUpperCase() : null,
    metodoPago: metodoPago || 'pendiente',
    estadoPago: 'pendiente',      // Always start as pending; webhook (MP) or admin (WhatsApp) approves
    estadoEnvio: 'pendiente',     // Always start as pending until admin dispatches
    stockDeducido: false,
  });

  // Stock is NOT deducted here.
  // MercadoPago: deducted in the webhook when payment is approved.
  // WhatsApp: deducted in finalizeOrder when the admin dispatches.

  // Send notifications
  // For Mercado Pago: email will be sent from the webhook when payment is approved
  // For WhatsApp: NO notifications are sent from here
  if (metodoPago === 'whatsapp') {
    // Get email from user or guest data
    let emailRecipient = null;
    if (userId) {
      // For logged-in users, fetch their email from the database
      const User = require('../models/User');
      const user = await User.findById(userId);
      emailRecipient = user?.email;
    } else {
      // For guests, use provided email
      emailRecipient = guestData?.email;
    }

    if (emailRecipient) {
      sendOrderConfirmationToUser(emailRecipient, order)
        .then(() => console.log(`✅ Email enviado a ${emailRecipient}`))
        .catch(err => console.error(`❌ Error enviando email a ${emailRecipient}:`, err.message));
    }
  }

  return order;
};

const getOrders = async ({ page = 1, limit = 20, estado, userId }) => {
  const query = {};
  if (estado) query.estadoEnvio = estado;
  if (userId) query.usuario = userId;

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('usuario', 'nombre apellido email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { orders, page: Number(page), pages: Math.ceil(total / limit), total };
};

const getOrderById = async (id) => {
  const order = await Order.findById(id).populate('usuario', 'nombre apellido email');
  if (!order) throw Object.assign(new Error('Orden no encontrada.'), { statusCode: 404 });
  return order;
};

const getOrderByCode = async (codigo) => {
  const order = await Order.findOne({ codigo: codigo.toUpperCase() }).populate('usuario', 'nombre apellido email');
  if (!order) throw Object.assign(new Error('Orden no encontrada.'), { statusCode: 404 });

  // If order is pending with MP payment, check current status in MP
  if (order.estadoPago === 'pendiente' && order.metodoPago === 'mercadopago' && order.mpPaymentId) {
    try {
      const MercadoPagoConfig = require('mercadopago').default;
      const { Payment } = require('mercadopago');
      
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
      const payment = new Payment(client);
      
      const paymentData = await payment.get({ id: order.mpPaymentId });
      
      if (paymentData.status === 'approved' && order.estadoPago !== 'aprobado') {
        console.log(`✅ Actualizando orden ${order.codigo} a aprobado (verificado desde MP)`);
        order.estadoPago = 'aprobado';
        await order.save();
      }
    } catch (error) {
      console.warn(`⚠️  No se pudo verificar estado en MP: ${error.message}`);
    }
  }

  return order;
};

const updateOrderStatus = async (id, estadoPago, estadoEnvio) => {
  const update = {};
  if (estadoPago) update.estadoPago = estadoPago;
  if (estadoEnvio) update.estadoEnvio = estadoEnvio;

  const order = await Order.findByIdAndUpdate(id, update, { new: true }).populate('usuario', 'nombre apellido email');
  if (!order) throw Object.assign(new Error('Orden no encontrada.'), { statusCode: 404 });
  return order;
};

const dispatchOrder = async (codigo) => {
  const order = await Order.findOne({ codigo: codigo.toUpperCase() }).populate('usuario', 'nombre apellido email');
  if (!order) throw Object.assign(new Error('Código de orden inválido.'), { statusCode: 404 });
  if (order.estadoEnvio === 'enviado' || order.estadoEnvio === 'entregado') {
    throw Object.assign(new Error('Esta orden ya fue despachada.'), { statusCode: 400 });
  }

  order.estadoEnvio = 'enviado';
  order.codigoUsado = true;
  await order.save();

  // Send shipping email
  const email = order.usuario?.email || order.guestData?.email;
  if (email) {
    sendShippingCodeEmail(email, order).catch(console.error);
  }

  return order;
};

const finalizeOrder = async (id, force = false) => {
  const order = await Order.findById(id);
  if (!order) throw Object.assign(new Error('Orden no encontrada.'), { statusCode: 404 });
  if (order.stockDeducido) throw Object.assign(new Error('El stock de este pedido ya fue descontado.'), { statusCode: 400 });

  // Si es rechazado o cancelado: marcar como finalizado SIN deducir stock
  if (order.estadoPago === 'rechazado' || order.estadoPago === 'cancelado') {
    order.stockDeducido = true;
    await order.save();
    const populated = await Order.findById(order._id).populate('usuario', 'nombre apellido email');
    return { order: populated, agotados: [], mensaje: `Pedido ${order.estadoPago} finalizado sin deducción de stock.` };
  }

  // Para otros estados, requiere pago aprobado
  if (order.estadoPago !== 'aprobado') {
    throw Object.assign(new Error('El pedido debe tener pago aprobado, rechazado o cancelado para finalizar.'), { statusCode: 400 });
  }

  // Requiere estado de envío 'enviado' o 'entregado'
  if (order.estadoEnvio !== 'entregado' && order.estadoEnvio !== 'enviado') {
    throw Object.assign(new Error('El pedido debe estar en estado "enviado" o "entregado" para finalizar.'), { statusCode: 400 });
  }

  // Deducir stock para pedidos aprobados
  for (const item of order.items) {
    const product = await Product.findById(item.producto);
    if (!product) continue;
    if (!force && product.stock < item.cantidad) {
      const err = Object.assign(
        new Error(`Stock insuficiente para: ${item.nombre} (disponible: ${product.stock}, pedido: ${item.cantidad})`),
        { statusCode: 400, code: 'STOCK_INSUFICIENTE' }
      );
      throw err;
    }
    // Allow negative stock when forced
    await Product.findByIdAndUpdate(item.producto, {
      $inc: { stock: -item.cantidad, vendidos: item.cantidad },
    });
  }

  order.stockDeducido = true;
  await order.save();

  // Collect products that hit stock <= 0 after this deduction
  const agotados = [];
  for (const item of order.items) {
    const product = await Product.findById(item.producto).select('nombre stock').lean();
    if (product && product.stock <= 0) agotados.push({ _id: product._id, nombre: product.nombre, stock: product.stock });
  }

  const populated = await Order.findById(order._id).populate('usuario', 'nombre apellido email');
  return { order: populated, agotados };
};

const updateProductStock = async (productId, newStock) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  const oldStock = product.stock;
  product.stock = Math.max(0, newStock);
  await product.save();
  return { productId, oldStock, newStock: product.stock };
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getOrderByCode,
  updateOrderStatus,
  dispatchOrder,
  finalizeOrder,
  updateProductStock,
};
