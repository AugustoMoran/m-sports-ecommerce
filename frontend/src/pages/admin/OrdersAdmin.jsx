import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetAllOrdersQuery, useUpdateOrderMutation, useFinalizeOrderMutation, useDeleteOrderMutation } from '../../services/ordersApi';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineTrash } from 'react-icons/hi';

const ENVIO_OPTIONS = ['pendiente', 'preparando', 'enviado', 'entregado', 'cancelado'];
const PAGO_OPTIONS = ['pendiente', 'aprobado', 'rechazado', 'reembolsado'];

const METODO_BADGE = {
  mercadopago: 'bg-blue-100 text-blue-700',
  whatsapp: 'bg-green-100 text-green-700',
  pendiente: 'bg-gray-100 text-gray-600',
};

const OrdersAdmin = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetAllOrdersQuery({ page, limit: 15 });
  const [updateOrder] = useUpdateOrderMutation();
  const [finalizeOrder, { isLoading: finalizing }] = useFinalizeOrderMutation();
  const [deleteOrder] = useDeleteOrderMutation();
  const [finalizingId, setFinalizingId] = useState(null);

  const handleUpdate = async (id, payload) => {
    try {
      await updateOrder({ id, ...payload }).unwrap();
      toast.success('Pedido actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleFinalize = async (order, force = false) => {
    const confirmMsg = force
      ? `⚠️ El stock es insuficiente. ¿Descontar de todas formas y dejar stock en negativo?`
      : `¿Descontar el stock del pedido ${order.codigo}? Esta acción no se puede deshacer.`;
    if (!window.confirm(confirmMsg)) return;
    setFinalizingId(order._id);
    try {
      const result = await finalizeOrder({ id: order._id, force }).unwrap();
      if (result.agotados?.length > 0) {
        const nombres = result.agotados.map((p) => p.nombre).join(', ');
        toast(
          (t) => (
            <span>
              ⚠️ Sin stock: <strong>{nombres}</strong>.{' '}
              <button
                className="underline font-medium"
                onClick={() => { toast.dismiss(t.id); navigate('/admin/productos?sinStock=1'); }}
              >
                Ver productos
              </button>
            </span>
          ),
          { duration: 8000 }
        );
      } else {
        toast.success('Stock descontado correctamente');
      }
    } catch (err) {
      if (err?.data?.code === 'STOCK_INSUFICIENTE') {
        toast.error(err.data.message, { duration: 4000 });
        // Offer force option
        handleFinalize(order, true);
        return;
      }
      toast.error(err?.data?.message || 'Error al finalizar pedido');
    } finally {
      setFinalizingId(null);
    }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`¿Eliminar el pedido ${order.codigo} del historial? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteOrder(order._id).unwrap();
      toast.success('Pedido eliminado del historial');
    } catch (err) {
      toast.error(err?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Método</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Envío</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : (data?.orders || []).map((order) => (
              <tr key={order._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold text-primary-600">{order.codigo}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                  {order.usuario ? `${order.usuario.nombre} ${order.usuario.apellido}` : order.guestData?.nombre}
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(order.total)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METODO_BADGE[order.metodoPago] || METODO_BADGE.pendiente}`}>
                    {order.metodoPago}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.estadoPago}
                    onChange={(e) => handleUpdate(order._id, { estadoPago: e.target.value })}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                  >
                    {PAGO_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.estadoEnvio}
                    onChange={(e) => handleUpdate(order._id, { estadoEnvio: e.target.value })}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                  >
                    {ENVIO_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(order.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td className="px-4 py-3">
                  {!order.stockDeducido && order.estadoPago === 'aprobado' && (order.estadoEnvio === 'entregado' || order.estadoEnvio === 'enviado') ? (
                    <button
                      onClick={() => handleFinalize(order)}
                      disabled={finalizingId === order._id || finalizing}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      <HiOutlineCheckCircle size={14} />
                      {finalizingId === order._id ? 'Finalizando...' : 'Finalizar pedido'}
                    </button>
                  ) : order.stockDeducido ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <HiOutlineCheckCircle size={14} className="text-green-500" /> Finalizado
                      </span>
                      <button
                        onClick={() => handleDelete(order)}
                        title="Eliminar del historial"
                        className="p-1 rounded-lg hover:bg-red-50 text-red-400"
                      >
                        <HiOutlineTrash size={13} />
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              disabled={isFetching}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white border hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default OrdersAdmin;

