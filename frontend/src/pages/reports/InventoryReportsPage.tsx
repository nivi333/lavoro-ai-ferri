import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import ReportCategoryPage from './ReportCategoryPage';

const InventoryReportsPage: React.FC = () => {
  const reports = [
    {
      key: 'stock-summary',
      title: 'Stock Summary',
      description: 'Current stock levels by product and location',
      status: 'coming-soon' as const,
    },
    {
      key: 'stock-movement',
      title: 'Stock Movement Report',
      description: 'Detailed inventory transactions and movements',
      status: 'coming-soon' as const,
    },
    {
      key: 'low-stock',
      title: 'Low Stock Alert Report',
      description: 'Products below reorder level',
      status: 'coming-soon' as const,
    },
    {
      key: 'stock-aging',
      title: 'Stock Aging Report',
      description: 'Inventory age analysis and slow-moving items',
      status: 'coming-soon' as const,
    },
    {
      key: 'inventory-valuation',
      title: 'Inventory Valuation',
      description: 'Total inventory value by product and location',
      status: 'coming-soon' as const,
    },
  ];

  return (
    <ReportCategoryPage
      category='inventory'
      title='Inventory Reports'
      icon={<InboxOutlined />}
      reports={reports}
    />
  );
};

export default InventoryReportsPage;
