# 🏭 EPIC: Multi-Tenant Textile Manufacturing ERP System
## Lavoro AI Ferri - Functional Specification Document

---

## 💻 Technology Stack & Languages

### **Backend**
- [ ] **Language**: TypeScript (Node.js)
- [ ] **Framework**: Express.js
- [ ] **Database**: PostgreSQL with Prisma ORM
- [ ] **Authentication**: JWT (JSON Web Tokens) - 3 days expiration
- [ ] **Caching**: Redis (Docker containerized)
- [ ] **API Documentation**: Swagger/OpenAPI

### **Frontend**
- [ ] **Language**: TypeScript
- [ ] **Framework**: React.js with Vite
- [ ] **UI Library**: Ant Design + Sass/SCSS
- [ ] **State Management**: React Context API + localStorage
- [ ] **Form Handling**: Ant Design Form
- [ ] **Routing**: React Router v6
- [ ] **API State**: React Query (optional, for caching)

### **DevOps & Infrastructure**
- [ ] **Containerization**: Docker + Docker Compose
- [ ] **Orchestration**: Kubernetes
- [ ] **CI/CD**: GitHub Actions
- [ ] **Testing**: Jest (Unit), Supertest (API), Playwright (E2E planned)

---

## 🎨 DESIGN SYSTEM & UI GUIDELINES

### **Color Palette**
- [ ] **Primary**: #7b5fc9 (Purple) - Main brand color for buttons, links, active states
- [ ] **Secondary**: #a2d8e5 (Light Blue) - Accent color for badges, highlights
- [ ] **Success**: #52c41a (Green) - Success states, active status
- [ ] **Error**: #ff4d4f (Red) - Error states, inactive status
- [ ] **Warning**: #faad14 (Orange) - Warning states, pending actions
- [ ] **Background**: #f5f5f5 (Light Gray) - Page backgrounds
- [ ] **Surface**: #ffffff (White) - Card backgrounds, modals

### **Typography**
- [ ] **Headings**: Poppins (600 weight)
- [ ] **Body Text**: Inter (400/500 weight)
- [ ] **Buttons**: Inter (500 weight)

### **UI/UX Standards**
- [ ] **Logo Placement**: Always top-left corner on all authenticated screens, clickable to dashboard
- [ ] **Reuse Components**: Always use existing components before creating new ones
- [ ] **SCSS Only**: No inline styles, use theme variables
- [ ] **Naming Conventions**: Follow existing patterns consistently
- [ ] **Button Sizes**: Medium/small only, no large buttons
- [ ] **Responsive Design**: Mobile-first with breakpoints at 768px, 1024px
- [ ] **Accessibility**: WCAG 2.1 AA compliance

### **Form Guidelines**
- [ ] **< 5 fields**: Modal
- [ ] **5-20 fields**: Drawer component
- [ ] **> 20 fields**: Separate screen/wizard
- [ ] **Action Buttons**: Cancel & Save always at bottom
- [ ] **Consistent Placement**: Same button order across all forms

### **Table Guidelines**
- [ ] **Actions**: Multiple actions in "More" menu (three dots icon)
- [ ] **Icons**: Ant Design icons only
- [ ] **Pagination**: Standard pagination (10, 25, 50, 100 per page)
- [ ] **Empty States**: Ant Design Empty component with clear call-to-action

### **Active Toggle Pattern**
- [✅] **All Form Drawers**: Must include Active toggle in header (top-right position)
- [✅] **Create Mode**: Default isActive: true, toggle disabled
- [✅] **Edit Mode**: Toggle enabled, reflects current status
- [✅] **Table Display**: Active status column with Green (Active) / Red (Inactive) tags

---

## 📋 Project Development Standards

