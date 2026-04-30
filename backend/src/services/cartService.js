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
      talla: item.talla,
      color: item.color,
    });
  }

  await cart.save();
  return getCart(userId);
};

const addToCart = async (userId, productoId, cantidad = 1, talla, color) => {
  // Normalizar null/undefined
  talla = talla || null;
  color = color || null;
  
  const product = await Product.findOne({ _id: productoId, isActive: true });
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });

  // Solo validar talla si el producto tiene tallas habilitadas
  if (product.tallas?.habilitadas?.length > 0 && talla) {
    if (!product.tallas.habilitadas.includes(talla)) {
      throw Object.assign(new Error('Talla no disponible.'), { statusCode: 400 });
    }
  }
  
  // Solo validar color si el producto tiene colores
  if (product.colores?.length > 0 && color) {
    const colorDisponible = product.colores.find(c => c.nombre === color || c.codigo === color);
    if (!colorDisponible || !colorDisponible.habilitado) {
      throw Object.assign(new Error('Color no disponible.'), { statusCode: 400 });
    }
  }

  let cart = await Cart.findOne({ usuario: userId });
  if (!cart) cart = new Cart({ usuario: userId, items: [] });

  // Buscar item con mismo producto, talla y color
  const existing = cart.items.find(
    (i) => i.producto.toString() === productoId && i.talla === talla && i.color === color
  );
  
  if (existing) {
    existing.cantidad = Math.min(existing.cantidad + cantidad, product.stock);
  } else {
    cart.items.push({ 
      producto: productoId, 
      cantidad: Math.min(cantidad, product.stock),
      talla,
      color
    });
  }

  await cart.save();
  return getCart(userId);
};

const updateCartItem = async (userId, productoId, cantidad, talla, color) => {
  // Normalizar null/undefined
  talla = talla || null;
  color = color || null;
  
  const cart = await Cart.findOne({ usuario: userId });
  if (!cart) throw Object.assign(new Error('Carrito no encontrado.'), { statusCode: 404 });

  const item = cart.items.find((i) => 
    i.producto.toString() === productoId && i.talla === talla && i.color === color
  );
  if (!item) throw Object.assign(new Error('Item no encontrado.'), { statusCode: 404 });

  if (cantidad <= 0) {
    cart.items = cart.items.filter((i) => 
      !(i.producto.toString() === productoId && i.talla === talla && i.color === color)
    );
  } else {
    item.cantidad = cantidad;
  }

  await cart.save();
  return getCart(userId);
};

const removeFromCart = async (userId, productoId, talla, color) => {
  // Normalizar null/undefined
  talla = talla || null;
  color = color || null;
  
  const cart = await Cart.findOne({ usuario: userId });
  if (!cart) return { items: [] };

  cart.items = cart.items.filter((i) => 
    !(i.producto.toString() === productoId && i.talla === talla && i.color === color)
  );
  
  await cart.save();
  return getCart(userId);
};

const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ usuario: userId }, { items: [] });
};

module.exports = { getCart, syncCart, addToCart, updateCartItem, removeFromCart, clearCart };
