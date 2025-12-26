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
                path='/company/:tenantId'
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
