import { useCallback, useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Trash2, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
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
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import {
  companyService,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from '@/services/companyService';
import { AuthStorage } from '@/utils/storage';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

// Maps API display names back to form Select values
const INDUSTRY_DISPLAY_TO_ENUM: Record<string, string> = {
  'Textile Manufacturing': 'TEXTILE_MANUFACTURING',
  'Garment Production': 'GARMENT_PRODUCTION',
  'Knitting & Weaving': 'KNITTING_WEAVING',
  'Fabric Processing': 'FABRIC_PROCESSING',
  'Apparel Design': 'APPAREL_DESIGN',
  'Fashion Retail': 'FASHION_RETAIL',
  'Yarn Production': 'YARN_PRODUCTION',
  'Dyeing & Finishing': 'DYEING_FINISHING',
  'Home Textiles': 'HOME_TEXTILES',
  'Technical Textiles': 'TECHNICAL_TEXTILES',
};

const BUSINESS_TYPE_ENUM_TO_DISPLAY: Record<string, string> = {
  MANUFACTURER: 'Manufacturer',
  TRADER: 'Trader',
  EXPORTER: 'Exporter',
  OTHER: 'Other',
};

const baseSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(48, 'Name too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(32, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric or hyphens'),
  industry: z.string().min(1, 'Industry is required'),
  description: z.string().max(80).optional(),
  country: z.string().min(1, 'Country is required'),
  defaultLocation: z.string().max(32).optional(),
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
  certifications: z.string().max(200).optional(),
  contactInfo: z.string().min(1, 'Contact information is required'),
  website: z.string().max(48).optional(),
  taxId: z.string().max(24).optional(),
  currency: z.string().min(1, 'Currency is required'),
});

const createSchema = baseSchema.extend({
  defaultLocation: z.string().min(1, 'Default location name is required').max(32),
});

const companySchema = baseSchema;

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyCreationSheetProps {
  open: boolean;
  onClose: () => void;
  onCompanyCreated?: () => void;
  mode?: 'create' | 'edit';
  editingCompanyId?: string | null;
}

