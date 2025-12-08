import {
  DashboardOutlined,
  ShoppingCartOutlined,
  SafetyOutlined,
  DollarOutlined,
  FileTextOutlined,
  ScissorOutlined,
  BgColorsOutlined,
  SkinOutlined,
  AppstoreOutlined,
  FormatPainterOutlined,
  InboxOutlined,
  ToolOutlined,
  TeamOutlined,
  BarChartOutlined,
  ShoppingOutlined,
  FileDoneOutlined,
  FileAddOutlined,
  UserOutlined,
} from '@ant-design/icons';

export type IndustryType =
  | 'Textile Manufacturing'
  | 'Garment Production'
  | 'Knitting & Weaving'
  | 'Fabric Processing'
  | 'Apparel Design'
  | 'Fashion Retail'
  | 'Yarn Production'
  | 'Dyeing & Finishing'
  | 'Home Textiles'
  | 'Technical Textiles';

export interface MenuItem {
  key: string;
  label: string;
  icon: any;
  path: string;
  children?: MenuItem[];
}

/**
 * Core modules that are always visible regardless of industry
 */
export const CORE_MODULES: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: DashboardOutlined,
    path: '/dashboard',
  },
  {
    key: 'sales',
    label: 'Sales',
    icon: ShoppingOutlined,
    path: '/sales',
    children: [
      {
        key: 'customers',
        label: 'Customers',
        icon: UserOutlined,
        path: '/customers',
      },
      {
        key: 'sales-orders',
        label: 'Sales Orders',
        icon: FileAddOutlined,
        path: '/sales/orders',
      },
      {
        key: 'invoices',
        label: 'Invoices',
        icon: FileDoneOutlined,
        path: '/sales/invoices',
      },
    ],
  },
  {
    key: 'purchase',
    label: 'Purchase',
    icon: ShoppingCartOutlined,
    path: '/purchase',
    children: [
      {
        key: 'suppliers',
        label: 'Suppliers',
        icon: TeamOutlined,
        path: '/suppliers',
      },
      {
        key: 'purchase-orders',
        label: 'Purchase Orders',
        icon: FileAddOutlined,
        path: '/purchase/orders',
      },
      {
        key: 'bills',
        label: 'Bills',
        icon: FileDoneOutlined,
        path: '/purchase/bills',
      },
    ],
  },
  {
    key: 'stock',
    label: 'Stock',
    icon: AppstoreOutlined,
    path: '/stock',
    children: [
      {
        key: 'products',
        label: 'Products',
        icon: InboxOutlined,
        path: '/products',
      },
      {
        key: 'inventory',
        label: 'Inventory',
        icon: AppstoreOutlined,
        path: '/inventory',
      },
    ],
  },
  {
    key: 'machines',
    label: 'Machines',
    icon: ToolOutlined,
    path: '/machines',
  },
  {
    key: 'users',
    label: 'Users',
    icon: TeamOutlined,
    path: '/users',
  },
  {
    key: 'quality',
    label: 'Quality Control',
    icon: SafetyOutlined,
    path: '/quality',
    children: [
      {
        key: 'inspections',
        label: 'Inspections',
        icon: SafetyOutlined,
        path: '/inspections',
      },
      {
        key: 'quality-checkpoints',
        label: 'Checkpoints',
        icon: SafetyOutlined,
        path: '/quality/checkpoints',
      },
      {
        key: 'quality-defects',
        label: 'Defects',
        icon: SafetyOutlined,
        path: '/quality/defects',
      },
      {
        key: 'quality-compliance',
        label: 'Compliance Reports',
        icon: SafetyOutlined,
        path: '/quality/compliance',
      },
      {
        key: 'quality-reports',
        label: 'Quality Reports',
        icon: BarChartOutlined,
        path: '/quality/reports',
      },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: DollarOutlined,
    path: '/finance',
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: FileTextOutlined,
    path: '/reports',
    children: [
      {
        key: 'financial-reports',
        label: 'Financial Reports',
        icon: DollarOutlined,
        path: '/reports/financial',
      },
      {
        key: 'operational-reports',
        label: 'Operational Reports',
        icon: BarChartOutlined,
        path: '/reports/operational',
      },
      {
        key: 'inventory-reports',
        label: 'Inventory Reports',
        icon: InboxOutlined,
        path: '/reports/inventory',
      },
      {
        key: 'sales-reports',
        label: 'Sales Reports',
        icon: ShoppingOutlined,
        path: '/reports/sales',
      },
      {
        key: 'production-reports',
        label: 'Production Reports',
        icon: AppstoreOutlined,
        path: '/reports/production',
      },
      {
        key: 'quality-reports',
        label: 'Quality Reports',
        icon: SafetyOutlined,
        path: '/reports/quality',
      },
      {
        key: 'analytics-reports',
        label: 'Analytics Reports',
        icon: BarChartOutlined,
        path: '/reports/analytics',
      },
    ],
  },
];

