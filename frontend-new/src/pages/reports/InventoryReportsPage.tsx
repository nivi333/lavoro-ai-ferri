import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageHeader } from '@/components/globalComponents';
import ReportFilters from '@/components/reports/shared/ReportFilters';
import InventorySummaryReport from '@/components/reports/inventory/InventorySummaryReport';
import StockValuationReport from '@/components/reports/inventory/StockValuationReport';

const InventoryReportsPage = () => {
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
  const [searchText, setSearchText] = useState('');
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const handleGenerate = () => {
    setTriggerFetch(prev => prev + 1);
  };

  const isSingleDateTab = activeTab === 'valuation';

  return (
    <PageContainer>
      <PageHeader>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl font-bold tracking-tight'>Inventory Reports</h2>
        </div>
      </PageHeader>

      <div className='mb-6'>
        <ReportFilters
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
        </div>
      </Tabs>
    </PageContainer>
  );
};

export default InventoryReportsPage;
