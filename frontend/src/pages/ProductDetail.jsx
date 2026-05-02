import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetProductQuery, useGetRelatedProductsQuery } from '../services/productsApi';
import { useToggleFavoriteMutation, useGetMeQuery } from '../services/authApi';
import { formatCurrency } from '../utils/formatCurrency';
import useCart from '../hooks/useCart';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import ProductCard from '../components/products/ProductCard';
import { HiOutlineHeart, HiHeart, HiOutlineShoppingCart, HiChevronLeft, HiOutlineFilm, HiChevronRight } from 'react-icons/hi';
import { FaWhatsapp, FaCreditCard } from 'react-icons/fa';
import { generateWhatsAppLink } from '../utils/generateWhatsAppLink';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const user = useSelector(selectCurrentUser);
  const { data: product, isLoading, error } = useGetProductQuery(id);
  const { data: related = [] } = useGetRelatedProductsQuery(id, { skip: !product });
  const { data: me } = useGetMeQuery(undefined, { skip: !user });
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  // Scroll to top when component mounts or when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const handleBuyWithMP = () => {
    const needsTalla = product.tallas?.habilitadas?.length > 0;
    const needsColor = product.colores?.length > 0;
    
    if ((needsTalla && !selectedTalla) || (needsColor && !selectedColor)) {
      alert('Por favor selecciona talla y color');
      return;
    }
    addToCart(product, qty, selectedTalla, selectedColor);
    navigate('/checkout');
  };

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
  
  // Combinar imágenes y videos en un carrusel
  const media = [];
  if (product.imagenes?.length) {
    product.imagenes.forEach(img => media.push({ type: 'image', ...img }));
  }
  if (product.videos?.length) {
    product.videos.forEach(vid => media.push({ type: 'video', ...vid }));
  }
  if (media.length === 0) {
    media.push({ type: 'image', url: 'https://via.placeholder.com/600x600?text=Sin+imagen' });
  }

  const waLink = generateWhatsAppLink(
    [{ producto: product, cantidad: qty, talla: selectedTalla, color: selectedColor }],
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
        {/* Media Carousel */}
        <div>
          <div className="rounded-2xl overflow-hidden bg-white mb-3 relative group">
            {media[selectedImage]?.type === 'video' ? (
              <video
                src={media[selectedImage]?.url}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-contain"
              />
            ) : (
              <img
                src={media[selectedImage]?.url}
                alt={product.nombre}
                className="w-full h-auto object-contain"
              />
            )}

            {/* Botones de navegación */}
            {media.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((prev) => (prev === 0 ? media.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <HiChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setSelectedImage((prev) => (prev === media.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <HiChevronRight size={24} />
                </button>

                {/* Contador */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {selectedImage + 1} / {media.length}
                </div>
              </>
            )}
          </div>
          {media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {media.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImage === i ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  {item.type === 'video' ? (
                    <>
                      <video src={item.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <HiOutlineFilm size={20} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  )}
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

          {/* Tallas - Solo si el producto tiene tallas */}
          {product.tallas?.habilitadas?.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Talla {product.tallas?.rango && `(${product.tallas.rango})`}
              </label>
              <div className="flex gap-2 flex-wrap">
                {product.tallas?.habilitadas?.map((talla) => (
                  <button
                    key={talla}
                    onClick={() => setSelectedTalla(talla)}
                    className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                      selectedTalla === talla
                        ? 'border-yellow-400 bg-yellow-400 text-gray-900'
                        : 'border-gray-300 text-gray-600 hover:border-yellow-300'
                    }`}
                  >
                    {talla}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colores - Solo si el producto tiene colores */}
          {product.colores?.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Color {product.colores?.length > 0 && `(${product.colores.length})`}
              </label>
              <div className="flex gap-3 flex-wrap">
                {product.colores?.map((color) => (
                  <button
                    key={color.codigo}
                    onClick={() => setSelectedColor(color.nombre)}
                    disabled={!color.habilitado}
                    className={`relative w-12 h-12 rounded-lg border-2 transition-all ${
                      selectedColor === color.nombre
                        ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${!color.habilitado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ backgroundColor: color.codigo }}
                    title={color.nombre}
                  >
                    {selectedColor === color.nombre && (
                      <div className="absolute inset-0 flex items-center justify-center text-white font-bold">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          {product.stock > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-900">Cantidad:</label>
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
                onClick={() => {
                  const needsTalla = product.tallas?.habilitadas?.length > 0;
                  const needsColor = product.colores?.length > 0;
                  
                  if ((needsTalla && !selectedTalla) || (needsColor && !selectedColor)) {
                    alert('Por favor selecciona talla y color');
                    return;
                  }
                  addToCart(product, qty, selectedTalla, selectedColor);
                }}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <HiOutlineShoppingCart size={20} />
                Agregar al carrito
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleBuyWithMP}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    (product.tallas?.habilitadas?.length > 0 && !selectedTalla) ||
                    (product.colores?.length > 0 && !selectedColor)
                  }
                >
                  <FaCreditCard size={20} />
                  <div className="flex flex-col items-center">
                    <span className="text-xs opacity-90">Pagar con</span>
                    <span className="text-sm">Mercado Pago</span>
                  </div>
                </button>

                <a
                  onClick={(e) => {
                    const needsTalla = product.tallas?.habilitadas?.length > 0;
                    const needsColor = product.colores?.length > 0;
                    
                    if ((needsTalla && !selectedTalla) || (needsColor && !selectedColor)) {
                      e.preventDefault();
                      alert('Por favor selecciona talla y color');
                    }
                  }}
                  href={(product.tallas?.habilitadas?.length === 0 || selectedTalla) && (product.colores?.length === 0 || selectedColor) ? waLink : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaWhatsapp size={20} />
                  <div className="flex flex-col items-center">
                    <span className="text-xs opacity-90">Consultar por</span>
                    <span className="text-sm">WhatsApp</span>
                  </div>
                </a>
              </div>
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
