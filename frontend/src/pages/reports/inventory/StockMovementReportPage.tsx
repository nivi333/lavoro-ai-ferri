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
  Tag,
} from 'antd';
import { SearchOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons';
import MainLayout from '../../../components/layout/MainLayout';
import { reportService } from '../../../services/reportService';
import '../shared/ReportStyles.scss';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface StockMovementData {
  key: string;
  product: string;
  location: string;
  movementType: string;
  quantity: number;
  date: string;
  reference: string;
}

const StockMovementReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [locationId, setLocationId] = useState<string>('all');
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
        const data = await reportService.getInventoryMovementReport(startDate, endDate, undefined);
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
      const locId = locationId === 'all' ? undefined : locationId;

      const data = await reportService.getInventoryMovementReport(startDate, endDate, locId);
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: StockMovementData, b: StockMovementData) => a.date.localeCompare(b.date),
    },
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      sorter: (a: StockMovementData, b: StockMovementData) => a.product.localeCompare(b.product),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: StockMovementData) =>
        record.product.toLowerCase().includes(String(value).toLowerCase()) ||
        record.location.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Movement Type',
      dataIndex: 'movementType',
      key: 'movementType',
      render: (type: string) => {
        const color = type === 'Inbound' ? 'green' : type === 'Outbound' ? 'red' : 'blue';
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a: StockMovementData, b: StockMovementData) => a.quantity - b.quantity,
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.movements) return [];

    return reportData.movements.map((item: any, index: number) => ({
      key: `movement-${index}`,
      product: item.productName || item.product,
      location: item.locationName || item.location || 'N/A',
      movementType: item.movementType || item.type || 'Transfer',
      quantity: item.quantity || 0,
      date: item.date || item.movementDate || new Date().toISOString().split('T')[0],
      reference: item.reference || item.referenceNumber || 'N/A',
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
              { title: 'Stock Movement' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Stock Movement Report</Title>
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
                  <div className='summary-title'>Total Movements</div>
                  <div className='summary-value'>{reportData.summary?.totalMovements || 0}</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Inbound</div>
                  <div className='summary-value' style={{ color: '#52c41a' }}>
                    {reportData.summary?.inbound || 0}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Outbound</div>
                  <div className='summary-value' style={{ color: '#ff4d4f' }}>
                    {reportData.summary?.outbound || 0}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Net Change</div>
                  <div className='summary-value'>{reportData.summary?.netChange || 0}</div>
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

export default StockMovementReportPage;
