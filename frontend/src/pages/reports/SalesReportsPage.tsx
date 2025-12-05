import React from 'react';
import { ShoppingOutlined } from '@ant-design/icons';
import ReportCategoryPage from './ReportCategoryPage';

const SalesReportsPage: React.FC = () => {
  const reports = [
    {
      key: 'sales-summary',
      title: 'Sales Summary',
      description: 'Sales breakdown by period, product, and customer',
      status: 'coming-soon' as const,
    },
    {
      key: 'sales-trend',
      title: 'Sales Trend Analysis',
      description: 'Sales performance trends over time',
      status: 'coming-soon' as const,
    },
    {
      key: 'top-products',
      title: 'Top Selling Products',
      description: 'Best performing products by revenue and quantity',
      status: 'coming-soon' as const,
    },
    {
      key: 'customer-analysis',
      title: 'Customer Purchase History',
      description: 'Customer-wise sales and purchase patterns',
      status: 'coming-soon' as const,
    },
    {
      key: 'sales-by-region',
      title: 'Sales by Region/Location',
      description: 'Geographic sales distribution analysis',
      status: 'coming-soon' as const,
    },
  ];

  return (
    <ReportCategoryPage
      category='sales'
      title='Sales Reports'
      icon={<ShoppingOutlined />}
      reports={reports}
    />
  );
};

export default SalesReportsPage;
