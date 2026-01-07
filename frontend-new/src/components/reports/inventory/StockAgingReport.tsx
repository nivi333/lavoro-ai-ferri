import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';

import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface StockAgingReportProps {
  asOfDate: Date | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

interface StockAgingData {
  summary: {
    totalItems: number;
    totalValue: number;
    oldStockValue: number; // >180 days or defined threshold
  };
  items: {
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    ageInDays: number; // Avg age?
    value: number;
    agingBucket: string; // '0-30', '31-60', '61-90', '90-180', '>180'
  }[];
}

const StockAgingReport: React.FC<StockAgingReportProps> = ({
  asOfDate,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<StockAgingData | null>(null);

  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  const fetchData = async () => {
    onLoadingChange(true);
    try {
      const dateStr = asOfDate ? format(asOfDate, 'yyyy-MM-dd') : undefined;
      const result = await reportService.getStockAgingReport(dateStr);
      setData(result);
    } catch (error) {
      console.error('Error fetching Stock Aging report:', error);
      toast.error('Failed to load Stock Aging report');
    } finally {
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

  const filteredItems = data?.items?.filter(
    item =>
      item.productName.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.productCode && item.productCode.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className='space-y-6'>
      {data && (
        <div className='rounded-md border bg-card'>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className='text-right'>Quantity</TableHead>
                <TableHead className='text-right'>Age (Days)</TableHead>
                <TableHead className='text-right'>Value</TableHead>
                <TableHead>Bucket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className='font-medium'>{item.productName}</div>
                    <div className='text-xs text-muted-foreground'>{item.productCode}</div>
                  </TableCell>
                  <TableCell className='text-right'>{item.quantity}</TableCell>
                  <TableCell className='text-right'>{item.ageInDays}</TableCell>
                  <TableCell className='text-right'>{formatCurrency(item.value)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs border ${
                        item.agingBucket === '>180'
                          ? 'border-red-500 text-red-700 bg-red-50'
                          : item.agingBucket === '90-180'
                            ? 'border-orange-500 text-orange-700 bg-orange-50'
                            : 'border-green-500 text-green-700 bg-green-50'
                      }`}
                    >
                      {item.agingBucket}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </div>
      )}
    </div>
  );
};

export default StockAgingReport;
