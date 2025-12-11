import React, { useState, useEffect } from 'react';
import { useHeader } from '../../contexts/HeaderContext';
import { Typography, Breadcrumb, Tabs, message } from 'antd';
import MainLayout from '../../components/layout/MainLayout';
import dayjs, { Dayjs } from 'dayjs';
import './shared/ReportStyles.scss';

// Import Shared Components
import ReportFilters from './shared/ReportFilters';
import ReportSummaryCards, { SummaryCardProps } from './shared/ReportSummaryCards';

// Import Services
import { reportService } from '../../services/reportService';

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

  // Global Filter State
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Initialize dates on mount
  useEffect(() => {
    const now = dayjs();
    const firstDay = now.startOf('month');
    const lastDay = now.endOf('month');
    setDateRange([firstDay, lastDay]);
  }, []);

  useEffect(() => {
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  // Fetch data when filters or active tab changes
  useEffect(() => {
    if (dateRange) {
      handleGenerateReport();
    }
  }, [activeTab, dateRange]);

  const handleGenerateReport = async () => {
    if (!dateRange) return;

    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      let data: any;

      switch (activeTab) {
        case 'production-efficiency':
          // @ts-ignore
          if (reportService.getProductionEfficiencyReport) {
            // @ts-ignore
            data = await reportService.getProductionEfficiencyReport(startDate, endDate);
          }
          break;
        case 'machine-utilization':
          // @ts-ignore
          if (reportService.getMachineUtilizationReport) {
            // @ts-ignore
            data = await reportService.getMachineUtilizationReport(startDate, endDate);
          }
          break;
        case 'production-planning':
          // @ts-ignore
          if (reportService.getProductionPlanningReport) {
            // @ts-ignore
            data = await reportService.getProductionPlanningReport(startDate, endDate);
          }
          break;
        case 'quality-metrics':
          // @ts-ignore
          if (reportService.getQualityMetricsReport) {
            // @ts-ignore
            data = await reportService.getQualityMetricsReport(startDate, endDate);
          }
          break;
        default:
          break;
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // Transform Data to Summary Cards based on Active Tab
  const getSummaryCards = (): SummaryCardProps[] => {
    if (!reportData || !reportData.summary) return [];

    if (activeTab === 'production-efficiency') {
      return [
        { title: 'Planned Output', value: reportData.summary.plannedOutput || 0 },
        { title: 'Actual Output', value: reportData.summary.actualOutput || 0 },
        {
          title: 'Efficiency',
          value: reportData.summary.efficiency?.toFixed(1) || '0.0',
          suffix: '%',
          color: (reportData.summary.efficiency || 0) >= 80 ? '#52c41a' : '#ff4d4f',
        },
        { title: 'Total Downtime', value: `${reportData.summary.totalDowntime || 0} min` },
      ];
    }

    if (activeTab === 'machine-utilization') {
      return [
        { title: 'Total Machines', value: reportData.summary.totalMachines || 0 },
        {
          title: 'Average Utilization',
          value: reportData.summary.avgUtilization?.toFixed(1) || '0.0',
          suffix: '%',
        },
        {
          title: 'Active Machines',
          value: reportData.summary.activeMachines || 0,
          color: '#52c41a',
        },
        { title: 'Idle Machines', value: reportData.summary.idleMachines || 0, color: '#faad14' },
      ];
    }

    if (activeTab === 'production-planning') {
      return [
        { title: 'Total Orders', value: reportData.summary.totalOrders || 0 },
        { title: 'Completed', value: reportData.summary.completed || 0, color: '#52c41a' },
        { title: 'In Progress', value: reportData.summary.inProgress || 0, color: '#1890ff' },
        { title: 'Pending', value: reportData.summary.pending || 0, color: '#faad14' },
      ];
    }

    if (activeTab === 'quality-metrics') {
      return [
        { title: 'Total Inspections', value: reportData.summary.totalInspections || 0 },
        { title: 'Passed', value: reportData.summary.passed || 0, color: '#52c41a' },
        { title: 'Failed', value: reportData.summary.failed || 0, color: '#ff4d4f' },
        {
          title: 'Pass Rate',
          value: reportData.summary.passRate?.toFixed(1) || '0.0',
          suffix: '%',
          color: (reportData.summary.passRate || 0) >= 95 ? '#52c41a' : '#ff4d4f',
        },
      ];
    }

    return [];
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

        {/* Global Filters & Summary */}
        <ReportFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          searchText={searchText}
          setSearchText={setSearchText}
          onGenerate={handleGenerateReport}
          loading={loading}
        />

        <ReportSummaryCards cards={getSummaryCards()} loading={loading} />

        <div className='reports-tabs-container'>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            type='card'
            className='reports-tabs'
            destroyInactiveTabPane={true} // Clean up DOM when switching
          >
            <TabPane tab='Production Efficiency' key='production-efficiency'>
              <ProductionEfficiencyReport
                data={reportData}
                loading={loading}
                searchText={searchText}
              />
            </TabPane>

            <TabPane tab='Machine Utilization' key='machine-utilization'>
              <MachineUtilizationReport
                data={reportData}
                loading={loading}
                searchText={searchText}
              />
            </TabPane>

            <TabPane tab='Production Planning' key='production-planning'>
              <ProductionPlanningReport
                data={reportData}
                loading={loading}
                searchText={searchText}
              />
            </TabPane>

            <TabPane tab='Quality Metrics' key='quality-metrics'>
              <QualityMetricsReport data={reportData} loading={loading} searchText={searchText} />
            </TabPane>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default OperationalReportsPage;
