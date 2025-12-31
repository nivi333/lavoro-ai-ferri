import { useCallback, useState, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Trash2, CalendarIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

import {
  purchaseOrderService,
  CreatePurchaseOrderRequest,
  PurchaseOrderDetail,
} from '@/services/purchaseOrderService';
import { supplierService, Supplier } from '@/services/supplierService';
import { locationService, Location } from '@/services/locationService';
import { productService, ProductSummary } from '@/services/productService';

const purchaseOrderItemSchema = z.object({
  productId: z.string().optional(),
  itemCode: z.string().min(1, 'Item code is required'),
  description: z.string().optional(),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0'),
  unitOfMeasure: z.string().min(1, 'UOM is required'),
  unitCost: z.number().min(0, 'Unit cost must be non-negative'),
});

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  poDate: z.date({
    required_error: 'PO date is required',
    invalid_type_error: 'Please select a valid date',
  }),
  expectedDeliveryDate: z.date().optional(),
  currency: z.string().max(10).optional(),
  notes: z.string().max(1000).optional(),
  locationId: z.string().optional(),
  shippingMethod: z.string().max(255).optional(),
  isActive: z.boolean().default(true),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

const UOM_OPTIONS = [
  { value: 'PCS', label: 'PCS - Pieces' },
  { value: 'MTR', label: 'MTR - Meters' },
  { value: 'YDS', label: 'YDS - Yards' },
  { value: 'KG', label: 'KG - Kilograms' },
  { value: 'LBS', label: 'LBS - Pounds' },
  { value: 'ROLL', label: 'ROLL - Rolls' },
  { value: 'BOX', label: 'BOX - Boxes' },
  { value: 'CTN', label: 'CTN - Cartons' },
  { value: 'DOZ', label: 'DOZ - Dozens' },
  { value: 'SET', label: 'SET - Sets' },
  { value: 'BALE', label: 'BALE - Bales' },
  { value: 'CONE', label: 'CONE - Cones' },
  { value: 'SPOOL', label: 'SPOOL - Spools' },
];

interface PurchaseOrderFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: PurchaseOrderDetail | null;
}

