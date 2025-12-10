import React, { useState, useEffect, useCallback } from 'react';
import { Button, DatePicker, Table, Space, Spin, message, Select } from 'antd';
import { reportService } from '../../../services/reportService';
import '../../../pages/reports/shared/ReportStyles.scss';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const MachineUtilizationReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [locationId, setLocationId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs(),
  ]);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = useCallback(async () => {
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
  }, [dateRange, locationId]);

  useEffect(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);

  const columns = [
    { title: 'Machine Name', dataIndex: 'machineName', key: 'machineName' },
    // Type is not in utilizationByMachine unless we guess it
    {
      title: 'Utilization %',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (val: number) => `${val}%`,
    },
    { title: 'Run Time (Hrs)', dataIndex: 'runtime', key: 'runtime' },
    { title: 'Downtime (Hrs)', dataIndex: 'downtime', key: 'downtime' },
    { title: 'Maintenance (Hrs)', dataIndex: 'maintenance', key: 'maintenance' },
  ];

  return (
    <div className='report-container'>
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
        <div className='report-data'>
          {loading ? (
            <div className='loading-container'>
              <Spin size='large' />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={reportData?.utilizationByMachine || []}
              rowKey='machineId'
            /> // Add rowKey
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineUtilizationReport;