/**
 * Textile industry-specific modules
 */
export const TEXTILE_MODULES: MenuItem[] = [
  {
    key: 'textile',
    label: 'Textile Operations',
    icon: SkinOutlined,
    path: '/textile',
    children: [
      {
        key: 'fabric-production',
        label: 'Fabric Production',
        icon: SkinOutlined,
        path: '/textile/fabrics',
      },
      {
        key: 'yarn-manufacturing',
        label: 'Yarn Manufacturing',
        icon: FormatPainterOutlined,
        path: '/textile/yarns',
      },
      {
        key: 'dyeing-finishing',
        label: 'Dyeing & Finishing',
        icon: BgColorsOutlined,
        path: '/textile/dyeing',
      },
      {
        key: 'garment-manufacturing',
        label: 'Garment Manufacturing',
        icon: ScissorOutlined,
        path: '/textile/garments',
      },
      {
        key: 'design-patterns',
        label: 'Design & Patterns',
        icon: AppstoreOutlined,
        path: '/textile/designs',
      },
    ],
  },
];

/**
 * Knitting & Weaving industry-specific modules (excludes Garment Manufacturing)
 */
export const KNITTING_WEAVING_MODULES: MenuItem[] = [
  {
    key: 'textile',
    label: 'Textile Operations',
    icon: SkinOutlined,
    path: '/textile',
    children: [
      {
        key: 'fabric-production',
        label: 'Fabric Production',
        icon: SkinOutlined,
        path: '/textile/fabrics',
      },
      {
        key: 'yarn-manufacturing',
        label: 'Yarn Manufacturing',
        icon: FormatPainterOutlined,
        path: '/textile/yarns',
      },
      {
        key: 'dyeing-finishing',
        label: 'Dyeing & Finishing',
        icon: BgColorsOutlined,
        path: '/textile/dyeing',
      },
      {
        key: 'design-patterns',
        label: 'Design & Patterns',
        icon: AppstoreOutlined,
        path: '/textile/designs',
      },
    ],
  },
];

/**
 * Food & Beverage industry-specific modules (placeholder for future)
 */
export const FOOD_BEVERAGE_MODULES: MenuItem[] = [
  // Future implementation
];

/**
 * Automotive industry-specific modules (placeholder for future)
 */
export const AUTOMOTIVE_MODULES: MenuItem[] = [
  // Future implementation
];

/**
 * Pharmaceutical industry-specific modules (placeholder for future)
 */
export const PHARMACEUTICAL_MODULES: MenuItem[] = [
  // Future implementation
];

/**
 * Electronics industry-specific modules (placeholder for future)
 */
export const ELECTRONICS_MODULES: MenuItem[] = [
  // Future implementation
];

/**
 * Get navigation menu items based on company industry
 * @param industry - The industry type of the company
 * @returns Array of menu items to display
 */
