import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { APAgingReport as APAgingData } from '@/services/reportTypes';
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

interface AccountsPayableReportProps {
  asOfDate: Date | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const AccountsPayableReport: React.FC<AccountsPayableReportProps> = ({
  asOfDate,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<APAgingData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  const fetchData = async () => {
    setLoading(true);
    onLoadingChange(true);
    try {
      const dateStr = asOfDate ? format(asOfDate, 'yyyy-MM-dd') : undefined;
      const result = await reportService.getAPAgingReport(dateStr);
      setData(result);
    } catch (error) {
      console.error('Error fetching AP Aging report:', error);
      toast.error('Failed to load AP Aging report');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const cards = data
    ? [
        {
          title: 'Total Outstanding',
          value: formatCurrency(data.summary.totalOutstanding),
          color: '#dc2626', // red (liability)
        },
        {
          title: 'Total Bills',
          value: data.summary.totalBills,
        },
        {
          title: 'Overdue (>90 days)',
          value: formatCurrency(data.agingBuckets.over90),
          color: '#dc2626', // red
        },
      ]
    : [];

  const filteredSuppliers = data?.supplierAging.filter(
    s =>
      s.supplierName.toLowerCase().includes(searchText.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <>
          {/* Aging Summary by Buckets */}
          <div className='grid grid-cols-4 gap-4'>
            <div className='bg-green-50 p-4 rounded-lg border border-green-100'>
              <div className='text-sm text-green-700 font-medium'>Current (0-30 days)</div>
              <div className='text-xl font-bold text-green-800'>
                {formatCurrency(data.agingBuckets.current)}
              </div>
            </div>
            <div className='bg-blue-50 p-4 rounded-lg border border-blue-100'>
              <div className='text-sm text-blue-700 font-medium'>31-60 days</div>
              <div className='text-xl font-bold text-blue-800'>
                {formatCurrency(data.agingBuckets.days31to60)}
              </div>
            </div>
            <div className='bg-orange-50 p-4 rounded-lg border border-orange-100'>
              <div className='text-sm text-orange-700 font-medium'>61-90 days</div>
              <div className='text-xl font-bold text-orange-800'>
                {formatCurrency(data.agingBuckets.days61to90)}
              </div>
            </div>
            <div className='bg-red-50 p-4 rounded-lg border border-red-100'>
              <div className='text-sm text-red-700 font-medium'>Over 90 days</div>
              <div className='text-xl font-bold text-red-800'>
                {formatCurrency(data.agingBuckets.over90)}
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Supplier Aging</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead className='text-right'>Current</TableHead>
                    <TableHead className='text-right'>31-60 Days</TableHead>
                    <TableHead className='text-right'>61-90 Days</TableHead>
                    <TableHead className='text-right'>&gt;90 Days</TableHead>
                    <TableHead className='text-right'>Total Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers?.map((supplier, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className='font-medium'>{supplier.supplierName}</div>
                        <div className='text-xs text-muted-foreground'>{supplier.email}</div>
                      </TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(supplier.current)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(supplier.days31to60)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(supplier.days61to90)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(supplier.over90)}
                      </TableCell>
                      <TableCell className='text-right font-bold'>
                        {formatCurrency(supplier.totalOutstanding)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountsPayableReport;
