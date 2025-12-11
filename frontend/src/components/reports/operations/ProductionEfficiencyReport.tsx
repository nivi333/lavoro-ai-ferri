import React from 'react';
import { Table, Spin } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';
import dayjs from 'dayjs';

interface ProductionData {
  id: string;
  date: string;
  plannedOutput: number;
  actualOutput: number;
  efficiency: number;
}

interface ProductionEfficiencyReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const ProductionEfficiencyReport: React.FC<ProductionEfficiencyReportProps> = ({
  data,
  loading,
  searchText,
}) => {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => dayjs(text).format('MMM DD, YYYY'),
      sorter: (a: ProductionData, b: ProductionData) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: ProductionData) =>
        record.date.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Planned Output',
      dataIndex: 'planned',
      key: 'planned',
      sorter: (a: any, b: any) => a.planned - b.planned,
    },
    {
      title: 'Actual Output',
      dataIndex: 'actual',
      key: 'actual',
      sorter: (a: any, b: any) => a.actual - b.actual,
    },
    {
      title: 'Efficiency (%)',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (value: number) => value.toFixed(1) + '%',
      sorter: (a: any, b: any) => a.efficiency - b.efficiency,
    },
  ];

  const getTableData = () => {
    if (!data || !data.efficiencyByDay) return [];
    return data.efficiencyByDay.map((item: any, index: number) => ({
      ...item,
      id: `prod-${index}`,
      key: `prod-${index}`,
    }));
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
            rowKey='id'
            pagination={{ pageSize: 10 }}
            size='middle'
          />
        )}
      </div>
    </div>
  );
};

export default ProductionEfficiencyReport;
