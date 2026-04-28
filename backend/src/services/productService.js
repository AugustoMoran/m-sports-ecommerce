const Product = require('../models/Product');
const Category = require('../models/Category');
const { cloudinary } = require('../config/cloudinary');

const getProducts = async ({ page = 1, limit = 12, categoria, search, sort, sinStock }) => {
  const query = { isActive: true };

  if (categoria) query.categoria = categoria;
  if (search) query.$text = { $search: search };
  if (sinStock === 'true' || sinStock === true) query.stock = { $lte: 0 };

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { precio: 1 },
    'price-desc': { precio: -1 },
    popular: { vendidos: -1 },
  };
  const sortBy = sortOptions[sort] || { createdAt: -1 };

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('categoria', 'nombre')
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    products,
    page: Number(page),
    pages: Math.ceil(total / limit),
    total,
  };
};

const getProductById = async (id) => {
  const product = await Product.findOne({ _id: id, isActive: true }).populate('categoria', 'nombre');
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  return product;
};

const getRelatedProducts = async (productId, categoriaId, limit = 4) => {
  return Product.find({
    _id: { $ne: productId },
    categoria: categoriaId,
    isActive: true,
  })
    .limit(limit)
    .lean();
};

const sanitizeProductData = (data) => {
  const clean = { ...data };
  if (!clean.categoria) delete clean.categoria;
  if (!clean.descripcion) clean.descripcion = '';
  if (!clean.precioOferta) clean.precioOferta = null;
  return clean;
};

const createProduct = async (data) => {
  const product = await Product.create(sanitizeProductData(data));
  return product;
};

const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, sanitizeProductData(data), { new: true, runValidators: true });
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });

  // Delete images from Cloudinary
  for (const img of product.imagenes) {
    await cloudinary.uploader.destroy(img.publicId).catch(() => {});
  }

  await product.softDelete();
};

const addProductImage = async (productId, url, publicId) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  if (product.imagenes.length >= 7) {
    throw Object.assign(new Error('Máximo 7 imágenes por producto.'), { statusCode: 400 });
  }
  product.imagenes.push({ url, publicId });
  return product.save();
};

const removeProductImage = async (productId, publicId) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });

  await cloudinary.uploader.destroy(publicId);
  product.imagenes = product.imagenes.filter((img) => img.publicId !== publicId);
  return product.save();
};

const getSuggestions = async (q, limit = 10) => {
  if (!q || q.trim().length === 0) return [];
  
  const query = q.trim().toLowerCase();
  const suggestions = await Product.find({
    isActive: true,
    $or: [
      { nombre: { $regex: `^${query}`, $options: 'i' } },
      { nombre: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ],
  })
    .select('_id nombre precio precioOferta imagenes')
    .limit(limit)
    .lean();
  
  return suggestions;
};

module.exports = {
  getProducts,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  removeProductImage,
  getSuggestions,
};
