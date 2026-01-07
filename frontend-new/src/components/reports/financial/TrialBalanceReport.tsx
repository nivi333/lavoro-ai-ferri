import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { TrialBalanceReport as TrialBalanceData } from '@/services/reportTypes';
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

interface TrialBalanceReportProps {
  asOfDate: Date | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

const TrialBalanceReport: React.FC<TrialBalanceReportProps> = ({
  asOfDate,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [triggerFetch]);

  const fetchData = async () => {
    setLoading(true);
    onLoadingChange(true);
    try {
      const dateStr = asOfDate ? format(asOfDate, 'yyyy-MM-dd') : undefined;
      const result = await reportService.getTrialBalance(dateStr);
      setData(result);
    } catch (error) {
      console.error('Error fetching Trial Balance:', error);
      toast.error('Failed to load Trial Balance report');
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
          title: 'Total Debits',
          value: formatCurrency(data.summary.totalDebits),
        },
        {
          title: 'Total Credits',
          value: formatCurrency(data.summary.totalCredits),
        },
        {
          title: 'Difference',
          value: formatCurrency(data.summary.difference),
          color: data.summary.difference === 0 ? '#16a34a' : '#dc2626',
          suffix: data.summary.difference === 0 ? '(Balanced)' : '(Unbalanced)',
        },
      ]
    : [];

  const filteredAccounts = data?.accounts.filter(
    account =>
      account.accountName.toLowerCase().includes(searchText.toLowerCase()) ||
      account.accountCode.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      <ReportSummaryCards cards={cards} loading={loading} />

      {data && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Account Balances</h3>
          <div className='rounded-md border bg-card'>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className='text-right'>Debit</TableHead>
                  <TableHead className='text-right'>Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts?.map((account, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-mono'>{account.accountCode}</TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell className='text-right'>
                      {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                    </TableCell>
                    <TableCell className='text-right'>
                      {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className='font-bold bg-muted/50'>
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className='text-right'>
                    {formatCurrency(data.summary.totalDebits)}
                  </TableCell>
                  <TableCell className='text-right'>
                    {formatCurrency(data.summary.totalCredits)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </DataTable>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialBalanceReport;
