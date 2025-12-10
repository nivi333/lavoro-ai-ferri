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

interface SalesByRegionData {
  key: string;
  locationCode: string;
  locationName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProduct: string;
}

const SalesByRegionReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationId, setLocationId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
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
      const data = await reportService.getSalesByRegionReport(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      );

      const items = data.salesByRegion.map((item: any) => ({
        key: item.region,
        locationCode: item.region.substring(0, 3).toUpperCase(), // Placeholder
        locationName: item.region,
        totalOrders: item.orderCount,
        totalRevenue: item.revenue,
        averageOrderValue: item.orderCount > 0 ? item.revenue / item.orderCount : 0,
        topProduct: 'N/A', // Not available in current API
      }));

      const totalOrders = items.reduce((sum: number, item: any) => sum + item.totalOrders, 0);

      setReportData({
        summary: {
          totalLocations: data.summary.regionCount,
          totalRevenue: data.summary.totalSales,
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
      title: 'Location Code',
      dataIndex: 'locationCode',
      key: 'locationCode',
    },
    {
      title: 'Location Name',
      dataIndex: 'locationName',
      key: 'locationName',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: SalesByRegionData) =>
        record.locationName.toLowerCase().includes(String(value).toLowerCase()) ||
        record.locationCode.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: (a: SalesByRegionData, b: SalesByRegionData) => a.totalOrders - b.totalOrders,
    },
    {
      title: 'Total Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      sorter: (a: SalesByRegionData, b: SalesByRegionData) => a.totalRevenue - b.totalRevenue,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Avg Order Value',
      dataIndex: 'averageOrderValue',
      key: 'averageOrderValue',
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Top Product',
      dataIndex: 'topProduct',
      key: 'topProduct',
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
              { title: 'Sales by Region/Location' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Sales by Region/Location</Title>
        </div>

        <div className='filters-section'>
          <div>
            <Space size='middle'>
              <Select
                value={locationId}
                onChange={setLocationId}
                style={{ width: 200 }}
                placeholder='Select Location'
              >
                <Option value='all'>All Locations</Option>
              </Select>
              <RangePicker
                value={dateRange}
                onChange={(dates: any) => setDateRange(dates)}
                format='YYYY-MM-DD'
              />
              <Input
                placeholder='Search locations'
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
                  <div className='summary-title'>Total Locations</div>
                  <div className='summary-value'>{reportData.summary?.totalLocations || 0}</div>
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

export default SalesByRegionReportPage;
