import React, { useEffect, useState, useRef } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { QualityMetricsReport as QualityData } from '@/services/reportTypes';

import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface QualityMetricsReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const QualityMetricsReport: React.FC<QualityMetricsReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<QualityData | null>(null);
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

      const result = await reportService.getQualityMetricsReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Quality Metrics report:', error);
      toast.error('Failed to load Quality Metrics report');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const filteredProducts = data?.qualityByProduct.filter(p =>
    p.productName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      {loading && (
        <div className='flex items-center justify-center py-16'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <span className='ml-2 text-muted-foreground'>Loading report data...</span>
        </div>
      )}

      {!data && !loading && (
        <div className='text-center py-12 text-muted-foreground'>
          <p>No quality metrics data available for the selected date range.</p>
          <p className='text-sm mt-2'>Click "Generate Report" to fetch data.</p>
        </div>
      )}

      {data && (
        <>
          {(!data.qualityByProduct || data.qualityByProduct.length === 0) &&
          (!data.defectsByType || data.defectsByType.length === 0) ? (
            <div className='text-center py-12 text-muted-foreground'>
              <p>No quality metrics data available for the selected date range.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {data.qualityByProduct && data.qualityByProduct.length > 0 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>Quality by Product</h3>
                  <div className='rounded-md border bg-card'>
                    <DataTable>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className='text-right'>Inspections</TableHead>
                          <TableHead className='text-right'>Avg Score</TableHead>
                          <TableHead className='text-right'>Defects</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts?.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className='font-medium'>{product.productName}</TableCell>
                            <TableCell className='text-right'>{product.inspectionCount}</TableCell>
                            <TableCell className='text-right'>
                              {product.averageScore.toFixed(2)}
                            </TableCell>
                            <TableCell className='text-right text-red-600'>
                              {product.defectCount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </DataTable>
                  </div>
                </div>
              )}

              {data.defectsByType && data.defectsByType.length > 0 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>Defects by Type</h3>
                  <div className='rounded-md border bg-card'>
                    <DataTable>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Defect Type</TableHead>
                          <TableHead className='text-right'>Count</TableHead>
                          <TableHead className='text-right'>Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.defectsByType.map((defect, index) => (
                          <TableRow key={index}>
                            <TableCell className='font-medium'>{defect.defectType}</TableCell>
                            <TableCell className='text-right'>{defect.count}</TableCell>
                            <TableCell className='text-right'>
                              {defect.percentage.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </DataTable>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QualityMetricsReport;
