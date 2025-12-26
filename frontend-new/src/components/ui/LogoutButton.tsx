/**
 * LogoutButton Component
 * Transparent/outlined red button with red text for logout action
 */

import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function LogoutButton({ onClick, loading, disabled }: LogoutButtonProps) {
  return (
    <Button
      variant='outline'
      size='sm'
      onClick={onClick}
      disabled={disabled || loading}
      className='border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
    >
      <LogOut className='mr-2 h-4 w-4' />
      {loading ? 'Logging out...' : 'Logout'}
    </Button>
  );
}
