import { apiClient } from './client';

export const exchangeApi = {
  getOffices: async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient<any>(`/exchange-offices${query}`);
  },

  getOfficeById: async (id: string) => {
    return apiClient<any>(`/exchange-offices/${id}`);
  },

  createOffice: async (officeData: any) => {
    return apiClient<any>('/exchange-offices', {
      method: 'POST',
      body: JSON.stringify(officeData),
    });
  },

  updateOffice: async (id: string, officeData: any) => {
    return apiClient<any>(`/exchange-offices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(officeData),
    });
  },

  deleteOffice: async (id: string) => {
    return apiClient<any>(`/exchange-offices/${id}`, {
      method: 'DELETE',
    });
  },
};
