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
  Table,
  Space,
  Spin,
  message,
  Tag,
  DatePicker,
} from 'antd';
import { SearchOutlined, FileTextOutlined, SaveOutlined, TrophyOutlined } from '@ant-design/icons';
import MainLayout from '../../../components/layout/MainLayout';
import { reportService } from '../../../services/reportService';
import '../shared/ReportStyles.scss';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface TopProductData {
  key: string;
  product: string;
  quantitySold: number;
  revenue: number;
  orders: number;
  avgPrice: number;
}

const TopSellingProductsReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    setHeaderActions(null);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateRange([firstDay, lastDay]);

    const loadInitialReport = async () => {
      setLoading(true);
      try {
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];
        const data = await reportService.getProductPerformanceReport(startDate, endDate, 'month');
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
      const data = await reportService.getProductPerformanceReport(startDate, endDate, 'month');
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
      title: 'Rank',
      key: 'rank',
      render: (_: any, __: any, index: number) => (
        <Tag color={index < 3 ? 'gold' : 'default'}>
          {index < 3 && <TrophyOutlined />} #{index + 1}
        </Tag>
      ),
      width: 80,
    },
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      sorter: (a: TopProductData, b: TopProductData) => {
        const aVal = a.product || '';
        const bVal = b.product || '';
        return aVal.localeCompare(bVal);
      },
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: TopProductData) =>
        (record.product || '').toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Quantity Sold',
      dataIndex: 'quantitySold',
      key: 'quantitySold',
      sorter: (a: TopProductData, b: TopProductData) =>
        (a.quantitySold || 0) - (b.quantitySold || 0),
    },
    {
      title: 'Revenue (₹)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (revenue || 0).toFixed(2),
      sorter: (a: TopProductData, b: TopProductData) => (a.revenue || 0) - (b.revenue || 0),
    },
    {
      title: 'Orders',
      dataIndex: 'orders',
      key: 'orders',
      sorter: (a: TopProductData, b: TopProductData) => (a.orders || 0) - (b.orders || 0),
    },
    {
      title: 'Avg Price (₹)',
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      render: (price: number) => (price || 0).toFixed(2),
      sorter: (a: TopProductData, b: TopProductData) => (a.avgPrice || 0) - (b.avgPrice || 0),
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.products) return [];

    return reportData.products
      .sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0))
      .map((item: any, index: number) => ({
        key: `product-${index}`,
        product: item.productName || item.product || item.name || 'Unknown',
        quantitySold: item.quantitySold || item.quantity || 0,
        revenue: item.revenue || item.totalRevenue || 0,
        orders: item.orderCount || item.orders || 0,
        avgPrice: item.averagePrice || item.avgPrice || 0,
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
              { title: 'Top Selling Products' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>
            <TrophyOutlined /> Top Selling Products
          </Title>
        </div>

        <div className='filters-section'>
          <div>
            <Space size='middle'>
              <RangePicker
                value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                onChange={dates => {
                  if (dates) {
                    setDateRange([dates[0]?.toDate() as Date, dates[1]?.toDate() as Date]);
                  } else {
                    setDateRange(null);
                  }
                }}
              />
              <Input
                placeholder='Search products'
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
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Top Product</div>
                  <div className='summary-value' style={{ fontSize: '16px' }}>
                    {getTableData()[0]?.product || 'N/A'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Top Revenue</div>
                  <div className='summary-value'>
                    ₹{getTableData()[0]?.revenue?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Products</div>
                  <div className='summary-value'>{getTableData().length}</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Revenue</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalRevenue?.toFixed(2) || '0.00'}
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
            ) : reportData ? (
              <Table columns={columns} dataSource={getTableData()} pagination={{ pageSize: 10 }} />
            ) : (
              <div className='empty-report'>
                <p>Select a date range and click "Generate Report" to view Top Selling Products.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TopSellingProductsReportPage;
