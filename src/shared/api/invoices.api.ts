import { apiClient } from './client';

export const invoicesApi = {
  getAll: async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient<any>(`/invoices${query}`);
  },

  getById: async (id: string) => {
    return apiClient<any>(`/invoices/${id}`);
  },

  create: async (invoiceData: any) => {
    return apiClient<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  },

  update: async (id: string, invoiceData: any) => {
    return apiClient<any>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    });
  },

  delete: async (id: string) => {
    return apiClient<any>(`/invoices/${id}`, {
      method: 'DELETE',
    });
  },

  lock: async (id: string, reason?: string) => {
    return apiClient<any>(`/invoices/${id}/lock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  unlock: async (id: string, reason?: string) => {
    return apiClient<any>(`/invoices/${id}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  addItem: async (id: string, itemData: any) => {
    return apiClient<any>(`/invoices/${id}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  removeItem: async (id: string, itemId: string) => {
    return apiClient<any>(`/invoices/${id}/items/${itemId}`, {
      method: 'DELETE',
    });
  },
};
