import React from 'react';
import { Table, Spin } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

interface MachineUtilizationReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const MachineUtilizationReport: React.FC<MachineUtilizationReportProps> = ({
  data,
  loading,
  searchText,
}) => {
  const columns = [
    {
      title: 'Machine Name',
      dataIndex: 'machineName',
      key: 'machineName',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: any) =>
        record.machineName.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Utilization %',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (val: number) => `${val.toFixed(1)}%`,
      sorter: (a: any, b: any) => a.utilization - b.utilization,
    },
    { title: 'Run Time (Hrs)', dataIndex: 'runtime', key: 'runtime' },
    { title: 'Downtime (Hrs)', dataIndex: 'downtime', key: 'downtime' },
    { title: 'Maintenance (Hrs)', dataIndex: 'maintenance', key: 'maintenance' },
  ];

  const getTableData = () => {
    if (!data || !data.utilizationByMachine) return [];
    return data.utilizationByMachine;
  };

  return (
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
            rowKey='machineId'
            pagination={{ pageSize: 10 }}
            size='middle'
          />
        )}
      </div>
    </div>
  );
};

export default MachineUtilizationReport;
