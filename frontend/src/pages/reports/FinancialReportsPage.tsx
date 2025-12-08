import React, { useState } from 'react';
import { DollarOutlined, DownloadOutlined } from '@ant-design/icons';
import { DatePicker, Button, Modal, Spin, message, Select, Form, Tabs } from 'antd';
import ReportCategoryPage from './ReportCategoryPage';
import { reportService } from '../../services/reportService';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReportModalProps {
  visible: boolean;
  title: string;
  reportKey: string;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, title, reportKey, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('summary');

  const fetchReport = async (values: any) => {
    setLoading(true);
    try {
      let data;
      switch (reportKey) {
        case 'profit-loss':
          data = await reportService.getProfitLossReport(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD')
          );
          break;
        case 'balance-sheet':
          data = await reportService.getBalanceSheet(
            values.asOfDate?.format('YYYY-MM-DD')
          );
          break;
        case 'cash-flow':
          data = await reportService.getCashFlowStatement(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD')
          );
          break;
        case 'trial-balance':
          data = await reportService.getTrialBalance(
            values.asOfDate?.format('YYYY-MM-DD')
          );
          break;
        case 'gst-reports':
          data = await reportService.getGSTReport(values.period);
          break;
        case 'accounts-receivable':
          data = await reportService.getARAgingReport(
            values.asOfDate?.format('YYYY-MM-DD')
          );
          break;
        case 'accounts-payable':
          data = await reportService.getAPAgingReport(
            values.asOfDate?.format('YYYY-MM-DD')
          );
          break;
        case 'expense-summary':
          data = await reportService.getExpenseSummary(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD')
          );
          break;
        default:
          message.error('Invalid report type');
      }
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      message.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (values: any) => {
    fetchReport(values);
  };

  const renderForm = () => {
    switch (reportKey) {
      case 'profit-loss':
      case 'cash-flow':
      case 'expense-summary':
        return (
          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: 'Please select a date range' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        );
      case 'balance-sheet':
      case 'trial-balance':
      case 'accounts-receivable':
      case 'accounts-payable':
        return (
          <Form.Item
            name="asOfDate"
            label="As of Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        );
      case 'gst-reports':
        return (
          <Form.Item
            name="period"
            label="Period"
            rules={[{ required: true, message: 'Please select a period' }]}
          >
            <Select style={{ width: '100%' }}>
              <Option value="current-month">Current Month</Option>
              <Option value="last-month">Last Month</Option>
              <Option value="current-quarter">Current Quarter</Option>
              <Option value="last-quarter">Last Quarter</Option>
              <Option value="current-year">Current Year</Option>
              <Option value="last-year">Last Year</Option>
            </Select>
          </Form.Item>
        );
      default:
        return null;
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportKey) {
      case 'profit-loss':
        return renderProfitLossReport();
      case 'balance-sheet':
        return renderBalanceSheetReport();
      case 'cash-flow':
        return renderCashFlowReport();
      case 'trial-balance':
        return renderTrialBalanceReport();
      case 'gst-reports':
        return renderGSTReport();
      case 'accounts-receivable':
        return renderARAgingReport();
      case 'accounts-payable':
        return renderAPAgingReport();
      case 'expense-summary':
        return renderExpenseSummaryReport();
      default:
        return <div>Report not available</div>;
    }
  };

  const renderProfitLossReport = () => {
    if (!reportData) return null;
    
    // This would be implemented with actual data when the backend is ready
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Revenue</span>
              <span className="value">₹{reportData.summary?.totalRevenue?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Cost of Goods Sold</span>
              <span className="value">₹{reportData.summary?.costOfGoodsSold?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Gross Profit</span>
              <span className="value">₹{reportData.summary?.grossProfit?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Operating Expenses</span>
              <span className="value">₹{reportData.summary?.operatingExpenses?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Net Profit</span>
              <span className="value">₹{reportData.summary?.netProfit?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Profit Margin</span>
              <span className="value">{reportData.summary?.profitMargin?.toFixed(2) || '0.00'}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheetReport = () => {
    if (!reportData) return null;
    
    // This would be implemented with actual data when the backend is ready
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Summary as of {reportData.summary?.asOfDate}</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Assets</span>
              <span className="value">₹{reportData.summary?.totalAssets?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Liabilities</span>
              <span className="value">₹{reportData.summary?.totalLiabilities?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Equity</span>
              <span className="value">₹{reportData.summary?.totalEquity?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlowReport = () => {
    if (!reportData) return null;
    
    // This would be implemented with actual data when the backend is ready
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Operating Cash Flow</span>
              <span className="value">₹{reportData.summary?.operatingCashFlow?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Investing Cash Flow</span>
              <span className="value">₹{reportData.summary?.investingCashFlow?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Financing Cash Flow</span>
              <span className="value">₹{reportData.summary?.financingCashFlow?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Net Cash Flow</span>
              <span className="value">₹{reportData.summary?.netCashFlow?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTrialBalanceReport = () => {
    if (!reportData) return null;
    
    // This would be implemented with actual data when the backend is ready
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Summary as of {reportData.summary?.asOfDate}</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Debits</span>
              <span className="value">₹{reportData.summary?.totalDebits?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Credits</span>
              <span className="value">₹{reportData.summary?.totalCredits?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Difference</span>
              <span className="value">₹{reportData.summary?.difference?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGSTReport = () => {
    if (!reportData) return null;
    
    // This would be implemented with actual data when the backend is ready
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Summary for {reportData.summary?.period}</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Output Tax</span>
              <span className="value">₹{reportData.summary?.totalOutputTax?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Input Tax</span>
              <span className="value">₹{reportData.summary?.totalInputTax?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Net Tax Payable</span>
              <span className="value">₹{reportData.summary?.netTaxPayable?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderARAgingReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Summary as of {reportData.summary?.asOfDate}</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Outstanding</span>
              <span className="value">₹{reportData.summary?.totalOutstanding?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Current (0-30 days)</span>
              <span className="value">₹{reportData.agingBuckets?.current?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">31-60 days</span>
              <span className="value">₹{reportData.agingBuckets?.days31to60?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">61-90 days</span>
              <span className="value">₹{reportData.agingBuckets?.days61to90?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Over 90 days</span>
              <span className="value">₹{reportData.agingBuckets?.over90?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAPAgingReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Summary as of {reportData.summary?.asOfDate}</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Outstanding</span>
              <span className="value">₹{reportData.summary?.totalOutstanding?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Current (0-30 days)</span>
              <span className="value">₹{reportData.agingBuckets?.current?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">31-60 days</span>
              <span className="value">₹{reportData.agingBuckets?.days31to60?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">61-90 days</span>
              <span className="value">₹{reportData.agingBuckets?.days61to90?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Over 90 days</span>
              <span className="value">₹{reportData.agingBuckets?.over90?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderExpenseSummaryReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Expenses</span>
              <span className="value">₹{reportData.summary?.totalExpenses?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Bills</span>
              <span className="value">{reportData.summary?.totalBills || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Paid Bills</span>
              <span className="value">{reportData.summary?.paidBills || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Paid</span>
              <span className="value">₹{reportData.summary?.totalPaid?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Outstanding</span>
              <span className="value">₹{reportData.summary?.totalOutstanding?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          disabled={!reportData}
        >
          Download Report
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {renderForm()}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Generate Report
          </Button>
        </Form.Item>
      </Form>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '10px' }}>Generating report...</div>
        </div>
      ) : reportData ? (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="Summary" key="summary">
            {renderReportContent()}
          </Tabs.TabPane>
          <Tabs.TabPane tab="Details" key="details">
            <div>Detailed report data will be displayed here.</div>
          </Tabs.TabPane>
        </Tabs>
      ) : null}
    </Modal>
  );
};

const FinancialReportsPage: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<{ key: string; title: string } | null>(null);

  const handleReportClick = (report: { key: string; title: string }) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  // Update the reports to be available for AR Aging and AP Aging since they're already implemented in the backend
  const reports = [
    {
      key: 'profit-loss',
      title: 'Profit & Loss Statement',
      description: 'Revenue, expenses, and net profit analysis',
      status: 'available' as const,
    },
    {
      key: 'balance-sheet',
      title: 'Balance Sheet',
      description: 'Assets, liabilities, and equity overview',
      status: 'available' as const,
    },
    {
      key: 'cash-flow',
      title: 'Cash Flow Statement',
      description: 'Operating, investing, and financing activities',
      status: 'available' as const,
    },
    {
      key: 'trial-balance',
      title: 'Trial Balance',
      description: 'Account-wise debit and credit balances',
      status: 'available' as const,
    },
    {
      key: 'gst-reports',
      title: 'GST Reports',
      description: 'GSTR-1, GSTR-3B, and tax summaries',
      status: 'available' as const,
    },
    {
      key: 'accounts-receivable',
      title: 'Accounts Receivable Aging',
      description: 'Outstanding customer invoices by age',
      status: 'available' as const,
    },
    {
      key: 'accounts-payable',
      title: 'Accounts Payable Aging',
      description: 'Outstanding supplier bills by age',
      status: 'available' as const,
    },
    {
      key: 'expense-summary',
      title: 'Expense Summary',
      description: 'Expense breakdown by category and period',
      status: 'available' as const,
    },
  ];

  return (
    <>
      <ReportCategoryPage
        category='financial'
        title='Financial Reports'
        icon={<DollarOutlined />}
        reports={reports}
        onReportClick={handleReportClick}
      />
      {selectedReport && (
        <ReportModal
          visible={modalVisible}
          title={selectedReport.title}
          reportKey={selectedReport.key}
          onClose={handleModalClose}
        />
      )}
    </>
  );
};

export default FinancialReportsPage;
