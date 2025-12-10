import React from 'react';
import { Table } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

interface TopProductData {
  key: string;
  rank: number;
  productCode: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  averagePrice: number;
}

interface TopSellingProductsReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const TopSellingProductsReport: React.FC<TopSellingProductsReportProps> = ({
  data,
  loading,
  searchText,
}) => {
  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
    },
    {
      title: 'Product Code',
      dataIndex: 'productCode',
      key: 'productCode',
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: TopProductData) =>
        record.productName.toLowerCase().includes(String(value).toLowerCase()) ||
        record.productCode.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Quantity Sold',
      dataIndex: 'quantitySold',
      key: 'quantitySold',
      sorter: (a: TopProductData, b: TopProductData) => a.quantitySold - b.quantitySold,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a: TopProductData, b: TopProductData) => a.revenue - b.revenue,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Avg Price',
      dataIndex: 'averagePrice',
      key: 'averagePrice',
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
  ] as any;

  return (
    <div className='report-content-section'>
      <div className='report-data'>
        <Table
          columns={columns}
          dataSource={data?.items || []}
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default TopSellingProductsReport;
