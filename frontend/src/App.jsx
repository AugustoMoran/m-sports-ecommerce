import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAdmin } from './features/auth/authSlice';
import { useGetCartQuery } from './services/cartApi';
import { setItems } from './features/cart/cartSlice';
import Layout from './components/layout/Layout';

// Pages
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Profile = lazy(() => import('./pages/Profile'));
const Favorites = lazy(() => import('./pages/Favorites'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin pages
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductsAdmin = lazy(() => import('./pages/admin/ProductsAdmin'));
const CategoriesAdmin = lazy(() => import('./pages/admin/CategoriesAdmin'));
const OrdersAdmin = lazy(() => import('./pages/admin/OrdersAdmin'));
const DeliveryAdmin = lazy(() => import('./pages/admin/DeliveryAdmin'));
const CouponsAdmin = lazy(() => import('./pages/admin/CouponsAdmin'));
const CloudinaryAdmin = lazy(() => import('./pages/admin/CloudinaryAdmin'));
const BannersAdmin = lazy(() => import('./pages/admin/BannersAdmin'));
const PopupAdmin = lazy(() => import('./pages/admin/PopupAdmin'));

// Guards
const ProtectedRoute = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const isAdmin = useSelector(selectIsAdmin);
  return isAdmin ? children : <Navigate to="/" replace />;
};

const GuestRoute = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  return !user ? children : <Navigate to="/" replace />;
};

const Loading = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
  </div>
);

const CartInitializer = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data } = useGetCartQuery(undefined, { skip: !user });
  useEffect(() => {
    if (data?.items) dispatch(setItems(data.items));
  }, [data, dispatch]);
  return null;
};

const App = () => (
  <Suspense fallback={<Loading />}>
    <CartInitializer />
    <Routes>
      {/* Public routes with layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/productos" element={<Products />} />
        <Route path="/productos/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orden/confirmacion" element={<OrderConfirmation />} />

        {/* Auth routes (guests only) */}
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/registro" element={<GuestRoute><Register /></GuestRoute>} />

        {/* Protected user routes */}
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/mis-ordenes" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/favoritos" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
      </Route>

      {/* Admin routes (no Layout wrapper — AdminLayout is self-contained) */}
      <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/admin/productos" element={<AdminRoute><ProductsAdmin /></AdminRoute>} />
      <Route path="/admin/categorias" element={<AdminRoute><CategoriesAdmin /></AdminRoute>} />
      <Route path="/admin/ordenes" element={<AdminRoute><OrdersAdmin /></AdminRoute>} />
      <Route path="/admin/despacho" element={<AdminRoute><DeliveryAdmin /></AdminRoute>} />
      <Route path="/admin/cupones" element={<AdminRoute><CouponsAdmin /></AdminRoute>} />
      <Route path="/admin/cloudinary" element={<AdminRoute><CloudinaryAdmin /></AdminRoute>} />
      <Route path="/admin/banners" element={<AdminRoute><BannersAdmin /></AdminRoute>} />
      <Route path="/admin/popup" element={<AdminRoute><PopupAdmin /></AdminRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default App;
