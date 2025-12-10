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
  Select,
  DatePicker,
  Table,
  Space,
  Spin,
  message,
} from 'antd';
import { SearchOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons';
import MainLayout from '../../../components/layout/MainLayout';
import '../shared/ReportStyles.scss';
import dayjs from 'dayjs';
import { reportService } from '../../../services/reportService';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface CustomerPurchaseData {
  key: string;
  customerCode: string;
  customerName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
}

const CustomerPurchaseHistoryReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(90, 'days'),
    dayjs(),
  ]);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    setHeaderActions(null);
    handleGenerateReport();
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      const data = await reportService.getCustomerPurchaseHistoryReport(
        customerId,
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      );

      const items = data.customerInsights.map((item: any) => ({
        key: item.customerId,
        customerCode: item.customerId.substring(0, 8).toUpperCase(), // Placeholder
        customerName: item.customerName,
        totalOrders: item.orderCount,
        totalRevenue: item.totalSpent,
        averageOrderValue: item.averageOrderValue,
        lastPurchaseDate: new Date(item.lastPurchaseDate).toLocaleDateString(),
      }));

      const totalOrders = items.reduce((sum: number, item: any) => sum + item.totalOrders, 0);

      setReportData({
        summary: {
          totalCustomers: data.summary.totalCustomers,
          totalRevenue: data.summary.totalRevenue,
          totalOrders: totalOrders,
        },
        items,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Customer Code',
      dataIndex: 'customerCode',
      key: 'customerCode',
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: CustomerPurchaseData) =>
        record.customerName.toLowerCase().includes(String(value).toLowerCase()) ||
        record.customerCode.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: (a: CustomerPurchaseData, b: CustomerPurchaseData) => a.totalOrders - b.totalOrders,
    },
    {
      title: 'Total Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      sorter: (a: CustomerPurchaseData, b: CustomerPurchaseData) => a.totalRevenue - b.totalRevenue,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Avg Order Value',
      dataIndex: 'averageOrderValue',
      key: 'averageOrderValue',
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Last Purchase',
      dataIndex: 'lastPurchaseDate',
      key: 'lastPurchaseDate',
    },
  ] as any;

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Breadcrumb
            items={[
              { title: 'Home', href: '/' },
              { title: 'Reports', href: '/reports' },
              { title: 'Sales Reports', href: '/reports/sales' },
              { title: 'Customer Purchase History' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Customer Purchase History</Title>
        </div>

        <div className='filters-section'>
          <div>
            <Space size='middle'>
              <Select
                value={customerId}
                onChange={setCustomerId}
                style={{ width: 200 }}
                placeholder='Select Customer'
              >
                <Option value='all'>All Customers</Option>
              </Select>
              <RangePicker
                value={dateRange}
                onChange={(dates: any) => setDateRange(dates)}
                format='YYYY-MM-DD'
              />
              <Input
                placeholder='Search customers'
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
              <Col xs={24} sm={12} md={8}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Customers</div>
                  <div className='summary-value'>{reportData.summary?.totalCustomers || 0}</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Revenue</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalRevenue?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Orders</div>
                  <div className='summary-value'>{reportData.summary?.totalOrders || 0}</div>
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
              <Table
                columns={columns}
                dataSource={reportData?.items || []}
                pagination={{ pageSize: 10 }}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CustomerPurchaseHistoryReportPage;
