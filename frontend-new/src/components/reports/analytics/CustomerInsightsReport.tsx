import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { CustomerInsightsReport as InsightsData } from '@/services/reportTypes';
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

interface CustomerInsightsReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const CustomerInsightsReport: React.FC<CustomerInsightsReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<InsightsData | null>(null);
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

      const result = await reportService.getCustomerInsightsReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Customer Insights report:', error);
      toast.error('Failed to load Customer Insights report');
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
          title: 'Total Customers',
          value: data.summary.totalCustomers,
        },
        {
          title: 'New Customers',
          value: data.summary.newCustomers,
          color: '#16a34a',
        },
        {
          title: 'Repeat Rate',
          value: `${data.summary.repeatPurchaseRate}%`,
          color: '#2563eb',
        },
        {
          title: 'Avg Value',
          value: formatCurrency(data.summary.averageCustomerValue),
        },
      ]
    : [];

  const filteredSegments = data?.customerSegments.filter(s =>
    s.segment.toLowerCase().includes(searchText.toLowerCase())
  );

  const acquisitionChartData = data?.customerRetention.map(item => ({
    name: item.period,
    New: item.newCustomers,
    Returning: item.returningCustomers,
  }));

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <>
          <ReportChart title='Customer Retention & Acquisition' loading={loading}>
            <BarChart data={acquisitionChartData || []}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='New' fill='#16a34a' />
              <Bar dataKey='Returning' fill='#2563eb' />
            </BarChart>
          </ReportChart>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <TableCard title='Customer Segments'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segment</TableHead>
                    <TableHead className='text-right'>Count</TableHead>
                    <TableHead className='text-right'>Revenue</TableHead>
                    <TableHead className='text-right'>%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSegments?.map((segment, index) => (
                    <TableRow key={index}>
                      <TableCell className='font-medium'>{segment.segment}</TableCell>
                      <TableCell className='text-right'>{segment.customerCount}</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(segment.revenue)}
                      </TableCell>
                      <TableCell className='text-right'>{segment.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>

            <TableCard title='Top Customer'>
              <div className='p-4'>
                <p className='text-lg font-bold'>{data.summary.topCustomer.name}</p>
                <p className='text-sm text-muted-foreground'>ID: {data.summary.topCustomer.id}</p>
                <div className='mt-4'>
                  <p className='text-2xl text-primary font-bold'>
                    {formatCurrency(data.summary.topCustomer.revenue)}
                  </p>
                  <p className='text-xs text-muted-foreground uppercase tracking-wide'>
                    Total Revenue
                  </p>
                </div>
              </div>
            </TableCard>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerInsightsReport;
