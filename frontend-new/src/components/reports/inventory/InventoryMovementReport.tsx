import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { InventoryMovementReport as MovementData } from '@/services/reportTypes';
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
import ReportChart from '@/components/reports/shared/ReportChart';

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

      const result = await reportService.getInventoryMovementReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Inventory Movement report:', error);
      toast.error('Failed to load Inventory Movement report');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const cards = data
    ? [
        {
          title: 'Total Movements',
          value: data.summary.totalMovements,
        },
        {
          title: 'Incoming',
          value: data.summary.incoming,
          color: '#16a34a', // green
        },
        {
          title: 'Outgoing',
          value: data.summary.outgoing,
          color: '#dc2626', // red
        },
        {
          title: 'Net Change',
          value: data.summary.netChange,
          color: data.summary.netChange >= 0 ? '#16a34a' : '#dc2626',
        },
      ]
    : [];

  const filteredItems = data?.movementsByProduct.filter(item =>
    item.productName.toLowerCase().includes(searchText.toLowerCase())
  );

  const chartData = data?.movementTrend.map(item => ({
    name: item.date,
    In: item.incoming,
    Out: item.outgoing,
  }));

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <>
          <ReportChart
            data={chartData || []}
            title='Movement Trend'
            bars={[
              { key: 'In', color: '#16a34a' },
              { key: 'Out', color: '#dc2626' },
            ]}
          />

          <TableCard title='Product Movements'>
            <Table>
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
            </Table>
          </TableCard>
        </>
      )}
    </div>
  );
};

export default InventoryMovementReport;
