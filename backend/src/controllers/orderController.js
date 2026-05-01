const orderService = require('../services/orderService');
const mercadopagoService = require('../services/mercadopagoService');
const Order = require('../models/Order');

const createOrder = async (req, res, next) => {
  try {
    const { guestData, items, cuponCodigo, metodoPago } = req.body;
    const userId = req.user?._id || null;

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  Creating Order (POST /api/orders)      ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('📦 Order data received:');
    console.log(`   userId: ${userId}`);
    console.log(`   authenticated: ${req.user ? 'YES' : 'NO'}`);
    if (req.user) {
      console.log(`   user email: ${req.user.email}`);
    }
    console.log(`   guestData: ${guestData ? 'YES' : 'NO'}`);
    if (guestData) {
      console.log(`     - nombre: ${guestData.nombre || 'N/A'}`);
      console.log(`     - email: ${guestData.email || 'N/A'}`);
      console.log(`     - telefono: ${guestData.telefono || 'N/A'}`);
    }
    console.log(`   items count: ${items ? items.length : 0}`);
    console.log(`   cuponCodigo: ${cuponCodigo || 'NONE'}`);
    console.log(`   metodoPago: ${metodoPago}`);

    if (!userId && (!guestData?.nombre || !guestData?.email)) {
      console.error('❌ Validation failed: Missing userId and/or guestData');
      return res.status(400).json({ message: 'Datos del comprador requeridos.' });
    }

    console.log('\n✅ Validation passed, creating order...');
    const order = await orderService.createOrder({ userId, guestData, items, cuponCodigo, metodoPago });
    console.log(`✅ Order created: ${order._id}`);
    console.log(`   Order code: ${order.codigo}`);
    console.log(`   Total: ${order.total}`);

    let mpData = null;
    if (metodoPago === 'mercadopago') {
      console.log(`\n💳 Creating Mercado Pago preference...`);
      const pref = await mercadopagoService.createPreference(order);
      mpData = { preferenceId: pref.id, initPoint: pref.init_point };
      await Order.findByIdAndUpdate(order._id, { mpPreferenceId: pref.id });
      console.log(`✅ MP preference linked: ${pref.id}\n`);
    }

    res.status(201).json({ order, mpData });
  } catch (error) {
    console.error('\n🔴 ERROR in createOrder:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Type: ${error.name}`);
    console.error(`   Stack: ${error.stack}\n`);
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const data = await orderService.getOrders({ userId: req.user._id, ...req.query });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getOrderByCode = async (req, res, next) => {
  try {
    const order = await orderService.getOrderByCode(req.params.codigo);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// Admin
const getAllOrders = async (req, res, next) => {
  try {
    const data = await orderService.getOrders(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { estadoPago, estadoEnvio } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, estadoPago, estadoEnvio);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const dispatchOrder = async (req, res, next) => {
  try {
    const { codigo } = req.body;
    const order = await orderService.dispatchOrder(codigo);
    res.json({ message: 'Pedido despachado.', order });
  } catch (error) {
    next(error);
  }
};

const finalizeOrder = async (req, res, next) => {
  try {
    const force = req.body?.force === true;
    const { order, agotados } = await orderService.finalizeOrder(req.params.id, force);
    res.json({ message: 'Pedido finalizado.', order, agotados });
  } catch (error) {
    if (error.code === 'STOCK_INSUFICIENTE') {
      return res.status(400).json({ message: error.message, code: 'STOCK_INSUFICIENTE' });
    }
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });
    if (!order.stockDeducido) {
      return res.status(400).json({ message: 'Solo se pueden eliminar pedidos finalizados.' });
    }
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pedido eliminado.' });
  } catch (error) {
    next(error);
  }
};

// Admin: Update product stock (after order finalized with negative stock)
const updateProductStock = async (req, res, next) => {
  try {
    const { productId, newStock } = req.body;
    if (newStock === undefined) {
      return res.status(400).json({ message: 'newStock es requerido.' });
    }
    const result = await orderService.updateProductStock(productId, newStock);
    res.json({ message: 'Stock actualizado.', result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getMyOrders, getOrderByCode, getAllOrders, updateOrder, dispatchOrder, finalizeOrder, deleteOrder, updateProductStock };
