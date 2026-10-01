import { apiClient } from './client';

export const containersApi = {
  getAll: async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient<any>(`/containers${query}`);
  },

  getById: async (id: string) => {
    return apiClient<any>(`/containers/${id}`);
  },

  create: async (containerData: any) => {
    return apiClient<any>('/containers', {
      method: 'POST',
      body: JSON.stringify(containerData),
    });
  },

  update: async (id: string, containerData: any) => {
    return apiClient<any>(`/containers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(containerData),
    });
  },

  delete: async (id: string) => {
    return apiClient<any>(`/containers/${id}`, {
      method: 'DELETE',
    });
  },

  assignCars: async (containerId: string, carIds: string[]) => {
    return apiClient<any>(`/containers/${containerId}/cars`, {
      method: 'POST',
      body: JSON.stringify({ carIds }),
    });
  },

  removeCar: async (containerId: string, carId: string) => {
    return apiClient<any>(`/containers/${containerId}/cars/${carId}`, {
      method: 'DELETE',
    });
  },
};
