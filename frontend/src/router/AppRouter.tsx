import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from '../components/ProtectedRoute';
import { 
  LoginPage, 
  RegisterPage, 
  ForgotPasswordPage, 
  DashboardPage 
} from '../pages';
import { CompaniesListPage } from '../pages/CompaniesListPage';
import { GoogleAuthCallback } from '../components/auth/GoogleAuthCallback';

// Main application router component
export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          
          <Route
            path="/auth/google/callback"
            element={<GoogleAuthCallback />}
          />

          {/* Protected Routes - No Company Required */}
          <Route
            path="/companies"
            element={
              <ProtectedRoute>
                <CompaniesListPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Company Required */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireCompany>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Default Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
