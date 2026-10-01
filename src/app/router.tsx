import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../shared/components/layout/DashboardLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CarsListPage } from '../features/cars/CarsListPage';
import { ContainersPage } from '../features/containers/ContainersPage';
import { InvoicesPage } from '../features/invoices/InvoicesPage';
import { ExchangePage } from '../features/exchange/ExchangePage';
import { ExchangeOfficeDetailPage } from '../features/exchange/ExchangeOfficeDetailPage';
import { LogisticsPage } from '../features/logistics/LogisticsPage';
import { CalculatorPage } from '../features/calculator/CalculatorPage';
import { UsersPage } from '../features/users/UsersPage';
import { CustomersPage } from '../features/customers/CustomersPage';
import { CustomerGaragePage } from '../features/customer/CustomerGaragePage';
import { useAuth } from '../shared/context/AuthContext';
import { AppPageKey } from '../types';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPage?: AppPageKey;
}> = ({
  children,
  allowedRoles,
  requiredPage,
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // توجيه العميل إذا حاول فتح لوحة الأدمن
    if (user.role === 'customer') {
      return <Navigate to="/my-cars" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // فحص صلاحية الصفحة الدقيقة للموظف
  if (
    requiredPage &&
    user.role !== 'super_admin' &&
    user.permissions?.allowedPages &&
    user.permissions.allowedPages.length > 0 &&
    !user.permissions.allowedPages.includes(requiredPage)
  ) {
    const firstAllowed = user.permissions.allowedPages[0];
    const targetPath = firstAllowed ? `/${firstAllowed}` : '/dashboard';
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Main Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requiredPage="dashboard">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers"
          element={
            <ProtectedRoute requiredPage="customers">
              <CustomersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cars"
          element={
            <ProtectedRoute requiredPage="cars">
              <CarsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="containers"
          element={
            <ProtectedRoute requiredPage="containers">
              <ContainersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="invoices"
          element={
            <ProtectedRoute requiredPage="invoices">
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="exchange"
          element={
            <ProtectedRoute requiredPage="exchange">
              <ExchangePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="exchange/:id"
          element={
            <ProtectedRoute requiredPage="exchange">
              <ExchangeOfficeDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="logistics"
          element={
            <ProtectedRoute requiredPage="logistics">
              <LogisticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calculator"
          element={
            <ProtectedRoute requiredPage="calculator">
              <CalculatorPage />
            </ProtectedRoute>
          }
        />
        <Route path="my-cars" element={<CustomerGaragePage />} />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPage="users">
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
