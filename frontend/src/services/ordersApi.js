import { baseApi } from './baseApi';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (data) => ({ url: '/orders', method: 'POST', body: data }),
      invalidatesTags: ['Order', 'Cart'],
    }),
    getMyOrders: builder.query({
      query: (params) => ({ url: '/orders/my', params }),
      providesTags: ['Order'],
    }),
    getOrderByCode: builder.query({
      query: (codigo) => `/orders/track/${codigo}`,
    }),
    getAllOrders: builder.query({
      query: (params) => ({ url: '/orders', params }),
      providesTags: ['Order'],
    }),
    updateOrder: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/orders/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Order'],
    }),
    dispatchOrder: builder.mutation({
      query: (data) => ({ url: '/orders/dispatch', method: 'POST', body: data }),
      invalidatesTags: ['Order'],
    }),
    finalizeOrder: builder.mutation({
      query: ({ id, force = false }) => ({ url: `/orders/${id}/finalize`, method: 'POST', body: { force } }),
      invalidatesTags: ['Order'],
    }),
    deleteOrder: builder.mutation({
      query: (id) => ({ url: `/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Order'],
    }),
    validateCoupon: builder.mutation({
      query: (data) => ({ url: '/coupons/validate', method: 'POST', body: data }),
    }),
    getCoupons: builder.query({
      query: () => '/coupons',
      providesTags: ['Coupon'],
    }),
    createCoupon: builder.mutation({
      query: (data) => ({ url: '/coupons', method: 'POST', body: data }),
      invalidatesTags: ['Coupon'],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/coupons/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Coupon'],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({ url: `/coupons/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Coupon'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByCodeQuery,
  useGetAllOrdersQuery,
  useUpdateOrderMutation,
  useDispatchOrderMutation,
  useFinalizeOrderMutation,
  useDeleteOrderMutation,
  useValidateCouponMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} = ordersApi;
