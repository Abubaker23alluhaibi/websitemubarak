import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../shared/context/AuthContext';
import { DataProvider } from '../shared/context/DataContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <AuthProvider>{children}</AuthProvider>
      </DataProvider>
    </QueryClientProvider>
  );
};
