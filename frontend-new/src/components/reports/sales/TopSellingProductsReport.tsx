import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
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

interface TopSellingProductsReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

// Adapting to generic 'any' or specific types if available.
// Based on reportService.ts, getTopSellingProductsReport returns 'any' but implies a list of products.
// Let's assume a structure based on typical API responses for this.
interface TopProduct {
  productId: string;
  productName: string;
  productCode: string;
  category: string;
  quantitySold: number;
  salesRevenue: number;
  averagePrice: number;
}

interface TopSellingData {
  summary: {
    totalProductsSold: number;
    topPerformerName: string;
    topPerformerCategory: string;
  };
  products: TopProduct[];
}

const TopSellingProductsReport: React.FC<TopSellingProductsReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<TopSellingData | null>(null);
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

      const result = await reportService.getTopSellingProductsReport(startDate, endDate, 50); // limit 50
      setData(result);
    } catch (error) {
      console.error('Error fetching Top Selling Products report:', error);
      toast.error('Failed to load Top Selling Products report');
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
          value: data.summary.topPerformerName || 'N/A',
          subValue: data.summary.topPerformerCategory,
        },
        {
          title: 'Total Units Sold',
          value: data.products?.reduce((acc, p) => acc + (p.quantitySold || 0), 0) || 0,
        },
      ]
    : [];

  const filteredProducts = data?.products?.filter(
    p =>
      p.productName.toLowerCase().includes(searchText.toLowerCase()) ||
      (p.productCode && p.productCode.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <TableCard title='Top Selling Products'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className='text-right'>Units Sold</TableHead>
                <TableHead className='text-right'>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product, index) => (
                <TableRow key={index}>
                  <TableCell className='w-12 text-center font-bold text-muted-foreground'>
                    #{index + 1}
                  </TableCell>
                  <TableCell>
                    <div className='font-medium'>{product.productName}</div>
                    <div className='text-xs text-muted-foreground'>{product.productCode}</div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className='text-right font-medium'>{product.quantitySold}</TableCell>
                  <TableCell className='text-right'>
                    {formatCurrency(product.salesRevenue)}
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

export default TopSellingProductsReport;
