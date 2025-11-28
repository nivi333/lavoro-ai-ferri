// Re-export all page components for better TypeScript module resolution

// Authentication
export { default as LoginPage } from './auth/LoginPage';
export { default as RegisterPage } from './auth/RegisterPage';
export { default as ForgotPasswordPage } from './auth/ForgotPasswordPage';

// Dashboard
export { default as DashboardPage } from './dashboard/DashboardPage';

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

// Sales
export { default as CustomerListPage } from './sales/CustomerListPage';

// Purchase
export { default as SupplierListPage } from './purchase/SupplierListPage';

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
