import { apiClient } from './client';

export const auditApi = {
  getAll: async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient<any>(`/audit-logs${query}`);
  },

  getById: async (id: string) => {
    return apiClient<any>(`/audit-logs/${id}`);
  },
};
