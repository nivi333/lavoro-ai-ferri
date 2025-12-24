# Lavoro AI Ferri - Frontend API Reference
## Complete Backend API Integration Guide

This document lists all backend APIs used by the frontend. **No changes required** - all services remain identical during shadcn/ui migration.

---

## Authentication APIs

```typescript
// Base URL: /api/v1/auth (Public endpoints)

POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
```

**Service: authService.ts**
```typescript
export const authService = {
  register: (data: RegisterDto) => Promise<AuthResponse>
  login: (data: LoginDto) => Promise<AuthResponse>
  refreshToken: () => Promise<TokenResponse>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
}
```

---

## Company Management APIs

```typescript
// Base URL: /api/v1/companies (Protected)

GET    /api/v1/companies
POST   /api/v1/companies
GET    /api/v1/companies/:id
PUT    /api/v1/companies/:id
DELETE /api/v1/companies/:id
POST   /api/v1/companies/:id/switch
POST   /api/v1/companies/:id/invite
```

**Service: companyService.ts**
```typescript
export const companyService = {
  getUserCompanies: () => Promise<Company[]>
  createCompany: (data: CreateCompanyDto) => Promise<Company>
  getCompanyById: (id: string) => Promise<Company>
  updateCompany: (id: string, data: UpdateCompanyDto) => Promise<Company>
  deleteCompany: (id: string) => Promise<void>
  switchCompany: (id: string) => Promise<AuthResponse>
  inviteUser: (companyId: string, data: InviteUserDto) => Promise<void>
}
```

---

## Location Management APIs

```typescript
// Base URL: /api/v1/locations (Protected)

GET    /api/v1/locations
POST   /api/v1/locations
GET    /api/v1/locations/:id
PUT    /api/v1/locations/:id
DELETE /api/v1/locations/:id
PATCH  /api/v1/locations/:id/default
```

**Service: locationService.ts**
```typescript
export const locationService = {
  getLocations: () => Promise<Location[]>
  createLocation: (data: CreateLocationDto) => Promise<Location>
  getLocationById: (id: string) => Promise<Location>
  updateLocation: (id: string, data: UpdateLocationDto) => Promise<Location>
  deleteLocation: (id: string) => Promise<void>
  setDefaultLocation: (id: string) => Promise<Location>
}
```

---

## Product Management APIs

```typescript
// Base URL: /api/v1/products (Protected)

GET    /api/v1/products
POST   /api/v1/products
GET    /api/v1/products/:id
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
POST   /api/v1/products/:id/stock-adjustment
GET    /api/v1/products/categories
POST   /api/v1/products/categories
```

**Service: productService.ts**
```typescript
export const productService = {
  getProducts: (filters?: ProductFilters) => Promise<Product[]>
  createProduct: (data: CreateProductDto) => Promise<Product>
  getProductById: (id: string) => Promise<Product>
  updateProduct: (id: string, data: UpdateProductDto) => Promise<Product>
  deleteProduct: (id: string) => Promise<void>
  adjustStock: (id: string, data: StockAdjustmentDto) => Promise<Product>
  getCategories: () => Promise<Category[]>
  createCategory: (data: CreateCategoryDto) => Promise<Category>
}
```

---

## Inventory Management APIs

```typescript
// Base URL: /api/v1/inventory (Protected)

GET    /api/v1/inventory/locations
PUT    /api/v1/inventory/locations
POST   /api/v1/inventory/movements
POST   /api/v1/inventory/reservations
DELETE /api/v1/inventory/reservations/:id
GET    /api/v1/inventory/alerts
PATCH  /api/v1/inventory/alerts/:id/acknowledge
```

**Service: inventoryService.ts**
```typescript
export const inventoryService = {
  getLocationInventory: (filters?: InventoryFilters) => Promise<LocationInventory[]>
  updateLocationInventory: (data: UpdateInventoryDto) => Promise<LocationInventory>
  recordStockMovement: (data: StockMovementDto) => Promise<StockMovement>
  createStockReservation: (data: ReservationDto) => Promise<StockReservation>
  releaseStockReservation: (id: string) => Promise<void>
  getStockAlerts: (filters?: AlertFilters) => Promise<StockAlert[]>
  acknowledgeStockAlert: (id: string) => Promise<StockAlert>
}
```

---

## Order Management APIs

```typescript
// Base URL: /api/v1/orders (Protected)

GET    /api/v1/orders
POST   /api/v1/orders
GET    /api/v1/orders/:id
PUT    /api/v1/orders/:id
DELETE /api/v1/orders/:id
PATCH  /api/v1/orders/:id/status
```

