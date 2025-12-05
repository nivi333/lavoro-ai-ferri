import { useEffect, useRef, useState } from 'react';
import { Table, Tag, Space, Button, Dropdown, Empty, Spin, message } from 'antd';
import { MoreOutlined, EditOutlined } from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { locationService, Location } from '../../services/locationService';
import {
  purchaseOrderService,
  PurchaseOrderSummary,
  POStatus,
} from '../../services/purchaseOrderService';
import '../../pages/sales/CustomerListPage.scss';
import { PurchaseOrderDrawer } from '@/components/purchase/PurchaseOrderDrawer';

const STATUS_COLORS: Record<POStatus, string> = {
  DRAFT: 'default',
  SENT: 'processing',
  CONFIRMED: 'gold',
  PARTIALLY_RECEIVED: 'cyan',
  RECEIVED: 'green',
  CANCELLED: 'red',
};

const NEXT_STATUS_MAP: Record<POStatus, POStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['RECEIVED'],
  RECEIVED: [],
  CANCELLED: [],
};

function getStatusLabel(status: POStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'SENT':
      return 'Sent';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'PARTIALLY_RECEIVED':
      return 'Partially Received';
    case 'RECEIVED':
      return 'Received';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export default function PurchaseOrdersListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderSummary[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingPOId, setEditingPOId] = useState<string | null>(null);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton
        onClick={handleCreatePurchaseOrder}
        size='small'
        className='orders-create-btn'
        disabled={isEmployee}
      >
        Create Purchase Order
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
      const [posData, locationsData] = await Promise.all([
        purchaseOrderService.getPurchaseOrders(),
        locationService.getLocations(),
      ]);
      setPurchaseOrders(posData);
      setLocations(locationsData);
    } catch (error: any) {
      console.error('Error fetching purchase orders:', error);
      message.error(error.message || 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const refreshPurchaseOrders = async () => {
    try {
      setTableLoading(true);
      const posData = await purchaseOrderService.getPurchaseOrders();
      setPurchaseOrders(posData);
    } catch (error: any) {
      console.error('Error refreshing purchase orders:', error);
      message.error(error.message || 'Failed to refresh purchase orders');
    } finally {
      setTableLoading(false);
    }
  };

  const handleCreatePurchaseOrder = () => {
    setEditingPOId(null);
    setDrawerVisible(true);
  };

  const handleEditPurchaseOrder = (po: PurchaseOrderSummary) => {
    setEditingPOId(po.poId);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setEditingPOId(null);
  };

  const handlePurchaseOrderSaved = () => {
    refreshPurchaseOrders();
  };

  const handleChangeStatus = async (po: PurchaseOrderSummary, nextStatus: POStatus) => {
    try {
      setTableLoading(true);
      await purchaseOrderService.updatePOStatus(po.poId, nextStatus);
      message.success(`Purchase Order status updated to ${getStatusLabel(nextStatus)}`);
      refreshPurchaseOrders();
    } catch (error: any) {
      console.error('Error updating purchase order status:', error);
      message.error(error.message || 'Failed to update purchase order status');
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

  const getStatusMenuItems = (po: PurchaseOrderSummary) => {
    const allowedNext = NEXT_STATUS_MAP[po.status] || [];

    return allowedNext.map(status => ({
      key: status,
      label: getStatusLabel(status),
      onClick: () => handleChangeStatus(po, status),
    }));
  };

  const columns = [
    {
      title: 'PO ID',
      dataIndex: 'poId',
      key: 'poId',
      render: (value: string) => <div className='po-id'>{value}</div>,
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (value: string) => <div className='supplier-name'>{value}</div>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: POStatus) => (
        <Tag color={STATUS_COLORS[status]} className='status-tag'>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'PO Date',
      dataIndex: 'poDate',
      key: 'poDate',
      render: (value: string) => (
        <div className='po-date'>{new Date(value).toLocaleDateString()}</div>
      ),
    },
    {
      title: 'Expected Delivery',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
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
      render: (value: number, record: PurchaseOrderSummary) => {
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
      render: (_: any, record: PurchaseOrderSummary) => {
        const isEmployee = currentCompany?.role === 'EMPLOYEE';
        const statusItems = getStatusMenuItems(record);
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditPurchaseOrder(record),
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
        <div className='no-company-message'>Please select a company to manage purchase orders.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='purchase-orders-list-page'>
        <div className='page-container'>
          <div className='page-header-section'>
            <Heading level={2} className='page-title'>
              Purchase Orders
            </Heading>
          </div>

          <div className='table-container'>
            {loading ? (
              <div className='loading-container'>
                <Spin size='large' />
              </div>
            ) : purchaseOrders.length === 0 ? (
              <Empty description='No purchase orders found'>
                <GradientButton
                  size='small'
                  onClick={handleCreatePurchaseOrder}
                  disabled={currentCompany?.role === 'EMPLOYEE'}
                >
                  Create First PO
                </GradientButton>
              </Empty>
            ) : (
              <Table
                columns={columns}
                dataSource={purchaseOrders}
                rowKey={record => record.id || record.poId}
                loading={tableLoading}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                className='purchase-orders-table'
              />
            )}
          </div>
        </div>
      </div>

      <PurchaseOrderDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        onSaved={handlePurchaseOrderSaved}
        mode={editingPOId ? 'edit' : 'create'}
        editingPOId={editingPOId}
      />
    </MainLayout>
  );
}
