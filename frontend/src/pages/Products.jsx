import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetProductsQuery, useGetCategoriesQuery } from '../services/productsApi';
import ProductCard from '../components/products/ProductCard';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import { HiAdjustments, HiX } from 'react-icons/hi';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'popular', label: 'Más vendidos' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoria = searchParams.get('categoria') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';

  const { data, isFetching } = useGetProductsQuery(
    { page, limit: 12, categoria, search, sort },
    {
      selectFromResult: ({ data, isFetching }) => ({ data, isFetching }),
    }
  );

  const { data: categories = [] } = useGetCategoriesQuery();

  // Accumulate products for infinite scroll
  React.useEffect(() => {
    if (data?.products) {
      if (page === 1) {
        setAllProducts(data.products);
      } else {
        setAllProducts((prev) => {
          const ids = new Set(prev.map((p) => p._id));
          const newOnes = data.products.filter((p) => !ids.has(p._id));
          return [...prev, ...newOnes];
        });
      }
    }
  }, [data, page]);

  // Reset on filter change
  React.useEffect(() => {
    setPage(1);
    setAllProducts([]);
  }, [categoria, search, sort]);

  const hasMore = data ? page < data.pages : false;

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) setPage((p) => p + 1);
  }, [isFetching, hasMore]);

  const sentinelRef = useInfiniteScroll({ onVisible: loadMore, hasMore, loading: isFetching });

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {search ? `Resultados para "${search}"` : 'Productos'}
          </h1>
          {data && (
            <p className="text-sm text-gray-500 mt-1">{data.total} productos encontrados</p>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="md:hidden flex items-center gap-2 btn-secondary text-sm"
        >
          <HiAdjustments size={16} />
          Filtros
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`w-56 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden md:block'}`}>
          <div className="card p-4 sticky top-20 space-y-5">
            <div>
              <h3 className="font-semibold text-sm mb-3">Ordenar por</h3>
              <div className="space-y-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateFilter('sort', opt.value)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sort === opt.value ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Categoría</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => updateFilter('categoria', '')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      !categoria ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => updateFilter('categoria', cat._id)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        categoria === cat._id ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(categoria || search) && (
              <button
                onClick={() => {
                  setSearchParams({});
                }}
                className="w-full flex items-center gap-2 text-red-500 text-sm hover:text-red-700"
              >
                <HiX size={14} /> Limpiar filtros
              </button>
            )}
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {allProducts.length === 0 && !isFetching ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg mb-2">No hay productos</p>
              <p className="text-sm">Intentá con otros filtros</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {allProducts.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
                {isFetching &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="aspect-square bg-gray-200" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
              </div>
              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-4" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
