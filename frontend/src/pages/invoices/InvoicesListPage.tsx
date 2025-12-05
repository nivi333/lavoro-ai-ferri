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
import { invoiceService, InvoiceSummary, InvoiceStatus } from '../../services/invoiceService';
import { InvoiceFormDrawer } from '../../components/invoices/InvoiceFormDrawer';
import '../sales/CustomerListPage.scss';

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: 'default',
  SENT: 'processing',
  PARTIALLY_PAID: 'gold',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'volcano',
};

const NEXT_STATUS_MAP: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID', 'OVERDUE'],
  OVERDUE: ['PARTIALLY_PAID', 'PAID'],
  PAID: [],
  CANCELLED: [],
};

function getStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'SENT':
      return 'Sent';
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

export default function InvoicesListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton
        onClick={handleCreateInvoice}
        size='small'
        className='invoices-create-btn'
        disabled={isEmployee}
      >
        Create Invoice
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
      const [invoicesData, locationsData] = await Promise.all([
        invoiceService.getInvoices(),
        locationService.getLocations(),
      ]);
      setInvoices(invoicesData);
      setLocations(locationsData);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      message.error(error.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const refreshInvoices = async () => {
    try {
      setTableLoading(true);
      const invoicesData = await invoiceService.getInvoices();
      setInvoices(invoicesData);
    } catch (error: any) {
      console.error('Error refreshing invoices:', error);
      message.error(error.message || 'Failed to refresh invoices');
    } finally {
      setTableLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    setEditingInvoiceId(null);
    setDrawerVisible(true);
  };

  const handleEditInvoice = (invoice: InvoiceSummary) => {
    setEditingInvoiceId(invoice.invoiceId);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setEditingInvoiceId(null);
  };

  const handleInvoiceSaved = () => {
    refreshInvoices();
  };

  const handleChangeStatus = async (invoice: InvoiceSummary, nextStatus: InvoiceStatus) => {
    try {
      setTableLoading(true);
      await invoiceService.updateInvoiceStatus(invoice.invoiceId, nextStatus);
      message.success(`Invoice status updated to ${getStatusLabel(nextStatus)}`);
      refreshInvoices();
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      message.error(error.message || 'Failed to update invoice status');
    } finally {
      setTableLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoice: InvoiceSummary) => {
    // Only DRAFT invoices can be deleted
    if (invoice.status !== 'DRAFT') {
      Modal.warning({
        title: 'Cannot Delete Invoice',
        content: `This invoice cannot be deleted because it is in "${getStatusLabel(invoice.status)}" status. Only draft invoices can be deleted to maintain audit trail and financial records.`,
        okText: 'Understood',
      });
      return;
    }

    Modal.confirm({
      title: 'Delete Invoice',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete invoice ${invoice.invoiceId}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setTableLoading(true);
          await invoiceService.deleteInvoice(invoice.invoiceId);
          message.success('Invoice deleted successfully');
          refreshInvoices();
        } catch (error: any) {
          console.error('Error deleting invoice:', error);
          message.error(error.message || 'Failed to delete invoice');
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

  const getStatusMenuItems = (invoice: InvoiceSummary) => {
    const allowedNext = NEXT_STATUS_MAP[invoice.status] || [];

    return allowedNext.map(status => ({
      key: status,
      label: getStatusLabel(status),
      onClick: () => handleChangeStatus(invoice, status),
    }));
  };

  const columns = [
    {
      title: 'Invoice ID',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (value: string, record: InvoiceSummary) => (
        <div>
          <div className='invoice-id'>{value}</div>
          {record.invoiceNumber && <div className='invoice-number'>#{record.invoiceNumber}</div>}
        </div>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (value: string, record: InvoiceSummary) => (
        <div>
          <div className='customer-name'>{value}</div>
          {record.customerCode && <div className='customer-code'>{record.customerCode}</div>}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: InvoiceStatus) => (
        <Tag color={STATUS_COLORS[status]} className='status-tag'>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'Invoice Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (value: string, record: InvoiceSummary) => {
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
      render: (value: number, record: InvoiceSummary) => {
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
      render: (value: number, record: InvoiceSummary) => {
        const amount = typeof value === 'number' ? value : parseFloat(value || '0');
        const isOverdue =
          record.status === 'OVERDUE' || (amount > 0 && new Date(record.dueDate) < new Date());
        return (
          <span
            className='balance-due'
            style={{ color: isOverdue ? '#ff4d4f' : amount > 0 ? '#faad14' : '#52c41a' }}
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
      render: (_: any, record: InvoiceSummary) => {
        const isEmployee = currentCompany?.role === 'EMPLOYEE';
        const statusItems = getStatusMenuItems(record);
        const canDelete = record.status === 'DRAFT';

        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditInvoice(record),
            disabled: isEmployee,
          },
          ...(canDelete
            ? [
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: 'Delete',
                  onClick: () => handleDeleteInvoice(record),
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
        <div className='no-company-message'>Please select a company to manage invoices.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='invoices-list-page'>
        <div className='page-container'>
          <div className='page-header-section'>
            <Heading level={2} className='page-title'>
              Invoices
            </Heading>
          </div>

          <div className='table-container'>
            {loading ? (
              <div className='loading-container'>
                <Spin size='large' />
              </div>
            ) : invoices.length === 0 ? (
              <Empty description='No invoices found'>
                <GradientButton
                  size='small'
                  onClick={handleCreateInvoice}
                  disabled={currentCompany?.role === 'EMPLOYEE'}
                >
                  Create First Invoice
                </GradientButton>
              </Empty>
            ) : (
              <Table
                columns={columns}
                dataSource={invoices}
                rowKey={record => record.id || record.invoiceId}
                loading={tableLoading}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                className='invoices-table'
              />
            )}
          </div>
        </div>
      </div>

      <InvoiceFormDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        onSaved={handleInvoiceSaved}
        mode={editingInvoiceId ? 'edit' : 'create'}
        editingInvoiceId={editingInvoiceId}
      />
    </MainLayout>
  );
}
