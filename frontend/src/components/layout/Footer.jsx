import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { HiMail, HiPhone } from 'react-icons/hi';

const Footer = () => {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000';
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/tutienda';
  const storeName = import.meta.env.VITE_STORE_NAME || 'Mi Tienda';

  return (
    <footer className="bg-[#0D0D0D] text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
                <span className="text-gray-900 font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-xl text-white">{storeName}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Tu tienda online de confianza. Productos de calidad con la mejor atención.
            </p>
            <div className="flex gap-3">
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center hover:bg-green-500 transition-colors"
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={18} />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="Instagram"
              >
                <FaInstagram size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Tienda</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/productos" className="hover:text-white transition-colors">Productos</Link></li>
              <li><Link to="/productos?sort=popular" className="hover:text-white transition-colors">Más vendidos</Link></li>
              <li><Link to="/mis-ordenes" className="hover:text-white transition-colors">Mis pedidos</Link></li>
              <li><Link to="/favoritos" className="hover:text-white transition-colors">Favoritos</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <FaWhatsapp size={14} className="text-green-400" />
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2">
                <FaInstagram size={14} className="text-pink-400" />
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
