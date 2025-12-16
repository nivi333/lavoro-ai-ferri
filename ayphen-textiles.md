# 🏭 AYPHEN TEXTILES - Multi-Tenant Textile Manufacturing ERP System
## Complete Project Specification & Implementation Guide

---

## 📌 PROJECT OVERVIEW

**Ayphen Textiles** is a comprehensive, multi-tenant ERP system designed specifically for the textile manufacturing industry. It combines the robust **Ayphen theme system** (styled-components + TypeScript tokens) with complete textile operations management including production, inventory, quality control, and financial management.

**Key Differentiators:**
- **Ayphen Theme Architecture**: TypeScript-based theme tokens with styled-components (NOT SCSS)
- **Multi-Tenant SaaS**: Complete data isolation with company-based tenancy
- **Textile-Specific**: Fabric production, yarn manufacturing, dyeing, garment production
- **Enterprise-Grade**: Role-based access, audit trails, comprehensive reporting

---

## 💻 TECHNOLOGY STACK

### **Backend**
- **Language**: TypeScript (Node.js)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (3 days expiration)
- **Caching**: Redis (Docker containerized)
- **API Documentation**: Swagger/OpenAPI

### **Frontend**
- **Language**: TypeScript
- **Framework**: React.js with Vite
- **UI Library**: Ant Design 5.27.1
- **Styling**: **Styled Components 6.1.19** (PRIMARY) - NO SCSS
- **Theme System**: Custom TypeScript tokens (Ayphen theme)
- **State Management**: React Context API + localStorage
- **Form Handling**: React Hook Form
- **Routing**: React Router v6
- **Date Handling**: dayjs
- **Icons**: react-icons + Ant Design icons

### **DevOps & Infrastructure**
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Testing**: Jest (Unit), Supertest (API)

---

## 🎨 AYPHEN THEME SYSTEM (MANDATORY)

### **Theme Architecture**

**CRITICAL**: This project uses the **Ayphen theme system** with TypeScript tokens and styled-components. **DO NOT USE SCSS**.

**File Structure:**
```
src/theme/
├── index.ts                    # Main theme exports
├── theme-provider.tsx          # React context provider
├── hooks.ts                    # useToken, useGlobalTheme
├── utils.ts                    # toRem, toPx, pxToRem
└── color-tokens/
    ├── light.tsx              # Light mode colors
    └── dark.tsx               # Dark mode colors
```

### **Color Palette (Ayphen Standard)**

#### **Primary Colors**
- **Primary**: `#df005c` (Pink) - Main brand color, buttons, links, active states
- **Success**: `#52c41a` (Green) - Success states, active status
- **Error**: `#ff4d4f` (Red) - Error states, inactive status
- **Warning**: `#faad14` (Orange) - Warning states, pending actions
- **Info**: `#1677ff` (Blue) - Info states, notifications

#### **Light Mode Colors**
```typescript
export const lightColorTokens = {
  // Primary
  colorPrimary: "#df005c",
  colorPrimaryHover: "#eb2671",
  colorPrimaryActive: "#b80053",
  
  // Backgrounds
  colorBgContainer: "#ffffff",
  colorBgElevated: "#ffffff",
  colorBgLayout: "#f5f5f5",
  
  // Text
  colorText: "#000000e0",           // rgba(0,0,0,0.88)
  colorTextSecondary: "#000000a6",  // rgba(0,0,0,0.65)
  colorTextTertiary: "#00000073",   // rgba(0,0,0,0.45)
  
  // Borders
  colorBorder: "#d9d9d9",
  colorBorderSecondary: "#f0f0f0",
  
  // ... (see docs/02-COLOR-TOKENS.md for complete list)
};
```

#### **Dark Mode Colors**
```typescript
export const darkColorTokens = {
  // Primary
  colorPrimary: "#c10351",
  
  // Backgrounds
  colorBgContainer: "#141414",
  colorBgElevated: "#1f1f1f",
  colorBgLayout: "#000000",
  
  // Text
  colorText: "rgba(255,255,255,0.85)",
  colorTextSecondary: "rgba(255,255,255,0.65)",
  
  // Borders
  colorBorder: "#424242",
  colorBorderSecondary: "#303030",
  
  // ... (see docs/02-COLOR-TOKENS.md for complete list)
};
```

### **Typography System**

