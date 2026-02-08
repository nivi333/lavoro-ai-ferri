import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { CashFlowReport as CashFlowData } from '@/services/reportTypes';
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

interface CashFlowReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
  currency: string;
}

const CashFlowReport: React.FC<CashFlowReportProps> = ({
  dateRange,
  triggerFetch,
  onLoadingChange,
  currency,
}) => {
  const [data, setData] = useState<CashFlowData | null>(null);
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

      const result = await reportService.getCashFlowStatement(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Cash Flow report:', error);
      toast.error('Failed to load Cash Flow report');
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
          title: 'Opening Balance',
          value: formatCurrency(data.summary.beginningCashBalance),
        },
        {
          title: 'Net Cash Flow',
          value: formatCurrency(data.summary.netCashFlow),
          color: data.summary.netCashFlow >= 0 ? '#16a34a' : '#dc2626',
        },
        {
          title: 'Closing Balance',
          value: formatCurrency(data.summary.endingCashBalance),
          color: '#2563eb',
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
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Operating Activities</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead className='text-right'>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.operatingActivities.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className='font-bold bg-muted/50'>
                    <TableCell>Net Cash from Operating Activities</TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(data.summary.operatingCashFlow)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </DataTable>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Investing Activities</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead className='text-right'>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.investingActivities.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className='font-bold bg-muted/50'>
                    <TableCell>Net Cash from Investing Activities</TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(data.summary.investingCashFlow)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </DataTable>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Financing Activities</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead className='text-right'>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.financingActivities.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className='font-bold bg-muted/50'>
                    <TableCell>Net Cash from Financing Activities</TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(data.summary.financingCashFlow)}
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

export default CashFlowReport;
