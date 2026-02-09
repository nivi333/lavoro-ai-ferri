/**
 * Header Component
 * Top navigation bar with logo, user menu, and theme toggle
 */

import { Menu } from 'lucide-react';
import { IconButton } from '../globalComponents';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className='sticky top-0 z-50 flex h-[60px] items-center justify-between border-b bg-card px-lg shadow-sm'>
      {/* Left: Menu Button + Logo */}
      <div className='flex items-center gap-md'>
        <IconButton onClick={onMenuClick} className='lg:hidden'>
          <Menu className='h-5 w-5' />
        </IconButton>

        <div className='flex items-center gap-2'>
          <img src='/src/assets/ayphen-textile.png' alt='Ayphen Textile' className='h-8' />
          <span className='hidden text-lg font-semibold md:inline-block'>Ayphen Textile</span>
        </div>
      </div>

      {/* Right: User Menu + Theme Toggle */}
      <div className='flex items-center gap-md'>
        {/* Theme Toggle - To be implemented */}
        <div className='text-sm text-muted-foreground'>
          {/* Theme toggle button will go here */}
        </div>

        {/* User Menu - To be implemented */}
        <div className='flex items-center gap-2'>{/* User avatar and dropdown will go here */}</div>
      </div>
    </header>
  );
}
