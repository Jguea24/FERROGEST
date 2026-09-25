import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/auth/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProductsPage } from './pages/inventory/ProductsPage';
import { CategoriesPage } from './pages/inventory/CategoriesPage';
import { LocationsPage } from './pages/inventory/LocationsPage';
import { StockAlertsPage } from './pages/inventory/StockAlertsPage';
import { POSPage } from './pages/sales/POSPage';
import { SalesHistoryPage } from './pages/sales/SalesHistoryPage';
import { CashRegisterPage } from './pages/sales/CashRegisterPage';
import { PurchasesPage } from './pages/purchases/PurchasesPage';
import { SuppliersPage } from './pages/purchases/SuppliersPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UsersPage } from './pages/admin/UsersPage';

// Route Guard Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes inside MainLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Inventario (Incremento 1) */}
            <Route path="inventario/productos" element={<ProductsPage />} />
            <Route path="inventario/categorias" element={<CategoriesPage />} />
            <Route path="inventario/ubicaciones" element={<LocationsPage />} />
            <Route path="inventario/alertas" element={<StockAlertsPage />} />

            {/* Ventas & Caja (Incremento 2) */}
            <Route path="ventas/pos" element={<POSPage />} />
            <Route path="ventas/historial" element={<SalesHistoryPage />} />
            <Route path="ventas/caja" element={<CashRegisterPage />} />

            {/* Compras & Proveedores (Incremento 3 - Admin) */}
            <Route
              path="compras/nueva"
              element={
                <ProtectedRoute adminOnly>
                  <PurchasesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="compras/historial"
              element={
                <ProtectedRoute adminOnly>
                  <PurchasesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="compras/proveedores"
              element={
                <ProtectedRoute adminOnly>
                  <SuppliersPage />
                </ProtectedRoute>
              }
            />

            {/* Reportes (Incremento 3 - Admin) */}
            <Route
              path="reportes"
              element={
                <ProtectedRoute adminOnly>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Administración (Admin) */}
            <Route
              path="admin/usuarios"
              element={
                <ProtectedRoute adminOnly>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
