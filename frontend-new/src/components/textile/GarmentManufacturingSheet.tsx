import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';

import {
  garmentManufacturingService,
  GarmentManufacturing,
  CreateGarmentManufacturingData,
  GARMENT_TYPES,
  PRODUCTION_STAGES,
} from '@/services/textileService';

const garmentSchema = z.object({
  garmentType: z.string().min(1, 'Garment type is required'),
  styleNumber: z.string().min(1, 'Style number is required'),
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  fabricId: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  productionStage: z.string().min(1, 'Production stage is required'),
  cutDate: z.date().optional(),
  sewDate: z.date().optional(),
  finishDate: z.date().optional(),
  packDate: z.date().optional(),
  operatorName: z.string().optional(),
  lineNumber: z.string().optional(),
  qualityPassed: z.boolean().default(false),
  defectCount: z.coerce.number().min(0).default(0),
  locationId: z.string().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type GarmentFormValues = z.infer<typeof garmentSchema>;

interface GarmentManufacturingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  garment?: GarmentManufacturing;
}

export function GarmentManufacturingSheet({
  open,
  onOpenChange,
  onSuccess,
  garment,
}: GarmentManufacturingSheetProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!garment;

  const form = useForm({
    resolver: zodResolver(garmentSchema),
    defaultValues: {
      isActive: true,
      quantity: 0,
      qualityPassed: false,
      defectCount: 0,
      productionStage: 'CUTTING',
      imageUrl: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (garment) {
        form.reset({
          garmentType: garment.garmentType,
          styleNumber: garment.styleNumber,
          size: garment.size,
          color: garment.color,
          fabricId: garment.fabricId || '',
          quantity: garment.quantity,
          productionStage: garment.productionStage,
          cutDate: garment.cutDate ? new Date(garment.cutDate) : undefined,
          sewDate: garment.sewDate ? new Date(garment.sewDate) : undefined,
          finishDate: garment.finishDate ? new Date(garment.finishDate) : undefined,
          packDate: garment.packDate ? new Date(garment.packDate) : undefined,
          operatorName: garment.operatorName || '',
          lineNumber: garment.lineNumber || '',
          qualityPassed: garment.qualityPassed,
          defectCount: garment.defectCount,
          locationId: garment.locationId || '',
          imageUrl: garment.imageUrl || '',
          notes: garment.notes || '',
          isActive: garment.isActive,
        });
      } else {
        form.reset({
          isActive: true,
          quantity: 1,
          qualityPassed: false,
          defectCount: 0,
          productionStage: 'CUTTING',
          imageUrl: '',
          notes: '',
        });
      }
    }
  }, [open, garment, form]);

  const onSubmit = async (values: GarmentFormValues) => {
    setLoading(true);
    try {
      const payload: CreateGarmentManufacturingData = {
        ...values,
        cutDate: values.cutDate?.toISOString(),
        sewDate: values.sewDate?.toISOString(),
        finishDate: values.finishDate?.toISOString(),
        packDate: values.packDate?.toISOString(),
      };

      if (isEditing && garment) {
        await garmentManufacturingService.updateGarmentManufacturing(garment.id, payload);
        toast.success('Garment record updated successfully');
      } else {
        await garmentManufacturingService.createGarmentManufacturing(payload);
        toast.success('Garment record created successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving garment:', error);
      toast.error(error.message || 'Failed to save garment record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <SheetTitle>{isEditing ? 'Edit Garment Record' : 'New Garment Record'}</SheetTitle>
          <div className='flex items-center space-x-2 mr-6'>
            <span className='text-sm text-muted-foreground'>Active</span>
            <Switch
              checked={form.watch('isActive') || false}
              onCheckedChange={checked => form.setValue('isActive', checked)}
              disabled={!isEditing}
            />
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Basic Information */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Basic Information</h3>

              <FormField
                control={form.control}
                name='imageUrl'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Garment Image</FormLabel>
                    <FormControl>
                      <ImageUpload value={field.value || ''} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && garment?.code && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Code</label>
                  <Input value={garment.code} disabled className='bg-muted' />
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='garmentType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Garment Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GARMENT_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name='styleNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Style Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter style number'
                          {...field}
                          value={field.value || ''}
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
                  name='size'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Size</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., M, L, XL' {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='color'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Color</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter color' {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='quantity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='1'
                          step='1'
                          placeholder='1'
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='fabricId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fabric ID</FormLabel>
                      <FormControl>
                        <Input placeholder='Optional' {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='h-px bg-border' />

            {/* Production Details */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Production Details</h3>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='productionStage'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Production Stage</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select stage' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRODUCTION_STAGES.map(stage => (
                            <SelectItem key={stage.value} value={stage.value}>
                              {stage.label}
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
                  name='lineNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Line Number</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., L-102' {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='operatorName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter operator name'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='h-px bg-border' />

            {/* Dates */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Production Dates</h3>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='cutDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cut Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder='Select cut date'
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
                  name='sewDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sew Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder='Select sew date'
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
                  name='finishDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Finish Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder='Select finish date'
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
                  name='packDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pack Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder='Select pack date'
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
              </div>
            </div>

            <div className='h-px bg-border' />

            {/* Quality */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Quality Control</h3>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='qualityPassed'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>Quality Passed</FormLabel>
                        <FormDescription>Does this batch meet standards?</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='defectCount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Defect Count</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='1'
                          placeholder='0'
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='h-px bg-border' />

            {/* Additional Info */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Additional Information</h3>
              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Any additional notes...'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className='pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEditing ? 'Save Changes' : 'Create Garment'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
