import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { SalesTrendsReport as SalesTrendData } from '@/services/reportTypes';
import ReportSummaryCards from '@/components/reports/shared/ReportSummaryCards';
import { TableCard } from '@/components/globalComponents';
import { toast } from 'sonner';
import ReportChart from '@/components/reports/shared/ReportChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SalesTrendReportProps {
  dateRange: DateRange | undefined;
  period: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const SalesTrendReport: React.FC<SalesTrendReportProps> = ({
  dateRange,
  period,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<SalesTrendData | null>(null);
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

      const result = await reportService.getSalesTrendsReport(startDate, endDate, period);
      setData(result);
    } catch (error) {
      console.error('Error fetching Sales Trends report:', error);
      toast.error('Failed to load Sales Trends report');
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
          title: 'Total Revenue',
          value: formatCurrency(data.summary.totalRevenue),
          color: '#16a34a',
        },
        {
          title: 'Total Orders',
          value: data.summary.totalOrders,
        },
        {
          title: 'Growth Rate',
          value: `${data.summary.growthRate}%`,
          color: data.summary.growthRate >= 0 ? '#16a34a' : '#dc2626',
        },
        {
          title: 'Avg Order Value',
          value: formatCurrency(data.summary.averageOrderValue),
        },
      ]
    : [];

  const chartData = data?.trendsByPeriod.map(item => ({
    name: item.period, // Date or Month name
    Revenue: item.revenue,
    Orders: item.orders,
  }));

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <>
          <ReportChart
            data={chartData || []}
            title='Revenue Trend'
            bars={[{ key: 'Revenue', color: '#2563eb' }]}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <TableCard title='Periodic Performance'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className='text-right'>Orders</TableHead>
                    <TableHead className='text-right'>Revenue</TableHead>
                    <TableHead className='text-right'>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.trendsByPeriod.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.period}</TableCell>
                      <TableCell className='text-right'>{item.orders}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(item.revenue)}</TableCell>
                      <TableCell
                        className='text-right'
                        style={{ color: item.growth >= 0 ? 'green' : 'red' }}
                      >
                        {item.growth}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>

            <TableCard title='Category Performance'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className='text-right'>Revenue</TableHead>
                    <TableHead className='text-right'>Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.trendsByCategory.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(item.revenue)}</TableCell>
                      <TableCell className='text-right'>{item.percentage}%</TableCell>
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

export default SalesTrendReport;
