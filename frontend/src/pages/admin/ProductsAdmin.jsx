import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useAddProductImageMutation,
  useRemoveProductImageMutation,
  useGetProductSuggestionsQuery,
} from '../../services/productsApi';
import { useUploadImageMutation } from '../../services/cartApi';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiX, HiOutlinePhotograph, HiOutlineSearch, HiOutlineRefresh } from 'react-icons/hi';

const MAX_IMAGES = 7;
const EMPTY = { nombre: '', descripcion: '', precio: '', precioOferta: '', stock: '', categoria: '', tags: '' };

const ProductsAdmin = () => {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const sinStock = searchParams.get('sinStock') === '1';
  
  const { data, isLoading } = useGetProductsQuery({ page, limit: 12, search: search || undefined, categoria: filterCat || undefined, sinStock: sinStock || undefined });
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: suggestions = [] } = useGetProductSuggestionsQuery(search);
  
  const [deleteProduct] = useDeleteProductMutation();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [addImage] = useAddProductImageMutation();
  const [removeImage] = useRemoveProductImageMutation();
  const [uploadImage] = useUploadImageMutation();

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [restockId, setRestockId] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  const existingImages = editingProduct?.imagenes || [];
  const totalImages = existingImages.length + newImagePreviews.length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - totalImages;
    const toAdd = files.slice(0, remaining);
    setNewImageFiles((prev) => [...prev, ...toAdd]);
    setNewImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = async (publicId) => {
    if (!editingProduct) return;
    try {
      await removeImage({ id: editingProduct._id, publicId }).unwrap();
      setEditingProduct((prev) => ({ ...prev, imagenes: prev.imagenes.filter((img) => img.publicId !== publicId) }));
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar imagen');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const payload = {
        ...form,
        precio: Number(form.precio),
        precioOferta: form.precioOferta ? Number(form.precioOferta) : undefined,
        stock: Number(form.stock),
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
      };
      let productId = editing;
      if (editing) {
        await updateProduct({ id: editing, ...payload }).unwrap();
        toast.success('Producto actualizado');
      } else {
        const created = await createProduct(payload).unwrap();
        productId = created._id;
        toast.success('Producto creado');
      }
      for (const file of newImageFiles) {
        const fd = new FormData();
        fd.append('image', file);
        const { url, publicId } = await uploadImage(fd).unwrap();
        await addImage({ id: productId, url, publicId }).unwrap();
      }
      setForm(EMPTY);
      setEditing(null);
      setEditingProduct(null);
      setShowForm(false);
      setNewImageFiles([]);
      setNewImagePreviews([]);
    } catch (err) {
      toast.error(err?.data?.message || 'Error');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (p) => {
    setForm({
      nombre: p.nombre, descripcion: p.descripcion, precio: p.precio,
      precioOferta: p.precioOferta || '', stock: p.stock,
      categoria: p.categoria?._id || p.categoria || '',
      tags: p.tags?.join(', ') || '',
    });
    setEditing(p._id);
    setEditingProduct(p);
    setShowForm(true);
    setNewImageFiles([]);
    setNewImagePreviews([]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar producto?')) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success('Eliminado');
    } catch { toast.error('Error'); }
  };

  const handleRestock = async (p) => {
    const qty = parseInt(restockQty, 10);
    if (!qty || qty <= 0) { toast.error('Ingresá una cantidad válida'); return; }
    try {
      await updateProduct({ id: p._id, stock: qty }).unwrap();
      toast.success(`Stock actualizado a ${qty}`);
      setRestockId(null);
      setRestockQty('');
    } catch { toast.error('Error al actualizar stock'); }
  };

  const handleSuggestionClick = async (suggestionProduct) => {
    try {
      // Obtener el producto completo para asegurar todos los datos
      const response = await fetch(`http://localhost:5000/api/products/${suggestionProduct._id}`);
      const fullProduct = await response.json();
      handleEdit(fullProduct);
      setSearch('');
      setShowSuggestions(false);
      toast.success(`Editando: ${fullProduct.nombre}`);
    } catch (err) {
      toast.error('Error al cargar producto');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setEditingProduct(null); setForm(EMPTY); setNewImageFiles([]); setNewImagePreviews([]); }} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus size={16} /> Nuevo producto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px]" ref={suggestionsRef}>
          <HiOutlineSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => { 
              setSearch(e.target.value); 
              setPage(1);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="input-field pl-9"
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && search.trim().length > 0 && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
              {suggestions.map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleSuggestionClick(product)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-50 transition-colors border-b border-slate-100 last:border-b-0 text-left"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {product.imagenes?.[0]?.url ? (
                      <img src={product.imagenes[0].url} alt={product.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <HiOutlineSearch size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.nombre}</p>
                    <p className="text-xs text-gray-500">
                      ${product.precioOferta ? product.precioOferta.toLocaleString('es-AR') : product.precio.toLocaleString('es-AR')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* No results message */}
          {showSuggestions && search.trim().length > 0 && suggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-4 text-center text-sm text-gray-500">
              No se encontraron productos
            </div>
          )}
        </div>
        <select
          value={filterCat}
          onChange={(e) => { setFilterCat(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
        </select>
        {(search || filterCat) && (
          <button onClick={() => { setSearch(''); setFilterCat(''); setPage(1); }} className="btn-secondary text-sm">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
            <button onClick={() => setShowForm(false)}><HiX size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input-field" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio</label>
              <input type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} className="input-field" required min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio oferta (opcional)</label>
              <input type="number" value={form.precioOferta} onChange={(e) => setForm({ ...form, precioOferta: e.target.value })} className="input-field" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" required min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="input-field">
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Tags (separados por coma)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="verano, oferta, nuevo" />
            </div>

            {/* Multi-image section */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Imágenes <span className="text-gray-400 font-normal">({totalImages}/{MAX_IMAGES})</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {/* Existing images */}
                {existingImages.map((img) => (
                  <div key={img.publicId} className="relative aspect-square">
                    <img src={img.url} alt="" className="w-full h-full object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(img.publicId)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow"
                    >
                      <HiX size={10} />
                    </button>
                  </div>
                ))}
                {/* New image previews */}
                {newImagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow"
                    >
                      <HiX size={10} />
                    </button>
                  </div>
                ))}
                {/* Add slot */}
                {totalImages < MAX_IMAGES && (
                  <label className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                    <HiOutlinePlus size={18} className="text-gray-300" />
                    <span className="text-xs text-gray-400 mt-1">Agregar</span>
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={handleAddImages} />
                  </label>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}
              </button>
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
              <th className="px-4 py-3 font-medium">Fotos</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : (data?.products || []).map((p) => (
              <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {p.imagenes?.[0]?.url ? (
                        <img src={p.imagenes[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HiOutlinePhotograph size={14} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    {p.imagenes?.length > 1 && (
                      <span className="text-xs text-gray-400">+{p.imagenes.length - 1}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.nombre}</td>
                <td className="px-4 py-3">{formatCurrency(p.precioOferta || p.precio)}</td>
                <td className="px-4 py-3">
                  {restockId === p._id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={restockQty}
                        onChange={(e) => setRestockQty(e.target.value)}
                        className="w-16 text-xs border border-gray-300 rounded-lg px-2 py-1"
                        placeholder="Cant."
                        autoFocus
                      />
                      <button onClick={() => handleRestock(p)} className="text-xs px-2 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700">OK</button>
                      <button onClick={() => { setRestockId(null); setRestockQty(''); }} className="text-xs px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`badge text-xs ${p.stock > 5 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                        {p.stock}
                      </span>
                      {p.stock <= 5 && (
                        <button
                          onClick={() => { setRestockId(p._id); setRestockQty(''); }}
                          title="Reponer stock"
                          className="p-1 rounded-lg hover:bg-orange-50 text-orange-400"
                        >
                          <HiOutlineRefresh size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      <HiOutlinePencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
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
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default ProductsAdmin;
