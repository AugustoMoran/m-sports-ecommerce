const Coupon = require('../models/Coupon');

const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

const validateCoupon = async (req, res, next) => {
  try {
    const { codigo, subtotal } = req.body;
    const coupon = await Coupon.findOne({ codigo: codigo.toUpperCase() });

    if (!coupon || !coupon.isValid()) {
      return res.status(400).json({ message: 'Cupón inválido o vencido.' });
    }
    if (subtotal && subtotal < coupon.minimoCompra) {
      return res.status(400).json({ message: `Mínimo de compra: $${coupon.minimoCompra}` });
    }

    const descuento = coupon.tipo === 'porcentaje'
      ? (subtotal || 0) * (coupon.valor / 100)
      : coupon.valor;

    res.json({ valid: true, coupon, descuento });
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Cupón no encontrado.' });
    res.json(coupon);
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cupón eliminado.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCoupons, validateCoupon, createCoupon, updateCoupon, deleteCoupon };
