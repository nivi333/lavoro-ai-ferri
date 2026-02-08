import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
import { Machine, machineService, BreakdownSeverity, BreakdownPriority } from '@/services/machineService';

interface BreakdownReportSheetProps {
  machine: Machine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BreakdownReportSheet({
  machine,
  open,
  onOpenChange,
  onSuccess,
}: BreakdownReportSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM' as BreakdownSeverity,
    priority: 'MEDIUM' as BreakdownPriority,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;

    if (!formData.title.trim()) {
      toast.error('Please enter a title for the breakdown report');
      return;
    }

    setLoading(true);
    try {
      const response = await machineService.reportBreakdown({
        machineId: machine.id,
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        priority: formData.priority,
        breakdownTime: new Date().toISOString(),
      });

      if (response.success) {
        toast.success('Breakdown reported successfully');
        onOpenChange(false);
        setFormData({ title: '', description: '', severity: 'MEDIUM', priority: 'MEDIUM' });
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to report breakdown');
      }
    } catch {
      toast.error('Failed to report breakdown');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-destructive' />
            Report Breakdown - {machine?.machineCode}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Title *</Label>
            <Input
              id='title'
              placeholder='Brief description of the issue'
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              placeholder='Detailed description of the breakdown...'
              rows={4}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: BreakdownSeverity) =>
                  setFormData(prev => ({ ...prev, severity: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='CRITICAL'>Critical</SelectItem>
                  <SelectItem value='HIGH'>High</SelectItem>
                  <SelectItem value='MEDIUM'>Medium</SelectItem>
                  <SelectItem value='LOW'>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: BreakdownPriority) =>
                  setFormData(prev => ({ ...prev, priority: value }))
                }
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
          </div>

          <SheetFooter className='pt-4'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Report Breakdown
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
