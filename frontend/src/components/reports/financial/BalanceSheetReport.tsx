import React from 'react';
import { Table } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

interface BalanceSheetData {
  key: string;
  account: string;
  category: string;
  amount: number;
}

interface BalanceSheetReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({ data, loading, searchText }) => {
  const columns = [
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      sorter: (a: BalanceSheetData, b: BalanceSheetData) => a.account.localeCompare(b.account),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: BalanceSheetData) =>
        record.account.toLowerCase().includes(String(value).toLowerCase()) ||
        record.category.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: BalanceSheetData, b: BalanceSheetData) => a.category.localeCompare(b.category),
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: BalanceSheetData, b: BalanceSheetData) => a.amount - b.amount,
    },
  ] as any;

  const getTableData = () => {
    if (!data) return [];

    const tableData: BalanceSheetData[] = [];

    // Handle assets
    if (data.assets && Array.isArray(data.assets)) {
      data.assets.forEach((item: any, index: number) => {
        tableData.push({
          key: `asset-${index}`,
          account: item.name || item.account || item.accountName || 'Unknown',
          category: 'Assets',
          amount: item.amount || item.balance || 0,
        });
      });
    }

    // Handle liabilities
    if (data.liabilities && Array.isArray(data.liabilities)) {
      data.liabilities.forEach((item: any, index: number) => {
        tableData.push({
          key: `liability-${index}`,
          account: item.name || item.account || item.accountName || 'Unknown',
          category: 'Liabilities',
          amount: item.amount || item.balance || 0,
        });
      });
    }

    // Handle equity
    if (data.equity && Array.isArray(data.equity)) {
      data.equity.forEach((item: any, index: number) => {
        tableData.push({
          key: `equity-${index}`,
          account: item.name || item.account || item.accountName || 'Unknown',
          category: 'Equity',
          amount: item.amount || item.balance || 0,
        });
      });
    }

    return tableData;
  };

  return (
    <div className='report-content-section'>
      <div className='report-data'>
        <Table
          columns={columns}
          dataSource={getTableData()}
          pagination={{ pageSize: 10 }}
          loading={loading}
          rowClassName={record =>
            record.category === 'Assets'
              ? 'asset-row'
              : record.category === 'Liabilities'
                ? 'liability-row'
                : 'equity-row'
          }
        />
      </div>
    </div>
  );
};

export default BalanceSheetReport;
