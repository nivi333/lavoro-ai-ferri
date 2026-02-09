import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { InventorySummaryReport as InventorySummaryData } from '@/services/reportTypes';
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
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
  const lastTriggerRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastTriggerRef.current !== triggerFetch) {
      lastTriggerRef.current = triggerFetch;
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerFetch]);

  const fetchData = async () => {
    if (loading) return;

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

  const filteredLocations = data?.stockByLocation.filter(l =>
    l.locationName?.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <span className='ml-2 text-muted-foreground'>Loading report data...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {data && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Stock by Location</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
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
              </DataTable>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Top Products by Value</h3>
            <div className='rounded-md border bg-card'>
              <DataTable>
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
              </DataTable>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySummaryReport;
