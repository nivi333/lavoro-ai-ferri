import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageHeader } from '@/components/globalComponents';
import ReportFilters from '@/components/reports/shared/ReportFilters';
import ProductPerformanceReport from '@/components/reports/analytics/ProductPerformanceReport';
import CustomerInsightsReport from '@/components/reports/analytics/CustomerInsightsReport';
import BusinessPerformanceReport from '@/components/reports/analytics/BusinessPerformanceReport';
import TextileAnalyticsReport from '@/components/reports/analytics/TextileAnalyticsReport';

const AnalyticsReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [searchText, setSearchText] = useState('');
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('product-performance');

  const handleGenerate = () => {
    setTriggerFetch(prev => prev + 1);
  };

  return (
    <PageContainer>
      <PageHeader>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl font-bold tracking-tight'>Analytics Reports</h2>
          <p className='text-muted-foreground'>
            Deep dive into product performance, customer behavior, and business metrics.
          </p>
        </div>
      </PageHeader>

      <div className='mb-6'>
        <ReportFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          searchText={searchText}
          setSearchText={setSearchText}
          onGenerate={handleGenerate}
          loading={loading}
          searchPlaceholder='Search...'
        />
      </div>

      <Tabs
        defaultValue='product-performance'
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <TabsList className='w-full justify-start overflow-x-auto h-auto p-1 mb-6 flex-wrap'>
          <TabsTrigger value='product-performance'>Product Performance</TabsTrigger>
          <TabsTrigger value='customer-insights'>Customer Insights</TabsTrigger>
          <TabsTrigger value='business-performance'>Business Performance</TabsTrigger>
          <TabsTrigger value='textile-analytics'>Textile Analytics</TabsTrigger>
        </TabsList>

        <div className='mt-4'>
          <TabsContent value='product-performance'>
            <ProductPerformanceReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='customer-insights'>
            <CustomerInsightsReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='business-performance'>
            <BusinessPerformanceReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='textile-analytics'>
            <TextileAnalyticsReport
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

export default AnalyticsReportsPage;
