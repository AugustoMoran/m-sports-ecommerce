import React from 'react';
import { useDispatch } from 'react-redux';
import { HiX, HiOutlineTrash, HiOutlineShoppingBag } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { closeCart, selectCartIsOpen } from '../../features/cart/cartSlice';
import { useSelector } from 'react-redux';
import useCart from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';

const CartDrawer = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectCartIsOpen);
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => dispatch(closeCart())}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <HiOutlineShoppingBag size={20} />
            <span className="font-bold text-lg">Carrito</span>
            {items.length > 0 && (
              <span className="badge bg-primary-100 text-primary-700">{items.length}</span>
            )}
          </div>
          <button onClick={() => dispatch(closeCart())} className="p-1.5 rounded-lg hover:bg-gray-100">
            <HiX size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-3">
              <HiOutlineShoppingBag size={48} className="opacity-30" />
              <p className="text-sm">Tu carrito está vacío</p>
              <Link
                to="/productos"
                onClick={() => dispatch(closeCart())}
                className="btn-primary text-sm"
              >
                Ver productos
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const producto = item.producto;
                const id = producto?._id || producto;
                const price = producto?.precioOferta || producto?.precio || item.precio || 0;
                const imagen = producto?.imagenes?.[0]?.url || '';
                const nombre = producto?.nombre || item.nombre || '';

                return (
                  <li key={id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {imagen && <img src={imagen} alt={nombre} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 mb-1">{nombre}</p>
                      <p className="text-xs text-gray-500 mb-2">{formatCurrency(price)} c/u</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(id, item.cantidad - 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-5 text-center">{item.cantidad}</span>
                        <button
                          onClick={() => updateQuantity(id, item.cantidad + 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeFromCart(id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                      <span className="text-sm font-bold">{formatCurrency(price * item.cantidad)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Total</span>
              <span className="font-bold text-xl">{formatCurrency(total)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => dispatch(closeCart())}
              className="btn-primary block text-center w-full"
            >
              Finalizar compra
            </Link>
            <button
              onClick={() => clearCart()}
              className="w-full py-2 px-4 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
