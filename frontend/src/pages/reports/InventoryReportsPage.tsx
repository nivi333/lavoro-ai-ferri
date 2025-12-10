import React, { useState, useEffect } from 'react';
import { useHeader } from '../../contexts/HeaderContext';
import { Typography, Breadcrumb, Tabs } from 'antd';
import MainLayout from '../../components/layout/MainLayout';
import './shared/ReportStyles.scss';

// Import Report Components
import StockSummaryReport from '../../components/reports/inventory/StockSummaryReport';
import StockMovementReport from '../../components/reports/inventory/StockMovementReport';
import LowStockReport from '../../components/reports/inventory/LowStockReport';
import StockValuationReport from '../../components/reports/inventory/StockValuationReport';
import StockAgingReport from '../../components/reports/inventory/StockAgingReport';

const { Title } = Typography;
const { TabPane } = Tabs;

const InventoryReportsPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [activeTab, setActiveTab] = useState('stock-summary');

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
              { title: 'Inventory Reports' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Inventory Reports</Title>
        </div>

        <div className='reports-tabs-container'>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            type='card'
            className='reports-tabs'
            destroyInactiveTabPane={true} // Clean up DOM when switching
          >
            <TabPane tab='Stock Summary' key='stock-summary'>
              <StockSummaryReport />
            </TabPane>

            <TabPane tab='Stock Movement' key='stock-movement'>
              <StockMovementReport />
            </TabPane>

            <TabPane tab='Low Stock Alerts' key='low-stock'>
              <LowStockReport />
            </TabPane>

            <TabPane tab='Stock Valuation' key='stock-valuation'>
              <StockValuationReport />
            </TabPane>

            <TabPane tab='Stock Aging' key='stock-aging'>
              <StockAgingReport />
            </TabPane>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default InventoryReportsPage;
