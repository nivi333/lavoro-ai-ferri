import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { HeaderProvider } from '../contexts/HeaderContext';
import ProtectedRoute, { PublicRoute } from '../components/layout/ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import GoogleAuthCallback from '../components/auth/GoogleAuthCallback';

// Lazy load all page components for better code-splitting
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const CompaniesListPage = lazy(() => import('../pages/company/CompaniesListPage'));
const CompanyDetailPage = lazy(() => import('../pages/company/CompanyDetailPage'));
const DashboardPage = lazy(() =>
  import('../pages/dashboard').then(module => ({ default: module.DashboardPage }))
);
const LocationListPage = lazy(() => import('../pages/company/LocationListPage'));
const OrdersListPage = lazy(() => import('../pages/orders/OrdersListPage'));
const InvoicesListPage = lazy(() => import('../pages/invoices/InvoicesListPage'));
const BillsListPage = lazy(() => import('../pages/bills/BillsListPage'));
const ProductsListPage = lazy(() => import('../pages/products/ProductsListPage'));
const InventoryListPage = lazy(() => import('../pages/inventory/InventoryListPage'));
const MachineListPage = lazy(() => import('../pages/machines/MachineListPage'));
const InspectionsListPage = lazy(() => import('../pages/quality/InspectionsListPage'));
const InspectionDetailsPage = lazy(() => import('../pages/quality/InspectionDetailsPage'));
const QualityCheckpointsListPage = lazy(
  () => import('../pages/quality/QualityCheckpointsListPage')
);
const QualityDefectsListPage = lazy(() => import('../pages/quality/QualityDefectsListPage'));
const ComplianceReportsListPage = lazy(() => import('../pages/quality/ComplianceReportsListPage'));
const UsersListPage = lazy(() => import('../pages/users/UsersListPage'));
const UserProfilePage = lazy(() => import('../pages/users/UserProfilePage'));
const CustomerListPage = lazy(() => import('../pages/sales/CustomerListPage'));
const SupplierListPage = lazy(() => import('../pages/purchase/SupplierListPage'));
const PurchaseOrdersListPage = lazy(() => import('../pages/purchase/PurchaseOrdersListPage'));
const FabricProductionListPage = lazy(() => import('../pages/textile/FabricProductionListPage'));
const YarnManufacturingListPage = lazy(() => import('../pages/textile/YarnManufacturingListPage'));
const DyeingFinishingListPage = lazy(() => import('../pages/textile/DyeingFinishingListPage'));
const GarmentManufacturingListPage = lazy(
  () => import('../pages/textile/GarmentManufacturingListPage')
);
const DesignPatternsListPage = lazy(() => import('../pages/textile/DesignPatternsListPage'));
const FinanceOverviewPage = lazy(() => import('../pages/finance/FinanceOverviewPage'));
const AccountsReceivablePage = lazy(() => import('../pages/finance/AccountsReceivablePage'));
const AccountsPayablePage = lazy(() => import('../pages/finance/AccountsPayablePage'));
const ExpensesPage = lazy(() => import('../pages/finance/ExpensesPage'));
const PettyCashPage = lazy(() => import('../pages/finance/PettyCashPage'));
const ReportsListPage = lazy(() => import('../pages/reports/ReportsListPage'));
const FinancialReportsPage = lazy(() => import('../pages/reports/FinancialReportsPage'));
const InventoryReportsPage = lazy(() => import('../pages/reports/InventoryReportsPage'));
const SalesReportsPage = lazy(() => import('../pages/reports/SalesReportsPage'));
const SubscriptionPlansPage = lazy(() =>
  import('@/components/PlaceholderPage').then(module => ({ default: module.default }))
);
const LegalPage = lazy(() =>
  import('@/components/PlaceholderPage').then(module => ({ default: module.default }))
);

// Loading fallback component
const PageLoader = () => (
  <div className='flex h-screen w-full items-center justify-center'>
    <div className='flex flex-col items-center gap-2'>
      <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
      <p className='text-sm text-muted-foreground'>Loading...</p>
    </div>
  </div>
);

// Main application router component
export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HeaderProvider>
          <Suspense fallback={<PageLoader />}>
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
                path='/legal'
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
          </Suspense>
        </HeaderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
