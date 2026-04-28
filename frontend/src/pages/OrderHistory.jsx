import React from 'react';
import { useGetMyOrdersQuery } from '../services/ordersApi';
import { formatCurrency } from '../utils/formatCurrency';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  preparando: { label: 'Preparando', color: 'bg-blue-100 text-blue-700' },
  enviado: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  entregado: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-600' },
};

const PAY_LABELS = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  aprobado: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-600' },
};

const OrderHistory = () => {
  const { data, isLoading } = useGetMyOrdersQuery();

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-5 animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      ))}
    </div>
  );

  const orders = data?.orders || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <p className="mb-4">No tenés pedidos aún.</p>
          <Link to="/productos" className="btn-primary">Ver productos</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const envio = STATUS_LABELS[order.estadoEnvio] || STATUS_LABELS.pendiente;
            const pago = PAY_LABELS[order.estadoPago] || PAY_LABELS.pendiente;

            return (
              <div key={order._id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono font-bold text-primary-600">{order.codigo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('es-AR', { dateStyle: 'long' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(order.total)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`badge text-xs ${envio.color}`}>{envio.label}</span>
                  <span className={`badge text-xs ${pago.color}`}>Pago: {pago.label}</span>
                  <span className="badge bg-gray-100 text-gray-600 text-xs capitalize">{order.metodoPago}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {order.items?.slice(0, 3).map((item) => (
                    <span key={item._id} className="truncate max-w-[120px]">{item.nombre}</span>
                  ))}
                  {order.items?.length > 3 && <span>+{order.items.length - 3} más</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
