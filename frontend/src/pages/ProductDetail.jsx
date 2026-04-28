import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetProductQuery, useGetRelatedProductsQuery } from '../services/productsApi';
import { useToggleFavoriteMutation, useGetMeQuery } from '../services/authApi';
import { formatCurrency } from '../utils/formatCurrency';
import useCart from '../hooks/useCart';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import ProductCard from '../components/products/ProductCard';
import { HiOutlineHeart, HiHeart, HiOutlineShoppingCart, HiChevronLeft } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { generateWhatsAppLink } from '../utils/generateWhatsAppLink';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const user = useSelector(selectCurrentUser);
  const { data: product, isLoading, error } = useGetProductQuery(id);
  const { data: related = [] } = useGetRelatedProductsQuery(id, { skip: !product });
  const { data: me } = useGetMeQuery(undefined, { skip: !user });
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-square bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
      <p>Producto no encontrado.</p>
      <Link to="/productos" className="btn-primary mt-4 inline-block">Ver productos</Link>
    </div>
  );

  const isFavorite = me?.favoritos?.includes(product._id);
  const displayPrice = product.precioOferta || product.precio;
  const hasDiscount = product.precioOferta && product.precioOferta < product.precio;
  const images = product.imagenes?.length ? product.imagenes : [{ url: 'https://via.placeholder.com/600x600?text=Sin+imagen' }];

  const waLink = generateWhatsAppLink(
    [{ producto: product, cantidad: qty }],
    displayPrice * qty
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/productos" className="flex items-center gap-1 hover:text-primary-600">
          <HiChevronLeft size={16} /> Productos
        </Link>
        <span>/</span>
        <span className="text-gray-400">{product.categoria?.nombre}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.nombre}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
            <img
              src={images[selectedImage]?.url}
              alt={product.nombre}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImage === i ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm text-gray-400">{product.categoria?.nombre}</p>
            <button
              onClick={() => toggleFavorite(product._id)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              {isFavorite ? <HiHeart size={22} className="text-red-500" /> : <HiOutlineHeart size={22} className="text-gray-400" />}
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{product.nombre}</h1>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-extrabold text-gray-900">{formatCurrency(displayPrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatCurrency(product.precio)}</span>
                <span className="badge bg-red-100 text-red-600 font-bold">
                  -{Math.round(((product.precio - product.precioOferta) / product.precio) * 100)}%
                </span>
              </>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{product.descripcion}</p>

          {/* Stock */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="badge bg-green-100 text-green-700">✓ En stock ({product.stock} disponibles)</span>
            ) : (
              <span className="badge bg-red-100 text-red-600">Sin stock</span>
            )}
          </div>

          {/* Quantity + Add to cart */}
          {product.stock > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 hover:bg-gray-50 text-lg"
                  >-</button>
                  <span className="px-4 py-2 font-medium">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    className="px-3 py-2 hover:bg-gray-50 text-lg"
                  >+</button>
                </div>
              </div>

              <button
                onClick={() => addToCart(product, qty)}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <HiOutlineShoppingCart size={20} />
                Agregar al carrito
              </button>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-6 py-3 rounded-xl transition-all active:scale-95"
              >
                <FaWhatsapp size={20} />
                Comprar por WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="pb-16">
          <h2 className="text-xl font-bold mb-6">Productos relacionados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
