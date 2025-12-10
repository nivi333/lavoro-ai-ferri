import React, { useState, useEffect } from 'react';
import { Button, DatePicker, Table, Space, Spin, message } from 'antd';
import { reportService } from '../../../services/reportService';
import '../../../pages/reports/shared/ReportStyles.scss';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const ProductionPlanningReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getProductionPlanningReport(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      );
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);

  const columns = [
    { title: 'Product', dataIndex: 'productName', key: 'productName' },
    { title: 'Order Count', dataIndex: 'orderCount', key: 'orderCount' },
    { title: 'Total Quantity', dataIndex: 'quantity', key: 'quantity' },
    // Removed fields not present in aggregated report
  ];

  return (
    <div className='report-container'>
      <div className='filters-section'>
        <Space>
          <RangePicker value={dateRange} onChange={(dates: any) => setDateRange(dates)} />
          <Button type='primary' onClick={handleGenerateReport} loading={loading}>
            Generate
          </Button>
        </Space>
      </div>
      <div className='report-content-section'>
        <div className='report-data'>
          {loading ? (
            <div className='loading-container'>
              <Spin size='large' />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={reportData?.ordersByProduct || []}
              rowKey='productId'
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionPlanningReport;