```typescript
const fontTokens = {
  // Font Sizes
  fontSize: 13,          // Base
  fontSizeSM: 12,        // Small
  fontSizeLG: 16,        // Large
  fontSizeXL: 20,        // Extra Large
  fontSizeXS: 10,        // Extra Small
  
  // Heading Sizes
  fontSizeHeading1: 38,
  fontSizeHeading2: 30,
  fontSizeHeading3: 24,
  fontSizeHeading4: 22,
  fontSizeHeading5: 16,
  
  // Font Weights
  fontWeightThin: 100,
  fontWeightLight: 300,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
  fontWeightExtraBold: 800,
  fontWeightMax: 900,
};
```

### **Spacing & Sizing**

```typescript
const marginAndPadding = {
  // Margin
  marginZero: 0,
  marginXXS: 4,
  marginXS: 8,
  marginSM: 12,
  margin: 16,
  marginMD: 20,
  marginLG: 24,
  marginXL: 32,
  marginXXL: 48,
  
  // Padding (same values)
  paddingZero: 0,
  paddingXXS: 4,
  // ... etc
};

const borderRadius = {
  borderRadiusZero: 0,
  borderRadiusXS: 2,
  borderRadiusSM: 4,
  borderRadius: 6,        // Default
  borderRadiusLG: 8,
};
```

### **Theme Provider Implementation**

```typescript
// src/theme/theme-provider.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import { ThemeConfig } from "antd";
import { themeTokens, ThemeTokenType } from ".";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  antTheme: ThemeConfig;
  styledTheme: ThemeTokenType;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider(props: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("isDarkMode");
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  const toggleTheme = () => {
    setIsDarkMode((prevMode: boolean) => {
      const newMode = !prevMode;
      localStorage.setItem("isDarkMode", JSON.stringify(newMode));
      return newMode;
    });
  };

  const antTheme = isDarkMode
    ? themeTokens.antThemeConfigDark
    : themeTokens.antThemeConfigLight;

  const styledTheme = isDarkMode
    ? themeTokens.styledComponentsTokensDark
    : themeTokens.styledComponentTokensLight;

  return (
    <ThemeContext.Provider
      value={{ isDarkMode, toggleTheme, antTheme, styledTheme }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
}

export const useGlobalTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
```

### **Component Theming (Ant Design)**

```typescript
// Light Mode
const antThemeConfigLight: ThemeConfig = {
  token: antThemeTokenLight,
  components: {
    Layout: {
      bodyBg: "#ffffff",
      siderBg: "#ffffff",
      triggerBg: "#ffffff",
      triggerColor: "#df005c",
      headerHeight: 60,
    },
    Input: {
      colorBgContainer: "#f3f3f5",
      activeBorderColor: "#00000040",
      controlOutline: "#00000026",
      lineWidth: 1,
      lineWidthFocus: 1,
    },
    Select: {
      selectorBg: "#f3f3f5",
      activeBorderColor: "#00000040",
      // ... (see docs/05-COMPONENT-THEMING.md)
    },
    // ... more components
  },
};

// Dark Mode
const antThemeConfigDark: ThemeConfig = {
  token: antThemeTokenDark,
  components: {
    Layout: {
      bodyBg: "#141414",
      siderBg: "#181818ff",
      triggerBg: "#181818ff",
      triggerColor: "#ffffff",
    },
    Input: {
      colorBgContainer: "#1e1e1e",
      activeBorderColor: "#595959",
      // ... (see docs/05-COMPONENT-THEMING.md)
    },
    // ... more components
  },
};
```

### **Theme Hooks & Utilities**

```typescript
// src/theme/hooks.ts
import { theme } from 'antd';

export const useToken = () => {
  const { token } = theme.useToken();
  return token;
};

// src/theme/utils.ts
export const toRem = (value: number) => value + 'rem';
export const toPx = (value: number) => value + 'px';
export const pxToRem = (value: number) => value / 16 + 'rem';

export interface CommonStyledProps {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
```

### **Styled Components Usage**

```typescript
import styled from 'styled-components';
import { pxToRem } from '@/theme';

const Card = styled.div`
  background-color: ${(props) => props.theme.colorBgContainer};
  color: ${(props) => props.theme.colorText};
  padding: ${(props) => pxToRem(props.theme.padding)};
  border-radius: ${(props) => pxToRem(props.theme.borderRadius)};
  border: 1px solid ${(props) => props.theme.colorBorder};
`;

const Button = styled.button`
  background-color: ${(props) => props.theme.colorPrimary};
  color: ${(props) => props.theme.colorWhite};
  font-size: ${(props) => pxToRem(props.theme.fontSize)};
  font-weight: ${(props) => props.theme.fontWeightMedium};
  padding: ${(props) => pxToRem(props.theme.paddingSM)} ${(props) => pxToRem(props.theme.padding)};
  border-radius: ${(props) => pxToRem(props.theme.borderRadius)};
  
  &:hover {
    background-color: ${(props) => props.theme.colorPrimaryHover};
  }
