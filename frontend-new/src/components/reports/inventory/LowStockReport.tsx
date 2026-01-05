import React, { useEffect, useState } from 'react';
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
import { TableCard, StatusBadge } from '@/components/globalComponents';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  const fetchData = async () => {
    setLoading(true);
    onLoadingChange(true);
    try {
      const result = await reportService.getLowStockReport();
      setData(result);
    } catch (error) {
      console.error('Error fetching Low Stock report:', error);
      toast.error('Failed to load Low Stock report');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const cards = data
    ? [
        {
          title: 'Total Low Stock Items',
          value: data.summary.totalLowStockItems,
          color: '#eab308', // yellow
        },
        {
          title: 'Critical Level Items',
          value: data.summary.criticalItems,
          color: '#dc2626', // red
        },
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
        <TableCard title='Low Stock Items'>
          <Table>
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
                      <StatusBadge
                        status={item.status || 'WARNING'}
                        variant={item.status === 'CRITICAL' ? 'rejected' : 'warning'}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
};

export default LowStockReport;
