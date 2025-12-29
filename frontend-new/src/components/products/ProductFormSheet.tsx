import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Trash2, Upload } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { productService, CreateProductRequest } from '@/services/productService';
import { toast } from 'sonner';

// UOM Options from legacy system
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

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  productCode: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  productType: z.string().min(1, 'Product type is required'),
  material: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  weight: z.coerce.number().min(0).optional(),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  costPrice: z.coerce.number().min(0, 'Cost price must be positive'),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be positive'),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  reorderLevel: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode?: 'create' | 'edit';
  editingProductId?: string | null;
}

export function ProductFormSheet({
  open,
  onClose,
  onSaved,
  mode = 'create',
  editingProductId,
}: ProductFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<{ url: string; name?: string } | null>(null);

  const isEditing = mode === 'edit' && !!editingProductId;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      stockQuantity: 0,
      unitOfMeasure: 'PCS',
      productType: 'OWN_MANUFACTURE',
      costPrice: 0,
      sellingPrice: 0,
    },
  });

  const resetForm = useCallback(() => {
    form.reset({
      isActive: true,
      stockQuantity: 0,
      unitOfMeasure: 'PCS',
      productType: 'OWN_MANUFACTURE',
      costPrice: 0,
      sellingPrice: 0,
      weight: 0,
      reorderLevel: 0,
    });
    setImageFile(null);
  }, [form]);

  // Load data for editing
  useEffect(() => {
    if (open && isEditing && editingProductId) {
      setLoading(true);
      productService
        .getProductById(editingProductId)
        .then(product => {
          form.reset({
            name: product.name,
            productCode: product.productCode,
            barcode: product.barcode,
            description: product.description,
            productType: product.productType,
            material: product.material,
            color: product.color,
            size: product.size,
            weight: product.weight || 0,
            unitOfMeasure: product.unitOfMeasure,
            costPrice: product.costPrice,
            sellingPrice: product.sellingPrice,
            stockQuantity: product.stockQuantity,
            reorderLevel: product.reorderLevel || 0,
            isActive: product.isActive,
          });
          if (product.imageUrl) {
            setImageFile({ url: product.imageUrl });
          }
        })
        .catch(error => {
          console.error('Error loading product:', error);
          toast.error('Failed to load product details');
        })
        .finally(() => setLoading(false));
    } else if (open && !isEditing) {
      resetForm();
    }
  }, [open, isEditing, editingProductId, form, resetForm]);

  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Only JPG/PNG files are allowed');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        setImageFile({
          url: e.target.result as string,
          name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    try {
      const payload: CreateProductRequest = {
        name: values.name,
        description: values.description,
        productType: values.productType,
        material: values.material,
        color: values.color,
        size: values.size,
        weight: values.weight,
        unitOfMeasure: values.unitOfMeasure,
        costPrice: values.costPrice,
        sellingPrice: values.sellingPrice,
        stockQuantity: values.stockQuantity,
        reorderLevel: values.reorderLevel,
        barcode: values.barcode,
        imageUrl: imageFile?.url,
        isActive: values.isActive,
      };

      if (isEditing && editingProductId) {
        // Create update payload - remove fields that shouldn't be updated or strictly typed if needed
        // The service takes UpdateProductRequest which is similar
        await productService.updateProduct(editingProductId, payload);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(payload);
        toast.success('Product created successfully');
      }
      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className='w-[720px] sm:max-w-[720px] overflow-y-auto'>
        <SheetHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <SheetTitle>{isEditing ? 'Edit Product' : 'Create Product'}</SheetTitle>
          {/* Active Switch in Header for Edit Mode, or just nice to have */}
          <div className='flex items-center space-x-2 mr-6'>
            <span className='text-sm text-muted-foreground'>Active</span>
            <Switch
              checked={form.watch('isActive')}
              onCheckedChange={checked => form.setValue('isActive', checked)}
            />
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Basic Information */}
            <div className='space-y-2'>
              <h3 className='text-sm font-medium text-muted-foreground'>Basic Information</h3>

              <div className='flex flex-col items-start justify-start gap-4'>
                <div className='relative group'>
                  {imageFile?.url ? (
                    <div className='relative h-24 w-24 rounded-lg overflow-hidden border border-border'>
                      <img
                        src={imageFile.url}
                        alt='Product'
                        className='h-full w-full object-cover'
                      />
                      <button
                        type='button'
                        onClick={() => setImageFile(null)}
                        className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white'
                      >
                        <Trash2 className='h-5 w-5' />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor='image-upload'
                      className='flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors'
                    >
                      <Upload className='h-6 w-6 text-muted-foreground' />
                      <span className='mt-1 text-xs text-muted-foreground'>Upload</span>
                      <input
                        id='image-upload'
                        type='file'
                        accept='image/jpeg,image/png'
                        className='hidden'
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
                <div className='text-xs text-muted-foreground text-left'>JPG/PNG, max 2MB</div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='productCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Code</FormLabel>
                      <FormControl>
                        <Input placeholder='Auto generated' {...field} disabled />
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
                      <FormLabel required>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter product name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='productType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Product Type</FormLabel>
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
                          <SelectItem value='OWN_MANUFACTURE'>Own Manufacture</SelectItem>
                          <SelectItem value='VENDOR_SUPPLIED'>Vendor Supplied</SelectItem>
                          <SelectItem value='OUTSOURCED'>Outsourced</SelectItem>
                          <SelectItem value='RAW_MATERIAL'>Raw Material</SelectItem>
                          <SelectItem value='FINISHED_GOODS'>Finished Goods</SelectItem>
                          <SelectItem value='SEMI_FINISHED'>Semi-Finished</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  <FormField
                  control={form.control}
                  name='barcode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode / SKU</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter barcode or SKU' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Product description' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Pricing */}
            <div className='space-y-2'>
              <h3 className='text-sm font-medium text-muted-foreground'>Pricing</h3>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='costPrice'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Cost Price</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='0.01'
                          placeholder='0.00'
                          {...field}
                          onBlur={e => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              field.onChange(val.toFixed(2));
                            }
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='sellingPrice'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Selling Price</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='0.01'
                          placeholder='0.00'
                          {...field}
                          onBlur={e => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              field.onChange(val.toFixed(2));
                            }
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Inventory */}
            <div className='space-y-2'>
              <h3 className='text-sm font-medium text-muted-foreground'>Inventory</h3>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='stockQuantity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='1'
                          placeholder='0'
                          {...field}
                          disabled={isEditing}
                        />
                      </FormControl>
                      {isEditing && (
                        <p className='text-[10px] text-muted-foreground'>
                          Use stock adjustment to change quantity
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='unitOfMeasure'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Unit of Measure</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select UOM' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className='max-h-[200px]'>
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
                <FormField
                  control={form.control}
                  name='reorderLevel'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='1' placeholder='0' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Specifications */}
            <div className='space-y-2'>
              <h3 className='text-sm font-medium text-muted-foreground'>Specifications</h3>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='material'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Cotton' {...field} />
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
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Blue' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='size'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Large' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='weight'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='0.001' placeholder='0.000' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter className='pt-4'>
              <Button type='button' variant='outline' onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEditing ? 'Update Product' : 'Create Product'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
