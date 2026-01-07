import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { InventoryMovementReport as MovementData } from '@/services/reportTypes';
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface InventoryMovementReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const InventoryMovementReport: React.FC<InventoryMovementReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<MovementData | null>(null);

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

      const result = await reportService.getInventoryMovementReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Inventory Movement report:', error);
      toast.error('Failed to load Inventory Movement report');
    } finally {
      onLoadingChange(false);
    }
  };

  const filteredItems = data?.movementsByProduct.filter(item =>
    item.productName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      {data && (
        <div className='rounded-md border bg-card'>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className='text-right'>Incoming</TableHead>
                <TableHead className='text-right'>Outgoing</TableHead>
                <TableHead className='text-right'>Net Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className='font-medium'>{item.productName}</TableCell>
                  <TableCell className='text-right text-green-600'>+{item.incoming}</TableCell>
                  <TableCell className='text-right text-red-600'>-{item.outgoing}</TableCell>
                  <TableCell className='text-right font-bold'>{item.netChange}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </div>
      )}
    </div>
  );
};

export default InventoryMovementReport;
