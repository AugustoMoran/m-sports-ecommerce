const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tipo: { type: String, enum: ['porcentaje', 'monto'], required: true },
    valor: { type: Number, required: true, min: 0 },
    minimoCompra: { type: Number, default: 0 },
    maxUsos: { type: Number, default: null },
    usosActuales: { type: Number, default: 0 },
    fechaVencimiento: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.fechaVencimiento && new Date() > this.fechaVencimiento) return false;
  if (this.maxUsos !== null && this.usosActuales >= this.maxUsos) return false;
  return true;
};

module.exports = mongoose.model('Coupon', couponSchema);
