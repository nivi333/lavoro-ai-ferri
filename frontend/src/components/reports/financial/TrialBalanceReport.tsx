import React from 'react';
import { Table } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

interface TrialBalanceData {
  key: string;
  account: string;
  debit: number;
  credit: number;
}

interface TrialBalanceReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const TrialBalanceReport: React.FC<TrialBalanceReportProps> = ({ data, loading, searchText }) => {
  const columns = [
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      sorter: (a: TrialBalanceData, b: TrialBalanceData) => a.account.localeCompare(b.account),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: TrialBalanceData) =>
        record.account.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Debit (₹)',
      dataIndex: 'debit',
      key: 'debit',
      render: (debit: number) => debit.toFixed(2),
      sorter: (a: TrialBalanceData, b: TrialBalanceData) => a.debit - b.debit,
    },
    {
      title: 'Credit (₹)',
      dataIndex: 'credit',
      key: 'credit',
      render: (credit: number) => credit.toFixed(2),
      sorter: (a: TrialBalanceData, b: TrialBalanceData) => a.credit - b.credit,
    },
  ] as any;

  const getTableData = () => {
    if (!data || !data.accounts) return [];

    return data.accounts.map((item: any, index: number) => ({
      key: `account-${index}`,
      account: item.accountName || item.name,
      debit: item.debit || 0,
      credit: item.credit || 0,
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

export default TrialBalanceReport;
