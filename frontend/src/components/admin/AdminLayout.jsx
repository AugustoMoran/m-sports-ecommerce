import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAdmin } from '../../features/auth/authSlice';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineTicket,
  HiOutlinePhotograph,
  HiOutlineCollection,
  HiOutlineHome,
  HiOutlineChatAlt2,
} from 'react-icons/hi';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: HiOutlineViewGrid, exact: true },
  { to: '/admin/productos', label: 'Productos', icon: HiOutlineCube },
  { to: '/admin/categorias', label: 'Categorías', icon: HiOutlineTag },
  { to: '/admin/ordenes', label: 'Pedidos', icon: HiOutlineClipboardList },
  { to: '/admin/cupones', label: 'Cupones', icon: HiOutlineTicket },
  { to: '/admin/cloudinary', label: 'Almacenamiento', icon: HiOutlinePhotograph },
  { to: '/admin/banners', label: 'Banners', icon: HiOutlineCollection },
  { to: '/admin/popup', label: 'Popup WhatsApp', icon: HiOutlineChatAlt2 },
];

const AdminLayout = ({ children }) => {
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-100 flex-shrink-0 hidden md:flex flex-col">
        <div className="px-5 py-4 border-b border-gray-800">
          <p className="font-bold text-white">Panel Admin</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                  active ? 'bg-primary-400 text-gray-900 font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <HiOutlineHome size={18} />
            Ir a la tienda
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#F5F3EE] p-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
