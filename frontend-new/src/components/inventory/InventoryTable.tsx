import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Edit, BookOpen, AlertCircle, Trash2, Box } from 'lucide-react';
import { LocationInventory } from '@/services/inventoryService';
import { toast } from 'sonner';

interface InventoryTableProps {
  data: LocationInventory[];
  loading: boolean;
  onEdit: (record: LocationInventory) => void;
  onRecordMovement: (record: LocationInventory) => void;
  onViewHistory: (record: LocationInventory) => void;
  onRefresh: () => void;
}

export function InventoryTable({
  data,
  loading,
  onEdit,
  onRecordMovement,
  onViewHistory,
  // onRefresh, // keeping it in interface but unused in component body is fine, or I can remove from destructuring
}: InventoryTableProps) {
  const getStockStatus = (item: LocationInventory) => {
    if (item.availableQuantity <= 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    }
    if (item.reorderLevel && item.availableQuantity <= item.reorderLevel) {
      return {
        label: 'Low Stock',
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800',
      };
    }
    return {
      label: 'In Stock',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 hover:bg-green-200',
    };
  };

  if (loading && data.length === 0) {
    return <div className='p-8 text-center text-muted-foreground'>Loading inventory...</div>;
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[100px]'>Code</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className='text-right'>Stock Qty</TableHead>
            <TableHead className='text-right'>Reserved</TableHead>
            <TableHead className='text-right'>Available</TableHead>
            <TableHead className='text-center'>Status</TableHead>
            <TableHead className='text-right'>Value</TableHead>
            <TableHead className='w-[80px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className='h-24 text-center'>
                No inventory found.
              </TableCell>
            </TableRow>
          ) : (
            data.map(record => {
              const status = getStockStatus(record);
              const value = record.stockQuantity * record.product.costPrice;

              return (
                <TableRow key={record.id}>
                  <TableCell className='font-mono text-xs'>
                    {record.product.productCode || '-'}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-9 w-9 bg-primary/10'>
                        <AvatarImage src={record.product.imageUrl} />
                        <AvatarFallback className='text-primary'>
                          <Box className='h-4 w-4' />
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex flex-col'>
                        <span
                          className='font-medium text-sm truncate max-w-[180px]'
                          title={record.product.name}
                        >
                          {record.product.name}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='font-medium text-sm'>{record.location.name}</span>
                      <div className='flex gap-1 mt-1'>
                        {record.location.isHeadquarters && (
                          <Badge
                            variant='outline'
                            className='text-[10px] h-4 px-1 py-0 border-blue-200 text-blue-700 bg-blue-50'
                          >
                            HQ
                          </Badge>
                        )}
                        {record.location.isDefault && (
                          <Badge
                            variant='outline'
                            className='text-[10px] h-4 px-1 py-0 border-green-200 text-green-700 bg-green-50'
                          >
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex flex-col items-end'>
                      <span className='font-medium'>{record.stockQuantity}</span>
                      <span className='text-[10px] text-muted-foreground'>
                        {record.product.unitOfMeasure}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex flex-col items-end'>
                      <span className='font-medium text-orange-600'>{record.reservedQuantity}</span>
                      <span className='text-[10px] text-muted-foreground'>
                        {record.product.unitOfMeasure}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex flex-col items-end'>
                      <span
                        className={`font-bold ${status.label === 'Out of Stock' ? 'text-destructive' : 'text-foreground'}`}
                      >
                        {record.availableQuantity}
                      </span>
                      <span className='text-[10px] text-muted-foreground'>
                        {record.product.unitOfMeasure}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='text-center'>
                    <Badge variant={status.variant} className={status.className}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex flex-col items-end'>
                      <span className='font-medium'>
                        ₹
                        {value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className='text-[10px] text-muted-foreground'>
                        @ ₹{record.product.costPrice}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' className='h-8 w-8 p-0'>
                          <span className='sr-only'>Open menu</span>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(record)}>
                          <Edit className='mr-2 h-4 w-4' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRecordMovement(record)}>
                          <BookOpen className='mr-2 h-4 w-4' />
                          Record Stock Movement
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewHistory(record)}>
                          <AlertCircle className='mr-2 h-4 w-4' />
                          View History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-destructive focus:text-destructive'
                          onClick={() => {
                            toast.info('Delete functionality to be connected in parent');
                          }}
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
