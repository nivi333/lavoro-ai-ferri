import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { History, Loader2, ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/config/api';
import { AuthStorage } from '@/utils/storage';

interface StockHistoryDialogProps {
  productId: string | null;
  productName?: string;
  locationId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StockMovement {
  id: string;
  movementType: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

const movementTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  PURCHASE: { icon: <ArrowUp className='h-4 w-4' />, color: 'bg-green-500', label: 'Purchase' },
  SALE: { icon: <ArrowDown className='h-4 w-4' />, color: 'bg-blue-500', label: 'Sale' },
  TRANSFER_IN: { icon: <ArrowLeftRight className='h-4 w-4' />, color: 'bg-purple-500', label: 'Transfer In' },
  TRANSFER_OUT: { icon: <ArrowLeftRight className='h-4 w-4' />, color: 'bg-orange-500', label: 'Transfer Out' },
  ADJUSTMENT: { icon: <ArrowLeftRight className='h-4 w-4' />, color: 'bg-yellow-500', label: 'Adjustment' },
  PRODUCTION: { icon: <ArrowUp className='h-4 w-4' />, color: 'bg-teal-500', label: 'Production' },
  RETURN: { icon: <ArrowUp className='h-4 w-4' />, color: 'bg-cyan-500', label: 'Return' },
  DAMAGE: { icon: <ArrowDown className='h-4 w-4' />, color: 'bg-red-500', label: 'Damage' },
};

export function StockHistoryDialog({
  productId,
  productName,
  locationId,
  open,
  onOpenChange,
}: StockHistoryDialogProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && productId) {
      fetchHistory();
    }
  }, [open, productId, locationId]);

  const fetchHistory = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const tokens = AuthStorage.getTokens();
      const params = new URLSearchParams({ productId });
      if (locationId) params.append('locationId', locationId);

      const response = await fetch(`${API_BASE_URL}/inventory/movements?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setMovements(result.data || []);
      } else {
        setMovements([]);
      }
    } catch {
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const getMovementConfig = (type: string) => {
    return movementTypeConfig[type] || { 
      icon: <ArrowLeftRight className='h-4 w-4' />, 
      color: 'bg-gray-500', 
      label: type 
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <History className='h-5 w-5' />
            Stock History {productName && `- ${productName}`}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : movements.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            No stock movement history available.
          </div>
        ) : (
          <div className='max-h-[400px] overflow-y-auto pr-4'>
            <div className='space-y-3'>
              {movements.map((movement, index) => {
                const config = getMovementConfig(movement.movementType);
                const isIncrease = movement.quantity > 0;
                
                return (
                  <div
                    key={movement.id || index}
                    className='flex gap-3 p-3 border rounded-lg'
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${config.color} text-white`}>
                      {config.icon}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between gap-2'>
                        <Badge variant='outline' className='text-xs'>
                          {config.label}
                        </Badge>
                        <span className={`font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncrease ? '+' : ''}{movement.quantity}
                        </span>
                      </div>
                      <div className='text-sm text-muted-foreground mt-1'>
                        {movement.previousQuantity} → {movement.newQuantity}
                      </div>
                      <div className='text-xs text-muted-foreground mt-1'>
                        {format(new Date(movement.createdAt), 'PPp')}
                      </div>
                      {movement.notes && (
                        <p className='text-sm mt-1'>{movement.notes}</p>
                      )}
                      {movement.createdBy && (
                        <p className='text-xs text-muted-foreground'>
                          By: {movement.createdBy.firstName} {movement.createdBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
