import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { History, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Machine, machineService } from '@/services/machineService';

interface MachineHistoryDialogProps {
  machine: Machine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StatusHistoryItem {
  id: string;
  previousStatus: string;
  newStatus: string;
  changedAt: string;
  changedBy?: string;
  reason?: string;
}

const statusColors: Record<string, string> = {
  IN_USE: 'bg-green-500',
  IDLE: 'bg-gray-500',
  UNDER_MAINTENANCE: 'bg-yellow-500',
  UNDER_REPAIR: 'bg-orange-500',
  DECOMMISSIONED: 'bg-red-500',
};

export function MachineHistoryDialog({
  machine,
  open,
  onOpenChange,
}: MachineHistoryDialogProps) {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && machine) {
      fetchHistory();
    }
  }, [open, machine]);

  const fetchHistory = async () => {
    if (!machine) return;
    setLoading(true);
    try {
      const data = await machineService.getMachineStatusHistory(machine.id);
      setHistory(data || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <History className='h-5 w-5' />
            Machine History - {machine?.machineCode}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : history.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            No status history available for this machine.
          </div>
        ) : (
          <div className='max-h-[400px] overflow-y-auto pr-4'>
            <div className='space-y-4'>
              {history.map((item, index) => (
                <div
                  key={item.id || index}
                  className='flex gap-4 pb-4 border-b last:border-0'
                >
                  <div className='flex flex-col items-center'>
                    <div
                      className={`w-3 h-3 rounded-full ${statusColors[item.newStatus] || 'bg-gray-400'}`}
                    />
                    {index < history.length - 1 && (
                      <div className='w-0.5 h-full bg-border mt-1' />
                    )}
                  </div>
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' className='text-xs'>
                        {formatStatus(item.previousStatus)}
                      </Badge>
                      <span className='text-muted-foreground'>→</span>
                      <Badge className='text-xs'>{formatStatus(item.newStatus)}</Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {format(new Date(item.changedAt), 'PPp')}
                    </p>
                    {item.reason && (
                      <p className='text-sm'>Reason: {item.reason}</p>
                    )}
                    {item.changedBy && (
                      <p className='text-xs text-muted-foreground'>
                        Changed by: {item.changedBy}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
