import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { HiMail, HiPhone } from 'react-icons/hi';

const Footer = () => {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000';
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/tutienda';
  const tiktokUrl = import.meta.env.VITE_TIKTOK_URL || 'https://www.tiktok.com/@sin_limite_136';
  const storeName = import.meta.env.VITE_STORE_NAME || 'Mi Tienda';

  // DEBUG: Log env variables
  console.log('ENV VARIABLES:', {
    waNumber,
    instagramUrl,
    tiktokUrl,
    storeName,
    raw: {
      VITE_WHATSAPP_NUMBER: import.meta.env.VITE_WHATSAPP_NUMBER,
      VITE_INSTAGRAM_URL: import.meta.env.VITE_INSTAGRAM_URL,
      VITE_TIKTOK_URL: import.meta.env.VITE_TIKTOK_URL,
      VITE_STORE_NAME: import.meta.env.VITE_STORE_NAME,
    }
  });

  return (
    <footer className="bg-[#0D0D0D] text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="Logo" className="h-40 w-auto" />
            </div>
            <p className="text-xl font-extrabold text-white tracking-widest mb-6 text-center md:text-left uppercase drop-shadow-lg">
              {storeName}
            </p>
            <div className="flex gap-6">
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 transition-all transform hover:scale-110 shadow-lg"
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={40} className="text-white" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center hover:opacity-90 transition-all transform hover:scale-110 shadow-lg"
                aria-label="Instagram"
              >
                <FaInstagram size={40} className="text-white" />
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800 transition-all transform hover:scale-110 shadow-lg border-2 border-gray-700"
                aria-label="TikTok"
              >
                <FaTiktok size={40} className="text-white" />
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

          {/* Sucursales */}
          <div>
            <h3 className="font-semibold text-white mb-4">📍 Sucursales</h3>
            <ul className="space-y-3 text-sm">
              <li className="hover:text-white transition-colors">
                <p className="font-medium text-yellow-400">Moron - Local 1</p>
                <p className="text-gray-400">25 de mayo 136</p>
                <p className="text-gray-400">Galería Ciudad Local 25</p>
              </li>
              <li className="hover:text-white transition-colors">
                <p className="font-medium text-yellow-400">Moron - Local 2</p>
                <p className="text-gray-400">Av Rivadavia 18252</p>
                <p className="text-gray-400">Local 6</p>
              </li>
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
              <li className="flex items-center gap-2">
                <FaTiktok size={14} className="text-gray-300" />
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  TikTok
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
