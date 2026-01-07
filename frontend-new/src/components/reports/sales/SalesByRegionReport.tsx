import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';

import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface SalesByRegionReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

interface RegionData {
  region: string;
  revenue: number;
  orderCount: number;
  percentage: number;
}

const SalesByRegionReport: React.FC<SalesByRegionReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<RegionData[] | null>(null);

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

      const result = await reportService.getSalesByRegionReport(startDate, endDate);
      setData(Array.isArray(result) ? result : [result]);
    } catch (error) {
      console.error('Error fetching Sales by Region report:', error);
      toast.error('Failed to load Sales by Region report');
    } finally {
      onLoadingChange(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const filteredData = data?.filter(r =>
    r.region?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      {/* Optional: Summary cards if we can aggregate from the region list locally or if API returns summary */}

      {filteredData && filteredData.length > 0 && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Regional Performance</h3>
          <div className='rounded-md border bg-card'>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead className='text-right'>Orders</TableHead>
                  <TableHead className='text-right'>Revenue</TableHead>
                  <TableHead className='text-right'>Share %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{item.region || 'Unknown'}</TableCell>
                    <TableCell className='text-right'>{item.orderCount}</TableCell>
                    <TableCell className='text-right'>{formatCurrency(item.revenue)}</TableCell>
                    <TableCell className='text-right'>{item.percentage}%</TableCell>
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

export default SalesByRegionReport;
