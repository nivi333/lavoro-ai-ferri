import React from 'react';
import { Table } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

interface ExpenseData {
  key: string;
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface ExpenseSummaryReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const ExpenseSummaryReport: React.FC<ExpenseSummaryReportProps> = ({
  data,
  loading,
  searchText,
}) => {
  const columns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: ExpenseData, b: ExpenseData) => a.category.localeCompare(b.category),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: ExpenseData) =>
        record.category.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: ExpenseData, b: ExpenseData) => a.amount - b.amount,
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => `${percentage.toFixed(2)}%`,
      sorter: (a: ExpenseData, b: ExpenseData) => a.percentage - b.percentage,
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: ExpenseData, b: ExpenseData) => a.count - b.count,
    },
  ] as any;

  const getTableData = () => {
    if (!data || !data.expensesByCategory) return [];

    return data.expensesByCategory.map((item: any, index: number) => ({
      key: `category-${index}`,
      category: item.category || item.name,
      amount: item.amount || item.total || 0,
      percentage: item.percentage || 0,
      count: item.count || item.transactionCount || 0,
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

export default ExpenseSummaryReport;
