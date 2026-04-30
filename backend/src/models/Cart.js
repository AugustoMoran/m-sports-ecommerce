const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    cantidad: { type: Number, required: true, min: 1, default: 1 },
    talla: { type: String, required: false, default: null },
    color: { type: String, required: false, default: null },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
