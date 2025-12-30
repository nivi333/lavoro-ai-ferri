# Ayphen Textile - Complete Migration Task Checklist
## From Ant Design + SCSS to shadcn/ui + Tailwind CSS

**Created:** 2025-12-22  
**Project:** Ayphen Textile Frontend Migration  
**Goal:** Migrate from Ant Design + SCSS to shadcn/ui + Tailwind CSS while maintaining **exact same UI/UX and functionality**

---

## 🎯 CRITICAL UNDERSTANDING & RULES

> [!IMPORTANT]
> **UI/UX PRESERVATION MANDATE**
> - The UI screen data display and UI look must be **EXACTLY** like the current `@frontend`
> - **NO functionality changes** - all features, data display, and interactions remain identical
> - **ALL variables, data, and logic** must work exactly as in `@frontend`
> - Only the UI framework is changing (Ant Design → shadcn/ui, SCSS → Tailwind)
> - **ALL existing backend APIs** must be used without any modifications

> [!WARNING]
> **What is NOT Changing**
> - ❌ Backend API endpoints
> - ❌ Service layer (`/src/services/*`)
> - ❌ Data models and types
> - ❌ Form validation logic (react-hook-form + zod)
> - ❌ Business logic and workflows
> - ❌ Data fetching patterns
> - ❌ Authentication flow

> [!CAUTION]
> **What IS Changing**
> - ✅ UI components (Ant Design → shadcn/ui)
> - ✅ Styling approach (SCSS → Tailwind CSS)
> - ✅ Component structure (maintaining same visual output)
> - ✅ Icon library usage (@ant-design/icons → lucide-react)
> - ✅ Toast notifications (antd message → sonner)

---

## 📋 NOTES TO KEEP IN MIND

1. **Exact Visual Parity Required**
   - Match font sizes, colors, spacing, and alignment exactly
   - Preserve all animations and transitions
   - Maintain responsive breakpoints
   - Keep same loading states and error displays

2. **Data Display Consistency**
   - All tables must show the same columns and data
   - All forms must have the same fields and validation
   - All cards must display the same metrics
   - All charts must render the same data visualizations

3. **Component Behavior**
   - Drawers/Sheets must open/close the same way
   - Modals/Dialogs must have the same triggers
   - Dropdowns must show the same options
   - Buttons must perform the same actions

4. **Theme Consistency**
   - Primary color: `#df005c` (Ayphen Textile brand)
   - Use same color palette for success, warning, error, info
   - Maintain dark/light theme toggle functionality
   - Keep same typography (Poppins for headings, Inter for body)

5. **No Backend Changes**
   - All 22 services remain untouched
   - API integration patterns stay the same
   - Authentication headers unchanged
   - Error handling logic preserved

---

## 📦 PHASE 1: PROJECT SETUP & INITIALIZATION

> [!NOTE]
> **Strategy**: Create brand new `frontend-new` from scratch. Keep `frontend` untouched as reference. Delete `frontend` only at the very end when everything works perfectly.

### 1.1 Initialize New Frontend Project
- [✓] Create `frontend-new` directory structure
- [✓] Copy `package.json` from `frontend` and modify for new stack
- [✓] Copy `.env` and `.env.example` files
- [✓] Copy `vite.config.ts` and update if needed
- [✓] Copy `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- [✓] Copy `index.html`
- [✓] Create basic `src` folder structure

### 1.2 Install Core Dependencies
- [✓] Install React and React DOM
- [✓] Install React Router DOM
- [✓] Install TypeScript
- [✓] Install Vite
- [✓] Install axios (for API calls)
- [✓] Install react-hook-form (form handling)
- [✓] Install zod (validation)
- [✓] Install @hookform/resolvers

### 1.3 Install Tailwind CSS & PostCSS
- [✓] Install `tailwindcss`, `postcss`, `autoprefixer`
- [✓] Run `npx tailwindcss init -p`
- [✓] Configure `tailwind.config.js` with custom theme
- [✓] Create `src/index.css` with Tailwind directives
- [✓] Import Tailwind CSS in `main.tsx`

### 1.4 Install shadcn/ui & Radix UI Primitives
- [✓] Run `npx shadcn-ui@latest init`
- [✓] Install `@radix-ui/react-dialog`
- [✓] Install `@radix-ui/react-dropdown-menu`
- [✓] Install `@radix-ui/react-select`
- [✓] Install `@radix-ui/react-switch`
- [✓] Install `@radix-ui/react-tabs`
- [✓] Install `@radix-ui/react-toast`
- [✓] Install `@radix-ui/react-checkbox`
- [✓] Install `@radix-ui/react-radio-group`
- [✓] Install `@radix-ui/react-slider`
- [✓] Install `@radix-ui/react-avatar`
- [✓] Install `@radix-ui/react-label`
- [✓] Install `@radix-ui/react-separator`
- [✓] Install `@radix-ui/react-alert-dialog`
- [✓] Install `@radix-ui/react-popover`

### 1.5 Install Utility & Chart Libraries
- [✓] Install `class-variance-authority` (CVA for component variants)
- [✓] Install `clsx` (conditional classes)
- [✓] Install `tailwind-merge` (merge Tailwind classes)
- [✓] Install `tailwindcss-animate` (animations)
- [✓] Install `sonner` (toast notifications)
- [✓] Install `recharts` (charts, replacing @ant-design/plots)
- [✓] Install `lucide-react` (icons)
- [✓] Install `date-fns` or `dayjs` (date utilities)

### 1.6 Add shadcn/ui Base Components
- [✓] `npx shadcn-ui@latest add button`
- [✓] `npx shadcn-ui@latest add input`
- [✓] `npx shadcn-ui@latest add select`
- [✓] `npx shadcn-ui@latest add table`
- [✓] `npx shadcn-ui@latest add sheet`
- [✓] `npx shadcn-ui@latest add dialog`
- [✓] `npx shadcn-ui@latest add form`
- [✓] `npx shadcn-ui@latest add card`
- [✓] `npx shadcn-ui@latest add badge`
- [✓] `npx shadcn-ui@latest add avatar`
- [✓] `npx shadcn-ui@latest add dropdown-menu`
- [✓] `npx shadcn-ui@latest add tabs`
- [✓] `npx shadcn-ui@latest add switch`
- [✓] `npx shadcn-ui@latest add checkbox`
- [✓] `npx shadcn-ui@latest add radio-group`
- [✓] `npx shadcn-ui@latest add slider`
- [✓] `npx shadcn-ui@latest add alert-dialog`
- [✓] `npx shadcn-ui@latest add toast`
- [✓] `npx shadcn-ui@latest add label`
- [✓] `npx shadcn-ui@latest add separator`
- [✓] `npx shadcn-ui@latest add skeleton`
- [✓] `npx shadcn-ui@latest add popover`
- [✓] `npx shadcn-ui@latest add calendar`

### 1.7 Adapt Theme Package (`frontend-new/theme`)
- [✓] Update `theme/package.json` - remove Ant Design dependencies
- [✓] Convert theme colors to Tailwind CSS variables
- [✓] Extract spacing values from `base.scss` (--padding-xxs, --padding-xs, etc.)
- [✓] Extract font sizes from `base.scss` (--font-size-xs, --font-size-sm, etc.)
- [✓] Extract border radius values
- [✓] Extract box shadow values
- [✓] Create `theme/src/lib/tailwind-theme.ts` with all theme values
- [✓] Create `theme/src/lib/css-variables.ts` for CSS custom properties
- [✓] Export theme configuration for Tailwind config

### 1.8 Configure Tailwind with Theme Values
- [✓] Import theme from `frontend-new/theme` in `tailwind.config.js`
- [✓] Add primary color (`#df005c`) and variants
- [✓] Add semantic colors (success: `#52c41a`, warning: `#faad14`, error: `#ff4d4f`, info: `#1677ff`)
- [✓] Configure font families (heading: Poppins, body: Inter)
- [✓] Set up font sizes from theme (xs: 10px, sm: 12px, base: 13px, lg: 16px, xl: 20px, 2xl: 24px, 3xl: 30px)
- [✓] Configure spacing scale from theme (xxs: 4px, xs: 8px, base: 16px, lg: 24px, xl: 32px, xxl: 48px)
- [✓] Add border radius values (base: 6px, lg: 8px)
- [✓] Add box shadow values
- [✓] Set up breakpoints for responsive design (sm: 576px, md: 768px, lg: 992px, xl: 1200px, 2xl: 1440px)
- [✓] Configure dark mode with `class` strategy
- [✓] Add custom CSS variables to `index.css`