**Service: orderService.ts**
```typescript
export const orderService = {
  getOrders: (filters?: OrderFilters) => Promise<Order[]>
  createOrder: (data: CreateOrderDto) => Promise<Order>
  getOrderById: (id: string) => Promise<Order>
  updateOrder: (id: string, data: UpdateOrderDto) => Promise<Order>
  deleteOrder: (id: string) => Promise<void>
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<Order>
}
```

---

## Machine Management APIs

```typescript
// Base URL: /api/v1/machines (Protected)

GET    /api/v1/machines
POST   /api/v1/machines
GET    /api/v1/machines/:id
PUT    /api/v1/machines/:id
DELETE /api/v1/machines/:id
PATCH  /api/v1/machines/:id/status
POST   /api/v1/machines/breakdowns
GET    /api/v1/machines/breakdowns
POST   /api/v1/machines/maintenance/schedules
GET    /api/v1/machines/maintenance/schedules
POST   /api/v1/machines/maintenance/records
GET    /api/v1/machines/analytics
```

**Service: machineService.ts**
```typescript
export const machineService = {
  getMachines: (filters?: MachineFilters) => Promise<Machine[]>
  createMachine: (data: CreateMachineDto) => Promise<Machine>
  getMachineById: (id: string) => Promise<Machine>
  updateMachine: (id: string, data: UpdateMachineDto) => Promise<Machine>
  deleteMachine: (id: string) => Promise<void>
  updateMachineStatus: (id: string, status: MachineStatus) => Promise<Machine>
  reportBreakdown: (data: BreakdownDto) => Promise<BreakdownReport>
  getBreakdowns: (filters?: BreakdownFilters) => Promise<BreakdownReport[]>
  createMaintenanceSchedule: (data: ScheduleDto) => Promise<MaintenanceSchedule>
  getMaintenanceSchedules: () => Promise<MaintenanceSchedule[]>
  recordMaintenance: (data: MaintenanceDto) => Promise<MaintenanceRecord>
  getMachineAnalytics: () => Promise<MachineAnalytics>
}
```

---

## Quality Control APIs

```typescript
// Base URL: /api/v1/quality (Protected)

GET    /api/v1/quality/inspections
POST   /api/v1/quality/inspections
GET    /api/v1/quality/inspections/:id
PUT    /api/v1/quality/inspections/:id
DELETE /api/v1/quality/inspections/:id
GET    /api/v1/quality/checkpoints
POST   /api/v1/quality/checkpoints
GET    /api/v1/quality/defects
POST   /api/v1/quality/defects
GET    /api/v1/quality/compliance
POST   /api/v1/quality/compliance
```

**Service: qualityService.ts & inspectionService.ts**
```typescript
export const qualityService = {
  getCheckpoints: (filters?: CheckpointFilters) => Promise<QualityCheckpoint[]>
  createCheckpoint: (data: CreateCheckpointDto) => Promise<QualityCheckpoint>
  getDefects: (filters?: DefectFilters) => Promise<QualityDefect[]>
  createDefect: (data: CreateDefectDto) => Promise<QualityDefect>
  getComplianceReports: () => Promise<ComplianceReport[]>
  createComplianceReport: (data: ComplianceDto) => Promise<ComplianceReport>
}

export const inspectionService = {
  getInspections: (filters?: InspectionFilters) => Promise<Inspection[]>
  createInspection: (data: CreateInspectionDto) => Promise<Inspection>
  getInspectionById: (id: string) => Promise<Inspection>
  updateInspection: (id: string, data: UpdateInspectionDto) => Promise<Inspection>
  deleteInspection: (id: string) => Promise<void>
}
```

---

## Financial Document APIs

```typescript
// Base URL: /api/v1/invoices, /api/v1/bills, /api/v1/purchase-orders (Protected)

// Invoices
GET    /api/v1/invoices
POST   /api/v1/invoices
GET    /api/v1/invoices/:id
PUT    /api/v1/invoices/:id
DELETE /api/v1/invoices/:id

// Bills
GET    /api/v1/bills
POST   /api/v1/bills
GET    /api/v1/bills/:id
PUT    /api/v1/bills/:id
DELETE /api/v1/bills/:id

// Purchase Orders
GET    /api/v1/purchase-orders
POST   /api/v1/purchase-orders
GET    /api/v1/purchase-orders/:id
PUT    /api/v1/purchase-orders/:id
DELETE /api/v1/purchase-orders/:id
```

**Services: invoiceService.ts, billService.ts, purchaseOrderService.ts**
```typescript
export const invoiceService = {
  getInvoices: (filters?: InvoiceFilters) => Promise<Invoice[]>
  createInvoice: (data: CreateInvoiceDto) => Promise<Invoice>
  getInvoiceById: (id: string) => Promise<Invoice>
  updateInvoice: (id: string, data: UpdateInvoiceDto) => Promise<Invoice>
  deleteInvoice: (id: string) => Promise<void>
}

// Similar structure for billService and purchaseOrderService
```

