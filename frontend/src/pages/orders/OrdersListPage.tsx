import { useEffect, useRef, useState } from 'react';
import { Table, Tag, Space, Button, Dropdown, Empty, Spin, message } from 'antd';
import { MoreOutlined, EditOutlined } from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { locationService, Location } from '../../services/locationService';
import { orderService, OrderSummary, OrderStatus } from '../../services/orderService';
import { OrderFormDrawer } from '../../components/orders/OrderFormDrawer';
import '../../pages/sales/CustomerListPage.scss';

const STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: 'default',
  CONFIRMED: 'processing',
  IN_PRODUCTION: 'gold',
  READY_TO_SHIP: 'cyan',
  SHIPPED: 'blue',
  DELIVERED: 'green',
  CANCELLED: 'red',
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

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'IN_PRODUCTION':
      return 'In Production';
    case 'READY_TO_SHIP':
      return 'Ready to Ship';
    case 'SHIPPED':
      return 'Shipped';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export default function OrdersListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton
        onClick={handleCreateOrder}
        size='small'
        className='orders-create-btn'
        disabled={isEmployee}
      >
        Create Order
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions, currentCompany?.role]);

  useEffect(() => {
    if (currentCompany) {
      fetchData();
    }
  }, [currentCompany]);

  const fetchData = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const [ordersData, locationsData] = await Promise.all([
        orderService.getOrders(),
        locationService.getLocations(),
      ]);
      setOrders(ordersData);
      setLocations(locationsData);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      message.error(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const refreshOrders = async () => {
    try {
      setTableLoading(true);
      const ordersData = await orderService.getOrders();
      setOrders(ordersData);
    } catch (error: any) {
      console.error('Error refreshing orders:', error);
      message.error(error.message || 'Failed to refresh orders');
    } finally {
      setTableLoading(false);
    }
  };

  const handleCreateOrder = () => {
    setEditingOrderId(null);
    setDrawerVisible(true);
  };

  const handleEditOrder = (order: OrderSummary) => {
    setEditingOrderId(order.orderId);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setEditingOrderId(null);
  };

  const handleOrderSaved = () => {
    refreshOrders();
  };

  const handleChangeStatus = async (order: OrderSummary, nextStatus: OrderStatus) => {
    try {
      setTableLoading(true);
      await orderService.updateOrderStatus(order.orderId, nextStatus);
      message.success(`Order status updated to ${getStatusLabel(nextStatus)}`);
      refreshOrders();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      message.error(error.message || 'Failed to update order status');
    } finally {
      setTableLoading(false);
    }
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return '—';
    const loc = locations.find(l => l.id === locationId);
    if (!loc) return '—';
    let label = loc.name;
    if (loc.isHeadquarters) label += ' • HQ';
    if (loc.isDefault) label += ' • Default';
    return label;
  };

  const getStatusMenuItems = (order: OrderSummary) => {
    const allowedNext = NEXT_STATUS_MAP[order.status] || [];

    return allowedNext.map(status => ({
      key: status,
      label: `Mark as ${getStatusLabel(status)}`,
      onClick: () => handleChangeStatus(order, status),
    }));
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      sorter: (a: OrderSummary, b: OrderSummary) =>
        (a.orderId || '').localeCompare(b.orderId || ''),
      render: (value: string) => <div className='order-id'>{value}</div>,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true,
      sorter: (a: OrderSummary, b: OrderSummary) =>
        (a.customerName || '').localeCompare(b.customerName || ''),
      render: (value: string) => (
        <div
          className='customer-name'
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {value}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: OrderSummary, b: OrderSummary) => (a.status || '').localeCompare(b.status || ''),
      render: (status: OrderStatus) => (
        <Tag color={STATUS_COLORS[status]} className='status-tag'>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      sorter: (a: OrderSummary, b: OrderSummary) =>
        new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(),
      render: (value: string) => (
        <div className='order-date'>{new Date(value).toLocaleDateString()}</div>
      ),
    },
    {
      title: 'Delivery Date',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      sorter: (a: OrderSummary, b: OrderSummary) =>
        new Date(a.deliveryDate || 0).getTime() - new Date(b.deliveryDate || 0).getTime(),
      render: (value?: string) => (
        <div className='delivery-date'>{value ? new Date(value).toLocaleDateString() : '—'}</div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'locationId',
      key: 'locationId',
      render: (value?: string) => getLocationName(value),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      sorter: (a: OrderSummary, b: OrderSummary) =>
        Number(a.totalAmount || 0) - Number(b.totalAmount || 0),
      render: (value: number, record: OrderSummary) => {
        const amount = typeof value === 'number' ? value : parseFloat(value || '0');
        return (
          <span className='total-amount'>
            {record.currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: any, record: OrderSummary) => {
        const isEmployee = currentCompany?.role === 'EMPLOYEE';
        const statusItems = getStatusMenuItems(record);
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditOrder(record),
            disabled: isEmployee,
          },
          ...(statusItems.length
            ? ([{ type: 'divider' as const }] as any[]).concat(statusItems as any)
            : []),
        ];

        return (
          <Space>
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement='bottomRight'>
              <Button type='text' icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  if (!currentCompany) {
    return (
      <MainLayout>
        <div className='no-company-message'>Please select a company to manage orders.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='orders-list-page'>
        <div className='page-container'>
          <div className='page-header-section'>
            <Heading level={2} className='page-title'>
              Orders
            </Heading>
          </div>

          <div className='table-container'>
            {loading ? (
              <div className='loading-container'>
                <Spin size='large' />
              </div>
            ) : orders.length === 0 ? (
              <Empty description='No orders found'>
                <GradientButton
                  size='small'
                  onClick={handleCreateOrder}
                  disabled={currentCompany?.role === 'EMPLOYEE'}
                >
                  Create First Order
                </GradientButton>
              </Empty>
            ) : (
              <Table
                columns={columns}
                dataSource={orders}
                rowKey={record => record.id || record.orderId}
                loading={tableLoading}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                className='orders-table'
              />
            )}
          </div>
        </div>
      </div>

      <OrderFormDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        onSaved={handleOrderSaved}
        mode={editingOrderId ? 'edit' : 'create'}
        editingOrderId={editingOrderId}
      />
    </MainLayout>
  );
}
