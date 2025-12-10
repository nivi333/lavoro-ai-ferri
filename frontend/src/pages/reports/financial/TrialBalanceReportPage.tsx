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

interface TrialBalanceData {
  key: string;
  account: string;
  debit: number;
  credit: number;
}

const TrialBalanceReportPage: React.FC = () => {
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
      const data = await reportService.getTrialBalance(dateStr);
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
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      sorter: (a: TrialBalanceData, b: TrialBalanceData) => a.account.localeCompare(b.account),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: TrialBalanceData) =>
        record.account.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Debit (₹)',
      dataIndex: 'debit',
      key: 'debit',
      render: (debit: number) => debit.toFixed(2),
      sorter: (a: TrialBalanceData, b: TrialBalanceData) => a.debit - b.debit,
    },
    {
      title: 'Credit (₹)',
      dataIndex: 'credit',
      key: 'credit',
      render: (credit: number) => credit.toFixed(2),
      sorter: (a: TrialBalanceData, b: TrialBalanceData) => a.credit - b.credit,
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.accounts) return [];

    return reportData.accounts.map((item: any, index: number) => ({
      key: `account-${index}`,
      account: item.accountName || item.name,
      debit: item.debit || 0,
      credit: item.credit || 0,
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
              { title: 'Trial Balance' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Trial Balance</Title>
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
                placeholder='Search accounts'
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
                  <div className='summary-title'>Total Debits</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalDebits?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Credits</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalCredits?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card className='summary-card'>
                  <div className='summary-title'>Balance Difference</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.difference?.toFixed(2) || '0.00'}
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

export default TrialBalanceReportPage;
