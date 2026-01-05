import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { BusinessPerformanceReport as BusinessData } from '@/services/reportTypes';
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

interface BusinessPerformanceReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const BusinessPerformanceReport: React.FC<BusinessPerformanceReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<BusinessData | null>(null);
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

      const result = await reportService.getBusinessPerformanceReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Business Performance report:', error);
      toast.error('Failed to load Business Performance report');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = data
    ? [
        {
          title: 'Revenue',
          value: formatCurrency(data.summary.revenue),
          color: '#16a34a',
        },
        {
          title: 'Net Profit',
          value: formatCurrency(data.summary.netProfit),
          color: data.summary.netProfit >= 0 ? '#16a34a' : '#dc2626',
        },
        {
          title: 'Margin',
          value: `${data.summary.profitMargin}%`,
        },
        {
          title: 'ROI',
          value: `${data.summary.roi}%`,
          color: '#2563eb',
        },
      ]
    : [];

  const chartData = data?.performanceByPeriod.map(item => ({
    name: item.period,
    Revenue: item.revenue,
    Expenses: item.expenses,
    Profit: item.profit,
  }));

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <>
          <ReportChart title='Financial Performance' loading={loading}>
            <BarChart data={chartData || []}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='Revenue' fill='#2563eb' />
              <Bar dataKey='Expenses' fill='#dc2626' />
              <Bar dataKey='Profit' fill='#16a34a' />
            </BarChart>
          </ReportChart>

          <TableCard title='Period Performance'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className='text-right'>Revenue</TableHead>
                  <TableHead className='text-right'>Expenses</TableHead>
                  <TableHead className='text-right'>Profit</TableHead>
                  <TableHead className='text-right'>Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.performanceByPeriod.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{item.period}</TableCell>
                    <TableCell className='text-right'>{formatCurrency(item.revenue)}</TableCell>
                    <TableCell className='text-right text-red-600'>
                      {formatCurrency(item.expenses)}
                    </TableCell>
                    <TableCell
                      className='text-right font-bold'
                      style={{ color: item.profit >= 0 ? 'green' : 'red' }}
                    >
                      {formatCurrency(item.profit)}
                    </TableCell>
                    <TableCell className='text-right'>{item.margin}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          <TableCard title='Department Performance'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className='text-right'>Revenue</TableHead>
                  <TableHead className='text-right'>Profit</TableHead>
                  <TableHead className='text-right'>Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.performanceByDepartment.map((dept, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{dept.department}</TableCell>
                    <TableCell className='text-right'>{formatCurrency(dept.revenue)}</TableCell>
                    <TableCell className='text-right'>{formatCurrency(dept.profit)}</TableCell>
                    <TableCell className='text-right'>{dept.margin}%</TableCell>
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

export default BusinessPerformanceReport;
