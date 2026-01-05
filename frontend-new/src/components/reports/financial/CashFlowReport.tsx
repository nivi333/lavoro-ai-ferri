import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { CashFlowReport as CashFlowData } from '@/services/reportTypes';
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

interface CashFlowReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const CashFlowReport: React.FC<CashFlowReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
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
      currency: 'INR',
      maximumFractionDigits: 0,
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

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <div className='space-y-6'>
          <TableCard title='Operating Activities'>
            <Table>
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
            </Table>
          </TableCard>

          <TableCard title='Investing Activities'>
            <Table>
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
            </Table>
          </TableCard>

          <TableCard title='Financing Activities'>
            <Table>
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
            </Table>
          </TableCard>
        </div>
      )}
    </div>
  );
};

export default CashFlowReport;
