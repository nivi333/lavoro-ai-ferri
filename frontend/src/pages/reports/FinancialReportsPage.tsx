import React from 'react';
import { DollarOutlined } from '@ant-design/icons';
import ReportCategoryPage from './ReportCategoryPage';

const FinancialReportsPage: React.FC = () => {
  const reports = [
    {
      key: 'profit-loss',
      title: 'Profit & Loss Statement',
      description: 'Revenue, expenses, and net profit analysis',
      status: 'coming-soon' as const,
    },
    {
      key: 'balance-sheet',
      title: 'Balance Sheet',
      description: 'Assets, liabilities, and equity overview',
      status: 'coming-soon' as const,
    },
    {
      key: 'cash-flow',
      title: 'Cash Flow Statement',
      description: 'Operating, investing, and financing activities',
      status: 'coming-soon' as const,
    },
    {
      key: 'trial-balance',
      title: 'Trial Balance',
      description: 'Account-wise debit and credit balances',
      status: 'coming-soon' as const,
    },
    {
      key: 'gst-reports',
      title: 'GST Reports',
      description: 'GSTR-1, GSTR-3B, and tax summaries',
      status: 'coming-soon' as const,
    },
    {
      key: 'accounts-receivable',
      title: 'Accounts Receivable Aging',
      description: 'Outstanding customer invoices by age',
      status: 'coming-soon' as const,
    },
    {
      key: 'accounts-payable',
      title: 'Accounts Payable Aging',
      description: 'Outstanding supplier bills by age',
      status: 'coming-soon' as const,
    },
    {
      key: 'expense-summary',
      title: 'Expense Summary',
      description: 'Expense breakdown by category and period',
      status: 'coming-soon' as const,
    },
  ];

  return (
    <ReportCategoryPage
      category='financial'
      title='Financial Reports'
      icon={<DollarOutlined />}
      reports={reports}
    />
  );
};

export default FinancialReportsPage;