`;
```

### **App Integration**

```typescript
// src/App.tsx
import { ThemeProvider, useGlobalTheme } from './theme';
import { ConfigProvider } from 'antd';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

function ThemedApp() {
  const { antTheme, styledTheme } = useGlobalTheme();
  
  return (
    <ConfigProvider theme={antTheme}>
      <StyledThemeProvider theme={styledTheme}>
        <YourApp />
      </StyledThemeProvider>
    </ConfigProvider>
  );
}
```

---

## 🏗️ REUSABLE COMPONENTS (Ayphen Standard)

### **Button Components**

```typescript
import { Button as AntButton, ButtonProps } from "antd";
import { PlusIcon, EditIcon, DeleteIcon } from "./icons";

export function Button(props: ButtonProps) {
  return <AntButton {...props} size={props.size ?? "middle"} />;
}

export function AddNewButton(props: ButtonProps) {
  return (
    <Button
      {...props}
      icon={props.icon ?? <PlusIcon />}
      type={props.type ?? "primary"}
    >
      {props.children}
    </Button>
  );
}

export function EditButton(props: ButtonProps) {
  return (
    <Button {...props} icon={props.icon ?? <EditIcon />}>
      {props.children}
    </Button>
  );
}

export function DeleteButton(props: ButtonProps) {
  return (
    <Button {...props} icon={props.icon ?? <DeleteIcon />} danger>
      {props.children}
    </Button>
  );
}
```

### **Form Components**

```typescript
// Input with auto-trim
export const Input = forwardRef<InputRef, InputProps>((props, ref) => {
  const { value, onChange, onBlur, ...restProps } = props;
  const [trimmedValue, setTrimmedValue] = useState(value);

  const handleBlur = (e) => {
    const trimmed = e.target.value.trim();
    setTrimmedValue(trimmed);
    onBlur?.({ ...e, target: { ...e.target, value: trimmed } });
    onChange?.({ ...e, target: { ...e.target, value: trimmed } });
  };

  return (
    <AntInput
      ref={ref}
      {...restProps}
      value={trimmedValue}
      onChange={(e) => setTrimmedValue(e.target.value)}
      onBlur={handleBlur}
    />
  );
});

// Select with search
export function Select<T>(props: SelectProps<T>) {
  return (
    <AntSelect
      {...props}
      showSearch={props.showSearch ?? true}
      allowClear={props.allowClear ?? true}
      popupMatchSelectWidth={props.popupMatchSelectWidth ?? false}
    />
  );
}
```

### **Drawer Component**

```typescript
import styled from 'styled-components';
import { pxToRem } from '@/theme';

export const DrawerChildrenDiv = styled.div<{ marginBottom?: boolean }>`
  background-color: ${(props) => props.theme.colorBgContainer};
  padding: ${(props) => pxToRem(props.theme.padding)};
  border-radius: ${(props) => pxToRem(props.theme.borderRadius)};
  margin-bottom: ${(props) =>
    props.marginBottom ? pxToRem(props.theme.margin) : '0'};
`;

export const DrawerTitle = styled(Typography.Text)`
  font-weight: ${(props) => props.theme.fontWeightMedium};
  font-size: ${(props) => pxToRem(props.theme.fontSizeXL)};
`;
```

---

## 📋 CORE FUNCTIONAL MODULES

### **MODULE 1: Authentication & User Management**

#### **User Registration**
- Single-screen registration form
- Fields: First Name, Last Name, Email/Phone (smart validation), Password, Confirm Password
- Email/Phone validation with country code support (+1, +91, etc.)
- Password strength validation (8+ chars, uppercase, lowercase, number)
- Global email/phone uniqueness (one email = one user across all companies)
- Users can belong to multiple companies with different roles

#### **User Login**
- Email or Phone login (single field)
- Password field with show/hide toggle
- Remember me functionality
- JWT token generation (3 days expiration)
- Automatic token refresh

#### **Role-Based Access Control**
- **OWNER**: Full access to all features, company settings, user management
- **ADMIN**: All features except company deletion, can manage users
- **MANAGER**: Operational features, limited user management
- **EMPLOYEE**: Basic operational features, no user/settings access

---

### **MODULE 2: Company Management (Multi-Tenant)**

