import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} from '../../services/bannersApi';
import { useUploadImageMutation } from '../../services/cartApi';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiX, HiOutlinePhotograph } from 'react-icons/hi';

const GRADIENTS = [
  { label: 'Azul', value: 'from-blue-900/70 to-transparent' },
  { label: 'Violeta', value: 'from-purple-900/70 to-transparent' },
  { label: 'Verde', value: 'from-emerald-900/70 to-transparent' },
  { label: 'Rojo', value: 'from-red-900/70 to-transparent' },
  { label: 'Naranja', value: 'from-orange-900/70 to-transparent' },
  { label: 'Negro', value: 'from-gray-900/80 to-transparent' },
];

const EMPTY = {
  titulo: '',
  subtitulo: '',
  imagen: '',
  imagenPublicId: '',
  ctaTexto: 'Ver productos',
  ctaLink: '/productos',
  gradient: 'from-blue-900/70 to-transparent',
  activo: true,
  orden: 0,
};

const BannersAdmin = () => {
  const { data: banners = [], isLoading } = useGetBannersQuery(false);
  const [createBanner] = useCreateBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();
  const [uploadImage] = useUploadImageMutation();

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.imagen) return toast.error('La imagen es obligatoria');
    try {
      if (editing) {
        await updateBanner({ id: editing, ...form }).unwrap();
        toast.success('Banner actualizado');
      } else {
        await createBanner(form).unwrap();
        toast.success('Banner creado');
      }
      setForm(EMPTY);
      setEditing(null);
      setShowForm(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Error');
    }
  };

  const handleEdit = (b) => {
    setForm({
      titulo: b.titulo,
      subtitulo: b.subtitulo || '',
      imagen: b.imagen,
      imagenPublicId: b.imagenPublicId || '',
      ctaTexto: b.ctaTexto,
      ctaLink: b.ctaLink,
      gradient: b.gradient,
      activo: b.activo,
      orden: b.orden,
    });
    setEditing(b._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar banner?')) return;
    try {
      await deleteBanner(id).unwrap();
      toast.success('Eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleToggle = async (b) => {
    try {
      await updateBanner({ id: b._id, activo: !b.activo }).unwrap();
      toast.success(b.activo ? 'Banner desactivado' : 'Banner activado');
    } catch {
      toast.error('Error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { url, publicId } = await uploadImage(fd).unwrap();
      setForm((f) => ({ ...f, imagen: url, imagenPublicId: publicId }));
      toast.success('Imagen subida');
    } catch {
      toast.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Banners / Carrusel</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY); }}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus size={16} /> Nuevo banner
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editing ? 'Editar banner' : 'Nuevo banner'}</h2>
            <button onClick={() => setShowForm(false)}><HiX size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Título *</label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Subtítulo</label>
              <input
                type="text"
                value={form.subtitulo}
                onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                className="input-field"
              />
            </div>

            {/* Imagen */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Imagen *</label>
              <div className="flex items-center gap-3">
                <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                  <HiOutlinePhotograph size={16} />
                  {uploading ? 'Subiendo...' : 'Subir imagen'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {form.imagen && (
                  <img src={form.imagen} alt="preview" className="h-14 w-24 object-cover rounded" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">O pegá una URL directamente:</p>
              <input
                type="url"
                value={form.imagen}
                onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                placeholder="https://..."
                className="input-field mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Texto del botón</label>
              <input
                type="text"
                value={form.ctaTexto}
                onChange={(e) => setForm({ ...form, ctaTexto: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Link del botón</label>
              <input
                type="text"
                value={form.ctaLink}
                onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                className="input-field"
                placeholder="/productos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Color de fondo</label>
              <select
                value={form.gradient}
                onChange={(e) => setForm({ ...form, gradient: e.target.value })}
                className="input-field"
              >
                {GRADIENTS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Orden</label>
              <input
                type="number"
                value={form.orden}
                onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
                className="input-field"
                min={0}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="activo" className="text-sm">Visible en la tienda</label>
            </div>

            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {editing ? 'Actualizar' : 'Crear banner'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : banners.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <HiOutlinePhotograph size={40} className="mx-auto mb-3 opacity-40" />
          <p>No hay banners. Creá el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b._id} className="card p-4 flex items-center gap-4">
              <img
                src={b.imagen}
                alt={b.titulo}
                className="w-28 h-16 object-cover rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{b.titulo}</p>
                <p className="text-sm text-gray-500 truncate">{b.subtitulo}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Orden: {b.orden} · Link: {b.ctaLink}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(b)}
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    b.activo
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {b.activo ? 'Activo' : 'Inactivo'}
                </button>
                <button
                  onClick={() => handleEdit(b)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <HiOutlinePencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(b._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <HiOutlineTrash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default BannersAdmin;
