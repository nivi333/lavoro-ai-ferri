# Lavoro AI Ferri - Complete User Flow Documentation

## 🏭 Project Overview

**Lavoro AI Ferri** is a comprehensive **textile manufacturing ERP (Enterprise Resource Planning) system** designed specifically for the textile and garment industry. The platform provides end-to-end business management solutions for textile manufacturers, traders, and processing units.

### **What is Lavoro AI Ferri?**

**Lavoro** (Italian for "work") **AI Ferri** (Italian for "tools/instruments") represents a modern, AI-powered toolkit for textile businesses to streamline their operations, from raw material procurement to finished product delivery.

### **Industry Focus Areas**

#### **🧵 Textile Manufacturing**
- **Fabric Production**: Cotton, silk, wool, synthetic fiber processing
- **Yarn Manufacturing**: Spinning, weaving, knitting operations
- **Dyeing & Finishing**: Color processing, fabric treatment, quality control
- **Pattern & Design**: CAD integration, design management, sample tracking

#### **👕 Garment Manufacturing**
- **Cut & Sew Operations**: Pattern cutting, assembly line management
- **Quality Control**: Inspection workflows, defect tracking, compliance
- **Order Management**: Bulk orders, custom manufacturing, delivery tracking
- **Inventory Management**: Raw materials, work-in-progress, finished goods

#### **🏪 Textile Trading**
- **Wholesale Operations**: Bulk fabric trading, distributor management
- **Retail Integration**: B2B and B2C sales channels
- **Import/Export**: International trade compliance, documentation
- **Supply Chain**: Vendor management, logistics, warehousing

### **Key Business Challenges Addressed**

#### **🎯 Operational Efficiency**
- **Multi-Location Management**: Factories, warehouses, retail outlets
- **Production Planning**: Capacity planning, resource allocation, scheduling
- **Quality Assurance**: Standardized processes, compliance tracking
- **Cost Optimization**: Material waste reduction, energy efficiency

#### **📊 Business Intelligence**
- **Real-time Analytics**: Production metrics, sales performance, profitability
- **Demand Forecasting**: AI-powered demand prediction, inventory optimization
- **Financial Management**: Cost accounting, profit analysis, cash flow
- **Compliance Reporting**: Industry regulations, export documentation

#### **🤝 Stakeholder Management**
- **Multi-Tenant Architecture**: Multiple companies, different user roles
- **Supplier Integration**: Vendor portals, procurement automation
- **Customer Management**: Order tracking, delivery management, feedback
- **Team Collaboration**: Role-based access, workflow management

### **Target Users**

#### **🏢 Company Owners**
- **Textile Mill Owners**: Large-scale fabric production facilities
- **Garment Manufacturers**: Clothing production companies
- **Trading Houses**: Textile import/export businesses
- **Processing Units**: Dyeing, printing, finishing facilities

#### **👥 Operational Teams**
- **Production Managers**: Factory floor supervision, quality control
- **Inventory Managers**: Stock management, procurement planning
- **Sales Teams**: Order management, customer relationships
- **Finance Teams**: Cost accounting, financial reporting

#### **🔧 Technical Teams**
- **IT Administrators**: System management, user access control
- **Quality Controllers**: Inspection processes, compliance tracking
- **Logistics Coordinators**: Shipping, delivery, warehouse management

### **Competitive Advantages**

#### **🚀 Modern Technology Stack**
- **Cloud-Native**: Scalable, secure, accessible from anywhere
- **AI Integration**: Intelligent forecasting, automated quality control
- **Mobile-First**: Responsive design for factory floor and field operations
- **API-First**: Easy integration with existing systems and equipment

#### **🎨 Industry-Specific Features**
- **Textile-Focused Workflows**: Industry-standard processes and terminology
- **Compliance Ready**: Built-in support for textile industry regulations
- **Multi-Currency**: Global trading support with currency management
- **Localization**: Support for multiple languages and regional requirements

#### **🔒 Enterprise Security**
- **Multi-Tenant Architecture**: Complete data isolation between companies
- **Role-Based Access**: Granular permissions for different user types
- **Audit Trails**: Complete activity logging for compliance and security
- **Data Protection**: GDPR compliance, secure data handling

This ERP system transforms traditional textile businesses into modern, data-driven operations with improved efficiency, reduced costs, and enhanced competitiveness in the global market.

---

## 💻 Technology Stack & Languages

### **Backend**
- **Language**: TypeScript (Node.js)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Caching**: Redis
- **API Documentation**: Swagger/OpenAPI

