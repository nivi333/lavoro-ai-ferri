import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { HeaderProvider } from '../contexts/HeaderContext';
import ProtectedRoute, { PublicRoute } from '../components/layout/ProtectedRoute';
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
  FabricProductionListPage,
  YarnManufacturingListPage,
  DyeingFinishingListPage,
  GarmentManufacturingListPage,
  DesignPatternsListPage,
  FinanceOverviewPage,
  AccountsReceivablePage,
  AccountsPayablePage,
  ExpensesPage,
  PettyCashPage,
  ReportsListPage,
  FinancialReportsPage,
  InventoryReportsPage,
  SalesReportsPage,
  OperationalReportsPage,
  SubscriptionPlansPage,
  LegalPage,
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
                  <MainLayout>
                    <CompanyDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            {/* Protected Routes - Company Required */}
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
              path='/orders'
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
                  <MainLayout>
                    <CustomerListPage />
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
                  <MainLayout>
                    <ProductsListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Textile Operations */}
            <Route
              path='/textile/fabrics'
              element={
                <ProtectedRoute requireCompany={true}>
                  <FabricProductionListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/textile/yarns'
              element={
                <ProtectedRoute requireCompany={true}>
                  <YarnManufacturingListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/textile/dyeing'
              element={
                <ProtectedRoute requireCompany={true}>
                  <DyeingFinishingListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/textile/garments'
              element={
                <ProtectedRoute requireCompany={true}>
                  <GarmentManufacturingListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/textile/designs'
              element={
                <ProtectedRoute requireCompany={true}>
                  <DesignPatternsListPage />
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

            <Route
              path='/finance'
              element={
                <ProtectedRoute requireCompany={true}>
                  <FinanceOverviewPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/finance/accounts-receivable'
              element={
                <ProtectedRoute requireCompany={true}>
                  <AccountsReceivablePage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/finance/accounts-payable'
              element={
                <ProtectedRoute requireCompany={true}>
                  <AccountsPayablePage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/finance/expenses'
              element={
                <ProtectedRoute requireCompany={true}>
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/finance/petty-cash'
              element={
                <ProtectedRoute requireCompany={true}>
                  <PettyCashPage />
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route
              path='/reports'
              element={
                <ProtectedRoute requireCompany={true}>
                  <ReportsListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/financial'
              element={
                <ProtectedRoute requireCompany={true}>
                  <FinancialReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/inventory'
              element={
                <ProtectedRoute requireCompany={true}>
                  <InventoryReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/sales'
              element={
                <ProtectedRoute requireCompany={true}>
                  <SalesReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/operational'
              element={
                <ProtectedRoute requireCompany={true}>
                  <OperationalReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/subscription/plans'
              element={
                <ProtectedRoute>
                  <SubscriptionPlansPage />
                </ProtectedRoute>
              }
            />

            {/* Legal Pages */}
            <Route
              path='/legal/terms'
              element={
                <ProtectedRoute>
                  <LegalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/legal/privacy'
              element={
                <ProtectedRoute>
                  <LegalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/legal/cookie-policy'
              element={
                <ProtectedRoute>
                  <LegalPage />
                </ProtectedRoute>
              }
            />

            {/* Settings */}
            <Route
              path='/settings'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <UserProfilePage />
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
