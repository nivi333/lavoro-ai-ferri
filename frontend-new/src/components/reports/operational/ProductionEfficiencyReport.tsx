import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { ProductionEfficiencyReport as EfficiencyData } from '@/services/reportTypes';
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

interface ProductionEfficiencyReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const ProductionEfficiencyReport: React.FC<ProductionEfficiencyReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<EfficiencyData | null>(null);
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

      const result = await reportService.getProductionEfficiencyReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Production Efficiency report:', error);
      toast.error('Failed to load Production Efficiency report');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const cards = data
    ? [
        {
          title: 'Overall Efficiency',
          value: `${data.summary.overallEfficiency}%`,
          color: data.summary.overallEfficiency >= 80 ? '#16a34a' : '#eab308',
        },
        {
          title: 'Actual Production',
          value: data.summary.actualProduction,
          subValue: `Target: ${data.summary.plannedProduction}`,
        },
        {
          title: 'Downtime',
          value: `${data.summary.downtime} hrs`,
          color: '#dc2626',
        },
      ]
    : [];

  const filteredMachines = data?.efficiencyByMachine.filter(m =>
    m.machineName.toLowerCase().includes(searchText.toLowerCase())
  );

  const chartData = data?.efficiencyByDay.map(item => ({
    name: item.date,
    Efficiency: item.efficiency,
    Planned: item.planned,
    Actual: item.actual,
  }));

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <>
          <ReportChart title='Daily Efficiency Trend' loading={loading}>
            <BarChart data={chartData || []}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='Efficiency' fill='#82ca9d' />
            </BarChart>
          </ReportChart>

          <TableCard title='Efficiency by Machine'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead className='text-right'>Efficiency</TableHead>
                  <TableHead className='text-right'>Runtime (hrs)</TableHead>
                  <TableHead className='text-right'>Downtime (hrs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines?.map((machine, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{machine.machineName}</TableCell>
                    <TableCell className='text-right font-medium'>
                      <span
                        className={machine.efficiency >= 80 ? 'text-green-600' : 'text-yellow-600'}
                      >
                        {machine.efficiency}%
                      </span>
                    </TableCell>
                    <TableCell className='text-right'>{machine.runtime}</TableCell>
                    <TableCell className='text-right text-red-600'>{machine.downtime}</TableCell>
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

export default ProductionEfficiencyReport;
