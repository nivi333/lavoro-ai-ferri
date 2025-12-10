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

interface SalesSummaryData {
  key: string;
  product: string;
  customer: string;
  quantity: number;
  revenue: number;
  date: string;
}

const SalesSummaryReportPage: React.FC = () => {
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
        const data = await reportService.getSalesSummary(startDate, endDate);
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

      const data = await reportService.getSalesSummary(startDate, endDate);
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
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      sorter: (a: SalesSummaryData, b: SalesSummaryData) => a.product.localeCompare(b.product),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: SalesSummaryData) =>
        record.product.toLowerCase().includes(String(value).toLowerCase()) ||
        record.customer.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a: SalesSummaryData, b: SalesSummaryData) => a.quantity - b.quantity,
    },
    {
      title: 'Revenue (₹)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => revenue.toFixed(2),
      sorter: (a: SalesSummaryData, b: SalesSummaryData) => a.revenue - b.revenue,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: SalesSummaryData, b: SalesSummaryData) => a.date.localeCompare(b.date),
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.sales) return [];

    return reportData.sales.map((item: any, index: number) => ({
      key: `sale-${index}`,
      product: item.productName || item.product,
      customer: item.customerName || item.customer || 'N/A',
      quantity: item.quantity || 0,
      revenue: item.revenue || item.amount || 0,
      date: item.date || item.saleDate || new Date().toISOString().split('T')[0],
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
              { title: 'Sales Reports', href: '/reports/sales' },
              { title: 'Sales Summary' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Sales Summary</Title>
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
                placeholder='Search products/customers'
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 250 }}
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
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Sales</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalSales?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Orders</div>
                  <div className='summary-value'>{reportData.summary?.totalOrders || 0}</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Average Order Value</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.averageOrderValue?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Top Customer</div>
                  <div className='summary-value' style={{ fontSize: '16px' }}>
                    {reportData.summary?.topCustomer || 'N/A'}
                  </div>
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
            ) : (
              <Table columns={columns} dataSource={getTableData()} pagination={{ pageSize: 10 }} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SalesSummaryReportPage;
