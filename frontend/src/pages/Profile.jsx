import React, { useState } from 'react';
import { useGetMeQuery, useUpdateProfileMutation } from '../services/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { useSelector } from 'react-redux';
import { selectAccessToken } from '../features/auth/authSlice';
import toast from 'react-hot-toast';

const Profile = () => {
  const { data: user, isLoading } = useGetMeQuery();
  const token = useSelector(selectAccessToken);
  const dispatch = useDispatch();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [form, setForm] = useState(null);

  React.useEffect(() => {
    if (user && !form) {
      setForm({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        telefono: user.telefono || '',
        direccion: user.direccion?.calle || '',
        ciudad: user.direccion?.ciudad || '',
        provincia: user.direccion?.provincia || '',
      });
    }
  }, [user]);

  if (isLoading || !form) return (
    <div className="max-w-xl mx-auto px-4 py-12 animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-12 bg-gray-200 rounded" />
      <div className="h-12 bg-gray-200 rounded" />
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        telefono: form.telefono,
        direccion: { calle: form.direccion, ciudad: form.ciudad, provincia: form.provincia },
      };
      const result = await updateProfile(payload).unwrap();
      dispatch(setCredentials({ accessToken: token, user: result.user }));
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err?.data?.message || 'Error al actualizar');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Mi perfil</h1>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-bold text-xl">
              {user.nombre?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-bold">{user.nombre} {user.apellido}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.role === 'admin' && (
              <span className="badge bg-primary-100 text-primary-700 text-xs mt-1">Administrador</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Apellido</label>
              <input type="text" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="input-field" />
          </div>
          <h3 className="font-medium text-sm text-gray-600 pt-2">Dirección</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Calle y número</label>
            <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ciudad</label>
              <input type="text" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provincia</label>
              <input type="text" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} className="input-field" />
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="btn-primary w-full mt-2">
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