---

## Analytics APIs

```typescript
// Base URL: /api/v1/analytics (Protected)

GET    /api/v1/analytics/dashboard
GET    /api/v1/analytics/revenue-trends?months=N
GET    /api/v1/analytics/top-products?limit=N
GET    /api/v1/analytics/top-customers?limit=N
GET    /api/v1/analytics/quality-metrics
GET    /api/v1/analytics/production-summary
```

**Service: analyticsService.ts**
```typescript
export const analyticsService = {
  getDashboardAnalytics: () => Promise<DashboardAnalytics>
  getRevenueTrends: (months: number) => Promise<RevenueTrend[]>
  getTopProducts: (limit: number) => Promise<TopProduct[]>
  getTopCustomers: (limit: number) => Promise<TopCustomer[]>
  getQualityMetrics: () => Promise<QualityMetrics>
  getProductionSummary: () => Promise<ProductionSummary>
}
```

---

## Textile-Specific APIs

```typescript
// Base URL: /api/v1/textile (Protected)

GET    /api/v1/textile/fabric-production
POST   /api/v1/textile/fabric-production
GET    /api/v1/textile/yarn-manufacturing
POST   /api/v1/textile/yarn-manufacturing
GET    /api/v1/textile/dyeing-finishing
POST   /api/v1/textile/dyeing-finishing
GET    /api/v1/textile/garment-manufacturing
POST   /api/v1/textile/garment-manufacturing
```

**Service: textileService.ts**
```typescript
export const textileService = {
  getFabricProduction: () => Promise<FabricProduction[]>
  createFabricProduction: (data: FabricProductionDto) => Promise<FabricProduction>
  getYarnManufacturing: () => Promise<YarnManufacturing[]>
  createYarnBatch: (data: YarnBatchDto) => Promise<YarnManufacturing>
  getDyeingFinishing: () => Promise<DyeingFinishing[]>
  createDyeingBatch: (data: DyeingBatchDto) => Promise<DyeingFinishing>
  getGarmentManufacturing: () => Promise<GarmentManufacturing[]>
  createGarmentBatch: (data: GarmentBatchDto) => Promise<GarmentManufacturing>
}
```

---

## Customer & Supplier APIs

```typescript
// Base URL: /api/v1/customers, /api/v1/suppliers (Protected)

// Customers
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PUT    /api/v1/customers/:id
DELETE /api/v1/customers/:id

// Suppliers
GET    /api/v1/suppliers
POST   /api/v1/suppliers
GET    /api/v1/suppliers/:id
PUT    /api/v1/suppliers/:id
DELETE /api/v1/suppliers/:id
```

**Services: customerService.ts, supplierService.ts**
```typescript
export const customerService = {
  getCustomers: (filters?: CustomerFilters) => Promise<Customer[]>
  createCustomer: (data: CreateCustomerDto) => Promise<Customer>
  getCustomerById: (id: string) => Promise<Customer>
  updateCustomer: (id: string, data: UpdateCustomerDto) => Promise<Customer>
  deleteCustomer: (id: string) => Promise<void>
}

// Similar structure for supplierService
```

---

## User Management APIs

```typescript
// Base URL: /api/v1/users (Protected)

GET    /api/v1/users/profile
PUT    /api/v1/users/profile
POST   /api/v1/users/change-password
GET    /api/v1/users/activity-log
GET    /api/v1/users/devices
DELETE /api/v1/users/devices/:id
```

**Service: userService.ts**
```typescript
export const userService = {
  getProfile: () => Promise<UserProfile>
  updateProfile: (data: UpdateProfileDto) => Promise<UserProfile>
  changePassword: (data: ChangePasswordDto) => Promise<void>
  getActivityLog: (filters?: ActivityFilters) => Promise<Activity[]>
  getDevices: () => Promise<Device[]>
  revokeDevice: (id: string) => Promise<void>
}
```

---

## Common Request/Response Patterns

### Authentication Headers
```typescript
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});
```

### Error Handling
```typescript
const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    toast.error('You do not have permission to perform this action');
  } else {
    toast.error(error.response?.data?.message || 'An error occurred');
  }
};
```

### Pagination
```typescript
interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## Environment Configuration

```typescript
// .env
VITE_API_BASE_URL=http://localhost:3000/api/v1

// Usage in services
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

---

**Note**: All services remain unchanged during the shadcn/ui migration. Only UI components are being migrated from Ant Design to shadcn/ui.
