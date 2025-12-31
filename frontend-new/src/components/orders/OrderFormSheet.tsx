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

import { orderService, CreateOrderRequest, OrderDetail } from '@/services/orderService';
import { customerService, Customer } from '@/services/customerService';
import { locationService, Location } from '@/services/locationService';
import { productService, ProductSummary } from '@/services/productService';

const orderItemSchema = z.object({
  productId: z.string().optional(),
  itemCode: z.string().min(1, 'Item code is required'),
  description: z.string().optional(),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0'),
  unitOfMeasure: z.string().min(1, 'UOM is required'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
});

const orderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  orderDate: z.date({
    required_error: 'Order date is required',
    invalid_type_error: 'Please select a valid date',
  }),
  deliveryDate: z.date().optional(),
  currency: z.string().max(10).optional(),
  notes: z.string().max(1000).optional(),
  locationId: z.string().optional(),
  shippingCarrier: z.string().max(255).optional(),
  trackingNumber: z.string().max(255).optional(),
  shippingMethod: z.string().max(255).optional(),
  deliveryWindowStart: z.date().optional(),
  deliveryWindowEnd: z.date().optional(),
  isActive: z.boolean().default(true),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

// Explicitly type the form values
type OrderFormValues = z.infer<typeof orderSchema>;

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

interface OrderFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: OrderDetail | null;
}

export function OrderFormSheet({ open, onClose, onSaved, initialData }: OrderFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);

  const isEditing = !!initialData;

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema) as any,
    defaultValues: {
      currency: 'INR',
      orderDate: new Date(),
      isActive: true,
      items: [
        {
          itemCode: '',
          description: '',
          quantity: 1,
          unitOfMeasure: 'PCS',
          unitPrice: 0,
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
      const [customersRes, locationsRes, productsRes] = await Promise.all([
        customerService.getCustomers({ isActive: true }),
        locationService.getLocations(),
        productService.getProducts({ isActive: true, limit: 1000 }),
      ]);
      setCustomers(customersRes.customers || []);
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
        // Need to cast optional dates properly for RHF
        form.reset({
          customerId: initialData.customerId || (initialData.customer?.id as string),
          orderDate: new Date(initialData.orderDate),
          deliveryDate: initialData.deliveryDate ? new Date(initialData.deliveryDate) : undefined,
          currency: initialData.currency || 'INR',
          notes: initialData.notes || '',
          locationId: initialData.locationId || undefined,
          shippingCarrier: initialData.shippingCarrier || undefined,
          trackingNumber: initialData.trackingNumber || undefined,
          shippingMethod: initialData.shippingMethod || undefined,
          deliveryWindowStart: initialData.deliveryWindowStart
            ? new Date(initialData.deliveryWindowStart)
            : undefined,
          deliveryWindowEnd: initialData.deliveryWindowEnd
            ? new Date(initialData.deliveryWindowEnd)
            : undefined,
          isActive: initialData.isActive ?? true,
          items: initialData.items.map(item => ({
            productId: item.productId || undefined,
            itemCode: item.itemCode,
            description: item.description || '',
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure,
            unitPrice: item.unitPrice,
          })),
        });
      } else {
        form.reset({
          currency: 'INR',
          orderDate: new Date(),
          isActive: true,
          items: [
            {
              itemCode: '',
              description: '',
              quantity: 1,
              unitOfMeasure: 'PCS',
              unitPrice: 0,
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
      form.setValue(`items.${index}.unitPrice`, product.sellingPrice);
    }
  };

  const onSubmit = async (values: OrderFormValues) => {
    setSubmitting(true);
    try {
      // Find customer details
      const selectedCustomer = customers.find(c => c.id === values.customerId);

      const payload: CreateOrderRequest = {
        customerId: values.customerId,
        customerName: selectedCustomer ? selectedCustomer.name : '',
        customerCode: selectedCustomer?.code,
        orderDate: values.orderDate.toISOString(),
        deliveryDate: values.deliveryDate?.toISOString(),
        currency: values.currency,
        notes: values.notes,
        locationId: values.locationId,
        shippingCarrier: values.shippingCarrier,
        trackingNumber: values.trackingNumber,
        shippingMethod: values.shippingMethod,
        deliveryWindowStart: values.deliveryWindowStart?.toISOString(),
        deliveryWindowEnd: values.deliveryWindowEnd?.toISOString(),
        items: values.items.map(item => ({
          ...item,
          productId: item.productId || undefined,
        })),
      };

      if (isEditing && initialData?.orderId) {
        await orderService.updateOrder(initialData.orderId, payload);
        toast.success('Order updated successfully');
      } else {
        await orderService.createOrder(payload);
        toast.success('Order created successfully');
      }
      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving order:', error);
      toast.error(error.message || 'Failed to save order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={val => !val && onClose()}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader>
          <div className='flex items-center justify-between'>
            <SheetTitle>{isEditing ? 'Edit Sales Order' : 'Create Sales Order'}</SheetTitle>
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
            {/* Order Info */}
            <div>
              <h3 className='text-sm font-medium'>Order Info</h3>
              <div className='grid grid-cols-2 gap-4'>
                <div className='no-form-context-needed space-y-2'>
                  <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Order Code
                  </label>
                  <Input disabled placeholder='Auto-generated' value={initialData?.orderId || ''} />
                </div>

                <FormField
                  control={form.control}
                  name='customerId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        Customer
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select customer' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} {customer.code ? `(${customer.code})` : ''}
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
                  name='orderDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        Order Date
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
                          <SelectValue placeholder='Select shipping location' />
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
                      unitPrice: 0,
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
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                            Unit Price
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
                  name='deliveryDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Delivery Date</FormLabel>
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

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='shippingCarrier'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Carrier</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder='e.g., FedEx, DHL'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='trackingNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder='Tracking number' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='deliveryWindowStart'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Delivery Window Start</FormLabel>
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
                  name='deliveryWindowEnd'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Delivery Window End</FormLabel>
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
              </div>
            </div>

            <SheetFooter className='gap-2'>
              <Button type='button' variant='outline' onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEditing ? 'Update Sales Order' : 'Create Sales Order'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
