import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetStorageUsageQuery } from '../../services/cartApi';

const CloudinaryAdmin = () => {
  const { data: storage, isLoading, refetch } = useGetStorageUsageQuery();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Almacenamiento Cloudinary</h1>

      <div className="max-w-lg">
        <div className="card p-6 space-y-5">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-6 bg-gray-200 rounded" />
            </div>
          ) : storage ? (
            <>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Espacio usado</span>
                  <span className="font-bold">{storage.usedMB} MB de {storage.limitMB} MB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${storage.alert ? 'bg-red-500' : storage.percentage > 60 ? 'bg-yellow-400' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, storage.percentage)}%` }}
                  />
                </div>
                <p className="text-right text-xs text-gray-500 mt-1">{storage.percentage}%</p>
              </div>

              {storage.alert && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                  ⚠️ El almacenamiento supera el 80%. Considerá eliminar imágenes no utilizadas o ampliar el plan.
                </div>
              )}

              <button onClick={() => refetch()} className="btn-secondary text-sm w-full">
                Actualizar
              </button>
            </>
          ) : (
            <p className="text-gray-500">No se pudo obtener la información.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CloudinaryAdmin;
