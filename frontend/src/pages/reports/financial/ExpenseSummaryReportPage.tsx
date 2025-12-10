import React, { useState, useEffect } from 'react';
import { useHeader } from '../../../contexts/HeaderContext';
import {
  Typography,
  Card,
  Row,
  Col,
  Breadcrumb,
  Input,
  Button,
  DatePicker,
  Table,
  Space,
  Spin,
  message,
} from 'antd';
import { SearchOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons';
import MainLayout from '../../../components/layout/MainLayout';
import { reportService } from '../../../services/reportService';
import '../shared/ReportStyles.scss';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface ExpenseData {
  key: string;
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

const ExpenseSummaryReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    setHeaderActions(null);
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateRange([firstDay, lastDay]);

    // Auto-load report with current month
    const loadInitialReport = async () => {
      setLoading(true);
      try {
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];
        const data = await reportService.getExpenseSummary(startDate, endDate);
        setReportData(data);
      } catch (error) {
        console.error('Error generating report:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialReport();
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleGenerateReport = async () => {
    if (!dateRange) {
      message.error('Please select a date range');
      return;
    }

    setLoading(true);
    try {
      const startDate = dateRange[0].toISOString().split('T')[0];
      const endDate = dateRange[1].toISOString().split('T')[0];

      const data = await reportService.getExpenseSummary(startDate, endDate);
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: ExpenseData, b: ExpenseData) => a.category.localeCompare(b.category),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: ExpenseData) =>
        record.category.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: ExpenseData, b: ExpenseData) => a.amount - b.amount,
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => `${percentage.toFixed(2)}%`,
      sorter: (a: ExpenseData, b: ExpenseData) => a.percentage - b.percentage,
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: ExpenseData, b: ExpenseData) => a.count - b.count,
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.expensesByCategory) return [];

    return reportData.expensesByCategory.map((item: any, index: number) => ({
      key: `category-${index}`,
      category: item.category || item.name,
      amount: item.amount || item.total || 0,
      percentage: item.percentage || 0,
      count: item.count || item.transactionCount || 0,
    }));
  };

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Breadcrumb
            items={[
              { title: 'Home', href: '/' },
              { title: 'Reports', href: '/reports' },
              { title: 'Financial Reports', href: '/reports/financial' },
              { title: 'Expense Summary' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Expense Summary</Title>
        </div>

        <div className='filters-section'>
          <div>
            <Space size='middle'>
              <RangePicker
                onChange={dates => {
                  if (dates) {
                    setDateRange([dates[0]?.toDate() as Date, dates[1]?.toDate() as Date]);
                  } else {
                    setDateRange(null);
                  }
                }}
              />
              <Input
                placeholder='Search categories'
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
            </Space>
          </div>
          <div>
            <Space size='middle'>
              <Button icon={<SaveOutlined />}>Save Configuration</Button>
              <Button icon={<FileTextOutlined />}>PDF</Button>
              <Button type='primary' onClick={handleGenerateReport} loading={loading}>
                Generate Report
              </Button>
            </Space>
          </div>
        </div>

        {reportData && (
          <div className='report-summary-section'>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Expenses</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalExpenses?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Top Category</div>
                  <div className='summary-value' style={{ fontSize: '16px' }}>
                    {reportData.summary?.topCategory || 'N/A'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Average Daily Expense</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.averageDailyExpense?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Transactions</div>
                  <div className='summary-value'>{reportData.summary?.totalTransactions || 0}</div>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        <div className='report-content-section'>
          <div className='report-data'>
            {loading ? (
              <div className='loading-container'>
                <Spin size='large' />
                <p>Generating report...</p>
              </div>
            ) : reportData ? (
              <Table columns={columns} dataSource={getTableData()} pagination={{ pageSize: 10 }} />
            ) : (
              <div className='empty-report'>
                <p>Select a date range and click "Generate Report" to view the Expense Summary.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExpenseSummaryReportPage;
