import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { ProductionPlanningReport as PlanningData } from '@/services/reportTypes';
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

interface ProductionPlanningReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const ProductionPlanningReport: React.FC<ProductionPlanningReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<PlanningData | null>(null);
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

      const result = await reportService.getProductionPlanningReport(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error('Error fetching Production Planning report:', error);
      toast.error('Failed to load Production Planning report');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const cards = data
    ? [
        {
          title: 'Total Orders',
          value: data.summary.totalOrders,
        },
        {
          title: 'On-Time Completion',
          value: `${data.summary.onTimeCompletionRate}%`,
          color: data.summary.onTimeCompletionRate >= 90 ? '#16a34a' : '#eab308',
        },
        {
          title: 'In Progress',
          value: data.summary.inProgressOrders,
          color: '#2563eb',
        },
        {
          title: 'Pending',
          value: data.summary.pendingOrders,
          color: '#eab308',
        },
      ]
    : [];

  const filteredProducts = data?.ordersByProduct.filter(p =>
    p.productName.toLowerCase().includes(searchText.toLowerCase())
  );

  const chartData = data?.capacityUtilization.map(item => ({
    name: item.date,
    Utilization: item.utilization,
    Planned: item.planned,
  }));

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <>
          <ReportChart title='Capacity Utilization' loading={loading}>
            <BarChart data={chartData || []}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='Utilization' fill='#8884d8' />
              <Bar dataKey='Planned' fill='#82ca9d' />
            </BarChart>
          </ReportChart>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <TableCard title='Production Orders Status'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Count</TableHead>
                    <TableHead className='text-right'>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ordersByStatus.map((status, index) => (
                    <TableRow key={index}>
                      <TableCell className='font-medium'>{status.status}</TableCell>
                      <TableCell className='text-right'>{status.count}</TableCell>
                      <TableCell className='text-right'>{status.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>

            <TableCard title='Orders by Product'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className='text-right'>Orders</TableHead>
                    <TableHead className='text-right'>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className='font-medium'>{product.productName}</TableCell>
                      <TableCell className='text-right'>{product.orderCount}</TableCell>
                      <TableCell className='text-right'>{product.quantity}</TableCell>
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

export default ProductionPlanningReport;
