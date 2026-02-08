import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageHeader } from '@/components/globalComponents';
import ReportFilters from '@/components/reports/shared/ReportFilters';
import ProfitLossReport from '@/components/reports/financial/ProfitLossReport';
import BalanceSheetReport from '@/components/reports/financial/BalanceSheetReport';
import CashFlowReport from '@/components/reports/financial/CashFlowReport';
import { AuthStorage } from '@/utils/storage';

const FinancialReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
  const [searchText, setSearchText] = useState('');
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profit-loss');
  // Get currency from active company or default to INR
  const company = AuthStorage.getCurrentCompany();
  // We assume company object has currency field now (added to type)
  // If not found in storage, default to INR
  const currency = company?.currency || 'INR';

  const handleGenerate = () => {
    setTriggerFetch(prev => prev + 1);
  };

  const isSingleDateTab = ['balance-sheet'].includes(activeTab);

  return (
    <PageContainer>
      <PageHeader>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl font-bold tracking-tight'>Financial Reports</h2>
          <p className='text-muted-foreground'>
            Generate and view core financial statements.
          </p>
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
          searchPlaceholder='Search reports...'
        />
      </div>

      <Tabs
        defaultValue='profit-loss'
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <TabsList className='w-full justify-start overflow-x-auto h-auto p-1 mb-1'>
          <TabsTrigger value='profit-loss'>Profit & Loss</TabsTrigger>
          <TabsTrigger value='balance-sheet'>Balance Sheet</TabsTrigger>
          <TabsTrigger value='cash-flow'>Cash Flow</TabsTrigger>
        </TabsList>

        <div className='mt-4'>
          <TabsContent value='profit-loss'>
            <ProfitLossReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
              currency={currency}
            />
          </TabsContent>
          <TabsContent value='balance-sheet'>
            <BalanceSheetReport
              asOfDate={singleDate}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
              currency={currency}
            />
          </TabsContent>
          <TabsContent value='cash-flow'>
            <CashFlowReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
              currency={currency}
            />
          </TabsContent>
        </div>
      </Tabs>
    </PageContainer>
  );
};

export default FinancialReportsPage;