export function PurchaseOrderFormSheet({
  open,
  onClose,
  onSaved,
  initialData,
}: PurchaseOrderFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);

  const isEditing = !!initialData;

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema) as any,
    defaultValues: {
      currency: 'INR',
      poDate: new Date(),
      isActive: true,
      items: [
        {
          itemCode: '',
          description: '',
          quantity: 1,
          unitOfMeasure: 'PCS',
          unitCost: 0,
          productId: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [suppliersRes, locationsRes, productsRes] = await Promise.all([
        supplierService.getSuppliers({ isActive: true }),
        locationService.getLocations(),
        productService.getProducts({ isActive: true, limit: 1000 }),
      ]);
      setSuppliers(suppliersRes.suppliers || []);
      setLocations(locationsRes || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error fetching dependency data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchData();
      if (initialData) {
        // Populate form
        form.reset({
          supplierId: initialData.supplierId || (initialData.supplier?.id as string),
          poDate: new Date(initialData.poDate),
          expectedDeliveryDate: initialData.expectedDeliveryDate
            ? new Date(initialData.expectedDeliveryDate)
            : undefined,
          currency: initialData.currency || 'INR',
          notes: initialData.notes || '',
          locationId: initialData.locationId || undefined,
          shippingMethod: initialData.shippingMethod || undefined,
          isActive: initialData.isActive ?? true,
          items: initialData.items.map(item => ({
            productId: item.productId || undefined,
            itemCode: item.itemCode,
            description: item.description || '',
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure,
            unitCost: item.unitCost,
          })),
        });
      } else {
        form.reset({
          currency: 'INR',
          poDate: new Date(),
          isActive: true,
          items: [
            {
              itemCode: '',
              description: '',
              quantity: 1,
              unitOfMeasure: 'PCS',
              unitCost: 0,
            },
          ],
        });
      }
    }
  }, [open, initialData, form, fetchData]);

  const handleProductChange = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.itemCode`, product.productCode);
      form.setValue(`items.${index}.description`, product.name);
      form.setValue(`items.${index}.unitOfMeasure`, product.unitOfMeasure);
      form.setValue(`items.${index}.unitCost`, product.costPrice);
    }
  };

  const onSubmit = async (values: PurchaseOrderFormValues) => {
    setSubmitting(true);
    try {
      // Find supplier details
      const selectedSupplier = suppliers.find(s => s.id === values.supplierId);

      const payload: CreatePurchaseOrderRequest = {
        supplierId: values.supplierId,
        supplierName: selectedSupplier ? selectedSupplier.name : '',
        supplierCode: selectedSupplier?.code,
        poDate: values.poDate.toISOString(),
        expectedDeliveryDate: values.expectedDeliveryDate?.toISOString(),
        currency: values.currency,
        notes: values.notes,
        locationId: values.locationId,
        shippingMethod: values.shippingMethod,
        items: values.items.map(item => ({
          ...item,
          productId: item.productId || undefined,
        })),
      };

      if (isEditing && initialData?.poId) {
        await purchaseOrderService.updatePurchaseOrder(initialData.poId, payload);
        toast.success('Purchase order updated successfully');
      } else {
        await purchaseOrderService.createPurchaseOrder(payload);
        toast.success('Purchase order created successfully');
      }
      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving purchase order:', error);
      toast.error(error.message || 'Failed to save purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={val => !val && onClose()}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader>
          <div className='flex items-center justify-between'>
            <SheetTitle>{isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}</SheetTitle>
            {isEditing && (
              <div className='flex items-center gap-2 mr-6'>
                <span className='text-sm font-medium'>Active</span>
                <Switch
                  checked={form.watch('isActive')}
                  onCheckedChange={checked => form.setValue('isActive', checked)}
                />
              </div>
            )}
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 mt-2'>
            {/* Purchase Order Info */}
            <div>
              <h3 className='text-sm font-medium'>Purchase Order Info</h3>
              <div className='grid grid-cols-2 gap-4'>
                <div className='no-form-context-needed space-y-2'>
                  <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    PO Code
                  </label>
                  <Input disabled placeholder='Auto-generated' value={initialData?.poId || ''} />
                </div>

                <FormField
                  control={form.control}
                  name='supplierId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        Supplier
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select supplier' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name} {supplier.code ? `(${supplier.code})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='poDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        PO Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='currency'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder='INR'
                          maxLength={10}
                          value={field.value || ''}
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
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder='Optional notes'
                        maxLength={1000}
                        className='resize-none'
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='locationId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select receiving location' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                            {loc.isHeadquarters ? ' • HQ' : ''}
                            {loc.isDefault ? ' • Default' : ''}
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

            {/* Items */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-medium'>Items</h3>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    append({
                      itemCode: '',
                      description: '',
                      quantity: 1,
                      unitOfMeasure: 'PCS',
                      unitCost: 0,
                    })
                  }
                >
                  <Plus className='mr-2 h-4 w-4' /> Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className='space-y-4 p-4 border rounded-md relative bg-muted/5'>
                  {fields.length > 1 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive'
                      onClick={() => remove(index)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  )}

                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select
                          onValueChange={val => {
                            field.onChange(val);
                            handleProductChange(val, index);
                          }}
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Search and select product (optional)' />
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

                  <div className='grid grid-cols-12 gap-3'>
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemCode`}
                      render={({ field }) => (
                        <FormItem className='col-span-3'>
                          <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                            Item Code
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder='Code' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem className='col-span-4'>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder='Description' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className='col-span-2'>
                          <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                            Qty
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='1'
                              min='0'
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
                      name={`items.${index}.unitOfMeasure`}
                      render={({ field }) => (
                        <FormItem className='col-span-3'>
                          <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                            UOM
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='UOM' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UOM_OPTIONS.map(uom => (
                                <SelectItem key={uom.value} value={uom.value}>
                                  {uom.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitCost`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                            Unit Cost
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              min='0'
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              {form.formState.errors.items?.root && (
                <p className='text-sm font-medium text-destructive'>
                  {form.formState.errors.items.root.message}
                </p>
              )}
            </div>

            <Separator />

            {/* Delivery Details */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium'>Delivery Details</h3>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='expectedDeliveryDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Expected Delivery Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='shippingMethod'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Shipping Method</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder='e.g., Air, Sea, Road'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter className='gap-2'>
              <Button type='button' variant='outline' onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEditing ? 'Update Purchase Order' : 'Create Purchase Order'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
