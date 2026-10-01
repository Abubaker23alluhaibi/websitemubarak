import { apiClient } from './client';
import { Port, USState, ShippingRoute } from '../../types';

export const logisticsApi = {
  // Ports
  getPorts: async (type?: 'loading' | 'destination'): Promise<Port[]> => {
    const query = type ? `?type=${type}` : '';
    return apiClient<Port[]>(`/ports${query}`);
  },

  createPort: async (portData: Partial<Port>): Promise<Port> => {
    return apiClient<Port>('/ports', {
      method: 'POST',
      body: JSON.stringify(portData),
    });
  },

  updatePort: async (id: string, portData: Partial<Port>): Promise<Port> => {
    return apiClient<Port>(`/ports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(portData),
    });
  },

  deletePort: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/ports/${id}`, {
      method: 'DELETE',
    });
  },

  // US States
  getStates: async (): Promise<USState[]> => {
    return apiClient<USState[]>('/us-states');
  },

  createState: async (stateData: Partial<USState>): Promise<USState> => {
    return apiClient<USState>('/us-states', {
      method: 'POST',
      body: JSON.stringify(stateData),
    });
  },

  updateState: async (id: string, stateData: Partial<USState>): Promise<USState> => {
    return apiClient<USState>(`/us-states/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stateData),
    });
  },

  deleteState: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/us-states/${id}`, {
      method: 'DELETE',
    });
  },

  // Shipping Routes
  getRoutes: async (): Promise<ShippingRoute[]> => {
    return apiClient<ShippingRoute[]>('/shipping-routes');
  },

  createRoute: async (routeData: Partial<ShippingRoute>): Promise<ShippingRoute> => {
    return apiClient<ShippingRoute>('/shipping-routes', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  },

  updateRoute: async (id: string, routeData: Partial<ShippingRoute>): Promise<ShippingRoute> => {
    return apiClient<ShippingRoute>(`/shipping-routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(routeData),
    });
  },

  deleteRoute: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/shipping-routes/${id}`, {
      method: 'DELETE',
    });
  },
};
