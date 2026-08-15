import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-[calc(100vh-72px)] flex flex-col items-center justify-center px-4 text-center bg-pearl">
    <p className="font-display text-8xl font-extrabold text-ink mb-2">404</p>
    <div className="w-16 h-1 bg-primary-400 rounded-full mb-6" />
    <p className="font-display text-2xl font-bold text-ink mb-2">Página no encontrada</p>
    <p className="text-gray-500 mb-8">La página que buscás no existe o fue movida.</p>
    <Link to="/" className="btn-primary">Volver al inicio</Link>
  </div>
);

export default NotFound;
