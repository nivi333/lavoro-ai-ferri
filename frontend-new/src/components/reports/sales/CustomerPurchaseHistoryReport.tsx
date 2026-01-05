import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
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

interface CustomerPurchaseHistoryReportProps {
  dateRange: DateRange | undefined;
  searchText: string;
  triggerFetch: number;
  onLoadingChange: (loading: boolean) => void;
}

interface PurchaseHistoryData {
  customerName: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchaseDate: string;
  orders: {
    orderId: string;
    orderDate: string;
    amount: number;
    status: string;
  }[];
}

const CustomerPurchaseHistoryReport: React.FC<CustomerPurchaseHistoryReportProps> = ({
  dateRange,
  searchText,
  triggerFetch,
  onLoadingChange,
}) => {
  const [data, setData] = useState<PurchaseHistoryData[] | null>(null); // Expecting array of customers or detailed single customer if selected
  // For 'all', it might be a list of customers. The API endpoint implies 'customer-purchase-history' which often is for a specific customer or list if 'all'.
  // Let's assume it returns a list of customers with history summaries for the 'all' case or search.

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

      const result = await reportService.getCustomerPurchaseHistoryReport(
        'all',
        startDate,
        endDate
      );
      setData(Array.isArray(result) ? result : [result]); // Handle if single object or array
    } catch (error) {
      console.error('Error fetching Customer Purchase History:', error);
      toast.error('Failed to load Customer Purchase History');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredData = data?.filter(c =>
    c.customerName?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      {loading && <p>Loading...</p>}

      {/* If we have data, show a table of customers and their summary, expandable to show orders? 
           For simplicity in migration, just a table of Customer Summaries first. */}

      {filteredData && (
        <TableCard title='Customer Purchase Summaries'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className='text-right'>Total Orders</TableHead>
                <TableHead className='text-right'>Total Spent</TableHead>
                <TableHead className='text-right'>Last Purchase</TableHead>
                {/* <TableHead>Recent Order Status</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((customer, index) => (
                <TableRow key={index}>
                  <TableCell className='font-medium'>{customer.customerName}</TableCell>
                  <TableCell className='text-right'>{customer.totalOrders}</TableCell>
                  <TableCell className='text-right'>
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>
                  <TableCell className='text-right'>
                    {customer.lastPurchaseDate
                      ? new Date(customer.lastPurchaseDate).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
};

export default CustomerPurchaseHistoryReport;
