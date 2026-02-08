import { useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Machine, machineService } from '@/services/machineService';

interface MaintenanceScheduleSheetProps {
  machine: Machine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const maintenanceTypes = [
  { value: 'PREVENTIVE', label: 'Preventive Maintenance' },
  { value: 'CORRECTIVE', label: 'Corrective Maintenance' },
  { value: 'PREDICTIVE', label: 'Predictive Maintenance' },
  { value: 'ROUTINE', label: 'Routine Inspection' },
  { value: 'CALIBRATION', label: 'Calibration' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'LUBRICATION', label: 'Lubrication' },
  { value: 'PARTS_REPLACEMENT', label: 'Parts Replacement' },
];

export function MaintenanceScheduleSheet({
  machine,
  open,
  onOpenChange,
  onSuccess,
}: MaintenanceScheduleSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    maintenanceType: 'PREVENTIVE',
    scheduledDate: '',
    description: '',
    estimatedDuration: '',
    priority: 'MEDIUM',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;

    if (!formData.scheduledDate) {
      toast.error('Please select a scheduled date');
      return;
    }

    setLoading(true);
    try {
      const response = await machineService.scheduleMaintenance({
        machineId: machine.id,
        maintenanceType: formData.maintenanceType,
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        description: formData.description || undefined,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
        priority: formData.priority,
      });

      if (response.success) {
        toast.success('Maintenance scheduled successfully');
        onOpenChange(false);
        setFormData({
          maintenanceType: 'PREVENTIVE',
          scheduledDate: '',
          description: '',
          estimatedDuration: '',
          priority: 'MEDIUM',
        });
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to schedule maintenance');
      }
    } catch {
      toast.error('Failed to schedule maintenance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5 text-primary' />
            Schedule Maintenance - {machine?.machineCode}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
          <div className='space-y-2'>
            <Label>Maintenance Type *</Label>
            <Select
              value={formData.maintenanceType}
              onValueChange={value => setFormData(prev => ({ ...prev, maintenanceType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {maintenanceTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='scheduledDate'>Scheduled Date *</Label>
            <Input
              id='scheduledDate'
              type='datetime-local'
              value={formData.scheduledDate}
              onChange={e => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
            />
          </div>

          <div className='space-y-2'>
            <Label>Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={value => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='URGENT'>Urgent</SelectItem>
                <SelectItem value='HIGH'>High</SelectItem>
                <SelectItem value='MEDIUM'>Medium</SelectItem>
                <SelectItem value='LOW'>Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='estimatedDuration'>Estimated Duration (minutes)</Label>
            <Input
              id='estimatedDuration'
              type='number'
              placeholder='e.g., 60'
              value={formData.estimatedDuration}
              onChange={e => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              placeholder='Additional notes about the maintenance...'
              rows={3}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <SheetFooter className='pt-4'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Schedule
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
