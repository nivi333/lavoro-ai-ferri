/**
 * Sidebar Component
 * Collapsible navigation sidebar with menu items
 */

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
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className='h-5 w-5' />, path: '/dashboard' },
  { label: 'Products', icon: <Package className='h-5 w-5' />, path: '/products' },
  { label: 'Customers', icon: <Users className='h-5 w-5' />, path: '/customers' },
  { label: 'Orders', icon: <ShoppingCart className='h-5 w-5' />, path: '/orders' },
  { label: 'Reports', icon: <FileText className='h-5 w-5' />, path: '/reports' },
  { label: 'Settings', icon: <Settings className='h-5 w-5' />, path: '/settings' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCompany, logout } = useAuth();

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
      <nav className='flex-1 space-y-1 p-2 pt-4'>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
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
          );
        })}
      </nav>
    </aside>
  );
}