---

## 🎨 PHASE 2: GLOBAL COMPONENTS & REUSABLE PATTERNS

> [!IMPORTANT]
> **No Hardcoded Values**: All styling must come from `frontend-new/theme`. No hardcoded colors, spacing, or typography values allowed.

> [!NOTE]
> **Screen Layout Pattern** (Standard for all main screens and refer 'frontend screens for reference'):
> - **Line 1**: Page Title (left) + Primary Create Button (right)
> - **Line 2**: Search Bar + Filter + Other Actions (left side)
> - **Line 3**: Table
> - **Outer Padding**: Consistent across all tables screens

### 2.1 Create Global Components File (`/src/components/globalComponents.tsx`)
- [✓] Create `globalComponents.tsx` for all reusable styled components
- [✓] Import theme values from `frontend-new/theme`
- [✓] Use CVA (class-variance-authority) for component variants
- [✓] Export all global components for reuse

### 2.2 Button Components (All Variants in One File)
Create all button variants in `globalComponents.tsx`:
- [✓] **PrimaryButton** - Gradient primary button (matches `.gradient-primary-btn` from base.scss)
  - Background: `linear-gradient(135deg, primary 0%, #c10351 50%, #ab0d4f 100%)`
  - Hover effect with shimmer animation
  - Box shadow with primary color
  
- [✓] **SecondaryButton** - Gradient secondary button (matches `.gradient-secondary-btn`)
  - Background: `linear-gradient(135deg, #ffc53d 0%, warning 50%, warning 100%)`
  - Hover effect with shimmer animation
  
- [✓] **OutlinedButton** - Border only, no background
  - Border color from theme
  - Hover: background fill with primary/10
  
- [✓] **GhostButton** - No border, transparent background
  - Hover: background with primary/10
  
- [✓] **NoBorderButton** - Text only button
  - Underline on hover
  
- [✓] **WhiteBgButton** - White background button
  - Border from theme
  - Hover: slight shadow
  
- [✓] **AlertButton** / **DangerButton** - Destructive action
  - Background: error color from theme
  - Hover: darker error shade
  
- [✓] **IconButton** - Square button for icons only
  - Padding: equal on all sides
  - Hover: background change

### 2.3 Input Components (All Variants)
Create all input variants in `globalComponents.tsx`:
- [✓] **TextInput** - Standard text input
  - Height: 40px (from `.auth-form-input`)
  - Border radius from theme
  - Font size from theme
  
- [✓] **PasswordInput** - Password with toggle visibility
  - Same as TextInput with eye icon
  
- [✓] **SearchInput** - Input with search icon
  - Search icon on left
  - Clear button on right when has value
  
- [✓] **TextArea** - Multi-line text input
  - Resizable
  - Min height from theme
  
- [✓] **NumberInput** - Numeric input with increment/decrement
  - Arrow buttons on right

### 2.4 Select/Dropdown Components
- [ ] **SelectDropdown** - Standard select dropdown
  - Matches input height (40px)
  - Border radius from theme
  
- [ ] **MultiSelect** - Multiple selection dropdown
  - Selected items as badges
  
- [ ] **FilterDropdown** - Dropdown for filtering
  - Icon indicator
  - Clear filter option

### 2.5 Table Components
- [✓] **DataTable** - Standard data table wrapper
  - Border from theme
  - Padding: 10px per cell (from `.ant-table-cell`)
  - Hover row effect
  
- [✓] **TableCard** - Table with card wrapper
  - Card padding from theme
  - Box shadow from theme
  
- [✓] **TableHeader** - Sticky table header
  - Background from theme
  - Font weight: 500
  - White-space: nowrap
  
- [✓] **TableCell** - Standard table cell
  - Padding from theme
  - Text color variants (primary, secondary, success)

### 2.6 Card Components
- [✓] **Card** - Standard card
  - Border radius from theme
  - Box shadow from theme
  - Padding from theme
  
- [✓] **StatsCard** - Card for statistics/metrics
  - Icon + value + label layout
  - Hover effect
  
- [✓] **TableCard** - Card containing a table
  - No inner padding (table fills card)

### 2.7 Layout Components
- [✓] **PageContainer** - Main page wrapper
  - Padding: 24px (from `.app-content`)
  - Min height: 280px
  - Responsive padding (16px on tablet, 12px on mobile)
  
- [✓] **PageHeader** - Standard page header
  - Display: flex
  - Justify: space-between
  - Align: center
  - Margin bottom from theme
  
- [✓] **PageTitle** - H2 heading for pages
  - Font family: Poppins (from theme)
  - Font size from theme
  - Margin: 0
  
- [✓] **ActionBar** - Search + Filter + Actions row
  - Display: flex
  - Gap from theme
  - Align: center
  - Margin bottom from theme

### 2.8 Sheet/Drawer Components
- [✓] **FormSheet** - Sheet for forms (replaces Drawer)
  - Width: 600px
  - Overflow-y: auto
  - Padding from theme
  
- [✓] **SheetHeader** - Sheet header with title
  - Border bottom from theme
  - Padding from theme
  
- [✓] **SheetFooter** - Sheet footer with actions
  - Border top from theme
  - Padding from theme
  - Buttons: Cancel (outlined) + Save (primary)

### 2.9 Dialog/Modal Components
- [✓] **ConfirmDialog** - Confirmation dialog
  - Alert icon
  - Title + description
  - Cancel + Confirm buttons
  
- [✓] **FormDialog** - Dialog for forms
  - Similar to FormSheet but centered
  - Max width from theme

### 2.10 Badge/Tag Components
- [✓] **StatusBadge** - Status indicator
  - Variants: success, warning, error, info, default
  - Colors from theme
  - Border radius from theme
  
- [✓] **CountBadge** - Numeric badge
  - Small, circular
  - Background: primary color

### 2.11 Common UI Elements
- [✓] **EmptyState** - No data placeholder
  - Icon + message
  - Optional action button
  
- [✓] **LoadingSpinner** - Loading indicator
  - Loader2 from lucide-react
  - Animate-spin class
  - Size variants (sm, md, lg)
  
- [✓] **Separator** - Horizontal/vertical divider
  - Margin from theme (5px 0 from `.ant-divider`)
  
- [✓] **Label** - Form label
  - Font weight: 500 (from `.auth-form-label`)
  - Font size: 14px
  - Display: block

### 2.12 Copy Services & Utilities from `frontend`
- [✓] Copy all services from `frontend/src/services/` to `frontend-new/src/services/`
- [✓] Copy all types from `frontend/src/types/` to `frontend-new/src/types/`
- [✓] Copy all utils from `frontend/src/utils/` to `frontend-new/src/utils/`
- [✓] Copy contexts from `frontend/src/contexts/` to `frontend-new/src/contexts/`
- [✓] Copy router from `frontend/src/router/` to `frontend-new/src/router/`
- [✓] Copy config from `frontend/src/config/` to `frontend-new/src/config/`
- [✓] Copy constants from `frontend/src/constants/` to `frontend-new/src/constants/`
- [✓] Copy assets from `frontend/src/assets/` to `frontend-new/src/assets/`