### **Frontend** (Future Implementation)
- **Language**: TypeScript
- **Framework**: React.js with Vite
- **UI Library**: Ant Design + Sass/SCSS
- **State Management**: React Context API + localStorage
- **Form Handling**: Ant Design Form
- **Routing**: React Router v6
- **API State**: React Query (optional, for caching)

### **DevOps & Infrastructure**
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Cloud**: AWS/GCP (planned)
- **Monitoring**: Prometheus + Grafana (planned)

### **Testing**
- **Unit Testing**: Jest
- **API Testing**: Supertest
- **E2E Testing**: Playwright (planned)

## 🎯 Overview

This document provides a comprehensive guide to the complete user authentication, multi-tenant company management, location management, and user role system for the Lavoro AI Ferri textile manufacturing ERP system.

## 🎨 Theme & Design System

### **Color Palette**
- **Primary**: #7b5fc9 (Purple) - Main brand color for buttons, links, active states
- **Secondary**: #a2d8e5 (Light Blue) - Accent color for badges, highlights
- **Success**: #52c41a (Green) - Success states, active status
- **Error**: #ff4d4f (Red) - Error states, inactive status
- **Warning**: #faad14 (Orange) - Warning states, pending actions
- **Background**: #f5f5f5 (Light Gray) - Page backgrounds
- **Surface**: #ffffff (White) - Card backgrounds, modals

### **Typography**
- **Headings**: Poppins (600 weight)
- **Body Text**: Inter (400/500 weight)
- **Buttons**: Inter (500 weight)

### **Global UI Requirements**
- **Application Logo**: Always top-left corner on all authenticated screens
- **Logo Behavior**: Clickable, redirects to dashboard when company context exists
- **Responsive**: Mobile-first design with breakpoints at 768px, 1024px
- **Accessibility**: WCAG 2.1 AA compliance

## 🏗️ Core Architecture

### **Multi-Tenant System**
- Single user can belong to multiple companies
- Each company is a separate tenant with isolated data
- User roles vary per company (OWNER in one, EMPLOYEE in another)
- Company context switching with JWT token regeneration

### **Location Management**
- Multi-location support per company
- Headquarters designation (one per company)
- Default location setting for operations
- Location-based inventory and operations

### **User Role System**
- **OWNER**: Full company control, user management, settings
- **ADMIN**: Most features except critical company settings
- **MANAGER**: Department management, limited admin features  
- **EMPLOYEE**: Basic access, personal data management

## 🔄 Core User Journey Flow

```
Registration → Login → Company Selection → Company Creation (with Head Office) → Dashboard → Additional Locations (Optional)
```

### **Flow Details**
- **Registration**: Unique email/phone validation per user
- **Company Creation**: Automatically creates head office as default location
- **Additional Locations**: Set up later as needed after company selection
- **Location Management**: Available in dashboard after company context is established

---

## 📱 COMPLETE SCREEN LISTING

### **🔐 Authentication Screens**

#### **1.1 Registration Screen**
- **Route**: `/register`
- **Purpose**: New user account creation
- **Key Features**: Single-screen form, single email/phone field with validation, password strength, terms acceptance
- **Theme Focus**: Clean, welcoming, trust-building
- **UI Components**: Ant Design Form, Input, Button, Checkbox, Typography, AuthLayout
- **Fields**: First name, Last name, Email/Phone, Password, Confirm Password, Terms & Conditions
- **Email/Phone Field**: Single text field with smart validation for both email and phone formats
- **Help Text**: "Enter your email address or phone number with country code (e.g., +1 for US, +91 for India)"
- **Uniqueness**: Email/phone must be unique across all users in the system
- **Validation**: 
  - Email format: `user@example.com`
  - Phone format: `+1234567890` (with country code)
  - Password: 8+ chars, uppercase, lowercase, number required
- **No Multi-Step**: All fields displayed on single screen for faster registration
- **Animated Buttons**: Primary buttons with gradient animations and shimmer effects

#### **1.2 Login Screen**
- **Route**: `/login`
- **Purpose**: User authentication (NO company context created)
- **Key Features**: Single email/phone field, remember me functionality, social login
- **Theme Focus**: Quick access, professional, secure
- **UI Components**: Ant Design Form, Input, Button, Checkbox, Divider, AuthLayout
- **API Response**: User data + tokens only (NO tenantId, NO company context)
- **Post-Login**: Always redirect to company selection screen
- **Email/Phone Field**: Single text field with smart validation for both email and phone formats
- **Remember Me Feature**:
  - Checkbox: "Remember me" positioned alongside "Forgot password?" link
  - Functionality: Stores email/phone in localStorage when checked
  - Auto-populate: Automatically fills email/phone field on return visits
  - Security: Only stores identifier, never password
