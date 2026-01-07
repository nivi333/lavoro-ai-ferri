import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageHeader } from '@/components/globalComponents';
import ReportFilters from '@/components/reports/shared/ReportFilters';
import InventorySummaryReport from '@/components/reports/inventory/InventorySummaryReport';
import StockValuationReport from '@/components/reports/inventory/StockValuationReport';
import LowStockReport from '@/components/reports/inventory/LowStockReport';
import InventoryMovementReport from '@/components/reports/inventory/InventoryMovementReport';
import StockAgingReport from '@/components/reports/inventory/StockAgingReport';

const InventoryReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
  const [searchText, setSearchText] = useState('');
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const handleGenerate = () => {
    setTriggerFetch(prev => prev + 1);
  };

  const isSingleDateTab = ['valuation', 'aging'].includes(activeTab);
  // Low stock is technically current state, but could be historical if API supported it. Assuming current for now, but UI can show single date as "As of".

  return (
    <PageContainer>
      <PageHeader>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl font-bold tracking-tight'>Inventory Reports</h2>
        </div>
      </PageHeader>

      <div className='mb-6'>
        <ReportFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          singleDate={singleDate}
          setSingleDate={setSingleDate}
          dateMode={isSingleDateTab ? 'single' : 'range'}
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
          <TabsTrigger value='summary'>Inventory Summary</TabsTrigger>
          <TabsTrigger value='valuation'>Stock Valuation</TabsTrigger>
          <TabsTrigger value='low-stock'>Low Stock</TabsTrigger>
          <TabsTrigger value='movement'>Inventory Movement</TabsTrigger>
          <TabsTrigger value='aging'>Stock Aging</TabsTrigger>
        </TabsList>

        <div className='mt-4'>
          <TabsContent value='summary'>
            <InventorySummaryReport
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='valuation'>
            <StockValuationReport
              asOfDate={singleDate}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='low-stock'>
            <LowStockReport
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='movement'>
            <InventoryMovementReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='aging'>
            <StockAgingReport
              asOfDate={singleDate}
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

export default InventoryReportsPage;