### 2.13 Create Layout Structure
- [✓] Create `MainLayout.tsx` - Main app layout
  - Header (sticky top)
  - Sidebar (collapsible)
  - Main content area
  - No Ant Design Layout components
  
- [✓] Create `Header.tsx` - App header
  - Brand logo (left)
  - User menu + theme toggle (right)
  - Height: 60px
  - Padding: 0 24px (from `.app-header`)
  
- [✓] Create `Sidebar.tsx` - Navigation sidebar
  - Collapsible (width: 64px collapsed, 256px expanded)
  - Menu items with icons
  - Active state highlighting
  - Smooth transition
  
- [✓] Create `ProtectedRoute.tsx` - Auth guard
  - Copy logic from `frontend`
  - Update imports for new components

---

## 📱 PHASE 3: SCREEN MIGRATION (BY PRIORITY)

> [!IMPORTANT]
> **Priority Order Based on Application Flow**
> The priorities below follow the actual user journey and data dependencies:
> 1. **Authentication** - Users must register/login first
> 2. **Company & Location** - Must create company and locations before accessing any other features
> 3. **Dashboard** - Overview screen after company selection
> 4. **Core Master Data** - Products, Customers, Suppliers (foundation for transactions)
> 5. **Operational Modules** - Inventory, Orders, Purchase Orders, Invoices/Bills
> 6. **Supporting Modules** - Quality, Machines, Finance, Reports, Textile Operations
> 7. **Administrative** - User Management, Subscriptions, Legal

### Priority 1: Authentication Screens (`/src/pages/auth/`)

> [!NOTE]
> **Why Priority 1**: Users must be able to register and login before accessing any part of the application.

> [!WARNING]
> **Forgot Password - ON HOLD**: The forgot-password backend implementation is on hold pending email service setup (nodemailer configuration). Frontend is complete and ready for integration when backend is implemented.

- [x] **LoginPage.tsx** ✅ COMPLETE
  - Replace Ant Design Form with shadcn/ui Form
  - Use shadcn/ui Input components
  - Replace message with sonner toast
  - Maintain exact same validation logic
  - Keep same API integration (`authService.login`)
  - [x] API Integration: `POST /api/v1/auth/login` via AuthContext `login()` function
  
- [x] **RegisterPage.tsx** ✅ COMPLETE
  - Replace Ant Design Form with shadcn/ui Form
  - Use shadcn/ui Input components
  - Replace message with sonner toast
  - Keep same validation schema
  - Keep same API integration (`authService.register`)
  - [x] API Integration: `POST /api/v1/auth/register` via AuthContext `register()` function
  
- [x] **ForgotPasswordPage.tsx** ⏸️ FRONTEND READY (Backend on hold)
  - Replace Ant Design Form with shadcn/ui Form
  - Use shadcn/ui Input for email
  - Replace message with sonner toast
  - Keep same API integration (`authService.forgotPassword`)
  - [x] Frontend Integration: Complete via AuthContext `forgotPassword()` function
  - [ ] Backend API: `POST /api/v1/auth/forgot-password` - **ON HOLD** (requires email service setup)

- [x] **Routing & Navigation**
  - [x] Add route to `AppRouter.tsx` (`/login`, `/register`, `/forgot-password`)
  - [x] Verify navigation flow (PublicRoute/ProtectedRoute)


### Priority 2: Company & Location Management (`/src/pages/company/`)

> [!IMPORTANT]
> **Why Priority 2**: After authentication, users MUST create a company + one location before they can access any other features. All data in the application is scoped to a company. Without a company, users cannot:
> - View the dashboard
> - Create products, customers, suppliers
> - Manage inventory, orders, invoices
> - Access any operational features
> 
> **This is the foundation of the entire multi-tenant system.**

- [x] **CompaniesListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`companyService`)
  - [x] **API Integration**: 
    - GET `/api/v1/companies` - List all companies
    - GET `/api/v1/companies/{id}` - Get company details
    - DELETE `/api/v1/companies/{id}` - Delete company
    - POST `/api/v1/companies` - Create company
    - PUT `/api/v1/companies/{id}` - Update company

- [x] **CompanyDetailPage.tsx**
  - Replace Ant Design Descriptions with custom layout
  - Replace Tabs with shadcn/ui Tabs
  - [x] **API Integration**: GET `/api/v1/companies/{id}` - Get detailed company info
 
- [x] **LocationListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`locationService`)
  - [x] **API Integration**: 
    - GET `/api/v1/locations` - List all locations
    - GET `/api/v1/locations/{id}` - Get location details
    - DELETE `/api/v1/locations/{id}` - Delete location

- [x] **Components (`/src/components/location/`)**
  - [x] `LocationFormDrawer.tsx` → use Sheet
    - [x] **API Integration**: 
      - POST `/api/v1/locations` - Create location
      - PUT `/api/v1/locations/{id}` - Update location
  - [x] `LocationTable.tsx` → use Table

- [x] **Routing & Navigation**
  - [x] Add route to `AppRouter.tsx` (`/companies`, `/companies/:tenantId`, `/locations`)
  - [x] Add sidebar link in `Sidebar.tsx` (Locations, Company Details)
  - [x] Verify navigation flow

### Priority 3: User Management & Invitations (`/src/pages/users/`, `/src/components/users/`)

> [!NOTE]
> **Why Priority 3**: User invitation and role management is foundational for multi-tenant collaboration. Users must already exist in the system (registered) before they can be invited to join a company. Must be implemented before any team-based workflows.

> [!IMPORTANT]
> **User Invitation Workflow**:
> 1. User registers in the system (`/auth/register`) - becomes a platform user
> 2. Company Owner/Admin invites existing user by email/phone to join their company
> 3. User receives invitation (stored in `company_invitations` table)
> 4. User accepts/rejects invitation
> 5. Upon acceptance, user-company-role relationship created in `company_users` table
> 6. User can belong to multiple companies with different roles (OWNER, ADMIN, MANAGER, EMPLOYEE)
> 7. User can be invited to multiple companies
> 8. Invited User role will be displayed under company list role tab with Accept/Reject action button
> 9. Only after accepting the invitation, the user will be added to the company and can be assigned a role

- [x] **UsersListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet for user form
  - Show company users with their roles
  - Keep same API integration (`userService`, `companyService`)
  - [x] **API Integration**:
    - GET `/api/v1/users` - List all users in company
    - GET `/api/v1/users/{id}` - Get user details
    - PUT `/api/v1/users/{id}` - Update user profile
    - DELETE `/api/v1/users/{id}` - Remove user from company

- [x] **Components (`/src/components/users/`)**
  - [x] `UserInviteSheet.tsx` → use Sheet
    - Form with email/phone input (must match existing user)
    - Role selection dropdown (ADMIN, MANAGER, EMPLOYEE)
    - Location assignment dropdown
    - Validation for email/phone format
    - [x] **API Integration**:
      - POST `/api/v1/companies/{companyId}/invite` - Send invitation to existing user
  
  - [x] `UserEditSheet.tsx` → use Sheet
    - Edit user profile (name, phone, email)
    - Update user role in company
    - Avatar upload functionality
    - Role change warning and confirmation
    - [x] **API Integration**:
      - PUT `/api/v1/users/{id}` - Update user profile
  
  - [ ] `InvitationAcceptDialog.tsx` → use Dialog
    - Show invitation details (company name, role, location)
    - Accept/Reject buttons
    - [ ] **API Integration**:
      - POST `/api/v1/companies/accept-invitation/{invitationId}` - Accept invitation
      - POST `/api/v1/companies/reject-invitation/{invitationId}` - Reject invitation
  
  - [ ] `PendingInvitationsTable.tsx` → use Table
    - Show pending invitations with email, role, sent date
    - Cancel invitation action
    - Resend invitation action (if needed)