- **Session Storage**: User data + tokens stored, company context remains null
- **Google Sign-In**:
  - Button label: "Continue with Google" with official branding
  - Frontend flow: Trigger Google OAuth 2.0 → receive auth code/ID token → send to backend for exchange/validation
  - Backend: Exchanges code for tokens, validates Google ID token, issues app JWTs
  - Storage: Save app tokens via React Context + localStorage; do not persist Google tokens client-side
  - Redirect: On success, navigate to `/companies`
  - Error states: Disabled while loading, toast error on failure
  - Security: Use PKCE; validate state param; CSRF protection
  - Config: Google Client ID in env; document setup steps
- **Social Icons/Footer**:
  - Icons: Facebook, YouTube, Instagram (Ant Design icons)
  - Placement: Below form with divider text "Follow us"
  - Links: Open in new tab with `rel="noopener noreferrer"`
  - Accessibility: aria-label per icon; keyboard focus styles
  - Theming: Colors adapt to light/dark theme; brand color on hover
- **Animated Buttons**: Primary buttons with gradient animations and shimmer effects

#### **1.3 Forgot Password Screen**
- **Route**: `/forgot-password`
- **Purpose**: Password reset initiation
- **Key Features**: Email/phone input, security questions
- **Theme Focus**: Helpful, reassuring, clear instructions
- **UI Components**: Ant Design Form, Input, Button, Alert, Typography

---

## 🏢 COMPANY MANAGEMENT SCREENS

### **2.1 Company Selection Screen** ⭐ **CRITICAL**
- **Route**: `/companies`
- **Purpose**: Multi-tenant company selection hub
- **UI Components**: Ant Design Layout, Header, Tabs, List, Avatar, Badge, Button, Empty, Typography
- **Layout**: 
  - Header: Logo (top-left) + Create Company + User Profile (top-right)
  - Main: "Select Company / Role" title
  - Tabs: "Owner" | "Roles" 
  - List: Company cards with logo, name, status badge, industry
- **Key Features**:
  - **Owner Tab**: Companies where user is OWNER
  - **Roles Tab**: Companies with ADMIN/MANAGER/EMPLOYEE roles
  - **Active Status**: Green/Red badges with company status
  - **Click Action**: Select company → Switch context → Dashboard
- **Empty State**: Ant Design Empty component + "Create your first company" CTA
- **Theme Focus**: Professional dashboard feel, clear hierarchy

### **2.2 Company Creation Screen**
- **Route**: `/company/create`
- **Purpose**: New company setup with head office location
- **UI Components**: Ant Design Steps, Form, Input, Select, Upload, Button, Drawer/Modal
- **Layout**: Multi-step wizard with progress indicator
- **Steps**:
  1. **Basic Info**: Name, slug, industry, description
  2. **Head Office Location**: Address, city, state, country (becomes headquarters & default)
  3. **Business Details**: Established year, business type, certifications
  4. **Contact Info**: Phone, email, website, tax ID
  5. **Branding**: Logo upload, company colors
- **Key Features**:
  - **Auto-generate slug** from company name with uniqueness validation
  - **Head office** automatically becomes headquarters and default location
  - **User automatically becomes OWNER** with full permissions
  - **Immediate tenant schema creation** for data isolation
  - **Company name uniqueness** validation across system
- **Location Setup**: Head office created during company creation (not separate step)
- **Theme Focus**: Guided, step-by-step, encouraging

### **2.3 Company Settings Screen** (Owner Only)
- **Route**: `/company/settings`
- **Purpose**: Company configuration management
- **Sections**:
  - **General**: Name, industry, description, logo
  - **Locations**: Headquarters, branches, warehouses
  - **Business**: Tax info, certifications, fiscal year
  - **Integrations**: Third-party connections
  - **Danger Zone**: Company deletion, data export
- **Theme Focus**: Organized, powerful, cautionary for dangerous actions

---

## 📍 LOCATION MANAGEMENT SCREENS
*Available after company selection and context establishment*

### **3.1 Location List Screen**
- **Route**: `/locations`
- **Purpose**: Manage all company locations (additional to head office)
- **UI Components**: Ant Design Layout, Card, Button, Badge, Table, Dropdown, Modal
- **Layout**: 
  - Header: "Company Locations" + Add Location button
  - Cards: Location cards with address, type, status
  - Badges: "Headquarters", "Default", "Active/Inactive"
- **Key Features**:
  - **Location Types**: Headquarters (created during company setup), Branch, Warehouse, Factory
  - **Default Location**: One per company for operations (initially head office)
  - **Headquarters**: One per company, cannot be deleted (created during company creation)
  - **Additional Locations**: Set up as needed after company is established
  - **Bulk Actions**: Activate/deactivate multiple locations
