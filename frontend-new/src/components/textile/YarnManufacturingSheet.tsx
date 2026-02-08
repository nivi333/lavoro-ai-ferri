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
  yarnManufacturingService,
  YarnManufacturing,
  CreateYarnManufacturingData,
  YARN_TYPES,
  QUALITY_GRADES,
  YARN_PROCESSES,
} from '@/services/textileService';

const yarnSchema = z.object({
  yarnName: z.string().min(1, 'Yarn name is required'),
  yarnType: z.string().min(1, 'Yarn type is required'),
  fiberContent: z.string().min(1, 'Fiber content is required'),
  yarnCount: z.string().min(1, 'Yarn count is required'),
  twistType: z.string().min(1, 'Twist type is required'),
  twistPerInch: z.coerce.number().min(0).optional(),
  ply: z.coerce.number().min(0).optional(),
  color: z.string().min(1, 'Color is required'),
  dyeLot: z.string().optional(),
  quantityKg: z.coerce.number().min(0, 'Quantity must be positive'),
  productionDate: z.date({ required_error: 'Production date is required' }),
  batchNumber: z.string().min(1, 'Batch number is required'),
  processType: z.string().optional(),
  qualityGrade: z.string().min(1, 'Quality grade is required'),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type YarnFormValues = z.infer<typeof yarnSchema>;

interface YarnManufacturingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  yarn?: YarnManufacturing;
}

export function YarnManufacturingSheet({
  open,
  onOpenChange,
  onSuccess,
  yarn,
}: YarnManufacturingSheetProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!yarn;

  const form = useForm({
    resolver: zodResolver(yarnSchema),
    defaultValues: {
      isActive: true,
      yarnCount: '',
      quantityKg: 0,
      productionDate: new Date(),
    },
  });

  useEffect(() => {
    if (open) {
      if (yarn) {
        form.reset({
          yarnName: yarn.yarnName,
          yarnType: yarn.yarnType,
          fiberContent: yarn.fiberContent,
          yarnCount: String(yarn.yarnCount) || '', // Handling string/number mismatch if any
          twistType: yarn.twistType || '',
          twistPerInch: yarn.twistPerInch || 0,
          ply: yarn.ply || 1,
          color: yarn.color,
          dyeLot: yarn.dyeLot || '',
          quantityKg: yarn.quantityKg,
          productionDate: new Date(yarn.productionDate),
          batchNumber: yarn.batchNumber,
          processType: yarn.processType || '',
          qualityGrade: yarn.qualityGrade,
          imageUrl: yarn.imageUrl || '',
          notes: yarn.notes || '',
          isActive: yarn.isActive,
        });
      } else {
        form.reset({
          yarnName: '',
          yarnType: '',
          fiberContent: '',
          yarnCount: '',
          twistType: '',
          twistPerInch: 0,
          ply: 1,
          color: '',
          dyeLot: '',
          quantityKg: 0,
          productionDate: new Date(),
          batchNumber: '',
          processType: '',
          qualityGrade: '',
          imageUrl: '',
          notes: '',
          isActive: true,
        });
      }
    }
  }, [open, yarn, form]);

  const onSubmit = async (values: YarnFormValues) => {
    setLoading(true);
    try {
      const payload: CreateYarnManufacturingData = {
        ...values,
        productionDate: values.productionDate.toISOString(),
      };

      if (isEditing && yarn) {
        await yarnManufacturingService.updateYarnManufacturing(yarn.id, payload);
        toast.success('Yarn manufacturing updated successfully');
      } else {
        await yarnManufacturingService.createYarnManufacturing(payload);
        toast.success('Yarn manufacturing created successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving yarn:', error);
      toast.error(error.message || 'Failed to save yarn manufacturing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <SheetTitle>
            {isEditing ? 'Edit Yarn Manufacturing' : 'New Yarn Manufacturing'}
          </SheetTitle>
          <div className='flex items-center space-x-2 mr-6'>
            <span className='text-sm text-muted-foreground'>Active</span>
            <Switch
              checked={form.watch('isActive')}
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
                    <FormLabel>Yarn Image</FormLabel>
                    <FormControl>
                      <ImageUpload value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && yarn?.code && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Code</label>
                  <Input value={yarn.code} disabled className='bg-muted' />
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='yarnName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Yarn Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter yarn name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='yarnType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Yarn Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {YARN_TYPES.map(type => (
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
              </div>

              <FormField
                control={form.control}
                name='fiberContent'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Fiber Content</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., 100% Cotton' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='yarnCount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Yarn Count</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., 40s or 20' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='ply'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ply</FormLabel>
                      <FormControl>
                        <Input type='number' min='1' step='1' placeholder='1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='color'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Color</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter color' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='dyeLot'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dye Lot</FormLabel>
                      <FormControl>
                        <Input placeholder='Optional' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='twistType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Twist Type</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., Z-Twist' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='twistPerInch'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twist Per Inch</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='0.1' placeholder='0.0' {...field} />
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
                  name='quantityKg'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Quantity (Kg)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='0.1'
                          placeholder='0.0'
                          {...field}
                          onChange={e =>
                            field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='productionDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Production Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder='Select production date'
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

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='batchNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Batch Number</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter batch number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='qualityGrade'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Quality Grade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select grade' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {QUALITY_GRADES.map(grade => (
                            <SelectItem key={grade.value} value={grade.value}>
                              {grade.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='processType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Process Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select process' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {YARN_PROCESSES.map(process => (
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
                      <Textarea placeholder='Any additional notes...' {...field} />
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
                {isEditing ? 'Save Changes' : 'Create Yarn'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
