import { useState, useEffect } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Machine, machineService } from '@/services/machineService';
import { API_BASE_URL } from '@/config/api';
import { AuthStorage } from '@/utils/storage';

interface AssignOperatorSheetProps {
  machine: Machine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

const shiftTypes = [
  { value: 'DAY', label: 'Day Shift' },
  { value: 'NIGHT', label: 'Night Shift' },
  { value: 'MORNING', label: 'Morning Shift' },
  { value: 'EVENING', label: 'Evening Shift' },
  { value: 'ROTATING', label: 'Rotating Shift' },
];

export function AssignOperatorSheet({
  machine,
  open,
  onOpenChange,
  onSuccess,
}: AssignOperatorSheetProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [formData, setFormData] = useState({
    operatorId: '',
    shiftType: 'DAY',
  });

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const tokens = AuthStorage.getTokens();
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setUsers(result.data || []);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;

    if (!formData.operatorId) {
      toast.error('Please select an operator');
      return;
    }

    setLoading(true);
    try {
      const response = await machineService.assignOperator(
        machine.id,
        formData.operatorId,
        formData.shiftType
      );

      if (response.success) {
        toast.success('Operator assigned successfully');
        onOpenChange(false);
        setFormData({ operatorId: '', shiftType: 'DAY' });
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to assign operator');
      }
    } catch {
      toast.error('Failed to assign operator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <UserPlus className='h-5 w-5 text-primary' />
            Assign Operator - {machine?.machineCode}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
          <div className='space-y-2'>
            <Label>Operator *</Label>
            {loadingUsers ? (
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Loading users...
              </div>
            ) : (
              <Select
                value={formData.operatorId}
                onValueChange={value => setFormData(prev => ({ ...prev, operatorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select an operator' />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                      {user.email && ` (${user.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className='space-y-2'>
            <Label>Shift Type</Label>
            <Select
              value={formData.shiftType}
              onValueChange={value => setFormData(prev => ({ ...prev, shiftType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {shiftTypes.map(shift => (
                  <SelectItem key={shift.value} value={shift.value}>
                    {shift.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {machine?.currentOperator && (
            <div className='p-3 bg-muted rounded-lg'>
              <p className='text-sm text-muted-foreground'>Current Operator:</p>
              <p className='font-medium'>
                {machine.currentOperator.firstName} {machine.currentOperator.lastName}
              </p>
            </div>
          )}

          <SheetFooter className='pt-4'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading || loadingUsers}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Assign Operator
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
