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
} from 'antd';
import { SearchOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons';
import MainLayout from '../../../components/layout/MainLayout';
import { reportService } from '../../../services/reportService';
import '../shared/ReportStyles.scss';

const { Title } = Typography;
const { Option } = Select;

interface ValuationData {
  key: string;
  product: string;
  location: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  costValue: number;
  retailValue: number;
  potentialProfit: number;
}

const InventoryValuationReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationId, setLocationId] = useState<string>('all');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    setHeaderActions(null);
    handleGenerateReport();
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const locId = locationId === 'all' ? undefined : locationId;
      const data = await reportService.getStockValuation(locId);
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
      sorter: (a: ValuationData, b: ValuationData) => a.product.localeCompare(b.product),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: ValuationData) =>
        record.product.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a: ValuationData, b: ValuationData) => a.quantity - b.quantity,
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Cost Value',
      dataIndex: 'costValue',
      key: 'costValue',
      sorter: (a: ValuationData, b: ValuationData) => a.costValue - b.costValue,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Retail Value',
      dataIndex: 'retailValue',
      key: 'retailValue',
      sorter: (a: ValuationData, b: ValuationData) => a.retailValue - b.retailValue,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Potential Profit',
      dataIndex: 'potentialProfit',
      key: 'potentialProfit',
      sorter: (a: ValuationData, b: ValuationData) => a.potentialProfit - b.potentialProfit,
      render: (value: number) => (
        <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>₹{value.toFixed(2)}</span>
      ),
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.allItems) return [];

    return reportData.allItems.map((item: any, index: number) => ({
      key: `item-${index}`,
      product: item.productName || item.product,
      location: item.locationName || item.location || 'All Locations',
      quantity: item.quantity || 0,
      costPrice: item.costPrice || 0,
      sellingPrice: item.sellingPrice || 0,
      costValue: item.costValue || 0,
      retailValue: item.retailValue || 0,
      potentialProfit: item.potentialProfit || 0,
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
              { title: 'Inventory Valuation' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Inventory Valuation</Title>
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

        {reportData && (
          <div className='report-summary-section'>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Items</div>
                  <div className='summary-value'>{reportData.summary?.totalItems || 0}</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Cost Value</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalCostValue?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Retail Value</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalRetailValue?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Potential Profit</div>
                  <div className='summary-value' style={{ color: '#52c41a' }}>
                    ₹{reportData.summary?.totalPotentialProfit?.toFixed(2) || '0.00'}
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

export default InventoryValuationReportPage;
