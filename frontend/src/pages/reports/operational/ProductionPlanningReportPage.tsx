import React, { useState, useEffect } from 'react';
import { useHeader } from '../../../contexts/HeaderContext';
import { Typography, Breadcrumb, Button, DatePicker, Table, Space, Spin, message } from 'antd';
import MainLayout from '../../../components/layout/MainLayout';
import { reportService } from '../../../services/reportService';
import '../shared/ReportStyles.scss';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ProductionPlanningReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    setHeaderActions(null);
    handleGenerateReport();
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleGenerateReport = async () => {
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
  };

  const columns = [
    { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
    { title: 'Product', dataIndex: 'productName', key: 'productName' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Efficiency',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (val: number) => `${val}%`,
    },
  ];

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Breadcrumb
            items={[
              { title: 'Home', href: '/' },
              { title: 'Reports', href: '/reports' },
              { title: 'Operational', href: '/reports/operational' },
              { title: 'Production Planning' },
            ]}
          />
          <Title level={2}>Production Planning</Title>
        </div>
        <div className='filters-section'>
          <Space>
            <RangePicker value={dateRange} onChange={(dates: any) => setDateRange(dates)} />
            <Button type='primary' onClick={handleGenerateReport} loading={loading}>
              Generate
            </Button>
          </Space>
        </div>
        <div className='report-content-section'>
          {loading ? <Spin /> : <Table columns={columns} dataSource={reportData?.items || []} />}
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductionPlanningReportPage;
