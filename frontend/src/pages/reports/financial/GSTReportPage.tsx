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

interface GSTData {
  key: string;
  transaction: string;
  gstType: string;
  amount: number;
  gstAmount: number;
}

const GSTReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<string>('current-month');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    setHeaderActions(null);
    // Auto-load report with current month
    handleGenerateReport();
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getGSTReport(period);
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
      title: 'Transaction',
      dataIndex: 'transaction',
      key: 'transaction',
      sorter: (a: GSTData, b: GSTData) => a.transaction.localeCompare(b.transaction),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: GSTData) =>
        record.transaction.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'GST Type',
      dataIndex: 'gstType',
      key: 'gstType',
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: GSTData, b: GSTData) => a.amount - b.amount,
    },
    {
      title: 'GST Amount (₹)',
      dataIndex: 'gstAmount',
      key: 'gstAmount',
      render: (gstAmount: number) => gstAmount.toFixed(2),
      sorter: (a: GSTData, b: GSTData) => a.gstAmount - b.gstAmount,
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.transactions) return [];

    return reportData.transactions.map((item: any, index: number) => ({
      key: `transaction-${index}`,
      transaction: item.description || item.name,
      gstType: item.gstType || 'CGST+SGST',
      amount: item.amount || 0,
      gstAmount: item.gstAmount || 0,
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
              { title: 'GST Reports' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>GST Reports</Title>
        </div>

        <div className='filters-section'>
          <div>
            <Space size='middle'>
              <Select
                value={period}
                onChange={setPeriod}
                style={{ width: 200 }}
                placeholder='Select Period'
              >
                <Option value='current-month'>Current Month</Option>
                <Option value='last-month'>Last Month</Option>
                <Option value='current-quarter'>Current Quarter</Option>
                <Option value='last-quarter'>Last Quarter</Option>
                <Option value='current-year'>Current Year</Option>
              </Select>
              <Input
                placeholder='Search transactions'
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
                  <div className='summary-title'>Total GST Collected</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalGSTCollected?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total GST Paid</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalGSTPaid?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card className='summary-card'>
                  <div className='summary-title'>Net GST Payable</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.netGSTPayable?.toFixed(2) || '0.00'}
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

export default GSTReportPage;
