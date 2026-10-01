import { apiClient } from './client';

export const carsApi = {
  getAll: async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient<any>(`/cars${query}`);
  },

  getById: async (id: string) => {
    return apiClient<any>(`/cars/${id}`);
  },

  create: async (carData: any) => {
    return apiClient<any>('/cars', {
      method: 'POST',
      body: JSON.stringify(carData),
    });
  },

  update: async (id: string, carData: any) => {
    return apiClient<any>(`/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(carData),
    });
  },

  updateStatus: async (id: string, status: string) => {
    return apiClient<any>(`/cars/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    return apiClient<any>(`/cars/${id}`, {
      method: 'DELETE',
    });
  },

  getMessages: async (carId: string) => {
    return apiClient<any>(`/cars/${carId}/messages`);
  },

  sendMessage: async (carId: string, text: string) => {
    return apiClient<any>(`/cars/${carId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message: text }),
    });
  },
};
