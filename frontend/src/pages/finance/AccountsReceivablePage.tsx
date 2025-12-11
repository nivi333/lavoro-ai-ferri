import { useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Dropdown,
  Empty,
  Spin,
  message,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import { MoreOutlined, DollarOutlined, ClockCircleOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton, PageBreadcrumb } from '../../components/ui';
import { invoiceService, InvoiceSummary, InvoiceStatus } from '../../services/invoiceService';
import PaymentRecordingModal from '../../components/finance/PaymentRecordingModal';
import './AccountsReceivablePage.scss';

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: 'default',
  SENT: 'processing',
  PARTIALLY_PAID: 'gold',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'volcano',
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

export default function AccountsReceivablePage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading] = useState(false);
  const [stats, setStats] = useState({
    totalReceivable: 0,
    overdueAmount: 0,
    dueIn30Days: 0,
    paidLastMonth: 0,
  });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSummary | null>(null);

  useEffect(() => {
    setHeaderActions(
      <GradientButton size='small' onClick={() => navigate('/invoices/create')}>
        Create Invoice
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions, navigate]);

  useEffect(() => {
    if (currentCompany) {
      fetchData();
    }
  }, [currentCompany]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const invoicesData = await invoiceService.getInvoices();
      setInvoices(invoicesData);

      // Calculate statistics
      const totalReceivable = invoicesData
        .filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
        .reduce((sum, inv) => sum + inv.balanceDue, 0);

      const overdueAmount = invoicesData
        .filter(inv => inv.status === 'OVERDUE')
        .reduce((sum, inv) => sum + inv.balanceDue, 0);

      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(now.getDate() + 30);

      const dueIn30Days = invoicesData
        .filter(inv => {
          const dueDate = new Date(inv.dueDate);
          return (
            inv.status !== 'PAID' &&
            inv.status !== 'CANCELLED' &&
            dueDate > now &&
            dueDate <= in30Days
          );
        })
        .reduce((sum, inv) => sum + inv.balanceDue, 0);

      const lastMonth = new Date();
      lastMonth.setMonth(now.getMonth() - 1);

      const paidLastMonth = invoicesData
        .filter(inv => {
          const updatedAt = new Date(inv.updatedAt);
          return inv.status === 'PAID' && updatedAt >= lastMonth && updatedAt <= now;
        })
        .reduce((sum, inv) => sum + (inv.totalAmount - inv.balanceDue), 0);

      setStats({
        totalReceivable,
        overdueAmount,
        dueIn30Days,
        paidLastMonth,
      });
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      message.error(error.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoiceData: InvoiceSummary) => {
    navigate(`/invoices/${invoiceData.invoiceId}`);
  };

  const handleCreatePayment = (invoiceData: InvoiceSummary) => {
    setSelectedInvoice(invoiceData);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    fetchData();
  };

  const handleSendReminder = (_invoiceData: InvoiceSummary) => {
    // This would be implemented when the email functionality is available
    message.info('Email reminder functionality will be implemented in a future update.');
  };

  const columns = [
    {
      title: 'Invoice',
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
      title: 'Amount',
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
      title: 'Balance',
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
      width: 100,
      render: (_: any, record: InvoiceSummary) => {
        const menuItems = [
          {
            key: 'view',
            label: 'View Invoice',
            onClick: () => handleViewInvoice(record),
          },
          {
            key: 'payment',
            label: 'Record Payment',
            onClick: () => handleCreatePayment(record),
            disabled: record.status === 'PAID' || record.status === 'CANCELLED',
          },
          {
            key: 'reminder',
            label: 'Send Reminder',
            onClick: () => handleSendReminder(record),
            disabled:
              record.status === 'PAID' ||
              record.status === 'CANCELLED' ||
              record.status === 'DRAFT',
          },
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
        <div className='no-company-message'>
          Please select a company to manage accounts receivable.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='accounts-receivable-page'>
        <div className='page-container'>
          <div className='page-header-section'>
            <PageBreadcrumb
              items={[
                {
                  title: 'Finance Overview',
                  path: '/finance',
                  icon: <HomeOutlined />,
                },
                {
                  title: 'Receivables',
                },
              ]}
            />
            <Heading level={2} className='page-title'>
              Accounts Receivable
            </Heading>
          </div>

          {/* Statistics Cards */}
          <Row gutter={[16, 16]} className='stats-row'>
            <Col xs={24} sm={12} lg={6}>
              <Card className='stat-card'>
                <Statistic
                  title='Total Receivable'
                  value={stats.totalReceivable}
                  precision={2}
                  valueStyle={{ color: '#7b5fc9' }}
                  prefix={<DollarOutlined />}
                  suffix='USD'
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className='stat-card'>
                <Statistic
                  title='Overdue Amount'
                  value={stats.overdueAmount}
                  precision={2}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ClockCircleOutlined />}
                  suffix='USD'
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className='stat-card'>
                <Statistic
                  title='Due in 30 Days'
                  value={stats.dueIn30Days}
                  precision={2}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ClockCircleOutlined />}
                  suffix='USD'
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className='stat-card'>
                <Statistic
                  title='Paid Last Month'
                  value={stats.paidLastMonth}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<DollarOutlined />}
                  suffix='USD'
                />
              </Card>
            </Col>
          </Row>

          <div className='table-container'>
            {loading ? (
              <div className='loading-container'>
                <Spin size='large' />
              </div>
            ) : invoices.length === 0 ? (
              <Empty description='No invoices found'>
                <GradientButton size='small' onClick={() => navigate('/invoices/create')}>
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
                className='receivables-table'
              />
            )}
          </div>
        </div>
      </div>

      {/* Payment Recording Modal */}
      {selectedInvoice && (
        <PaymentRecordingModal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedInvoice(null);
          }}
          onSuccess={handlePaymentSuccess}
          referenceType='INVOICE'
          referenceId={selectedInvoice.invoiceId}
          partyName={selectedInvoice.customerName}
          totalAmount={selectedInvoice.totalAmount}
          balanceDue={selectedInvoice.balanceDue}
          currency={selectedInvoice.currency}
        />
      )}
    </MainLayout>
  );
}