export const getNavigationByIndustry = (industry: IndustryType): MenuItem[] => {
  // All textile industries use the same TEXTILE_MODULES
  // Support both enum values and display labels for backward compatibility
  const industryModules: Record<string, MenuItem[]> = {
    // Enum values
    TEXTILE_MANUFACTURING: TEXTILE_MODULES,
    GARMENT_PRODUCTION: TEXTILE_MODULES,
    KNITTING_WEAVING: KNITTING_WEAVING_MODULES,
    FABRIC_PROCESSING: TEXTILE_MODULES,
    APPAREL_DESIGN: TEXTILE_MODULES,
    FASHION_RETAIL: TEXTILE_MODULES,
    YARN_PRODUCTION: TEXTILE_MODULES,
    DYEING_FINISHING: TEXTILE_MODULES,
    HOME_TEXTILES: TEXTILE_MODULES,
    TECHNICAL_TEXTILES: TEXTILE_MODULES,
    // Display labels (backward compatibility)
    'Textile Manufacturing': TEXTILE_MODULES,
    'Garment Production': TEXTILE_MODULES,
    'Knitting & Weaving': KNITTING_WEAVING_MODULES,
    'Fabric Processing': TEXTILE_MODULES,
    'Apparel Design': TEXTILE_MODULES,
    'Fashion Retail': TEXTILE_MODULES,
    'Yarn Production': TEXTILE_MODULES,
    'Dyeing & Finishing': TEXTILE_MODULES,
    'Home Textiles': TEXTILE_MODULES,
    'Technical Textiles': TEXTILE_MODULES,
  };

  // Get industry-specific modules, default to TEXTILE if not found
  const specificModules = industryModules[industry] || TEXTILE_MODULES;

  // Combine core modules with industry-specific modules
  // Insert industry modules before Finance
  const financeIndex = CORE_MODULES.findIndex(m => m.key === 'finance');
  const beforeFinance = CORE_MODULES.slice(0, financeIndex);
  const afterFinance = CORE_MODULES.slice(financeIndex);

  return [...beforeFinance, ...specificModules, ...afterFinance];
};

/**
 * Get all available industries for company creation
 * Values must match the IndustryType enum in the backend
 */
export const AVAILABLE_INDUSTRIES = [
  { value: 'TEXTILE_MANUFACTURING', label: 'Textile Manufacturing' },
  { value: 'GARMENT_PRODUCTION', label: 'Garment Production' },
  { value: 'KNITTING_WEAVING', label: 'Knitting & Weaving' },
  { value: 'FABRIC_PROCESSING', label: 'Fabric Processing' },
  { value: 'APPAREL_DESIGN', label: 'Apparel Design' },
  { value: 'FASHION_RETAIL', label: 'Fashion Retail' },
  { value: 'YARN_PRODUCTION', label: 'Yarn Production' },
  { value: 'DYEING_FINISHING', label: 'Dyeing & Finishing' },
  { value: 'HOME_TEXTILES', label: 'Home Textiles' },
  { value: 'TECHNICAL_TEXTILES', label: 'Technical Textiles' },
] as const;

/**
 * Map display label to enum value (for backward compatibility)
 */
export const INDUSTRY_LABEL_TO_ENUM: Record<string, string> = {
  'Textile Manufacturing': 'TEXTILE_MANUFACTURING',
  'Garment Production': 'GARMENT_PRODUCTION',
  'Knitting & Weaving': 'KNITTING_WEAVING',
  'Fabric Processing': 'FABRIC_PROCESSING',
  'Apparel Design': 'APPAREL_DESIGN',
  'Fashion Retail': 'FASHION_RETAIL',
  'Yarn Production': 'YARN_PRODUCTION',
  'Dyeing & Finishing': 'DYEING_FINISHING',
  'Home Textiles': 'HOME_TEXTILES',
  'Technical Textiles': 'TECHNICAL_TEXTILES',
};

/**
 * Map enum value to display label
 */
export const INDUSTRY_ENUM_TO_LABEL: Record<string, string> = {
  TEXTILE_MANUFACTURING: 'Textile Manufacturing',
  GARMENT_PRODUCTION: 'Garment Production',
  KNITTING_WEAVING: 'Knitting & Weaving',
  FABRIC_PROCESSING: 'Fabric Processing',
  APPAREL_DESIGN: 'Apparel Design',
  FASHION_RETAIL: 'Fashion Retail',
  YARN_PRODUCTION: 'Yarn Production',
  DYEING_FINISHING: 'Dyeing & Finishing',
  HOME_TEXTILES: 'Home Textiles',
  TECHNICAL_TEXTILES: 'Technical Textiles',
};
