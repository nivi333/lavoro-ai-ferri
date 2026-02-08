/**
 * Sidebar Component
 * Collapsible navigation sidebar with menu items
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Building2,
  MapPin,
  LogOut,
  ShoppingBag,
  FileCheck,
  FilePlus,
  UserCheck,
  Shield,
  DollarSign,
  BarChart3,
  Box,
  Wrench,
  Scissors,
  Palette,
  Shirt,
  Grid3x3,
  Paintbrush,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useAuth from '@/contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className='h-5 w-5' />, path: '/dashboard' },
  {
    label: 'Stock',
    icon: <Box className='h-5 w-5' />,
    path: '/stock',
    children: [
      { label: 'Products', icon: <Package className='h-4 w-4' />, path: '/products' },
      { label: 'Inventory', icon: <Grid3x3 className='h-4 w-4' />, path: '/inventory' },
    ],
  },
  {
    label: 'Sales',
    icon: <ShoppingBag className='h-5 w-5' />,
    path: '/sales',
    children: [
      { label: 'Customers', icon: <UserCheck className='h-4 w-4' />, path: '/customers' },
      { label: 'Sales Orders', icon: <FilePlus className='h-4 w-4' />, path: '/orders' },
      { label: 'Invoices', icon: <FileCheck className='h-4 w-4' />, path: '/sales/invoices' },
    ],
  },
  {
    label: 'Purchase',
    icon: <ShoppingCart className='h-5 w-5' />,
    path: '/purchase',
    children: [
      { label: 'Suppliers', icon: <Users className='h-4 w-4' />, path: '/suppliers' },
      {
        label: 'Purchase Orders',
        icon: <FilePlus className='h-4 w-4' />,
        path: '/purchase/orders',
      },
      { label: 'Bills', icon: <FileCheck className='h-4 w-4' />, path: '/purchase/bills' },
    ],
  },
  { label: 'Machines', icon: <Wrench className='h-5 w-5' />, path: '/machines' },
  { label: 'Users', icon: <Users className='h-5 w-5' />, path: '/users' },
  {
    label: 'Quality Control',
    icon: <Shield className='h-5 w-5' />,
    path: '/quality',
    children: [
      { label: 'Inspections', icon: <Shield className='h-4 w-4' />, path: '/inspections' },
      { label: 'Checkpoints', icon: <Shield className='h-4 w-4' />, path: '/quality/checkpoints' },
      { label: 'Defects', icon: <Shield className='h-4 w-4' />, path: '/quality/defects' },
      {
        label: 'Compliance Reports',
        icon: <Shield className='h-4 w-4' />,
        path: '/quality/compliance',
      },
    ],
  },
  {
    label: 'Textile Operations',
    icon: <Shirt className='h-5 w-5' />,
    path: '/textile',
    children: [
      { label: 'Fabric Production', icon: <Shirt className='h-4 w-4' />, path: '/textile/fabrics' },
      {
        label: 'Yarn Manufacturing',
        icon: <Paintbrush className='h-4 w-4' />,
        path: '/textile/yarns',
      },
      {
        label: 'Dyeing & Finishing',
        icon: <Palette className='h-4 w-4' />,
        path: '/textile/dyeing',
      },
      {
        label: 'Garment Manufacturing',
        icon: <Scissors className='h-4 w-4' />,
        path: '/textile/garments',
      },
      {
        label: 'Design & Patterns',
        icon: <Grid3x3 className='h-4 w-4' />,
        path: '/textile/designs',
      },
    ],
  },
  {
    label: 'Reports',
    icon: <FileText className='h-5 w-5' />,
    path: '/reports',
    children: [
      {
        label: 'Financial Reports',
        icon: <DollarSign className='h-4 w-4' />,
        path: '/reports/financial',
      },
      {
        label: 'Operational Reports',
        icon: <BarChart3 className='h-4 w-4' />,
        path: '/reports/operational',
      },
      { label: 'Inventory Reports', icon: <Box className='h-4 w-4' />, path: '/reports/inventory' },
      { label: 'Sales Reports', icon: <ShoppingBag className='h-4 w-4' />, path: '/reports/sales' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCompany, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className='absolute -right-3 top-9 z-50 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-md hover:bg-accent'
      >
        {collapsed ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
      </button>

      {/* Company Dropdown Header */}
      {!collapsed && currentCompany && (
        <DropdownMenu>
          <DropdownMenuTrigger className='flex items-center gap-2.5 border-b px-2.5 py-2.5 hover:bg-accent focus:outline-none'>
            <Avatar className='h-8 w-8 border border-border'>
              <AvatarImage src={currentCompany.logoUrl} alt={currentCompany.name} />
              <AvatarFallback className='text-xs font-semibold'>
                {currentCompany.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-1 flex-col items-start'>
              <div className='text-sm font-semibold text-foreground'>{currentCompany.name}</div>
              <div className='text-xs text-muted-foreground'>{currentCompany.industry}</div>
            </div>
            <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-56'>
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className='mr-2 h-4 w-4' />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => currentCompany && navigate(`/companies/${currentCompany.id}`)}
            >
              <Settings className='mr-2 h-4 w-4' />
              <span>Company Details</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/locations')}>
              <MapPin className='mr-2 h-4 w-4' />
              <span>Location</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/companies')}>
              <Building2 className='mr-2 h-4 w-4' />
              <span>Switch Company / Role</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className='text-red-600 focus:text-red-600'>
              <LogOut className='mr-2 h-4 w-4' />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Navigation Items */}
      <nav className='flex-1 space-y-1 p-2 pt-4 overflow-y-auto'>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          const isExpanded = expandedItems.includes(item.label);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.label}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      collapsed && 'justify-center'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!collapsed && (
                      <>
                        <span className='flex-1 text-left'>{item.label}</span>
                        <ChevronDown
                          className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && isExpanded && item.children && (
                    <div className='ml-4 mt-1 space-y-1'>
                      {item.children.map(child => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={cn(
                              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                              isChildActive
                                ? 'sidebar-link-active'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'sidebar-link-active'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
