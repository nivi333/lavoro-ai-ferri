import React, { useEffect } from 'react';
import { Row, Col, Card, Empty } from 'antd';
import {
  DollarOutlined,
  InboxOutlined,
  ShoppingOutlined,
  ToolOutlined,
  SafetyOutlined,
  FileTextOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../../contexts/HeaderContext';
import { Heading } from '../../components/Heading';
import { MainLayout } from '../../components/layout';
import './ReportsPage.scss';

interface ReportCategory {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  reportCount: number;
}

const ReportsPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const navigate = useNavigate();

  useEffect(() => {
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const reportCategories: ReportCategory[] = [
    {
      key: 'financial',
      title: 'Financial Reports',
      description: 'P&L, Balance Sheet, Cash Flow, Tax Reports',
      icon: <DollarOutlined />,
      path: '/reports/financial',
      color: '#52c41a',
      reportCount: 8,
    },
    {
      key: 'inventory',
      title: 'Inventory Reports',
      description: 'Stock Summary, Movement, Aging, Valuation',
      icon: <InboxOutlined />,
      path: '/reports/inventory',
      color: '#1890ff',
      reportCount: 5,
    },
    {
      key: 'sales',
      title: 'Sales Reports',
      description: 'Sales Summary, Trends, Top Products, Customer Analysis',
      icon: <ShoppingOutlined />,
      path: '/reports/sales',
      color: '#722ed1',
      reportCount: 5,
    },
    {
      key: 'production',
      title: 'Production Reports',
      description: 'Production Summary, Efficiency, Machine Utilization',
      icon: <ToolOutlined />,
      path: '/reports/production',
      color: '#fa8c16',
      reportCount: 5,
    },
    {
      key: 'quality',
      title: 'Quality Reports',
      description: 'Inspections, Defects, Compliance, Quality Trends',
      icon: <SafetyOutlined />,
      path: '/reports/quality',
      color: '#eb2f96',
      reportCount: 5,
    },
  ];

  return (
    <MainLayout>
      <div className='reports-page'>
        <div className='page-container'>
          <div className='page-header-section'>
            <Heading level={2}>Reports</Heading>
            <p className='page-description'>
              Access comprehensive reports across all business operations
            </p>
          </div>

          <Row gutter={[24, 24]} className='report-categories'>
            {reportCategories.map(category => (
              <Col xs={24} sm={12} lg={8} key={category.key}>
                <Card
                  className='report-category-card'
                  hoverable
                  onClick={() => navigate(category.path)}
                >
                  <div className='category-icon' style={{ color: category.color }}>
                    {category.icon}
                  </div>
                  <div className='category-content'>
                    <h3 className='category-title'>{category.title}</h3>
                    <p className='category-description'>{category.description}</p>
                    <div className='category-footer'>
                      <span className='report-count'>
                        <FileTextOutlined /> {category.reportCount} Reports
                      </span>
                      <span className='view-link'>View Reports →</span>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <div className='coming-soon-section'>
            <Card>
              <Empty
                image={<BarChartOutlined style={{ fontSize: 64, color: '#7b5fc9' }} />}
                description={
                  <div>
                    <h3>Custom Report Builder</h3>
                    <p>Create custom reports with drag-and-drop interface - Coming Soon</p>
                  </div>
                }
              />
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportsPage;