#### **Company Creation**
- Drawer-based form (not separate page)
- **Section 1 - Basic Information:**
  - Company Logo: Upload with base64 encoding (2MB limit, JPG/PNG)
  - Company Name: Required, unique
  - Industry: Dropdown (Textile Manufacturing, Garment Production, etc.)
  - Description: Optional text area
- **Section 2 - Head Office Location:**
  - Address Line 1, Address Line 2, City, State, Pincode
  - Automatically becomes headquarters AND default location
- **Section 3 - Business Details:**
  - Established Date, Business Type, Certifications
- User automatically becomes OWNER with full permissions

#### **Company Selection**
- Tab System: "Owner" | "Roles" tabs
- Single-line list items with company info
- Role Badges: OWNER (Blue), ADMIN (Purple), MANAGER (Green), EMPLOYEE (Orange)
- Click anywhere on row → Switch context → Dashboard

#### **User Invitation System**
- Simple modal with 2 fields:
  - Email/Phone: Single field supporting both formats
  - Role: ADMIN, MANAGER, EMPLOYEE (no OWNER invites)
- Creates pending invitation (not direct membership)
- JWT Token: 3 days expiration

---

### **MODULE 3: Location Management**

#### **Location Creation/Edit**
- Drawer-based form (720px width)
- **Section 1 - Basic Information:**
  - Location Name, Type (Headquarters, Branch, Warehouse, Factory)
  - Location Image: Drag & drop upload (2MB limit)
- **Section 2 - Address Details:**
  - Country, Address Line 1, Address Line 2, City, State, Pincode
- **Section 3 - Contact Information:**
  - Email, Phone, Website
- **Section 4 - Settings (OWNER/ADMIN only):**
  - Is Default: Toggle (only one per company, used in financial documents)
  - Is Headquarters: Toggle (only one per company)
  - Is Active: Toggle (in header, disabled on create, enabled on edit)
- First location automatically becomes default + headquarters
- Cannot delete or deactivate default/headquarters location

---

### **MODULE 4: Product Management**

#### **Product Master Data**
- Product Code: Auto-generated or manual (unique within company)
- Product Name: Required
- Category: Dropdown (with ability to create new categories)
- SKU/Barcode: Optional, unique if provided
- Unit of Measure (UOM): PCS, MTR, YDS, KG, LBS, ROLL, BOX, CTN, DOZ, SET, BALE, CONE, SPOOL
- Product Type: OWN_MANUFACTURE, VENDOR_SUPPLIED, OUTSOURCED, RAW_MATERIAL, FINISHED_GOODS
- Active Toggle: In drawer header

#### **Pricing Management**
- Cost Price: Purchase/manufacturing cost
- Selling Price: Default selling price
- Markup Percentage: Auto-calculated or manual

#### **Inventory Tracking**
- Current Stock Quantity: Real-time stock level
- Reorder Level: Minimum stock threshold

#### **Textile-Specific Fields**
- Material, Color, Size, Weight

---

### **MODULE 5: Inventory Management**

#### **Multi-Location Inventory Tracking**
- Location-Based Stock: Track stock separately for each location
- Real-Time Stock Levels: Current quantity per location
- Available Stock: Total stock minus reservations
- Reserved Stock: Stock allocated to orders

#### **Stock Movement Management**
- Movement Types: PURCHASE, SALE, TRANSFER, ADJUSTMENT, PRODUCTION, RETURN, DAMAGE
- Auto-Update: Inventory levels update automatically
- Validation: Cannot move more than available stock
- Audit Trail: Complete history with user, timestamp, before/after quantities

#### **Low Stock Alerts**
- Alert Triggers: When stock falls below reorder level
- Alert Actions: Acknowledge, Create PO, Adjust Reorder Level, Dismiss
- Alert Dashboard: Widget showing all active alerts

---

### **MODULE 6: Order Management**

#### **Sales Order Creation**
- Order Number: Auto-generated (SO001, SO002, etc.)
- Customer: Searchable dropdown
- Order Date, Delivery Date, Location, Currency
- Status: DRAFT, CONFIRMED, IN_PRODUCTION, READY_TO_SHIP, SHIPPED, DELIVERED
- **Order Items:**
  - Product, Quantity, Unit Price, Discount, Tax, Line Total
  - Add/Remove Items: Dynamic item rows
- **Delivery Details:**
  - Shipping Address, Shipping Method, Carrier, Tracking Number
- **Order Totals:**
  - Subtotal, Discount, Tax, Shipping Charges, Grand Total

