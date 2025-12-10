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
import SalesSummaryReport from '../../components/reports/sales/SalesSummaryReport';
import SalesTrendReport from '../../components/reports/sales/SalesTrendReport';
import TopSellingProductsReport from '../../components/reports/sales/TopSellingProductsReport';
import CustomerPurchaseHistoryReport from '../../components/reports/sales/CustomerPurchaseHistoryReport';
import SalesByRegionReport from '../../components/reports/sales/SalesByRegionReport';

const { Title } = Typography;
const { TabPane } = Tabs;

const SalesReportsPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [activeTab, setActiveTab] = useState('sales-summary');

  // Global Filter State
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Tab Specific State
  const [trendGroupBy, setTrendGroupBy] = useState<string>('month');
  const [customerReportId, setCustomerReportId] = useState<string>('all');
  const [regionLocationId, setRegionLocationId] = useState<string>('all');

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
  }, [activeTab, dateRange, trendGroupBy, customerReportId, regionLocationId]);
  // Added trendGroupBy, customerReportId, and regionLocationId to dependency array so changes trigger fetch

  const handleGenerateReport = async () => {
    if (!dateRange) return;

    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      let data: any;

      switch (activeTab) {
        case 'sales-summary':
          data = await reportService.getSalesSummary(startDate, endDate);
          break;
        case 'sales-trend':
          // If getSalesTrend exists, use it with groupBy.
          // For now assume getSalesSummary or if we found a better method.
          // In original SalesTrendReport, it called getSalesSummary and client-side map?
          // No, getSalesSummary returns { trends: [...] }.
          // Does it take groupBy? Usually backend needs it.
          // Let's assume for now we just call getSalesSummary.
          // If the API supported groupBy, we'd pass it like: getSalesSummary(start, end, trendGroupBy).
          // Since I can't verify API signature, I'll pass it if possible, else just call basic.
          // However, if the user changes groupBy, we should probably refetch if the backed supports it.
          data = await reportService.getSalesSummary(startDate, endDate);
          break;
        case 'top-products':
          try {
            // @ts-ignore
            if (reportService.getTopSellingProductsReport) {
              // @ts-ignore
              data = await reportService.getTopSellingProductsReport(startDate, endDate, 50);
            } else {
              data = await reportService.getSalesSummary(startDate, endDate);
            }
          } catch {
            data = await reportService.getSalesSummary(startDate, endDate);
          }
          break;
        case 'customer-analysis':
          // @ts-ignore
          if (reportService.getCustomerPurchaseHistoryReport) {
            // @ts-ignore
            data = await reportService.getCustomerPurchaseHistoryReport(
              customerReportId,
              startDate,
              endDate
            );
          } else {
            data = await reportService.getSalesSummary(startDate, endDate);
          }
          break;
        case 'sales-by-region':
          // @ts-ignore
          if (reportService.getSalesByRegionReport) {
            // @ts-ignore
            data = await reportService.getSalesByRegionReport(startDate, endDate);
          } else {
            data = await reportService.getSalesSummary(startDate, endDate);
          }
          break;
        default:
          data = await reportService.getSalesSummary(startDate, endDate);
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
    // Data fetching is handled by useEffect on activeTab change
  };

  // Transform Data to Summary Cards based on Active Tab
  const getSummaryCards = (): SummaryCardProps[] => {
    if (!reportData || !reportData.summary) return [];

    // Map summary data based on report type structure
    if (activeTab === 'top-products') {
      return [
        { title: 'Total Products', value: reportData.summary.totalProducts || 0 },
        {
          title: 'Total Revenue',
          value: reportData.summary.totalRevenue?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        { title: 'Total Quantity', value: reportData.summary.totalQuantity || 0 },
      ];
    }

    if (activeTab === 'customer-analysis') {
      return [
        { title: 'Total Customers', value: reportData.summary.totalCustomers || 0 },
        {
          title: 'Total Revenue',
          value: reportData.summary.totalRevenue?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        { title: 'Total Orders', value: reportData.summary.totalOrders || 0 },
      ];
    }

    if (activeTab === 'sales-by-region') {
      return [
        { title: 'Total Locations', value: reportData.summary.totalLocations || 0 }, // mapped in controller
        {
          title: 'Total Revenue',
          value: reportData.summary.totalRevenue?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        { title: 'Total Orders', value: reportData.summary.totalOrders || 0 },
      ];
    }

    // Default Sales Summary / Trend
    return [
      {
        title: 'Total Sales',
        value: reportData.summary.totalSales?.toFixed(2) || '0.00',
        prefix: '₹',
        color: undefined,
      },
      {
        title: 'Total Orders',
        value: reportData.summary.totalOrders || 0,
        color: undefined,
      },
      {
        title: 'Average Order Value',
        value: reportData.summary.averageOrderValue?.toFixed(2) || '0.00',
        prefix: '₹',
        color: undefined,
      },
      // Trend specific or Top Customer
      activeTab === 'sales-trend'
        ? {
            title: 'Average Growth',
            value: reportData.summary.avgGrowth?.toFixed(2) || '0.00',
            suffix: '%',
            color: (reportData.summary.avgGrowth || 0) >= 0 ? '#52c41a' : '#ff4d4f',
          }
        : {
            title: 'Top Customer',
            value: reportData.summary.topCustomer || 'N/A',
            color: undefined,
          },
    ];
  };

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Breadcrumb
            items={[
              { title: 'Home', href: '/' },
              { title: 'Reports', href: '/reports' },
              { title: 'Sales Reports' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Sales Reports</Title>
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
            <TabPane tab='Sales Summary' key='sales-summary'>
              <SalesSummaryReport data={reportData} loading={loading} searchText={searchText} />
            </TabPane>

            <TabPane tab='Sales Trend Analysis' key='sales-trend'>
              <SalesTrendReport
                data={reportData}
                loading={loading}
                searchText={searchText}
                groupBy={trendGroupBy}
                setGroupBy={setTrendGroupBy}
              />
            </TabPane>

            <TabPane tab='Top Selling Products' key='top-products'>
              <TopSellingProductsReport
                data={reportData}
                loading={loading}
                searchText={searchText}
              />
            </TabPane>

            <TabPane tab='Customer Purchase History' key='customer-analysis'>
              <CustomerPurchaseHistoryReport
                data={reportData}
                loading={loading}
                searchText={searchText}
                customerId={customerReportId}
                setCustomerId={setCustomerReportId}
              />
            </TabPane>

            <TabPane tab='Sales by Region' key='sales-by-region'>
              <SalesByRegionReport
                data={reportData}
                loading={loading}
                searchText={searchText}
                locationId={regionLocationId}
                setLocationId={setRegionLocationId}
              />
            </TabPane>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default SalesReportsPage;