- **Theme Focus**: Organized grid, clear status indicators

### **3.2 Location Creation/Edit Screen**
- **Route**: `/locations/create` or `/locations/:id/edit`
- **Purpose**: Add or modify additional location details
- **UI Components**: Ant Design Form, Input, Select, Switch, Button, Map integration
- **Form Sections**:
  - **Basic Info**: Name, type, description
  - **Address**: Street, city, state, country, postal code
  - **Contact**: Phone, email, manager
  - **Settings**: Default location toggle, active status
  - **Coordinates**: GPS coordinates for mapping
- **Key Features**:
  - **Address Validation**: Real-time address verification
  - **Map Integration**: Visual location confirmation
  - **Default Logic**: Only one default location allowed per company
  - **Headquarters Logic**: Cannot change headquarters type (set during company creation)
- **Theme Focus**: Detailed form, map integration, clear validation

### **3.3 Location Details Screen**
- **Route**: `/locations/:id`
- **Purpose**: View comprehensive location information
- **Sections**:
  - **Overview**: Address, contact, status, type
  - **Operations**: Inventory levels, active orders, staff
  - **Analytics**: Performance metrics, utilization
  - **Activity**: Recent transactions, changes
- **Theme Focus**: Dashboard-style, data-rich, actionable insights

---

## 👥 USER MANAGEMENT SCREENS (Owner/Admin)

### **4.1 Users List Screen**
- **Route**: `/users`
- **Purpose**: Manage company users and roles
- **Layout**:
  - Header: "Team Members" + Invite User button
  - Table: User list with avatar, name, email, role, status, last active
  - Filters: Role, status, department, location
- **Key Features**:
  - **Role Management**: Change user roles (OWNER → ADMIN → MANAGER → EMPLOYEE)
  - **Status Control**: Active/inactive user management
  - **Bulk Actions**: Role changes, status updates
  - **User Search**: Name, email, role filtering
- **Theme Focus**: Professional table, clear role hierarchy

### **4.2 User Invitation Screen**
- **Route**: `/users/invite`
- **Purpose**: Invite new users to company
- **Form Fields**:
  - **User Info**: Email, first name, last name
  - **Role Assignment**: Select role with permissions preview
  - **Location Assignment**: Default location for user
  - **Department**: Optional department assignment
  - **Welcome Message**: Custom invitation message
- **Key Features**:
  - **Role Preview**: Show permissions for selected role
  - **Bulk Invites**: CSV upload for multiple invitations
  - **Custom Message**: Personalized invitation text
- **Theme Focus**: Welcoming, clear role explanation

### **4.3 User Profile Screen** (Individual)
- **Route**: `/users/:id`
- **Purpose**: View/edit individual user details
- **Sections**:
  - **Personal**: Avatar, name, contact, location
  - **Role & Permissions**: Current role, specific permissions
  - **Activity**: Login history, recent actions
  - **Performance**: KPIs, achievements (if applicable)
- **Key Features**:
  - **Role History**: Track role changes over time
  - **Permission Details**: Granular permission view
  - **Activity Timeline**: Comprehensive user activity
- **Theme Focus**: Professional profile, detailed analytics

---

## 🏠 DASHBOARD SCREENS

### **5.1 Main Dashboard**
- **Route**: `/dashboard`
- **Purpose**: Company overview and quick actions
- **Layout**:
  - **Header**: Logo, company switcher, search, notifications, user menu
  - **Sidebar**: Navigation menu (collapsible)
  - **Main**: KPI cards, charts, recent activity, quick actions
- **KPI Cards**:
  - **Users**: Total active users, recent logins
  - **Locations**: Active locations, utilization
  - **Activity**: Recent actions, system health
  - **Growth**: User growth, location expansion
- **Key Features**:
  - **Company Switcher**: Quick context switching
  - **Real-time Updates**: Live activity feed
  - **Quick Actions**: Common tasks shortcuts
- **Theme Focus**: Executive dashboard, data-driven, actionable

### **5.2 Analytics Dashboard**
- **Route**: `/analytics`
- **Purpose**: Detailed company analytics and reporting
- **Sections**:
  - **User Analytics**: Login patterns, role distribution, activity heatmaps
  - **Location Analytics**: Utilization, performance, growth
  - **System Analytics**: Performance metrics, usage statistics
- **Key Features**:
  - **Date Range Filters**: Custom reporting periods
  - **Export Options**: PDF, Excel, CSV reports
  - **Drill-down**: Detailed views from summary data
- **Theme Focus**: Data-heavy, professional charts, export-friendly

---

## ⚙️ SETTINGS SCREENS

