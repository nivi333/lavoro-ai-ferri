import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageHeader } from '@/components/globalComponents';
import ReportFilters from '@/components/reports/shared/ReportFilters';
import SalesSummaryReport from '@/components/reports/sales/SalesSummaryReport';
import TopSellingProductsReport from '@/components/reports/sales/TopSellingProductsReport';

const SalesReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [searchText, setSearchText] = useState('');
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const handleGenerate = () => {
    setTriggerFetch(prev => prev + 1);
  };

  return (
    <PageContainer>
      <PageHeader>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl font-bold tracking-tight'>Sales Reports</h2>
          <p className='text-muted-foreground'>
            Analyze sales performance and top products.
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
        defaultValue='summary'
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <TabsList className='w-full justify-start overflow-x-auto h-auto p-1 mb-1 flex-wrap'>
          <TabsTrigger value='summary'>Sales Summary</TabsTrigger>
          <TabsTrigger value='top-selling'>Top Selling Products</TabsTrigger>
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
          <TabsContent value='top-selling'>
            <TopSellingProductsReport
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
