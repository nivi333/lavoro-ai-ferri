import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { reportService } from '@/services/reportService';
import { GSTReport as GSTData } from '@/services/reportTypes';
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

interface GSTReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const GSTReport: React.FC<GSTReportProps> = ({
  dateRange, // Note: The API takes a 'period' string, we might need to adapt or just use date range if API supported it, but interface says 'period'.
  // We'll use a hardcoded period or derive from date for now as placeholder or assume API update.
  // The task list said `getGSTReport(period: string)`. Let's assume period="current" for now if date range isn't used directly,
  // OR map date range to a month string e.g. "2023-10".
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<GSTData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  const fetchData = async () => {
    setLoading(true);
    onLoadingChange(true);
    try {
      // Simplification: deriving period from start date or using a default.
      // Ideally UI would have a Month Picker for GST.
      const period = dateRange?.from
        ? dateRange.from.toISOString().slice(0, 7)
        : new Date().toISOString().slice(0, 7);

      const result = await reportService.getGSTReport(period);
      setData(result);
    } catch (error) {
      console.error('Error fetching GST report:', error);
      toast.error('Failed to load GST report');
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
          title: 'Output Tax (Sales)',
          value: formatCurrency(data.summary.totalOutputTax),
        },
        {
          title: 'Input Tax (Purchases)',
          value: formatCurrency(data.summary.totalInputTax),
        },
        {
          title: 'Net Tax Payable',
          value: formatCurrency(data.summary.netTaxPayable),
          color: data.summary.netTaxPayable > 0 ? '#dc2626' : '#16a34a',
        },
      ]
    : [];

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <TableCard title='Output Tax (Sales Invoices)'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className='text-right'>Taxable</TableHead>
                  <TableHead className='text-right'>Tax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.outputTax.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className='font-medium'>{item.invoiceId}</div> // Ideally invoice number
                      <div className='text-xs text-muted-foreground'>{item.customerName}</div>
                    </TableCell>
                    <TableCell>{new Date(item.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(item.taxableAmount)}
                    </TableCell>
                    <TableCell className='text-right'>{formatCurrency(item.taxAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          <TableCard title='Input Tax (Purchase Bills)'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className='text-right'>Taxable</TableHead>
                  <TableHead className='text-right'>Tax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.inputTax.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className='font-medium'>{item.billId}</div>
                      <div className='text-xs text-muted-foreground'>{item.supplierName}</div>
                    </TableCell>
                    <TableCell>{new Date(item.billDate).toLocaleDateString()}</TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(item.taxableAmount)}
                    </TableCell>
                    <TableCell className='text-right'>{formatCurrency(item.taxAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>
      )}
    </div>
  );
};

export default GSTReport;
