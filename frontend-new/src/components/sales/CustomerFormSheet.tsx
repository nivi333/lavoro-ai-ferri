import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';
import { Customer } from '@/services/customerService';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  customerType: z.string().min(1, 'Customer Type is required'),
  companyName: z.string().optional(),
  customerCategory: z.string().optional(),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),

  // Billing Address
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingCountry: z.string().optional(),
  billingPostalCode: z.string().optional(),

  // Shipping Address
  shippingAddressLine1: z.string().optional(),
  shippingAddressLine2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingCountry: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  sameAsBillingAddress: z.boolean().default(false),

  // Financial
  paymentTerms: z.string().optional(),
  creditLimit: z.preprocess(
    val => (val === '' ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  currency: z.string().optional(),
  taxId: z.string().optional(),
  panNumber: z.string().optional(),

  // Additional
  assignedSalesRep: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormValues) => Promise<void>;
  initialData?: Customer | null;
  isSubmitting?: boolean;
}

export function CustomerFormSheet({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}: CustomerFormSheetProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: '',
      code: '',
      customerType: '',
      companyName: '',
      customerCategory: '',
      email: '',
      phone: '',
      alternatePhone: '',
      website: '',
      billingAddressLine1: '',
      billingAddressLine2: '',
      billingCity: '',
      billingState: '',
      billingCountry: '',
      billingPostalCode: '',
      shippingAddressLine1: '',
      shippingAddressLine2: '',
      shippingCity: '',
      shippingState: '',
      shippingCountry: '',
      shippingPostalCode: '',
      sameAsBillingAddress: false,
      paymentTerms: '',
      creditLimit: undefined,
      currency: '',
      taxId: '',
      panNumber: '',
      assignedSalesRep: '',
      notes: '',
      tags: [],
      isActive: true,
    },
  });

  const sameAsBilling = useWatch({
    control: form.control,
    name: 'sameAsBillingAddress',
  });

  const billingAddress = useWatch({
    control: form.control,
    name: [
      'billingAddressLine1',
      'billingAddressLine2',
      'billingCity',
      'billingState',
      'billingCountry',
      'billingPostalCode',
    ],
  });

  // Effect to sync shipping address with billing address if checkbox is checked
  useEffect(() => {
    if (sameAsBilling) {
      const [line1, line2, city, state, country, postalCode] = billingAddress;
      form.setValue('shippingAddressLine1', line1);
      form.setValue('shippingAddressLine2', line2);
      form.setValue('shippingCity', city);
      form.setValue('shippingState', state);
      form.setValue('shippingCountry', country);
      form.setValue('shippingPostalCode', postalCode);
    }
  }, [sameAsBilling, billingAddress, form]);

  useEffect(() => {
    if (initialData) {
      const resetData: any = {
        ...initialData,
        tags: initialData.tags || [],
        creditLimit: initialData.creditLimit,
      };

      Object.keys(resetData).forEach(key => {
        if (resetData[key] === null || resetData[key] === undefined) {
          if (key === 'isActive') resetData[key] = true;
          else if (key === 'sameAsBillingAddress') resetData[key] = false;
          else if (key === 'creditLimit') resetData[key] = undefined;
          else resetData[key] = '';
        }
      });

      form.reset(resetData);
    } else {
      form.reset({
        name: '',
        code: '',
        customerType: '',
        companyName: '',
        customerCategory: '',
        email: '',
        phone: '',
        alternatePhone: '',
        website: '',
        billingAddressLine1: '',
        billingAddressLine2: '',
        billingCity: '',
        billingState: '',
        billingCountry: '',
        billingPostalCode: '',
        shippingAddressLine1: '',
        shippingAddressLine2: '',
        shippingCity: '',
        shippingState: '',
        shippingCountry: '',
        shippingPostalCode: '',
        sameAsBillingAddress: false,
        paymentTerms: '',
        creditLimit: undefined,
        currency: '',
        taxId: '',
        panNumber: '',
        assignedSalesRep: '',
        notes: '',
        tags: [],
        isActive: true,
      });
    }
  }, [initialData, isOpen, form]);

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>, field: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = tagInput.trim();
      if (value && !field.value?.includes(value)) {
        field.onChange([...(field.value || []), value]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string, field: any) => {
    field.onChange(field.value?.filter((tag: string) => tag !== tagToRemove) || []);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className='w-full sm:max-w-[600px] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>{initialData ? 'Edit Customer' : 'Add New Customer'}</SheetTitle>
          <SheetDescription>
            {initialData ? 'Update customer details' : 'Enter details for the new customer'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 py-4'>
            {/* Basic Information */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Basic Information</h3>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Code</FormLabel>
                      <FormControl>
                        <Input placeholder='Auto-generated' disabled {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Customer Name <span className='text-destructive'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='Enter name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='customerType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Customer Type <span className='text-destructive'>*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='BUSINESS'>Business</SelectItem>
                          <SelectItem value='INDIVIDUAL'>Individual</SelectItem>
                          <SelectItem value='DISTRIBUTOR'>Distributor</SelectItem>
                          <SelectItem value='RETAILER'>Retailer</SelectItem>
                          <SelectItem value='WHOLESALER'>Wholesaler</SelectItem>
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
                  name='companyName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter company name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='customerCategory'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select category' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='VIP'>VIP</SelectItem>
                          <SelectItem value='REGULAR'>Regular</SelectItem>
                          <SelectItem value='NEW'>New</SelectItem>
                          <SelectItem value='INACTIVE'>Inactive</SelectItem>
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
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className='text-destructive'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type='email' placeholder='Enter email' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter phone' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='website'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder='https://example.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='alternatePhone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alternate Phone</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter phone' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Billing Address */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Billing Address</h3>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='billingAddressLine1'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input placeholder='Street address' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='billingAddressLine2'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input placeholder='Apartment, suite, etc.' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='billingCity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        City <span className='text-destructive'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='City' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='billingState'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder='State' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='billingCountry'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Country <span className='text-destructive'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='Country' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='billingPostalCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder='ZIP/Postal Code' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Shipping Address */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Shipping Address</h3>

              <FormField
                control={form.control}
                name='sameAsBillingAddress'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Same as billing address</FormLabel>
                      <SheetDescription>Copy billing address to shipping address</SheetDescription>
                    </div>
                  </FormItem>
                )}
              />

              {!sameAsBilling && (
                <div className='space-y-4 pt-2'>
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='shippingAddressLine1'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input placeholder='Street address' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='shippingAddressLine2'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input placeholder='Apartment, suite, etc.' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='shippingCity'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder='City' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='shippingState'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder='State' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='shippingCountry'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder='Country' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='shippingPostalCode'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder='ZIP/Postal Code' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Financial Information */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Financial Information</h3>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='paymentTerms'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select terms' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='NET15'>Net 15</SelectItem>
                          <SelectItem value='NET30'>Net 30</SelectItem>
                          <SelectItem value='NET45'>Net 45</SelectItem>
                          <SelectItem value='NET60'>Net 60</SelectItem>
                          <SelectItem value='DUE_ON_RECEIPT'>Due on Receipt</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='creditLimit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Limit</FormLabel>
                      <FormControl>
                        <Input type='number' placeholder='0.00' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='taxId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID</FormLabel>
                      <FormControl>
                        <Input placeholder='Tax ID' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='panNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input placeholder='PAN' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='currency'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input placeholder='Currency (e.g. USD)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Additional Information */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Additional Information</h3>
              <FormField
                control={form.control}
                name='assignedSalesRep'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Sales Rep</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter sales rep name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Additional notes...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='tags'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <div className='space-y-2'>
                        <div className='flex gap-2 flex-wrap'>
                          {field.value?.map((tag: string) => (
                            <Badge key={tag} variant='secondary' className='gap-1'>
                              {tag}
                              <X
                                className='h-3 w-3 cursor-pointer hover:text-destructive'
                                onClick={() => handleRemoveTag(tag, field)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <Input
                          placeholder='Add tags (Press Enter)'
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => handleAddTag(e, field)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Active Customer</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter>
              <Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {initialData ? 'Update Customer' : 'Create Customer'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
