const productService = require('../services/productService');

const getProducts = async (req, res, next) => {
  try {
    const { page, limit, categoria, search, sort } = req.query;
    const data = await productService.getProducts({ page, limit, categoria, search, sort });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const getRelated = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    const categoriaId = product.categoria?._id || product.categoria || null;
    if (!categoriaId) return res.json([]);
    const related = await productService.getRelatedProducts(product._id, categoriaId);
    res.json(related);
  } catch (error) {
    next(error);
  }
};

const getSuggestions = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    const suggestions = await productService.getSuggestions(q, parseInt(limit));
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ message: 'Producto eliminado.' });
  } catch (error) {
    next(error);
  }
};

const addImage = async (req, res, next) => {
  try {
    const { url, publicId } = req.body;
    const product = await productService.addProductImage(req.params.id, url, publicId);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const removeImage = async (req, res, next) => {
  try {
    const product = await productService.removeProductImage(req.params.id, req.body.publicId);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const addVideo = async (req, res, next) => {
  try {
    const { url, publicId } = req.body;
    const product = await productService.addProductVideo(req.params.id, url, publicId);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const removeVideo = async (req, res, next) => {
  try {
    const product = await productService.removeProductVideo(req.params.id, req.body.publicId);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProduct, getRelated, getSuggestions, createProduct, updateProduct, deleteProduct, addImage, removeImage, addVideo, removeVideo };
