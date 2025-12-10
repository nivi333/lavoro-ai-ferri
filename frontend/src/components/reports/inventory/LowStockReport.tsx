import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Button, Select, Table, Space, Spin, message, Tag } from 'antd';
import { SearchOutlined, FileTextOutlined, SaveOutlined, WarningOutlined } from '@ant-design/icons';
import { reportService } from '../../../services/reportService';
import '../../../pages/reports/shared/ReportStyles.scss';

const { Option } = Select;

interface LowStockData {
  key: string;
  product: string;
  currentStock: number;
  reorderLevel: number;
  location: string;
  status: string;
}

const LowStockReport: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationId, setLocationId] = useState<string>('all');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    // Auto-load report on mount
    handleGenerateReport();
  }, []);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const locId = locationId === 'all' ? undefined : locationId;
      const data = await reportService.getLowStockReport(locId);
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
      sorter: (a: LowStockData, b: LowStockData) => {
        const aVal = a.product || '';
        const bVal = b.product || '';
        return aVal.localeCompare(bVal);
      },
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: LowStockData) =>
        (record.product || '').toLowerCase().includes(String(value).toLowerCase()) ||
        (record.location || '').toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      sorter: (a: LowStockData, b: LowStockData) => (a.currentStock || 0) - (b.currentStock || 0),
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
      sorter: (a: LowStockData, b: LowStockData) => (a.reorderLevel || 0) - (b.reorderLevel || 0),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'Critical' ? 'red' : status === 'Low' ? 'orange' : 'yellow';
        return (
          <Tag color={color} icon={<WarningOutlined />}>
            {status}
          </Tag>
        );
      },
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.lowStockItems) return [];

    return reportData.lowStockItems.map((item: any, index: number) => {
      const currentStock = item.currentStock || 0;
      const reorderLevel = item.reorderLevel || 0;
      const shortfall = item.shortfall || 0;

      let status = 'Low';
      if (currentStock === 0) status = 'Out of Stock';
      else if (shortfall > reorderLevel * 0.5) status = 'Critical';

      return {
        key: `low-stock-${index}`,
        product: item.productName || item.product || item.name || 'Unknown',
        currentStock,
        reorderLevel,
        location: item.locationName || item.location || 'N/A',
        status,
      };
    });
  };

  return (
    <div className='report-container'>
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
                <div className='summary-title'>Total Low Stock Items</div>
                <div className='summary-value' style={{ color: '#ff4d4f' }}>
                  {reportData.summary?.totalLowStockItems || 0}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className='summary-card'>
                <div className='summary-title'>Total Shortfall</div>
                <div className='summary-value' style={{ color: '#ff4d4f' }}>
                  {reportData.summary?.totalShortfall || 0}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className='summary-card'>
                <div className='summary-title'>Estimated Reorder Cost</div>
                <div className='summary-value' style={{ color: '#faad14' }}>
                  ₹{reportData.summary?.estimatedReorderCost?.toFixed(2) || '0.00'}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className='summary-card'>
                <div className='summary-title'>Locations Affected</div>
                <div className='summary-value'>{reportData.lowStockByLocation?.length || 0}</div>
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
  );
};

export default LowStockReport;
