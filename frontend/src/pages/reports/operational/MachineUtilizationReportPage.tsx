import React, { useState, useEffect } from 'react';
import { useHeader } from '../../../contexts/HeaderContext';
import {
  Typography,
  Breadcrumb,
  Button,
  DatePicker,
  Table,
  Space,
  Spin,
  message,
  Select,
} from 'antd';
import MainLayout from '../../../components/layout/MainLayout';
import { reportService } from '../../../services/reportService';
import '../shared/ReportStyles.scss';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const MachineUtilizationReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [loading, setLoading] = useState(false);
  const [locationId, setLocationId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs(),
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
      const data = await reportService.getMachineUtilizationReport(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD'),
        locationId
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
    { title: 'Machine Name', dataIndex: 'machineName', key: 'machineName' },
    { title: 'Type', dataIndex: 'machineType', key: 'machineType' },
    {
      title: 'Utilization %',
      dataIndex: 'utilizationRate',
      key: 'utilizationRate',
      render: (val: number) => `${val}%`,
    },
    { title: 'Run Time (Hrs)', dataIndex: 'runTimeHours', key: 'runTimeHours' },
    { title: 'Downtime (Hrs)', dataIndex: 'downTimeHours', key: 'downTimeHours' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
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
              { title: 'Machine Utilization' },
            ]}
          />
          <Title level={2}>Machine Utilization</Title>
        </div>
        <div className='filters-section'>
          <Space>
            <Select value={locationId} onChange={setLocationId} style={{ width: 200 }}>
              <Option value='all'>All Locations</Option>
            </Select>
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

export default MachineUtilizationReportPage;
