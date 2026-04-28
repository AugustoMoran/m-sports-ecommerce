import React, { useState, useEffect, useRef } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { HiX, HiSparkles } from 'react-icons/hi';
import { useGetPopupConfigQuery } from '../../services/popupApi';

// Imagen default: shopping premium (Unsplash, libre de derechos)
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80';

const DEFAULTS = {
  titulo: '¿Buscás atención personalizada?',
  descripcion:
    'Hablá con nosotros por WhatsApp y te ayudamos a encontrar exactamente lo que necesitás.',
  ctaTexto: 'Hablar por WhatsApp',
  whatsappNumero: '5491100000000',
  mensajePrellenado:
    'Hola, estuve viendo la página y me gustaría recibir atención personalizada.',
  imagen: DEFAULT_IMAGE,
  tiempoAparicion: 5,
  activo: true,
};

const WhatsAppPopup = () => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const { data: rawConfig } = useGetPopupConfigQuery();

  // Merge config con defaults — si un campo está vacío, cae al default
  const cfg = {
    ...DEFAULTS,
    ...rawConfig,
    titulo: rawConfig?.titulo?.trim() || DEFAULTS.titulo,
    descripcion: rawConfig?.descripcion?.trim() || DEFAULTS.descripcion,
    ctaTexto: rawConfig?.ctaTexto?.trim() || DEFAULTS.ctaTexto,
    whatsappNumero: rawConfig?.whatsappNumero?.trim() || DEFAULTS.whatsappNumero,
    mensajePrellenado: rawConfig?.mensajePrellenado?.trim() || DEFAULTS.mensajePrellenado,
    imagen: rawConfig?.imagen?.trim() || DEFAULTS.imagen,
    tiempoAparicion:
      Number(rawConfig?.tiempoAparicion) > 0
        ? Number(rawConfig.tiempoAparicion)
        : DEFAULTS.tiempoAparicion,
    activo: rawConfig?.activo !== false, // true por defecto
  };

  useEffect(() => {
    if (!cfg.activo) return;

    // No mostrar si ya se cerró en esta sesión
    if (sessionStorage.getItem('wa_popup_closed') === '1') return;

    timerRef.current = setTimeout(() => {
      setVisible(true);
      // Pequeño delay para disparar la animación de entrada
      requestAnimationFrame(() => setAnimating(true));
    }, cfg.tiempoAparicion * 1000);

    return () => clearTimeout(timerRef.current);
  }, [cfg.activo, cfg.tiempoAparicion]);

  const handleClose = () => {
    setAnimating(false);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('wa_popup_closed', '1');
    }, 350);
  };

  const waUrl = `https://wa.me/${cfg.whatsappNumero}?text=${encodeURIComponent(
    cfg.mensajePrellenado
  )}`;

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-24 right-4 z-[60] w-[310px] max-w-[calc(100vw-2rem)] transition-all duration-350 ease-out ${
        animating
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-6 scale-95'
      }`}
      style={{ transitionProperty: 'opacity, transform' }}
      role="dialog"
      aria-modal="false"
      aria-label="Chat por WhatsApp"
    >
      {/* Card */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900">

        {/* Imagen de fondo con overlay */}
        <div className="relative h-36 overflow-hidden">
          <img
            src={cfg.imagen}
            alt="Atención personalizada"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
          />
          {/* Overlay degradado */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

          {/* Badge premium */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            <HiSparkles size={10} />
            Exclusivo
          </div>

          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
            aria-label="Cerrar"
          >
            <HiX size={14} />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-4 pt-3 pb-4">
          {/* Título */}
          <h3 className="text-white font-bold text-sm leading-snug mb-1">
            {cfg.titulo}
          </h3>

          {/* Descripción */}
          <p className="text-gray-400 text-xs leading-relaxed mb-3">
            {cfg.descripcion}
          </p>

          {/* CTA WhatsApp */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-green-900/30"
          >
            <FaWhatsapp size={18} />
            {cfg.ctaTexto}
          </a>

          {/* Micro-texto de confianza */}
          <p className="text-center text-gray-500 text-[10px] mt-2">
            Respondemos en minutos · Sin compromisos
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPopup;
