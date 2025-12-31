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
                    <InvoicesListPage />
                  </MainLayout>
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
                  <MainLayout>
                    <PurchaseOrdersListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/purchase/bills'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <BillsListPage />
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

            {/* Textile Operations */}
            <Route
              path='/textile/fabrics'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <FabricProductionListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/textile/yarns'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <YarnManufacturingListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/textile/dyeing'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <DyeingFinishingListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/textile/garments'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <GarmentManufacturingListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/textile/designs'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <DesignPatternsListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/inventory'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <InventoryListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/machines'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <MachineListPage />
                  </MainLayout>
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
                  <MainLayout>
                    <InspectionsListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/inspections/:id'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <InspectionDetailsPage />
                  </MainLayout>
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
                  <MainLayout>
                    <UsersListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/users/:userId'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <UserProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/profile'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <UserProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/finance'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <FinanceOverviewPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/finance/accounts-receivable'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <AccountsReceivablePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/finance/accounts-payable'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <AccountsPayablePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/finance/expenses'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <ExpensesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/finance/petty-cash'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <PettyCashPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route
              path='/reports'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <ReportsListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/financial'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <FinancialReportsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/inventory'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <InventoryReportsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/sales'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <SalesReportsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/operational'
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <OperationalReportsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/subscription/plans'
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SubscriptionPlansPage />
                  </MainLayout>
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
