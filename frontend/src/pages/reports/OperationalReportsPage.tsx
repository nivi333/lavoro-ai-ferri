import React, { useState, useEffect } from 'react';
import { useHeader } from '../../contexts/HeaderContext';
import { Typography, Breadcrumb, Tabs } from 'antd';
import MainLayout from '../../components/layout/MainLayout';
import './shared/ReportStyles.scss';

// Import Report Components
import ProductionEfficiencyReport from '../../components/reports/operations/ProductionEfficiencyReport';
import MachineUtilizationReport from '../../components/reports/operations/MachineUtilizationReport';
import ProductionPlanningReport from '../../components/reports/operations/ProductionPlanningReport';
import QualityMetricsReport from '../../components/reports/operations/QualityMetricsReport';

const { Title } = Typography;
const { TabPane } = Tabs;

const OperationalReportsPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [activeTab, setActiveTab] = useState('production-efficiency');

  useEffect(() => {
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Breadcrumb
            items={[
              { title: 'Home', href: '/' },
              { title: 'Reports', href: '/reports' },
              { title: 'Operational Reports' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Operational Reports</Title>
        </div>

        <div className='reports-tabs-container'>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            type='card'
            className='reports-tabs'
            destroyInactiveTabPane={true} // Clean up DOM when switching
          >
            <TabPane tab='Production Efficiency' key='production-efficiency'>
              <ProductionEfficiencyReport />
            </TabPane>

            <TabPane tab='Machine Utilization' key='machine-utilization'>
              <MachineUtilizationReport />
            </TabPane>

            <TabPane tab='Production Planning' key='production-planning'>
              <ProductionPlanningReport />
            </TabPane>

            <TabPane tab='Quality Metrics' key='quality-metrics'>
              <QualityMetricsReport />
            </TabPane>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default OperationalReportsPage;
