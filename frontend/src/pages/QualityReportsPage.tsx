import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  DatePicker,
  Select,
  Row,
  Col,
  Table,
  Statistic,
  Progress,
  Tag,
  Space,
  Dropdown,
  message,
  Modal,
  Form,
  Input,
  Radio,
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  MailOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Line, Bar, Pie } from '@ant-design/plots';
import { GradientButton } from '../components/ui';
import { Heading } from '../components/Heading';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReportData {
  id: string;
  name: string;
  type: string;
  dateRange: [string, string];
  generatedAt: string;
  generatedBy: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
}

interface QualityMetrics {
  totalInspections: number;
  passRate: number;
  defectRate: number;
  avgQualityScore: number;
  criticalDefects: number;
  inspectorPerformance: Array<{
    inspector: string;
    inspections: number;
    passRate: number;
    avgScore: number;
  }>;
  trendData: Array<{
    date: string;
    passRate: number;
    defectCount: number;
    qualityScore: number;
  }>;
  defectsByCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

const QualityReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  // Removed unused state
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [savedReports, setSavedReports] = useState<ReportData[]>([]);
  const [form] = Form.useForm();

  // Mock data for demonstration
  useEffect(() => {
    loadQualityMetrics();
    loadSavedReports();
  }, [dateRange, selectedLocations, selectedProducts]);

