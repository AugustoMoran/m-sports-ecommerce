import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useDispatchOrderMutation } from '../../services/ordersApi';
import toast from 'react-hot-toast';
import { HiOutlineTruck } from 'react-icons/hi';

const DeliveryAdmin = () => {
  const [code, setCode] = useState('');
  const [trackCode, setTrackCode] = useState('');
  const [dispatchOrder, { isLoading }] = useDispatchOrderMutation();

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      const result = await dispatchOrder({ codigo: code.trim().toUpperCase() }).unwrap();
      toast.success(`Pedido ${result.order.codigo} marcado como enviado`);
      setCode('');
    } catch (err) {
      toast.error(err?.data?.message || 'Código no encontrado');
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Despacho</h1>

      <div className="max-w-lg">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <HiOutlineTruck size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold">Despachar pedido</h2>
              <p className="text-sm text-gray-500">Ingresá el código del pedido para marcarlo como enviado</p>
            </div>
          </div>

          <form onSubmit={handleDispatch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código del pedido</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ORD-XXXXXXXX"
                className="input-field font-mono uppercase tracking-widest"
                required
              />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? 'Procesando...' : 'Marcar como enviado'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DeliveryAdmin;
