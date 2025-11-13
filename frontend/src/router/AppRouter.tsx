import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { HeaderProvider } from '../contexts/HeaderContext';
import ProtectedRoute, { PublicRoute } from '../components/ProtectedRoute';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  DashboardPage,
  InventoryPage,
  LocationListPage,
} from '../pages';
import CompaniesListPage from '../pages/CompaniesListPage';
import GoogleAuthCallback from '../components/auth/GoogleAuthCallback';

// Main application router component
export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HeaderProvider>
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

          <Route path='/auth/google/callback' element={<GoogleAuthCallback />} />

          {/* Protected Routes - No Company Required */}
          <Route
            path='/companies'
            element={
              <ProtectedRoute>
                <CompaniesListPage />
              </ProtectedRoute>
            }
          />
          {/* Protected Routes - Company Required */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute requireCompany={true}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path='/inventory'
            element={
              <ProtectedRoute requireCompany={true}>
                <InventoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path='/locations'
            element={
              <ProtectedRoute requireCompany={true}>
                <LocationListPage />
              </ProtectedRoute>
            }
          />

          {/* Default Redirects */}
          <Route path='/' element={<Navigate to='/login' replace />} />
          <Route path='*' element={<Navigate to='/login' replace />} />
          </Routes>
        </HeaderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
