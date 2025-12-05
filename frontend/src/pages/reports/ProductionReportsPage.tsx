import React from 'react';
import { ToolOutlined } from '@ant-design/icons';
import ReportCategoryPage from './ReportCategoryPage';

const ProductionReportsPage: React.FC = () => {
  const reports = [
    {
      key: 'production-summary',
      title: 'Production Summary',
      description: 'Production output by product and machine',
      status: 'coming-soon' as const,
    },
    {
      key: 'production-efficiency',
      title: 'Production Efficiency Report',
      description: 'Efficiency metrics and performance analysis',
      status: 'coming-soon' as const,
    },
    {
      key: 'machine-utilization',
      title: 'Machine Utilization Report',
      description: 'Machine usage and capacity analysis',
      status: 'coming-soon' as const,
    },
    {
      key: 'downtime-analysis',
      title: 'Downtime Analysis',
      description: 'Machine downtime tracking and reasons',
      status: 'coming-soon' as const,
    },
    {
      key: 'quality-metrics',
      title: 'Quality Metrics Report',
      description: 'Production quality indicators and trends',
      status: 'coming-soon' as const,
    },
  ];

  return (
    <ReportCategoryPage
      category='production'
      title='Production Reports'
      icon={<ToolOutlined />}
      reports={reports}
    />
  );
};

export default ProductionReportsPage;
