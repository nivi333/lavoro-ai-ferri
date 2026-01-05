import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { TextileAnalyticsReport as TextileData } from '@/services/reportTypes';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface TextileAnalyticsReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const TextileAnalyticsReport: React.FC<TextileAnalyticsReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<TextileData | null>(null);
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

      const result = await reportService.getTextileAnalyticsReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Textile Analytics report:', error);
      toast.error('Failed to load Textile Analytics report');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const cards = data
    ? [
        {
          title: 'Total Production',
          value: data.summary.totalProduction,
          color: '#2563eb',
        },
        {
          title: 'Top Fabric',
          value: data.summary.topFabricType,
          color: '#16a34a',
        },
        {
          title: 'Efficiency',
          value: `${data.summary.efficiencyRate}%`,
          color: '#16a34a',
        },
        {
          title: 'Waste',
          value: `${data.summary.wastePercentage}%`,
          color: '#dc2626',
        },
      ]
    : [];

  const chartData = data?.efficiencyTrend.map(item => ({
    name: item.period,
    Efficiency: item.efficiency,
    Waste: item.waste,
  }));

  // Filtering not really applicable as no list of generic items, but okay

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <>
          <ReportChart title='Efficiency Trend' loading={loading}>
            <LineChart data={chartData || []}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type='monotone' dataKey='Efficiency' stroke='#16a34a' />
              <Line type='monotone' dataKey='Waste' stroke='#dc2626' />
            </LineChart>
          </ReportChart>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <TableCard title='Production by Fabric'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fabric Type</TableHead>
                    <TableHead className='text-right'>Quantity</TableHead>
                    <TableHead className='text-right'>%</TableHead>
                    <TableHead className='text-right'>Quality</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.productionByType.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className='font-medium'>{item.fabricType}</TableCell>
                      <TableCell className='text-right'>{item.quantity}</TableCell>
                      <TableCell className='text-right'>{item.percentage}%</TableCell>
                      <TableCell className='text-right'>{item.qualityScore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>

            <TableCard title='Quality by Process'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process</TableHead>
                    <TableHead className='text-right'>Avg Score</TableHead>
                    <TableHead className='text-right'>Pass Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.qualityByProcess.map((proc, index) => (
                    <TableRow key={index}>
                      <TableCell className='font-medium'>{proc.process}</TableCell>
                      <TableCell className='text-right'>{proc.averageScore}</TableCell>
                      <TableCell className='text-right'>{proc.passRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          </div>
        </>
      )}
    </div>
  );
};

export default TextileAnalyticsReport;
