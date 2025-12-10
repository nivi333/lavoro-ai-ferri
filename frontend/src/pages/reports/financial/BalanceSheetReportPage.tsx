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

interface BalanceSheetData {
  key: string;
  account: string;
  category: string;
  amount: number;
}

const BalanceSheetReportPage: React.FC = () => {
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
      const data = await reportService.getBalanceSheet(dateStr);
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
      sorter: (a: BalanceSheetData, b: BalanceSheetData) => a.account.localeCompare(b.account),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: BalanceSheetData) =>
        record.account.toLowerCase().includes(String(value).toLowerCase()) ||
        record.category.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: BalanceSheetData, b: BalanceSheetData) => a.category.localeCompare(b.category),
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: BalanceSheetData, b: BalanceSheetData) => a.amount - b.amount,
    },
  ] as any;

  const getTableData = () => {
    if (!reportData) return [];

    const tableData: BalanceSheetData[] = [];

    // Handle assets
    if (reportData.assets && Array.isArray(reportData.assets)) {
      reportData.assets.forEach((item: any, index: number) => {
        tableData.push({
          key: `asset-${index}`,
          account: item.name || item.account || item.accountName || 'Unknown',
          category: 'Assets',
          amount: item.amount || item.balance || 0,
        });
      });
    }

    // Handle liabilities
    if (reportData.liabilities && Array.isArray(reportData.liabilities)) {
      reportData.liabilities.forEach((item: any, index: number) => {
        tableData.push({
          key: `liability-${index}`,
          account: item.name || item.account || item.accountName || 'Unknown',
          category: 'Liabilities',
          amount: item.amount || item.balance || 0,
        });
      });
    }

    // Handle equity
    if (reportData.equity && Array.isArray(reportData.equity)) {
      reportData.equity.forEach((item: any, index: number) => {
        tableData.push({
          key: `equity-${index}`,
          account: item.name || item.account || item.accountName || 'Unknown',
          category: 'Equity',
          amount: item.amount || item.balance || 0,
        });
      });
    }

    return tableData;
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
              { title: 'Balance Sheet' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Balance Sheet</Title>
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
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Assets</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalAssets?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Liabilities</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalLiabilities?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Equity</div>
                  <div className='summary-value'>
                    ₹{reportData.summary?.totalEquity?.toFixed(2) || '0.00'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Assets/Liabilities Ratio</div>
                  <div className='summary-value'>
                    {reportData.summary?.ratio?.toFixed(2) || '0.00'}
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
              <Table
                columns={columns}
                dataSource={getTableData()}
                pagination={{ pageSize: 10 }}
                rowClassName={record =>
                  record.category === 'Assets'
                    ? 'asset-row'
                    : record.category === 'Liabilities'
                      ? 'liability-row'
                      : 'equity-row'
                }
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BalanceSheetReportPage;