#### **Purchase Order Creation**
- PO Code: Auto-generated (PO001, PO002, etc.)
- Supplier: Searchable dropdown
- PO Date, Expected Delivery Date, Location
- Status: DRAFT, SENT, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
- **Order Items:**
  - Product/Material, Quantity, Unit Cost, Discount, Tax
- **Financial Summary:**
  - Subtotal, Discount, Tax Amount, Shipping Charges, Grand Total

---

### **MODULE 7: Financial Management**

#### **Invoice Management**
- Invoice Code: Auto-generated (INV001, INV002, etc.)
- Customer: Searchable dropdown
- Invoice Date, Due Date, Sales Order Reference (optional)
- Status: DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED
- **Invoice Items:**
  - Product (REQUIRED if no SO reference), Description, Quantity, Unit Price, Discount, Tax
- **Financial Summary:**
  - Subtotal, Discount, Tax Amount, Shipping/Handling, Grand Total, Amount Paid, Balance Due
- **Deletion Rules:**
  - DRAFT: Can be deleted (soft delete)
  - SENT/PAID/OVERDUE: CANNOT be deleted (audit trail)

#### **Bill Management**
- Bill Code: Auto-generated (BILL001, BILL002, etc.)
- Supplier: Searchable dropdown
- Bill Date, Due Date, Purchase Order Reference (optional)
- Status: DRAFT, RECEIVED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED
- Same structure as Invoice Management

---

### **MODULE 8: Machine Management**

#### **Machine Master Data**
- Machine ID: Auto-generated (MCH0001, MCH0002, etc.)
- Machine Code: Auto-generated (MC0001, MC0002, etc.)
- Machine Name, Type (industry-specific), Model, Manufacturer
- Serial Number, Purchase Date, Warranty Expiry
- Location, Technical Specifications, Machine Image, QR Code
- Status: NEW, IN_USE, UNDER_MAINTENANCE, UNDER_REPAIR, IDLE, DECOMMISSIONED
- Operational Status: FREE, BUSY, RESERVED, UNAVAILABLE

#### **Preventive Maintenance Scheduling**
- Maintenance Types: DAILY_CHECK, WEEKLY, MONTHLY, QUARTERLY, ANNUAL, EMERGENCY
- Schedule Fields: Machine, Type, Title, Description, Frequency, Last Completed, Next Due
- Estimated Hours, Assigned Technician, Checklist, Parts Required

#### **Breakdown Reporting**
- Quick Breakdown Form (Mobile-Friendly)
- Machine, Severity (CRITICAL, HIGH, MEDIUM, LOW), Title, Description
- Breakdown Time, Photo/Video Upload, Operator
- Ticket Management: Ticket ID, Status, Priority, Assigned Technician, Parts Required

---

### **MODULE 9: Quality Control System**

#### **Inspection Management**
- Inspection Types: INCOMING_MATERIAL, IN_PROCESS, FINAL_PRODUCT, RANDOM_CHECK, BATCH_TEST
- Inspection Number: Auto-generated (QC001, QC002, etc.)
- Type, Reference Type (Product, Order, Batch), Location, Inspector
- Inspection Checklist: Dynamic checkpoints with Pass/Fail or rating
- Overall Assessment: PASS, FAIL, CONDITIONAL_PASS, REWORK_REQUIRED
- Quality Score: Auto-calculated percentage

#### **Quality Defects**
- Defect Code: Auto-generated (DEF001, DEF002, etc.)
- Severity: CRITICAL, MAJOR, MINOR
- Category: FABRIC, STITCHING, COLOR, MEASUREMENT, PACKAGING, FINISHING, LABELING
- Product/Order Link, Batch-Specific tracking
- Resolution Status: OPEN, IN_PROGRESS, RESOLVED, REJECTED

#### **Compliance Reports**
- Report Code: Auto-generated (CR001, CR002, etc.)
- Certification Type: ISO_9001, ISO_14001, OEKO_TEX, GOTS, WRAP, SA8000, BSCI, SEDEX
- Compliance Status: COMPLIANT, NON_COMPLIANT, PENDING_REVIEW, EXPIRED
- Findings, Recommendations, Validity Period, Documents

---

### **MODULE 10: Textile-Specific Operations**

#### **Fabric Production**
- Fabric Type: Cotton, Silk, Wool, Polyester, Blend, Nylon, Linen, Rayon, Spandex
- Fabric Name, Composition, Width, GSM (weight), Color, Pattern
- Finish Type, Production Quantity (meters), Production Date, Batch Number
- Quality Grade: A_GRADE, B_GRADE, C_GRADE, REJECT
- Image URL, Location, Notes, Active Toggle

