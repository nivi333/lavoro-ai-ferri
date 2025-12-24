import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin, Trash2, Loader2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { locationService, Location, CreateLocationRequest } from '@/services/locationService';
import { toast } from 'sonner';

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  addressLine1: z.string().min(1, 'Address is required').max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().min(1, 'Postal code is required').max(20),
  locationType: z.enum(['BRANCH', 'WAREHOUSE', 'FACTORY', 'STORE']),
  isDefault: z.boolean().default(false),
  isHeadquarters: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingLocation?: Location | null;
  locations: Location[];
}

export function LocationFormSheet({
  visible,
  onClose,
  onSave,
  editingLocation,
  locations,
}: LocationFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      isActive: true,
      isDefault: false,
      isHeadquarters: false,
    },
  });

  useEffect(() => {
    if (visible) {
      if (editingLocation) {
        form.reset({
          name: editingLocation.name,
          email: editingLocation.email || '',
          phone: editingLocation.phone || '',
          country: editingLocation.country,
          addressLine1: editingLocation.addressLine1 || '',
          addressLine2: editingLocation.addressLine2 || '',
          city: editingLocation.city,
          state: editingLocation.state,
          pincode: editingLocation.pincode,
          locationType: editingLocation.locationType,
          isDefault: editingLocation.isDefault || false,
          isHeadquarters: editingLocation.isHeadquarters || false,
          isActive: editingLocation.isActive !== undefined ? editingLocation.isActive : true,
        });
        setIsActive(editingLocation.isActive !== undefined ? editingLocation.isActive : true);
        setImageUrl(editingLocation.imageUrl || '');
      } else {
        form.reset({
          isActive: true,
          isDefault: false,
          isHeadquarters: false,
        });
        setIsActive(true);
        setImageUrl('');
      }
    }
  }, [visible, editingLocation, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = ['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type);
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
      setImageUrl(reader.result as string);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file!');
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: LocationFormValues) => {
    try {
      setLoading(true);

      // Validate business logic
      if (values.isDefault && !editingLocation) {
        const existingDefault = locations.find(loc => loc.isDefault);
        if (existingDefault) {
          toast.error('Only one default location is allowed per company');
          return;
        }
      }

      if (values.isHeadquarters && !editingLocation) {
        const existingHeadquarters = locations.find(loc => loc.isHeadquarters);
        if (existingHeadquarters) {
          toast.error('Only one headquarters location is allowed per company');
          return;
        }
      }

      const locationData: CreateLocationRequest = {
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        country: values.country,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2 || undefined,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        locationType: values.locationType,
        isDefault: values.isDefault,
        isHeadquarters: values.isHeadquarters,
        isActive: values.isActive,
        imageUrl: imageUrl || undefined,
      };

      if (editingLocation) {
        await locationService.updateLocation(editingLocation.id, locationData);
        toast.success('Location updated successfully');
      } else {
        await locationService.createLocation(locationData);
        toast.success('Location created successfully');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setImageUrl('');
    onClose();
  };

  return (
    <Sheet open={visible} onOpenChange={isOpen => !isOpen && handleCancel()}>
      <SheetContent className='w-[680px] sm:max-w-[680px] overflow-y-auto'>
        <SheetHeader>
          <div className='flex items-center justify-between'>
            <SheetTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</SheetTitle>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground'>Active</span>
              <Switch
                checked={isActive}
                onCheckedChange={checked => {
                  setIsActive(checked);
                  form.setValue('isActive', checked);
                }}
                disabled={!editingLocation}
              />
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Section 1: Basic Information */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium'>Basic Information</h3>

              {/* Image Upload */}
              <div className='flex flex-col items-center gap-2'>
                <div className='relative'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    className='hidden'
                    id='location-image-upload'
                  />
                  <label
                    htmlFor='location-image-upload'
                    className='flex items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-input hover:border-primary cursor-pointer transition-colors'
                  >
                    {imageUrl ? (
                      <div className='relative w-full h-full'>
                        <img
                          src={imageUrl}
                          alt='Location'
                          className='w-full h-full rounded-full object-cover'
                        />
                        <button
                          type='button'
                          onClick={e => {
                            e.preventDefault();
                            setImageUrl('');
                          }}
                          className='absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90'
                        >
                          <Trash2 className='h-3 w-3' />
                        </button>
                      </div>
                    ) : (
                      <MapPin className='h-8 w-8 text-muted-foreground' />
                    )}
                  </label>
                </div>
                <p className='text-xs text-muted-foreground text-center'>
                  Upload Location Image (JPG/PNG, max 2MB)
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
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter location name' maxLength={100} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='locationType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select location type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='BRANCH'>Branch</SelectItem>
                          <SelectItem value='WAREHOUSE'>Warehouse</SelectItem>
                          <SelectItem value='FACTORY'>Factory</SelectItem>
                          <SelectItem value='STORE'>Store</SelectItem>
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type='email' placeholder='location@company.com' />
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='+1 234 567 8900' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
            </div>

            <Separator />

            {/* Section 2: Address Information */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium'>Address Information</h3>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='addressLine1'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Street address' maxLength={255} />
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
                        <Input
                          {...field}
                          placeholder='Apartment, suite, unit, etc.'
                          maxLength={255}
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
                  name='city'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter city' maxLength={100} />
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
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter state' maxLength={100} />
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
                      <FormLabel>Postal/ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter postal code' maxLength={20} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Section 3: Location Settings */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium'>Location Settings</h3>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='isDefault'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel className='text-base'>Default Location</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='isHeadquarters'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel className='text-base'>Headquarters</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter className='gap-2'>
              <Button type='button' variant='outline' onClick={handleCancel}>
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {editingLocation ? 'Update Location' : 'Create Location'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
