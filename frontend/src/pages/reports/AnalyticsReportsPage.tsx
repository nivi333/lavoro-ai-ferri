import React, { useState } from 'react';
import { BarChartOutlined, DownloadOutlined } from '@ant-design/icons';
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
        case 'sales-trends':
          data = await reportService.getSalesTrendsReport(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD'),
            values.groupBy
          );
          break;
        case 'product-performance':
          data = await reportService.getProductPerformanceReport(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD'),
            values.limit
          );
          break;
        case 'customer-insights':
          data = await reportService.getCustomerInsightsReport(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD')
          );
          break;
        case 'business-performance':
          data = await reportService.getBusinessPerformanceReport(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD')
          );
          break;
        case 'textile-analytics':
          data = await reportService.getTextileAnalyticsReport(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD'),
            values.category
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
      case 'sales-trends':
        return (
          <>
            <Form.Item
              name="dateRange"
              label="Date Range"
              rules={[{ required: true, message: 'Please select a date range' }]}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="groupBy"
              label="Group By"
              initialValue="month"
            >
              <Select style={{ width: '100%' }}>
                <Option value="day">Day</Option>
                <Option value="week">Week</Option>
                <Option value="month">Month</Option>
                <Option value="quarter">Quarter</Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'product-performance':
        return (
          <>
            <Form.Item
              name="dateRange"
              label="Date Range"
              rules={[{ required: true, message: 'Please select a date range' }]}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="limit"
              label="Number of Products"
              initialValue={10}
            >
              <Select style={{ width: '100%' }}>
                <Option value={5}>Top 5</Option>
                <Option value={10}>Top 10</Option>
                <Option value={20}>Top 20</Option>
                <Option value={50}>Top 50</Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'textile-analytics':
        return (
          <>
            <Form.Item
              name="dateRange"
              label="Date Range"
              rules={[{ required: true, message: 'Please select a date range' }]}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="category"
              label="Category"
              initialValue="all"
            >
              <Select style={{ width: '100%' }}>
                <Option value="all">All Categories</Option>
                <Option value="fabric">Fabric Production</Option>
                <Option value="yarn">Yarn Manufacturing</Option>
                <Option value="dyeing">Dyeing & Finishing</Option>
                <Option value="garment">Garment Manufacturing</Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'customer-insights':
      case 'business-performance':
        return (
          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: 'Please select a date range' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        );
      default:
        return null;
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportKey) {
      case 'sales-trends':
        return renderSalesTrendsReport();
      case 'product-performance':
        return renderProductPerformanceReport();
      case 'customer-insights':
        return renderCustomerInsightsReport();
      case 'business-performance':
        return renderBusinessPerformanceReport();
      case 'textile-analytics':
        return renderTextileAnalyticsReport();
      default:
        return <div>Report not available</div>;
    }
  };

  const renderSalesTrendsReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Sales Trends Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Revenue</span>
              <span className="value">₹{reportData.summary?.totalRevenue?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Average Order Value</span>
              <span className="value">₹{reportData.summary?.averageOrderValue?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Orders</span>
              <span className="value">{reportData.summary?.totalOrders || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Growth Rate</span>
              <span className="value">{reportData.summary?.growthRate?.toFixed(2) || '0.00'}%</span>
            </div>
            <div className="summary-item">
              <span className="label">Peak Period</span>
              <span className="value">{reportData.summary?.peakPeriod || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProductPerformanceReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Product Performance Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Top Product</span>
              <span className="value">{reportData.summary?.topProduct?.name || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Top Product Revenue</span>
              <span className="value">₹{reportData.summary?.topProduct?.revenue?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Top Category</span>
              <span className="value">{reportData.summary?.topCategory?.name || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Avg. Profit Margin</span>
              <span className="value">{reportData.summary?.averageProfitMargin?.toFixed(2) || '0.00'}%</span>
            </div>
            <div className="summary-item">
              <span className="label">Products Analyzed</span>
              <span className="value">{reportData.summary?.productsAnalyzed || '0'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerInsightsReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Customer Insights Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Customers</span>
              <span className="value">{reportData.summary?.totalCustomers || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">New Customers</span>
              <span className="value">{reportData.summary?.newCustomers || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Repeat Purchase Rate</span>
              <span className="value">{reportData.summary?.repeatPurchaseRate?.toFixed(2) || '0.00'}%</span>
            </div>
            <div className="summary-item">
              <span className="label">Avg. Customer Value</span>
              <span className="value">₹{reportData.summary?.averageCustomerValue?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Top Customer</span>
              <span className="value">{reportData.summary?.topCustomer?.name || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBusinessPerformanceReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Business Performance Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Revenue</span>
              <span className="value">₹{reportData.summary?.revenue?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Expenses</span>
              <span className="value">₹{reportData.summary?.expenses?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Net Profit</span>
              <span className="value">₹{reportData.summary?.netProfit?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Profit Margin</span>
              <span className="value">{reportData.summary?.profitMargin?.toFixed(2) || '0.00'}%</span>
            </div>
            <div className="summary-item">
              <span className="label">ROI</span>
              <span className="value">{reportData.summary?.roi?.toFixed(2) || '0.00'}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTextileAnalyticsReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Textile Analytics Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Production</span>
              <span className="value">{reportData.summary?.totalProduction || '0'} units</span>
            </div>
            <div className="summary-item">
              <span className="label">Top Fabric Type</span>
              <span className="value">{reportData.summary?.topFabricType || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Avg. Quality Score</span>
              <span className="value">{reportData.summary?.averageQualityScore?.toFixed(2) || '0.00'}/100</span>
            </div>
            <div className="summary-item">
              <span className="label">Efficiency Rate</span>
              <span className="value">{reportData.summary?.efficiencyRate?.toFixed(2) || '0.00'}%</span>
            </div>
            <div className="summary-item">
              <span className="label">Waste Percentage</span>
              <span className="value">{reportData.summary?.wastePercentage?.toFixed(2) || '0.00'}%</span>
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

const AnalyticsReportsPage: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<{ key: string; title: string } | null>(null);

  const handleReportClick = (report: { key: string; title: string }) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const reports = [
    {
      key: 'sales-trends',
      title: 'Sales Trends',
      description: 'Sales trends over time with growth analysis',
      status: 'available' as const,
    },
    {
      key: 'product-performance',
      title: 'Product Performance',
      description: 'Top products by revenue, profit, and volume',
      status: 'available' as const,
    },
    {
      key: 'customer-insights',
      title: 'Customer Insights',
      description: 'Customer behavior, loyalty, and value analysis',
      status: 'available' as const,
    },
    {
      key: 'business-performance',
      title: 'Business Performance',
      description: 'Revenue, profit margins, and ROI analysis',
      status: 'available' as const,
    },
    {
      key: 'textile-analytics',
      title: 'Textile Analytics',
      description: 'Textile-specific production and quality metrics',
      status: 'available' as const,
    },
  ];

  return (
    <>
      <ReportCategoryPage
        category='analytics'
        title='Analytics Reports'
        icon={<BarChartOutlined />}
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

export default AnalyticsReportsPage;
