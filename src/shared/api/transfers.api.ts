import { apiClient } from './client';

export const transfersApi = {
  getAll: async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient<any>(`/transfers${query}`);
  },

  getById: async (id: string) => {
    return apiClient<any>(`/transfers/${id}`);
  },

  create: async (transferData: any) => {
    return apiClient<any>('/transfers', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  },

  update: async (id: string, transferData: any) => {
    return apiClient<any>(`/transfers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transferData),
    });
  },

  delete: async (id: string) => {
    return apiClient<any>(`/transfers/${id}`, {
      method: 'DELETE',
    });
  },

  getAnalytics: async () => {
    return apiClient<any>('/transfers/analytics/commissions');
  },
};
