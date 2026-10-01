import { apiClient } from './client';

export const usersApi = {
  getAll: async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient<any>(`/users${query}`);
  },

  getById: async (id: string) => {
    return apiClient<any>(`/users/${id}`);
  },

  create: async (userData: any) => {
    return apiClient<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: string, userData: any) => {
    return apiClient<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: string) => {
    return apiClient<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};
