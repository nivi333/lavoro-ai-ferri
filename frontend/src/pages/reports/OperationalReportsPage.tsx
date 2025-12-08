import React, { useState } from 'react';
import { AppstoreOutlined, DownloadOutlined } from '@ant-design/icons';
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
        case 'production-efficiency':
          data = await reportService.getProductionEfficiencyReport(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD')
          );
          break;
        case 'machine-utilization':
          data = await reportService.getMachineUtilizationReport(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD'),
            values.locationId
          );
          break;
        case 'quality-metrics':
          data = await reportService.getQualityMetricsReport(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD')
          );
          break;
        case 'inventory-movement':
          data = await reportService.getInventoryMovementReport(
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD'),
            values.locationId
          );
          break;
        case 'production-planning':
          data = await reportService.getProductionPlanningReport(
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
      case 'production-efficiency':
      case 'quality-metrics':
      case 'production-planning':
        return (
          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: 'Please select a date range' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        );
      case 'machine-utilization':
      case 'inventory-movement':
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
              name="locationId"
              label="Location"
              rules={[{ required: false, message: 'Please select a location' }]}
            >
              <Select style={{ width: '100%' }} placeholder="All Locations">
                <Option value="all">All Locations</Option>
                <Option value="loc1">Location 1</Option>
                <Option value="loc2">Location 2</Option>
              </Select>
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportKey) {
      case 'production-efficiency':
        return renderProductionEfficiencyReport();
      case 'machine-utilization':
        return renderMachineUtilizationReport();
      case 'quality-metrics':
        return renderQualityMetricsReport();
      case 'inventory-movement':
        return renderInventoryMovementReport();
      case 'production-planning':
        return renderProductionPlanningReport();
      default:
        return <div>Report not available</div>;
    }
  };

  const renderProductionEfficiencyReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Production Efficiency Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Overall Efficiency</span>
              <span className="value">{reportData.summary?.overallEfficiency?.toFixed(2) || '0.00'}%</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Production</span>
              <span className="value">{reportData.summary?.totalProduction || '0'} units</span>
            </div>
            <div className="summary-item">
              <span className="label">Planned Production</span>
              <span className="value">{reportData.summary?.plannedProduction || '0'} units</span>
            </div>
            <div className="summary-item">
              <span className="label">Actual Production</span>
              <span className="value">{reportData.summary?.actualProduction || '0'} units</span>
            </div>
            <div className="summary-item">
              <span className="label">Downtime</span>
              <span className="value">{reportData.summary?.downtime || '0'} hours</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMachineUtilizationReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Machine Utilization Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Average Utilization</span>
              <span className="value">{reportData.summary?.averageUtilization?.toFixed(2) || '0.00'}%</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Runtime</span>
              <span className="value">{reportData.summary?.totalRuntime || '0'} hours</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Downtime</span>
              <span className="value">{reportData.summary?.totalDowntime || '0'} hours</span>
            </div>
            <div className="summary-item">
              <span className="label">Maintenance Hours</span>
              <span className="value">{reportData.summary?.maintenanceHours || '0'} hours</span>
            </div>
            <div className="summary-item">
              <span className="label">Breakdown Hours</span>
              <span className="value">{reportData.summary?.breakdownHours || '0'} hours</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQualityMetricsReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Quality Metrics Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Average Quality Score</span>
              <span className="value">{reportData.summary?.averageQualityScore?.toFixed(2) || '0.00'}/100</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Inspections</span>
              <span className="value">{reportData.summary?.totalInspections || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Pass Rate</span>
              <span className="value">{reportData.summary?.passRate?.toFixed(2) || '0.00'}%</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Defects</span>
              <span className="value">{reportData.summary?.totalDefects || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Defect Rate</span>
              <span className="value">{reportData.summary?.defectRate?.toFixed(2) || '0.00'}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryMovementReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Inventory Movement Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Movements</span>
              <span className="value">{reportData.summary?.totalMovements || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Incoming</span>
              <span className="value">{reportData.summary?.incoming || '0'} units</span>
            </div>
            <div className="summary-item">
              <span className="label">Outgoing</span>
              <span className="value">{reportData.summary?.outgoing || '0'} units</span>
            </div>
            <div className="summary-item">
              <span className="label">Net Change</span>
              <span className="value">{reportData.summary?.netChange || '0'} units</span>
            </div>
            <div className="summary-item">
              <span className="label">Value Change</span>
              <span className="value">₹{reportData.summary?.valueChange?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProductionPlanningReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Production Planning Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Orders</span>
              <span className="value">{reportData.summary?.totalOrders || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Completed Orders</span>
              <span className="value">{reportData.summary?.completedOrders || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">In Progress Orders</span>
              <span className="value">{reportData.summary?.inProgressOrders || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Pending Orders</span>
              <span className="value">{reportData.summary?.pendingOrders || '0'}</span>
            </div>
            <div className="summary-item">
              <span className="label">On-Time Completion Rate</span>
              <span className="value">{reportData.summary?.onTimeCompletionRate?.toFixed(2) || '0.00'}%</span>
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

const OperationalReportsPage: React.FC = () => {
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
      key: 'production-efficiency',
      title: 'Production Efficiency',
      description: 'Analyze production efficiency, output, and downtime',
      status: 'available' as const,
    },
    {
      key: 'machine-utilization',
      title: 'Machine Utilization',
      description: 'Machine runtime, downtime, and maintenance analysis',
      status: 'available' as const,
    },
    {
      key: 'quality-metrics',
      title: 'Quality Metrics',
      description: 'Quality scores, defect rates, and inspection results',
      status: 'available' as const,
    },
    {
      key: 'inventory-movement',
      title: 'Inventory Movement',
      description: 'Stock movement, transfers, and adjustments',
      status: 'available' as const,
    },
    {
      key: 'production-planning',
      title: 'Production Planning',
      description: 'Order fulfillment, scheduling, and capacity planning',
      status: 'available' as const,
    },
  ];

  return (
    <>
      <ReportCategoryPage
        category='operational'
        title='Operational Reports'
        icon={<AppstoreOutlined />}
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

export default OperationalReportsPage;
