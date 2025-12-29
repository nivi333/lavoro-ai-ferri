import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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
import { Customer } from '@/services/customerService';

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  userRole?: string;
}

export function CustomerTable({
  customers,
  loading,
  onEdit,
  onDelete,
  userRole,
}: CustomerTableProps) {
  const isEmployee = userRole === 'EMPLOYEE';

  if (loading && customers.length === 0) {
    return <div className='p-4 text-center text-muted-foreground'>Loading customers...</div>;
  }

  return (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className='w-[80px]'></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map(customer => (
          <TableRow key={customer.id}>
            <TableCell className='font-medium'>{customer.name}</TableCell>
            <TableCell>{customer.phone || '—'}</TableCell>
            <TableCell>{customer.email || '—'}</TableCell>
            <TableCell>
              {customer.billingCity}
              {customer.billingState ? `, ${customer.billingState}` : ''}
            </TableCell>
            <TableCell>
              <span className='capitalize'>
                {customer.customerType?.toLowerCase().replace('_', ' ') || '—'}
              </span>
            </TableCell>
            <TableCell>
              <StatusBadge variant={customer.isActive ? 'success' : 'default'}>
                {customer.isActive ? 'Active' : 'Inactive'}
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
                  <DropdownMenuItem onClick={() => onEdit(customer)} disabled={isEmployee}>
                    <Edit className='mr-2 h-4 w-4' /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(customer)}
                    disabled={isEmployee}
                    className='text-destructive focus:text-destructive'
                  >
                    <Trash2 className='mr-2 h-4 w-4' /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
        {!loading && customers.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className='h-24 text-center'>
              No customers found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </DataTable>
  );
}
