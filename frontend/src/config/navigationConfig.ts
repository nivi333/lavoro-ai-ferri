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
    key: 'products',
    label: 'Products',
    icon: InboxOutlined,
    path: '/products',
  },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: AppstoreOutlined,
    path: '/inventory', // Placeholder - routes to dashboard via click handler
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: ShoppingCartOutlined,
    path: '/orders',
  },
  {
    key: 'customers',
    label: 'Customers',
    icon: TeamOutlined,
    path: '/customers', // Placeholder - routes to dashboard via click handler
  },
  {
    key: 'users',
    label: 'Users',
    icon: TeamOutlined,
    path: '/users',
  },
  {
    key: 'machinery',
    label: 'Machinery',
    icon: ToolOutlined,
    path: '/machinery', // Placeholder - routes to dashboard via click handler
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
    path: '/reports', // Placeholder - routes to dashboard via click handler
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: BarChartOutlined,
    path: '/analytics', // Placeholder - routes to dashboard via click handler
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
        path: '/textile/yarn',
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
  const industryModules: Record<IndustryType, MenuItem[]> = {
    'Textile Manufacturing': TEXTILE_MODULES,
    'Garment Production': TEXTILE_MODULES,
    'Knitting & Weaving': TEXTILE_MODULES,
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
 */
export const AVAILABLE_INDUSTRIES = [
  { value: 'Textile Manufacturing', label: 'Textile Manufacturing' },
  { value: 'Garment Production', label: 'Garment Production' },
  { value: 'Knitting & Weaving', label: 'Knitting & Weaving' },
  { value: 'Fabric Processing', label: 'Fabric Processing' },
  { value: 'Apparel Design', label: 'Apparel Design' },
  { value: 'Fashion Retail', label: 'Fashion Retail' },
  { value: 'Yarn Production', label: 'Yarn Production' },
  { value: 'Dyeing & Finishing', label: 'Dyeing & Finishing' },
  { value: 'Home Textiles', label: 'Home Textiles' },
  { value: 'Technical Textiles', label: 'Technical Textiles' },
] as const;
