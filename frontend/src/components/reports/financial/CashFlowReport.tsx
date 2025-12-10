import React from 'react';
import { Table } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

interface CashFlowData {
  key: string;
  activity: string;
  category: string;
  amount: number;
}

interface CashFlowReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const CashFlowReport: React.FC<CashFlowReportProps> = ({ data, loading, searchText }) => {
  const columns = [
    {
      title: 'Activity',
      dataIndex: 'activity',
      key: 'activity',
      sorter: (a: CashFlowData, b: CashFlowData) => {
        const aVal = a.activity || '';
        const bVal = b.activity || '';
        return aVal.localeCompare(bVal);
      },
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: CashFlowData) =>
        (record.activity || '').toLowerCase().includes(String(value).toLowerCase()) ||
        (record.category || '').toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: CashFlowData, b: CashFlowData) => {
        const aVal = a.category || '';
        const bVal = b.category || '';
        return aVal.localeCompare(bVal);
      },
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (amount || 0).toFixed(2),
      sorter: (a: CashFlowData, b: CashFlowData) => (a.amount || 0) - (b.amount || 0),
    },
  ] as any;

  const getTableData = () => {
    if (!data) return [];

    const operatingData =
      data.operatingActivities?.map((item: any, index: number) => ({
        key: `operating-${index}`,
        activity: item.name || item.activity,
        category: 'Operating Activities',
        amount: item.amount,
      })) || [];

    const investingData =
      data.investingActivities?.map((item: any, index: number) => ({
        key: `investing-${index}`,
        activity: item.name || item.activity,
        category: 'Investing Activities',
        amount: item.amount,
      })) || [];

    const financingData =
      data.financingActivities?.map((item: any, index: number) => ({
        key: `financing-${index}`,
        activity: item.name || item.activity,
        category: 'Financing Activities',
        amount: item.amount,
      })) || [];

    return [...operatingData, ...investingData, ...financingData];
  };

  return (
    <div className='report-content-section'>
      <div className='report-data'>
        <Table
          columns={columns}
          dataSource={getTableData()}
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CashFlowReport;