### **6.1 Account Settings**
- **Route**: `/settings/account`
- **Purpose**: Personal account management
- **Sections**:
  - **Profile**: Name, email, phone, avatar
  - **Security**: Password, 2FA, login notifications
  - **Preferences**: Language, timezone, notifications
  - **Privacy**: Data sharing, activity visibility
- **Theme Focus**: Personal, secure, customizable

### **6.2 Company Settings** (Owner/Admin)
- **Route**: `/settings/company`
- **Purpose**: Company-wide configuration
- **Sections**:
  - **General**: Company info, branding, contact
  - **Locations**: Headquarters, default settings
  - **Users**: Default roles, invitation settings
  - **Integrations**: API keys, third-party services
  - **Billing**: Subscription, usage, payments
- **Theme Focus**: Administrative, comprehensive, organized

---

## 🎯 KEY FUNCTIONALITY DETAILS

### **Multi-Tenant Architecture**
- **User Context**: Single user across multiple companies
- **Role Variation**: Different roles per company
- **Data Isolation**: Complete tenant separation
- **Context Switching**: Seamless company switching with token refresh

### **Location Management System**
- **Initial Setup**: Head office created automatically during company creation
- **Hierarchy**: Headquarters (Head Office) → Branches → Warehouses → Factories
- **Default Logic**: One default location per company (initially head office)
- **Headquarters Rule**: One headquarters per company, created during company setup, cannot be deleted
- **Additional Locations**: Set up as needed after company context is established
- **Address Validation**: Real-time address verification and geocoding
- **Operational Integration**: Location-based inventory, orders, reporting

### **User Role System**
- **OWNER**: Company creation, user management, all settings, billing
- **ADMIN**: User management, most settings, reporting (no billing/deletion)
- **MANAGER**: Department management, user oversight, limited settings
- **EMPLOYEE**: Personal data, assigned tasks, basic reporting

### **Security & Access Control**
- **JWT Tokens**: Short-lived access, long-lived refresh
- **Role-Based Permissions**: Granular feature access control
- **Company Context**: Permissions vary by company membership
- **Session Management**: Device tracking, remote logout, security monitoring

---

## 🔐 AUTHENTICATION & SESSION MANAGEMENT

### **Login Flow & Token Management**

#### **Login API Response** (`POST /api/auth/login`)
```json
{
  "success": true,
  "user": {
    "id": "userUUID",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": 3600
  }
}
```

**❌ Login API does NOT include:**
- `tenantId` (user can belong to multiple companies)
- Company context (determined after company selection)
- Role information (varies per company)

#### **Company Switch API Response** (`POST /api/v1/companies/:companyId/switch`)
```json
{
  "success": true,
  "company": {
    "id": "companyUUID",
    "name": "Textile Corp",
    "slug": "textile-corp"
  },
  "context": {
    "tenantId": "tenant_uuid_for_this_company",
    "role": "OWNER",
    "permissions": ["user_management", "company_settings"]
  },
  "tokens": {
    "accessToken": "new_jwt_with_company_context",
    "refreshToken": "new_refresh_token",
    "expiresIn": 3600
  }
}
```

### **Frontend Session Storage**

#### **After Login (No Company Context)**
```typescript
// Stored via React Context API + localStorage
{
  user: {
    id: "userUUID",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com"
  },
  tokens: {
    accessToken: "jwt_token",
    refreshToken: "refresh_token",
    expiresIn: 3600
  },
  // No company context yet
  currentCompany: null,
  tenantId: null,
  role: null
}
```

#### **After Company Selection**
```typescript
// Updated React Context state + localStorage
{
  user: {
    id: "userUUID",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com"
  },
  currentCompany: {
    id: "companyUUID",
    name: "Textile Corp",
    slug: "textile-corp"
  },
  context: {
    tenantId: "tenant_uuid",
    role: "OWNER",
    permissions: ["user_management", "company_settings"]
  },
  tokens: {
    accessToken: "new_jwt_with_context",
    refreshToken: "new_refresh_token",
    expiresIn: 3600
  }
}
```

### **Session Cleanup Triggers**

#### **Automatic Cleanup (Clear All Data)**
- **Token Expiration**: Access token expires and refresh fails
- **Authentication Error**: 401/403 responses from API
- **Manual Logout**: User clicks logout
- **Session Timeout**: Configurable inactivity timeout
- **Security Breach**: Suspicious activity detection

#### **Cleanup Implementation**
```typescript
// Clear all session data
const clearSession = (logout: () => void) => {
  // Clear React Context auth state
  logout();
  
  // Clear localStorage
  localStorage.removeItem('auth-storage');
  localStorage.removeItem('company-context');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Redirect to login
  navigate('/login');
};
```

