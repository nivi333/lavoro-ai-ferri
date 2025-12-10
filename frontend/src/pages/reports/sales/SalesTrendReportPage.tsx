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
  Select,
  Table,
  Space,
  Spin,
  message,
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  SaveOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import MainLayout from '../../../components/layout/MainLayout';
import { reportService } from '../../../services/reportService';
import '../shared/ReportStyles.scss';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface SalesTrendData {
  key: string;
  period: string;
  sales: number;
  orders: number;
  avgOrderValue: number;
  growth: number;
}

const SalesTrendReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [groupBy, setGroupBy] = useState<string>('month');
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
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      sorter: (a: SalesTrendData, b: SalesTrendData) => {
        const aVal = a.period || '';
        const bVal = b.period || '';
        return aVal.localeCompare(bVal);
      },
    },
    {
      title: 'Sales (₹)',
      dataIndex: 'sales',
      key: 'sales',
      render: (sales: number) => (sales || 0).toFixed(2),
      sorter: (a: SalesTrendData, b: SalesTrendData) => (a.sales || 0) - (b.sales || 0),
    },
    {
      title: 'Orders',
      dataIndex: 'orders',
      key: 'orders',
      sorter: (a: SalesTrendData, b: SalesTrendData) => (a.orders || 0) - (b.orders || 0),
    },
    {
      title: 'Avg Order Value (₹)',
      dataIndex: 'avgOrderValue',
      key: 'avgOrderValue',
      render: (value: number) => (value || 0).toFixed(2),
      sorter: (a: SalesTrendData, b: SalesTrendData) =>
        (a.avgOrderValue || 0) - (b.avgOrderValue || 0),
    },
    {
      title: 'Growth (%)',
      dataIndex: 'growth',
      key: 'growth',
      render: (growth: number) => {
        const val = growth || 0;
        const color = val >= 0 ? '#52c41a' : '#ff4d4f';
        return <span style={{ color }}>{val.toFixed(2)}%</span>;
      },
      sorter: (a: SalesTrendData, b: SalesTrendData) => (a.growth || 0) - (b.growth || 0),
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.trends) return [];

    return reportData.trends.map((item: any, index: number) => ({
      key: `trend-${index}`,
      period: item.period || item.date || 'N/A',
      sales: item.totalSales || item.sales || 0,
      orders: item.totalOrders || item.orders || 0,
      avgOrderValue: item.averageOrderValue || item.avgOrderValue || 0,
      growth: item.growthRate || item.growth || 0,
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
              { title: 'Sales Trend Analysis' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>
            <LineChartOutlined /> Sales Trend Analysis
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
              <Select value={groupBy} onChange={setGroupBy} style={{ width: 150 }}>
                <Option value='day'>Daily</Option>
                <Option value='week'>Weekly</Option>
                <Option value='month'>Monthly</Option>
                <Option value='quarter'>Quarterly</Option>
              </Select>
              <Input
                placeholder='Search periods'
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
                  <div className='summary-title'>Average Growth</div>
                  <div
                    className='summary-value'
                    style={{
                      color: (reportData.summary?.avgGrowth || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                    }}
                  >
                    {reportData.summary?.avgGrowth?.toFixed(2) || '0.00'}%
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Peak Period</div>
                  <div className='summary-value' style={{ fontSize: '16px' }}>
                    {reportData.summary?.peakPeriod || 'N/A'}
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

export default SalesTrendReportPage;
