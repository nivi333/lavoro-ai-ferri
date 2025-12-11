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
import { billService, BillSummary, BillStatus } from '../../services/billService';
import PaymentRecordingModal from '../../components/finance/PaymentRecordingModal';
import './AccountsPayablePage.scss';

const STATUS_COLORS: Record<BillStatus, string> = {
  DRAFT: 'default',
  RECEIVED: 'processing',
  PARTIALLY_PAID: 'gold',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'volcano',
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

export default function AccountsPayablePage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const navigate = useNavigate();
  const [bills, setBills] = useState<BillSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPayable: 0,
    overdueAmount: 0,
    dueIn30Days: 0,
    paidLastMonth: 0,
  });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillSummary | null>(null);

  useEffect(() => {
    setHeaderActions(
      <GradientButton size='small' onClick={() => navigate('/bills/create')}>
        Create Bill
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
      const billsData = await billService.getBills();
      setBills(billsData);

      // Calculate statistics
      const totalPayable = billsData
        .filter(bill => bill.status !== 'PAID' && bill.status !== 'CANCELLED')
        .reduce((sum, bill) => sum + bill.balanceDue, 0);

      const overdueAmount = billsData
        .filter(bill => bill.status === 'OVERDUE')
        .reduce((sum, bill) => sum + bill.balanceDue, 0);

      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(now.getDate() + 30);

      const dueIn30Days = billsData
        .filter(bill => {
          const dueDate = new Date(bill.dueDate);
          return (
            bill.status !== 'PAID' &&
            bill.status !== 'CANCELLED' &&
            dueDate > now &&
            dueDate <= in30Days
          );
        })
        .reduce((sum, bill) => sum + bill.balanceDue, 0);

      const lastMonth = new Date();
      lastMonth.setMonth(now.getMonth() - 1);

      const paidLastMonth = billsData
        .filter(bill => {
          const updatedAt = new Date(bill.updatedAt);
          return bill.status === 'PAID' && updatedAt >= lastMonth && updatedAt <= now;
        })
        .reduce((sum, bill) => sum + (bill.totalAmount - bill.balanceDue), 0);

      setStats({
        totalPayable,
        overdueAmount,
        dueIn30Days,
        paidLastMonth,
      });
    } catch (error: any) {
      console.error('Error fetching bills:', error);
      message.error(error.message || 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = (billData: BillSummary) => {
    navigate(`/bills/${billData.billId}`);
  };

  const handleCreatePayment = (billData: BillSummary) => {
    setSelectedBill(billData);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    fetchData();
  };

  const columns = [
    {
      title: 'Bill',
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
      title: 'Amount',
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
      title: 'Balance',
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
      render: (_: any, record: BillSummary) => {
        const menuItems = [
          {
            key: 'view',
            label: 'View Bill',
            onClick: () => handleViewBill(record),
          },
          {
            key: 'payment',
            label: 'Record Payment',
            onClick: () => handleCreatePayment(record),
            disabled: record.status === 'PAID' || record.status === 'CANCELLED',
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
          Please select a company to manage accounts payable.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='accounts-payable-page'>
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
                  title: 'Payables',
                },
              ]}
            />
            <Heading level={2} className='page-title'>
              Accounts Payable
            </Heading>
          </div>

          {/* Statistics Cards */}
          <Row gutter={[16, 16]} className='stats-row'>
            <Col xs={24} sm={12} lg={6}>
              <Card className='stat-card'>
                <Statistic
                  title='Total Payable'
                  value={stats.totalPayable}
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
            ) : bills.length === 0 ? (
              <Empty description='No bills found'>
                <GradientButton size='small' onClick={() => navigate('/bills/create')}>
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
                className='payables-table'
              />
            )}
          </div>
        </div>
      </div>

      {/* Payment Recording Modal */}
      {selectedBill && (
        <PaymentRecordingModal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedBill(null);
          }}
          onSuccess={handlePaymentSuccess}
          referenceType='BILL'
          referenceId={selectedBill.billId}
          partyName={selectedBill.supplierName}
          totalAmount={selectedBill.totalAmount}
          balanceDue={selectedBill.balanceDue}
          currency={selectedBill.currency}
        />
      )}
    </MainLayout>
  );
}
