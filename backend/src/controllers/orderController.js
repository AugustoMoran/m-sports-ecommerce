const orderService = require('../services/orderService');
const mercadopagoService = require('../services/mercadopagoService');
const Order = require('../models/Order');

const createOrder = async (req, res, next) => {
  try {
    const { guestData, items, cuponCodigo, metodoPago } = req.body;
    const userId = req.user?._id || null;

    if (!userId && (!guestData?.nombre || !guestData?.email)) {
      return res.status(400).json({ message: 'Datos del comprador requeridos.' });
    }

    const order = await orderService.createOrder({ userId, guestData, items, cuponCodigo, metodoPago });

    let mpData = null;
    if (metodoPago === 'mercadopago') {
      const pref = await mercadopagoService.createPreference(order);
      mpData = { preferenceId: pref.id, initPoint: pref.init_point };
      await Order.findByIdAndUpdate(order._id, { mpPreferenceId: pref.id });
    }

    res.status(201).json({ order, mpData });
  } catch (error) {
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

module.exports = { createOrder, getMyOrders, getOrderByCode, getAllOrders, updateOrder, dispatchOrder, finalizeOrder, deleteOrder };