### **UI/UX Standards**
- [ ] Reuse existing components  
- [ ] Follow theme variables (primary: #7b5fc9, accent: #a2d8e5)
- [ ] SCSS only, no inline styles
- [ ] Follow existing naming conventions
- [ ] Match current code structure and patterns
- [ ] Logo always top-left
- [ ] Buttons: medium/small only
- [ ] Forms: 5-20 fields = drawer, <5 = modal, >20 = page
- [ ] **MainLayout Requirement**: ALL post-company-selection screens MUST be wrapped in MainLayout component to display sidebar and header
- [ ] **Sidebar Configuration**: All screens must be added to sidebar navigation in navigationConfig.ts

### **Multi-Tenant Security & Data Isolation (CRITICAL)**
- [ ] **MANDATORY**: Every API endpoint and service method MUST filter data by company_id (tenantId)
- [ ] **Backend Services**: All get*, create*, update*, delete* methods MUST accept companyId as first parameter
- [ ] **Controllers**: All protected routes MUST use req.tenantId from JWT token for company context
- [ ] **Database Queries**: ALL queries MUST include where: { company_id: companyId } filter
- [ ] **Role-Based Access**: Combine company filtering with role checks using requireRole middleware
- [ ] **Frontend**: All API calls post-company-selection MUST include company context from auth token
- [ ] **No Cross-Tenant Data Leaks**: Users can ONLY see/modify data from companies they have access to
- [ ] **ID Generation**: Use globally unique IDs but always filter by company when querying
- [ ] **Audit Trail**: Log all company-scoped operations with userId, tenantId, and action

### **API Design Patterns**
- [ ] **Company Context**: Use current company from JWT (req.tenantId) instead of URL params
- [ ] **Error Messages**: Provide specific, actionable error messages
- [ ] **Validation**: Check company context before role permissions in middleware chain
- [ ] **Naming Convention**: Backend uses snake_case, Frontend uses camelCase, Service layer converts between them

### **Component Patterns**
- [ ] Find and read the EXACT reference component before making changes
- [ ] Copy the EXACT structure - same imports, same layout, same styling approach
- [ ] Copy the EXACT CSS approach - reuse existing SCSS, no new files unless necessary
- [ ] Copy the EXACT button/action pattern - same buttons, same positioning
- [ ] Only change field names and labels - nothing else
- [ ] Do NOT create new files or new CSS for existing styles, reuse className

---

## 🏗️ FUNCTIONAL MODULES (Organized by Priority)

### **PRIORITY 1: Core Foundation (COMPLETED ✅)**

#### **1.1 Authentication & User Management** ✅

**User Registration** ✅
- [✅] Single-screen registration form
- [✅] Fields: First Name, Last Name, Email/Phone (single field with smart validation), Password, Confirm Password
- [✅] Email/Phone validation with country code support (+1, +91, etc.)
- [✅] Password strength validation (8+ chars, uppercase, lowercase, number)
- [✅] Terms & Conditions checkbox required
- [✅] Global email/phone uniqueness (one email = one user across all companies)
- [✅] Users can belong to multiple companies with different roles

**User Login** ✅
- [✅] Email or Phone login (single field)
- [✅] Password field with show/hide toggle
- [✅] Remember me functionality (stores email/phone in localStorage)
- [✅] JWT token generation (3 days expiration)
- [✅] Automatic token refresh mechanism
- [✅] Session management with device tracking

**Password Management** ✅
- [✅] Forgot password flow with email/SMS
- [✅] Password reset with token validation
- [✅] Password change for authenticated users
- [✅] Password strength indicator with visual requirements checklist

**User Profile Management (Simplified UI Screen)** ✅

**Profile Screen Layout**
- [✅] **Access**: Sidebar dropdown menu → "My Profile" or /profile route
- [✅] **Layout**: Full page with MainLayout (sidebar + header)
- [✅] **Sections**: Single page layout without tabs (Activity Log removed per user request)

**Profile Information** ✅
- [✅] **Profile Header**:
  - [✅] Large circular avatar (120px) with camera icon overlay for upload
  - [✅] User full name (H2 heading)
  - [✅] User email display
  - [✅] Edit Profile button (GradientButton)

- [✅] **Personal Information Section** (Card):
  - [✅] First Name: Text input (required, max 50 chars)
  - [✅] Last Name: Text input (required, max 50 chars)
  - [✅] Email: Email input (required, validated, unique, disabled)
  - [✅] Phone: Phone input with validation (optional)

- [✅] **Avatar Upload**:
  - [✅] Click to browse upload
  - [✅] Image preview in circular avatar
  - [✅] File size limit: 2MB
  - [✅] Accepted formats: JPG, PNG, WEBP
  - [✅] Fallback to initials

- [✅] **Action Buttons**:
  - [✅] Save Changes (primary button)
  - [✅] Cancel (secondary button)
  - [✅] Edit/Cancel Edit toggle

**Security Settings** ✅
- [✅] **Password Management Section**:
  - [✅] Change Password button (navigates to password change page)

- [✅] **Two-Factor Authentication Section** (Card):
  - [✅] 2FA Status: Enabled/Disabled with toggle switch
  - [✅] Description text

- [✅] **Email Notifications Section** (Card):
  - [✅] Email notifications toggle switch
  - [✅] Description text

**Activity Log** - REMOVED (per user request)

**Preferences** - FUTURE ENHANCEMENT

**Profile Update Validation** ✅
- [✅] Email uniqueness check across system
- [✅] Phone number format validation
- [✅] Required field validation with inline error messages
- [✅] Success message on save: "Profile updated successfully"
- [✅] Error handling with specific error messages

**Profile Access Control** ✅
- [✅] All users can view and edit their own profile
- [✅] OWNER/ADMIN can view other users' profiles (read-only)
- [✅] Password change requires current password verification
- [✅] 2FA setup requires password confirmation
- [✅] Session revocation requires confirmation modal

**Role-Based Access Control** ✅
- [✅] Roles: OWNER, ADMIN, MANAGER, EMPLOYEE
- [✅] OWNER: Full access to all features, company settings, user management
- [✅] ADMIN: All features except company deletion, can manage users and settings
- [✅] MANAGER: Operational features, limited user management
- [✅] EMPLOYEE: Basic operational features, no user management or settings
- [✅] Role-specific sidebar menu (EMPLOYEE cannot see Users or Invite User)

#### **1.2 Company Management (Multi-Tenant)** ✅

**Company Creation** ✅
- [✅] Drawer-based form (not separate page)
- [✅] Section 1 - Basic Information:
  - [✅] Company Logo: Upload with base64 encoding (2MB limit, JPG/PNG only)
  - [✅] Company Name: Required, unique
  - [✅] Company Slug: Auto-generated from name with "lavoro.ai/" prefix, editable, unique validation
  - [✅] Industry: Dropdown with 10 options (Textile Manufacturing, Garment Production, etc.)
  - [✅] Description: Optional text area
  - [✅] Country: Global CountrySelect component
  - [✅] Default Location Name: Custom name for head office
- [✅] Section 2 - Head Office Location:
  - [✅] Address Line 1, Address Line 2, City, State, Pincode
  - [✅] Automatically becomes headquarters AND default location
- [✅] Section 3 - Business Details:
  - [✅] Established Date: DatePicker
  - [✅] Business Type: Dropdown
  - [✅] Certifications: Multi-select
- [✅] Section 4 - Contact Information:
  - [✅] Phone, Email (with validation), Website, Tax ID
- [✅] User automatically becomes OWNER with full permissions
- [✅] Immediate tenant schema creation for data isolation
- [✅] Default location used in invoices, bills, POs, financial documents

**Company Selection** ✅
- [✅] Header: Logo (top-left) + Create Company + Logout (top-right)
- [✅] Tab System: "Owner" | "Roles" tabs
- [✅] Single-line list items (not cards) with company info
- [✅] Role Badges: OWNER (Blue), ADMIN (Purple), MANAGER (Green), EMPLOYEE (Orange)
- [✅] Industry type display
- [✅] Pending Invitations: Show with "Accept" button, status badge
- [✅] Empty state with Ant Design Empty component
- [✅] Click anywhere on row → Switch context → Dashboard

**Company Switching** ✅
- [✅] Switch company context with JWT token regeneration
- [✅] Maintains user session across companies
- [✅] Updates all API calls with new company context
- [✅] Redirects to dashboard after switch

**User Invitation System** ✅
- [✅] Simple modal with 2 fields only:
  - [✅] Email/Phone: Single field supporting both formats
  - [✅] Role: ADMIN, MANAGER, EMPLOYEE (no OWNER invites)
  - [✅] Location: Optional location assignment
- [✅] Creates pending invitation (not direct membership)
- [✅] Validates user exists before creating invitation
- [✅] Prevents duplicate invitations
- [✅] Invitation Flow: Invite → Create Invitation → User Accepts → Add to Company
- [✅] JWT Token: 3 days expiration (not 1 hour)
- [✅] Active Toggle: In drawer header (disabled on create, enabled on edit, default true)

#### **1.3 Location Management** ✅

**Location Creation/Edit** ✅
- [✅] Drawer-based form (720px width)
- [✅] Section 1 - Basic Information:
  - [✅] Location Name: Custom name, required, unique within company
  - [✅] Location Type: Headquarters, Branch, Warehouse, Factory
  - [✅] Location Image: Drag & drop upload with cropping (2MB limit)
  - [✅] Description: Optional
- [✅] Section 2 - Address Details:
  - [✅] Country (Global CountrySelect), Address Line 1, Address Line 2, City, State, Pincode (all required except Address Line 2)
- [✅] Section 3 - Contact Information:
  - [✅] Email (optional, with validation), Phone (with country code), Website
- [✅] Section 4 - Settings (OWNER/ADMIN only):
  - [✅] Is Default: Toggle (only one per company, used in financial documents)
  - [✅] Is Headquarters: Toggle (only one per company)
  - [✅] Is Active: Toggle (in header, disabled on create, enabled on edit, default true)
  - [✅] Auto-toggle Logic: Setting new Default/HQ automatically unsets previous ones
- [✅] First location automatically becomes default + headquarters
- [✅] Cannot delete or deactivate default/headquarters location

**Location List** ✅
- [✅] Professional table layout with columns:
  - [✅] Location Image: Circular (40px) with fallback to building icon
  - [✅] Location Name: Primary display with type badge
  - [✅] Address: Formatted (City, State, Country)
  - [✅] Type: Badge (Headquarters, Branch, Warehouse, Factory) with color coding
  - [✅] Status: Default (green star), Headquarters (blue crown), Active/Inactive
  - [✅] User Count: Number of users assigned
  - [✅] Financial Usage: Document count (invoices, bills, POs)
  - [✅] Last Updated: Formatted timestamp
  - [✅] Actions: More menu (Edit, View Details, Set as Default, Set as HQ, Deactivate)
- [✅] Filters: Search, Type, Status, Country, State
- [✅] Bulk Actions: Status change, type change, delete (except HQ)
- [✅] Pagination: 10, 25, 50, 100 per page

---

### **PRIORITY 2: Core Operations (IN PROGRESS 🔄)**

#### **2.0 Customer & Supplier Management**

**2.0.1 Customer Management (Detailed)** ✅ **COMPLETED**

**Customer Drawer/Screen** ✅
- [✅] **Form Type**: Drawer (5-20 fields) with Active toggle in header
- [✅] **Auto-Generated Code**: CUST-001, CUST-002, etc. (backend generated)
- [✅] **Create Mode**: Active toggle disabled, default isActive: true
- [✅] **Edit Mode**: Active toggle enabled, reflects current status

**Form Fields - Customer**:
- [✅] **Customer Code**: Auto-generated (e.g., CUST001) - Display only
- [✅] **Customer Name**: Text input (required, max 100 chars)
- [✅] **Customer Type**: Dropdown - INDIVIDUAL, BUSINESS, DISTRIBUTOR, RETAILER, WHOLESALER
- [✅] **Company Name**: Text input (optional, required if type is BUSINESS)
- [✅] **Active Toggle**: In drawer header (top-right)

**Contact Information**:
- [ ] **Primary Contact Person**: Text input (required)
- [ ] **Email**: Email input (required, validated, unique)
- [ ] **Phone**: Phone input with country code (required, validated)
- [ ] **Alternate Phone**: Phone input (optional)
- [ ] **Website**: URL input (optional, validated)

**Address Information**:
- [✅] **Billing Address**:
  - [✅] Address Line 1: Text input (optional)
  - [✅] Address Line 2: Text input (optional)
  - [✅] City: Text input (optional)
  - [✅] State/Province: Text input (optional)
  - [✅] Country: Global CountrySelect component (optional)
  - [✅] Postal Code: Text input (optional, validated)
- [✅] **Shipping Address**:
  - [✅] Same as Billing: Checkbox (if checked, copy billing address)
  - [✅] All address fields same as billing (conditionally shown)

**Financial Information**:
- [✅] **Payment Terms**: Dropdown - NET_30, NET_60, NET_90, ADVANCE, COD, CREDIT
- [✅] **Credit Limit**: Number input with 2 decimals (optional)
- [✅] **Currency**: Dropdown - INR, USD, EUR, GBP (default: INR)
- [✅] **Tax ID/GST Number**: Text input (optional, validated)
- [✅] **PAN Number**: Text input (optional, for Indian customers)

**Additional Information**:
- [✅] **Customer Category**: Dropdown - VIP, REGULAR, NEW, INACTIVE (optional)
- [✅] **Assigned Sales Rep**: User dropdown (optional, filtered by role)
- [✅] **Notes**: Text area (optional, max 500 chars)
- [✅] **Tags**: Multi-select with add/remove UI (optional, e.g., "Bulk Buyer", "Export")

**Table Display Columns**:
- [✅] Customer Code | Customer Name | Contact Person | Email | Phone | Type | Credit Limit | Active Status | Actions

**Customer List Page Features**:
- [✅] Search: By name, code, email, phone
- [✅] Filters: Customer Type, Category, Payment Terms, Active Status
- [✅] Bulk Actions: Activate/Deactivate, Export, Delete
- [✅] Quick Actions: View Details, Edit, Create Order, View Orders, Delete
- [✅] Empty State: "No customers found" with "Add Customer" button

**Backend Implementation**:
- [✅] Database schema updated with all customer fields
- [✅] CustomerService with complete CRUD operations
- [✅] CustomerController with comprehensive Joi validation
- [✅] Conditional validation (companyName required for BUSINESS type)
- [✅] Same as billing address logic in service layer

**Frontend Implementation**:
- [✅] CustomerFormDrawer with all fields and validation
- [✅] CustomerListPage with enhanced table and filters
- [✅] Customer service integration with proper TypeScript interfaces
- [✅] Active toggle in drawer header
- [✅] Tags management with add/remove UI
- [✅] Role-based access control (EMPLOYEE cannot create/edit/delete)

---

**2.0.2 Supplier Management (Detailed)** ✅ **COMPLETED**

**Supplier Drawer/Screen** ✅
- [✅] **Form Type**: Drawer (5-20 fields) with Active toggle in header
- [✅] **Auto-Generated Code**: SUPP-001, SUPP-002, etc. (backend generated)
- [✅] **Create Mode**: Active toggle disabled, default isActive: true
- [✅] **Edit Mode**: Active toggle enabled, reflects current status

**Form Fields - Supplier**:
- [✅] **Supplier Code**: Auto-generated (e.g., SUPP-001) - Display only
- [✅] **Supplier Name**: Text input (required, max 100 chars)
- [✅] **Supplier Type**: Dropdown - MANUFACTURER, DISTRIBUTOR, WHOLESALER, IMPORTER, LOCAL_VENDOR
- [✅] **Company Registration Number**: Text input (optional)
- [✅] **Active Toggle**: In drawer header (top-right)

**Contact Information**:
- [✅] **Primary Contact Person**: Text input (required)
- [✅] **Email**: Email input (required, validated, unique)
- [✅] **Phone**: Phone input with country code (required, validated)
- [✅] **Alternate Phone**: Phone input (optional)
- [✅] **Website**: URL input (optional, validated)
- [✅] **Fax**: Text input (optional)

**Address Information**:
- [✅] **Business Address**:
  - [✅] Address Line 1: Text input (required)
  - [✅] Address Line 2: Text input (optional)
  - [✅] City: Text input (required)
  - [✅] State/Province: Text input (required)
  - [✅] Country: Global CountrySelect component (required)
  - [✅] Postal Code: Text input (required, validated)

**Financial Information**:
- [✅] **Payment Terms**: Dropdown - NET_30, NET_60, NET_90, ADVANCE, COD, CREDIT
- [✅] **Credit Period (Days)**: Number input (optional)
- [✅] **Currency**: Dropdown - INR, USD, EUR, GBP (default: INR)
- [✅] **Tax ID/GST Number**: Text input (optional, validated)
- [✅] **PAN Number**: Text input (optional, for Indian suppliers)
- [✅] **Bank Account Details**: Text area (optional, for direct transfers)

**Supply Information**:
- [✅] **Product Categories Supplied**: Multi-select with add/remove UI (e.g., Raw Materials, Fabrics, Chemicals)
- [✅] **Lead Time (Days)**: Number input (optional, typical delivery time)
- [✅] **Minimum Order Quantity**: Number input (optional)
- [✅] **Minimum Order Value**: Number input with 2 decimals (optional)

**Quality & Compliance**:
- [✅] **Quality Rating**: Dropdown - EXCELLENT, GOOD, AVERAGE, POOR (optional)
- [✅] **Certifications**: Multi-select with add/remove UI (e.g., ISO, GOTS, OEKO-TEX)
- [✅] **Compliance Status**: Dropdown - COMPLIANT, NON_COMPLIANT, PENDING_REVIEW

**Additional Information**:
- [✅] **Supplier Category**: Dropdown - PREFERRED, APPROVED, TRIAL, BLACKLISTED
- [✅] **Assigned Procurement Manager**: User dropdown (optional)
- [✅] **Notes**: Text area (optional, max 500 chars)
- [✅] **Tags**: Multi-select with add/remove UI (optional, e.g., "Eco-Friendly", "Fast Delivery")

**Table Display Columns**:
- [✅] Supplier Code | Supplier Name | Contact Person | Email | Phone | Type | Lead Time | Active Status | Actions

**Supplier List Page Features**:
- [✅] Search: By name, code, email, phone
- [✅] Filters: Supplier Type, Category, Active Status, Quality Rating
- [✅] Bulk Actions: Activate/Deactivate, Export, Delete
- [✅] Quick Actions: View Details, Edit, Create PO, View POs, Delete
- [✅] Empty State: "No suppliers found" with "Add Supplier" button

**Backend Implementation**:
- [✅] Database schema updated with all supplier fields
- [✅] SupplierService with complete CRUD operations
- [✅] SupplierController with comprehensive Joi validation
- [✅] Auto-generation of supplier codes (SUPP-001, SUPP-002, etc.)

**Frontend Implementation**:
- [✅] SupplierFormDrawer with all fields and validation
- [✅] SupplierListPage with enhanced table and filters
- [✅] Supplier service integration with proper TypeScript interfaces
- [✅] Active toggle in drawer header
- [✅] Tags, certifications, and product categories management with add/remove UI
- [✅] Role-based access control (EMPLOYEE cannot create/edit/delete)
- [✅] Navigation configured in sidebar

**Supplier Performance Tracking** (Future Enhancement):
- [ ] On-Time Delivery Rate: Percentage
- [ ] Quality Score: Based on received goods inspection
- [ ] Total Purchase Value: Lifetime value
- [ ] Last Purchase Date: Most recent PO date
- [ ] Average Lead Time: Calculated from PO history

---

#### **2.1 Product Management** ✅

**Product Master Data** ✅
- [✅] Product Code: Auto-generated or manual (unique within company)
- [✅] Product Name: Required
- [✅] Category: Dropdown (with ability to create new categories)
- [✅] Description: Text area
- [✅] SKU/Barcode: Optional, unique if provided
- [✅] Unit of Measure (UOM): PCS, MTR, YDS, KG, LBS, ROLL, BOX, CTN, DOZ, SET, BALE, CONE, SPOOL
- [✅] Product Type: OWN_MANUFACTURE, VENDOR_SUPPLIED, OUTSOURCED, RAW_MATERIAL, FINISHED_GOODS, SEMI_FINISHED
- [✅] Active Toggle: In drawer header (disabled on create, enabled on edit, default true)

**Pricing Management** ✅
- [✅] Cost Price: Purchase/manufacturing cost
- [✅] Selling Price: Default selling price
- [✅] Markup Percentage: Auto-calculated or manual

**Inventory Tracking** ✅
- [✅] Current Stock Quantity: Real-time stock level
- [✅] Reorder Level: Minimum stock threshold

**Textile-Specific Fields** ✅
- [✅] Material: Material type
- [✅] Color: Color name/code
- [✅] Size: Size specification
- [✅] Weight: Weight specification

**Product Images** ✅
- [✅] Image URL: Product image URL field

**Stock Adjustment** ✅
- [✅] Adjustment Type: ADD, REMOVE, SET, SALE, PURCHASE, RETURN, DAMAGE, TRANSFER
- [✅] Quantity: Number input with validation
- [✅] Reason: Required text field
- [✅] Notes: Optional text area for details
- [✅] Audit Trail: Complete history of all adjustments

**Product List Page** ✅
- [✅] Table Columns: Image, Product Code, Name, Category, Stock, Price, Status, Actions
- [✅] Filters: Search (name, code, SKU), Category, Status (Active/Inactive)
- [✅] Stock Indicators: Low stock warnings (red badge when below reorder level)
- [✅] Quick Actions: Edit, Adjust Stock, Delete
- [✅] Empty State: "No products found" with "Add Product" button

#### **2.2 Inventory Management** ✅

**Add Inventory (Initial Setup)** ✅
- [✅] Drawer-based form for setting up initial inventory levels
- [✅] Form Fields:
  - [✅] Product: Searchable product dropdown (required)
  - [✅] Location: Location dropdown (required)
  - [✅] Stock Quantity: Initial stock level (required, integer only)
  - [✅] Reserved Quantity: Pre-reserved stock (optional, integer only, default 0)
  - [✅] Reorder Level: Minimum threshold for low stock alerts (optional, integer only)
- [✅] Purpose: Set up inventory tracking for a product at a specific location
- [✅] Validation: Stock quantity must be 0 or greater
- [✅] Auto-Calculation: Available quantity = Stock quantity - Reserved quantity

**Multi-Location Inventory Tracking** ✅
- [✅] Location-Based Stock: Track stock separately for each location
- [✅] Real-Time Stock Levels: Current quantity per location
- [✅] Available Stock: Total stock minus reservations
- [✅] Reserved Stock: Stock allocated to orders
- [✅] Location Dropdown: Filter by specific location or view all

**Stock Movement Management** ✅
- [✅] Movement Types:
  - [✅] PURCHASE: Incoming stock from suppliers
  - [✅] SALE: Outgoing stock to customers
  - [✅] TRANSFER: Between locations
  - [✅] ADJUSTMENT: Manual corrections
  - [✅] PRODUCTION: Manufacturing consumption/output
  - [✅] RETURN: Customer/supplier returns
  - [✅] DAMAGE: Damaged/expired stock write-off
- [✅] Movement Form Fields:
  - [✅] Movement Type: Required dropdown
  - [✅] Product: Searchable product dropdown
  - [✅] From Location: Required for TRANSFER, SALE
  - [✅] To Location: Required for TRANSFER, PURCHASE
  - [✅] Quantity: Number input with validation
  - [✅] Unit Price: Optional for valuation
  - [✅] Reference Number: PO/SO/Transfer number
  - [✅] Date: Movement date
  - [✅] Notes: Optional details
- [✅] Auto-Update: Inventory levels update automatically on movement save
- [✅] Validation: Cannot move more than available stock
- [✅] Audit Trail: Complete history with user, timestamp, before/after quantities

**Stock Reservations** ✅
- [✅] Reserve Stock: Allocate stock for specific orders
- [✅] Reservation Fields:
  - [✅] Product: Required
  - [✅] Location: Required
  - [✅] Quantity: Cannot exceed available stock
  - [✅] Order Reference: Link to sales order
  - [✅] Reserved Until: Expiry date
  - [✅] Status: ACTIVE, EXPIRED, RELEASED, FULFILLED
- [✅] Auto-Release: Expired reservations automatically release stock
- [✅] Manual Release: Admin can release reservations early

**Low Stock Alerts** ✅
- [✅] Alert Triggers: When stock falls below reorder level
- [✅] Alert Fields:
  - [✅] Product: Auto-populated
  - [✅] Location: Auto-populated
  - [✅] Current Stock: Real-time quantity
  - [✅] Reorder Level: Threshold value
  - [✅] Suggested Reorder: Calculated quantity
  - [✅] Alert Date: When alert was created
  - [✅] Status: PENDING, ACKNOWLEDGED, RESOLVED
- [✅] Alert Actions:
  - [✅] Acknowledge: Mark as seen
  - [✅] Create PO: Quick link to create purchase order
  - [✅] Adjust Reorder Level: Update threshold
  - [✅] Dismiss: For false positives
- [✅] Alert Notifications: Email/SMS to designated users
- [✅] Alert Dashboard: Widget showing all active alerts

**Inventory List Page** ✅
- [✅] Table Columns:
  - [✅] Product Image: Thumbnail with fallback
  - [✅] Product Code: Monospace font
  - [✅] Product Name: Bold with category below
  - [✅] Location: Location name with icon
  - [✅] Current Stock: Number with UOM
  - [✅] Available Stock: After reservations
  - [✅] Reserved: Quantity reserved
  - [✅] Reorder Level: Threshold value
  - [✅] Status: Active/Inactive tag
  - [✅] Actions: View Movements, Adjust Stock, Reserve, Transfer
- [✅] Filters:
  - [✅] Search: Product name, code
  - [✅] Location: Multi-select dropdown
  - [✅] Stock Status: All, Low Stock, Out of Stock, Adequate
  - [✅] Category: Product category filter
  - [✅] Date Range: For movement history
- [✅] Real-Time Updates: Auto-refresh on stock changes
- [✅] Export: CSV/Excel export with filters applied
- [✅] Bulk Actions: Transfer, Adjust, Export selected items

**Stock Movement History** ✅
- [✅] Movement Log: Complete audit trail of all movements
- [✅] Filters: Date range, movement type, product, location, user
- [✅] Details View: Expandable rows showing full movement details
- [✅] Export: Download movement history as CSV/Excel
- [✅] Search: By reference number, product, user

**Inventory Analytics (Integrated in Main Dashboard)**
- [ ] Stock Value: Total inventory value by location
- [ ] Movement Trends: Charts showing movement patterns
- [ ] Fast/Slow Moving: Identify products by turnover rate
- [ ] Stock Aging: Products by age in inventory
- [ ] Reorder Recommendations: AI-powered suggestions
- [ ] Wastage Analysis: Track damaged/expired stock

#### **2.3 Order Management** ✅

**Sales Order Creation** ✅
- [✅] Order Information:
  - [ ] Order Number: Auto-generated (SO001, SO002, etc.)
  - [ ] Customer: Searchable dropdown or quick-add
  - [ ] Order Date: DatePicker (defaults to current date)
  - [ ] Delivery Date: Required delivery date
  - [ ] Location: Company location for order processing
  - [ ] Currency: Multi-currency support
  - [ ] Status: DRAFT, CONFIRMED, IN_PRODUCTION, READY_TO_SHIP, SHIPPED, DELIVERED
- [ ] Order Items:
  - [ ] Product: Searchable dropdown from product master
  - [ ] Quantity: Number input
  - [ ] Unit Price: Auto-filled from product, editable
  - [ ] Discount: Percentage or amount
  - [ ] Tax: Auto-calculated based on product tax rate
  - [ ] Line Total: Auto-calculated
  - [ ] Add/Remove Items: Dynamic item rows
- [ ] Delivery Details:
  - [ ] Shipping Address: Text area or select from customer addresses
  - [ ] Shipping Method: Dropdown (Standard, Express, Overnight)
  - [ ] Carrier: Shipping carrier name
  - [ ] Tracking Number: Optional tracking reference
  - [ ] Delivery Window: Time slot for delivery
- [ ] Order Totals:
  - [ ] Subtotal: Sum of line totals
  - [ ] Discount: Order-level discount
  - [ ] Tax: Total tax amount
  - [ ] Shipping Charges: Optional
  - [ ] Grand Total: Final amount
- [ ] Notes: Internal notes and customer instructions
- [ ] Attachments: Supporting documents (PO, specifications)

**Order Status Workflow**
- [ ] DRAFT: Initial creation, can be edited freely
- [ ] CONFIRMED: Customer confirmed, inventory reserved
- [ ] IN_PRODUCTION: Manufacturing/processing started
- [ ] READY_TO_SHIP: Completed, awaiting shipment
- [ ] SHIPPED: Dispatched to customer
- [ ] DELIVERED: Received by customer
- [ ] Status History: Track all status changes with timestamp and user

**Order List Page**
- [ ] Table Columns: Order Number, Customer, Date, Delivery Date, Items Count, Total Amount, Status, Actions
- [ ] Filters: Search, Status, Date Range, Customer, Location
- [ ] Status Tags: Color-coded badges for each status
- [ ] Quick Actions: View, Edit (if DRAFT), Print, Invoice, Ship, Cancel
- [ ] Bulk Actions: Print selected, Export, Bulk status update

**Financial Document Integration**
- [ ] Invoice Generation: Auto-create invoice from order
- [ ] Bill Generation: For purchase orders
- [ ] Purchase Order Creation: Link to suppliers
- [ ] Default Location: Use company default location in financial documents
- [ ] Location-Based Addressing: Use location details in documents

#### **2.3.1 Sales Order Management (Detailed)** ✅ **COMPLETED**

**Sales Order Drawer/Screen** ✅
- [✅] **Form Type**: Drawer (5-20 fields) with Active toggle in header
- [✅] **Create Mode**: Active toggle disabled, default isActive: true
- [✅] **Edit Mode**: Active toggle enabled, reflects current status
- [✅] **Auto-Generated Code**: SO001, SO002, etc. (backend generated)

**Form Fields - Sales Order**:
- [✅] **Order Code**: Auto-generated (e.g., SO001) - Display only, generated by backend
- [✅] **Customer**: Searchable dropdown (required) - Link to customer master
- [✅] **Order Date**: DatePicker (required, defaults to current date)
- [✅] **Expected Delivery Date**: DatePicker (required)
- [✅] **Location**: Company location dropdown (required)
- [✅] **Order Status**: Dropdown - DRAFT, CONFIRMED, IN_PRODUCTION, READY_TO_SHIP, SHIPPED, DELIVERED, CANCELLED
- [✅] **Priority**: Dropdown - URGENT, HIGH, NORMAL, LOW
- [✅] **Payment Terms**: Dropdown - NET_30, NET_60, ADVANCE, COD, CREDIT
- [✅] **Currency**: Dropdown - INR, USD, EUR, GBP (default: INR)
- [✅] **Active Toggle**: In drawer header (top-right)

**Order Items (Line Items)**:
- [✅] **Product**: Searchable product dropdown (required)
- [✅] **Quantity**: Number input (required, integer only)
- [✅] **Unit Price**: Number input with 2 decimal places (required)
- [✅] **Discount %**: Number input (0-100, optional)
- [✅] **Tax Rate %**: Auto-filled from product, editable (optional)
- [✅] **Line Total**: Auto-calculated (Quantity × Unit Price - Discount + Tax)
- [✅] **Add/Remove Rows**: Dynamic line items with + and - buttons

**Delivery Information**:
- [✅] **Shipping Address**: Text area (optional)
- [✅] **Shipping Method**: Dropdown - STANDARD, EXPRESS, OVERNIGHT, PICKUP
- [✅] **Carrier**: Text input (optional)
- [✅] **Tracking Number**: Text input (optional)

**Financial Summary**:
- [✅] **Subtotal**: Auto-calculated sum of line totals (read-only)
- [✅] **Order Discount**: Number input (optional, can be % or fixed amount)
- [✅] **Tax Amount**: Auto-calculated total tax (read-only)
- [✅] **Shipping Charges**: Number input with 2 decimals (optional)
- [✅] **Grand Total**: Auto-calculated final amount (read-only, bold)

**Additional Fields**:
- [✅] **Notes**: Text area for internal notes (optional, max 500 chars)
- [✅] **Customer Notes**: Text area for customer-facing notes (optional)
- [✅] **Reference Number**: Text input (optional, e.g., customer PO number)
- [✅] **Attachments**: File upload (PDF, images, max 5MB per file)

**Table Display Columns**:
- [✅] Order Code | Customer Name | Order Date | Delivery Date | Status | Total Amount | Active Status | Actions

#### **2.3.2 Purchase Order Management (Detailed)** ✅ **COMPLETED**

**Purchase Order Drawer/Screen** ✅
- [✅] **Form Type**: Drawer (5-20 fields) with Active toggle in header
- [✅] **Auto-Generated Code**: PO001, PO002, etc. (backend generated)

**Form Fields - Purchase Order**:
- [✅] **PO Code**: Auto-generated (e.g., PO001) - Display only
- [✅] **Supplier**: Searchable dropdown (required) - Link to supplier master
- [✅] **PO Date**: DatePicker (required, defaults to current date)
- [✅] **Expected Delivery Date**: DatePicker (required)
- [✅] **Location**: Company location dropdown (required) - Delivery location
- [✅] **PO Status**: Dropdown - DRAFT, SENT, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
- [✅] **Priority**: Dropdown - URGENT, HIGH, NORMAL, LOW
- [✅] **Payment Terms**: Dropdown - NET_30, NET_60, ADVANCE, COD, CREDIT
- [✅] **Currency**: Dropdown - INR, USD, EUR, GBP (default: INR)
- [✅] **Active Toggle**: In drawer header (top-right)

**Order Items (Line Items)**:
- [✅] **Product/Material**: Searchable product dropdown (required)
- [✅] **Quantity**: Number input (required, supports decimals for materials)
- [✅] **Unit Cost**: Number input with 2 decimal places (required)
- [✅] **Discount %**: Number input (0-100, optional)
- [✅] **Tax Rate %**: Number input (optional)
- [✅] **Line Total**: Auto-calculated
- [✅] **Expected Delivery**: DatePicker per line item (optional)

**Delivery Information**:
- [✅] **Delivery Address**: Text area (auto-filled from location, editable)
- [✅] **Shipping Method**: Dropdown - STANDARD, EXPRESS, FREIGHT, COURIER
- [✅] **Incoterms**: Dropdown - FOB, CIF, EXW, DDP (optional)

**Financial Summary**:
- [✅] **Subtotal**: Auto-calculated (read-only)
- [✅] **Discount**: Number input (optional)
- [✅] **Tax Amount**: Auto-calculated (read-only)
- [✅] **Shipping Charges**: Number input with 2 decimals (optional)
- [✅] **Grand Total**: Auto-calculated (read-only, bold)

**Additional Fields**:
- [✅] **Notes**: Text area (optional, max 500 chars)
- [✅] **Terms & Conditions**: Text area (optional)
- [✅] **Reference Number**: Text input (optional)
- [✅] **Attachments**: File upload (PDF, images, max 5MB)

**Table Display Columns**:
- [✅] PO Code | Supplier Name | PO Date | Delivery Date | Status | Total Amount | Active Status | Actions

#### **2.3.3 Invoice Management (Detailed)** ✅

**Invoice Drawer/Screen** ✅
- [✅] **Form Type**: Drawer (5-20 fields) with Active toggle in header
- [✅] **Auto-Generated Code**: INV001, INV002, etc. (backend generated)
- [✅] **Can be created from**: Sales Order (auto-fill) or standalone
- [✅] **Product Requirement**: If SO reference is provided, items auto-fill from SO. If no SO, Product field is MANDATORY for each line item (for inventory tracking)

**Form Fields - Invoice** ✅:
- [✅] **Invoice Code**: Auto-generated (e.g., INV001) - Display only
- [✅] **Invoice Number**: Text input (optional, for custom numbering)
- [✅] **Customer**: Searchable dropdown (required)
- [✅] **Invoice Date**: DatePicker (required, defaults to current date)
- [✅] **Due Date**: DatePicker (required, auto-calculated based on payment terms)
- [✅] **Sales Order Reference**: Dropdown (optional, link to SO) - If selected, auto-fills items from SO
- [✅] **Location**: Company location dropdown (required) - Billing location
- [✅] **Invoice Status**: Dropdown - DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED
- [✅] **Payment Terms**: Dropdown - NET_30, NET_60, IMMEDIATE, ADVANCE
- [✅] **Currency**: Dropdown - INR, USD, EUR, GBP (default: INR)
- [✅] **Active Toggle**: In drawer header (top-right)

**Invoice Items (Line Items)** ✅:
- [✅] **Product**: Searchable product dropdown (REQUIRED if no SO reference, auto-filled if SO linked)
- [✅] **Item Code**: Auto-filled from product or SO item
- [✅] **Description**: Text input (auto-filled from product, editable)
- [✅] **Quantity**: Number input (required)
- [✅] **Unit Price**: Number input with 2 decimals (required, auto-filled from product)
- [✅] **Discount %**: Number input (0-100, optional)
- [✅] **Tax Rate %**: Number input (optional, GST/VAT)
- [✅] **Line Total**: Auto-calculated

**Financial Summary** ✅:
- [✅] **Subtotal**: Auto-calculated (read-only)
- [✅] **Discount**: Number input (optional)
- [✅] **Tax Amount**: Auto-calculated (read-only, itemized by tax rate)
- [✅] **Shipping/Handling**: Number input with 2 decimals (optional)
- [✅] **Grand Total**: Auto-calculated (read-only, bold)
- [✅] **Amount Paid**: Number input (for partial payments)
- [✅] **Balance Due**: Auto-calculated (Grand Total - Amount Paid)

**Payment Information** ✅:
- [✅] **Payment Method**: Dropdown - CASH, CHEQUE, BANK_TRANSFER, UPI, CARD, OTHER
- [✅] **Payment Date**: DatePicker (optional, when payment received)
- [✅] **Transaction Reference**: Text input (optional, cheque/transaction number)

**Additional Fields** ✅:
- [✅] **Notes**: Text area (optional, max 500 chars)
- [✅] **Terms & Conditions**: Text area (optional)
- [✅] **Bank Details**: Text area (for payment instructions)
- [ ] **Attachments**: File upload (PDF, images, max 5MB)

**Deletion Rules (Industry Standard)** ✅:
- [✅] **DRAFT Status**: Can be deleted (soft delete, sets is_active = false)
- [✅] **SENT/PARTIALLY_PAID/PAID/OVERDUE Status**: CANNOT be deleted - maintains audit trail and stock integrity
- [✅] **CANCELLED Status**: CANNOT be deleted - keeps record for audit purposes
- [✅] **Delete Action**: Shows confirmation modal explaining why deletion is not allowed for non-draft invoices

**Table Display Columns** ✅:
- [✅] Invoice Code | Customer | Invoice Date | Due Date | Status | Total Amount | Balance Due | Active Status | Actions

#### **2.3.4 Bill Management (Detailed)** ✅

**Bill Drawer/Screen** ✅
- [✅] **Form Type**: Drawer (5-20 fields) with Active toggle in header
- [✅] **Auto-Generated Code**: BILL001, BILL002, etc. (backend generated)
- [✅] **Can be created from**: Purchase Order (auto-fill) or standalone
- [✅] **Product Requirement**: If PO reference is provided, items auto-fill from PO. If no PO, Product field is MANDATORY for each line item (for inventory tracking)

**Form Fields - Bill** ✅:
- [✅] **Bill Code**: Auto-generated (e.g., BILL001) - Display only
- [✅] **Bill Number**: Text input (optional, supplier's bill number)
- [✅] **Supplier**: Searchable dropdown (required)
- [✅] **Bill Date**: DatePicker (required)
- [✅] **Due Date**: DatePicker (required)
- [✅] **Purchase Order Reference**: Dropdown (optional, link to PO) - If selected, auto-fills items from PO
- [✅] **Location**: Company location dropdown (required)
- [✅] **Bill Status**: Dropdown - DRAFT, RECEIVED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED
- [✅] **Payment Terms**: Dropdown - NET_30, NET_60, IMMEDIATE, ADVANCE
- [✅] **Currency**: Dropdown - INR, USD, EUR, GBP (default: INR)
- [✅] **Active Toggle**: In drawer header (top-right)

**Bill Items (Line Items)** ✅:
- [✅] **Product**: Searchable product dropdown (REQUIRED if no PO reference, auto-filled if PO linked)
- [✅] **Item Code**: Auto-filled from product or PO item
- [✅] **Description**: Text input (auto-filled from product, editable)
- [✅] **Quantity**: Number input (required, supports decimals)
- [✅] **Unit Cost**: Number input with 2 decimals (required, auto-filled from product)
- [✅] **Discount %**: Number input (0-100, optional)
- [✅] **Tax Rate %**: Number input (optional)
- [✅] **Line Total**: Auto-calculated

**Financial Summary** ✅:
- [✅] **Subtotal**: Auto-calculated (read-only)
- [✅] **Discount**: Number input (optional)
- [✅] **Tax Amount**: Auto-calculated (read-only)
- [✅] **Shipping/Handling**: Number input with 2 decimals (optional)
- [✅] **Grand Total**: Auto-calculated (read-only, bold)
- [✅] **Amount Paid**: Number input (for partial payments)
- [✅] **Balance Due**: Auto-calculated (Grand Total - Amount Paid)

**Payment Information** ✅:
- [✅] **Payment Method**: Dropdown - CASH, CHEQUE, BANK_TRANSFER, UPI, CARD, OTHER
- [✅] **Payment Date**: DatePicker (optional, when payment made)
- [✅] **Transaction Reference**: Text input (optional)

**Additional Fields** ✅:
- [✅] **Notes**: Text area (optional, max 500 chars)
- [✅] **Supplier Invoice Number**: Text input (supplier's reference)
- [ ] **Attachments**: File upload (PDF, images, max 5MB)

**Deletion Rules (Industry Standard)** ✅:
- [✅] **DRAFT Status**: Can be deleted (soft delete, sets is_active = false)
- [✅] **RECEIVED/PARTIALLY_PAID/PAID/OVERDUE Status**: CANNOT be deleted - maintains audit trail and stock integrity
- [✅] **CANCELLED Status**: CANNOT be deleted - keeps record for audit purposes
- [✅] **Delete Action**: Shows confirmation modal explaining why deletion is not allowed for non-draft bills

**Table Display Columns** ✅:
- [✅] Bill Code | Supplier | Bill Date | Due Date | Status | Total Amount | Balance Due | Active Status | Actions

#### **2.4 Machine Management** ✅

**Machine Master Data** ✅
- [✅] Machine ID: Auto-generated (MCH0001, MCH0002, etc.)
- [✅] Machine Code: Auto-generated (MC0001, MC0002, etc.)
- [✅] Machine Name: Descriptive name
- [✅] Machine Type: Industry-specific dropdown (dynamically filtered based on company industry)
  - [✅] Textile Manufacturing: Ring Spinning Frame, Air Jet Loom, Circular Knitting Machine, etc. (15 types)
  - [✅] Garment Production: Industrial Sewing Machine, Overlock Machine, Embroidery Machine, etc. (15 types)
  - [✅] Fabric Processing: Singeing Machine, Dyeing Machine, Stentering Machine, etc. (14 types)
  - [✅] Knitting & Weaving: Circular Knitting Machine, Rapier Loom, Jacquard Loom, etc. (14 types)
  - [✅] Dyeing & Finishing: Jigger Dyeing Machine, Digital Textile Printer, Calendering Machine, etc. (15 types)
  - [✅] Other: Generic types (9 types)
- [✅] Model: Machine model number
- [✅] Manufacturer: Manufacturer name
- [✅] Serial Number: Unique serial number
- [✅] Purchase Date: DatePicker
- [✅] Warranty Expiry: DatePicker
- [✅] Location: Link to company location
- [✅] Technical Specifications: Text field for capacity, speed, power, dimensions, etc.
- [✅] Machine Image: Upload with preview
- [✅] QR Code: Text field for QR code identification
- [✅] Status: NEW, IN_USE, UNDER_MAINTENANCE, UNDER_REPAIR, IDLE, DECOMMISSIONED
- [✅] Current Operator: Link to user (operator)
- [✅] Operational Status: FREE, BUSY, RESERVED, UNAVAILABLE
- [✅] Active Toggle: In drawer header (disabled on create, enabled on edit, default true)

**Machine Status Tracking** ✅
- [✅] Real-Time Status: Current operational status
- [✅] Status History: Complete timeline of status changes
- [ ] Utilization Metrics: Usage hours, idle time, efficiency percentage (future)
- [ ] Performance KPIs: OEE, MTBF, MTTR calculations (future)

**Preventive Maintenance Scheduling** ✅
- [✅] Maintenance Types: DAILY_CHECK, WEEKLY, MONTHLY, QUARTERLY, ANNUAL, EMERGENCY
- [✅] Schedule Fields:
  - [✅] Machine: Required
  - [✅] Maintenance Type: Required dropdown
  - [✅] Title: Short description
  - [✅] Description: Detailed instructions
  - [✅] Frequency: Every X days
  - [✅] Last Completed: Date of last maintenance
  - [✅] Next Due: Auto-calculated based on frequency
  - [✅] Estimated Hours: Time estimate
  - [✅] Assigned Technician: User dropdown
  - [✅] Checklist: JSON array of tasks
  - [✅] Parts Required: JSON array of parts
- [ ] Auto Reminders: Email/SMS before due dates (future)
- [ ] Maintenance Calendar: Visual calendar view (future)
- [ ] Cost Tracking: Track costs per maintenance (future)
- [ ] Vendor Management: Service provider details (future)

**Breakdown Reporting** ✅
- [✅] Quick Breakdown Form (Mobile-Friendly):
  - [✅] Machine: Required dropdown
  - [✅] Severity: CRITICAL, HIGH, MEDIUM, LOW
  - [✅] Title: Short issue description
  - [✅] Description: Detailed problem description
  - [✅] Breakdown Time: Timestamp
  - [✅] Photo/Video Upload: Evidence of issue (images array)
  - [✅] Operator: Auto-filled from current user
- [✅] Ticket Management:
  - [✅] Ticket ID: Auto-generated (TKT0001, TKT0002, etc.)
  - [✅] Status: OPEN, IN_PROGRESS, RESOLVED, CLOSED
  - [✅] Priority: URGENT, HIGH, MEDIUM, LOW
  - [✅] Assigned Technician: User dropdown
  - [ ] Estimated Resolution: Time estimate (future)
  - [✅] Parts Required: List of parts needed
  - [✅] Labor Hours: Actual hours spent
  - [✅] Root Cause: Analysis after resolution
  - [✅] Resolution Notes: How it was fixed
- [ ] Real-Time Alerts: Push notifications to maintenance team (future)
- [ ] Escalation Rules: Auto-escalate based on severity and response time (future)
- [✅] Downtime Tracking: Auto-calculate production loss

**Machine Assignment & Operators** ✅
- [✅] Operator Assignment:
  - [✅] Primary Operator: Main user (current_operator_id)
  - [ ] Backup Operators: Secondary users (future)
  - [ ] Shift: MORNING, AFTERNOON, NIGHT (future)
  - [ ] Skill Matching: Match operator certification to machine requirements (future)
- [ ] Training Records: Track certifications and training completion (future)
- [ ] Operator Performance: Track efficiency, quality, breakdown frequency (future)

**Machine List Page** ✅
- [✅] Table Columns: Image, Machine Code, Name, Type, Location, Current Operator, Operational Status, Status, Actions
- [✅] Filters: Search, Location, Status
- [✅] Status Tags: Color-coded (In Use=Green, Under Maintenance=Orange, Under Repair=Red, Idle=Gray, New=Blue)
- [✅] Quick Actions: Edit, Update Status, Schedule Maintenance, Report Breakdown, Delete
- [✅] Empty State: "No machines found" with "Add Machine" button
- [✅] Delete: Soft delete with confirmation modal (decommissions machine)

**Machine Analytics (Integrated in Main Dashboard)** ✅
- [✅] Machine Status Overview: Count by status
- [✅] Maintenance Due: Upcoming maintenance in next 7 days
- [✅] Active Breakdowns: Open and in-progress tickets
- [✅] Overdue Maintenance: Past due maintenance count
- [ ] Utilization Charts: Usage percentage by machine (future)
- [ ] Performance Metrics: OEE, MTBF, MTTR trends (future)
- [ ] Cost Analysis: Maintenance costs vs production loss (future)

---

### **PRIORITY 3: Quality & Compliance (PARTIALLY COMPLETED ⏳)**

#### **3.1 Quality Control System**

**Inspection Management**
- [ ] Inspection Types: INCOMING_MATERIAL, IN_PROCESS, FINAL_PRODUCT, RANDOM_CHECK
- [ ] Inspection Form:
  - [ ] Inspection Number: Auto-generated (INS001, INS002, etc.)
  - [ ] Type: Required dropdown
  - [ ] Reference Type: Product, Order, Batch
  - [ ] Reference Selection: Searchable dropdown
  - [ ] Location: Company location
  - [ ] Inspector: User dropdown (defaults to current user)
  - [ ] Scheduled Date: DatePicker
  - [ ] Template: Select predefined inspection template or create custom
  - [ ] Active Toggle: In drawer header (disabled on create, enabled on edit, default true)
- [ ] Inspection Checklist:
  - [ ] Dynamic checkpoints from template
  - [ ] Each checkpoint: Name, Pass/Fail toggle or rating (1-5 stars), Notes, Photo upload
  - [ ] Add custom checkpoints
- [ ] Overall Assessment:
  - [ ] Result: PASS, FAIL, CONDITIONAL_PASS
  - [ ] Quality Score: Auto-calculated percentage
  - [ ] Inspector Notes: Summary text area
  - [ ] Recommendations: Corrective actions
- [ ] Auto-Save Draft: Save progress automatically
- [ ] Completion: Lock inspection after completion

**Inspection Templates**
- [ ] Template Name: Descriptive name
- [ ] Inspection Type: Link to inspection type
- [ ] Checkpoint List: Predefined checkpoints
- [ ] Scoring Method: Pass/Fail or Rating scale
- [ ] Reusable: Use across multiple inspections

**Quality Checkpoints**
- [ ] Checkpoint Code: Auto-generated (QC001, QC002, etc.)
- [ ] Checkpoint Name: Descriptive name
- [ ] Product Link: Optional product association
- [ ] Batch/Lot Tracking: batch_number, lot_number, sample_size, tested_quantity
- [ ] Checkpoint Type: Dimension, Visual, Functional, Chemical, etc.
- [ ] Expected Value: Target value or range
- [ ] Tolerance: Acceptable deviation
- [ ] Measurement Unit: UOM for measurement
- [ ] Pass/Fail Criteria: Clear criteria
- [ ] Notes: Additional observations
- [ ] Active Toggle: In drawer header (disabled on create, enabled on edit, default true)

**Quality Defects**
- [ ] Defect Code: Auto-generated (DEF001, DEF002, etc.)
- [ ] Severity: CRITICAL, HIGH, MEDIUM, LOW
- [ ] Category: MATERIAL, WORKMANSHIP, DESIGN, PACKAGING, OTHER
- [ ] Product/Order Link: Reference to affected item
- [ ] Batch-Specific: batch_number, lot_number, affected_items
- [ ] Description: Detailed defect description
- [ ] Root Cause: Analysis of cause
- [ ] Photo Upload: Multiple images
- [ ] Reported By: User who found defect
- [ ] Reported Date: Timestamp
- [ ] Status: OPEN, IN_REVIEW, RESOLVED, CLOSED
- [ ] Assigned To: User responsible for resolution
- [ ] Priority: URGENT, HIGH, NORMAL, LOW
- [ ] Due Date: Resolution deadline
- [ ] Corrective Action: Planned actions
- [ ] Resolution Notes: How it was resolved
- [ ] Active Toggle: In drawer header (disabled on create, enabled on edit, default true)

**Compliance Reports**
- [ ] Report Code: Auto-generated (COMP001, COMP002, etc.)
- [ ] Certification Type: ISO_9001, OEKO_TEX, GOTS, WRAP, SA8000, BSCI, SEDEX
- [ ] Report Date: DatePicker
- [ ] Audit Date: When audit was conducted
- [ ] Auditor: External auditor name
- [ ] Compliance Status: COMPLIANT, NON_COMPLIANT, PARTIAL
- [ ] Findings: Audit findings
- [ ] Corrective Actions: Required actions
- [ ] Due Date: Deadline for corrections
- [ ] Completion Date: When actions completed
- [ ] Certificate Number: Certification number
- [ ] Valid Until: Certificate expiry
- [ ] Documents: Upload certificates and reports
- [ ] Active Toggle: In drawer header (disabled on create, enabled on edit, default true)

**Quality Reports**
- [ ] Inspection Summary: Pass/fail rates, trends
- [ ] Defect Analysis: By category, severity, product
- [ ] Trend Analysis: Quality trends over time
- [ ] Inspector Performance: Inspection metrics by inspector
- [ ] Product Quality Scores: Scores by product/category
- [ ] Export: PDF, Excel reports

#### **3.2 Textile-Specific Operations (PLANNED 📋)**

**Fabric Production**
- [ ] Fabric Type: Cotton, Silk, Wool, Polyester, Blend
- [ ] Production Process: Weaving, Knitting, Non-woven
- [ ] Loom/Machine Assignment: Link to machines
- [ ] Warp/Weft Details: Thread specifications
- [ ] Width: Fabric width in inches/cm
- [ ] GSM: Grams per square meter
- [ ] Production Quantity: Meters/yards produced
- [ ] Quality Grade: A, B, C grading
- [ ] Defects: Track fabric defects
- [ ] Roll Numbers: Individual roll tracking

**Yarn Manufacturing**
- [ ] Yarn Type: Cotton, Polyester, Viscose, Blend
- [ ] Yarn Count: Ne, Nm, Tex, Denier
- [ ] Twist: TPI (Twists per inch)
- [ ] Ply: Single, 2-ply, 3-ply, etc.
- [ ] Color: Dyed or raw
- [ ] Production Process: Ring spinning, Open-end, Air-jet
- [ ] Lot Number: Batch tracking
- [ ] Cone Weight: Weight per cone
- [ ] Quality Parameters: Strength, evenness, hairiness

**Dyeing & Finishing**
- [ ] Dyeing Process: Exhaust, Continuous, Pad-batch
- [ ] Dye Type: Reactive, Disperse, Vat, Acid
- [ ] Color Code: Pantone or custom code
- [ ] Recipe: Dye recipe with chemicals
- [ ] Batch Size: Kg of fabric/yarn
- [ ] Machine: Dyeing machine used
- [ ] Temperature: Process temperature
- [ ] pH Level: Process pH
- [ ] Time: Dyeing duration
- [ ] Color Fastness: Test results
- [ ] Finishing Type: Calendering, Sanforizing, Mercerizing

**Garment Manufacturing**
- [ ] Garment Type: Shirt, Trouser, Dress, etc.
- [ ] Style Number: Design reference
- [ ] Size Range: XS to XXL
- [ ] Color: Available colors
- [ ] Fabric Consumption: Meters per garment
- [ ] Cutting: Pattern cutting details
- [ ] Sewing: Assembly line details
- [ ] Quality Checks: Measurement, stitching, finishing
- [ ] Packing: Packing specifications

---

### **PRIORITY 4: Advanced Features (PLANNED 📋)**

#### **4.1 Financial Management**

**Accounts Receivable**
- [ ] Customer Invoices: Generate from sales orders
- [ ] Payment Tracking: Record customer payments
- [ ] Aging Reports: Outstanding invoices by age
- [ ] Payment Reminders: Auto-send reminders
- [ ] Credit Limits: Customer credit management

**Accounts Payable**
- [ ] Supplier Bills: Record supplier invoices
- [ ] Payment Scheduling: Schedule payments
- [ ] Aging Reports: Outstanding bills by age
- [ ] Payment History: Track all payments
- [ ] Vendor Statements: Reconciliation

**Financial Reports**
- [ ] Profit & Loss: Income statement
- [ ] Balance Sheet: Assets, liabilities, equity
- [ ] Cash Flow: Cash flow statement
- [ ] Trial Balance: Account balances
- [ ] GST/Tax Reports: Tax compliance reports

#### **4.2 Production Planning**

**Production Orders**
- [ ] Link sales orders to production
- [ ] Material Requirements: Auto-calculate raw materials
- [ ] Capacity Planning: Machine capacity vs requirements
- [ ] Production Scheduling: Timeline and Gantt charts
- [ ] Work Orders: Detailed production instructions
- [ ] Shop Floor Control: Real-time tracking
- [ ] Bottleneck Detection: Identify constraints

#### **4.3 Supplier & Procurement**

**Supplier Master**
- [ ] Supplier database with ratings
- [ ] Certifications and compliance
- [ ] Payment terms and conditions
- [ ] Performance tracking

**Purchase Management**
- [ ] Purchase Requisitions: Material requests
- [ ] Purchase Orders: Auto-generate from requirements
- [ ] RFQ Management: Request for quotations
- [ ] Goods Receipt: Incoming inspection
- [ ] Supplier Payments: Payment tracking

#### **4.4 Analytics & Business Intelligence**

**Executive Dashboard (SINGLE UNIFIED DASHBOARD)**
- [ ] KPI cards for all modules integrated in one dashboard
- [ ] Real-time metrics from all business areas
- [ ] Trend analysis across operations
- [ ] Custom report builder
- [ ] Data visualization
- [ ] No separate dashboards for individual modules - all analytics in main dashboard

**AI-Powered Features**
- [ ] Demand forecasting
- [ ] Quality prediction
- [ ] Inventory optimization
- [ ] Predictive maintenance

---

## 🔒 Security & Compliance

### **Data Security**
- [ ] Multi-layer encryption
- [ ] JWT-based authentication
- [✅] Role-based access control
- [ ] Audit trail logging
- [ ] Session management
- [ ] Device tracking

### **Multi-Tenant Isolation**
- [ ] Schema-per-tenant architecture
- [ ] Complete data isolation
- [ ] No cross-tenant data leaks
- [ ] Tenant-specific backups

### **Compliance**
- [ ] GDPR compliance
- [ ] Data protection
- [ ] Privacy controls
- [ ] Audit readiness
- [ ] Industry certifications

---

## 📱 Mobile & Integration

### **Mobile Application (PLANNED)**
- [ ] Cross-platform (React Native)
- [ ] Offline capability
- [ ] Barcode/QR scanning
- [ ] Push notifications
- [ ] Mobile-optimized forms

### **Third-Party Integrations (PLANNED)**
- [ ] ERP integrations (SAP, Oracle)
- [ ] Accounting software
- [ ] E-commerce platforms
- [ ] Logistics partners
- [ ] Payment gateways

---

## 🎯 Success Metrics

### **Technical KPIs**
- [ ] API Response Time: <200ms
- [ ] Application Uptime: >99.9%
- [ ] Page Load Time: <2s
- [ ] Code Coverage: >80%
- [ ] Security Vulnerabilities: Zero critical

### **Business KPIs**
- [ ] User Adoption: >70% active users
- [ ] Feature Utilization: >60% features used
- [ ] Customer Satisfaction: >4.5/5 rating
- [ ] Operational Cost Reduction: 30%
- [ ] Time to Value: <2 weeks

---

**Note**: This document focuses on functional specifications and design guidelines. Implementation details, code examples, and technical architecture are maintained in separate technical documentation. All analytics and dashboards are integrated into the single unified dashboard - no separate dashboards for individual modules.
