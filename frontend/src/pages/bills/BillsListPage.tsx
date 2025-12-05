import { useEffect, useRef, useState } from 'react';
import { Table, Tag, Space, Button, Dropdown, Empty, Spin, message, Modal } from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { locationService, Location } from '../../services/locationService';
import { billService, BillSummary, BillStatus } from '../../services/billService';
import { BillFormDrawer } from '../../components/bills/BillFormDrawer';
import '../sales/CustomerListPage.scss';

const STATUS_COLORS: Record<BillStatus, string> = {
  DRAFT: 'default',
  RECEIVED: 'processing',
  PARTIALLY_PAID: 'gold',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'volcano',
};

const NEXT_STATUS_MAP: Record<BillStatus, BillStatus[]> = {
  DRAFT: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID', 'OVERDUE'],
  OVERDUE: ['PARTIALLY_PAID', 'PAID'],
  PAID: [],
  CANCELLED: [],
};

function getStatusLabel(status: BillStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'RECEIVED':
      return 'Received';
    case 'PARTIALLY_PAID':
      return 'Partially Paid';
    case 'PAID':
      return 'Paid';
    case 'OVERDUE':
      return 'Overdue';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export default function BillsListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [bills, setBills] = useState<BillSummary[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton
        onClick={handleCreateBill}
        size='small'
        className='bills-create-btn'
        disabled={isEmployee}
      >
        Create Bill
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
      const [billsData, locationsData] = await Promise.all([
        billService.getBills(),
        locationService.getLocations(),
      ]);
      setBills(billsData);
      setLocations(locationsData);
    } catch (error: any) {
      console.error('Error fetching bills:', error);
      message.error(error.message || 'Failed to fetch bills');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const refreshBills = async () => {
    try {
      setTableLoading(true);
      const billsData = await billService.getBills();
      setBills(billsData);
    } catch (error: any) {
      console.error('Error refreshing bills:', error);
      message.error(error.message || 'Failed to refresh bills');
    } finally {
      setTableLoading(false);
    }
  };

  const handleCreateBill = () => {
    setEditingBillId(null);
    setDrawerVisible(true);
  };

  const handleEditBill = (bill: BillSummary) => {
    setEditingBillId(bill.billId);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setEditingBillId(null);
  };

  const handleBillSaved = () => {
    refreshBills();
  };

  const handleChangeStatus = async (bill: BillSummary, nextStatus: BillStatus) => {
    try {
      setTableLoading(true);
      await billService.updateBillStatus(bill.billId, nextStatus);
      message.success(`Bill status updated to ${getStatusLabel(nextStatus)}`);
      refreshBills();
    } catch (error: any) {
      console.error('Error updating bill status:', error);
      message.error(error.message || 'Failed to update bill status');
    } finally {
      setTableLoading(false);
    }
  };

  const handleDeleteBill = async (bill: BillSummary) => {
    // Only DRAFT bills can be deleted
    if (bill.status !== 'DRAFT') {
      Modal.warning({
        title: 'Cannot Delete Bill',
        content: `This bill cannot be deleted because it is in "${getStatusLabel(bill.status)}" status. Only draft bills can be deleted to maintain audit trail and financial records.`,
        okText: 'Understood',
      });
      return;
    }

    Modal.confirm({
      title: 'Delete Bill',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete bill ${bill.billId}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setTableLoading(true);
          await billService.deleteBill(bill.billId);
          message.success('Bill deleted successfully');
          refreshBills();
        } catch (error: any) {
          console.error('Error deleting bill:', error);
          message.error(error.message || 'Failed to delete bill');
        } finally {
          setTableLoading(false);
        }
      },
    });
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

  const getStatusMenuItems = (bill: BillSummary) => {
    const allowedNext = NEXT_STATUS_MAP[bill.status] || [];

    return allowedNext.map(status => ({
      key: status,
      label: getStatusLabel(status),
      onClick: () => handleChangeStatus(bill, status),
    }));
  };

  const columns = [
    {
      title: 'Bill ID',
      dataIndex: 'billId',
      key: 'billId',
      render: (value: string, record: BillSummary) => (
        <div>
          <div className='bill-id'>{value}</div>
          {record.billNumber && <div className='bill-number'>#{record.billNumber}</div>}
        </div>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (value: string, record: BillSummary) => (
        <div>
          <div className='supplier-name'>{value}</div>
          {record.supplierCode && <div className='supplier-code'>{record.supplierCode}</div>}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: BillStatus) => (
        <Tag color={STATUS_COLORS[status]} className='status-tag'>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'Bill Date',
      dataIndex: 'billDate',
      key: 'billDate',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (value: string, record: BillSummary) => {
        const dueDate = new Date(value);
        const isOverdue =
          record.status !== 'PAID' && record.status !== 'CANCELLED' && dueDate < new Date();
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {dueDate.toLocaleDateString()}
          </span>
        );
      },
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
      render: (value: number, record: BillSummary) => {
        const amount = typeof value === 'number' ? value : parseFloat(value || '0');
        return (
          <span className='total-amount'>
            {record.currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: 'Balance Due',
      dataIndex: 'balanceDue',
      key: 'balanceDue',
      align: 'right' as const,
      render: (value: number, record: BillSummary) => {
        const amount = typeof value === 'number' ? value : parseFloat(value || '0');
        const isOverdue =
          record.status === 'OVERDUE' || (amount > 0 && new Date(record.dueDate) < new Date());
        return (
          <span
            className='balance-due'
            style={{
              color: isOverdue ? '#ff4d4f' : amount > 0 ? '#faad14' : '#52c41a',
              fontWeight: 600,
            }}
          >
            {record.currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: any, record: BillSummary) => {
        const isEmployee = currentCompany?.role === 'EMPLOYEE';
        const statusItems = getStatusMenuItems(record);
        const canDelete = record.status === 'DRAFT';

        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditBill(record),
            disabled: isEmployee,
          },
          ...(canDelete
            ? [
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: 'Delete',
                  onClick: () => handleDeleteBill(record),
                  disabled: isEmployee,
                  danger: true,
                },
              ]
            : []),
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
        <div className='no-company-message'>Please select a company to manage bills.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='bills-list-page'>
        <div className='page-container'>
          <div className='page-header-section'>
            <Heading level={2} className='page-title'>
              Bills
            </Heading>
          </div>

          <div className='table-container'>
            {loading ? (
              <div className='loading-container'>
                <Spin size='large' />
              </div>
            ) : bills.length === 0 ? (
              <Empty description='No bills found'>
                <GradientButton
                  size='small'
                  onClick={handleCreateBill}
                  disabled={currentCompany?.role === 'EMPLOYEE'}
                >
                  Create First Bill
                </GradientButton>
              </Empty>
            ) : (
              <Table
                columns={columns}
                dataSource={bills}
                rowKey={record => record.id || record.billId}
                loading={tableLoading}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                className='bills-table'
              />
            )}
          </div>
        </div>
      </div>

      <BillFormDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        onSaved={handleBillSaved}
        mode={editingBillId ? 'edit' : 'create'}
        editingBillId={editingBillId}
      />
    </MainLayout>
  );
}
