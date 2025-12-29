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
import { inventoryService, StockReservationRequest } from '@/services/inventoryService';
import { locationService } from '@/services/locationService';
import { productService } from '@/services/productService';
import { toast } from 'sonner';

const reservationSchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  locationId: z.string().min(1, 'Please select a location'),
  reservedQuantity: z.coerce.number().min(1, 'Quantity must be greater than 0'),
  reservationType: z.enum(['ORDER', 'PRODUCTION', 'TRANSFER', 'MANUAL']),
  notes: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

interface StockReservationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProductId?: string;
  initialLocationId?: string;
}

export function StockReservationDialog({
  open,
  onClose,
  onSuccess,
  initialProductId,
  initialLocationId,
}: StockReservationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      reservationType: 'MANUAL',
      reservedQuantity: 1,
      productId: initialProductId || '',
      locationId: initialLocationId || '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialProductId) form.setValue('productId', initialProductId);
      if (initialLocationId) form.setValue('locationId', initialLocationId);

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

  const onSubmit = async (values: ReservationFormValues) => {
    setLoading(true);
    try {
      const payload: StockReservationRequest = {
        productId: values.productId,
        locationId: values.locationId,
        reservedQuantity: values.reservedQuantity,
        reservationType: values.reservationType,
        notes: values.notes,
      };

      await inventoryService.createStockReservation(payload);
      toast.success('Stock reservation created successfully');
      form.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error(error.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={val => !val && onClose()}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Create Stock Reservation</DialogTitle>
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
                    disabled={!!initialProductId}
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

            <FormField
              control={form.control}
              name='locationId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Location</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!initialLocationId}
                  >
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

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='reservationType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='ORDER'>Order</SelectItem>
                        <SelectItem value='PRODUCTION'>Production</SelectItem>
                        <SelectItem value='TRANSFER'>Transfer</SelectItem>
                        <SelectItem value='MANUAL'>Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='reservedQuantity'
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
                Create Reservation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
