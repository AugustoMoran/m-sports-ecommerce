import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetAllOrdersQuery } from '../../services/ordersApi';
import { useGetProductsQuery } from '../../services/productsApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { HiOutlineShoppingBag, HiOutlineCube, HiOutlineCurrencyDollar, HiOutlineClipboardList } from 'react-icons/hi';
import { useGetStorageUsageQuery } from '../../services/cartApi';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { data: ordersData } = useGetAllOrdersQuery({ page: 1, limit: 5 });
  const { data: productsData } = useGetProductsQuery({ limit: 1 });
  const { data: storage } = useGetStorageUsageQuery();

  const totalRevenue = ordersData?.orders
    ?.filter((o) => o.estadoPago === 'aprobado')
    .reduce((s, o) => s + o.total, 0) || 0;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={HiOutlineClipboardList} label="Pedidos" value={ordersData?.total ?? '—'} color="bg-blue-500" />
        <StatCard icon={HiOutlineCurrencyDollar} label="Ingresos aprobados" value={formatCurrency(totalRevenue)} color="bg-green-500" />
        <StatCard icon={HiOutlineCube} label="Productos" value={productsData?.total ?? '—'} color="bg-purple-500" />
        <StatCard icon={HiOutlineShoppingBag} label="Almacenamiento" value={storage ? `${storage.percentage}%` : '—'} color={storage?.alert ? 'bg-red-500' : 'bg-orange-400'} />
      </div>

      {/* Storage warning */}
      {storage?.alert && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          ⚠️ El almacenamiento de imágenes está al {storage.percentage}% ({storage.usedMB} MB de {storage.limitMB} MB).
        </div>
      )}

      {/* Recent orders */}
      <div className="card">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">Pedidos recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(ordersData?.orders || []).map((order) => (
                <tr key={order._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono font-bold text-primary-600">{order.codigo}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {order.usuario ? `${order.usuario.nombre} ${order.usuario.apellido}` : order.guestData?.nombre}
                  </td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-3">
                    <span className="badge bg-blue-100 text-blue-700 capitalize">{order.estadoEnvio}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
