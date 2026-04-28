import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetPopupConfigQuery, useUpdatePopupConfigMutation } from '../../services/popupApi';
import { useUploadImageMutation } from '../../services/cartApi';
import toast from 'react-hot-toast';
import { HiOutlinePhotograph, HiOutlineSave, HiOutlineRefresh } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

const DEFAULTS = {
  activo: true,
  titulo: '¿Buscás atención personalizada?',
  descripcion: 'Hablá con nosotros por WhatsApp y te ayudamos a encontrar exactamente lo que necesitás.',
  ctaTexto: 'Hablar por WhatsApp',
  whatsappNumero: '5491100000000',
  mensajePrellenado: 'Hola, estuve viendo la página y me gustaría recibir atención personalizada.',
  imagen: '',
  imagenPublicId: '',
  tiempoAparicion: 5,
};

const PopupAdmin = () => {
  const { data: config, isLoading } = useGetPopupConfigQuery();
  const [updatePopupConfig, { isLoading: isSaving }] = useUpdatePopupConfigMutation();
  const [uploadImage] = useUploadImageMutation();

  const [form, setForm] = useState(DEFAULTS);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        activo: config.activo ?? true,
        titulo: config.titulo || '',
        descripcion: config.descripcion || '',
        ctaTexto: config.ctaTexto || '',
        whatsappNumero: config.whatsappNumero || '',
        mensajePrellenado: config.mensajePrellenado || '',
        imagen: config.imagen || '',
        imagenPublicId: config.imagenPublicId || '',
        tiempoAparicion: config.tiempoAparicion ?? 5,
      });
    }
  }, [config]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

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

  const handleReset = () => setForm(DEFAULTS);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updatePopupConfig(form).unwrap();
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error(err?.data?.message || 'Error al guardar');
    }
  };

  const waPreview = `https://wa.me/${form.whatsappNumero || '5491100000000'}?text=${encodeURIComponent(
    form.mensajePrellenado || ''
  )}`;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FaWhatsapp className="text-green-500" size={24} />
              Popup de WhatsApp
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Configurá el cartelito que aparece al visitante. Si dejás un campo vacío, se usa el texto por defecto.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-300 hover:border-gray-900 px-3 py-1.5 rounded-lg transition-colors"
          >
            <HiOutlineRefresh size={15} />
            Restaurar defaults
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Toggle activo */}
          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Mostrar popup</p>
              <p className="text-sm text-gray-500">Activá o desactivá el popup para todos los visitantes</p>
            </div>
            <button
              type="button"
              onClick={() => set('activo', !form.activo)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                form.activo ? 'bg-primary-400' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.activo ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Tiempo de aparición */}
          <div className="card p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tiempo de aparición (segundos)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={form.tiempoAparicion}
              onChange={(e) => set('tiempoAparicion', Number(e.target.value))}
              className="input-field w-32"
            />
            <p className="text-xs text-gray-400 mt-1">Cuántos segundos esperar antes de mostrar el popup al visitante</p>
          </div>

          {/* Imagen */}
          <div className="card p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Imagen de fondo
            </label>
            {form.imagen ? (
              <div className="relative mb-3">
                <img
                  src={form.imagen}
                  alt="Preview"
                  className="w-full h-36 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imagen: '', imagenPublicId: '' }))}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white rounded-full w-7 h-7 flex items-center justify-center text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="h-28 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-3">
                Sin imagen — se usará la imagen por defecto
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer w-fit border border-gray-300 hover:border-gray-900 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <HiOutlinePhotograph size={16} />
              {uploading ? 'Subiendo...' : 'Subir imagen'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>

          {/* Textos */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Contenido del popup</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => set('titulo', e.target.value)}
                placeholder="¿Buscás atención personalizada?"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => set('descripcion', e.target.value)}
                rows={3}
                placeholder="Hablá con nosotros por WhatsApp..."
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Texto del botón CTA</label>
              <input
                type="text"
                value={form.ctaTexto}
                onChange={(e) => set('ctaTexto', e.target.value)}
                placeholder="Hablar por WhatsApp"
                className="input-field"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Configuración de WhatsApp</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Número de WhatsApp
                <span className="text-gray-400 font-normal ml-1">(sin + ni espacios, con código de país)</span>
              </label>
              <input
                type="text"
                value={form.whatsappNumero}
                onChange={(e) => set('whatsappNumero', e.target.value.replace(/\D/g, ''))}
                placeholder="5491100000000"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mensaje prellenado</label>
              <textarea
                value={form.mensajePrellenado}
                onChange={(e) => set('mensajePrellenado', e.target.value)}
                rows={3}
                placeholder="Hola, estuve viendo la página..."
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">Este mensaje aparece automáticamente en el chat de WhatsApp al hacer clic</p>
            </div>

            <a
              href={waPreview}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
            >
              <FaWhatsapp size={15} />
              Probar enlace de WhatsApp
            </a>
          </div>

          {/* Submit */}
          <div className="flex justify-end pb-8">
            <button type="submit" disabled={isSaving || uploading} className="btn-primary flex items-center gap-2">
              <HiOutlineSave size={18} />
              {isSaving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default PopupAdmin;
