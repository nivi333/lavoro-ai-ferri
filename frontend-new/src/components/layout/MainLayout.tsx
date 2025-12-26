/**
 * Main Layout Component
 * Provides the main application layout with header, sidebar, and content area
 */

import { ReactNode, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Page Content */}
        <main className='flex-1 overflow-y-auto overflow-x-hidden'>{children}</main>
      </div>
    </div>
  );
}
