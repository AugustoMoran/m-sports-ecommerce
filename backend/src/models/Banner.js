const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true },
    subtitulo: { type: String, trim: true },
    imagen: { type: String, required: true },
    imagenPublicId: { type: String },
    ctaTexto: { type: String, default: 'Ver productos' },
    ctaLink: { type: String, default: '/productos' },
    gradient: { type: String, default: 'from-blue-900/70 to-transparent' },
    activo: { type: Boolean, default: true },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
