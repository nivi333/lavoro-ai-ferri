import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { ProductPerformanceReport as PerformanceData } from '@/services/reportTypes';
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

interface ProductPerformanceReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const ProductPerformanceReport: React.FC<ProductPerformanceReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<PerformanceData | null>(null);
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

      const result = await reportService.getProductPerformanceReport(startDate, endDate, 50);
      setData(result);
    } catch (error) {
      console.error('Error fetching Product Performance report:', error);
      toast.error('Failed to load Product Performance report');
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
          title: 'Top Product',
          value: data.summary.topProduct.name || 'N/A',
          subValue: `Rev: ${formatCurrency(data.summary.topProduct.revenue)}`,
          color: '#16a34a',
        },
        {
          title: 'Top Category',
          value: data.summary.topCategory.name,
          color: '#2563eb',
        },
        {
          title: 'Avg Margin',
          value: `${data.summary.averageProfitMargin}%`,
        },
        {
          title: 'Analyzed Items',
          value: data.summary.productsAnalyzed,
        },
      ]
    : [];

  const filteredProducts = data?.productRankings.filter(p =>
    p.productName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <TableCard title='Product Rankings'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className='text-right'>Units Sold</TableHead>
                <TableHead className='text-right'>Revenue</TableHead>
                <TableHead className='text-right'>Profit Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product, index) => (
                <TableRow key={index}>
                  <TableCell className='w-12 text-center font-bold text-muted-foreground'>
                    #{product.rank}
                  </TableCell>
                  <TableCell>
                    <div className='font-medium'>{product.productName}</div>
                    <div className='text-xs text-muted-foreground'>ID: {product.productId}</div>
                  </TableCell>
                  <TableCell className='text-right'>{product.quantity}</TableCell>
                  <TableCell className='text-right'>{formatCurrency(product.revenue)}</TableCell>
                  <TableCell className='text-right'>{product.profitMargin}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
};

export default ProductPerformanceReport;