  const loadQualityMetrics = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setQualityMetrics({
        totalInspections: 245,
        passRate: 87.5,
        defectRate: 12.5,
        avgQualityScore: 92.3,
        criticalDefects: 8,
        inspectorPerformance: [
          { inspector: 'John Smith', inspections: 45, passRate: 91.1, avgScore: 94.2 },
          { inspector: 'Sarah Johnson', inspections: 38, passRate: 89.5, avgScore: 91.8 },
          { inspector: 'Mike Chen', inspections: 52, passRate: 84.6, avgScore: 89.1 },
          { inspector: 'Lisa Wang', inspections: 41, passRate: 92.7, avgScore: 95.3 },
        ],
        trendData: Array.from({ length: 30 }, (_, i) => ({
          date: dayjs().subtract(29 - i, 'days').format('MM-DD'),
          passRate: 85 + Math.random() * 10,
          defectCount: Math.floor(Math.random() * 15) + 5,
          qualityScore: 88 + Math.random() * 8,
        })),
        defectsByCategory: [
          { category: 'Material', count: 15, percentage: 35.7 },
          { category: 'Workmanship', count: 12, percentage: 28.6 },
          { category: 'Design', count: 8, percentage: 19.0 },
          { category: 'Packaging', count: 4, percentage: 9.5 },
          { category: 'Other', count: 3, percentage: 7.1 },
        ],
      });
      setLoading(false);
    }, 1000);
  };

  const loadSavedReports = () => {
    setSavedReports([
      {
        id: 'RPT001',
        name: 'Monthly Quality Summary - October 2024',
        type: 'Inspection Summary',
        dateRange: ['2024-10-01', '2024-10-31'],
        generatedAt: '2024-11-01T09:30:00Z',
        generatedBy: 'John Smith',
        status: 'COMPLETED',
      },
      {
        id: 'RPT002',
        name: 'Defect Analysis Report - Q3 2024',
        type: 'Defect Analysis',
        dateRange: ['2024-07-01', '2024-09-30'],
        generatedAt: '2024-10-15T14:20:00Z',
        generatedBy: 'Sarah Johnson',
        status: 'COMPLETED',
      },
    ]);
  };

  const handleGenerateReport = () => {
    setReportModalVisible(true);
  };

  const handleReportSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Simulate report generation
      const newReport: ReportData = {
        id: `RPT${String(savedReports.length + 1).padStart(3, '0')}`,
        name: values.reportName,
        type: values.reportType,
        dateRange: [values.dateRange[0].format('YYYY-MM-DD'), values.dateRange[1].format('YYYY-MM-DD')],
        generatedAt: dayjs().toISOString(),
        generatedBy: 'Current User',
        status: 'GENERATING',
      };

      setSavedReports(prev => [newReport, ...prev]);
      setReportModalVisible(false);
      form.resetFields();
      message.success('Report generation started. You will be notified when it\'s ready.');

      // Simulate completion after 3 seconds
      setTimeout(() => {
        setSavedReports(prev => 
          prev.map(report => 
            report.id === newReport.id 
              ? { ...report, status: 'COMPLETED' as const }
              : report
          )
        );
        message.success(`Report "${values.reportName}" has been generated successfully!`);
      }, 3000);
    } catch (error) {
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    message.success(`Exporting to ${format.toUpperCase()}...`);
  };

  const reportColumns = [
    {
      title: 'Report Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ReportData) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.type}</div>
        </div>
      ),
    },
    {
      title: 'Date Range',
      key: 'dateRange',
      render: (_: any, record: ReportData) => (
        <span>
          {dayjs(record.dateRange[0]).format('MMM DD')} - {dayjs(record.dateRange[1]).format('MMM DD, YYYY')}
        </span>
      ),
    },
    {
      title: 'Generated',
      key: 'generated',
      render: (_: any, record: ReportData) => (
        <div>
          <div>{dayjs(record.generatedAt).format('MMM DD, YYYY')}</div>
          <div className="text-xs text-gray-500">by {record.generatedBy}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          GENERATING: 'processing',
          COMPLETED: 'success',
          FAILED: 'error',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ReportData) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'download',
                icon: <DownloadOutlined />,
                label: 'Download',
                disabled: record.status !== 'COMPLETED',
              },
              {
                key: 'pdf',
                icon: <FilePdfOutlined />,
                label: 'Export PDF',
                disabled: record.status !== 'COMPLETED',
                onClick: () => handleExport('pdf'),
              },
              {
                key: 'excel',
                icon: <FileExcelOutlined />,
                label: 'Export Excel',
                disabled: record.status !== 'COMPLETED',
                onClick: () => handleExport('excel'),
              },
              {
                key: 'email',
                icon: <MailOutlined />,
                label: 'Email Report',
                disabled: record.status !== 'COMPLETED',
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const passRateConfig = {
    data: qualityMetrics?.trendData || [],
    xField: 'date',
    yField: 'passRate',
    smooth: true,
    color: '#7b5fc9',
    point: {
      size: 3,
      shape: 'circle',
    },
  };

  const defectCategoryConfig = {
    data: qualityMetrics?.defectsByCategory || [],
    angleField: 'count',
    colorField: 'category',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} ({percentage}%)',
    },
  };

  const inspectorPerformanceConfig = {
    data: qualityMetrics?.inspectorPerformance || [],
    xField: 'inspector',
    yField: 'passRate',
    color: '#a2d8e5',
  };

  return (
    <div className="page-container">
      <div className="page-header-section">
        <Heading level={2} className="page-title">
          Quality Reports
        </Heading>
        <GradientButton 
          onClick={handleGenerateReport}
          size="small"
        >
          <BarChartOutlined /> 
          Generate Report
        </GradientButton>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col span={6}>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <label className="block text-sm font-medium mb-2">Locations</label>
            <Select
              mode="multiple"
              placeholder="Select locations"
              value={selectedLocations}
              onChange={setSelectedLocations}
              style={{ width: '100%' }}
            >
              <Option value="HQ">Headquarters</Option>
              <Option value="FACTORY1">Factory 1</Option>
              <Option value="WAREHOUSE">Warehouse</Option>
            </Select>
          </Col>
          <Col span={6}>
            <label className="block text-sm font-medium mb-2">Products</label>
            <Select
              mode="multiple"
              placeholder="Select products"
              value={selectedProducts}
              onChange={setSelectedProducts}
              style={{ width: '100%' }}
            >
              <Option value="YARN">Yarn Products</Option>
              <Option value="FABRIC">Fabric Products</Option>
              <Option value="GARMENT">Garment Products</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Button 
              type="primary" 
              onClick={loadQualityMetrics}
              loading={loading}
              style={{ marginTop: '24px' }}
            >
              Apply Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Key Metrics */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Inspections"
              value={qualityMetrics?.totalInspections || 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pass Rate"
              value={qualityMetrics?.passRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: qualityMetrics && qualityMetrics.passRate > 85 ? '#52c41a' : '#faad14' }}
            />
            <Progress 
              percent={qualityMetrics?.passRate || 0} 
              showInfo={false} 
              strokeColor="#52c41a"
              size="small"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Avg Quality Score"
              value={qualityMetrics?.avgQualityScore || 0}
              precision={1}
              suffix="/100"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Critical Defects"
              value={qualityMetrics?.criticalDefects || 0}
              valueStyle={{ color: qualityMetrics && qualityMetrics.criticalDefects > 10 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16} className="mb-6">
        <Col span={12}>
          <Card title="Pass Rate Trend" extra={<LineChartOutlined />}>
            <Line {...passRateConfig} height={300} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Defects by Category" extra={<PieChartOutlined />}>
            <Pie {...defectCategoryConfig} height={300} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <Card title="Inspector Performance" extra={<BarChartOutlined />}>
            <Bar {...inspectorPerformanceConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* Saved Reports */}
      <Card title="Saved Reports" className="mb-6">
        <Table
          columns={reportColumns}
          dataSource={savedReports}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>

      {/* Generate Report Modal */}
      <Modal
        title="Generate Quality Report"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleReportSubmit}
          initialValues={{
            dateRange: [dayjs().subtract(30, 'days'), dayjs()],
            reportType: 'Inspection Summary',
          }}
        >
          <Form.Item
            name="reportName"
            label="Report Name"
            rules={[{ required: true, message: 'Please enter report name' }]}
          >
            <Input placeholder="Enter report name" />
          </Form.Item>

          <Form.Item
            name="reportType"
            label="Report Type"
            rules={[{ required: true, message: 'Please select report type' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="Inspection Summary">Inspection Summary</Radio>
                <Radio value="Defect Analysis">Defect Analysis</Radio>
                <Radio value="Trend Analysis">Trend Analysis</Radio>
                <Radio value="Inspector Performance">Inspector Performance</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="locations"
            label="Locations (Optional)"
          >
            <Select mode="multiple" placeholder="Select locations">
              <Option value="HQ">Headquarters</Option>
              <Option value="FACTORY1">Factory 1</Option>
              <Option value="WAREHOUSE">Warehouse</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="products"
            label="Products (Optional)"
          >
            <Select mode="multiple" placeholder="Select products">
              <Option value="YARN">Yarn Products</Option>
              <Option value="FABRIC">Fabric Products</Option>
              <Option value="GARMENT">Garment Products</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setReportModalVisible(false)}>
              Cancel
            </Button>
            <GradientButton htmlType="submit" loading={loading}>
              Generate Report
            </GradientButton>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default QualityReportsPage;
