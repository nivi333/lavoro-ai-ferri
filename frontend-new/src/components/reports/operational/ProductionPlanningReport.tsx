import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { ProductionPlanningReport as PlanningData } from '@/services/reportTypes';

import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface ProductionPlanningReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const ProductionPlanningReport: React.FC<ProductionPlanningReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<PlanningData | null>(null);

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

      const result = await reportService.getProductionPlanningReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Production Planning report:', error);
      toast.error('Failed to load Production Planning report');
    } finally {
      onLoadingChange(false);
    }
  };

  const filteredProducts = data?.ordersByProduct.filter(p =>
    p.productName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      {data && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Production Orders Status</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Count</TableHead>
                    <TableHead className='text-right'>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ordersByStatus.map((status, index) => (
                    <TableRow key={index}>
                      <TableCell className='font-medium'>{status.status}</TableCell>
                      <TableCell className='text-right'>{status.count}</TableCell>
                      <TableCell className='text-right'>{status.percentage.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Orders by Product</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className='text-right'>Orders</TableHead>
                    <TableHead className='text-right'>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className='font-medium'>{product.productName}</TableCell>
                      <TableCell className='text-right'>{product.orderCount}</TableCell>
                      <TableCell className='text-right'>{product.quantity}</TableCell>
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

export default ProductionPlanningReport;