### **Multi-Tenant Context Management**

#### **Company Switching Flow**
1. **User selects different company** from company list
2. **Frontend calls switch API** with new companyId
3. **Backend validates access** and generates new tokens with company context
4. **Frontend updates session** with new tenantId, role, permissions
5. **UI refreshes** with new company context

#### **Context Validation**
- **Every API call** includes current tenantId in headers
- **Backend validates** user has access to requested tenant
- **Frontend handles** context mismatches gracefully

### **Security Best Practices**

#### **Token Security**
- **Access tokens**: Short-lived (1 hour), contain company context
- **Refresh tokens**: Long-lived (7 days), stored securely
- **Automatic refresh**: 5 minutes before expiration
- **Secure storage**: HttpOnly cookies for production (localStorage for development)

#### **Session Security**
- **CSRF protection**: Anti-CSRF tokens for state-changing operations
- **XSS protection**: Sanitize all user inputs
- **Session fixation**: New session ID after login/company switch
- **Concurrent sessions**: Track and limit active sessions per user

This comprehensive documentation covers all essential screens, functionality, and architectural decisions for the Lavoro AI Ferri multi-tenant ERP system.
- Real-time validation for email/phone

### **Backend Response**:

```typescript
{
  success: boolean;
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

### **Post-Login Flow**:

1. Save tokens and user data
2. Setup token refresh
3. Fetch user's companies (`GET /api/v1/companies`)
4. **Always redirect to company list** (`/companies`) regardless of company count
5. Company list handles both existing companies and empty state

---

## 🏢 3. COMPANY LIST/SELECTION FLOW

### **Component**: `CompanyListPage.tsx` _(CRITICAL - TO BE IMPLEMENTED)_

### **Route**: `/companies`

### **API Endpoints**:

- `GET /api/v1/companies` - Get user's companies with roles
- `POST /api/v1/companies/:tenantId/switch` - Switch company context

### **Layout Structure**:

#### **Header Section**:

- **Top-left**: Application logo (permanent watermark)
- **Top-right**: Two action buttons
  - "Create Company" button (primary action)
  - User Profile avatar icon (clickable, opens profile menu)

#### **Main Content**:

- **Title**: "Select Company" (centered or left-aligned)
- **Tab System**: Two tabs below title
  - **"Owner" Tab**: Shows companies where user is OWNER
  - **"Roles" Tab**: Shows companies where user has other roles (ADMIN, MANAGER, EMPLOYEE)

#### **Company List Display**:

- **Format**: Single-line list items (not cards)
- **Layout**: Each company in a horizontal row
- **Click Behavior**: Click anywhere on row → Switch to company → Redirect to dashboard
- **Row Information**:
  - Company logo (small, left side)
  - Company name (primary text)
  - User's role badge (OWNER, ADMIN, MANAGER, EMPLOYEE)
  - Industry type (secondary text)

#### **Empty State** (No Companies):

- **Icon**: Empty box icon (ANT Design)
- **Message**: "No companies found"
- **Description**: "Create your first company to get started"
- **Action**: Prominent "Create Company" button

### **Tab Functionality**:

- **Owner Tab**: Displays companies where `role === 'OWNER'`
- **Roles Tab**: Displays companies where `role !== 'OWNER'`
- **Active Tab**: Highlighted with brand color (#7b5fc9)
- **Tab Switching**: Instant filter without API calls

### **Actions**:

- **Click Company Row**: Switch company context → Dashboard
- **Create Company**: Opens company creation wizard/drawer
- **User Profile**: Opens profile dropdown menu

### **Responsive Design**:

- **Mobile**: Stack header elements, single column list
- **Tablet/Desktop**: Horizontal header layout, optimized list spacing

---

## 🏭 4. COMPANY CREATION FLOW

### **Component**: `CompanyCreationWizard.tsx` _(TO BE IMPLEMENTED)_

### **Route**: `/company/create`

### **API Endpoint**: `POST /api/v1/companies`

### **Multi-Step Wizard Process**:

#### **Step 1: Basic Information**

**Fields**:

- `name` (required, 2-255 chars) - Company name
- `slug` (auto-generated from name, editable, lowercase + hyphens only)
- `industry` (optional, dropdown) - Textile, Garment, Knitting, etc.
- `description` (optional, max 1000 chars) - Brief company description

**Validation**:

- Slug uniqueness check
- Auto-generate slug from company name
- Industry selection from predefined list

#### **Step 2: Contact & Location**

**Fields**:

- `phone` (optional, max 20 chars) - Company phone
- `email` (optional, valid email) - Company email
- `website` (optional, valid URL) - Company website
- `address` (optional, max 500 chars) - Street address
- `city` (optional, max 100 chars)
- `state` (optional, max 100 chars)
- `country` (optional, dropdown)
- `postalCode` (optional, max 20 chars)

**Features**:

- Country dropdown with search
- Auto-format phone numbers
- Website URL validation

#### **Step 3: Business Details**

**Fields**:

- `establishedYear` (optional, 1800 - current year)
- `businessType` (optional, dropdown) - Manufacturing, Trading, Both
- `certifications` (optional, multi-select) - ISO, OEKO-TEX, GOTS, etc.
- `taxId` (optional, max 100 chars) - Tax identification number
- `currency` (optional, 3-letter code) - USD, EUR, INR, etc.
- `timezone` (optional, dropdown) - Company timezone

**Features**:

- Year picker/dropdown
- Multi-select certifications
- Currency dropdown with search
- Timezone selection with UTC offset

#### **Step 4: Company Profile**

**Fields**:

- `logo` (optional, image upload) - Company logo

**Features**:

- Drag & drop logo upload
- Image cropping to circular format
- File size validation (max 2MB)
- Supported formats: PNG, JPG, SVG

### **Backend Schema** (Complete):

```typescript
{
  name: string;              // Required
  slug: string;              // Required, unique
  industry?: string;         // Optional
  description?: string;      // Optional, max 1000 chars
  establishedYear?: number;  // Optional, 1800-current year
  businessType?: string;     // Manufacturing | Trading | Both
  certifications?: string[]; // Optional array
  address?: string;          // Optional, max 500 chars
  city?: string;            // Optional
  state?: string;           // Optional
  country?: string;         // Optional
  postalCode?: string;      // Optional
  phone?: string;           // Optional
  email?: string;           // Optional, valid email
  website?: string;         // Optional, valid URL
  taxId?: string;           // Optional
  currency?: string;        // Optional, 3-letter code
  timezone?: string;        // Optional
  logo?: string;            // Optional, URL
}
```

### **Post-Creation Flow**:

1. Company created with user as OWNER
2. Tenant schema created in database
3. New JWT tokens issued with company context
4. Redirect to dashboard

---

## 📊 5. DASHBOARD FLOW

### **Component**: `Dashboard.tsx`

### **Route**: `/dashboard`

### **Layout**: `MainLayout.tsx`

### **Dashboard Elements**:

- **Header**: Logo, search, notifications, user profile
- **Sidebar**: Navigation menu (collapsible)
- **Main Content**: KPI cards, recent activity, pending approvals
- **Company Switcher**: Multi-tenant company selection

### **KPI Cards**:

- Total Orders
- Production Status
- Inventory Levels
- Quality Metrics
- Financial Summary

### **Recent Activity Feed**:

- Order updates
- Production milestones
- Quality alerts
- User actions

---

## 👤 6. PROFILE MANAGEMENT FLOW

### **Components**: Multiple profile-related components

### **Routes**: Various profile routes

#### **6.1 User Profile Page**

**Route**: `/profile`
**Component**: `UserProfilePage.tsx`

**Sections**:

- **Personal Information**: Name, email, phone
- **Contact Information**: Address details
- **Account Information**: Account settings
- **Avatar Upload**: Profile picture with cropping

**Features**:

- Edit/view mode toggle
- Form validation with react-hook-form + zod
- Auto-save functionality
- Avatar upload with image cropping

#### **6.2 Password Change**

**Route**: `/profile/password`
**Component**: `PasswordChangeForm.tsx`

**Fields**:

- Current password (required)
- New password (complex validation)
- Confirm new password

**Features**:

- Real-time password strength indicator
- Visual requirements checklist
- Security tips and warnings

#### **6.3 Security Settings**

**Route**: `/profile/security`
**Component**: `SecuritySettings.tsx`

**Features**:

- Two-factor authentication toggle
- Login notifications
- Session timeout settings
- IP restrictions
- Security score visualization
- Account deletion (danger zone)

#### **6.4 Device Management**

**Route**: `/profile/devices`
**Component**: `DeviceManagement.tsx`

**Features**:

- Active/inactive device tracking
- Device type detection (desktop, mobile, tablet)
- Location and IP tracking
- Last active timestamps
- Individual device revocation
- Bulk logout functionality

#### **6.5 Activity Log**

**Route**: `/profile/activity`
**Component**: `ActivityLog.tsx`

**Features**:

- Comprehensive activity tracking
- Activity type filtering
- Time range filtering (24h, 7d, 30d, 90d)
- Search functionality
- export default functionality
- Success/failure tracking

---

## 🔐 7. AUTHENTICATION INTEGRATION

### **Token Management**:

- JWT access tokens (short-lived)
- Refresh tokens (long-lived)
- Automatic token refresh (5 minutes before expiry)
- Token storage in localStorage

### **Role-Based Access Control**:

- **OWNER**: Full company access, can invite users
- **ADMIN**: Most features, limited company settings
- **MANAGER**: Department management, user oversight, limited settings
- **EMPLOYEE**: Basic access, own data management

### **Multi-Tenant Architecture**:

- Users can belong to multiple companies
- Company context switching
- Schema-per-tenant data isolation
- Role varies per company

---

## 🛠️ 8. TECHNICAL IMPLEMENTATION

### **Frontend Stack**:

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Sass/SCSS + Ant Design components
- **State Management**: React Context API + localStorage
- **Forms**: react-hook-form + zod validation
- **Routing**: React Router with route guards
- **Icons**: ANT Design icons

### **Backend Stack**:

- **Framework**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with schema-per-tenant
- **Authentication**: JWT tokens
- **Validation**: Joi schemas
- **API**: RESTful endpoints

### **Design System**:

- **Primary Color**: #7b5fc9 (purple)
- **Accent Color**: #a2d8e5 (light blue)
- **Typography**: Poppins (headings), Inter (body)
- **Logo**: Always top-left corner
- **Buttons**: Medium/small sizes, compact padding

---

## 📱 9. RESPONSIVE DESIGN

### **Breakpoints**:

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### **Adaptive Features**:

- Collapsible sidebar on mobile
- Responsive form layouts
- Touch-friendly buttons
- Mobile-optimized navigation

---

## 🎨 10. UI/UX GUIDELINES

### **Form Guidelines**:

- **< 5 fields**: Modal
- **5-20 fields**: Drawer component
- **> 20 fields**: Separate screen/wizard

### **Action Buttons**:

- Cancel & Save always at bottom
- Consistent placement across all forms
- Primary actions use brand colors

### **Table Actions**:

- Multiple actions in "More" menu (three dots)
- ANT Design icons for actions
- Consistent action patterns

### **Empty States**:

- ANT Design icons for illustrations
- Minimal text
- Clear call-to-action buttons

---

## 🚀 11. DEPLOYMENT & DEVELOPMENT

### **Development Tools**:

- **Storybook**: Component development and testing
- **Vitest**: Unit and integration testing
- **Bundle Analyzer**: Performance optimization
- **CI/CD**: GitHub Actions with Netlify deployment

### **Environment Configuration**:

- Development: `http://localhost:5173` (frontend), `http://localhost:3000` (backend)
- Staging: Netlify preview deployments
- Production: Netlify with custom domain

