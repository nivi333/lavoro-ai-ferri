import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { ExpenseSummaryReport as ExpenseData } from '@/services/reportTypes';
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

interface ExpenseSummaryReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const ExpenseSummaryReport: React.FC<ExpenseSummaryReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<ExpenseData | null>(null);
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

      const result = await reportService.getExpenseSummary(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Expense Summary:', error);
      toast.error('Failed to load Expense Summary report');
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
          title: 'Total Expenses',
          value: formatCurrency(data.summary.totalExpenses),
          color: '#dc2626',
        },
        {
          title: 'Total Bills',
          value: data.summary.totalBills,
        },
        {
          title: 'Average Bill Value',
          value: formatCurrency(data.summary.averageBillValue),
        },
      ]
    : [];

  const filteredSuppliers = data?.supplierExpenses.filter(s =>
    s.supplierName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <TableCard title='Expenses by Supplier'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead className='text-right'>Bill Count</TableHead>
                <TableHead className='text-right'>Total Expenses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers?.map((supplier, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className='font-medium'>{supplier.supplierName}</div>
                    <div className='text-xs text-muted-foreground'>{supplier.supplierCode}</div>
                  </TableCell>
                  <TableCell className='text-right'>{supplier.billCount}</TableCell>
                  <TableCell className='text-right'>
                    {formatCurrency(supplier.totalExpenses)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
};

export default ExpenseSummaryReport;
