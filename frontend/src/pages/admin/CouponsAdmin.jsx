import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from '../../services/ordersApi';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiX } from 'react-icons/hi';

const EMPTY = { codigo: '', tipo: 'porcentaje', valor: '', minimoCompra: '', maxUsos: '', fechaVencimiento: '', isActive: true };

const CouponsAdmin = () => {
  const { data: coupons = [], isLoading } = useGetCouponsQuery();
  const [createCoupon] = useCreateCouponMutation();
  const [updateCoupon] = useUpdateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCoupon({ id: editing, ...form }).unwrap();
        toast.success('Cupón actualizado');
      } else {
        await createCoupon(form).unwrap();
        toast.success('Cupón creado');
      }
      setForm(EMPTY);
      setEditing(null);
      setShowForm(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Error');
    }
  };

  const handleEdit = (c) => {
    setForm({
      codigo: c.codigo, tipo: c.tipo, valor: c.valor, minimoCompra: c.minimoCompra || '',
      maxUsos: c.maxUsos || '', fechaVencimiento: c.fechaVencimiento?.split('T')[0] || '', isActive: c.isActive,
    });
    setEditing(c._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar cupón?')) return;
    try {
      await deleteCoupon(id).unwrap();
      toast.success('Cupón eliminado');
    } catch { toast.error('Error'); }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cupones</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY); }} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus size={16} /> Nuevo cupón
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editing ? 'Editar cupón' : 'Nuevo cupón'}</h2>
            <button onClick={() => setShowForm(false)}><HiX size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} className="input-field uppercase" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="input-field">
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor</label>
              <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="input-field" required min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mínimo de compra</label>
              <input type="number" value={form.minimoCompra} onChange={(e) => setForm({ ...form, minimoCompra: e.target.value })} className="input-field" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Máximo de usos</label>
              <input type="number" value={form.maxUsos} onChange={(e) => setForm({ ...form, maxUsos: e.target.value })} className="input-field" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vencimiento</label>
              <input type="date" value={form.fechaVencimiento} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })} className="input-field" />
            </div>
            <div className="col-span-2 md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Guardar' : 'Crear'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Descuento</th>
              <th className="px-4 py-3 font-medium">Mín.</th>
              <th className="px-4 py-3 font-medium">Usos</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : coupons.map((c) => (
              <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold">{c.codigo}</td>
                <td className="px-4 py-3">{c.tipo === 'porcentaje' ? `${c.valor}%` : formatCurrency(c.valor)}</td>
                <td className="px-4 py-3">{c.minimoCompra ? formatCurrency(c.minimoCompra) : '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.usosActuales} / {c.maxUsos || '∞'}</td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      <HiOutlinePencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default CouponsAdmin;
