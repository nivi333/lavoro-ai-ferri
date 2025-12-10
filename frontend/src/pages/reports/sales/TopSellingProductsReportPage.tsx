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
import '../shared/ReportStyles.scss';
import dayjs from 'dayjs';
import { reportService } from '../../../services/reportService';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface TopProductData {
  key: string;
  rank: number;
  productCode: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  averagePrice: number;
}

const TopSellingProductsReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
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
      const data = await reportService.getTopSellingProductsReport(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD'),
        50 // Limit to top 50
      );

      const items = data.productPerformance.map((item: any, index: number) => ({
        key: item.productId,
        rank: index + 1,
        productCode: item.productId.substring(0, 8).toUpperCase(), // Placeholder
        productName: item.productName,
        quantitySold: item.salesQuantity,
        revenue: item.revenue,
        averagePrice: item.salesQuantity > 0 ? item.revenue / item.salesQuantity : 0,
      }));

      // Sort by Revenue descending for "Top Selling"
      items.sort((a: any, b: any) => b.revenue - a.revenue);

      // Update ranks after sort
      items.forEach((item: any, index: number) => {
        item.rank = index + 1;
      });

      const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantitySold, 0);

      setReportData({
        summary: {
          totalProducts: data.summary.productCount,
          totalRevenue: data.summary.totalRevenue,
          totalQuantity: totalQuantity,
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
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
    },
    {
      title: 'Product Code',
      dataIndex: 'productCode',
      key: 'productCode',
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: TopProductData) =>
        record.productName.toLowerCase().includes(String(value).toLowerCase()) ||
        record.productCode.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Quantity Sold',
      dataIndex: 'quantitySold',
      key: 'quantitySold',
      sorter: (a: TopProductData, b: TopProductData) => a.quantitySold - b.quantitySold,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a: TopProductData, b: TopProductData) => a.revenue - b.revenue,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Avg Price',
      dataIndex: 'averagePrice',
      key: 'averagePrice',
      render: (value: number) => `₹${value.toFixed(2)}`,
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
              { title: 'Top Selling Products' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Top Selling Products</Title>
        </div>

        <div className='filters-section'>
          <div>
            <Space size='middle'>
              <RangePicker
                value={dateRange}
                onChange={(dates: any) => setDateRange(dates)}
                format='YYYY-MM-DD'
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
              <Col xs={24} sm={12} md={8}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Products</div>
                  <div className='summary-value'>{reportData.summary?.totalProducts || 0}</div>
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
                  <div className='summary-title'>Total Quantity Sold</div>
                  <div className='summary-value'>{reportData.summary?.totalQuantity || 0}</div>
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

export default TopSellingProductsReportPage;
