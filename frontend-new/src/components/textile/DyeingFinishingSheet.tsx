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
  dyeingFinishingService,
  DyeingFinishing,
  CreateDyeingFinishingData,
  DYEING_PROCESSES,
} from '@/services/textileService';

const dyeingSchema = z.object({
  processType: z.string().min(1, 'Process type is required'),
  fabricId: z.string().min(1, 'Fabric ID is required'),
  colorCode: z.string().min(1, 'Color code is required'),
  colorName: z.string().min(1, 'Color name is required'),
  quantityMeters: z.coerce.number().min(0, 'Quantity must be positive'),
  processDate: z.date({ required_error: 'Process date is required' }),
  batchNumber: z.string().min(1, 'Batch number is required'),
  machineNumber: z.string().optional(),
  temperatureC: z.coerce.number().min(0).optional(),
  durationMinutes: z.coerce.number().min(0).optional(),
  recipeCode: z.string().optional(),
  imageUrl: z.string().optional(),
  qualityCheck: z.boolean().default(false),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type DyeingFormValues = z.infer<typeof dyeingSchema>;

interface DyeingFinishingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  process?: DyeingFinishing;
}

export function DyeingFinishingSheet({
  open,
  onOpenChange,
  onSuccess,
  process,
}: DyeingFinishingSheetProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!process;

  const form = useForm({
    resolver: zodResolver(dyeingSchema),
    defaultValues: {
      isActive: true,
      quantityMeters: 0,
      qualityCheck: false,
      processDate: new Date(),
      processType: 'DYEING',
    },
  });

  useEffect(() => {
    if (open) {
      if (process) {
        form.reset({
          processType: process.processType,
          fabricId: process.fabricId,
          colorCode: process.colorCode,
          colorName: process.colorName,
          quantityMeters: process.quantityMeters,
          processDate: new Date(process.processDate),
          batchNumber: process.batchNumber,
          machineNumber: process.machineNumber || '',
          temperatureC: process.temperatureC || 0,
          durationMinutes: process.durationMinutes || 0,
          recipeCode: process.recipeCode || '',
          imageUrl: process.imageUrl || '',
          qualityCheck: process.qualityCheck,
          notes: process.notes || '',
          isActive: process.isActive,
        });
      } else {
        form.reset({
          isActive: true,
          quantityMeters: 0,
          qualityCheck: false,
          processDate: new Date(),
          processType: 'DYEING',
          temperatureC: 0,
          durationMinutes: 0,
          imageUrl: '',
          notes: '',
        });
      }
    }
  }, [open, process, form]);

  const onSubmit = async (values: DyeingFormValues) => {
    setLoading(true);
    try {
      const payload: CreateDyeingFinishingData = {
        ...values,
        processDate: values.processDate.toISOString(),
      };

      if (isEditing && process) {
        await dyeingFinishingService.updateDyeingFinishing(process.id, payload);
        toast.success('Process updated successfully');
      } else {
        await dyeingFinishingService.createDyeingFinishing(payload);
        toast.success('Process created successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving process:', error);
      toast.error(error.message || 'Failed to save process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <SheetTitle>{isEditing ? 'Edit Dyeing & Finishing' : 'New Process'}</SheetTitle>
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
                    <FormLabel>Process Image</FormLabel>
                    <FormControl>
                      <ImageUpload value={field.value || ''} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && process?.code && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Code</label>
                  <Input value={process.code} disabled className='bg-muted' />
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='processType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Process Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DYEING_PROCESSES.map(process => (
                            <SelectItem key={process.value} value={process.value}>
                              {process.label}
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
                  name='batchNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Batch Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter batch number'
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
                  name='fabricId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Fabric ID</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter fabric ID' {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='colorCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Color Code</FormLabel>
                      <div className='flex gap-2'>
                        <FormControl>
                          <div className='relative flex-1'>
                            <Input placeholder='#000000' {...field} value={field.value || ''} />
                            <input
                              type='color'
                              className='absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 border-0 p-0 bg-transparent cursor-pointer'
                              value={field.value || '#000000'}
                              onChange={e => field.onChange(e.target.value)}
                            />
                          </div>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='colorName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Color Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter color name'
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
                  name='quantityMeters'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Quantity (Meters)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='0.1'
                          placeholder='0.0'
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

            {/* Process Details */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Process Details</h3>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='processDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Process Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder='Select process date'
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
                  name='machineNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter machine number'
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
                  name='temperatureC'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='0.1'
                          placeholder='0.0'
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
                  name='durationMinutes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (Minutes)</FormLabel>
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

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='recipeCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipe Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter recipe code'
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
                  name='qualityCheck'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                      <div className='space-y-0.5'>
                        <FormLabel>Quality Check Passed</FormLabel>
                        <FormDescription>Does this batch meet quality standards?</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                      </FormControl>
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
                {isEditing ? 'Save Changes' : 'Create Process'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
