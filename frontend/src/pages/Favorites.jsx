import React, { useEffect } from 'react';
import { useGetFavoritesQuery, useToggleFavoriteMutation } from '../services/authApi';
import ProductCard from '../components/products/ProductCard';
import { Link } from 'react-router-dom';

const Favorites = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: favorites = [], isLoading } = useGetFavoritesQuery();

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card">
            <div className="aspect-square bg-pearl" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-pearl rounded" />
              <div className="h-4 bg-pearl rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page-wrap py-10">
      <p className="section-kicker mb-1">Cuenta</p>
      <h1 className="section-title mb-8">Mis favoritos</h1>

      {favorites.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <p className="mb-4">No tenés productos favoritos aún.</p>
          <Link to="/productos" className="btn-primary">Explorar productos</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {favorites.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
};

export default Favorites;