---

## 📋 12. CURRENT IMPLEMENTATION STATUS

### **✅ COMPLETED**:

- User registration wizard (3 steps) with corrected API integration
- User login form with validation and proper backend integration
- Authentication service with automatic token refresh
- Role-based access control system (OWNER, ADMIN, MANAGER, EMPLOYEE)
- User profile management (complete suite)
- Security settings and device management
- Activity logging system
- Password change form with strength indicator
- Avatar upload with image cropping
- Backend company API with full multi-tenant schema
- Frontend company service interface with all operations
- Company creation wizard with complete form validation
- Company switching with JWT token regeneration
- User invitation system with proper role assignment
- Logout confirmation modal with proper cleanup
- Authentication integration with corrected flow (no company fields in auth responses)

### **🔄 IN PROGRESS**:

- Company list/selection screen implementation (CRITICAL MISSING)

### **📋 TODO**:

- Dashboard KPI cards and widgets with company context
- Manufacturing management modules
- Inventory management system
- Quality control features
- Financial management tools
- Layout components (header, sidebar) for authenticated screens

---

## 🔗 13. API ENDPOINTS SUMMARY

### **Authentication**:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### **Company Management** (✅ COMPLETED):

- `GET /api/v1/companies` - Get user's companies with roles
- `POST /api/v1/companies` - Create new company (user becomes OWNER)
- `GET /api/v1/companies/:tenantId` - Get company details
- `POST /api/v1/companies/:tenantId/switch` - Switch company context with token regeneration
- `POST /api/v1/companies/:tenantId/invite` - Invite user to company with role assignment
- `POST /api/v1/companies/:tenantId/accept-invitation` - Accept invitation and join company

### **User Management**:

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/change-password` - Change password
- `GET /api/v1/users/activity` - Get activity log
- `GET /api/v1/users/devices` - Get user devices
- `DELETE /api/v1/users/devices/:deviceId` - Revoke device

---

This documentation provides a complete overview of the current implementation and planned features for the Lavoro AI Ferri textile manufacturing ERP system. All components follow the established design guidelines and maintain consistency across the application.
