import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { HeaderProvider } from './contexts/HeaderContext';
import ThemeProvider from './contexts/ThemeContext';
import ProtectedRoute, { PublicRoute } from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import CompaniesListPage from './pages/company/CompaniesListPage';
import CompanyDetailPage from './pages/company/CompanyDetailPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import LocationListPage from './pages/company/LocationListPage';
import ProductsListPage from './pages/products/ProductsListPage';
import CustomerListPage from './pages/sales/CustomerListPage';
import OrdersListPage from './pages/orders/OrdersListPage';
import SupplierListPage from './pages/purchase/SupplierListPage';
import PlaceholderPage from './components/PlaceholderPage';
import { SidebarStylesInjector } from './styles/sidebar.styles';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <SidebarStylesInjector />
      <AuthProvider>
        <HeaderProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route
                path='/login'
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path='/register'
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path='/forgot-password'
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                }
              />

              {/* Company Selection - Protected but outside MainLayout */}
              <Route
                path='/companies'
                element={
                  <ProtectedRoute>
                    <CompaniesListPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes with MainLayout - Require Company */}
              <Route
                path='/dashboard'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <DashboardPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path='/companies/:tenantId'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <CompanyDetailPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path='/locations'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <LocationListPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path='/products'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <ProductsListPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Placeholder routes for not-yet-migrated pages */}
              <Route
                path='/customers'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <CustomerListPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/inventory'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/machines'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/users'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/orders'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <OrdersListPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/sales/invoices'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/purchase/orders'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/purchase/bills'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/suppliers'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <SupplierListPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/inspections'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/quality/checkpoints'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/quality/defects'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/quality/compliance'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/quality/reports'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/finance'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/reports'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/reports/financial'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/reports/operational'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/reports/inventory'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/reports/sales'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/textile/fabrics'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/textile/yarns'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/textile/dyeing'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/textile/garments'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path='/textile/designs'
                element={
                  <ProtectedRoute requireCompany={true}>
                    <MainLayout>
                      <PlaceholderPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Default Redirects */}
              <Route path='/' element={<Navigate to='/login' replace />} />
              <Route path='*' element={<Navigate to='/login' replace />} />
            </Routes>
          </BrowserRouter>

          {/* Toast Notifications */}
          <Toaster position='top-right' richColors />
        </HeaderProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
