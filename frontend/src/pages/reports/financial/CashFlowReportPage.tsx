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

interface CashFlowData {
  key: string;
  activity: string;
  category: string;
  amount: number;
}

const CashFlowReportPage: React.FC = () => {
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
        const data = await reportService.getCashFlowStatement(startDate, endDate);
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

      const data = await reportService.getCashFlowStatement(startDate, endDate);
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
      title: 'Activity',
      dataIndex: 'activity',
      key: 'activity',
      sorter: (a: CashFlowData, b: CashFlowData) => {
        const aVal = a.activity || '';
        const bVal = b.activity || '';
        return aVal.localeCompare(bVal);
      },
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: CashFlowData) =>
        (record.activity || '').toLowerCase().includes(String(value).toLowerCase()) ||
        (record.category || '').toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: CashFlowData, b: CashFlowData) => {
        const aVal = a.category || '';
        const bVal = b.category || '';
        return aVal.localeCompare(bVal);
      },
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (amount || 0).toFixed(2),
      sorter: (a: CashFlowData, b: CashFlowData) => (a.amount || 0) - (b.amount || 0),
    },
  ] as any;

  const getTableData = () => {
    if (!reportData) return [];

    const operatingData =
      reportData.operatingActivities?.map((item: any, index: number) => ({
        key: `operating-${index}`,
        activity: item.name || item.activity,
        category: 'Operating Activities',
        amount: item.amount,
      })) || [];

    const investingData =
      reportData.investingActivities?.map((item: any, index: number) => ({
        key: `investing-${index}`,
        activity: item.name || item.activity,
        category: 'Investing Activities',
        amount: item.amount,
      })) || [];

    const financingData =
      reportData.financingActivities?.map((item: any, index: number) => ({
        key: `financing-${index}`,
        activity: item.name || item.activity,
        category: 'Financing Activities',
        amount: item.amount,
      })) || [];

    return [...operatingData, ...investingData, ...financingData];
  };

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Breadcrumb
            items={[
              { title: 'Home', href: '/' },
              { title: 'Reports', href: '/reports' },
              { title: 'Financial Reports', href: '/reports/financial' },
              { title: 'Cash Flow Statement' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Cash Flow Statement</Title>
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
                placeholder='Search activities'
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
                  <div className='summary-title'>Operating Cash Flow</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.operatingCashFlow?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Investing Cash Flow</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.investingCashFlow?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Financing Cash Flow</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.financingCashFlow?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Net Cash Flow</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.netCashFlow?.toFixed(2) || '0.00'}
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

export default CashFlowReportPage;
