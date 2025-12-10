import React from 'react';
import { Table, Select, Space } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

const { Option } = Select;

interface CustomerPurchaseData {
  key: string;
  customerCode: string;
  customerName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
}

interface CustomerPurchaseHistoryReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
  customerId?: string;
  setCustomerId?: (val: string) => void;
}

const CustomerPurchaseHistoryReport: React.FC<CustomerPurchaseHistoryReportProps> = ({
  data,
  loading,
  searchText,
  customerId,
  setCustomerId,
}) => {
  const columns = [
    {
      title: 'Customer Code',
      dataIndex: 'customerCode',
      key: 'customerCode',
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: CustomerPurchaseData) =>
        record.customerName.toLowerCase().includes(String(value).toLowerCase()) ||
        record.customerCode.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: (a: CustomerPurchaseData, b: CustomerPurchaseData) => a.totalOrders - b.totalOrders,
    },
    {
      title: 'Total Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      sorter: (a: CustomerPurchaseData, b: CustomerPurchaseData) => a.totalRevenue - b.totalRevenue,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Avg Order Value',
      dataIndex: 'averageOrderValue',
      key: 'averageOrderValue',
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Last Purchase',
      dataIndex: 'lastPurchaseDate',
      key: 'lastPurchaseDate',
    },
  ] as any;

  return (
    <div className='report-content-section'>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>Customer:</span>
          <Select
            value={customerId || 'all'}
            onChange={setCustomerId}
            style={{ width: 250 }}
            placeholder='Select Customer'
          >
            <Option value='all'>All Customers</Option>
            {/* Note: ideally we fetch customer list here or pass it as prop. 
                  For now, keeping basic structure. If customer list is dynamic, logic needs to be added. 
                  The original code didn't actually fetch customers to populate this dropdown dynamically! 
                  It just had "All Customers". 
              */}
          </Select>
        </Space>
      </div>

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

export default CustomerPurchaseHistoryReport;
