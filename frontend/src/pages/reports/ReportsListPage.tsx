import React, { useState, useEffect } from 'react';
import { useHeader } from '../../contexts/HeaderContext';
import { Typography, Row, Col, Card, Space, Breadcrumb } from 'antd';
import { 
  FileTextOutlined, 
  BarChartOutlined, 
  DollarOutlined, 
  ShopOutlined, 
  SettingOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import './ReportsListPage.scss';

const { Title, Paragraph } = Typography;

interface ReportCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  reportCount: number;
}

const ReportsListPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  
  useEffect(() => {
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);
  
  const [categories] = useState<ReportCategory[]>([
    {
      id: 'financial',
      name: 'Financial Reports',
      description: 'Sales, revenue, profit & loss, balance sheet, and cash flow reports',
      icon: <DollarOutlined />,
      path: '/reports/financial',
      reportCount: 6
    },
    {
      id: 'operational',
      name: 'Operational Reports',
      description: 'Production efficiency, machine utilization, and quality metrics',
      icon: <BarChartOutlined />,
      path: '/reports/operational',
      reportCount: 5
    },
    {
      id: 'inventory',
      name: 'Inventory Reports',
      description: 'Stock levels, movement analysis, and valuation reports',
      icon: <ShopOutlined />,
      path: '/reports/inventory',
      reportCount: 4
    },
    {
      id: 'sales',
      name: 'Sales Reports',
      description: 'Customer insights, sales trends, and revenue analysis',
      icon: <ShoppingOutlined />,
      path: '/reports/sales',
      reportCount: 5
    },
    {
      id: 'production',
      name: 'Production Reports',
      description: 'Manufacturing output, efficiency, and planning',
      icon: <AppstoreOutlined />,
      path: '/reports/production',
      reportCount: 4
    },
    {
      id: 'quality',
      name: 'Quality Reports',
      description: 'Quality metrics, defects, and compliance',
      icon: <SafetyOutlined />,
      path: '/reports/quality',
      reportCount: 3
    },
    {
      id: 'analytics',
      name: 'Analytics Reports',
      description: 'Business intelligence and performance metrics',
      icon: <BarChartOutlined />,
      path: '/reports/analytics',
      reportCount: 4
    },
    {
      id: 'custom',
      name: 'Custom Reports',
      description: 'User-defined and saved report configurations',
      icon: <SettingOutlined />,
      path: '/reports/custom',
      reportCount: 2
    }
  ]);

  return (
    <MainLayout>
      <div className="page-container">
        <div className="page-header-section">
          <Breadcrumb
            items={[
              { title: 'Home', href: '/' },
              { title: 'Reports' }
            ]}
            className="breadcrumb-navigation"
          />
          <Title level={2}>Reports</Title>
          <Paragraph>
            Access and generate reports across different business areas. Select a category to view available reports.
          </Paragraph>
        </div>

        <div className="reports-categories-section">
          <Row gutter={[24, 24]}>
            {categories.map(category => (
              <Col xs={24} sm={12} md={8} lg={6} key={category.id}>
                <Link to={category.path}>
                  <Card 
                    hoverable 
                    className="report-category-card"
                    cover={
                      <div className="category-icon">
                        {category.icon}
                      </div>
                    }
                  >
                    <Card.Meta 
                      title={category.name} 
                      description={category.description} 
                    />
                    <div className="report-count">
                      <Space>
                        <FileTextOutlined />
                        <span>{category.reportCount} reports</span>
                      </Space>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportsListPage;
