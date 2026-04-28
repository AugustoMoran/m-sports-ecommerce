const Category = require('../models/Category');
const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ nombre: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ message: 'Categoría no encontrada.' });
    res.json(category);
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Categoría no encontrada.' });

    const productCount = await Product.countDocuments({ categoria: req.params.id, isActive: true });
    if (productCount > 0) {
      return res.status(400).json({ message: `No se puede eliminar. Tiene ${productCount} productos activos.` });
    }

    if (category.imagenPublicId) {
      await cloudinary.uploader.destroy(category.imagenPublicId).catch(() => {});
    }

    await category.softDelete();
    res.json({ message: 'Categoría eliminada.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
