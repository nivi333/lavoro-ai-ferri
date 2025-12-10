import React from 'react';
import { Table } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

interface SalesSummaryData {
  key: string;
  product: string;
  customer: string;
  quantity: number;
  revenue: number;
  date: string;
}

interface SalesSummaryReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const SalesSummaryReport: React.FC<SalesSummaryReportProps> = ({ data, loading, searchText }) => {
  const columns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      sorter: (a: SalesSummaryData, b: SalesSummaryData) => a.product.localeCompare(b.product),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: SalesSummaryData) =>
        record.product.toLowerCase().includes(String(value).toLowerCase()) ||
        record.customer.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a: SalesSummaryData, b: SalesSummaryData) => a.quantity - b.quantity,
    },
    {
      title: 'Revenue (₹)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => revenue.toFixed(2),
      sorter: (a: SalesSummaryData, b: SalesSummaryData) => a.revenue - b.revenue,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: SalesSummaryData, b: SalesSummaryData) => a.date.localeCompare(b.date),
    },
  ] as any;

  const getTableData = () => {
    if (!data || !data.sales) return [];

    return data.sales.map((item: any, index: number) => ({
      key: `sale-${index}`,
      product: item.productName || item.product,
      customer: item.customerName || item.customer || 'N/A',
      quantity: item.quantity || 0,
      revenue: item.revenue || item.amount || 0,
      date: item.date || item.saleDate || new Date().toISOString().split('T')[0],
    }));
  };

  return (
    <div className='report-content-section'>
      <div className='report-data'>
        <Table
          columns={columns}
          dataSource={getTableData()}
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default SalesSummaryReport;
