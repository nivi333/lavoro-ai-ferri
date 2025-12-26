/**
 * Main Layout Component
 * Provides the main application layout matching the old frontend structure:
 * - Full-width header with logo, theme toggle, logout, user info
 * - Sidebar with company dropdown and navigation
 * - Content area
 */

import { ReactNode, useState } from 'react';
import { BrandLogo } from '../BrandLogo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { UserAvatar } from '../ui/UserAvatar';
import { LogoutButton } from '../ui/LogoutButton';
import useAuth from '@/contexts/AuthContext';
import { useHeader } from '@/contexts/HeaderContext';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { headerActions } = useHeader();
  const { logout, user } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      logout();
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-background'>
      {/* Full Width Header */}
      <header className='sticky top-0 z-50 flex h-[64px] items-center justify-between border-b bg-card px-6 shadow-sm'>
        <div className='flex items-center'>
          <BrandLogo width={70} height={60} />
        </div>

        <div className='flex items-center gap-4'>
          <ThemeToggle />
          {headerActions}
          <LogoutButton onClick={handleLogout} loading={logoutLoading} />
          {user && (
            <div className='flex items-center gap-3 rounded-lg border border-primary/20 px-3.5 py-1.5'>
              <UserAvatar firstName={user.firstName} lastName={user.lastName} size={38} />
              <div className='hidden flex-col lg:flex'>
                <span className='text-sm font-semibold'>
                  {user.firstName} {user.lastName}
                </span>
                <span className='text-xs text-muted-foreground'>{user.email}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar + Content Layout */}
      <div className='flex flex-1 overflow-hidden'>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className='flex-1 overflow-y-auto overflow-x-hidden bg-background p-4'>
          {children}
        </main>
      </div>
    </div>
  );
}
