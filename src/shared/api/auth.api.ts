import { apiClient } from './client';

export interface LoginCredentials {
  username: string;
  password?: string;
}

export interface AuthResponse {
  user: any;
  accessToken: string;
  token?: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData: {
    fullName: string;
    username: string;
    password?: string;
    phone?: string;
    email?: string;
  }): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getCurrentUser: async (): Promise<any> => {
    return apiClient<any>('/auth/me');
  },
};
