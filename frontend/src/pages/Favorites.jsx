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
            <div className="aspect-square bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-8">Mis favoritos</h1>

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
