import { baseApi } from './baseApi';

export const popupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPopupConfig: builder.query({
      query: () => '/popup',
      providesTags: ['Popup'],
    }),
    updatePopupConfig: builder.mutation({
      query: (data) => ({ url: '/popup', method: 'PUT', body: data }),
      invalidatesTags: ['Popup'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPopupConfigQuery, useUpdatePopupConfigMutation } = popupApi;
