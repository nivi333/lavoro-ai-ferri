// Re-export all page components for better TypeScript module resolution
import PlaceholderPage from '@/components/PlaceholderPage';

// Authentication
export { default as LoginPage } from './auth/LoginPage';
export { default as RegisterPage } from './auth/RegisterPage';
export { default as ForgotPasswordPage } from './auth/ForgotPasswordPage';

// Dashboard
export { DashboardPage } from './dashboard';

// Company Management
export { default as CompaniesListPage } from './company/CompaniesListPage';
export { default as CompanyDetailPage } from './company/CompanyDetailPage';
export { default as LocationListPage } from './company/LocationListPage';

// Products - TODO: Migrate these pages
export { default as ProductsListPage } from './products/ProductsListPage';

// Inventory - TODO: Migrate these pages
export { default as InventoryListPage } from './inventory/InventoryListPage';

// Machines - TODO: Migrate these pages
export const MachineListPage = PlaceholderPage;

// Orders - TODO: Migrate these pages
export const OrdersListPage = PlaceholderPage;

// Invoices - TODO: Migrate these pages
export const InvoicesListPage = PlaceholderPage;

// Bills - TODO: Migrate these pages
export const BillsListPage = PlaceholderPage;

// Sales - TODO: Migrate these pages
export { default as CustomerListPage } from './sales/CustomerListPage';

// Purchase - TODO: Migrate these pages
export { default as SupplierListPage } from './purchase/SupplierListPage';
export const PurchaseOrdersListPage = PlaceholderPage;

// Quality Control - TODO: Migrate these pages
export const QualityCheckpointsListPage = PlaceholderPage;
export const QualityDefectsListPage = PlaceholderPage;
export const QualityReportsPage = PlaceholderPage;
export const ComplianceReportsListPage = PlaceholderPage;
export const InspectionsListPage = PlaceholderPage;
export const InspectionDetailsPage = PlaceholderPage;

// Users - TODO: Migrate these pages
export const UserProfilePage = PlaceholderPage;
export const UsersListPage = PlaceholderPage;

// Finance - TODO: Migrate these pages
export const FinanceOverviewPage = PlaceholderPage;
export const AccountsReceivablePage = PlaceholderPage;
export const AccountsPayablePage = PlaceholderPage;
export const ExpensesPage = PlaceholderPage;
export const PettyCashPage = PlaceholderPage;

// Reports - TODO: Migrate these pages
export const ReportsListPage = PlaceholderPage;
export const FinancialReportsPage = PlaceholderPage;
export const InventoryReportsPage = PlaceholderPage;
export const SalesReportsPage = PlaceholderPage;
export const OperationalReportsPage = PlaceholderPage;

// Subscription
export const SubscriptionPlansPage = PlaceholderPage;

// Textile Operations - TODO: Migrate these pages
export const FabricProductionListPage = PlaceholderPage;
export const YarnManufacturingListPage = PlaceholderPage;
export const DyeingFinishingListPage = PlaceholderPage;
export const GarmentManufacturingListPage = PlaceholderPage;
export const DesignPatternsListPage = PlaceholderPage;

// Legal - TODO: Migrate these pages
export const LegalPage = PlaceholderPage;
