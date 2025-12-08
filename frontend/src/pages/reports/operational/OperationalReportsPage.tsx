import React, { useState, useEffect } from 'react';
import { useHeader } from '../../../contexts/HeaderContext';
import { Typography, Card, Row, Col, Breadcrumb, Input, Tag } from 'antd';
import { SearchOutlined, BarChartOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../components/layout/MainLayout';
import './OperationalReportsPage.scss';

const { Title, Paragraph } = Typography;

interface ReportType {
  id: string;
  name: string;
  description: string;
  lastGenerated: string | null;
  frequency: string;
  path: string;
}

const OperationalReportsPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [searchText, setSearchText] = useState('');
  
  useEffect(() => {
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);
  
  const reportTypes: ReportType[] = [
    {
      id: 'production-efficiency',
      name: 'Production Efficiency',
      description: 'Analyze production efficiency, output, and downtime',
      lastGenerated: '2025-12-05T10:30:00',
      frequency: 'Daily',
      path: '/reports/operational/production-efficiency'
    },
    {
      id: 'machine-utilization',
      name: 'Machine Utilization',
      description: 'Machine runtime, downtime, and maintenance analysis',
      lastGenerated: '2025-12-04T14:15:00',
      frequency: 'Weekly',
      path: '/reports/operational/machine-utilization'
    },
    {
      id: 'quality-metrics',
      name: 'Quality Metrics',
      description: 'Quality scores, defect rates, and inspection results',
      lastGenerated: '2025-12-01T09:45:00',
      frequency: 'Weekly',
      path: '/reports/operational/quality-metrics'
    },
    {
      id: 'inventory-movement',
      name: 'Inventory Movement',
      description: 'Stock movement, transfers, and adjustments',
      lastGenerated: null,
      frequency: 'Monthly',
      path: '/reports/operational/inventory-movement'
    },
    {
      id: 'production-planning',
      name: 'Production Planning',
      description: 'Order fulfillment, scheduling, and capacity planning',
      lastGenerated: '2025-11-28T16:20:00',
      frequency: 'Monthly',
      path: '/reports/operational/production-planning'
    }
  ];

  const navigate = useNavigate();
  
  const filteredReports = reportTypes.filter(report => 
    report.name.toLowerCase().includes(searchText.toLowerCase()) ||
    report.description.toLowerCase().includes(searchText.toLowerCase())
  );
  
  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'Daily': return 'green';
      case 'Weekly': return 'blue';
      case 'Monthly': return 'purple';
      default: return 'default';
    }
  };
  
  const formatDate = (date: string | null) => {
    if (!date) return null;
    
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <MainLayout>
      <div className="page-container">
        <div className="page-header-section">
          <Breadcrumb
            items={[
              { title: 'Home', href: '/' },
              { title: 'Reports', href: '/reports' },
              { title: 'Operational Reports' }
            ]}
            className="breadcrumb-navigation"
          />
          <Title level={2}>Operational Reports</Title>
          <Paragraph>
            View and generate operational reports for production, quality, and efficiency metrics.
          </Paragraph>
        </div>

        <div className="filters-section">
          <Input
            placeholder="Search reports"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>

        <div className="reports-grid">
          <Row gutter={[16, 16]}>
            {filteredReports.map(report => (
              <Col xs={24} sm={12} md={8} lg={6} key={report.id}>
                <Card 
                  className="report-card"
                  hoverable
                  onClick={() => navigate(report.path)}
                >
                  <div className="report-card-icon">
                    <BarChartOutlined />
                  </div>
                  <div className="report-card-content">
                    <h3 className="report-card-title">{report.name}</h3>
                    <p className="report-card-description">{report.description}</p>
                    <div className="report-card-footer">
                      <Tag color={getFrequencyColor(report.frequency)}>{report.frequency}</Tag>
                      {report.lastGenerated ? (
                        <div className="report-last-generated">
                          <HistoryOutlined /> {formatDate(report.lastGenerated)}
                        </div>
                      ) : (
                        <Tag color="warning">Never Generated</Tag>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </MainLayout>
  );
};

export default OperationalReportsPage;
