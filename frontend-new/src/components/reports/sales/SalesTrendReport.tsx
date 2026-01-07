import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { SalesTrendsReport as SalesTrendData } from '@/services/reportTypes';

import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface SalesTrendReportProps {
  dateRange: DateRange | undefined;
  period: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const SalesTrendReport: React.FC<SalesTrendReportProps> = ({
  dateRange,
  period,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<SalesTrendData | null>(null);

  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  const fetchData = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      return;
    }

    onLoadingChange(true);
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      const result = await reportService.getSalesTrendsReport(startDate, endDate, period);
      setData(result);
    } catch (error) {
      console.error('Error fetching Sales Trends report:', error);
      toast.error('Failed to load Sales Trends report');
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

  return (
    <div className='space-y-6'>
      {data && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Periodic Performance</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className='text-right'>Orders</TableHead>
                    <TableHead className='text-right'>Revenue</TableHead>
                    <TableHead className='text-right'>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.trendsByPeriod.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.period}</TableCell>
                      <TableCell className='text-right'>{item.orders}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(item.revenue)}</TableCell>
                      <TableCell
                        className='text-right'
                        style={{ color: item.growth >= 0 ? 'green' : 'red' }}
                      >
                        {item.growth}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Category Performance</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className='text-right'>Revenue</TableHead>
                    <TableHead className='text-right'>Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.trendsByCategory.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(item.revenue)}</TableCell>
                      <TableCell className='text-right'>{item.percentage}%</TableCell>
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

export default SalesTrendReport;