- [ ] **Dashboard Integration**
  - [ ] Add "Invite Team Member" button to Dashboard quick actions
  - [ ] Show pending invitations count badge
  - [ ] Quick action card for team management

- [x] **Routing & Navigation**
  - [x] Add route to `AppRouter.tsx` (`/users`) - Already exists
  - [x] Add export in `src/pages/index.ts`
  - [x] Verify navigation flow

- [ ] **Role-Based Permissions**
  - [ ] Implement role hierarchy: OWNER > ADMIN > MANAGER > EMPLOYEE
  - [ ] OWNER can invite ADMIN, MANAGER, EMPLOYEE
  - [ ] ADMIN can invite MANAGER, EMPLOYEE
  - [ ] MANAGER can invite EMPLOYEE
  - [ ] Role-based UI element visibility
  - [ ] Multi-company role support (user can have different roles in different companies)

### Priority 4: Dashboard (`/src/pages/dashboard/`)

> [!NOTE]
> **Why Priority 4**: After company selection, the dashboard is the first screen users see. It provides overview metrics and navigation to other modules.

- [x] **DashboardPage.tsx** ✅ COMPLETE
  - Replace Ant Design Card with shadcn/ui Card
  - Replace Statistic with custom components
  - Replace Spin with Loader2 from lucide-react
  - Replace @ant-design/plots charts with Recharts
  - Maintain exact same data display
  - Keep same API integration (`analyticsService.getDashboardAnalytics`)
  - [x] **API Integration**: GET `/api/v1/analytics/dashboard`

- [x] **Routing & Navigation**
  - [x] Add route to `AppRouter.tsx` (`/dashboard`)
  - [x] Add sidebar link in `Sidebar.tsx` (Dashboard)
  - [x] Verify navigation flow

### Priority 5: Product Management (`/src/pages/products/`)

> [!NOTE]
> **Why Priority 5**: Products are the foundation for inventory, orders, and all transactions. Must be created before inventory can be tracked.
- [x] **ProductsListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet for product form
  - Replace Modal with AlertDialog for delete confirmation
  - Replace Dropdown with DropdownMenu
  - Keep same columns and data display
  - Keep same API integration (`productService`)
  - [x] **API Integration**: GET `/api/v1/products`, POST, PUT, DELETE

- [x] **Components (`/src/components/products/`)**
  - [x] `ProductFormDrawer.tsx` → use Sheet
    - [x] **API Integration**: POST `/api/v1/products`, PUT `/api/v1/products/{id}`
  - [x] `ProductTable.tsx` → use shadcn/ui Table
  - [x] `ProductFilters.tsx` → use shadcn/ui Select, Input (Integrated in Page)
  - [x] `StockAdjustmentDialog.tsx` (Replaces `StockAdjustmentModal`)
  - [x] `CategoryManager.tsx` → use shadcn/ui components (Integrated in Form)
    - [x] **API Integration**: GET `/api/v1/categories`

- [x] **Routing & Navigation**
  - [x] Add route to `AppRouter.tsx` (`/products`)
  - [x] Add sidebar link in `Sidebar.tsx` (Products)
  - [x] Verify navigation flow

### Priority 6: Customer & Supplier Management (`/src/pages/sales/`, `/src/pages/purchase/`)

> [!NOTE]
> **Why Priority 6**: Customers and suppliers are master data required for creating orders, invoices, bills, and purchase orders.

**Customer Management:**
- [x] **CustomerListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`customerService`)
  - [x] **API Integration**: 
    - GET `/api/v1/customers` - List all customers
    - GET `/api/v1/customers/{id}` - Get customer details
    - DELETE `/api/v1/customers/{id}` - Delete customer

- [x] **Components (`/src/components/sales/`)**
  - [x] `CustomerFormDrawer.tsx` → use Sheet
    - [x] **API Integration**: 
      - POST `/api/v1/customers` - Create customer
      - PUT `/api/v1/customers/{id}` - Update customer

**Supplier Management:**
- [x] **SupplierListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`supplierService`)
  - [x] **API Integration**: 
    - GET `/api/v1/suppliers` - List all suppliers
    - GET `/api/v1/suppliers/{id}` - Get supplier details
    - DELETE `/api/v1/suppliers/{id}` - Delete supplier

- [x] **Components (`/src/components/purchase/`)**
  - [x] `SupplierFormDrawer.tsx` → use Sheet
    - [x] **API Integration**: 
      - POST `/api/v1/suppliers` - Create supplier
      - PUT `/api/v1/suppliers/{id}` - Update supplier
  - [x] `SupplierTable.tsx` → use Table

- [x] **Routing & Navigation**
  - [x] Add route to `AppRouter.tsx` (`/customers`, `/suppliers`)
  - [x] Add sidebar link in `Sidebar.tsx`
  - [x] Verify navigation flow

### Priority 7: Inventory Management (`/src/pages/inventory/`)

> [!NOTE]
> **Why Priority 7**: Inventory tracking requires products and locations to exist first. It's the foundation for order fulfillment.
- [x] **InventoryListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Tabs with shadcn/ui Tabs
  - Replace Tag with Badge for stock status
  - Keep same data display and filters
  - Keep same API integration (`inventoryService`)
  - [x] **API Integration**: 
    - GET `/api/v1/inventory` - List all inventory items
    - GET `/api/v1/inventory/location/{locationId}` - Get inventory by location
    - GET `/api/v1/inventory/alerts` - Get low stock alerts

- [x] **Components (`/src/components/inventory/`)**
  - [x] `InventoryTable.tsx` → use shadcn/ui Table
  - [x] `StockAdjustmentDrawer.tsx` → use Sheet
    - [x] **API Integration**: POST `/api/v1/inventory/adjust` - Adjust stock levels
  - [x] `StockMovementDrawer.tsx` → use Sheet
    - [x] **API Integration**: 
      - POST `/api/v1/inventory/movement` - Create stock movement
      - GET `/api/v1/inventory/movements` - Get movement history
  - [x] `StockReservationDrawer.tsx` → use Sheet
    - [x] **API Integration**: 
      - POST `/api/v1/inventory/reserve` - Reserve stock
      - DELETE `/api/v1/inventory/reserve/{id}` - Release reservation

- [x] **Routing & Navigation**
  - [x] Add route to `AppRouter.tsx` (`/inventory`), `App.tsx`
  - [x] Add sidebar link in `Sidebar.tsx`
  - [x] Verify navigation flow

### Priority 8: Orders Management (`/src/pages/orders/`)

> [!NOTE]
> **Why Priority 8**: Sales orders require products, customers, and inventory to exist. They drive the sales workflow.
- [x] **OrdersListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet for order form
  - Replace Tag with Badge for order status
  - Keep same data display
  - Keep same API integration (`orderService`)
  - [x] **API Integration**: 
    - GET `/api/v1/orders` - List all orders
    - GET `/api/v1/orders/{id}` - Get order details
    - DELETE `/api/v1/orders/{id}` - Delete order

- [x] **Components (`/src/components/orders/`)**
  - [x] `OrderFormSheet.tsx` (replaced `OrderFormDrawer.tsx`)
    - [x] **API Integration**: 
      - POST `/api/v1/orders` - Create new order
      - PUT `/api/v1/orders/{id}` - Update order
      - PATCH `/api/v1/orders/{id}/status` - Update order status
  - [x] `OrderTable.tsx` → integrated into `OrdersListPage.tsx`

