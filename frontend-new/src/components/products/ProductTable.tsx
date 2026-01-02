import { MoreHorizontal, Edit, Trash2, ArrowRightLeft } from 'lucide-react';
import {
  DataTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  StatusBadge,
  IconButton,
} from '@/components/globalComponents';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProductSummary, ProductCategory } from '@/services/productService';

interface ProductTableProps {
  products: ProductSummary[];
  categories: ProductCategory[];
  loading: boolean;
  onEdit: (product: ProductSummary) => void;
  onAdjustStock: (product: ProductSummary) => void;
  onDelete: (product: ProductSummary) => void;
  userRole?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (column: string) => void;
}

export function ProductTable({
  products,
  categories,
  loading,
  onEdit,
  onAdjustStock,
  onDelete,
  userRole,
  sortColumn,
  sortDirection,
  onSort,
}: ProductTableProps) {
  const isEmployee = userRole === 'EMPLOYEE';

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '—';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '—';
  };

  const getStockStatus = (product: ProductSummary) => {
    if (product.stockQuantity === 0) {
      return { variant: 'error' as const, text: 'Out of Stock' };
    }
    if (product.reorderLevel && product.stockQuantity <= product.reorderLevel) {
      return { variant: 'warning' as const, text: 'Low Stock' };
    }
    return { variant: 'success' as const, text: 'In Stock' };
  };

  if (loading && products.length === 0) {
    return <div className='p-4 text-center text-muted-foreground'>Loading products...</div>;
  }

  return (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead
            sortable={!!onSort}
            sortDirection={sortColumn === 'productCode' ? sortDirection : null}
            onSort={() => onSort?.('productCode')}
          >
            Product Code
          </TableHead>
          <TableHead
            sortable={!!onSort}
            sortDirection={sortColumn === 'name' ? sortDirection : null}
            onSort={() => onSort?.('name')}
          >
            Product Name
          </TableHead>
          <TableHead>Barcode</TableHead>
          <TableHead
            sortable={!!onSort}
            sortDirection={sortColumn === 'category' ? sortDirection : null}
            onSort={() => onSort?.('category')}
          >
            Category
          </TableHead>
          <TableHead
            className='text-right'
            sortable={!!onSort}
            sortDirection={sortColumn === 'stockQuantity' ? sortDirection : null}
            onSort={() => onSort?.('stockQuantity')}
          >
            Stock
          </TableHead>
          <TableHead
            className='text-right'
            sortable={!!onSort}
            sortDirection={sortColumn === 'sellingPrice' ? sortDirection : null}
            onSort={() => onSort?.('sellingPrice')}
          >
            Price
          </TableHead>
          <TableHead
            sortable={!!onSort}
            sortDirection={sortColumn === 'isActive' ? sortDirection : null}
            onSort={() => onSort?.('isActive')}
          >
            Status
          </TableHead>
          <TableHead className='w-[80px]'></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map(product => {
          const stockStatus = getStockStatus(product);
          return (
            <TableRow key={product.id}>
              <TableCell className='font-medium'>{product.productCode || '—'}</TableCell>
              <TableCell>
                <div className='flex items-center gap-3'>
                  <Avatar className='h-9 w-9 border'>
                    <AvatarImage src={product.imageUrl} alt={product.name} />
                    <AvatarFallback className='bg-primary/10 text-primary'>
                      {product.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col'>
                    <span className='font-medium line-clamp-1'>{product.name}</span>
                    <span className='text-xs text-muted-foreground'>SKU: {product.sku}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>{product.barcode || '—'}</TableCell>
              <TableCell>{getCategoryName(product.categoryId)}</TableCell>
              <TableCell className='text-right'>
                <div className='flex flex-col items-end gap-1'>
                  <span>
                    {product.stockQuantity} {product.unitOfMeasure}
                  </span>
                  <StatusBadge variant={stockStatus.variant}>{stockStatus.text}</StatusBadge>
                </div>
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex flex-col items-end'>
                  <span className='font-medium'>₹{product.sellingPrice.toFixed(2)}</span>
                  {product.markupPercent && (
                    <span className='text-xs text-success'>
                      {product.markupPercent.toFixed(0)}% markup
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge variant={product.isActive ? 'success' : 'default'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton variant='ghost' className='h-8 w-8 p-0'>
                      <MoreHorizontal className='h-4 w-4' />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(product)} disabled={isEmployee}>
                      <Edit className='mr-2 h-4 w-4' /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAdjustStock(product)} disabled={isEmployee}>
                      <ArrowRightLeft className='mr-2 h-4 w-4' /> Adjust Stock
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(product)}
                      disabled={isEmployee}
                      className='text-destructive focus:text-destructive'
                    >
                      <Trash2 className='mr-2 h-4 w-4' /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
        {!loading && products.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className='h-24 text-center'>
              No products found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </DataTable>
  );
}
