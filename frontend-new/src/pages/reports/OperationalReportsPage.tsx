import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageHeader } from '@/components/globalComponents';
import ReportFilters from '@/components/reports/shared/ReportFilters';
import ProductionEfficiencyReport from '@/components/reports/operational/ProductionEfficiencyReport';
import MachineUtilizationReport from '@/components/reports/operational/MachineUtilizationReport';
import QualityMetricsReport from '@/components/reports/operational/QualityMetricsReport';
import ProductionPlanningReport from '@/components/reports/operational/ProductionPlanningReport';

const OperationalReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [searchText, setSearchText] = useState('');
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('efficiency');

  const handleGenerate = () => {
    setTriggerFetch(prev => prev + 1);
  };

  return (
    <PageContainer>
      <PageHeader>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl font-bold tracking-tight'>Operational Reports</h2>
          <p className='text-muted-foreground'>
            Efficiency tracking, machine utilization, quality control, and planning insights.
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
        defaultValue='efficiency'
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <TabsList className='w-full justify-start overflow-x-auto h-auto p-1 mb-1 flex-wrap'>
          <TabsTrigger value='efficiency'>Production Efficiency</TabsTrigger>
          <TabsTrigger value='machine'>Machine Utilization</TabsTrigger>
          <TabsTrigger value='quality'>Quality Metrics</TabsTrigger>
          <TabsTrigger value='planning'>Production Planning</TabsTrigger>
        </TabsList>

        <div className='mt-4'>
          <TabsContent value='efficiency'>
            <ProductionEfficiencyReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='machine'>
            <MachineUtilizationReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='quality'>
            <QualityMetricsReport
              dateRange={dateRange}
              searchText={searchText}
              triggerFetch={triggerFetch}
              onLoadingChange={setLoading}
            />
          </TabsContent>
          <TabsContent value='planning'>
            <ProductionPlanningReport
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
