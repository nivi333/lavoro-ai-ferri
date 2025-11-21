import {
  DashboardOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  ShoppingCartOutlined,
  SafetyOutlined,
  DollarOutlined,
  FileTextOutlined,
  ScissorOutlined,
  BgColorsOutlined,
  SkinOutlined,
  AppstoreOutlined,
  FormatPainterOutlined,
} from '@ant-design/icons';

export type IndustryType = 
  | 'TEXTILE' 
  | 'FOOD_BEVERAGE' 
  | 'AUTOMOTIVE' 
  | 'PHARMACEUTICAL' 
  | 'ELECTRONICS' 
  | 'GENERAL';

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
    key: 'companies',
    label: 'Companies',
    icon: ShopOutlined,
    path: '/companies',
  },
  {
    key: 'locations',
    label: 'Locations',
    icon: EnvironmentOutlined,
    path: '/locations',
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: ShoppingCartOutlined,
    path: '/orders',
  },
  {
    key: 'quality',
    label: 'Quality Control',
    icon: SafetyOutlined,
    path: '/quality',
    children: [
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
    path: '/reports',
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
  const industryModules: Record<IndustryType, MenuItem[]> = {
    TEXTILE: TEXTILE_MODULES,
    FOOD_BEVERAGE: FOOD_BEVERAGE_MODULES,
    AUTOMOTIVE: AUTOMOTIVE_MODULES,
    PHARMACEUTICAL: PHARMACEUTICAL_MODULES,
    ELECTRONICS: ELECTRONICS_MODULES,
    GENERAL: [], // No industry-specific modules for general
  };

  // Combine core modules with industry-specific modules
  return [...CORE_MODULES, ...industryModules[industry]];
};

/**
 * Get all available industries for company creation
 */
export const AVAILABLE_INDUSTRIES = [
  { value: 'TEXTILE', label: 'Textile & Apparel' },
  { value: 'FOOD_BEVERAGE', label: 'Food & Beverage' },
  { value: 'AUTOMOTIVE', label: 'Automotive' },
  { value: 'PHARMACEUTICAL', label: 'Pharmaceutical' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'GENERAL', label: 'General Manufacturing' },
] as const;
