import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { HeaderProvider } from '../contexts/HeaderContext';
import ProtectedRoute, { PublicRoute } from '../components/ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  CompaniesListPage,
  DashboardPage,
  LocationListPage,
  OrdersListPage,
  ProductsListPage,
  InventoryListPage,
  InspectionsListPage,
  InspectionDetailsPage,
} from '../pages';
import MachineListPage from '../pages/MachineListPage';
import CompanyDetailPage from '../pages/CompanyDetailPage';
import GoogleAuthCallback from '../components/auth/GoogleAuthCallback';
import QualityCheckpointsListPage from '../pages/QualityCheckpointsListPage';
import QualityDefectsListPage from '../pages/QualityDefectsListPage';
import ComplianceReportsListPage from '../pages/ComplianceReportsListPage';
import UsersListPage from '../pages/UsersListPage';
import UserProfilePage from '../pages/UserProfilePage';
import QualityReportsPage from '../pages/QualityReportsPage';
import FabricProductionPage from '../pages/textile/FabricProductionPage';

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
              path='/inventory'
              element={
                <ProtectedRoute requireCompany={true}>
                  <InventoryListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/machines'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MachineListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/quality/checkpoints'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <QualityCheckpointsListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/quality/defects'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <QualityDefectsListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/quality/compliance'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <ComplianceReportsListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/inspections'
              element={
                <ProtectedRoute requireCompany={true}>
                  <InspectionsListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/inspections/:id'
              element={
                <ProtectedRoute requireCompany={true}>
                  <InspectionDetailsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/quality/reports'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <QualityReportsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/users'
              element={
                <ProtectedRoute requireCompany={true}>
                  <UsersListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/users/:userId'
              element={
                <ProtectedRoute requireCompany={true}>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Textile Manufacturing Routes */}
            <Route
              path='/textile/fabric-production'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <FabricProductionPage />
                  </MainLayout>
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
