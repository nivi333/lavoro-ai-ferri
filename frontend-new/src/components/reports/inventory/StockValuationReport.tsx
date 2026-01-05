import React, { useEffect, useState } from 'react';
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

interface StockValuationReportProps {
  asOfDate: Date | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

interface ValuationData {
  summary: {
    totalValue: number;
    totalItems: number;
    averageValuePerItem: number;
  };
  items: {
    productId: string;
    productName: string;
    productCode: string;
    category: string;
    quantity: number;
    unitPrice: number;
    totalValue: number;
  }[];
}

const StockValuationReport: React.FC<StockValuationReportProps> = ({
  asOfDate,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  const fetchData = async () => {
    setLoading(true);
    onLoadingChange(true);
    try {
      const dateStr = asOfDate ? format(asOfDate, 'yyyy-MM-dd') : undefined;
      const result = await reportService.getStockValuationReport(undefined, dateStr); // locationId optional
      setData(result);
    } catch (error) {
      console.error('Error fetching Stock Valuation report:', error);
      toast.error('Failed to load Stock Valuation report');
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
          title: 'Total Inventory Value',
          value: formatCurrency(data.summary.totalValue),
          color: '#16a34a',
        },
        {
          title: 'Total Items',
          value: data.summary.totalItems,
        },
        // {
        //   title: 'Avg Value / Item',
        //   value: formatCurrency(data.summary.averageValuePerItem),
        // },
      ]
    : [];

  const filteredItems = data?.items?.filter(
    item =>
      item.productName.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.productCode && item.productCode.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <TableCard title='Inventory Valuation'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className='text-right'>Quantity</TableHead>
                <TableHead className='text-right'>Unit Price</TableHead>
                <TableHead className='text-right'>Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className='font-medium'>{item.productName}</div>
                    <div className='text-xs text-muted-foreground'>{item.productCode}</div>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className='text-right'>{item.quantity}</TableCell>
                  <TableCell className='text-right'>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className='text-right font-medium'>
                    {formatCurrency(item.totalValue)}
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

export default StockValuationReport;
