import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Cog, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  machineService,
  CreateMachineRequest,
  UpdateMachineRequest,
  OperationalStatus,
} from '@/services/machineService';
import { Location } from '@/services/locationService';

const machineSchema = z.object({
  name: z.string().min(1, 'Machine name is required').max(100),
  machineType: z.string().min(1, 'Machine type is required').max(50),
  model: z.string().max(50).optional(),
  manufacturer: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  purchaseDate: z.date({
    required_error: 'Purchase date is required',
  }),
  warrantyExpiry: z.date({
    required_error: 'Warranty expiry is required',
  }),
  locationId: z.string().min(1, 'Location is required'),
  currentOperatorId: z.string().optional(),
  operationalStatus: z.enum(['FREE', 'BUSY', 'RESERVED', 'UNAVAILABLE']).optional(),
  status: z.enum(['NEW', 'IN_USE', 'UNDER_MAINTENANCE', 'UNDER_REPAIR', 'IDLE', 'DECOMMISSIONED']),
  specifications: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

type MachineFormValues = z.infer<typeof machineSchema>;

interface MachineFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode: 'create' | 'edit';
  editingMachineId?: string | null;
  locations: Location[];
}

// Industry-specific machine types
const MACHINE_TYPES = [
  'Ring Spinning Frame',
  'Air Jet Loom',
  'Water Jet Loom',
  'Circular Knitting Machine',
  'Industrial Sewing Machine',
  'Overlock Machine',
  'Dyeing Machine',
  'Printing Machine',
  'Cutting Machine',
  'Pressing Machine',
  'Other',
];

export function MachineFormSheet({
  open,
  onClose,
  onSaved,
  mode,
  editingMachineId,
  locations,
}: MachineFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<{ url: string; name: string } | null>(null);
  const [machineCode, setMachineCode] = useState<string>('');

  const isEditing = mode === 'edit' && !!editingMachineId;

  const form = useForm<MachineFormValues>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      operationalStatus: 'FREE',
      status: 'NEW',
    },
  });

  useEffect(() => {
    if (open && isEditing && editingMachineId) {
      setLoading(true);
      machineService
        .getMachineById(editingMachineId)
        .then(response => {
          if (response.success && response.data) {
            const machine = response.data;
            form.reset({
              name: machine.name,
              machineType: machine.machineType || '',
              model: machine.model || '',
              manufacturer: machine.manufacturer || '',
              serialNumber: machine.serialNumber || '',
              purchaseDate: machine.purchaseDate ? new Date(machine.purchaseDate) : new Date(),
              warrantyExpiry: machine.warrantyExpiry
                ? new Date(machine.warrantyExpiry)
                : new Date(),
              locationId: machine.locationId || '',
              currentOperatorId: machine.currentOperatorId || '',
              operationalStatus: (machine.operationalStatus as OperationalStatus) || 'FREE',
              status: machine.status,
              specifications: machine.specifications || '',
              imageUrl: machine.imageUrl || '',
            });

            if (machine.imageUrl) {
              setImageFile({ url: machine.imageUrl, name: 'Machine Image' });
            }
            if (machine.machineCode) {
              setMachineCode(machine.machineCode);
            }
          }
        })
        .catch(error => {
          console.error('Error loading machine:', error);
          toast.error('Failed to load machine details');
        })
        .finally(() => setLoading(false));
    } else if (open && !isEditing) {
      form.reset({
        operationalStatus: 'FREE',
        status: 'NEW',
      });
      setImageFile(null);
    }
  }, [open, isEditing, editingMachineId, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setImageFile({
        url: reader.result as string,
        name: file.name,
      });
      form.setValue('imageUrl', reader.result as string);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    form.setValue('imageUrl', '');
  };

  const onSubmit = async (values: MachineFormValues) => {
    setSubmitting(true);
    try {
      if (isEditing && editingMachineId) {
        const updateData: UpdateMachineRequest = {
          name: values.name,
          machineType: values.machineType,
          model: values.model,
          manufacturer: values.manufacturer,
          serialNumber: values.serialNumber,
          purchaseDate: values.purchaseDate,
          warrantyExpiry: values.warrantyExpiry,
          locationId: values.locationId,
          currentOperatorId: values.currentOperatorId || undefined,
          operationalStatus: values.operationalStatus as OperationalStatus,
          status: values.status,
          specifications: values.specifications,
          imageUrl: imageFile?.url,
        };

        const response = await machineService.updateMachine(editingMachineId, updateData);
        if (response.success) {
          toast.success('Machine updated successfully!');
          onSaved();
          onClose();
        } else {
          toast.error(response.message || 'Failed to update machine');
        }
      } else {
        const createData: CreateMachineRequest = {
          name: values.name,
          machineType: values.machineType,
          model: values.model,
          manufacturer: values.manufacturer,
          serialNumber: values.serialNumber,
          purchaseDate: values.purchaseDate,
          warrantyExpiry: values.warrantyExpiry,
          locationId: values.locationId,
          currentOperatorId: values.currentOperatorId || undefined,
          operationalStatus: values.operationalStatus as OperationalStatus,
          specifications: values.specifications,
          imageUrl: imageFile?.url,
          isActive: true,
        };

        const response = await machineService.createMachine(createData);
        if (response.success) {
          toast.success('Machine created successfully!');
          onSaved();
          onClose();
        } else {
          toast.error(response.message || 'Failed to create machine');
        }
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} machine`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Machine' : 'Create Machine'}</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : (
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
                      id='machine-image-upload'
                    />
                    <label
                      htmlFor='machine-image-upload'
                      className='flex items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-input hover:border-primary cursor-pointer transition-colors'
                    >
                      {imageFile?.url ? (
                        <div className='relative w-full h-full'>
                          <Avatar className='w-full h-full'>
                            <AvatarImage src={imageFile.url} alt='Machine' />
                            <AvatarFallback>
                              <Cog className='h-8 w-8' />
                            </AvatarFallback>
                          </Avatar>
                          <button
                            type='button'
                            onClick={e => {
                              e.preventDefault();
                              handleRemoveImage();
                            }}
                            className='absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90'
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </div>
                      ) : (
                        <Cog className='h-8 w-8 text-muted-foreground' />
                      )}
                    </label>
                  </div>
                  <p className='text-xs text-muted-foreground text-center'>
                    Upload Machine Image (PNG/JPG/SVG, max 2MB)
                    <br />
                    Drag & drop or click to upload
                  </p>
                </div>

                {isEditing && machineCode && (
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Machine Code</label>
                    <Input value={machineCode} disabled className='bg-muted' />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Machine Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter machine name' maxLength={100} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='machineType'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Machine Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select machine type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MACHINE_TYPES.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
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
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Machine Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select status' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='NEW'>New</SelectItem>
                            <SelectItem value='IDLE'>Idle</SelectItem>
                            <SelectItem value='IN_USE'>In Use</SelectItem>
                            <SelectItem value='UNDER_MAINTENANCE'>Under Maintenance</SelectItem>
                            <SelectItem value='UNDER_REPAIR'>Under Repair</SelectItem>
                            <SelectItem value='DECOMMISSIONED'>Decommissioned</SelectItem>
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
                    name='operationalStatus'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operational Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select operational status' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='FREE'>Free</SelectItem>
                            <SelectItem value='BUSY'>Busy</SelectItem>
                            <SelectItem value='RESERVED'>Reserved</SelectItem>
                            <SelectItem value='UNAVAILABLE'>Unavailable</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select location' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map(location => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
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
              </div>

              <Separator />

              {/* Section 2: Machine Details */}
              <div className='space-y-4'>
                <h3 className='text-sm font-medium'>Machine Details</h3>

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='manufacturer'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacturer</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='Enter manufacturer' maxLength={100} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='model'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='Enter model' maxLength={50} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='serialNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter serial number' maxLength={100} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Section 3: Purchase & Warranty */}
              <div className='space-y-4'>
                <h3 className='text-sm font-medium'>Purchase & Warranty</h3>

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='purchaseDate'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel required>Purchase Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            placeholder='Select purchase date'
                            disabledDates={(date: Date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            className='w-full'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='warrantyExpiry'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel required>Warranty Expiry</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            placeholder='Select warranty expiry'
                            disabledDates={(date: Date) => date < new Date('1900-01-01')}
                            className='w-full'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Section 4: Technical Specifications */}
              <div className='space-y-4'>
                <h3 className='text-sm font-medium'>Technical Specifications</h3>

                <FormField
                  control={form.control}
                  name='specifications'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technical Specifications</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder='Enter technical specifications (e.g., Width: 200cm, Speed: 300rpm, Power: 5kW)'
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className='gap-2'>
                <Button type='button' variant='outline' onClick={onClose}>
                  Cancel
                </Button>
                <Button type='submit' disabled={submitting}>
                  {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  {isEditing ? 'Update Machine' : 'Create Machine'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
