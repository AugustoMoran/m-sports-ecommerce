import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCartItems, selectCartTotal, clearGuestCart } from '../features/cart/cartSlice';
import { useDispatch } from 'react-redux';
import { useCreateOrderMutation, useValidateCouponMutation } from '../services/ordersApi';
import { useClearCartMutation } from '../services/cartApi';
import { selectCurrentUser } from '../features/auth/authSlice';
import { formatCurrency } from '../utils/formatCurrency';
import { generateWhatsAppLink } from '../utils/generateWhatsAppLink';
import toast from 'react-hot-toast';
import { FaWhatsapp, FaCreditCard } from 'react-icons/fa';

const REQUIRED_GUEST_FIELDS = ['nombre', 'apellido', 'email', 'telefono'];

const Checkout = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [clearCartApi] = useClearCartMutation();
  const [validateCoupon] = useValidateCouponMutation();

  const [guestData, setGuestData] = useState({ nombre: '', apellido: '', email: '', telefono: '', direccion: '' });
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [payMethod, setPayMethod] = useState('mercadopago');

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Tu carrito está vacío.</p>
        <button onClick={() => navigate('/productos')} className="btn-primary">Ver productos</button>
      </div>
    );
  }

  const orderItems = items.map((i) => ({
    producto: i.producto?._id || i.producto,
    cantidad: i.cantidad,
    talla: i.talla || null,
    color: i.color || null,
  }));

  const finalTotal = couponResult ? Math.max(0, total - couponResult.descuento) : total;

  const handleApplyCoupon = async () => {
    try {
      const result = await validateCoupon({ codigo: couponCode, subtotal: total }).unwrap();
      setCouponResult(result);
      toast.success(`Cupón aplicado: -${formatCurrency(result.descuento)}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Cupón inválido');
      setCouponResult(null);
    }
  };

  const handleOrder = async (metodoPago) => {
    if (!user) {
      for (const field of REQUIRED_GUEST_FIELDS) {
        if (!guestData[field]) {
          toast.error(`El campo "${field}" es requerido`);
          return;
        }
      }
    }

    try {
      const payload = {
        items: orderItems,
        metodoPago,
        cuponCodigo: couponResult ? couponCode : undefined,
        ...(user ? {} : { guestData }),
      };

      const result = await createOrder(payload).unwrap();

      if (metodoPago === 'mercadopago' && result.mpData?.initPoint) {
        // Cart is cleared by the webhook once MP confirms the payment
        window.location.href = result.mpData.initPoint;
        return;
      }

      if (metodoPago === 'whatsapp') {
        // User committed to buy → clear cart immediately
        if (user) {
          await clearCartApi().unwrap().catch(() => {});
        } else {
          dispatch(clearGuestCart());
        }
        const waLink = generateWhatsAppLink(items, finalTotal);
        window.open(waLink, '_blank');
      }

      navigate(`/orden/confirmacion?order=${result.order._id}&status=success`);
    } catch (err) {
      toast.error(err?.data?.message || 'Error al procesar la orden');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-8">Finalizar compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Guest data form */}
          {!user && (
            <div className="card p-6">
              <h2 className="font-semibold text-lg mb-4">Tus datos</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'nombre', label: 'Nombre', required: true },
                  { name: 'apellido', label: 'Apellido', required: true },
                  { name: 'email', label: 'Email', type: 'email', required: true },
                  { name: 'telefono', label: 'Teléfono', required: true },
                ].map(({ name, label, type = 'text', required }) => (
                  <div key={name} className={name === 'email' ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium mb-1">
                      {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={type}
                      value={guestData[name]}
                      onChange={(e) => setGuestData({ ...guestData, [name]: e.target.value })}
                      className="input-field"
                      required={required}
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Dirección de entrega</label>
                  <input
                    type="text"
                    value={guestData.direccion}
                    onChange={(e) => setGuestData({ ...guestData, direccion: e.target.value })}
                    className="input-field"
                    placeholder="Calle, número, ciudad..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Coupon */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Cupón de descuento</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="CODIGO2024"
                className="input-field uppercase"
              />
              <button onClick={handleApplyCoupon} className="btn-secondary whitespace-nowrap">
                Aplicar
              </button>
            </div>
            {couponResult && (
              <p className="text-green-600 text-sm mt-2">✓ Descuento: -{formatCurrency(couponResult.descuento)}</p>
            )}
          </div>

          {/* Payment method */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Método de pago</h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${payMethod === 'mercadopago' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" value="mercadopago" checked={payMethod === 'mercadopago'} onChange={() => setPayMethod('mercadopago')} className="sr-only" />
                <FaCreditCard size={20} className={payMethod === 'mercadopago' ? 'text-primary-600' : 'text-gray-400'} />
                <div>
                  <p className="font-medium text-sm">Mercado Pago</p>
                  <p className="text-xs text-gray-500">Tarjeta, efectivo, transferencia</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${payMethod === 'whatsapp' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" value="whatsapp" checked={payMethod === 'whatsapp'} onChange={() => setPayMethod('whatsapp')} className="sr-only" />
                <FaWhatsapp size={20} className={payMethod === 'whatsapp' ? 'text-green-600' : 'text-gray-400'} />
                <div>
                  <p className="font-medium text-sm">WhatsApp</p>
                  <p className="text-xs text-gray-500">Coordiná el pago directamente</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-20">
            <h2 className="font-semibold text-lg mb-4">Resumen</h2>
            <ul className="divide-y divide-gray-100 mb-4">
              {items.map((item) => {
                const price = item.producto?.precioOferta || item.producto?.precio || 0;
                const nombre = item.producto?.nombre || '';
                return (
                  <li key={item.producto?._id || item.producto} className="py-2 flex justify-between text-sm">
                    <span className="text-gray-600 truncate max-w-[60%]">{nombre} <span className="text-gray-400">x{item.cantidad}</span></span>
                    <span className="font-medium">{formatCurrency(price * item.cantidad)}</span>
                  </li>
                );
              })}
            </ul>

            {couponResult && (
              <div className="flex justify-between text-sm text-green-600 mb-2">
                <span>Descuento cupón</span>
                <span>-{formatCurrency(couponResult.descuento)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg border-t pt-3 mb-5">
              <span>Total</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>

            <button
              onClick={() => handleOrder(payMethod)}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 ${
                payMethod === 'whatsapp'
                  ? 'bg-green-500 hover:bg-green-400 text-white'
                  : 'btn-primary'
              }`}
            >
              {isLoading ? 'Procesando...' : payMethod === 'whatsapp' ? (
                <><FaWhatsapp size={18} /> Comprar por WhatsApp</>
              ) : (
                <><FaCreditCard size={18} /> Pagar con Mercado Pago</>
              )}
            </button>

            {!user && (
              <p className="text-xs text-center text-gray-400 mt-3">
                ¿Tenés cuenta?{' '}
                <a href="/login" className="text-primary-600 hover:underline">Iniciá sesión</a> para guardar tu historial
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
