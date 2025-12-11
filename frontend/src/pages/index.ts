// Re-export all page components for better TypeScript module resolution

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

// Products
export { default as ProductsListPage } from './products/ProductsListPage';

// Inventory
export { default as InventoryListPage } from './inventory/InventoryListPage';

// Machines
export { default as MachineListPage } from './machines/MachineListPage';

// Orders
export { default as OrdersListPage } from './orders/OrdersListPage';

// Invoices
export { default as InvoicesListPage } from './invoices/InvoicesListPage';

// Bills
export { default as BillsListPage } from './bills/BillsListPage';

// Sales
export { default as CustomerListPage } from './sales/CustomerListPage';

// Purchase
export { default as SupplierListPage } from './purchase/SupplierListPage';
export { default as PurchaseOrdersListPage } from './purchase/PurchaseOrdersListPage';

// Quality Control
export { default as QualityCheckpointsListPage } from './quality/QualityCheckpointsListPage';
export { default as QualityDefectsListPage } from './quality/QualityDefectsListPage';
export { default as QualityReportsPage } from './quality/QualityReportsPage';
export { default as ComplianceReportsListPage } from './quality/ComplianceReportsListPage';
export { default as InspectionsListPage } from './quality/InspectionsListPage';
export { default as InspectionDetailsPage } from './quality/InspectionDetailsPage';

// Users
export { default as UserProfilePage } from './users/UserProfilePage';
export { default as UsersListPage } from './users/UsersListPage';

// Finance
export { default as FinanceOverviewPage } from './finance/FinanceOverviewPage';
export { default as AccountsReceivablePage } from './finance/AccountsReceivablePage';
export { default as AccountsPayablePage } from './finance/AccountsPayablePage';
export { default as ExpensesPage } from './finance/ExpensesPage';
export { default as PettyCashPage } from './finance/PettyCashPage';

// Reports
export { default as ReportsPage } from './reports/ReportsPage';
export { default as ReportsListPage } from './reports/ReportsListPage';
export { default as FinancialReportsPage } from './reports/FinancialReportsPage';
export { default as InventoryReportsPage } from './reports/InventoryReportsPage';
export { default as SalesReportsPage } from './reports/SalesReportsPage';

export { default as OperationalReportsPage } from './reports/OperationalReportsPage';
export { default as SubscriptionPlansPage } from './subscription/SubscriptionPlansPage';

// Textile Operations
export { default as FabricProductionListPage } from './textile/FabricProductionListPage';
export { default as YarnManufacturingListPage } from './textile/YarnManufacturingListPage';
export { default as DyeingFinishingListPage } from './textile/DyeingFinishingListPage';
export { default as GarmentManufacturingListPage } from './textile/GarmentManufacturingListPage';
export { default as DesignPatternsListPage } from './textile/DesignPatternsListPage';
