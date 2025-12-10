import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Input, Button, DatePicker, Table, Space, Spin, message } from 'antd';
import { SearchOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons';
import { reportService } from '../../../services/reportService';
import '../../../pages/reports/shared/ReportStyles.scss';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface QualityData {
  productId: string;
  productName: string;
  averageScore: number;
  inspectionCount: number;
  defectCount: number;
}

const QualityMetricsReport: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = useCallback(async () => {
    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      const data = await reportService.getQualityMetricsReport(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      );
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      sorter: (a: QualityData, b: QualityData) => a.productName.localeCompare(b.productName),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: QualityData) =>
        record.productName.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Inspections',
      dataIndex: 'inspectionCount',
      key: 'inspectionCount',
      sorter: (a: QualityData, b: QualityData) => a.inspectionCount - b.inspectionCount,
    },
    {
      title: 'Defects',
      dataIndex: 'defectCount',
      key: 'defectCount',
      sorter: (a: QualityData, b: QualityData) => a.defectCount - b.defectCount,
    },
    {
      title: 'Avg Score',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (val: number) => val.toFixed(2),
      sorter: (a: QualityData, b: QualityData) => a.averageScore - b.averageScore,
    },
  ] as any;

  const getTableData = () => {
    return reportData?.qualityByProduct || [];
  };

  return (
    <div className='report-container'>
      <div className='filters-section'>
        <div>
          <Space size='middle'>
            <RangePicker
              value={dateRange}
              onChange={(dates: any) => setDateRange(dates)}
              format='YYYY-MM-DD'
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
            <Table
              columns={columns}
              dataSource={getTableData()}
              pagination={{ pageSize: 10 }}
              rowKey='productId'
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QualityMetricsReport;
