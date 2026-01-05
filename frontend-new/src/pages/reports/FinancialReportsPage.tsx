import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageHeader } from '@/components/globalComponents';
import ReportFilters from '@/components/reports/shared/ReportFilters';
import ProfitLossReport from '@/components/reports/financial/ProfitLossReport';
import BalanceSheetReport from '@/components/reports/financial/BalanceSheetReport';
import CashFlowReport from '@/components/reports/financial/CashFlowReport';
import TrialBalanceReport from '@/components/reports/financial/TrialBalanceReport';
import GSTReport from '@/components/reports/financial/GSTReport';
import AccountsReceivableReport from '@/components/reports/financial/AccountsReceivableReport';
import AccountsPayableReport from '@/components/reports/financial/AccountsPayableReport';
import ExpenseSummaryReport from '@/components/reports/financial/ExpenseSummaryReport';

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

  const handleGenerate = () => {
    setTriggerFetch(prev => prev + 1);
  };

  const isSingleDateTab = [
    'balance-sheet',
    'trial-balance',
    'ar-aging',
    'ap-aging',
    'stock-aging',
  ].includes(activeTab);

  return (
    <PageContainer>
      <PageHeader
        title='Financial Reports'
        description='Generate and view financial statements, tax reports, and aging summaries.'
      />

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
        <TabsList className='w-full justify-start overflow-x-auto h-auto p-1 mb-6 flex-wrap'>
          <TabsTrigger value='profit-loss'>Profit & Loss</TabsTrigger>
          <TabsTrigger value='balance-sheet'>Balance Sheet</TabsTrigger>
          <TabsTrigger value='cash-flow'>Cash Flow</TabsTrigger>
          <TabsTrigger value='trial-balance'>Trial Balance</TabsTrigger>
          <TabsTrigger value='gst'>GST Report</TabsTrigger>
          <TabsTrigger value='ar-aging'>AR Aging</TabsTrigger>
          <TabsTrigger value='ap-aging'>AP Aging</TabsTrigger>
          <TabsTrigger value='expenses'>Expense Summary</TabsTrigger>
        </TabsList>

        <div className='mt-4'>
          <TabsContent value='profit-loss'>
            <ProfitLossReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='balance-sheet'>
            <BalanceSheetReport
              asOfDate={singleDate}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='cash-flow'>
            <CashFlowReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='trial-balance'>
            <TrialBalanceReport
              asOfDate={singleDate}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='gst'>
            <GSTReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='ar-aging'>
            <AccountsReceivableReport
              asOfDate={singleDate}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='ap-aging'>
            <AccountsPayableReport
              asOfDate={singleDate}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='expenses'>
            <ExpenseSummaryReport
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

export default FinancialReportsPage;
