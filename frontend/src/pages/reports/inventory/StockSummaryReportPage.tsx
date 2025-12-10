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
  Table,
  Space,
  Spin,
  message,
  Tag,
} from 'antd';
import { SearchOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons';
import MainLayout from '../../../components/layout/MainLayout';
import { reportService } from '../../../services/reportService';
import '../shared/ReportStyles.scss';

const { Title } = Typography;
const { Option } = Select;

interface StockSummaryData {
  key: string;
  product: string;
  location: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  status: string;
}

const StockSummaryReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationId, setLocationId] = useState<string>('all');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    setHeaderActions(null);
    // Auto-load report on mount
    setHeaderActions(null);
    handleGenerateReport();
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const locId = locationId === 'all' ? undefined : locationId;
      const data = await reportService.getInventorySummary(locId);
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
      sorter: (a: StockSummaryData, b: StockSummaryData) => a.product.localeCompare(b.product),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: StockSummaryData) =>
        record.product.toLowerCase().includes(String(value).toLowerCase()) ||
        record.location.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Stock Qty',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      sorter: (a: StockSummaryData, b: StockSummaryData) => a.stockQuantity - b.stockQuantity,
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      sorter: (a: StockSummaryData, b: StockSummaryData) => a.reservedQuantity - b.reservedQuantity,
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      sorter: (a: StockSummaryData, b: StockSummaryData) =>
        a.availableQuantity - b.availableQuantity,
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color =
          status === 'Low Stock' ? 'warning' : status === 'Out of Stock' ? 'error' : 'success';
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.items) return [];

    return reportData.items.map((item: any, index: number) => ({
      key: `item-${index}`,
      product: item.productName || item.product,
      location: item.locationName || item.location || 'All Locations',
      stockQuantity: item.stockQuantity || item.quantity || 0,
      reservedQuantity: item.reservedQuantity || item.reserved || 0,
      availableQuantity: item.availableQuantity || item.available || 0,
      reorderLevel: item.reorderLevel || 0,
      status: item.status || 'Adequate',
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
              { title: 'Inventory Reports', href: '/reports/inventory' },
              { title: 'Stock Summary' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Stock Summary</Title>
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

        <div className='report-summary-section'>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card className='summary-card'>
                <div className='summary-title'>Total Products</div>
                <div className='summary-value'>{reportData.summary?.totalProducts || 0}</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className='summary-card'>
                <div className='summary-title'>Total Stock Value</div>
                <div className='summary-value'>
                  ₹{reportData.summary?.totalStockValue?.toFixed(2) || '0.00'}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className='summary-card'>
                <div className='summary-title'>Low Stock Items</div>
                <div className='summary-value' style={{ color: '#faad14' }}>
                  {reportData.summary?.lowStockItems || 0}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className='summary-card'>
                <div className='summary-title'>Out of Stock</div>
                <div className='summary-value' style={{ color: '#ff4d4f' }}>
                  {reportData.summary?.outOfStockItems || 0}
                </div>
              </Card>
            </Col>
          </Row>
        </div>

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

export default StockSummaryReportPage;
