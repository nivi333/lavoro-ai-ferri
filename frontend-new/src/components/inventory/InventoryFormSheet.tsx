import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Separator } from '@/components/ui/separator';
// import ProductSelector from '@/components/products/ProductSelector'; // TODO: Check if ProductSelector is migrated or use generic Select for now
import { inventoryService, UpdateLocationInventoryRequest } from '@/services/inventoryService';
import { locationService } from '@/services/locationService';
import { productService } from '@/services/productService'; // Need to fetch products if selector is not ready
import useAuth from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Schema matching InventoryFormDrawer validation
const inventorySchema = z.object({
  inventoryCode: z.string().optional(), // Auto-generated
  productId: z.string().min(1, 'Please select a product'),
  locationId: z.string().min(1, 'Please select a location'),
  stockQuantity: z.coerce.number().min(0, 'Stock quantity must be 0 or greater'),
  reservedQuantity: z.coerce.number().min(0, 'Reserved quantity must be 0 or greater').optional(),
  value: z.coerce.number().optional(), // Display only really, but kept in form for now? Actually drawer has it as input
  reorderLevel: z.coerce.number().min(0).optional(),
  maxStockLevel: z.coerce.number().min(0).optional(),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

interface InventoryFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function InventoryFormSheet({ open, onClose, onSaved }: InventoryFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); // Simple product list for now if selector isn't ready
  const { currentCompany } = useAuth();

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      stockQuantity: 0,
      reservedQuantity: 0,
    },
  });

  // Reset form when opening
  useEffect(() => {
    if (open) {
      form.reset({
        stockQuantity: 0,
        reservedQuantity: 0,
      });
      if (currentCompany?.id) {
        fetchLocations();
        fetchProducts();
      }
    }
  }, [open, currentCompany?.id, form]);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getLocations();
      setLocations(response || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const fetchProducts = async () => {
    try {
      // Assuming productService has getProducts. If not, we might need to verify.
      // Based on previous tasks, productService exists.
      const response = await productService.getProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fail silently for dropdown population or toast?
    }
  };

  const onSubmit = async (values: InventoryFormValues) => {
    setLoading(true);
    try {
      const payload: UpdateLocationInventoryRequest = {
        productId: values.productId,
        locationId: values.locationId,
        stockQuantity: values.stockQuantity,
        reservedQuantity: values.reservedQuantity || 0,
        reorderLevel: values.reorderLevel,
        maxStockLevel: values.maxStockLevel,
      };

      await inventoryService.updateLocationInventory(payload);
      toast.success('Inventory added successfully');
      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error adding inventory:', error);
      toast.error(error.message || 'Failed to add inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader className='pb-4'>
          <SheetTitle>Add Inventory</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Section 1: Product & Location */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Product & Location</h3>

              <FormField
                control={form.control}
                name='inventoryCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory Code</FormLabel>
                    <FormControl>
                      <Input placeholder='Auto-generated (e.g., INV001)' disabled {...field} />
                    </FormControl>
                    <FormDescription>Auto-generated upon creation</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='productId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Product</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select product' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.productCode})
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select location' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                            {location.isDefault && ' (Default)'}
                            {location.isHeadquarters && ' (HQ)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Section 2: Stock Levels */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Stock Levels</h3>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='stockQuantity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          placeholder='Enter stock quantity'
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='reservedQuantity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reserved Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          placeholder='Enter reserved quantity'
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
                  name='value'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='0.01'
                          placeholder='Enter inventory value'
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Total value of inventory stock</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Section 3: Reorder Settings */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Reorder Settings (Optional)
              </h3>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='reorderLevel'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          placeholder='Enter reorder level'
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Minimum stock level before alert</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='maxStockLevel'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Stock Level</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          placeholder='Enter max stock level'
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Maximum stock level to maintain</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter className='pt-4'>
              <Button type='button' variant='outline' onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Add Inventory
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
