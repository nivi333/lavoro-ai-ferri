import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { ProfitLossReport as ProfitLossData } from '@/services/reportTypes';
import ReportSummaryCards from '@/components/reports/shared/ReportSummaryCards';
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface ProfitLossReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
  currency: string;
}

const ProfitLossReport: React.FC<ProfitLossReportProps> = ({
  dateRange,
  triggerFetch,
  onLoadingChange,
  currency,
}) => {
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial fetch or when generate button is clicked
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

      const result = await reportService.getProfitLossReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching P&L report:', error);
      toast.error('Failed to load Profit & Loss report');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const cards = data
    ? [
        {
          title: 'Total Revenue',
          value: formatCurrency(data.summary.totalRevenue),
          color: '#16a34a', // green
        },
        {
          title: 'Cost of Goods Sold',
          value: formatCurrency(data.summary.costOfGoodsSold),
          color: '#dc2626', // red
        },
        {
          title: 'Gross Profit',
          value: formatCurrency(data.summary.grossProfit),
          color: '#2563eb', // blue
        },
        {
          title: 'Total Expenses',
          value: formatCurrency(data.summary.operatingExpenses),
          color: '#dc2626', // red
        },
        {
          title: 'Net Profit',
          value: formatCurrency(data.summary.netProfit),
          color: data.summary.netProfit >= 0 ? '#16a34a' : '#dc2626',
        },
      ]
    : [];

  if (loading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <span className='ml-2 text-muted-foreground'>Loading report data...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <div className='space-y-6'>
          {/* Revenue and COGS Section */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Income</h3>
              <div className='rounded-md border bg-card'>
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.revenueBreakdown.length > 0 ? (
                      data.revenueBreakdown.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className='text-right'>
                            {formatCurrency(item.revenue)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell>Sales Revenue</TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(data.summary.totalRevenue)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className='font-bold bg-muted/50'>
                      <TableCell>Total Income</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.summary.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </DataTable>
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Cost of Goods Sold</h3>
              <div className='rounded-md border bg-card'>
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Cost of Goods Sold</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.summary.costOfGoodsSold)}
                      </TableCell>
                    </TableRow>
                    {/* Add more COGS breakdown if available */}
                    <TableRow className='font-bold bg-muted/50'>
                      <TableCell>Total COGS</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.summary.costOfGoodsSold)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </DataTable>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Operating Expenses</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className='text-right'>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.expenseBreakdown.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(expense.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className='font-bold bg-muted/50'>
                    <TableCell>Total Expenses</TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(data.summary.operatingExpenses)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </DataTable>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLossReport;
