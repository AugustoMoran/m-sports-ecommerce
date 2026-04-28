import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../services/productsApi';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiX } from 'react-icons/hi';

const EMPTY = { nombre: '', descripcion: '' };

const CategoriesAdmin = () => {
  const { data: categories = [], isLoading } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCategory({ id: editing, ...form }).unwrap();
        toast.success('Categoría actualizada');
      } else {
        await createCategory({ ...form }).unwrap();
        toast.success('Categoría creada');
      }
      setForm(EMPTY);
      setEditing(null);
      setShowForm(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Error');
    }
  };

  const handleEdit = (c) => {
    setForm({ nombre: c.nombre, descripcion: c.descripcion || '' });
    setEditing(c._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar categoría?')) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success('Eliminada');
    } catch { toast.error('Error'); }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY); }} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus size={16} /> Nueva categoría
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editing ? 'Editar categoría' : 'Nueva categoría'}</h2>
            <button onClick={() => setShowForm(false)}><HiX size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <input type="text" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input-field" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Guardar' : 'Crear'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded" />
            </div>
          ))
        ) : categories.map((c) => (
          <div key={c._id} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-primary-700 font-bold">{c.nombre[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{c.nombre}</p>
              {c.descripcion && <p className="text-xs text-gray-400 truncate">{c.descripcion}</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <HiOutlinePencil size={14} />
              </button>
              <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                <HiOutlineTrash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default CategoriesAdmin;
