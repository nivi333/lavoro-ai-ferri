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
  CompanyDetailPage,
  DashboardPage,
  LocationListPage,
  OrdersListPage,
  InvoicesListPage,
  BillsListPage,
  ProductsListPage,
  InventoryListPage,
  MachineListPage,
  InspectionsListPage,
  InspectionDetailsPage,
  QualityCheckpointsListPage,
  QualityDefectsListPage,
  QualityReportsPage,
  ComplianceReportsListPage,
  UsersListPage,
  UserProfilePage,
  CustomerListPage,
  SupplierListPage,
  PurchaseOrdersListPage,
} from '../pages';
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
              path='/sales/orders'
              element={
                <ProtectedRoute requireCompany={true}>
                  <OrdersListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/sales/invoices'
              element={
                <ProtectedRoute requireCompany={true}>
                  <InvoicesListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/customers'
              element={
                <ProtectedRoute requireCompany={true}>
                  <CustomerListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/suppliers'
              element={
                <ProtectedRoute requireCompany={true}>
                  <SupplierListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/purchase/orders'
              element={
                <ProtectedRoute requireCompany={true}>
                  <PurchaseOrdersListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/purchase/bills'
              element={
                <ProtectedRoute requireCompany={true}>
                  <BillsListPage />
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

            <Route
              path='/profile'
              element={
                <ProtectedRoute requireCompany={true}>
                  <UserProfilePage />
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
