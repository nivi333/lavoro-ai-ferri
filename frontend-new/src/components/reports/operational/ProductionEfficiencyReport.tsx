import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { ProductionEfficiencyReport as EfficiencyData } from '@/services/reportTypes';

import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface ProductionEfficiencyReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const ProductionEfficiencyReport: React.FC<ProductionEfficiencyReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<EfficiencyData | null>(null);

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

      const result = await reportService.getProductionEfficiencyReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Production Efficiency report:', error);
      toast.error('Failed to load Production Efficiency report');
    } finally {
      onLoadingChange(false);
    }
  };
  const filteredMachines = data?.efficiencyByMachine.filter(m =>
    m.machineName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      {data && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Efficiency by Machine</h3>
          <div className='rounded-md border bg-card'>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead className='text-right'>Efficiency</TableHead>
                  <TableHead className='text-right'>Runtime (hrs)</TableHead>
                  <TableHead className='text-right'>Downtime (hrs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines?.map((machine, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{machine.machineName}</TableCell>
                    <TableCell className='text-right font-medium'>
                      <span
                        className={machine.efficiency >= 80 ? 'text-green-600' : 'text-yellow-600'}
                      >
                        {machine.efficiency.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className='text-right'>{machine.runtime.toFixed(2)}</TableCell>
                    <TableCell className='text-right text-red-600'>
                      {machine.downtime.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionEfficiencyReport;
