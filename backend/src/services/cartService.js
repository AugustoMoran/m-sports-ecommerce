const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (userId) => {
  const cart = await Cart.findOne({ usuario: userId }).populate({
    path: 'items.producto',
    select: 'nombre precio precioOferta imagenes stock isActive',
  });
  return cart || { items: [] };
};

const syncCart = async (userId, items) => {
  let cart = await Cart.findOne({ usuario: userId });
  if (!cart) {
    cart = new Cart({ usuario: userId, items: [] });
  }

  cart.items = [];
  for (const item of items) {
    const product = await Product.findOne({ _id: item.producto, isActive: true });
    if (!product) continue;
    cart.items.push({
      producto: item.producto,
      cantidad: Math.min(item.cantidad, product.stock),
    });
  }

  await cart.save();
  return getCart(userId);
};

const addToCart = async (userId, productoId, cantidad = 1) => {
  const product = await Product.findOne({ _id: productoId, isActive: true });
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });

  let cart = await Cart.findOne({ usuario: userId });
  if (!cart) cart = new Cart({ usuario: userId, items: [] });

  const existing = cart.items.find((i) => i.producto.toString() === productoId);
  if (existing) {
    existing.cantidad = Math.min(existing.cantidad + cantidad, product.stock);
  } else {
    cart.items.push({ producto: productoId, cantidad: Math.min(cantidad, product.stock) });
  }

  await cart.save();
  return getCart(userId);
};

const updateCartItem = async (userId, productoId, cantidad) => {
  const cart = await Cart.findOne({ usuario: userId });
  if (!cart) throw Object.assign(new Error('Carrito no encontrado.'), { statusCode: 404 });

  const item = cart.items.find((i) => i.producto.toString() === productoId);
  if (!item) throw Object.assign(new Error('Item no encontrado.'), { statusCode: 404 });

  if (cantidad <= 0) {
    cart.items = cart.items.filter((i) => i.producto.toString() !== productoId);
  } else {
    item.cantidad = cantidad;
  }

  await cart.save();
  return getCart(userId);
};

const removeFromCart = async (userId, productoId) => {
  const cart = await Cart.findOne({ usuario: userId });
  if (!cart) return { items: [] };

  cart.items = cart.items.filter((i) => i.producto.toString() !== productoId);
  await cart.save();
  return getCart(userId);
};

const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ usuario: userId }, { items: [] });
};

module.exports = { getCart, syncCart, addToCart, updateCartItem, removeFromCart, clearCart };
