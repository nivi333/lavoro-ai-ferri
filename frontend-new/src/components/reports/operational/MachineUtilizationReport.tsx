import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { MachineUtilizationReport as UtilizationData } from '@/services/reportTypes';
import ReportSummaryCards from '@/components/reports/shared/ReportSummaryCards';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableCard } from '@/components/globalComponents';
import { toast } from 'sonner';
import ReportChart from '@/components/reports/shared/ReportChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface MachineUtilizationReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const MachineUtilizationReport: React.FC<MachineUtilizationReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<UtilizationData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  const fetchData = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      return;
    }

    setLoading(true);
    onLoadingChange(true);
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      const result = await reportService.getMachineUtilizationReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Machine Utilization report:', error);
      toast.error('Failed to load Machine Utilization report');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const cards = data
    ? [
        {
          title: 'Avg Utilization',
          value: `${data.summary.averageUtilization}%`,
          color: data.summary.averageUtilization >= 70 ? '#16a34a' : '#eab308',
        },
        {
          title: 'Total Runtime',
          value: `${data.summary.totalRuntime} hrs`,
        },
        {
          title: 'Breakdown Hours',
          value: `${data.summary.breakdownHours} hrs`,
          color: '#dc2626',
        },
        {
          title: 'Maintenance Hours',
          value: `${data.summary.maintenanceHours} hrs`,
          color: '#2563eb',
        },
      ]
    : [];

  const filteredMachines = data?.utilizationByMachine.filter(m =>
    m.machineName.toLowerCase().includes(searchText.toLowerCase())
  );

  const chartData = data?.utilizationByDay.map(item => ({
    name: item.date,
    Utilization: item.utilization,
  }));

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <>
          <ReportChart title='Daily Utilization Trend' loading={loading}>
            <BarChart data={chartData || []}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='Utilization' fill='#8884d8' />
            </BarChart>
          </ReportChart>

          <TableCard title='Utilization Details'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead className='text-right'>Utilization</TableHead>
                  <TableHead className='text-right'>Runtime</TableHead>
                  <TableHead className='text-right'>Downtime</TableHead>
                  <TableHead className='text-right'>Maintenance</TableHead>
                  <TableHead className='text-right'>Breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines?.map((machine, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{machine.machineName}</TableCell>
                    <TableCell className='text-right font-medium'>{machine.utilization}%</TableCell>
                    <TableCell className='text-right'>{machine.runtime}h</TableCell>
                    <TableCell className='text-right'>{machine.downtime}h</TableCell>
                    <TableCell className='text-right text-blue-600'>
                      {machine.maintenance}h
                    </TableCell>
                    <TableCell className='text-right text-red-600'>{machine.breakdown}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}
    </div>
  );
};

export default MachineUtilizationReport;
