import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiHeart, HiOutlineShoppingCart } from 'react-icons/hi';
import { formatCurrency } from '../../utils/formatCurrency';
import useCart from '../../hooks/useCart';
import { useToggleFavoriteMutation, useGetMeQuery } from '../../services/authApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const user = useSelector(selectCurrentUser);
  const { data: me } = useGetMeQuery(undefined, { skip: !user });
  const [toggleFavorite] = useToggleFavoriteMutation();

  const isFavorite = me?.favoritos?.includes(product._id);
  const image = product.imagenes?.[0]?.url || 'https://via.placeholder.com/400x400?text=Sin+imagen';
  const displayPrice = product.precioOferta || product.precio;
  const hasDiscount = product.precioOferta && product.precioOferta < product.precio;

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Iniciá sesión para agregar favoritos'); return; }
    try {
      await toggleFavorite(product._id).unwrap();
    } catch (_) {}
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  return (
    <Link to={`/productos/${product._id}`} className="group card flex flex-col h-full hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
      <div className="relative overflow-hidden aspect-square bg-pearl">
        <img
          src={image}
          alt={product.nombre}
          loading="lazy"
          className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
        />
        {hasDiscount && (
          <span className="absolute top-3 left-3 badge bg-ink text-primary-400 font-bold text-[11px] px-2.5 py-1">
            -{Math.round(((product.precio - product.precioOferta) / product.precio) * 100)}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-ink/50 flex items-center justify-center backdrop-blur-[2px]">
            <span className="text-white font-semibold text-sm bg-ink/80 px-3 py-1 rounded-full">Sin stock</span>
          </div>
        )}
        <button
          onClick={handleFavorite}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          className="absolute top-3 right-3 w-9 h-9 bg-white/95 rounded-full shadow-sm flex items-center justify-center transition-all hover:scale-110"
        >
          {isFavorite ? (
            <HiHeart size={16} className="text-red-500" />
          ) : (
            <HiOutlineHeart size={16} className="text-gray-500" />
          )}
        </button>
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1 truncate">{product.categoria?.nombre}</p>
        <h3 className="font-semibold text-sm line-clamp-2 mb-3 text-ink group-hover:text-gray-700 transition-colors min-h-[2.5rem]">
          {product.nombre}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-display font-bold text-ink">{formatCurrency(displayPrice)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">{formatCurrency(product.precio)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            aria-label="Agregar al carrito"
            className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center hover:bg-primary-400 hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <HiOutlineShoppingCart size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
