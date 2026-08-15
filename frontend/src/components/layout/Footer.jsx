import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaWhatsapp, FaTiktok } from 'react-icons/fa';

const Footer = () => {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000';
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/tutienda';
  const tiktokUrl = import.meta.env.VITE_TIKTOK_URL || 'https://www.tiktok.com/@sin_limite_136';
  const storeName = import.meta.env.VITE_STORE_NAME || 'Mi Tienda';

  const social = [
    { href: `https://wa.me/${waNumber}`, label: 'WhatsApp', icon: FaWhatsapp, className: 'hover:bg-[#25D366] hover:border-[#25D366]' },
    { href: instagramUrl, label: 'Instagram', icon: FaInstagram, className: 'hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 hover:border-transparent' },
    { href: tiktokUrl, label: 'TikTok', icon: FaTiktok, className: 'hover:bg-white hover:text-ink hover:border-white' },
  ];

  return (
    <footer className="bg-ink text-gray-400 mt-20">
      <div className="h-1 bg-primary-400" />
      <div className="page-wrap py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <img src="/logo.png" alt="M Sports" className="h-16 w-auto mb-5 object-contain" />
            <p className="font-display text-xl font-bold text-white tracking-wide mb-3 uppercase">
              {storeName}
            </p>
            <p className="text-sm leading-relaxed max-w-sm mb-6">
              Indumentaria y artículos deportivos. Envíos a todo el país. Pagá con Mercado Pago o coordiná por WhatsApp.
            </p>
            <div className="flex gap-3">
              {social.map(({ href, label, icon: Icon, className }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white transition-all ${className}`}
                  aria-label={label}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-wider">Tienda</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/productos" className="hover:text-primary-400 transition-colors">Productos</Link></li>
              <li><Link to="/productos?sort=popular" className="hover:text-primary-400 transition-colors">Más vendidos</Link></li>
              <li><Link to="/mis-ordenes" className="hover:text-primary-400 transition-colors">Mis pedidos</Link></li>
              <li><Link to="/favoritos" className="hover:text-primary-400 transition-colors">Favoritos</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-wider">Sucursales</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <p className="font-medium text-primary-400">Morón — Local 1</p>
                <p>25 de mayo 136</p>
                <p>Galería Ciudad Local 25</p>
              </li>
              <li>
                <p className="font-medium text-primary-400">Morón — Local 2</p>
                <p>Av. Rivadavia 18252</p>
                <p>Local 6</p>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contacto</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="page-wrap text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
