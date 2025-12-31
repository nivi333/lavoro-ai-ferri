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

import { billService, CreateBillRequest, BillDetail, PaymentTerms } from '@/services/billService';
import { supplierService, Supplier } from '@/services/supplierService';
import { locationService, Location } from '@/services/locationService';
import { productService, ProductSummary } from '@/services/productService';
import { purchaseOrderService, PurchaseOrderSummary } from '@/services/purchaseOrderService';

const billItemSchema = z.object({
  productId: z.string().optional(),
  itemCode: z.string().min(1, 'Item code is required'),
  description: z.string().optional(),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0'),
  unitOfMeasure: z.string().min(1, 'UOM is required'),
  unitCost: z.number().min(0, 'Unit cost must be non-negative'),
  discountPercent: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

const billSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  supplierName: z.string().optional(),
  supplierCode: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  locationId: z.string().min(1, 'Location is required'),
  billNumber: z.string().optional(),
  billDate: z.date({
    required_error: 'Bill date is required',
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
  supplierInvoiceNo: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  items: z.array(billItemSchema).min(1, 'At least one item is required'),
});

type BillFormValues = z.infer<typeof billSchema>;

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

interface BillFormSheetProps {
  open: boolean;
  onClose: () => void;
  initialData?: BillDetail | null;
}

export function BillFormSheet({ open, onClose, initialData }: BillFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderSummary[]>([]);

  const isEditing = !!initialData;

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema) as any,
    defaultValues: {
      currency: 'INR',
      billDate: new Date(),
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
          unitCost: 0,
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
      const [suppliersRes, locationsRes, productsRes, posRes] = await Promise.all([
        supplierService.getSuppliers({ isActive: true }),
        locationService.getLocations(),
        productService.getProducts({ isActive: true, limit: 1000 }),
        purchaseOrderService.getPurchaseOrders(),
      ]);
      setSuppliers(suppliersRes.suppliers || []);
      setLocations(locationsRes || []);
      setProducts(productsRes.data || []);
      setPurchaseOrders((posRes || []).filter(po => po.status !== 'CANCELLED'));
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
          supplierId: initialData.supplierId,
          supplierName: initialData.supplierName,
          supplierCode: initialData.supplierCode || undefined,
          purchaseOrderId: initialData.purchaseOrder?.poId || undefined,
          locationId: initialData.locationId,
          billNumber: initialData.billNumber || undefined,
          billDate: new Date(initialData.billDate),
          dueDate: new Date(initialData.dueDate),
          paymentTerms: initialData.paymentTerms || undefined,
          currency: initialData.currency || 'INR',
          shippingCharges: Number(initialData.shippingCharges) || 0,
          notes: initialData.notes || undefined,
          supplierInvoiceNo: initialData.supplierInvoiceNo || undefined,
          isActive: initialData.isActive ?? true,
          items: initialData.items.map(item => ({
            productId: item.productId || undefined,
            itemCode: item.itemCode,
            description: item.description || '',
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure,
            unitCost: item.unitCost,
            discountPercent: item.discountPercent || 0,
            taxRate: item.taxRate || 0,
          })),
        });
      } else {
        const defaultLocation = locations.find(l => l.isDefault && l.isHeadquarters);
        form.reset({
          currency: 'INR',
          billDate: new Date(),
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
              unitCost: 0,
              discountPercent: 0,
              taxRate: 0,
            },
          ],
        });
      }
    }
  }, [open, initialData, form, fetchData, locations]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      form.setValue('supplierName', supplier.name);
      form.setValue('supplierCode', supplier.code || undefined);
    }
  };

  const handlePurchaseOrderChange = async (poId: string) => {
    if (!poId) return;
    try {
      const po = await purchaseOrderService.getPurchaseOrderById(poId);
      if (po) {
        form.setValue('supplierId', po.supplierId || '');
        form.setValue('supplierName', po.supplierName);
        form.setValue('supplierCode', po.supplierCode || undefined);
        form.setValue('locationId', po.locationId || '');
        form.setValue(
          'items',
          po.items.map(item => ({
            productId: item.productId || undefined,
            itemCode: item.itemCode,
            description: item.description || '',
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure,
            unitCost: item.unitCost,
            discountPercent: 0,
            taxRate: 0,
          }))
        );
      }
    } catch (error: any) {
      toast.error('Failed to load purchase order details');
    }
  };

  const handleProductChange = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.itemCode`, product.productCode);
      form.setValue(`items.${index}.description`, product.name);
      form.setValue(`items.${index}.unitOfMeasure`, product.unitOfMeasure);
      form.setValue(`items.${index}.unitCost`, product.costPrice);
    }
  };

  const handlePaymentTermsChange = (paymentTerms: string) => {
    const billDate = form.watch('billDate');
    if (billDate) {
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
      const dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      form.setValue('dueDate', dueDate);
    }
  };

  const onSubmit = async (values: BillFormValues) => {
    // Validate: if no PO reference, product is required for each item
    if (!values.purchaseOrderId) {
      for (let i = 0; i < values.items.length; i++) {
        if (!values.items[i].productId) {
          toast.error(`Product is required for item ${i + 1} when not linked to a Purchase Order`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload: CreateBillRequest = {
        supplierId: values.supplierId,
        supplierName: values.supplierName || '',
        supplierCode: values.supplierCode,
        purchaseOrderId: values.purchaseOrderId,
        locationId: values.locationId,
        billNumber: values.billNumber,
        billDate: values.billDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        paymentTerms: values.paymentTerms as PaymentTerms,
        currency: values.currency || 'INR',
        shippingCharges: values.shippingCharges || 0,
        notes: values.notes,
        supplierInvoiceNo: values.supplierInvoiceNo,
        items: values.items.map(item => ({
          productId: item.productId,
          itemCode: item.itemCode,
          description: item.description,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
          unitCost: item.unitCost,
          discountPercent: item.discountPercent,
          taxRate: item.taxRate,
        })),
      };

      if (isEditing && initialData?.billId) {
        await billService.updateBill(initialData.billId, payload);
        toast.success('Bill updated successfully');
      } else {
        await billService.createBill(payload);
        toast.success('Bill created successfully');
      }
      onClose();
      window.location.reload(); // Refresh to show updated data
    } catch (error: any) {
      console.error('Error saving bill:', error);
      toast.error(error.message || 'Failed to save bill');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={val => !val && onClose()}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader>
          <div className='flex items-center justify-between'>
            <SheetTitle>{isEditing ? 'Edit Bill' : 'Create Bill'}</SheetTitle>
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
            {/* Bill Info */}
            <div>
              <h3 className='text-sm font-medium'>Bill Info</h3>

              <div className='grid grid-cols-2 gap-4'>
                <div className='no-form-context-needed space-y-2'>
                  <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Bill Code
                  </label>
                  <Input disabled placeholder='Auto-generated' value={initialData?.billId || ''} />
                </div>

                <FormField
                  control={form.control}
                  name='billNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill Number</FormLabel>
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
                name='purchaseOrderId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Order Reference</FormLabel>
                    <Select
                      onValueChange={val => {
                        field.onChange(val);
                        handlePurchaseOrderChange(val);
                      }}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Link to Purchase Order (optional)' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {purchaseOrders.map(po => (
                          <SelectItem key={po.poId} value={po.poId}>
                            {po.poId} - {po.supplierName}
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
                  name='supplierId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        Supplier
                      </FormLabel>
                      <Select
                        onValueChange={val => {
                          field.onChange(val);
                          handleSupplierChange(val);
                        }}
                        value={field.value}
                        disabled={loading}
                      >
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

              <div className='grid grid-cols-3 gap-4'>
                <FormField
                  control={form.control}
                  name='billDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        Bill Date
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

              <div className='grid grid-cols-3 gap-4'>
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

                <FormField
                  control={form.control}
                  name='supplierInvoiceNo'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Invoice No</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder='Supplier ref'
                          maxLength={100}
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
                  Bill Items
                  {!form.watch('purchaseOrderId') && (
                    <span className='text-xs text-destructive ml-2'>
                      (Product required when not linked to PO)
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
                      unitCost: 0,
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
                        rows={3}
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
                {isEditing ? 'Update Bill' : 'Create Bill'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
