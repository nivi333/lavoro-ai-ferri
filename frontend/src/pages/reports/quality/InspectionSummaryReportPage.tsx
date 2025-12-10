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
  Tag,
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  SaveOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import MainLayout from '../../../components/layout/MainLayout';
import { reportService } from '../../../services/reportService';
import '../shared/ReportStyles.scss';
import dayjs from 'dayjs';

const { Title } = Typography;

interface QualityData {
  key: string;
  inspectionId: string;
  product: string;
  date: string;
  result: string;
  defects: number;
  inspector: string;
}

const InspectionSummaryReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    setHeaderActions(null);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateRange([firstDay, lastDay]);

    const loadInitialReport = async () => {
      setLoading(true);
      try {
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];
        const data = await reportService.getProductionEfficiencyReport(startDate, endDate);
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
      const data = await reportService.getProductionEfficiencyReport(startDate, endDate);
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
      title: 'Inspection ID',
      dataIndex: 'inspectionId',
      key: 'inspectionId',
    },
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      sorter: (a: QualityData, b: QualityData) => {
        const aVal = a.product || '';
        const bVal = b.product || '';
        return aVal.localeCompare(bVal);
      },
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: QualityData) =>
        (record.product || '').toLowerCase().includes(String(value).toLowerCase()) ||
        (record.inspectionId || '').toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: QualityData, b: QualityData) => {
        const aVal = a.date || '';
        const bVal = b.date || '';
        return aVal.localeCompare(bVal);
      },
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => {
        const color = result === 'Pass' ? 'green' : result === 'Fail' ? 'red' : 'orange';
        return (
          <Tag color={color} icon={result === 'Pass' ? <CheckCircleOutlined /> : null}>
            {result}
          </Tag>
        );
      },
    },
    {
      title: 'Defects',
      dataIndex: 'defects',
      key: 'defects',
      sorter: (a: QualityData, b: QualityData) => (a.defects || 0) - (b.defects || 0),
    },
    {
      title: 'Inspector',
      dataIndex: 'inspector',
      key: 'inspector',
    },
  ] as any;

  const getTableData = () => {
    if (!reportData || !reportData.inspections) return [];

    return reportData.inspections.map((item: any, index: number) => ({
      key: `inspection-${index}`,
      inspectionId: item.inspectionId || item.id || `INS-${index + 1}`,
      product: item.productName || item.product || 'N/A',
      date: item.inspectionDate || item.date || new Date().toISOString().split('T')[0],
      result: item.result || item.status || 'Pending',
      defects: item.defectCount || item.defects || 0,
      inspector: item.inspectorName || item.inspector || 'N/A',
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
              { title: 'Quality Reports', href: '/reports/quality' },
              { title: 'Inspection Summary' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>
            <CheckCircleOutlined /> Inspection Summary
          </Title>
        </div>

        <div className='filters-section'>
          <div>
            <Space size='middle'>
              <DatePicker.RangePicker
                value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                onChange={dates => {
                  if (dates) {
                    setDateRange([dates[0]?.toDate() as Date, dates[1]?.toDate() as Date]);
                  } else {
                    setDateRange(null);
                  }
                }}
              />
              <Input
                placeholder='Search inspections'
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
                  <div className='summary-title'>Total Inspections</div>
                  <div className='summary-value'>{getTableData().length}</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Pass Rate</div>
                  <div className='summary-value' style={{ color: '#52c41a' }}>
                    {reportData.summary?.passRate?.toFixed(2) || '0.00'}%
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Total Defects</div>
                  <div className='summary-value' style={{ color: '#ff4d4f' }}>
                    {reportData.summary?.totalDefects || 0}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className='summary-card'>
                  <div className='summary-title'>Avg Defects/Inspection</div>
                  <div className='summary-value'>
                    {reportData.summary?.avgDefects?.toFixed(2) || '0.00'}
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

export default InspectionSummaryReportPage;
