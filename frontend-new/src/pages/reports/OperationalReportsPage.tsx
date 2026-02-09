import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageHeader } from '@/components/globalComponents';
import ReportFilters from '@/components/reports/shared/ReportFilters';
import MachineUtilizationReport from '@/components/reports/operational/MachineUtilizationReport';
import ProductionEfficiencyReport from '@/components/reports/operational/ProductionEfficiencyReport';
import QualityMetricsReport from '@/components/reports/operational/QualityMetricsReport';

const OperationalReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [searchText, setSearchText] = useState('');
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('machine-utilization');

  const handleGenerate = () => {
    setTriggerFetch(prev => prev + 1);
  };

  return (
    <PageContainer>
      <PageHeader>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl font-bold tracking-tight'>Operational Reports</h2>
          <p className='text-muted-foreground'>
            Monitor machine utilization, production efficiency, and quality metrics.
          </p>
        </div>
      </PageHeader>

      <div className='mb-6'>
        <ReportFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          dateMode='range'
          searchText={searchText}
          setSearchText={setSearchText}
          onGenerate={handleGenerate}
          loading={loading}
          searchPlaceholder='Search reports...'
        />
      </div>

      <Tabs
        defaultValue='machine-utilization'
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <TabsList className='w-full justify-start overflow-x-auto h-auto p-1 mb-1'>
          <TabsTrigger value='machine-utilization'>Machine Utilization</TabsTrigger>
          <TabsTrigger value='production-efficiency'>Production Efficiency</TabsTrigger>
          <TabsTrigger value='quality-metrics'>Quality Metrics</TabsTrigger>
        </TabsList>

        <div className='mt-4'>
          <TabsContent value='machine-utilization'>
            <MachineUtilizationReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='production-efficiency'>
            <ProductionEfficiencyReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='quality-metrics'>
            <QualityMetricsReport
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

export default OperationalReportsPage;
