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
  FabricProductionListPage,
  YarnManufacturingListPage,
  DyeingFinishingListPage,
  GarmentManufacturingListPage,
  DesignPatternsListPage,
  FinanceOverviewPage,
  AccountsReceivablePage,
  AccountsPayablePage,
  ExpensesPage,
  ReportsListPage,
  FinancialReportsPage,
  InventoryReportsPage,
  SalesReportsPage,
  ProductionReportsPage,
  QualityReportsPageReport,
  OperationalReportsPage,
  ProductionEfficiencyReportPage,
  AnalyticsReportsPage,
  // New Operational Reports
  MachineUtilizationReportPage,
  ProductionPlanningReportPage,
  // Financial Report Detail Pages
  ProfitLossReportPage,
  BalanceSheetReportPage,
  CashFlowReportPage,
  TrialBalanceReportPage,
  GSTReportPage,
  AccountsReceivableReportPage,
  AccountsPayableReportPage,
  ExpenseSummaryReportPage,
  // Inventory Report Detail Pages
  StockSummaryReportPage,
  StockMovementReportPage,
  LowStockReportPage,
  StockAgingReportPage,
  StockValuationReportPage,
  // Sales Report Detail Pages
  SalesSummaryReportPage,
  SalesTrendReportPage,
  TopSellingProductsReportPage,
  CustomerPurchaseHistoryReportPage,
  SalesByRegionReportPage,
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
              path='/reports/production'
              element={
                <ProtectedRoute requireCompany={true}>
                  <ProductionReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/quality'
              element={
                <ProtectedRoute requireCompany={true}>
                  <QualityReportsPageReport />
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
              path='/reports/operational/production-efficiency'
              element={
                <ProtectedRoute requireCompany={true}>
                  <ProductionEfficiencyReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/analytics'
              element={
                <ProtectedRoute requireCompany={true}>
                  <AnalyticsReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Financial Report Detail Pages */}
            <Route
              path='/reports/financial/profit-loss'
              element={
                <ProtectedRoute requireCompany={true}>
                  <ProfitLossReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/financial/balance-sheet'
              element={
                <ProtectedRoute requireCompany={true}>
                  <BalanceSheetReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/financial/cash-flow'
              element={
                <ProtectedRoute requireCompany={true}>
                  <CashFlowReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/financial/trial-balance'
              element={
                <ProtectedRoute requireCompany={true}>
                  <TrialBalanceReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/financial/gst-reports'
              element={
                <ProtectedRoute requireCompany={true}>
                  <GSTReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/financial/accounts-receivable'
              element={
                <ProtectedRoute requireCompany={true}>
                  <AccountsReceivableReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/financial/accounts-payable'
              element={
                <ProtectedRoute requireCompany={true}>
                  <AccountsPayableReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/financial/expense-summary'
              element={
                <ProtectedRoute requireCompany={true}>
                  <ExpenseSummaryReportPage />
                </ProtectedRoute>
              }
            />

            {/* Inventory Report Detail Pages */}
            <Route
              path='/reports/inventory/stock-summary'
              element={
                <ProtectedRoute requireCompany={true}>
                  <StockSummaryReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/inventory/stock-movement'
              element={
                <ProtectedRoute requireCompany={true}>
                  <StockMovementReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/inventory/low-stock'
              element={
                <ProtectedRoute requireCompany={true}>
                  <LowStockReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/inventory/stock-aging'
              element={
                <ProtectedRoute requireCompany={true}>
                  <StockAgingReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/inventory/inventory-valuation'
              element={
                <ProtectedRoute requireCompany={true}>
                  <StockValuationReportPage />
                </ProtectedRoute>
              }
            />

            {/* Sales Report Detail Pages */}
            <Route
              path='/reports/sales/sales-summary'
              element={
                <ProtectedRoute requireCompany={true}>
                  <SalesSummaryReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/sales/sales-trend'
              element={
                <ProtectedRoute requireCompany={true}>
                  <SalesTrendReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/sales/top-products'
              element={
                <ProtectedRoute requireCompany={true}>
                  <TopSellingProductsReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/sales/customer-analysis'
              element={
                <ProtectedRoute requireCompany={true}>
                  <CustomerPurchaseHistoryReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/reports/sales/sales-by-region'
              element={
                <ProtectedRoute requireCompany={true}>
                  <SalesByRegionReportPage />
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
