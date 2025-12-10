import React from 'react';
import { Table } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

interface ARAgingData {
  key: string;
  customer: string;
  current: number;
  days30: number;
  days60: number;
  days90Plus: number;
  total: number;
}

interface AccountsReceivableReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const AccountsReceivableReport: React.FC<AccountsReceivableReportProps> = ({
  data,
  loading,
  searchText,
}) => {
  const columns = [
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      sorter: (a: ARAgingData, b: ARAgingData) => a.customer.localeCompare(b.customer),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: ARAgingData) =>
        record.customer.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Current (₹)',
      dataIndex: 'current',
      key: 'current',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: ARAgingData, b: ARAgingData) => a.current - b.current,
    },
    {
      title: '30 Days (₹)',
      dataIndex: 'days30',
      key: 'days30',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: ARAgingData, b: ARAgingData) => a.days30 - b.days30,
    },
    {
      title: '60 Days (₹)',
      dataIndex: 'days60',
      key: 'days60',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: ARAgingData, b: ARAgingData) => a.days60 - b.days60,
    },
    {
      title: '90+ Days (₹)',
      dataIndex: 'days90Plus',
      key: 'days90Plus',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#ff4d4f' : 'inherit' }}>{amount.toFixed(2)}</span>
      ),
      sorter: (a: ARAgingData, b: ARAgingData) => a.days90Plus - b.days90Plus,
    },
    {
      title: 'Total (₹)',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => <strong>{amount.toFixed(2)}</strong>,
      sorter: (a: ARAgingData, b: ARAgingData) => a.total - b.total,
    },
  ] as any;

  const getTableData = () => {
    if (!data || !data.customers) return [];

    return data.customers.map((item: any, index: number) => ({
      key: `customer-${index}`,
      customer: item.customerName || item.name,
      current: item.current || 0,
      days30: item.days30 || item.thirtyDays || 0,
      days60: item.days60 || item.sixtyDays || 0,
      days90Plus: item.days90Plus || item.ninetyPlusDays || 0,
      total: item.total || 0,
    }));
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

export default AccountsReceivableReport;