#### **Yarn Manufacturing**
- Yarn Type: Cotton, Wool, Silk, Synthetic, Blend
- Yarn Count, Twist Per Inch, Ply, Color, Dye Lot
- Quantity (Kg), Production Date, Batch Number, Process Type
- Quality Grade, Image URL, Location, Notes

#### **Dyeing & Finishing**
- Process Type: Dyeing, Printing, Finishing
- Color Code (Hex or Pantone), Color Name, Dye Method, Recipe Code
- Quantity (Meters), Process Date, Batch Number, Machine Number
- Temperature (°C), Duration (Minutes), Quality Check, Color Fastness, Shrinkage %
- Image URL, Fabric ID, Location, Notes

#### **Garment Manufacturing**
- Garment Type: T-Shirt, Shirt, Pants, Dress, Jacket, Skirt, Blouse, Shorts
- Style Number, Size, Color, Fabric ID, Quantity
- Production Stage: Cutting, Sewing, Finishing, Packing, Completed
- Cut Date, Sew Date, Finish Date, Pack Date
- Operator Name, Line Number, Quality Passed, Defect Count
- Image URL, Order ID, Location, Notes

#### **Design & Patterns**
- Design Name, Design Category (Print, Embroidery, Woven, Knit)
- Designer Name, Season, Color Palette, Pattern Repeat
- Design File URL, Sample Image URL
- Status: Concept, Draft, Review, Approved, Production, Archived
- Notes, Active Toggle

---

### **MODULE 11: Customer & Supplier Management**

#### **Customer Management**
- Customer Code: Auto-generated (CUST-001, CUST-002, etc.)
- Customer Name, Customer Type (INDIVIDUAL, BUSINESS, DISTRIBUTOR, RETAILER, WHOLESALER)
- Company Name (required if BUSINESS type)
- Contact Information: Email, Phone, Alternate Phone, Website
- Address Information: Billing Address, Shipping Address (with "Same as Billing" checkbox)
- Financial Information: Payment Terms, Credit Limit, Currency, Tax ID/GST, PAN Number
- Additional Information: Customer Category, Assigned Sales Rep, Notes, Tags
- Active Toggle

#### **Supplier Management**
- Supplier Code: Auto-generated (SUPP-001, SUPP-002, etc.)
- Supplier Name, Supplier Type (MANUFACTURER, DISTRIBUTOR, WHOLESALER, IMPORTER, LOCAL_VENDOR)
- Company Registration Number
- Contact Information: Email, Phone, Alternate Phone, Website, Fax
- Business Address (required)
- Financial Information: Payment Terms, Credit Period, Currency, Tax ID/GST, PAN, Bank Details
- Supply Information: Product Categories Supplied, Lead Time, Minimum Order Quantity/Value
- Quality & Compliance: Quality Rating, Certifications, Compliance Status
- Additional Information: Supplier Category, Assigned Procurement Manager, Notes, Tags
- Active Toggle

---

### **MODULE 12: Reports & Analytics**

#### **Financial Reports**
- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement
- Trial Balance
- GST/Tax Reports
- Accounts Receivable Aging
- Accounts Payable Aging
- Expense Summary

#### **Inventory Reports**
- Stock Summary
- Stock Movement History
- Low Stock Alerts
- Stock Valuation
- Stock Aging

#### **Sales Reports**
- Sales Summary
- Revenue Trends
- Top Selling Products
- Sales by Region
- Customer Purchase History

#### **Operations Reports**
- Production Planning
- Machine Utilization
- Production Efficiency
- Quality Metrics

#### **Dashboard Analytics**
- KPI cards for all modules
- Real-time metrics from all business areas
- Total Products, Active Orders, Team Members, Monthly Revenue
- Financial stats (invoices, bills, purchase orders, pending payments)
- Inventory stats (low stock, out of stock, total value)
- Quality stats (inspections, defects)
- Machine stats (total, active, under maintenance, breakdowns)
- Customer & supplier counts
- Textile operations stats (fabric, yarn, dyeing, garment production)

---

## 🔒 MULTI-TENANT SECURITY & DATA ISOLATION (CRITICAL)

### **Mandatory Security Rules**

