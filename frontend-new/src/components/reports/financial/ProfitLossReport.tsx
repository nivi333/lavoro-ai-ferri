import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { ProfitLossReport as ProfitLossData } from '@/services/reportTypes';
import ReportSummaryCards from '@/components/reports/shared/ReportSummaryCards';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, TableCard } from '@/components/globalComponents';
import { toast } from 'sonner';

interface ProfitLossReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const ProfitLossReport: React.FC<ProfitLossReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
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
      currency: 'INR',
      maximumFractionDigits: 0,
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
          value: formatCurrency(data.summary.totalCOGS),
          color: '#dc2626', // red
        },
        {
          title: 'Gross Profit',
          value: formatCurrency(data.summary.grossProfit),
          color: '#2563eb', // blue
        },
        {
          title: 'Total Expenses',
          value: formatCurrency(data.summary.totalExpenses),
          color: '#dc2626', // red
        },
        {
          title: 'Net Profit',
          value: formatCurrency(data.summary.netProfit),
          color: data.summary.netProfit >= 0 ? '#16a34a' : '#dc2626',
        },
      ]
    : [];

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <div className='space-y-6'>
          {/* Revenue and COGS Section */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <TableCard title='Income'>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Sales Revenue</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.summary.totalRevenue)}
                      </TableCell>
                    </TableRow>
                    {/* Add more breakdown rows if available in API response */}
                    <TableRow className='font-bold bg-muted/50'>
                      <TableCell>Total Income</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.summary.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TableCard>

            <TableCard title='Cost of Goods Sold'>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Material Cost</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.summary.totalCOGS)}
                      </TableCell>
                    </TableRow>
                    {/* Add more COGS breakdown if available */}
                    <TableRow className='font-bold bg-muted/50'>
                      <TableCell>Total COGS</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.summary.totalCOGS)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TableCard>
          </div>

          {/* Expenses Section */}
          <TableCard title='Operating Expenses'>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className='text-right'>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.expenses.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(expense.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className='font-bold bg-muted/50'>
                    <TableCell>Total Expenses</TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(data.summary.totalExpenses)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TableCard>
        </div>
      )}
    </div>
  );
};

export default ProfitLossReport;
