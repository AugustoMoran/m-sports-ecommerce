import { baseApi } from './baseApi';

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({ url: '/products', params }),
      providesTags: (result) =>
        result?.products
          ? [...result.products.map(({ _id }) => ({ type: 'Product', id: _id })), { type: 'Product', id: 'LIST' }]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    getRelatedProducts: builder.query({
      query: (id) => `/products/${id}/related`,
      providesTags: ['Product'],
    }),
    getProductSuggestions: builder.query({
      query: (q) => ({ url: '/products/suggestions', params: { q, limit: 10 } }),
      skip: (q) => !q || q.trim().length === 0,
    }),
    createProduct: builder.mutation({
      query: (data) => ({ url: '/products', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/products/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    addProductImage: builder.mutation({
      query: ({ id, url, publicId }) => ({ url: `/products/${id}/images`, method: 'POST', body: { url, publicId } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }],
    }),
    removeProductImage: builder.mutation({
      query: ({ id, publicId }) => ({ url: `/products/${id}/images`, method: 'DELETE', body: { publicId } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }],
    }),
    addProductVideo: builder.mutation({
      query: ({ id, url, publicId }) => ({ url: `/products/${id}/videos`, method: 'POST', body: { url, publicId } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }],
    }),
    removeProductVideo: builder.mutation({
      query: ({ id, publicId }) => ({ url: `/products/${id}/videos`, method: 'DELETE', body: { publicId } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }],
    }),
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation({
      query: (data) => ({ url: '/categories', method: 'POST', body: data }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/categories/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useGetRelatedProductsQuery,
  useGetProductSuggestionsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAddProductImageMutation,
  useRemoveProductImageMutation,
  useAddProductVideoMutation,
  useRemoveProductVideoMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = productsApi;