1. **EVERY API endpoint and service method MUST filter data by company_id (tenantId)**
2. **Backend Services**: All get*, create*, update*, delete* methods MUST accept companyId as first parameter
3. **Controllers**: All protected routes MUST use req.tenantId from JWT token for company context
4. **Database Queries**: ALL queries MUST include `where: { company_id: companyId }` filter
5. **Role-Based Access**: Combine company filtering with role checks using requireRole middleware
6. **Frontend**: All API calls post-company-selection MUST include company context from auth token
7. **No Cross-Tenant Data Leaks**: Users can ONLY see/modify data from companies they have access to
8. **ID Generation**: Use globally unique IDs but always filter by company when querying
9. **Audit Trail**: Log all company-scoped operations with userId, tenantId, and action

---

## 📐 UI/UX STANDARDS

### **Component Guidelines**
- **Reuse Components**: Always use existing components before creating new ones
- **Styled Components Only**: Use theme tokens, NO inline styles, NO SCSS
- **Naming Conventions**: Follow existing patterns consistently
- **Button Sizes**: Medium/small only, no large buttons
- **Responsive Design**: Mobile-first with breakpoints at 768px, 1024px
- **Accessibility**: WCAG 2.1 AA compliance

### **Form Guidelines**
- **< 5 fields**: Modal
- **5-20 fields**: Drawer component
- **> 20 fields**: Separate screen/wizard
- **Action Buttons**: Cancel & Save always at bottom
- **Consistent Placement**: Same button order across all forms

### **Table Guidelines**
- **Actions**: Multiple actions in "More" menu (three dots icon)
- **Icons**: Ant Design icons only
- **Pagination**: Standard pagination (10, 25, 50, 100 per page)
- **Empty States**: Ant Design Empty component with clear call-to-action

### **Active Toggle Pattern**
- **All Form Drawers**: Must include Active toggle in header (top-right position)
- **Create Mode**: Default isActive: true, toggle disabled
- **Edit Mode**: Toggle enabled, reflects current status
- **Table Display**: Active status column with Green (Active) / Red (Inactive) tags

---

## 🚀 IMPLEMENTATION INSTRUCTIONS

### **Step 1: Setup Project Structure**

```bash
# Backend
backend/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── middleware/
│   ├── routes/
│   └── utils/
├── prisma/
│   └── schema.prisma
└── package.json

# Frontend
frontend/
├── src/
│   ├── theme/              # Ayphen theme system
│   │   ├── index.ts
│   │   ├── theme-provider.tsx
│   │   ├── hooks.ts
│   │   ├── utils.ts
│   │   └── color-tokens/
│   │       ├── light.tsx
│   │       └── dark.tsx
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   └── App.tsx
└── package.json
```

### **Step 2: Implement Ayphen Theme System**

1. Create theme directory structure
2. Implement color tokens (light.tsx, dark.tsx)
3. Create theme provider with context
4. Add theme hooks (useToken, useGlobalTheme)
5. Add utility functions (toRem, toPx, pxToRem)
6. Configure Ant Design theme
7. Wrap app with ThemeProvider and StyledThemeProvider

### **Step 3: Create Reusable Components**

1. Button components (Button, AddNewButton, EditButton, DeleteButton)
2. Form components (Input, Select, DatePicker, etc.)
3. Layout components (Drawer, Modal, Header)
4. Table components (DataTable with sticky headers)
5. Typography components
6. All components MUST use styled-components with theme tokens

### **Step 4: Implement Core Modules**

**Priority Order:**
1. Authentication & User Management
2. Company Management (Multi-Tenant)
3. Location Management
4. Product Management
5. Inventory Management
6. Order Management (Sales & Purchase)
7. Financial Management (Invoices & Bills)
8. Machine Management
9. Quality Control System
10. Textile-Specific Operations
11. Customer & Supplier Management
12. Reports & Analytics

### **Step 5: Testing & Validation**

1. Unit tests for all services
2. Integration tests for API endpoints
3. Multi-tenant isolation testing
4. Role-based access control testing
5. Theme switching testing (light/dark mode)
6. Responsive design testing
7. Cross-browser testing

---

## 📚 DOCUMENTATION REFERENCE

All Ayphen theme documentation is available in the `docs/` directory:

1. **01-THEME-SYSTEM.md** - Theme provider, hooks, switching
2. **02-COLOR-TOKENS.md** - Complete color tokens for light/dark
3. **03-TYPOGRAPHY-AND-FONTS.md** - Font sizes, weights, line heights
4. **04-SPACING-AND-SIZING.md** - Margin, padding, border radius, breakpoints
5. **05-COMPONENT-THEMING.md** - Ant Design component configurations
6. **06-REUSABLE-COMPONENTS.md** - Button, Header, Table, Drawer, Modal
7. **07-FORM-INPUTS.md** - Input, Select, Checkbox, Radio, Switch, DatePicker
8. **08-FORM-CONTROLLERS.md** - React Hook Form integration
9. **09-ICONS.md** - Complete icon reference
10. **10-COMPONENT-FILE-REFERENCE.md** - File structure and locations

