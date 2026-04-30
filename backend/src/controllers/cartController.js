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
    let { productoId, cantidad, talla, color } = req.body;
    // Convertir strings vacíos a null para consistencia
    talla = talla === '' ? null : talla;
    color = color === '' ? null : color;
    const cart = await cartService.addToCart(req.user._id, productoId, cantidad, talla, color);
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    let { cantidad, talla, color } = req.body;
    // Convertir strings vacíos a null para consistencia
    talla = talla === '' ? null : talla;
    color = color === '' ? null : color;
    const cart = await cartService.updateCartItem(req.user._id, req.params.productoId, cantidad, talla, color);
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    let { talla, color } = req.query;
    // Convertir strings vacíos a null para consistencia
    talla = talla === '' ? null : talla;
    color = color === '' ? null : color;
    const cart = await cartService.removeFromCart(req.user._id, req.params.productoId, talla, color);
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
