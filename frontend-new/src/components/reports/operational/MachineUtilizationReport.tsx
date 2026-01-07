import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { MachineUtilizationReport as UtilizationData } from '@/services/reportTypes';

import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface MachineUtilizationReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const MachineUtilizationReport: React.FC<MachineUtilizationReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<UtilizationData | null>(null);

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

      const result = await reportService.getMachineUtilizationReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Machine Utilization report:', error);
      toast.error('Failed to load Machine Utilization report');
    } finally {
      onLoadingChange(false);
    }
  };

  const filteredMachines = data?.utilizationByMachine.filter(m =>
    m.machineName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      {data && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Utilization Details</h3>
          <div className='rounded-md border bg-card'>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead className='text-right'>Utilization</TableHead>
                  <TableHead className='text-right'>Runtime</TableHead>
                  <TableHead className='text-right'>Downtime</TableHead>
                  <TableHead className='text-right'>Maintenance</TableHead>
                  <TableHead className='text-right'>Breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines?.map((machine, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{machine.machineName}</TableCell>
                    <TableCell className='text-right font-medium'>
                      {machine.utilization.toFixed(2)}%
                    </TableCell>
                    <TableCell className='text-right'>{machine.runtime.toFixed(2)}h</TableCell>
                    <TableCell className='text-right'>{machine.downtime.toFixed(2)}h</TableCell>
                    <TableCell className='text-right text-blue-600'>
                      {machine.maintenance.toFixed(2)}h
                    </TableCell>
                    <TableCell className='text-right text-red-600'>
                      {machine.breakdown.toFixed(2)}h
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

export default MachineUtilizationReport;
