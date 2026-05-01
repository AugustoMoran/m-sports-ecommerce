const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    titulo: { type: String, default: '' },
    subtitulo: { type: String, default: '' },
    imagen: { type: String, default: '' },
    imagenPublicId: { type: String, default: '' },
    video: { type: String, default: '' },
    videoPublicId: { type: String, default: '' },
    mostrarTexto: { type: Boolean, default: true },
    ctaTexto: { type: String, default: 'Ver productos' },
    ctaLink: { type: String, default: '/productos' },
    mostrarBoton: { type: Boolean, default: true },
    autoplay: { type: Boolean, default: false },
    gradient: { type: String, default: 'from-blue-900/70 to-transparent' },
    activo: { type: Boolean, default: true },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Validación: al menos imagen o video debe estar presente
bannerSchema.pre('save', function(next) {
  if (!this.imagen && !this.video) {
    next(new Error('Banner debe tener al menos una imagen o un video'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Banner', bannerSchema);
