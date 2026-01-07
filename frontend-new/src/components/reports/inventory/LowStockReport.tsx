import React, { useEffect, useState } from 'react';
import { reportService } from '@/services/reportService';

import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  StatusBadge,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface LowStockReportProps {
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

interface LowStockItem {
  productId: string;
  productName: string;
  productCode: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  status: string; // 'Low', 'Critical', etc.
  locationName: string;
}

interface LowStockData {
  summary: {
    totalLowStockItems: number;
    criticalItems: number;
  };
  items: LowStockItem[];
}

const LowStockReport: React.FC<LowStockReportProps> = ({
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<LowStockData | null>(null);

  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  const fetchData = async () => {
    onLoadingChange(true);
    try {
      const result = await reportService.getLowStockReport();
      setData(result);
    } catch (error) {
      console.error('Error fetching Low Stock report:', error);
      toast.error('Failed to load Low Stock report');
    } finally {
      onLoadingChange(false);
    }
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
                <TableHead>Location</TableHead>
                <TableHead className='text-right'>Current Stock</TableHead>
                <TableHead className='text-right'>Reorder Level</TableHead>
                <TableHead className='text-right'>Shortage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems?.map((item, index) => {
                const shortage = Math.max(0, item.reorderLevel - item.currentStock);
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <div className='font-medium'>{item.productName}</div>
                      <div className='text-xs text-muted-foreground'>{item.productCode}</div>
                    </TableCell>
                    <TableCell>{item.locationName}</TableCell>
                    <TableCell className='text-right font-medium'>{item.currentStock}</TableCell>
                    <TableCell className='text-right'>{item.reorderLevel}</TableCell>
                    <TableCell className='text-right text-red-600'>{shortage}</TableCell>
                    <TableCell>
                      <StatusBadge variant={item.status === 'CRITICAL' ? 'error' : 'warning'}>
                        {item.status || 'WARNING'}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </div>
      )}
    </div>
  );
};

export default LowStockReport;
