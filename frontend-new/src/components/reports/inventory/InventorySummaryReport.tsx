import React, { useEffect, useState } from 'react';
import { reportService } from '@/services/reportService';
import { InventorySummaryReport as InventorySummaryData } from '@/services/reportTypes';
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

interface InventorySummaryReportProps {
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const InventorySummaryReport: React.FC<InventorySummaryReportProps> = ({
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<InventorySummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  const fetchData = async () => {
    setLoading(true);
    onLoadingChange(true);
    try {
      const result = await reportService.getInventorySummary();
      setData(result);
    } catch (error) {
      console.error('Error fetching Inventory Summary:', error);
      toast.error('Failed to load Inventory Summary report');
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
          title: 'Total Items',
          value: data.summary.totalItems,
        },
        {
          title: 'Total Quantity',
          value: data.summary.totalQuantity,
        },
        {
          title: 'Total Value',
          value: formatCurrency(data.summary.totalValue),
          color: '#16a34a',
        },
        {
          title: 'Low Stock Items',
          value: data.summary.lowStockCount,
          color: data.summary.lowStockCount > 0 ? '#dc2626' : undefined,
        },
      ]
    : [];

  const filteredLocations = data?.stockByLocation.filter(l =>
    l.locationName?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <TableCard title='Stock by Location'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead className='text-right'>Items</TableHead>
                  <TableHead className='text-right'>Total Qty</TableHead>
                  <TableHead className='text-right'>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations?.map((loc, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{loc.locationName}</TableCell>
                    <TableCell className='text-right'>{loc.itemCount}</TableCell>
                    <TableCell className='text-right'>{loc.totalQuantity}</TableCell>
                    <TableCell className='text-right'>{formatCurrency(loc.totalValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          <TableCard title='Top Products by Value'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className='text-right'>Qty</TableHead>
                  <TableHead className='text-right'>Unit Price</TableHead>
                  <TableHead className='text-right'>Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topProductsByValue.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className='font-medium'>{product.productName}</div>
                      <div className='text-xs text-muted-foreground'>{product.productCode}</div>
                    </TableCell>
                    <TableCell className='text-right'>
                      {product.quantityOnHand} {product.unitOfMeasure}
                    </TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(product.unitPrice)}
                    </TableCell>
                    <TableCell className='text-right font-medium'>
                      {formatCurrency(product.totalValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>
      )}
    </div>
  );
};

export default InventorySummaryReport;
