const User = require('../models/User');

const getProfile = (req, res) => {
  res.json(req.user);
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['nombre', 'apellido', 'telefono', 'direccion'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    const idx = user.favoritos.indexOf(productId);
    if (idx === -1) {
      user.favoritos.push(productId);
    } else {
      user.favoritos.splice(idx, 1);
    }
    await user.save();
    res.json({ favoritos: user.favoritos });
  } catch (error) {
    next(error);
  }
};

const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favoritos',
      select: 'nombre precio precioOferta imagenes isActive',
    });
    res.json(user.favoritos.filter((p) => p.isActive));
  } catch (error) {
    next(error);
  }
};

// Admin
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const total = await User.countDocuments({ isActive: true });
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ users, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    await user.softDelete();
    res.json({ message: 'Usuario desactivado.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, toggleFavorite, getFavorites, getAllUsers, deleteUser };
