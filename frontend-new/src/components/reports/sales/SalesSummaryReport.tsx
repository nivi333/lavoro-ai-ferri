import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { SalesSummaryReport as SalesSummaryData } from '@/services/reportTypes';
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
          title: 'Paid Invoices',
          value: data.summary.paidInvoices,
          suffix: ` / ${data.summary.totalInvoices}`,
        },
        {
          title: 'Total Paid',
          value: formatCurrency(data.summary.totalPaid),
        },
        {
          title: 'Average Invoice',
          value: formatCurrency(data.summary.averageInvoiceValue),
        },
        {
          title: 'Collection Rate',
          value: `${data.summary.collectionRate}%`,
          color: '#2563eb',
        },
      ]
    : [];

  const filteredCustomers = data?.customerSales.filter(
    c =>
      c.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      (c.customerCode && c.customerCode.toLowerCase().includes(searchText.toLowerCase()))
  );

  const chartData = data?.salesTrend.map(item => ({
    name: item.month,
    Revenue: item.revenue,
    Invoices: item.invoiceCount,
  }));

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <>
          <ReportChart
            data={chartData || []}
            title='Sales Trend'
            bars={[{ key: 'Revenue', color: '#16a34a' }]}
          />

          <TableCard title='Sales by Customer'>
            <Table>
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
            </Table>
          </TableCard>

          <TableCard title='Recent Product Sales'>
            <Table>
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
                    <TableCell className='text-right'>{formatCurrency(product.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}
    </div>
  );
};

export default SalesSummaryReport;
