const cartService = require('../services/cartService');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user._id);
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const syncCart = async (req, res, next) => {
  try {
    const cart = await cartService.syncCart(req.user._id, req.body.items || []);
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { productoId, cantidad } = req.body;
    const cart = await cartService.addToCart(req.user._id, productoId, cantidad);
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const cart = await cartService.updateCartItem(req.user._id, req.params.productoId, req.body.cantidad);
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeFromCart(req.user._id, req.params.productoId);
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await cartService.clearCart(req.user._id);
    res.json({ message: 'Carrito vaciado.', items: [] });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, syncCart, addItem, updateItem, removeItem, clearCart };