---

## ✅ SUCCESS CRITERIA

### **Theme Implementation**
- ✅ Ayphen theme system fully implemented with TypeScript tokens
- ✅ Light and dark mode working with localStorage persistence
- ✅ All components using styled-components (NO SCSS)
- ✅ Theme tokens accessible via useToken and useGlobalTheme hooks
- ✅ Ant Design ConfigProvider integrated with theme
- ✅ Smooth theme transitions

### **Multi-Tenant Functionality**
- ✅ Complete data isolation by company_id
- ✅ Users can belong to multiple companies
- ✅ Company switching works seamlessly
- ✅ Role-based access control enforced
- ✅ No cross-tenant data leaks

### **Core Features**
- ✅ All 12 modules fully implemented
- ✅ CRUD operations for all entities
- ✅ Auto-generated codes for all entities
- ✅ Active/Inactive toggle on all entities
- ✅ Comprehensive validation (frontend + backend)
- ✅ Audit trails for all operations
- ✅ Real-time stock updates
- ✅ Financial document generation
- ✅ Quality control workflows
- ✅ Textile-specific operations

### **UI/UX**
- ✅ Consistent design language across all pages
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Empty states with clear CTAs
- ✅ Loading states and error handling
- ✅ Confirmation modals for destructive actions

### **Performance**
- ✅ Fast page load times (< 3s)
- ✅ Smooth animations and transitions
- ✅ Efficient database queries
- ✅ Caching with Redis
- ✅ Optimized bundle size

---

## 🎯 PROJECT GOALS

1. **Build a production-ready, multi-tenant ERP system** for textile manufacturing
2. **Implement the Ayphen theme system** as the foundation for all UI components
3. **Ensure complete data isolation** between companies (tenants)
4. **Provide comprehensive textile operations management** from raw materials to finished goods
5. **Deliver a modern, responsive, accessible UI** with light/dark mode support
6. **Maintain high code quality** with TypeScript, proper architecture, and testing

---

## 📝 NOTES FOR DEVELOPERS

### **Critical Reminders**

1. **NEVER use SCSS** - This project uses styled-components exclusively
2. **ALWAYS use theme tokens** - Access via useToken() or styled-components theme props
3. **ALWAYS filter by company_id** - Every database query must include company context
4. **ALWAYS use auto-generated codes** - Never expose internal UUIDs to users
5. **ALWAYS implement Active toggle** - All entities must have isActive field
6. **ALWAYS use Ant Design components** - Extend with styled-components, don't replace
7. **ALWAYS validate on both frontend and backend** - Never trust client-side validation alone
8. **ALWAYS log operations** - Audit trail is critical for enterprise applications

### **Common Patterns**

```typescript
// ✅ CORRECT: Using theme tokens with styled-components
const StyledCard = styled.div`
  background-color: ${(props) => props.theme.colorBgContainer};
  padding: ${(props) => pxToRem(props.theme.padding)};
`;

// ❌ WRONG: Using SCSS or inline styles
const Card = () => <div style={{ backgroundColor: '#fff' }}>...</div>;

// ✅ CORRECT: Filtering by company_id
const products = await prisma.product.findMany({
  where: { company_id: companyId, is_active: true }
});

// ❌ WRONG: Not filtering by company_id
const products = await prisma.product.findMany();

// ✅ CORRECT: Using auto-generated codes
const product = await getProductById(companyId, 'PROD-001');

// ❌ WRONG: Using UUIDs
const product = await getProductById('550e8400-e29b-41d4-a716-446655440000');
```

---

## 🏁 GETTING STARTED

1. **Read all documentation** in `docs/` directory
2. **Setup development environment** (Node.js, PostgreSQL, Redis)
3. **Install dependencies** for both backend and frontend
4. **Configure environment variables** (.env files)
5. **Run database migrations** (Prisma)
6. **Start development servers** (backend + frontend)
7. **Implement modules in priority order** (see Step 4 above)
8. **Test thoroughly** at each stage
9. **Deploy to staging** for user acceptance testing
10. **Deploy to production** after approval

---

**This document serves as the single source of truth for the Ayphen Textiles project. All implementation must follow these specifications exactly.**
