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
  fabricProductionService,
  FabricProduction,
  CreateFabricProductionData,
  FABRIC_TYPES,
  QUALITY_GRADES,
} from '@/services/textileService';

const fabricSchema = z.object({
  fabricName: z.string().min(1, 'Fabric name is required'),
  fabricType: z.string().min(1, 'Fabric type is required'),
  composition: z.string().min(1, 'Composition is required'),
  weightGsm: z.coerce.number().min(0, 'Weight must be positive'),
  widthInches: z.coerce.number().min(0, 'Width must be positive'),
  color: z.string().min(1, 'Color is required'),
  pattern: z.string().optional(),
  finishType: z.string().optional(),
  quantityMeters: z.coerce.number().min(0, 'Quantity must be positive'),
  productionDate: z.date({ required_error: 'Production date is required' }),
  batchNumber: z.string().min(1, 'Batch number is required'),
  qualityGrade: z.string().min(1, 'Quality grade is required'),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FabricFormValues = z.infer<typeof fabricSchema>;

interface FabricProductionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  fabric?: FabricProduction;
}

export function FabricProductionSheet({
  open,
  onOpenChange,
  onSuccess,
  fabric,
}: FabricProductionSheetProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!fabric;

  const form = useForm({
    resolver: zodResolver(fabricSchema),
    defaultValues: {
      isActive: true,
      quantityMeters: 0,
      weightGsm: 0,
      widthInches: 0,
      productionDate: new Date(),
    },
  });

  useEffect(() => {
    if (open) {
      if (fabric) {
        form.reset({
          fabricName: fabric.fabricName,
          fabricType: fabric.fabricType,
          composition: fabric.composition,
          weightGsm: fabric.weightGsm,
          widthInches: fabric.widthInches,
          color: fabric.color,
          pattern: fabric.pattern || '',
          finishType: fabric.finishType || '',
          quantityMeters: fabric.quantityMeters,
          productionDate: new Date(fabric.productionDate),
          batchNumber: fabric.batchNumber,
          qualityGrade: fabric.qualityGrade,
          imageUrl: fabric.imageUrl || '',
          notes: fabric.notes || '',
          isActive: fabric.isActive,
        });
      } else {
        form.reset({
          fabricName: '',
          fabricType: '',
          composition: '',
          weightGsm: 0,
          widthInches: 0,
          color: '',
          pattern: '',
          finishType: '',
          quantityMeters: 0,
          productionDate: new Date(),
          batchNumber: '',
          qualityGrade: '',
          imageUrl: '',
          notes: '',
          isActive: true,
        });
      }
    }
  }, [open, fabric, form]);

  const onSubmit = async (values: FabricFormValues) => {
    setLoading(true);
    try {
      const payload: CreateFabricProductionData = {
        ...values,
        productionDate: values.productionDate.toISOString(),
      };

      if (isEditing && fabric) {
        await fabricProductionService.updateFabricProduction(fabric.id, payload);
        toast.success('Fabric production updated successfully');
      } else {
        await fabricProductionService.createFabricProduction(payload);
        toast.success('Fabric production created successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving fabric:', error);
      toast.error(error.message || 'Failed to save fabric production');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <SheetTitle>{isEditing ? 'Edit Fabric Production' : 'New Fabric Production'}</SheetTitle>
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
                    <FormLabel>Fabric Image</FormLabel>
                    <FormControl>
                      <ImageUpload value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && fabric?.code && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Code</label>
                  <Input value={fabric.code} disabled className='bg-muted' />
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='fabricName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Fabric Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter fabric name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='fabricType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Fabric Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FABRIC_TYPES.map(type => (
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
                name='composition'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Composition</FormLabel>
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
                  name='weightGsm'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Weight (GSM)</FormLabel>
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
                  name='widthInches'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Width (Inches)</FormLabel>
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
                  name='pattern'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pattern</FormLabel>
                      <FormControl>
                        <Input placeholder='Optional' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='finishType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finish Type</FormLabel>
                    <FormControl>
                      <Input placeholder='Optional' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='h-px bg-border' />

            {/* Production Details */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-muted-foreground'>Production Details</h3>

              <div className='grid grid-cols-2 gap-4'>
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
                {isEditing ? 'Save Changes' : 'Create Production'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
