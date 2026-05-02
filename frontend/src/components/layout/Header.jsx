import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiOutlineShoppingCart,
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineHeart,
  HiX,
  HiMenu,
  HiChevronDown,
} from 'react-icons/hi';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import { toggleMenu, closeMenu } from '../../features/ui/uiSlice';
import { useGetCategoriesQuery, useGetProductSuggestionsQuery } from '../../services/productsApi';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const { count, toggleCart } = useCart();
  const menuOpen = useSelector((s) => s.ui.menuOpen);
  const { data: categories = [] } = useGetCategoriesQuery();
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  
  const { data: suggestions = [] } = useGetProductSuggestionsQuery(search);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/productos?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setShowSuggestions(false);
      dispatch(closeMenu());
    }
  };

  const handleSuggestionClick = (product) => {
    navigate(`/productos/${product._id}`);
    setSearch('');
    setShowSuggestions(false);
    dispatch(closeMenu());
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-yellow-400 shadow-lg border-b-4 border-gray-900' : 'bg-yellow-400 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch(toggleMenu())}
                className="p-2 rounded-xl hover:bg-amber-300 transition-colors text-gray-900"
                aria-label="Menú"
              >
                {menuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
              </button>
              <Link to="/" className="flex items-center gap-2" onClick={() => dispatch(closeMenu())}>
                <img src="/m-sports-logo.png" alt="M Sports Logo" className="h-14 w-auto object-contain" />
              </Link>
            </div>

            {/* Desktop search */}
            <div className="hidden md:flex flex-1 max-w-md mx-6 relative" ref={suggestionsRef}>
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative w-full">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Buscar productos..."
                    className="input-field pl-10 pr-4 py-2 text-sm bg-white text-gray-900 border-none focus:ring-2 focus:ring-gray-900 w-full"
                  />
                </div>
              </form>
              
              {/* Suggestions dropdown */}
              {showSuggestions && search.trim().length > 0 && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                  {suggestions.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => handleSuggestionClick(product)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-50 transition-colors border-b border-slate-100 last:border-b-0 text-left"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {product.imagenes?.[0]?.url ? (
                          <img src={product.imagenes[0].url} alt={product.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <HiOutlineSearch size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.nombre}</p>
                        <p className="text-xs text-gray-500">
                          ${product.precioOferta ? product.precioOferta.toLocaleString('es-AR') : product.precio.toLocaleString('es-AR')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No results message */}
              {showSuggestions && search.trim().length > 0 && suggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-4 text-center text-sm text-gray-500">
                  No se encontraron productos
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center gap-1 p-2 rounded-xl hover:bg-amber-300 transition-colors text-gray-900">
                    <HiOutlineUser size={22} />
                    <span className="hidden sm:block text-sm font-medium max-w-[80px] truncate">
                      {user?.nombre}
                    </span>
                    <HiChevronDown size={14} className="hidden sm:block" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link to="/perfil" className="block px-4 py-2 text-sm hover:bg-slate-50">Mi perfil</Link>
                    <Link to="/mis-ordenes" className="block px-4 py-2 text-sm hover:bg-slate-50">Mis pedidos</Link>
                    <Link to="/favoritos" className="block px-4 py-2 text-sm hover:bg-slate-50">Favoritos</Link>
                    {isAdmin && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-gray-900 font-bold hover:bg-amber-50 border-t border-slate-200">
                        Panel Admin
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 border-t border-slate-200"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="p-2 rounded-xl hover:bg-amber-300 transition-colors text-gray-900">
                  <HiOutlineUser size={22} />
                </Link>
              )}

              {isAuthenticated && (
                <Link to="/favoritos" className="p-2 rounded-xl hover:bg-amber-300 transition-colors text-gray-900">
                  <HiOutlineHeart size={22} />
                </Link>
              )}

              <button
                onClick={toggleCart}
                className="relative p-2 rounded-xl hover:bg-amber-300 transition-colors text-gray-900"
              >
                <HiOutlineShoppingCart size={22} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-amber-400 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile slide-in menu */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          menuOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => dispatch(closeMenu())}
        />

        {/* Drawer */}
        <nav
          className={`absolute top-0 left-0 w-72 h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-400 to-amber-300">
            <span className="font-bold text-lg text-gray-900">Menú</span>
            <button onClick={() => dispatch(closeMenu())} className="p-1 rounded-lg hover:bg-amber-300 text-gray-900">
              <HiX size={22} />
            </button>
          </div>

          {/* Mobile search */}
          <form onSubmit={handleSearch} className="px-5 py-3 border-b border-slate-200 relative">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Buscar..."
                className="input-field pl-9 py-2 text-sm bg-white text-gray-900 border-none focus:ring-2 focus:ring-gray-900 w-full"
              />
            </div>
            
            {/* Suggestions dropdown mobile */}
            {showSuggestions && search.trim().length > 0 && suggestions.length > 0 && (
              <div className="absolute top-full left-5 right-5 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {suggestions.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => handleSuggestionClick(product)}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-amber-50 transition-colors border-b border-slate-100 last:border-b-0 text-left text-sm"
                  >
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                      {product.imagenes?.[0]?.url ? (
                        <img src={product.imagenes[0].url} alt={product.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <HiOutlineSearch size={14} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-xs">{product.nombre}</p>
                      <p className="text-xs text-gray-500">
                        ${product.precioOferta ? product.precioOferta.toLocaleString('es-AR') : product.precio.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
            <Link
              to="/"
              onClick={() => dispatch(closeMenu())}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-300 font-medium transition-colors text-gray-900"
            >
              Inicio
            </Link>
            <Link
              to="/productos"
              onClick={() => dispatch(closeMenu())}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-300 font-medium transition-colors text-gray-900"
            >
              Todos los productos
            </Link>


            {categories.length > 0 && (
              <div className="pt-2">
                <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Categorías
                </p>
                {categories.map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/productos?categoria=${cat._id}`}
                    onClick={() => dispatch(closeMenu())}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-amber-300 text-sm transition-colors text-gray-800"
                  >
                    {cat.nombre}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-200 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/perfil"
                  onClick={() => dispatch(closeMenu())}
                  className="block w-full text-center btn-secondary text-sm"
                >
                  Mi perfil
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => dispatch(closeMenu())}
                    className="block w-full text-center bg-gradient-to-r from-gray-900 to-black text-amber-400 font-bold py-2 px-4 rounded-xl text-sm hover:from-black hover:to-gray-900 transition-colors"
                  >
                    ⚙️ Panel Admin
                  </Link>
                )}
                <button onClick={() => { logout(); dispatch(closeMenu()); }} className="w-full btn-danger text-sm">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => dispatch(closeMenu())} className="block w-full text-center btn-primary text-sm">
                  Iniciar sesión
                </Link>
                <Link to="/registro" onClick={() => dispatch(closeMenu())} className="block w-full text-center btn-secondary text-sm">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Header;
