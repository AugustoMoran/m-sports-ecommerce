import { baseApi } from './baseApi';

export const bannersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBanners: builder.query({
      query: (soloActivos) => `/banners${soloActivos ? '?activos=true' : ''}`,
      providesTags: ['Banner'],
    }),
    createBanner: builder.mutation({
      query: (data) => ({ url: '/banners', method: 'POST', body: data }),
      invalidatesTags: ['Banner'],
    }),
    updateBanner: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/banners/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Banner'],
    }),
    deleteBanner: builder.mutation({
      query: (id) => ({ url: `/banners/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Banner'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} = bannersApi;
