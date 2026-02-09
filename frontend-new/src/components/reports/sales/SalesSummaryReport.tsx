import React, { useEffect, useState, useRef } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { SalesSummaryReport as SalesSummaryData } from '@/services/reportTypes';

import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface SalesSummaryReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const SalesSummaryReport: React.FC<SalesSummaryReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<SalesSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const lastTriggerRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastTriggerRef.current !== triggerFetch) {
      lastTriggerRef.current = triggerFetch;
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerFetch]);

  const fetchData = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      return;
    }

    if (loading) return;

    setLoading(true);
    onLoadingChange(true);
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      const result = await reportService.getSalesSummary(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Sales Summary:', error);
      toast.error('Failed to load Sales Summary report');
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

  const filteredCustomers = data?.customerSales.filter(
    c =>
      c.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      (c.customerCode && c.customerCode.toLowerCase().includes(searchText.toLowerCase()))
  );

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
      {data && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Sales by Customer</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className='text-right'>Invoices</TableHead>
                    <TableHead className='text-right'>Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers?.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className='font-medium'>{customer.customerName}</div>
                        <div className='text-xs text-muted-foreground'>
                          {customer.customerCode || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>{customer.invoiceCount}</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(customer.totalSales)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Recent Product Sales</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className='text-right'>Quantity</TableHead>
                    <TableHead className='text-right'>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.productSales.slice(0, 10).map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className='font-medium'>{product.productName}</div>
                        <div className='text-xs text-muted-foreground'>{product.productCode}</div>
                      </TableCell>
                      <TableCell className='text-right'>{product.quantity}</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(product.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesSummaryReport;
