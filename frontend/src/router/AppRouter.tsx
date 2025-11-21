import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { HeaderProvider } from '../contexts/HeaderContext';
import ProtectedRoute, { PublicRoute } from '../components/ProtectedRoute';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  CompaniesListPage,
  DashboardPage,
  LocationListPage,
  OrdersListPage,
  ProductsListPage,
} from '../pages';
import CompanyDetailPage from '../pages/CompanyDetailPage';
import GoogleAuthCallback from '../components/auth/GoogleAuthCallback';
import QualityCheckpointsListPage from '../pages/QualityCheckpointsListPage';
import QualityDefectsListPage from '../pages/QualityDefectsListPage';
import ComplianceReportsListPage from '../pages/ComplianceReportsListPage';

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
            <Route
              path='/companies/:tenantId'
              element={
                <ProtectedRoute requireCompany={true}>
                  <CompanyDetailPage />
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
              path='/locations'
              element={
                <ProtectedRoute requireCompany={true}>
                  <LocationListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/orders'
              element={
                <ProtectedRoute requireCompany={true}>
                  <OrdersListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/products'
              element={
                <ProtectedRoute requireCompany={true}>
                  <ProductsListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/quality/checkpoints'
              element={
                <ProtectedRoute requireCompany={true}>
                  <QualityCheckpointsListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/quality/defects'
              element={
                <ProtectedRoute requireCompany={true}>
                  <QualityDefectsListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/quality/compliance'
              element={
                <ProtectedRoute requireCompany={true}>
                  <ComplianceReportsListPage />
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
