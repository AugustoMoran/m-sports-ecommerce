import React from 'react';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';

const FloatingButtons = () => {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000';
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/tutienda';

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-3">
      {/* Instagram */}
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d)' }}
        aria-label="Instagram"
      >
        <FaInstagram size={22} color="white" />
      </a>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 bg-green-500 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 hover:bg-green-400"
        aria-label="WhatsApp"
      >
        <FaWhatsapp size={24} color="white" />
      </a>
    </div>
  );
};

export default FloatingButtons;
