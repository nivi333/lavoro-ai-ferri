import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageHeader } from '@/components/globalComponents';
import ReportFilters from '@/components/reports/shared/ReportFilters';
import SalesSummaryReport from '@/components/reports/sales/SalesSummaryReport';
import SalesTrendReport from '@/components/reports/sales/SalesTrendReport';
import TopSellingProductsReport from '@/components/reports/sales/TopSellingProductsReport';
import CustomerPurchaseHistoryReport from '@/components/reports/sales/CustomerPurchaseHistoryReport';
import SalesByRegionReport from '@/components/reports/sales/SalesByRegionReport';

const SalesReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [searchText, setSearchText] = useState('');
  const [period, setPeriod] = useState('month');
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const handleGenerate = () => {
    setTriggerFetch(prev => prev + 1);
  };

  const showPeriodSelect = activeTab === 'trends';

  return (
    <PageContainer>
      <PageHeader
        title='Sales Reports'
        description='Analyze sales performance, trends, top products, and customer history.'
      />

      <div className='mb-6'>
        <ReportFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          searchText={searchText}
          setSearchText={setSearchText}
          onGenerate={handleGenerate}
          loading={loading}
          searchPlaceholder='Search...'
          showPeriodSelect={showPeriodSelect}
          period={period}
          setPeriod={setPeriod}
        />
      </div>

      <Tabs
        defaultValue='summary'
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <TabsList className='w-full justify-start overflow-x-auto h-auto p-1 mb-6 flex-wrap'>
          <TabsTrigger value='summary'>Sales Summary</TabsTrigger>
          <TabsTrigger value='trends'>Sales Trends</TabsTrigger>
          <TabsTrigger value='top-selling'>Top Selling Products</TabsTrigger>
          <TabsTrigger value='customer-history'>Customer Purchase History</TabsTrigger>
          <TabsTrigger value='region'>Sales by Region</TabsTrigger>
        </TabsList>

        <div className='mt-4'>
          <TabsContent value='summary'>
            <SalesSummaryReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='trends'>
            <SalesTrendReport
              dateRange={dateRange}
              period={period}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='top-selling'>
            <TopSellingProductsReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='customer-history'>
            <CustomerPurchaseHistoryReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='region'>
            <SalesByRegionReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
        </div>
      </Tabs>
    </PageContainer>
  );
};

export default SalesReportsPage;
