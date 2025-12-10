import React from 'react';
import { Table, Tag } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

interface ProfitLossData {
  key: string;
  account: string;
  category: string;
  amount: number;
  percentage: number;
}

interface ProfitLossReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const ProfitLossReport: React.FC<ProfitLossReportProps> = ({ data, loading, searchText }) => {
  const columns = [
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      sorter: (a: ProfitLossData, b: ProfitLossData) => a.account.localeCompare(b.account),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: ProfitLossData) =>
        record.account.toLowerCase().includes(String(value).toLowerCase()) ||
        record.category.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: ProfitLossData, b: ProfitLossData) => a.category.localeCompare(b.category),
      render: (category: string) => (
        <Tag color={category === 'Revenue' ? 'green' : 'red'}>{category}</Tag>
      ),
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: ProfitLossData, b: ProfitLossData) => a.amount - b.amount,
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => `${percentage.toFixed(2)}%`,
      sorter: (a: ProfitLossData, b: ProfitLossData) => a.percentage - b.percentage,
    },
  ] as any;

  const getTableData = () => {
    if (!data) return [];

    const revenueData =
      data.revenueBreakdown?.map((item: any, index: number) => ({
        key: `revenue-${index}`,
        account: item.productName,
        category: 'Revenue',
        amount: item.revenue,
        percentage: item.percentage,
      })) || [];

    const expenseData =
      data.expenseBreakdown?.map((item: any, index: number) => ({
        key: `expense-${index}`,
        account: item.category,
        category: 'Expense',
        amount: item.amount,
        percentage: item.percentage,
      })) || [];

    return [...revenueData, ...expenseData];
  };

  return (
    <div className='report-content-section'>
      <div className='report-data'>
        <Table
          columns={columns}
          dataSource={getTableData()}
          pagination={{ pageSize: 10 }}
          loading={loading}
          rowClassName={record => (record.category === 'Expense' ? 'expense-row' : 'revenue-row')}
        />
      </div>
    </div>
  );
};

export default ProfitLossReport;
