import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Trash2, Loader2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { companyService, CreateCompanyRequest } from '@/services/companyService';
import { toast } from 'sonner';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(48, 'Name too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(32, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric or hyphens'),
  industry: z.string().min(1, 'Industry is required'),
  description: z.string().max(80).optional(),
  country: z.string().min(1, 'Country is required'),
  defaultLocation: z.string().min(1, 'Default location name is required').max(32),
  addressLine1: z.string().min(1, 'Address is required').max(64),
  addressLine2: z.string().max(64).optional(),
  city: z.string().min(1, 'City is required').max(32),
  state: z.string().min(1, 'State is required').max(32),
  pincode: z.string().min(1, 'Pincode is required').max(12),
  establishedDate: z.date({
    required_error: 'Established date is required',
    invalid_type_error: 'Please select a valid date',
  }),
  businessType: z.string().min(1, 'Business type is required'),
  certifications: z.string().max(64).optional(),
  contactInfo: z.string().min(1, 'Contact information is required'),
  website: z.string().max(48).optional(),
  taxId: z.string().max(24).optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyCreationSheetProps {
  open: boolean;
  onClose: () => void;
  onCompanyCreated?: () => void;
}

export function CompanyCreationSheet({
  open,
  onClose,
  onCompanyCreated,
}: CompanyCreationSheetProps) {
  const [logoFile, setLogoFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugUnique, setSlugUnique] = useState(true);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
  });

  const resetFormState = useCallback(() => {
    form.reset();
    setLogoFile(null);
    setSlugChecking(false);
    setSlugUnique(true);
  }, [form]);

  const handleDrawerClose = () => {
    resetFormState();
    onClose();
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    form.setValue('slug', slug);
    checkSlugUnique(slug);
  };

  // Slug uniqueness validation
  const checkSlugUnique = async (slug: string) => {
    if (!slug) {
      setSlugUnique(true);
      return;
    }

    setSlugChecking(true);
    try {
      const isAvailable = await companyService.checkSlugAvailability(slug);
      setSlugUnique(isAvailable);
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugUnique(true);
    } finally {
      setSlugChecking(false);
    }
  };

  // Logo upload handler
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'].includes(
      file.type
    );
    if (!isValidType) {
      toast.error('You can only upload JPG/PNG/SVG files!');
      return;
    }

    const isValidSize = file.size / 1024 / 1024 < 2;
    if (!isValidSize) {
      toast.error('Image must be smaller than 2MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoFile({
        url: reader.result as string,
        name: file.name,
      });
    };
    reader.onerror = () => {
      toast.error('Failed to read image file!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
  };

  // Form submission
  const onSubmit = async (values: CompanyFormValues) => {
    if (!slugUnique) {
      toast.error('Slug is already taken');
      return;
    }

    setUploading(true);
    try {
      const certificationsArray = values.certifications
        ? values.certifications
            .split(',')
            .map(cert => cert.trim())
            .filter(Boolean)
        : [];

      const companyData: CreateCompanyRequest = {
        name: values.name,
        slug: values.slug,
        industry: values.industry,
        country: values.country,
        defaultLocation: values.defaultLocation,
        addressLine1: values.addressLine1,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        establishedDate: format(values.establishedDate, 'yyyy-MM-dd'),
        businessType: values.businessType,
        contactInfo: values.contactInfo,
        isActive: true,
        ...(values.description && { description: values.description }),
        ...(logoFile?.url && { logoUrl: logoFile.url }),
        ...(values.addressLine2 && { addressLine2: values.addressLine2 }),
        ...(certificationsArray.length > 0 && { certifications: certificationsArray }),
        ...(values.website && { website: values.website }),
        ...(values.taxId && { taxId: values.taxId }),
      };

      await companyService.createCompany(companyData);
      toast.success('Company created successfully!');
      handleDrawerClose();
      onCompanyCreated?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create company');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={isOpen => !isOpen && handleDrawerClose()}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Create Company</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Section 1: Basic Information */}
            <div className='space-y-2'>
              <h3 className='text-sm font-medium'>Basic Information</h3>

              {/* Logo Upload */}
              <div className='flex flex-col items-center gap-2'>
                <div className='relative'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleLogoChange}
                    className='hidden'
                    id='logo-upload'
                  />
                  <label
                    htmlFor='logo-upload'
                    className='flex items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-input hover:border-primary cursor-pointer transition-colors'
                  >
                    {logoFile?.url ? (
                      <div className='relative w-full h-full'>
                        <img
                          src={logoFile.url}
                          alt='Company Logo'
                          className='w-full h-full rounded-full object-cover'
                        />
                        <button
                          type='button'
                          onClick={e => {
                            e.preventDefault();
                            handleRemoveLogo();
                          }}
                          className='absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90'
                        >
                          <Trash2 className='h-3 w-3' />
                        </button>
                      </div>
                    ) : (
                      <Building2 className='h-8 w-8 text-muted-foreground' />
                    )}
                  </label>
                </div>
                <p className='text-xs text-muted-foreground text-center'>
                  Upload Logo (PNG/JPG/SVG, max 2MB)
                  <br />
                  Drag & drop or click to upload
                </p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder='Enter company name'
                          maxLength={48}
                          onChange={e => {
                            field.onChange(e);
                            handleNameChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='slug'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Slug</FormLabel>
                      <FormControl>
                        <div className='flex'>
                          <span className='inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md'>
                            lavoro.ai/
                          </span>
                          <Input
                            {...field}
                            placeholder='company-slug'
                            maxLength={32}
                            className='rounded-l-none'
                            onChange={e => {
                              const value = e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-]+/g, '');
                              field.onChange(value);
                              checkSlugUnique(value);
                            }}
                          />
                        </div>
                      </FormControl>
                      {slugChecking && (
                        <p className='text-xs text-muted-foreground'>Checking availability...</p>
                      )}
                      {!slugChecking && !slugUnique && (
                        <p className='text-xs text-destructive'>Slug already taken</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='industry'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select industry' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='TEXTILE_MANUFACTURING'>
                            Textile Manufacturing
                          </SelectItem>
                          <SelectItem value='GARMENT_PRODUCTION'>Garment Production</SelectItem>
                          <SelectItem value='KNITTING_WEAVING'>Knitting & Weaving</SelectItem>
                          <SelectItem value='FABRIC_PROCESSING'>Fabric Processing</SelectItem>
                          <SelectItem value='APPAREL_DESIGN'>Apparel Design</SelectItem>
                          <SelectItem value='FASHION_RETAIL'>Fashion Retail</SelectItem>
                          <SelectItem value='YARN_PRODUCTION'>Yarn Production</SelectItem>
                          <SelectItem value='DYEING_FINISHING'>Dyeing & Finishing</SelectItem>
                          <SelectItem value='HOME_TEXTILES'>Home Textiles</SelectItem>
                          <SelectItem value='TECHNICAL_TEXTILES'>Technical Textiles</SelectItem>
                          <SelectItem value='OTHER'>Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder='Enter description'
                          maxLength={80}
                          rows={1}
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
                  name='country'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select country' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='India'>India</SelectItem>
                          <SelectItem value='USA'>USA</SelectItem>
                          <SelectItem value='UK'>UK</SelectItem>
                          <SelectItem value='China'>China</SelectItem>
                          <SelectItem value='Bangladesh'>Bangladesh</SelectItem>
                          <SelectItem value='Vietnam'>Vietnam</SelectItem>
                          <SelectItem value='Turkey'>Turkey</SelectItem>
                          <SelectItem value='Italy'>Italy</SelectItem>
                          <SelectItem value='Germany'>Germany</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='defaultLocation'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Location Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter location name' maxLength={32} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Section 2: Address */}
            <div className='space-y-2'>
              <h3 className='text-sm font-medium'>Address</h3>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='addressLine1'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter address' maxLength={64} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='addressLine2'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter address' maxLength={64} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='city'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter city' maxLength={32} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='state'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter state' maxLength={32} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='pincode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter pincode' maxLength={12} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Section 3: Business Details */}
            <div className='space-y-2'>
              <h3 className='text-sm font-medium'>Business Details</h3>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='establishedDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Established Date</FormLabel>
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
                            disabled={date => date > new Date() || date < new Date('1900-01-01')}
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
                  name='businessType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Manufacturer'>Manufacturer</SelectItem>
                          <SelectItem value='Trader'>Trader</SelectItem>
                          <SelectItem value='Exporter'>Exporter</SelectItem>
                          <SelectItem value='Other'>Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='certifications'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='Enter certifications (comma separated)'
                        maxLength={64}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Section 4: Contact Information */}
            <div className='space-y-2'>
              <h3 className='text-sm font-medium'>Contact Information</h3>

              <FormField
                control={form.control}
                name='contactInfo'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Information</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Enter email or phone number' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='website'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter website' maxLength={48} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='taxId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter tax ID' maxLength={24} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter className='gap-2'>
              <Button type='button' variant='outline' onClick={handleDrawerClose}>
                Cancel
              </Button>
              <Button type='submit' disabled={uploading || slugChecking || !slugUnique}>
                {uploading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Create Company
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
