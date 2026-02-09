import React, { useEffect, useState, useRef } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const lastTriggerRef = useRef<number | null>(null);

  useEffect(() => {
    // Fetch on initial load or when triggerFetch changes (user clicked Generate)
    if (lastTriggerRef.current !== triggerFetch) {
      lastTriggerRef.current = triggerFetch;
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerFetch]);

  const fetchData = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      return;
    }

    if (loading) return; // Prevent duplicate calls

    setLoading(true);
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
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const filteredMachines = data?.utilizationByMachine.filter(m =>
    m.machineName.toLowerCase().includes(searchText.toLowerCase())
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
