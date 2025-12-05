import React, { useEffect } from 'react';
import { Card, Row, Col, Empty, Button } from 'antd';
import { FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../../contexts/HeaderContext';
import { Heading } from '../../components/Heading';
import { MainLayout } from '../../components/layout';
import { PageBreadcrumb } from '../../components/ui';
import './ReportCategoryPage.scss';

interface Report {
  key: string;
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
}

interface ReportCategoryPageProps {
  category: string;
  title: string;
  icon: React.ReactNode;
  reports: Report[];
}

const ReportCategoryPage: React.FC<ReportCategoryPageProps> = ({
  category,
  title,
  icon,
  reports,
}) => {
  const { setHeaderActions } = useHeader();
  const navigate = useNavigate();

  useEffect(() => {
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const availableReports = reports.filter(r => r.status === 'available');
  const comingSoonReports = reports.filter(r => r.status === 'coming-soon');

  return (
    <MainLayout>
      <div className='report-category-page'>
        <div className='page-container'>
          <div className='page-header-section'>
            <PageBreadcrumb
              items={[
                {
                  title: 'Reports',
                  path: '/reports',
                },
                {
                  title: title,
                },
              ]}
            />
            <div className='header-content'>
              <div className='header-icon'>{icon}</div>
              <Heading level={2}>{title}</Heading>
            </div>
          </div>

          {availableReports.length > 0 && (
            <div className='reports-section'>
              <h3 className='section-title'>Available Reports</h3>
              <Row gutter={[16, 16]}>
                {availableReports.map(report => (
                  <Col xs={24} sm={12} lg={8} key={report.key}>
                    <Card className='report-card' hoverable>
                      <div className='report-icon'>
                        <FileTextOutlined />
                      </div>
                      <h4 className='report-title'>{report.title}</h4>
                      <p className='report-description'>{report.description}</p>
                      <Button type='primary' icon={<DownloadOutlined />} size='small' block>
                        Generate Report
                      </Button>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {comingSoonReports.length > 0 && (
            <div className='reports-section coming-soon'>
              <h3 className='section-title'>Coming Soon</h3>
              <Row gutter={[16, 16]}>
                {comingSoonReports.map(report => (
                  <Col xs={24} sm={12} lg={8} key={report.key}>
                    <Card className='report-card disabled'>
                      <div className='report-icon'>
                        <FileTextOutlined />
                      </div>
                      <h4 className='report-title'>{report.title}</h4>
                      <p className='report-description'>{report.description}</p>
                      <div className='coming-soon-badge'>Coming Soon</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {availableReports.length === 0 && comingSoonReports.length === 0 && (
            <Empty
              description='No reports available in this category yet'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type='primary' onClick={() => navigate('/reports')}>
                Back to Reports
              </Button>
            </Empty>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportCategoryPage;
