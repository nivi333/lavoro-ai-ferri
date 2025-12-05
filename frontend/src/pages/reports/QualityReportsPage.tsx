import React from 'react';
import { SafetyOutlined } from '@ant-design/icons';
import ReportCategoryPage from './ReportCategoryPage';

const QualityReportsPage: React.FC = () => {
  const reports = [
    {
      key: 'inspection-summary',
      title: 'Inspection Summary',
      description: 'Quality inspection results and statistics',
      status: 'coming-soon' as const,
    },
    {
      key: 'defect-analysis',
      title: 'Defect Analysis Report',
      description: 'Defect types, frequency, and root causes',
      status: 'coming-soon' as const,
    },
    {
      key: 'quality-trend',
      title: 'Quality Trend Report',
      description: 'Quality performance trends over time',
      status: 'coming-soon' as const,
    },
    {
      key: 'compliance-report',
      title: 'Compliance Report',
      description: 'Regulatory compliance and certification status',
      status: 'coming-soon' as const,
    },
    {
      key: 'rejection-rate',
      title: 'Rejection Rate Analysis',
      description: 'Product rejection rates and patterns',
      status: 'coming-soon' as const,
    },
  ];

  return (
    <ReportCategoryPage
      category='quality'
      title='Quality Reports'
      icon={<SafetyOutlined />}
      reports={reports}
    />
  );
};

export default QualityReportsPage;
