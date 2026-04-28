const mongoose = require('mongoose');

const popupConfigSchema = new mongoose.Schema(
  {
    activo: { type: Boolean, default: true },
    titulo: { type: String, default: '¿Buscás atención personalizada?' },
    descripcion: {
      type: String,
      default: 'Hablá con nosotros por WhatsApp y te ayudamos a encontrar exactamente lo que necesitás.',
    },
    ctaTexto: { type: String, default: 'Hablar por WhatsApp' },
    whatsappNumero: { type: String, default: '5491100000000' },
    mensajePrellenado: {
      type: String,
      default: 'Hola, estuve viendo la página y me gustaría recibir atención personalizada.',
    },
    imagen: { type: String, default: '' },
    imagenPublicId: { type: String, default: '' },
    tiempoAparicion: { type: Number, default: 5 }, // segundos
  },
  { timestamps: true }
);

module.exports = mongoose.model('PopupConfig', popupConfigSchema);
