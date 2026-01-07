import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { BalanceSheetReport as BalanceSheetData } from '@/services/reportTypes';
import ReportSummaryCards from '@/components/reports/shared/ReportSummaryCards';
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/globalComponents';
import { toast } from 'sonner';

interface BalanceSheetReportProps {
  asOfDate: Date | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({
  asOfDate,
  // searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  const fetchData = async () => {
    setLoading(true);
    onLoadingChange(true);
    try {
      const dateStr = asOfDate ? format(asOfDate, 'yyyy-MM-dd') : undefined;
      const result = await reportService.getBalanceSheet(dateStr);
      setData(result);
    } catch (error) {
      console.error('Error fetching Balance Sheet:', error);
      toast.error('Failed to load Balance Sheet');
    } finally {
      setLoading(false);
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

  const cards = data
    ? [
        {
          title: 'Total Assets',
          value: formatCurrency(data.summary.totalAssets),
          color: '#2563eb', // blue
        },
        {
          title: 'Total Liabilities',
          value: formatCurrency(data.summary.totalLiabilities),
          color: '#dc2626', // red
        },
        {
          title: 'Total Equity',
          value: formatCurrency(data.summary.totalEquity),
          color: '#16a34a', // green
        },
      ]
    : [];

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Assets Section */}
          <div className='space-y-6'>
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Current Assets</h3>
              <div className='rounded-md border bg-card'>
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.assets.currentAssets.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className='font-bold bg-muted/50'>
                      <TableCell>Total Current Assets</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.assets.totalCurrentAssets)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </DataTable>
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Fixed Assets</h3>
              <div className='rounded-md border bg-card'>
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.assets.fixedAssets.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className='font-bold bg-muted/50'>
                      <TableCell>Total Fixed Assets</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.assets.totalFixedAssets)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </DataTable>
              </div>
            </div>
          </div>

          {/* Liabilities & Equity Section */}
          <div className='space-y-6'>
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Current Liabilities</h3>
              <div className='rounded-md border bg-card'>
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.liabilities.currentLiabilities.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className='font-bold bg-muted/50'>
                      <TableCell>Total Current Liabilities</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.liabilities.totalCurrentLiabilities)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </DataTable>
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Long Term Liabilities</h3>
              <div className='rounded-md border bg-card'>
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.liabilities.longTermLiabilities.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className='font-bold bg-muted/50'>
                      <TableCell>Total Long Term Liabilities</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.liabilities.totalLongTermLiabilities)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </DataTable>
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Equity</h3>
              <div className='rounded-md border bg-card'>
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.equity.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className='font-bold bg-muted/50'>
                      <TableCell>Total Equity</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(data.summary.totalEquity)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </DataTable>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheetReport;
