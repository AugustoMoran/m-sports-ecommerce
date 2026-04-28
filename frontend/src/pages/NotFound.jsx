import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 text-center">
    <h1 className="text-8xl font-extrabold text-primary-600 mb-4">404</h1>
    <p className="text-2xl font-bold text-gray-800 mb-2">Página no encontrada</p>
    <p className="text-gray-500 mb-8">La página que buscás no existe o fue movida.</p>
    <Link to="/" className="btn-primary">Volver al inicio</Link>
  </div>
);

export default NotFound;
