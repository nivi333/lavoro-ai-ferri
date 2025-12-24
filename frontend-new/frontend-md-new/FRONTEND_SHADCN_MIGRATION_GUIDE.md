# Lavoro AI Ferri - Frontend Migration Guide
## From Ant Design + SCSS to shadcn/ui + Tailwind CSS

Complete documentation for migrating the Lavoro AI Ferri frontend from Ant Design to shadcn/ui while maintaining exact same UI/UX and all backend API integrations.

---

## Table of Contents
1. [Overview](#overview)
2. [Design System & Theme](#design-system--theme)
3. [Component Migration Map](#component-migration-map)
4. [Backend API Integration](#backend-api-integration)
5. [Installation & Setup](#installation--setup)
6. [Migration Checklist](#migration-checklist)

---

## Overview

### Current Stack
- **UI Library**: Ant Design (antd) v5.28.1
- **Styling**: SCSS with custom theme variables
- **Icons**: @ant-design/icons + lucide-react
- **Forms**: react-hook-form + zod validation
- **Charts**: @ant-design/plots

### Target Stack
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS v3.x
- **Icons**: lucide-react (already in use)
- **Forms**: react-hook-form + zod validation (no change)
- **Charts**: Recharts (shadcn/ui compatible)

### Key Principles
- **Maintain exact same UI/UX**: All visual elements, spacing, colors, and interactions remain identical
- **Keep all backend APIs**: No changes to service layer or API integration
- **Preserve functionality**: All features, forms, tables, and workflows work exactly the same
- **Use same theme**: Primary color (#df005c), accent colors, typography remain unchanged

---

## Design System & Theme

### Color Palette

#### Primary Colors
```typescript
colors: {
  primary: {
    DEFAULT: '#df005c',
    hover: '#eb2671',
    active: '#b80053',
    bg: '#ffe6ec',
    border: '#ff7aa4',
  }
}
```

#### Semantic Colors
```typescript
success: { DEFAULT: '#52c41a', hover: '#73d13d', active: '#389e0d' }
warning: { DEFAULT: '#faad14', hover: '#ffc53d', active: '#d48806' }
error: { DEFAULT: '#ff4d4f', hover: '#ff7875', active: '#d9363e' }
info: { DEFAULT: '#1677ff', hover: '#4096ff', active: '#0958d9' }
```

### Typography
```typescript
fontFamily: {
  heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
  body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
}

fontSize: {
  xs: '10px', sm: '12px', base: '13px', lg: '16px', xl: '20px',
  '2xl': '24px', '3xl': '30px',
  'heading-1': '38px', 'heading-2': '30px', 'heading-3': '24px',
}
```

---

## Component Migration Map

| Ant Design | shadcn/ui | Notes |
|-----------|-----------|-------|
| Button | Button | Use variants: default, destructive, outline, ghost |
| Input | Input | Direct replacement |
| Select | Select | Use with SelectTrigger, SelectContent, SelectItem |
| Table | Table | Use with TableHeader, TableBody, TableRow, TableCell |
| Drawer | Sheet | Use with SheetTrigger, SheetContent, SheetHeader |
| Modal | Dialog | Use with DialogTrigger, DialogContent, DialogHeader |
| message | toast (sonner) | Use sonner for notifications |
| Form | Form (react-hook-form) | Already using react-hook-form |

---

## Backend API Integration

### Service Layer (No Changes Required)

All 22 backend services remain unchanged:

```typescript
// Services located in: /frontend/src/services/
1. analyticsService.ts - Dashboard analytics, revenue trends
2. billService.ts - Bill management
3. companyService.ts - Company CRUD, switching
4. customerService.ts - Customer management
5. expenseService.ts - Expense tracking
6. inspectionService.ts - Quality inspections
7. inventoryService.ts - Multi-location inventory
8. invoiceService.ts - Customer invoices
9. locationService.ts - Company locations
10. machineService.ts - Machine management
11. orderService.ts - Sales orders
12. paymentService.ts - Payment processing
13. pettyCashService.ts - Petty cash
14. productService.ts - Product catalog
15. purchaseOrderService.ts - Purchase orders
16. qualityService.ts - Quality control
17. reportService.ts - Report generation
18. subscriptionService.ts - Subscriptions
19. supplierService.ts - Supplier management
20. textileService.ts - Textile operations
21. userService.ts - User management
```

### API Integration Pattern
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});

export const productService = {
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },
};
```

---

## Installation & Setup

### 1. Install Dependencies
```bash
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-switch
npm install @radix-ui/react-tabs @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge
npm install sonner recharts
npm install lucide-react
```

### 2. Initialize shadcn/ui
```bash
npx shadcn-ui@latest init
```

### 3. Add Components
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
```

---

## Migration Checklist

### Phase 1: Setup
- [ ] Install Tailwind CSS and dependencies
- [ ] Initialize shadcn/ui
- [ ] Add all required shadcn/ui components
- [ ] Configure Tailwind with theme colors
- [ ] Setup sonner for toast notifications

### Phase 2: Core Components
- [ ] Migrate Button component
- [ ] Migrate Input components
- [ ] Migrate Select components
- [ ] Migrate Form components
- [ ] Migrate Table component

### Phase 3: Layout
- [ ] Migrate MainLayout
- [ ] Migrate Sidebar navigation
- [ ] Migrate Header component
- [ ] Update page container patterns

### Phase 4: Pages
- [ ] Migrate Dashboard page
- [ ] Migrate Products page
- [ ] Migrate Inventory page
- [ ] Migrate Orders page
- [ ] Migrate Machines page
- [ ] Migrate Quality pages
- [ ] Migrate Finance pages

### Phase 5: Testing
- [ ] Test all forms and validation
- [ ] Test all tables and pagination
- [ ] Test all modals and drawers
- [ ] Test all API integrations
- [ ] Test theme switching
- [ ] Test responsive design

---

## Key Implementation Notes

1. **Keep Backend Services Unchanged**: All API integration code remains identical
2. **Preserve Form Validation**: Continue using react-hook-form + zod
3. **Maintain Theme Colors**: Use exact same color values in Tailwind config
4. **Use Same Icons**: lucide-react is already in use, keep it
5. **Keep Typography**: Poppins for headings, Inter for body text
6. **Preserve Spacing**: Use same spacing values (4px base unit)
7. **Maintain Functionality**: All features work exactly the same way

---

For detailed component examples and code snippets, see the full implementation guide in the project repository.
