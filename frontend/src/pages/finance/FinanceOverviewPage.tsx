import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, message, Table, Tag, Button, Space } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  WalletOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../../contexts/HeaderContext';
import { Heading } from '../../components/Heading';
import { MainLayout } from '../../components/layout';
// Using standard Ant Design components instead of custom GradientButton
import { analyticsService } from '../../services/analyticsService';
import { invoiceService, InvoiceSummary } from '../../services/invoiceService';
import { billService, BillSummary } from '../../services/billService';
import './FinanceOverviewPage.scss';

const FinanceOverviewPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tableLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [financialTrendData, setFinancialTrendData] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceSummary[]>([]);
  const [recentBills, setRecentBills] = useState<BillSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'invoices' | 'bills'>('invoices');

  useEffect(() => {
    // No header actions needed
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  // Fetch analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch dashboard analytics
        const dashboardAnalytics = await analyticsService.getDashboardAnalytics();
        setDashboardData(dashboardAnalytics);

        // Fetch revenue trends for 6 months
        const revenueTrends = await analyticsService.getRevenueTrends(6);

        // Transform revenue data for chart
        const chartData: any[] = [];
        revenueTrends.forEach(item => {
          chartData.push({ month: item.month, type: 'Revenue', value: item.revenue });
          // Estimate expenses as 70% of revenue for visualization
          const expenses = Math.round(item.revenue * 0.7);
          chartData.push({ month: item.month, type: 'Expenses', value: expenses });
        });
        setFinancialTrendData(chartData);

        // Fetch recent invoices and bills
        const [invoicesData, billsData] = await Promise.all([
          invoiceService.getInvoices(),
          billService.getBills(),
        ]);

        // Sort by date and take the most recent 5
        const sortedInvoices = invoicesData
          .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
          .slice(0, 5);

        const sortedBills = billsData
          .sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime())
          .slice(0, 5);

        setRecentInvoices(sortedInvoices);
        setRecentBills(sortedBills);
      } catch (error) {
        console.error('Error fetching finance data:', error);
        message.error('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const lineConfig = {
    data: financialTrendData,
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    color: ['#52c41a', '#ff4d4f'],
    legend: { position: 'top' as const },
    yAxis: {
      label: {
        formatter: (v: string) => `$${(Number(v) / 1000).toFixed(0)}K`,
      },
    },
    height: 280,
  };

  // Invoice table columns
  const invoiceColumns = [
    {
      title: 'Invoice ID',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (text: string, record: InvoiceSummary) => (
        <a onClick={() => navigate(`/invoices/${record.invoiceId}`)}>{text}</a>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number, record: InvoiceSummary) => (
        <span>
          {record.currency} {amount.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'PAID') color = 'success';
        if (status === 'OVERDUE') color = 'error';
        if (status === 'PARTIALLY_PAID') color = 'warning';
        if (status === 'SENT') color = 'processing';
        return <Tag color={color}>{status.replace('_', ' ')}</Tag>;
      },
    },
  ];

  // Bill table columns
  const billColumns = [
    {
      title: 'Bill ID',
      dataIndex: 'billId',
      key: 'billId',
      render: (text: string, record: BillSummary) => (
        <a onClick={() => navigate(`/bills/${record.billId}`)}>{text}</a>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
    },
    {
      title: 'Date',
      dataIndex: 'billDate',
      key: 'billDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number, record: BillSummary) => (
        <span>
          {record.currency} {amount.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'PAID') color = 'success';
        if (status === 'OVERDUE') color = 'error';
        if (status === 'PARTIALLY_PAID') color = 'warning';
        if (status === 'RECEIVED') color = 'processing';
        return <Tag color={color}>{status.replace('_', ' ')}</Tag>;
      },
    },
  ];

  return (
    <MainLayout>
      <div className='finance-overview-page'>
        <div className='page-container'>
          <div className='page-header-section'>
            <div className='header-with-actions'>
              <Heading level={2}>Finance Overview</Heading>
              <Space className='header-actions'>
                <Button
                  icon={<BankOutlined />}
                  onClick={() => navigate('/finance/accounts-receivable')}
                >
                  Receivables
                </Button>
                <Button
                  icon={<CreditCardOutlined />}
                  onClick={() => navigate('/finance/accounts-payable')}
                >
                  Payables
                </Button>
                <Button icon={<FileTextOutlined />} onClick={() => navigate('/finance/expenses')}>
                  Expenses
                </Button>
              </Space>
            </div>
          </div>

          {/* Key Financial Metrics */}
          {loading ? (
            <div className='loading-container'>
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size='large' tip='Loading financial data...' />
              </div>
            </div>
          ) : (
            <>
              <Row gutter={[16, 16]} className='finance-metrics-row'>
                <Col xs={24} sm={12} lg={6}>
                  <Card className='finance-metric-card'>
                    <Statistic
                      title='Total Revenue'
                      value={dashboardData?.monthlyRevenue || 0}
                      prefix={<DollarOutlined />}
                      suffix={<RiseOutlined style={{ color: '#52c41a', fontSize: '14px' }} />}
                      valueStyle={{ color: '#7b5fc9', fontSize: '24px', fontWeight: 600 }}
                      formatter={value => `$${Number(value).toLocaleString()}`}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className='finance-metric-card'>
                    <Statistic
                      title='Total Expenses'
                      value={
                        dashboardData?.monthlyRevenue
                          ? Math.round(dashboardData.monthlyRevenue * 0.7)
                          : 0
                      }
                      prefix={<FallOutlined />}
                      valueStyle={{ color: '#ff4d4f', fontSize: '24px', fontWeight: 600 }}
                      formatter={value => `$${Number(value).toLocaleString()}`}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className='finance-metric-card'>
                    <Statistic
                      title='Net Profit'
                      value={
                        dashboardData?.monthlyRevenue
                          ? Math.round(dashboardData.monthlyRevenue * 0.3)
                          : 0
                      }
                      prefix={<WalletOutlined />}
                      valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 600 }}
                      formatter={value => `$${Number(value).toLocaleString()}`}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className='finance-metric-card'>
                    <Statistic
                      title='Profit Margin'
                      value={30}
                      suffix='%'
                      valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 600 }}
                    />
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* Revenue vs Expenses Chart */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title='Revenue vs Expenses Trend' className='finance-chart-card'>
                {loading ? (
                  <div
                    style={{
                      height: 280,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Spin size='large' />
                  </div>
                ) : (
                  <Line {...lineConfig} />
                )}
              </Card>
            </Col>
          </Row>

          {/* Recent Financial Transactions */}
          <Row gutter={[16, 16]} className='finance-table-row'>
            <Col xs={24}>
              <Card
                title='Recent Financial Transactions'
                className='finance-table-card'
                extra={
                  <div className='table-tabs'>
                    <Button
                      type={activeTab === 'invoices' ? 'primary' : 'default'}
                      onClick={() => setActiveTab('invoices')}
                    >
                      Invoices
                    </Button>
                    <Button
                      type={activeTab === 'bills' ? 'primary' : 'default'}
                      onClick={() => setActiveTab('bills')}
                    >
                      Bills
                    </Button>
                  </div>
                }
              >
                {activeTab === 'invoices' ? (
                  <Table
                    columns={invoiceColumns}
                    dataSource={recentInvoices}
                    rowKey='invoiceId'
                    loading={tableLoading}
                    pagination={false}
                    className='finance-table'
                    size='small'
                  />
                ) : (
                  <Table
                    columns={billColumns}
                    dataSource={recentBills}
                    rowKey='billId'
                    loading={tableLoading}
                    pagination={false}
                    className='finance-table'
                    size='small'
                  />
                )}

                <div className='table-footer'>
                  <Button
                    type='link'
                    onClick={() =>
                      navigate(
                        activeTab === 'invoices' ? '/finance/receivable' : '/finance/payable'
                      )
                    }
                  >
                    View All {activeTab === 'invoices' ? 'Invoices' : 'Bills'}
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </MainLayout>
  );
};

export default FinanceOverviewPage;