export function CompanyCreationSheet({
  open,
  onClose,
  onCompanyCreated,
  mode = 'create',
  editingCompanyId,
}: CompanyCreationSheetProps) {
  const [logoFile, setLogoFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugUnique, setSlugUnique] = useState(true);

  const [nameUnique, setNameUnique] = useState(true);
  const [loading, setLoading] = useState(false);
  const [originalSlug, setOriginalSlug] = useState<string>('');
  const [originalName, setOriginalName] = useState<string>('');
  const nameTimeoutRef = useRef<any>(null);
  const slugTimeoutRef = useRef<any>(null);

  const isEditing = mode === 'edit' && !!editingCompanyId;

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(isEditing ? companySchema : createSchema),
  });

  const resetFormState = useCallback(() => {
    form.reset();
    setLogoFile(null);
    setSlugChecking(false);
    setSlugUnique(true);
    setNameUnique(true);
    setOriginalSlug('');
    setOriginalName('');
  }, [form]);

  // Load company data for editing or reset for creation
  useEffect(() => {
    if (!open) return;

    if (isEditing && editingCompanyId) {
      setLoading(true);
      companyService
        .getCompany(editingCompanyId)
        .then(company => {
          const parsedDate = company.establishedDate ? new Date(company.establishedDate) : null;
          const establishedDate =
            parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

          form.reset({
            name: company.name,
            slug: company.slug,
            industry:
              (company.industry && INDUSTRY_DISPLAY_TO_ENUM[company.industry]) ||
              company.industry ||
              '',
            description: company.description || '',
            country: company.country || '',
            defaultLocation: company.defaultLocation || '',
            addressLine1: company.addressLine1 || '',
            addressLine2: company.addressLine2 || '',
            city: company.city || '',
            state: company.state || '',
            pincode: company.pincode || '',
            establishedDate,
            businessType:
              (company.businessType && BUSINESS_TYPE_ENUM_TO_DISPLAY[company.businessType]) ||
              company.businessType ||
              '',
            certifications: Array.isArray(company.certifications)
              ? company.certifications.join(', ')
              : company.certifications || '',
            contactInfo:
              typeof company.contactInfo === 'string'
                ? company.contactInfo
                : company.contactInfo
                  ? JSON.stringify(company.contactInfo)
                  : '',
            website: company.website || '',
            taxId: company.taxId || '',
            currency: company.currency || 'USD',
          });

          setOriginalSlug(company.slug);
          setSlugUnique(true);

          if (company.logoUrl) {
            setLogoFile({ url: company.logoUrl, name: 'Company Logo' });
          }
        })
        .catch(error => {
          console.error('Error loading company:', error);
          toast.error('Failed to load company details');
        })
        .finally(() => setLoading(false));
    } else {
      // Small delay to ensure form is ready, or just call if confident
      resetFormState();
    }
    // We only want to run this once when the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDrawerClose = () => {
    resetFormState();
    onClose();
  };

  // Auto-generate slug from name (only for create mode)
  const handleNameChange = (value: string) => {
    // Debounce name uniqueness check
    if (nameTimeoutRef.current) clearTimeout(nameTimeoutRef.current);
    nameTimeoutRef.current = setTimeout(() => {
      checkNameUnique(value);
    }, 500);

    if (!isEditing) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      form.setValue('slug', slug);

      // Debounce slug uniqueness check
      if (slugTimeoutRef.current) clearTimeout(slugTimeoutRef.current);
      slugTimeoutRef.current = setTimeout(() => {
        checkSlugUnique(slug);
      }, 500);
    }
  };

  // Company name uniqueness validation
  const checkNameUnique = async (name: string) => {
    if (!name || name.trim().length === 0) {
      setNameUnique(true);
      return;
    }

    // If editing and name hasn't changed, it's valid
    if (isEditing && name.trim().toLowerCase() === originalName.toLowerCase()) {
      setNameUnique(true);
      return;
    }

    try {
      // Use backend API to check name availability (similar to slug check)
      const response = await fetch(
        `${API_BASE_URL}/companies/check-name?name=${encodeURIComponent(name.trim())}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${AuthStorage.getTokens()?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        // If API fails, allow the name (backend will validate)
        console.warn('Name check API failed, skipping client-side validation');
        setNameUnique(true);
        return;
      }

      const result = await response.json();
      setNameUnique(result.available);
    } catch (error) {
      console.error('Error checking company name:', error);
      setNameUnique(true); // Allow on error, backend will validate
    } finally {
      // Name checking complete
    }
  };

  // Slug uniqueness validation
  const checkSlugUnique = async (slug: string) => {
    if (!slug) {
      setSlugUnique(true);
      return;
    }

    // If editing and slug hasn't changed, it's valid
    if (isEditing && slug === originalSlug) {
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
    if (!nameUnique) {
      toast.error('Company name is already taken');
      return;
    }
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

      if (isEditing && editingCompanyId) {
        // Update company
        const updateData: UpdateCompanyRequest = {
          name: values.name,
          slug: values.slug,
          industry: values.industry,
          country: values.country,
          addressLine1: values.addressLine1,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          establishedDate: format(values.establishedDate, 'yyyy-MM-dd'),
          businessType: values.businessType,
          contactInfo: values.contactInfo,
          currency: values.currency,
          ...(values.description && { description: values.description }),
          ...(logoFile?.url && { logoUrl: logoFile.url }),
          ...(values.addressLine2 && { addressLine2: values.addressLine2 }),
          ...(certificationsArray.length > 0 && { certifications: certificationsArray.join(',') }),
          ...(values.website && { website: values.website }),
          ...(values.taxId && { taxId: values.taxId }),
        };

        await companyService.updateCompany(editingCompanyId, updateData);
        toast.success('Company updated successfully!');
      } else {
        // Create company
        const companyData: CreateCompanyRequest = {
          name: values.name,
          slug: values.slug,
          industry: values.industry,
          country: values.country,
          defaultLocation: values.defaultLocation!,
          addressLine1: values.addressLine1,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          establishedDate: format(values.establishedDate, 'yyyy-MM-dd'),
          businessType: values.businessType,
          contactInfo: values.contactInfo,
          currency: values.currency,
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
      }

      handleDrawerClose();
      onCompanyCreated?.();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={isOpen => !isOpen && handleDrawerClose()}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Company' : 'Create Company'}</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Section 1: Basic Information */}
              <div className='space-y-2'>
                <h3 className='text-sm font-medium'>Basic Information</h3>

                {/* Logo Upload */}
                <div className='flex flex-col items-start gap-2'>
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
                  <p className='text-xs text-muted-foreground text-left'>
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
                        <FormLabel required>Company Name</FormLabel>
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
                        <FormLabel required>Company Slug</FormLabel>
                        <FormControl>
                          <div className='flex'>
                            <span className='inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md'>
                              ayphen.ai/
                            </span>
                            <Input
                              {...field}
                              placeholder='company-slug'
                              maxLength={32}
                              className='rounded-l-none'
                              disabled={isEditing}
                              onChange={e => {
                                if (!isEditing) {
                                  const value = e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]+/g, '');
                                  field.onChange(value);
                                  // Debounce manual slug check
                                  if (slugTimeoutRef.current) clearTimeout(slugTimeoutRef.current);
                                  slugTimeoutRef.current = setTimeout(() => {
                                    checkSlugUnique(value);
                                  }, 500);
                                }
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
                        {isEditing && (
                          <p className='text-xs text-muted-foreground'>Slug cannot be changed</p>
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
                        <FormLabel required>Industry</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid='industry-select'>
                              <SelectValue placeholder='Select industry' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem
                              value='TEXTILE_MANUFACTURING'
                              data-testid='industry-textile'
                            >
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
                        <FormLabel required>Country</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid='country-select'>
                              <SelectValue placeholder='Select country' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='India' data-testid='country-india'>
                              India
                            </SelectItem>
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
                    name='currency'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid='currency-select'>
                              <SelectValue placeholder='Select currency' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='INR'>India (INR)</SelectItem>
                            <SelectItem value='USD'>United States (USD)</SelectItem>
                            <SelectItem value='GBP'>United Kingdom (GBP)</SelectItem>
                            <SelectItem value='EUR'>Europe (EUR)</SelectItem>
                            <SelectItem value='AED'>Arab (AED)</SelectItem>
                            <SelectItem value='CNY'>China (CNY)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isEditing && (
                    <FormField
                      control={form.control}
                      name='defaultLocation'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Default Location Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder='Enter location name' maxLength={32} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
                        <FormLabel required>Address Line 1</FormLabel>
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
                        <FormLabel required>City</FormLabel>
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
                        <FormLabel required>State</FormLabel>
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
                        <FormLabel required>Pincode</FormLabel>
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
                        <FormLabel required>Established Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            placeholder='Pick a date'
                            disabledDates={(date: Date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            className='w-full'
                            data-testid='established-date-picker'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='businessType'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel required>Business Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid='business-type-select'>
                              <SelectValue placeholder='Select type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='Manufacturer' data-testid='type-manufacturer'>
                              Manufacturer
                            </SelectItem>
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
                      <FormLabel required>Contact Information</FormLabel>
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
                  {isEditing ? 'Update Company' : 'Create Company'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
