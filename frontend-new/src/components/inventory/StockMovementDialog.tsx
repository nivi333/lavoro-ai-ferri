import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { inventoryService, StockMovementRequest } from '@/services/inventoryService';
import { locationService } from '@/services/locationService';
import { productService } from '@/services/productService';
import { toast } from 'sonner';

const movementSchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  movementType: z.enum([
    'PURCHASE',
    'SALE',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'PRODUCTION_IN',
    'PRODUCTION_OUT',
    'RETURN_IN',
    'RETURN_OUT',
    'DAMAGE',
  ]),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be greater than 0'),
  notes: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface StockMovementDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProductId?: string;
  initialLocationId?: string;
}

export function StockMovementDialog({
  open,
  onClose,
  onSuccess,
  initialProductId,
  initialLocationId,
}: StockMovementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      movementType: 'ADJUSTMENT_IN',
      quantity: 1,
      productId: initialProductId || '',
      fromLocationId: initialLocationId || '',
      // toLocationId default depends on logic, leave empty
    },
  });

  useEffect(() => {
    if (open) {
      if (initialProductId) {
        form.setValue('productId', initialProductId);
      }
      // If we have initialLocationId, set it based on type?
      // For now, let's just fetch data.
      fetchLocations();
      fetchProducts();
    }
  }, [open, initialProductId, initialLocationId, form]);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getLocations();
      setLocations(response || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const onSubmit = async (values: MovementFormValues) => {
    setLoading(true);
    try {
      const payload: StockMovementRequest = {
        productId: values.productId,
        movementType: values.movementType,
        quantity: values.quantity,
        notes: values.notes,
        fromLocationId: values.fromLocationId,
        toLocationId: values.toLocationId,
      };

      // Basic validation logic for locations based on type
      if (values.movementType === 'TRANSFER_IN' || values.movementType === 'TRANSFER_OUT') {
        if (!values.fromLocationId || !values.toLocationId) {
          toast.error('Both From and To locations are required for transfers');
          setLoading(false);
          return;
        }
      }

      // For adjustments, we might need at least one location.
      // The API interface defines them as optional, but logically one should be present.
      // We'll trust the user/form requirements for now or add refinements if needed.

      await inventoryService.recordStockMovement(payload);
      toast.success('Stock movement recorded successfully');
      form.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error recording movement:', error);
      toast.error(error.message || 'Failed to record movement');
    } finally {
      setLoading(false);
    }
  };

  const movementTypes = [
    { value: 'PURCHASE', label: 'Purchase (In)' },
    { value: 'SALE', label: 'Sale (Out)' },
    { value: 'TRANSFER_IN', label: 'Transfer In' },
    { value: 'TRANSFER_OUT', label: 'Transfer Out' },
    { value: 'ADJUSTMENT_IN', label: 'Adjustment (In)' },
    { value: 'ADJUSTMENT_OUT', label: 'Adjustment (Out)' },
    { value: 'PRODUCTION_IN', label: 'Production (In)' },
    { value: 'PRODUCTION_OUT', label: 'Production (Out)' },
    { value: 'RETURN_IN', label: 'Return (In)' },
    { value: 'RETURN_OUT', label: 'Return (Out)' },
    { value: 'DAMAGE', label: 'Damage (Out)' },
  ];

  return (
    <Dialog open={open} onOpenChange={val => !val && onClose()}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='productId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Product</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!initialProductId} // Disable if pre-selected from row
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select product' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='movementType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Movement Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {movementTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='quantity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='1'
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='fromLocationId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select location' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='toLocationId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select location' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Add any notes...' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='button' variant='outline' onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Record Movement
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
