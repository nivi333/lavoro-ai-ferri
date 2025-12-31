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
  invoiceService,
  CreateInvoiceRequest,
  InvoiceDetail,
  PaymentTerms,
} from '@/services/invoiceService';
import { customerService, Customer } from '@/services/customerService';
import { locationService, Location } from '@/services/locationService';
import { productService, ProductSummary } from '@/services/productService';
import { orderService, OrderSummary } from '@/services/orderService';

const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  itemCode: z.string().min(1, 'Item code is required'),
  description: z.string().optional(),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0'),
  unitOfMeasure: z.string().min(1, 'UOM is required'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  discountPercent: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().optional(),
  customerCode: z.string().optional(),
  orderId: z.string().optional(),
  locationId: z.string().min(1, 'Location is required'),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.date({
    required_error: 'Invoice date is required',
    invalid_type_error: 'Please select a valid date',
  }),
  dueDate: z.date({
    required_error: 'Due date is required',
    invalid_type_error: 'Please select a valid date',
  }),
  paymentTerms: z.string().optional(),
  currency: z.string().max(10).optional(),
  shippingCharges: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
  termsConditions: z.string().max(2000).optional(),
  bankDetails: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

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

const PAYMENT_TERMS_OPTIONS = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'NET_15', label: 'Net 15 Days' },
  { value: 'NET_30', label: 'Net 30 Days' },
  { value: 'NET_60', label: 'Net 60 Days' },
  { value: 'NET_90', label: 'Net 90 Days' },
  { value: 'ADVANCE', label: 'Advance Payment' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'CREDIT', label: 'Credit' },
];

interface InvoiceFormSheetProps {
  open: boolean;
  onClose: () => void;
  initialData?: InvoiceDetail | null;
}