- [x] **Routing & Navigation**
  - [x] Add route to `AppRouter.tsx` (`/orders`), `App.tsx`
  - [x] Add sidebar link in `Sidebar.tsx`
  - [x] Verify navigation flow

### Priority 9: Purchase Orders (`/src/pages/purchase/`)

> [!NOTE]
> **Why Priority 9**: Purchase orders require suppliers and products. They drive the procurement workflow.

- [x] **PurchaseOrdersListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`purchaseOrderService`)
  - [x] **API Integration**: 
    - GET `/api/v1/purchase-orders` - List all purchase orders
    - GET `/api/v1/purchase-orders/{id}` - Get PO details
    - DELETE `/api/v1/purchase-orders/{id}` - Delete PO
    - PATCH `/api/v1/purchase-orders/{id}/status` - Update PO status

- [x] **Components (`/src/components/purchase/`)**
  - [x] `PurchaseOrderFormSheet.tsx` (replaced `PurchaseOrderFormDrawer.tsx`)
    - [x] **API Integration**: 
      - POST `/api/v1/purchase-orders` - Create purchase order
      - PUT `/api/v1/purchase-orders/{id}` - Update purchase order
  - [x] `PurchaseOrderTable.tsx` → integrated into `PurchaseOrdersListPage.tsx`

- [x] **Routing & Navigation**
  - [x] Add route to `AppRouter.tsx` (`/purchase/orders`), `App.tsx`
  - [x] Add sidebar link in `Sidebar.tsx`
  - [x] Verify navigation flow

### Priority 10: Invoices & Bills (`/src/pages/invoices/`, `/src/pages/bills/`)

> [!NOTE]
> **Why Priority 10**: Invoices and bills are financial documents that require customers, suppliers, and orders to exist.

- [x] **InvoicesListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`invoiceService`)
  - [x] **API Integration**: 
    - GET `/api/v1/invoices` - List all invoices
    - GET `/api/v1/invoices/{id}` - Get invoice details
    - DELETE `/api/v1/invoices/{id}` - Delete invoice
    - PATCH `/api/v1/invoices/{id}/status` - Update invoice status

- [x] **BillsListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`billService`)
  - [x] **API Integration**: \n    - GET `/api/v1/bills` - List all bills
    - GET `/api/v1/bills/{id}` - Get bill details
    - DELETE `/api/v1/bills/{id}` - Delete bill
    - PATCH `/api/v1/bills/{id}/status` - Update bill status

- [x] **Components**
  - [x] `/src/components/invoices/InvoiceFormSheet.tsx` → use Sheet
    - [x] **API Integration**: 
      - POST `/api/v1/invoices` - Create invoice
      - PUT `/api/v1/invoices/{id}` - Update invoice
  - [x] `/src/components/invoices/InvoiceTable.tsx` → use Table (Integrated in page)
  - [x] `/src/components/bills/BillFormSheet.tsx` → use Sheet
    - [x] **API Integration**: 
      - POST `/api/v1/bills` - Create bill
      - PUT `/api/v1/bills/{id}` - Update bill
  - [x] `/src/components/bills/BillTable.tsx` → use Table (Integrated in page)

- [x] **Routing & Navigation**
  - [x] Add route to `AppRouter.tsx` (`/invoices`, `/bills`), `App.tsx`
  - [x] Add sidebar link in `Sidebar.tsx` (Already exists)
  - [x] Verify navigation flow

### Priority 10: Finance Module (`/src/pages/finance/`)

> [!NOTE]
> **Why Priority 10**: Finance module provides financial overview and expense tracking.

- [ ] **FinanceOverviewPage.tsx**
  - Replace Ant Design Card with shadcn/ui Card
  - Replace charts with Recharts
  - Keep same metrics display
  - [ ] **API Integration**: GET `/api/v1/finance/overview` - Get finance overview metrics

- [ ] **ExpensesPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`expenseService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/expenses` - List all expenses
    - DELETE `/api/v1/expenses/{id}` - Delete expense

- [ ] **AccountsPayablePage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Keep same data display
  - [ ] **API Integration**: GET `/api/v1/finance/accounts-payable` - Get payables

- [ ] **AccountsReceivablePage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Keep same data display
  - [ ] **API Integration**: GET `/api/v1/finance/accounts-receivable` - Get receivables

- [ ] **PettyCashPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`pettyCashService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/petty-cash` - List petty cash transactions
    - DELETE `/api/v1/petty-cash/{id}` - Delete transaction

- [ ] **Components (`/src/components/finance/`)**
  - [ ] `ExpenseFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/expenses` - Create expense
      - PUT `/api/v1/expenses/{id}` - Update expense

- [ ] **Routing & Navigation**
  - [ ] Add route to `AppRouter.tsx` (`/finance`), `App.tsx`
  - [ ] Add sidebar link in `Sidebar.tsx`
  - [ ] Verify navigation flow

### Priority 11: Quality Control (`/src/pages/quality/`)

> [!NOTE]
> **Why Priority 11**: Quality control is important but not required for basic operations.

