import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../services/authApi';
import { setCredentials } from '../features/auth/authSlice';
import { useSyncCartMutation } from '../services/cartApi';
import { clearGuestCart, selectCartItems } from '../features/cart/cartSlice';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [login, { isLoading }] = useLoginMutation();
  const [syncCart] = useSyncCartMutation();
  const guestItems = useSelector(selectCartItems);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const guestCart = guestItems.map((i) => ({
        producto: i.producto?._id || i.producto,
        cantidad: i.cantidad,
      }));
      const result = await login({ ...form, guestCart }).unwrap();
      dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));

      if (guestCart.length > 0) {
        await syncCart(guestCart).unwrap().catch(() => {});
        dispatch(clearGuestCart());
      }

      toast.success(`¡Bienvenido, ${result.user.nombre}!`);
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="card p-8 sm:p-10">
          <div className="text-center mb-8">
            <img src="/m-sports-logo.png" alt="M Sports" className="h-14 w-auto mx-auto mb-5 object-contain" />
            <h1 className="font-display text-2xl font-bold text-ink">Iniciar sesión</h1>
            <p className="text-gray-500 text-sm mt-1">Accedé a tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-2">
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="text-ink font-semibold hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