export function InvoiceFormSheet({ open, onClose, initialData }: InvoiceFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  const isEditing = !!initialData;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      currency: 'INR',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentTerms: 'NET_30',
      isActive: true,
      shippingCharges: 0,
      items: [
        {
          itemCode: '',
          description: '',
          quantity: 1,
          unitOfMeasure: 'PCS',
          unitPrice: 0,
          discountPercent: 0,
          taxRate: 0,
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
      const [customersRes, locationsRes, productsRes, ordersRes] = await Promise.all([
        customerService.getCustomers({ isActive: true }),
        locationService.getLocations(),
        productService.getProducts({ isActive: true, limit: 1000 }),
        orderService.getOrders(),
      ]);
      setCustomers(customersRes.customers || []);
      setLocations(locationsRes || []);
      setProducts(productsRes.data || []);
      setOrders((ordersRes || []).filter(o => o.status !== 'CANCELLED'));
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
          customerId: initialData.customerId,
          customerName: initialData.customerName,
          customerCode: initialData.customerCode || undefined,
          orderId: initialData.order?.orderId || undefined,
          locationId: initialData.locationId,
          invoiceNumber: initialData.invoiceNumber || undefined,
          invoiceDate: new Date(initialData.invoiceDate),
          dueDate: new Date(initialData.dueDate),
          paymentTerms: initialData.paymentTerms || undefined,
          currency: initialData.currency || 'INR',
          shippingCharges: Number(initialData.shippingCharges) || 0,
          notes: initialData.notes || undefined,
          termsConditions: initialData.termsConditions || undefined,
          bankDetails: initialData.bankDetails || undefined,
          isActive: initialData.isActive ?? true,
          items: initialData.items.map(item => ({
            productId: item.productId || undefined,
            itemCode: item.itemCode,
            description: item.description || '',
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent || 0,
            taxRate: item.taxRate || 0,
          })),
        });
      } else {
        const defaultLocation = locations.find(l => l.isDefault && l.isHeadquarters);
        form.reset({
          currency: 'INR',
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentTerms: 'NET_30',
          isActive: true,
          shippingCharges: 0,
          locationId: defaultLocation?.id,
          items: [
            {
              itemCode: '',
              description: '',
              quantity: 1,
              unitOfMeasure: 'PCS',
              unitPrice: 0,
              discountPercent: 0,
              taxRate: 0,
            },
          ],
        });
      }
    }
  }, [open, initialData, form, fetchData, locations]);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      form.setValue('customerName', customer.name);
      form.setValue('customerCode', customer.code || undefined);
    }
  };

  const handleOrderChange = async (orderId: string) => {
    if (!orderId) return;
    try {
      const order = await orderService.getOrderById(orderId);
      if (order) {
        form.setValue('customerId', order.customerId || '');
        form.setValue('customerName', order.customerName);
        form.setValue('customerCode', order.customerCode || undefined);
        form.setValue('locationId', order.locationId || '');
        form.setValue(
          'items',
          order.items.map(item => ({
            productId: item.productId || undefined,
            itemCode: item.itemCode,
            description: item.description || '',
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent || 0,
            taxRate: item.taxRate || 0,
          }))
        );
      }
    } catch (error: any) {
      toast.error('Failed to load order details');
    }
  };

  const handleProductChange = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.itemCode`, product.productCode);
      form.setValue(`items.${index}.description`, product.name);
      form.setValue(`items.${index}.unitOfMeasure`, product.unitOfMeasure);
      form.setValue(`items.${index}.unitPrice`, product.sellingPrice);
    }
  };

  const handlePaymentTermsChange = (paymentTerms: string) => {
    const invoiceDate = form.watch('invoiceDate');
    if (invoiceDate) {
      let daysToAdd = 30;
      switch (paymentTerms) {
        case 'IMMEDIATE':
        case 'ADVANCE':
        case 'COD':
          daysToAdd = 0;
          break;
        case 'NET_15':
          daysToAdd = 15;
          break;
        case 'NET_30':
          daysToAdd = 30;
          break;
        case 'NET_60':
          daysToAdd = 60;
          break;
        case 'NET_90':
          daysToAdd = 90;
          break;
      }
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      form.setValue('dueDate', dueDate);
    }
  };

  const onSubmit = async (values: InvoiceFormValues) => {
    // Validate: if no order reference, product is required for each item
    if (!values.orderId) {
      for (let i = 0; i < values.items.length; i++) {
        if (!values.items[i].productId) {
          toast.error(`Product is required for item ${i + 1} when not linked to a Sales Order`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload: CreateInvoiceRequest = {
        customerId: values.customerId,
        customerName: values.customerName || '',
        customerCode: values.customerCode,
        orderId: values.orderId,
        locationId: values.locationId,
        invoiceNumber: values.invoiceNumber,
        invoiceDate: values.invoiceDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        paymentTerms: values.paymentTerms as PaymentTerms,
        currency: values.currency || 'INR',
        shippingCharges: values.shippingCharges || 0,
        notes: values.notes,
        termsConditions: values.termsConditions,
        bankDetails: values.bankDetails,
        items: values.items.map(item => ({
          productId: item.productId,
          itemCode: item.itemCode,
          description: item.description,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          taxRate: item.taxRate,
        })),
      };

      if (isEditing && initialData?.invoiceId) {
        await invoiceService.updateInvoice(initialData.invoiceId, payload);
        toast.success('Invoice updated successfully');
      } else {
        await invoiceService.createInvoice(payload);
        toast.success('Invoice created successfully');
      }
      onClose();
      window.location.reload(); // Refresh to show updated data
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast.error(error.message || 'Failed to save invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={val => !val && onClose()}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader>
          <div className='flex items-center justify-between'>
            <SheetTitle>{isEditing ? 'Edit Invoice' : 'Create Invoice'}</SheetTitle>
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
            {/* Invoice Info */}
            <div>
              <h3 className='text-sm font-medium'>Invoice Info</h3>

              <div className='grid grid-cols-2 gap-4'>
                <div className='no-form-context-needed space-y-2'>
                  <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Invoice Code
                  </label>
                  <Input
                    disabled
                    placeholder='Auto-generated'
                    value={initialData?.invoiceId || ''}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='invoiceNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder='Custom number (optional)'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='orderId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Order Reference</FormLabel>
                    <Select
                      onValueChange={val => {
                        field.onChange(val);
                        handleOrderChange(val);
                      }}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Link to Sales Order (optional)' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orders.map(order => (
                          <SelectItem key={order.orderId} value={order.orderId}>
                            {order.orderId} - {order.customerName}
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
                  name='customerId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        Customer
                      </FormLabel>
                      <Select
                        onValueChange={val => {
                          field.onChange(val);
                          handleCustomerChange(val);
                        }}
                        value={field.value}
                        disabled={loading}
                      >
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

                <FormField
                  control={form.control}
                  name='locationId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        Location
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select billing location' />
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

              <div className='grid grid-cols-3 gap-4'>
                <FormField
                  control={form.control}
                  name='invoiceDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        Invoice Date
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
                  name='paymentTerms'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <Select
                        onValueChange={val => {
                          field.onChange(val);
                          handlePaymentTermsChange(val);
                        }}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select terms' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_TERMS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
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
                  name='dueDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        Due Date
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
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='currency'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder='INR'
                          maxLength={10}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='shippingCharges'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Charges</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          min='0'
                          {...field}
                          value={field.value || 0}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          placeholder='0.00'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-medium'>
                  Invoice Items
                  {!form.watch('orderId') && (
                    <span className='text-xs text-destructive ml-2'>
                      (Product required when not linked to SO)
                    </span>
                  )}
                </h3>
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
                      discountPercent: 0,
                      taxRate: 0,
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
                  <div className='grid grid-cols-4 gap-4'>
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
                    <FormField
                      control={form.control}
                      name={`items.${index}.discountPercent`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount %</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              min='0'
                              max='100'
                              {...field}
                              value={field.value || 0}
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.taxRate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax %</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              min='0'
                              max='100'
                              {...field}
                              value={field.value || 0}
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
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

            {/* Additional Details */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium'>Additional Details</h3>

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
                name='termsConditions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder='Optional terms and conditions'
                        maxLength={2000}
                        className='resize-none'
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='bankDetails'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Details</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder='Optional bank details for payment'
                        maxLength={1000}
                        className='resize-none'
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className='gap-2'>
              <Button type='button' variant='outline' onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEditing ? 'Update Invoice' : 'Create Invoice'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