- [ ] **InspectionsListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same data display
  - Keep same API integration (`inspectionService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/quality/inspections` - List all inspections
    - DELETE `/api/v1/quality/inspections/{id}` - Delete inspection

- [ ] **InspectionDetailsPage.tsx**
  - Replace Ant Design Descriptions with custom layout
  - Replace Timeline with custom component
  - Keep same data display
  - [ ] **API Integration**: GET `/api/v1/quality/inspections/{id}` - Get inspection details

- [ ] **QualityCheckpointsListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Keep same API integration (`qualityService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/quality/checkpoints` - List all checkpoints
    - DELETE `/api/v1/quality/checkpoints/{id}` - Delete checkpoint

- [ ] **QualityDefectsListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Keep same API integration (`qualityService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/quality/defects` - List all defects
    - DELETE `/api/v1/quality/defects/{id}` - Delete defect

- [ ] **ComplianceReportsListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Keep same API integration (`qualityService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/quality/compliance` - List compliance reports
    - DELETE `/api/v1/quality/compliance/{id}` - Delete report

- [ ] **QualityReportsPage.tsx**
  - Replace charts with Recharts
  - Keep same data display
  - [ ] **API Integration**: GET `/api/v1/quality/reports` - Get quality metrics and reports

- [ ] **Components (`/src/components/quality/`)**
  - [ ] `InspectionFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/quality/inspections` - Create inspection
      - PUT `/api/v1/quality/inspections/{id}` - Update inspection
  - [ ] `CheckpointFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/quality/checkpoints` - Create checkpoint
      - PUT `/api/v1/quality/checkpoints/{id}` - Update checkpoint
  - [ ] `DefectFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/quality/defects` - Create defect
      - PUT `/api/v1/quality/defects/{id}` - Update defect
  - [ ] `ComplianceFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/quality/compliance` - Create compliance report
      - PUT `/api/v1/quality/compliance/{id}` - Update compliance report
  - [ ] `InspectionStatusBadge.tsx` → use Badge
  - [ ] `QualityMetricsCard.tsx` → use Card
  - [ ] `DefectChart.tsx` → use Recharts

- [ ] **Routing & Navigation**
  - [ ] Add route to `AppRouter.tsx` (`/quality`), `App.tsx`
  - [ ] Add sidebar link in `Sidebar.tsx`
  - [ ] Verify navigation flow

### Priority 12: Machine Management (`/src/pages/machines/`)

> [!NOTE]
> **Why Priority 12**: Machine management is for tracking equipment and maintenance.

- [ ] **MachineListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Replace Tag with Badge for machine status
  - Keep same API integration (`machineService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/machines` - List all machines
    - GET `/api/v1/machines/{id}` - Get machine details
    - DELETE `/api/v1/machines/{id}` - Delete machine

- [ ] **Components (`/src/components/machines/`)**
  - [ ] `MachineFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/machines` - Create machine
      - PUT `/api/v1/machines/{id}` - Update machine
  - [ ] `BreakdownFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/machines/{id}/breakdown` - Report breakdown
      - GET `/api/v1/machines/{id}/breakdowns` - Get breakdown history
  - [ ] `MaintenanceScheduleDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/machines/{id}/maintenance/schedule` - Schedule maintenance
      - PUT `/api/v1/machines/maintenance/{id}` - Update schedule
  - [ ] `MaintenanceRecordDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/machines/{id}/maintenance/record` - Record maintenance
      - GET `/api/v1/machines/{id}/maintenance` - Get maintenance history
  - [ ] `MachineStatusBadge.tsx` → use Badge
  - [ ] `MachineUtilizationChart.tsx` → use Recharts
    - [ ] **API Integration**: GET `/api/v1/machines/utilization` - Get utilization data

- [ ] **Routing & Navigation**
  - [ ] Add route to `AppRouter.tsx` (`/machines`)
  - [ ] Add sidebar link in `Sidebar.tsx`
  - [ ] Verify navigation flow

### Priority 13: Reports Module (`/src/pages/reports/`)

> [!NOTE]
> **Why Priority 13**: Reports provide analytics and insights after operational data exists.
- [ ] **ReportsPage.tsx**
  - Replace Ant Design Layout with custom layout
  - Replace Tabs with shadcn/ui Tabs

- [ ] **ReportsListPage.tsx**
  - Replace Ant Design Card with shadcn/ui Card
  - Replace Grid with Tailwind grid

- [ ] **ReportCategoryPage.tsx**
  - Replace Ant Design components with shadcn/ui

- [ ] **FinancialReportsPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace DatePicker with shadcn/ui DatePicker
  - Replace charts with Recharts
  - Keep same report generation logic
  - [ ] **API Integration**: 
    - GET `/api/v1/reports/profit-loss` - Profit & Loss report
    - GET `/api/v1/reports/balance-sheet` - Balance Sheet report
    - GET `/api/v1/reports/cash-flow` - Cash Flow report
    - GET `/api/v1/reports/trial-balance` - Trial Balance report
    - GET `/api/v1/reports/gst` - GST report
    - GET `/api/v1/reports/accounts-payable` - Accounts Payable report
    - GET `/api/v1/reports/expense-summary` - Expense Summary report

- [ ] **InventoryReportsPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace charts with Recharts
  - Keep same report generation logic
  - [ ] **API Integration**: 
    - GET `/api/v1/reports/stock-summary` - Stock Summary report
    - GET `/api/v1/reports/stock-aging` - Stock Aging report
    - GET `/api/v1/reports/inventory-valuation` - Inventory Valuation report

- [ ] **OperationalReportsPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace charts with Recharts
  - Keep same report generation logic
  - [ ] **API Integration**: 
    - GET `/api/v1/reports/production-efficiency` - Production Efficiency report
    - GET `/api/v1/reports/machine-utilization` - Machine Utilization report
    - GET `/api/v1/reports/quality-metrics` - Quality Metrics report

- [ ] **SalesReportsPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace charts with Recharts
  - Keep same report generation logic
  - [ ] **API Integration**: 
    - GET `/api/v1/reports/top-selling-products` - Top Selling Products report
    - GET `/api/v1/reports/customer-purchase-history` - Customer Purchase History
    - GET `/api/v1/reports/sales-by-region` - Sales by Region report

- [ ] **Components (`/src/components/reports/`)**
  - [ ] `ReportFilters.tsx` → use shadcn/ui components
  - [ ] `ReportCard.tsx` → use Card
  - [ ] All financial report components → use Table, Recharts
  - [ ] All inventory report components → use Table, Recharts
  - [ ] All operational report components → use Table, Recharts
  - [ ] All sales report components → use Table, Recharts

- [ ] **Routing & Navigation**
  - [ ] Add route to `AppRouter.tsx` (`/reports`)
  - [ ] Add sidebar link in `Sidebar.tsx`
  - [ ] Verify navigation flow

### Priority 14: Textile Operations (`/src/pages/textile/`)

> [!NOTE]
> **Why Priority 14**: Textile-specific operations are industry-specific features.
- [ ] **FabricProductionListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`textileService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/textile/fabric-production` - List fabric production records
    - DELETE `/api/v1/textile/fabric-production/{id}` - Delete record

- [ ] **YarnManufacturingListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`textileService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/textile/yarn-manufacturing` - List yarn manufacturing records
    - DELETE `/api/v1/textile/yarn-manufacturing/{id}` - Delete record

- [ ] **DyeingFinishingListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`textileService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/textile/dyeing-finishing` - List dyeing/finishing records
    - DELETE `/api/v1/textile/dyeing-finishing/{id}` - Delete record

- [ ] **GarmentManufacturingListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Replace Drawer with Sheet
  - Keep same API integration (`textileService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/textile/garment-manufacturing` - List garment manufacturing records
    - DELETE `/api/v1/textile/garment-manufacturing/{id}` - Delete record

- [ ] **DesignPatternsListPage.tsx**
  - Replace Ant Design components with shadcn/ui
  - [ ] **API Integration**: 
    - GET `/api/v1/textile/design-patterns` - List design patterns
    - DELETE `/api/v1/textile/design-patterns/{id}` - Delete pattern

- [ ] **Components (`/src/components/textile/`)**
  - [ ] `FabricProductionFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/textile/fabric-production` - Create record
      - PUT `/api/v1/textile/fabric-production/{id}` - Update record
  - [ ] `YarnManufacturingFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/textile/yarn-manufacturing` - Create record
      - PUT `/api/v1/textile/yarn-manufacturing/{id}` - Update record
  - [ ] `DyeingFinishingFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/textile/dyeing-finishing` - Create record
      - PUT `/api/v1/textile/dyeing-finishing/{id}` - Update record
  - [ ] `GarmentManufacturingFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/textile/garment-manufacturing` - Create record
      - PUT `/api/v1/textile/garment-manufacturing/{id}` - Update record
  - [ ] `DesignPatternFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/textile/design-patterns` - Create pattern
      - PUT `/api/v1/textile/design-patterns/{id}` - Update pattern
  - [ ] All table components → use shadcn/ui Table
  - [ ] All chart components → use Recharts

- [ ] **Routing & Navigation**
  - [ ] Add route to `AppRouter.tsx` (`/textile`)
  - [ ] Add sidebar link in `Sidebar.tsx`
  - [ ] Verify navigation flow

### Priority 15: User Management (`/src/pages/users/`)

> [!NOTE]
> **Why Priority 15**: User management is administrative and not required for core operations.
- [ ] **UsersListPage.tsx**
  - Replace Ant Design Table with shadcn/ui Table
  - Keep same API integration (`userService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/users` - List all users
    - GET `/api/v1/users/{id}` - Get user details
    - DELETE `/api/v1/users/{id}` - Delete user
    - PATCH `/api/v1/users/{id}/status` - Update user status

- [ ] **UserProfilePage.tsx**
  - Replace Ant Design Form with shadcn/ui Form
  - Replace Tabs with shadcn/ui Tabs
  - Keep same API integration (`userService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/users/profile` - Get current user profile
    - PUT `/api/v1/users/profile` - Update profile
    - PUT `/api/v1/users/change-password` - Change password

- [ ] **Components (`/src/components/users/`)**
  - [ ] `UserFormDrawer.tsx` → use Sheet
    - [ ] **API Integration**: 
      - POST `/api/v1/users` - Create user
      - PUT `/api/v1/users/{id}` - Update user
  - [ ] `UserActivityLog.tsx` → use Table
    - [ ] **API Integration**: GET `/api/v1/users/{id}/activity` - Get activity log
  - [ ] `UserDevicesList.tsx` → use Table
    - [ ] **API Integration**: GET `/api/v1/users/{id}/devices` - Get user devices

- [ ] **Routing & Navigation**
  - [ ] Add route to `AppRouter.tsx` (`/users`)
  - [ ] Add sidebar link in `Sidebar.tsx`
  - [ ] Verify navigation flow

### Priority 16: Subscription Management (`/src/pages/subscription/`)

> [!NOTE]
> **Why Priority 16**: Subscription management is for billing and plan management.
- [ ] **SubscriptionPlansPage.tsx**
  - Replace Ant Design Card with shadcn/ui Card
  - Replace Modal with Dialog
  - Keep same API integration (`subscriptionService`)
  - [ ] **API Integration**: 
    - GET `/api/v1/subscriptions/plans` - List subscription plans
    - GET `/api/v1/subscriptions/current` - Get current subscription
    - POST `/api/v1/subscriptions/subscribe` - Subscribe to plan
    - POST `/api/v1/subscriptions/cancel` - Cancel subscription
    - POST `/api/v1/subscriptions/upgrade` - Upgrade subscription

- [ ] **Components (`/src/components/subscription/`)**
  - [ ] `SubscriptionPlanCard.tsx` → use Card

- [ ] **Routing & Navigation**
  - [ ] Add route to `AppRouter.tsx` (`/subscriptions`)
  - [ ] Add sidebar link in `Sidebar.tsx`
  - [ ] Verify navigation flow

### Priority 17: Legal Pages (`/src/pages/legal/`)

> [!NOTE]
> **Why Priority 17**: Legal pages are static content pages, lowest priority for migration.
- [ ] **LegalPage.tsx**
  - Replace Ant Design Tabs with shadcn/ui Tabs
  - Use Tailwind for content styling

- [ ] **Routing & Navigation**
  - [ ] Add route to `AppRouter.tsx` (`/legal`)
  - [ ] Add sidebar link in `Sidebar.tsx`
  - [ ] Verify navigation flow

---

## 🔧 PHASE 4: UTILITY & HELPER UPDATES

### 4.1 Utility Functions
- [ ] Create `/src/lib/utils.ts` with `cn()` function for class merging
- [ ] Update any SCSS utility classes to Tailwind utilities
- [ ] Create custom Tailwind utility classes if needed

### 4.2 Toast Notifications
- [ ] Replace all `message.success()` with `toast.success()`
- [ ] Replace all `message.error()` with `toast.error()`
- [ ] Replace all `message.warning()` with `toast.warning()`
- [ ] Replace all `message.info()` with `toast.info()`
- [ ] Replace all `notification.*` with sonner toast
- [ ] Add `<Toaster />` to `App.tsx`

### 4.3 Icon Updates
- [ ] Replace all `@ant-design/icons` imports with `lucide-react`
- [ ] Map Ant Design icons to lucide-react equivalents
- [ ] Update icon sizes and styling to match current design

---

## 📊 PHASE 5: CHARTS & DATA VISUALIZATION

### 5.1 Replace @ant-design/plots with Recharts
- [ ] Migrate all Line charts to Recharts
- [ ] Migrate all Bar charts to Recharts
- [ ] Migrate all Pie charts to Recharts
- [ ] Migrate all Area charts to Recharts
- [ ] Migrate all Column charts to Recharts
- [ ] Ensure exact same data visualization and colors
- [ ] Maintain same chart interactions and tooltips

---

## ✅ PHASE 6: TESTING & VERIFICATION

### 6.1 Build & Compilation
- [ ] Run `npm run build` - ensure no errors
- [ ] Fix all TypeScript errors
- [ ] Fix all ESLint warnings
- [ ] Verify all imports are correct

### 6.2 Functional Testing
- [ ] Test all authentication flows (login, register, forgot password)
- [ ] Test all CRUD operations (create, read, update, delete)
- [ ] Test all forms and validation
- [ ] Test all tables and pagination
- [ ] Test all drawers/sheets and modals/dialogs
- [ ] Test all dropdowns and select components
- [ ] Test all date pickers and filters
- [ ] Test all charts and data visualizations
- [ ] Test all toast notifications
- [ ] Test theme toggle (light/dark mode)

### 6.3 API Integration Testing
- [ ] Verify all API calls work correctly
- [ ] Test authentication headers
- [ ] Test error handling
- [ ] Test loading states
- [ ] Test data fetching and display
- [ ] Test form submissions
- [ ] Test file uploads (if any)

### 6.4 Visual Regression Testing
- [ ] Compare each screen with original Ant Design version
- [ ] Verify exact same layout and spacing
- [ ] Verify exact same colors and typography
- [ ] Verify exact same responsive behavior
- [ ] Verify exact same animations and transitions

### 6.5 Responsive Design Testing
- [ ] Test on mobile (320px, 375px, 414px)
- [ ] Test on tablet (768px, 1024px)
- [ ] Test on desktop (1280px, 1440px, 1920px)
- [ ] Verify all components are responsive
- [ ] Verify no layout breaks

### 6.6 Browser Compatibility Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Verify consistent behavior across browsers

---

## 🚀 PHASE 7: FINAL CLEANUP & MIGRATION COMPLETION

> [!WARNING]
> **Only proceed with this phase after ALL testing is complete and frontend-new is working perfectly!**

### 7.1 Final Verification Before Cleanup
- [ ] All screens working in `frontend-new`
- [ ] All API integrations tested and working
- [ ] All forms submitting correctly
- [ ] All data displaying correctly
- [ ] Theme toggle working
- [ ] Responsive design verified
- [ ] Browser compatibility confirmed
- [ ] Performance benchmarks met or exceeded

### 7.2 Backup Current Frontend
- [ ] Create backup of `frontend` folder (zip or git tag)
- [ ] Document current state
- [ ] Save any custom configurations

### 7.3 Delete Old Frontend & Dependencies
- [ ] Delete entire `frontend` folder
- [ ] Rename `frontend-new` to `frontend`
- [ ] Update root `package.json` if needed
- [ ] Update any scripts that reference frontend path
- [ ] Update `.gitignore` if needed

### 7.4 Clean Up Unused Packages (from new frontend)
- [ ] Uninstall `antd` if accidentally installed
- [ ] Uninstall `@ant-design/icons` if accidentally installed
- [ ] Uninstall `@ant-design/plots` if accidentally installed
- [ ] Uninstall `sass` if accidentally installed
- [ ] Run `npm prune` to remove unused dependencies
- [ ] Run `npm audit fix` to fix security issues

### 7.5 Performance Optimization
- [ ] Optimize bundle size
- [ ] Lazy load components where appropriate
- [ ] Optimize images and assets
- [ ] Minimize re-renders
- [ ] Optimize API calls
- [ ] Enable code splitting
- [ ] Add compression

### 7.6 Documentation
- [ ] Update README with new tech stack
- [ ] Document new component usage patterns
- [ ] Document Tailwind configuration
- [ ] Document global components in `globalComponents.tsx`
- [ ] Create migration notes for team
- [ ] Update deployment documentation
- [ ] Document theme customization

### 7.7 Final Code Cleanup
- [ ] Remove all commented-out code
- [ ] Format all files with Prettier
- [ ] Run ESLint and fix all warnings
- [ ] Remove unused imports
- [ ] Remove console.logs
- [ ] Verify no hardcoded values (all from theme)

---

## 📚 REFERENCE INFORMATION

### Packages to Install (in frontend-new)
```bash
# Core
npm install react react-dom react-router-dom
npm install typescript vite @vitejs/plugin-react
npm install axios react-hook-form zod @hookform/resolvers

# Tailwind CSS
npm install tailwindcss postcss autoprefixer
npm install tailwindcss-animate

# shadcn/ui & Radix UI
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-switch
npm install @radix-ui/react-tabs @radix-ui/react-toast
npm install @radix-ui/react-checkbox @radix-ui/react-radio-group
npm install @radix-ui/react-slider @radix-ui/react-avatar
npm install @radix-ui/react-label @radix-ui/react-separator
npm install @radix-ui/react-alert-dialog @radix-ui/react-popover

# Utilities
npm install class-variance-authority clsx tailwind-merge
npm install sonner recharts lucide-react date-fns
```

### Packages to Uninstall (ONLY in Phase 7, after everything works)
```bash
# These should NOT be in frontend-new at all
npm uninstall antd @ant-design/icons @ant-design/plots sass
```

### Backend Services (DO NOT MODIFY)
All services in `/src/services/` remain unchanged:
1. `analyticsService.ts`
2. `billService.ts`
3. `companyService.ts`
4. `customerService.ts`
5. `expenseService.ts`
6. `inspectionService.ts`
7. `inventoryService.ts`
8. `invoiceService.ts`
9. `locationService.ts`
10. `machineService.ts`
11. `orderService.ts`
12. `paymentService.ts`
13. `pettyCashService.ts`
14. `productService.ts`
15. `purchaseOrderService.ts`
16. `qualityService.ts`
17. `reportService.ts`
18. `subscriptionService.ts`
19. `supplierService.ts`
20. `textileService.ts`
21. `userService.ts`
22. `authService.ts` (in `/src/services/auth/`)

### Component Migration Map
| Ant Design | shadcn/ui | Notes |
|-----------|-----------|-------|
| `Button` | `Button` | Use variants: default, destructive, outline, ghost |
| `Input` | `Input` | Direct replacement |
| `Input.Password` | `Input type="password"` | Add eye icon manually if needed |
| `Select` | `Select` | Use with SelectTrigger, SelectContent, SelectItem |
| `Table` | `Table` | Use with TableHeader, TableBody, TableRow, TableCell |
| `Drawer` | `Sheet` | Use with SheetTrigger, SheetContent, SheetHeader |
| `Modal` | `Dialog` | Use with DialogTrigger, DialogContent, DialogHeader |
| `Modal.confirm` | `AlertDialog` | Use AlertDialog for confirmations |
| `message` | `toast` (sonner) | Use sonner for notifications |
| `notification` | `toast` (sonner) | Use sonner with description |
| `Form` | `Form` (react-hook-form) | Already using react-hook-form |
| `Card` | `Card` | Use with CardHeader, CardContent, CardFooter |
| `Tag` | `Badge` | Use variants for different colors |
| `Tabs` | `Tabs` | Use with TabsList, TabsTrigger, TabsContent |
| `Switch` | `Switch` | Direct replacement |
| `Checkbox` | `Checkbox` | Direct replacement |
| `Radio` | `RadioGroup` | Use with RadioGroupItem |
| `Slider` | `Slider` | Direct replacement |
| `Avatar` | `Avatar` | Use with AvatarImage, AvatarFallback |
| `Dropdown` | `DropdownMenu` | Use with DropdownMenuTrigger, DropdownMenuContent |
| `DatePicker` | `Calendar` + `Popover` | Combine for date picker functionality |
| `Spin` | `Loader2` (lucide-react) | Use with `animate-spin` class |
| `Empty` | Custom `EmptyState` | Create custom component |
| `Descriptions` | Custom layout | Use Tailwind grid/flex |
| `Timeline` | Custom component | Create with Tailwind |

### Icon Migration Map
| Ant Design Icon | lucide-react Icon |
|----------------|-------------------|
| `PlusOutlined` | `Plus` |
| `EditOutlined` | `Edit` |
| `DeleteOutlined` | `Trash2` |
| `SearchOutlined` | `Search` |
| `FilterOutlined` | `Filter` |
| `DownloadOutlined` | `Download` |
| `UploadOutlined` | `Upload` |
| `CloseOutlined` | `X` |
| `CheckOutlined` | `Check` |
| `MoreOutlined` | `MoreHorizontal` or `MoreVertical` |
| `EyeOutlined` | `Eye` |
| `EyeInvisibleOutlined` | `EyeOff` |
| `UserOutlined` | `User` |
| `SettingOutlined` | `Settings` |
| `LogoutOutlined` | `LogOut` |
| `DashboardOutlined` | `LayoutDashboard` |
| `ShoppingCartOutlined` | `ShoppingCart` |
| `DollarOutlined` | `DollarSign` |
| `RiseOutlined` | `TrendingUp` |
| `FallOutlined` | `TrendingDown` |
| `TeamOutlined` | `Users` |
| `FileTextOutlined` | `FileText` |
| `CalendarOutlined` | `Calendar` |
| `ClockCircleOutlined` | `Clock` |
| `ExclamationCircleOutlined` | `AlertCircle` |
| `InfoCircleOutlined` | `Info` |
| `CheckCircleOutlined` | `CheckCircle` |
| `CloseCircleOutlined` | `XCircle` |

### Theme Values from base.scss
```scss
// Spacing
--padding-xxs: 4px
--padding-xs: 8px
--padding: 16px
--padding-lg: 24px
--padding-xl: 32px

// Font Sizes
--font-size-xs: 10px
--font-size-sm: 12px
--font-size-base: 13px
--font-size-lg: 16px
--font-size-xl: 20px
--font-size-2xl: 24px
--font-size-3xl: 30px

// Border Radius
--border-radius-base: 6px
--border-radius-lg: 8px

// Box Shadows
--box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)
--box-shadow-secondary: 0 2px 8px rgba(0, 0, 0, 0.06)

// Colors (from theme)
Primary: #df005c
Success: #52c41a
Warning: #faad14
Error: #ff4d4f
Info: #1677ff
```

---

## 🎯 SUCCESS CRITERIA

✅ **Migration is complete when:**

1. **`frontend-new` is fully functional**
   - All 43 pages working correctly
   - All forms submitting and validating
   - All tables displaying data
   - All charts rendering

2. **Visual parity achieved**
   - UI looks exactly like `frontend`
   - Same colors, spacing, typography
   - Same responsive behavior
   - Same animations and transitions

3. **Functionality preserved**
   - All features work identically
   - All API integrations working
   - All data displaying correctly
   - All user flows functioning

4. **Technical requirements met**
   - No Ant Design dependencies in `frontend-new`
   - No SCSS files in `frontend-new`
   - All styling from `frontend-new/theme`
   - No hardcoded values
   - Global components reused everywhere

5. **Testing complete**
   - Build completes without errors
   - All TypeScript errors fixed
   - All ESLint warnings resolved
   - Browser compatibility verified
   - Responsive design tested

6. **Performance acceptable**
   - Bundle size equal or smaller
   - Load time equal or faster
   - No performance regressions

7. **Documentation updated**
   - README reflects new stack
   - Component usage documented
   - Theme customization documented

8. **Ready for production**
   - All tests passing
   - No console errors
   - No console warnings
   - Production build successful

9. **Old frontend deleted**
   - `frontend` folder removed
   - `frontend-new` renamed to `frontend`
   - Unused packages uninstalled

10. **Team ready**
    - Migration notes created
    - Team trained on new components
    - Development workflow documented

---

**Last Updated:** 2025-12-22  
**Status:** Ready to begin migration  
**Approach:** Create new `frontend-new` from scratch, keep `frontend` as reference, delete old only at the end  
**Estimated Effort:** 100-150 hours (depending on team size)
