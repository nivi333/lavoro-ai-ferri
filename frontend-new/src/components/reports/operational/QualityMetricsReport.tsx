import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { QualityMetricsReport as QualityData } from '@/services/reportTypes';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

  const cards = data
    ? [
        {
          title: 'Average Quality Score',
          value: `${data.summary.averageQualityScore}/100`,
          color: data.summary.averageQualityScore >= 90 ? '#16a34a' : '#eab308',
        },
        {
          title: 'Pass Rate',
          value: `${data.summary.passRate}%`,
          color: '#16a34a',
        },
        {
          title: 'Defect Rate',
          value: `${data.summary.defectRate}%`,
          color: '#dc2626',
        },
        {
          title: 'Total Defects',
          value: data.summary.totalDefects,
          color: '#dc2626',
        },
      ]
    : [];

  const filteredProducts = data?.qualityByProduct.filter(p =>
    p.productName.toLowerCase().includes(searchText.toLowerCase())
  );

  const chartData = data?.qualityTrend.map(item => ({
    name: item.date,
    Score: item.averageScore,
    PassRate: item.passRate,
  }));

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <>
          <ReportChart title='Quality Trend' loading={loading}>
            <BarChart data={chartData || []}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='Score' fill='#8884d8' />
              <Bar dataKey='PassRate' fill='#82ca9d' />
            </BarChart>
          </ReportChart>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <TableCard title='Quality by Product'>
              <Table>
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
                      <TableCell className='text-right'>{product.averageScore}</TableCell>
                      <TableCell className='text-right text-red-600'>
                        {product.defectCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>

            <TableCard title='Defects by Type'>
              <Table>
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
                      <TableCell className='text-right'>{defect.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          </div>
        </>
      )}
    </div>
  );
};

export default QualityMetricsReport;
