import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  RefreshCcw,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import MainLayout from '@/components/layout/MainLayout';
import { OrderFormSheet } from '@/components/orders/OrderFormSheet';
import { orderService, OrderSummary, OrderStatus } from '@/services/orderService';
import { locationService } from '@/services/locationService';
import useAuth from '@/contexts/AuthContext';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon?: any }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary', icon: Clock },
  CONFIRMED: { label: 'Confirmed', variant: 'default', icon: CheckCircle },
  IN_PRODUCTION: { label: 'In Production', variant: 'outline', icon: Package },
  READY_TO_SHIP: { label: 'Ready to Ship', variant: 'outline', icon: Package },
  SHIPPED: { label: 'Shipped', variant: 'outline', icon: Truck },
  DELIVERED: { label: 'Delivered', variant: 'outline', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

const NEXT_STATUS_MAP: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['READY_TO_SHIP', 'CANCELLED'],
  READY_TO_SHIP: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrdersListPage() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);

  const { currentCompany } = useAuth();

  useEffect(() => {
    if (currentCompany?.id) {
      fetchLocations();
      fetchOrders();
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchOrders();
    }
  }, [searchText, statusFilter]);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getLocations();
      setLocations(response || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Note: OrderService.getOrders(params) supports status, customerName etc.
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchText) params.customerName = searchText; // Simple search mapping

      const response = await orderService.getOrders(params);
      setOrders(response || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleCreate = () => {
    setEditingOrder(null);
    setIsSheetOpen(true);
  };

  const handleEdit = async (order: OrderSummary) => {
    try {
      setLoading(true);
      // We need full details for editing, list view might be summary
      const details = await orderService.getOrderById(order.orderId);
      setEditingOrder(details);
      setIsSheetOpen(true);
    } catch (error) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await orderService.deleteOrder(orderId);
      toast.success('Order deleted');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete order');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${STATUS_CONFIG[newStatus].label}`);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return '—';
    const loc = locations.find(l => l.id === locationId);
    return loc ? loc.name : '—';
  };

  return (
    <div>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Sales Orders</h1>
            <p className='text-muted-foreground'>Manage customer orders and shipments</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className='mr-2 h-4 w-4' /> Create Order
          </Button>
        </div>

        <Separator />

        {/* Filters */}
        <div className='flex flex-col sm:flex-row gap-4 items-end sm:items-center flex-wrap'>
          <div className='relative w-full sm:w-64'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search by customer...'
              className='pl-8'
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='All Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              {Object.keys(STATUS_CONFIG).map(status => (
                <SelectItem key={status} value={status}>
                  {STATUS_CONFIG[status as OrderStatus].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className='flex items-center gap-2 ml-auto'>
            <Button variant='outline' size='icon' onClick={handleRefresh} title='Refresh'>
              <RefreshCcw className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              onClick={clearFilters}
              disabled={!searchText && statusFilter === 'all'}
            >
              <Filter className='mr-2 h-4 w-4' /> Clear
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Total</TableHead>
                <TableHead className='w-[80px]'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className='text-center py-10'>
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='text-center py-10 text-muted-foreground'>
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map(order => {
                  const statusInfo = STATUS_CONFIG[order.status] || {
                    label: order.status,
                    variant: 'secondary',
                  };
                  // const StatusIcon = statusInfo.icon;

                  return (
                    <TableRow key={order.orderId}>
                      <TableCell className='font-medium'>{order.orderId}</TableCell>
                      <TableCell>
                        <div className='font-medium'>{order.customerName}</div>
                        {order.customerCode && (
                          <div className='text-xs text-muted-foreground'>{order.customerCode}</div>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(order.orderDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getLocationName(order.locationId)}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {/* {StatusIcon && <StatusIcon className="mr-1 h-3 w-3" />} */}
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right font-medium'>
                        {order.currency}{' '}
                        {Number(order.totalAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
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
                            <DropdownMenuItem onClick={() => handleEdit(order)}>
                              <Edit className='mr-2 h-4 w-4' /> Edit
                            </DropdownMenuItem>
                            {NEXT_STATUS_MAP[order.status]?.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                {NEXT_STATUS_MAP[order.status].map(nextStatus => (
                                  <DropdownMenuItem
                                    key={nextStatus}
                                    onClick={() => handleStatusChange(order.orderId, nextStatus)}
                                  >
                                    {STATUS_CONFIG[nextStatus].label}
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className='text-destructive focus:text-destructive'
                              onClick={() => handleDelete(order.orderId)}
                            >
                              <Trash2 className='mr-2 h-4 w-4' /> Delete
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

        <OrderFormSheet
          open={isSheetOpen}
          onClose={() => {
            setIsSheetOpen(false);
            setEditingOrder(null);
          }}
          onSaved={handleRefresh}
          initialData={editingOrder}
        />
      </div>
    </div>
  );
}
