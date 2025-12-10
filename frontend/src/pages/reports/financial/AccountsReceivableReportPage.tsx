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
import dayjs from 'dayjs';

const { Title } = Typography;

interface ARAgingData {
  key: string;
  customer: string;
  current: number;
  days30: number;
  days60: number;
  days90Plus: number;
  total: number;
}

const AccountsReceivableReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    setHeaderActions(null);
    // Auto-load report with current date
    handleGenerateReport();
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const dateStr = asOfDate.toISOString().split('T')[0];
      const data = await reportService.getARAgingReport(dateStr);
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
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      sorter: (a: ARAgingData, b: ARAgingData) => a.customer.localeCompare(b.customer),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: ARAgingData) =>
        record.customer.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Current (₹)',
      dataIndex: 'current',
      key: 'current',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: ARAgingData, b: ARAgingData) => a.current - b.current,
    },
    {
      title: '30 Days (₹)',
      dataIndex: 'days30',
      key: 'days30',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: ARAgingData, b: ARAgingData) => a.days30 - b.days30,
    },
    {
      title: '60 Days (₹)',
      dataIndex: 'days60',
      key: 'days60',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: ARAgingData, b: ARAgingData) => a.days60 - b.days60,
    },
    {
      title: '90+ Days (₹)',
      dataIndex: 'days90Plus',
      key: 'days90Plus',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#ff4d4f' : 'inherit' }}>{amount.toFixed(2)}</span>
      ),
      sorter: (a: ARAgingData, b: ARAgingData) => a.days90Plus - b.days90Plus,
    },
    {
      title: 'Total (₹)',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => <strong>{amount.toFixed(2)}</strong>,
      sorter: (a: ARAgingData, b: ARAgingData) => a.total - b.total,
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.customers) return [];

    return reportData.customers.map((item: any, index: number) => ({
      key: `customer-${index}`,
      customer: item.customerName || item.name,
      current: item.current || 0,
      days30: item.days30 || item.thirtyDays || 0,
      days60: item.days60 || item.sixtyDays || 0,
      days90Plus: item.days90Plus || item.ninetyPlusDays || 0,
      total: item.total || 0,
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
              { title: 'Financial Reports', href: '/reports/financial' },
              { title: 'Accounts Receivable Aging' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Accounts Receivable Aging</Title>
        </div>

        <div className='filters-section'>
          <div>
            <Space size='middle'>
              <DatePicker
                value={dayjs(asOfDate)}
                onChange={date => {
                  if (date) {
                    setAsOfDate(date.toDate());
                  }
                }}
                placeholder='As of Date'
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
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Receivables</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalReceivables?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card className='summary-card'>
                  <div className='summary-title'>Current</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.current?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card className='summary-card'>
                  <div className='summary-title'>30 Days</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.days30?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card className='summary-card'>
                  <div className='summary-title'>60 Days</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.days60?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <Card className='summary-card'>
                  <div className='summary-title'>90+ Days</div>
                  <div className='summary-value' style={{ color: '#ff4d4f' }}>
                    ₹{reportData.summary?.days90Plus?.toFixed(2) || '0.00'}
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
                <p>Select a date and click "Generate Report" to view Accounts Receivable Aging.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AccountsReceivableReportPage;
