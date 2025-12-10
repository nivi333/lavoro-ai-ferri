import React from 'react';
import { Table, Space, Select } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

const { Option } = Select;

interface GSTData {
  key: string;
  transaction: string;
  gstType: string;
  amount: number;
  gstAmount: number;
}

interface GSTReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
  period?: string;
  setPeriod?: (period: string) => void;
}

const GSTReport: React.FC<GSTReportProps> = ({ data, loading, searchText, period, setPeriod }) => {
  const columns = [
    {
      title: 'Transaction',
      dataIndex: 'transaction',
      key: 'transaction',
      sorter: (a: GSTData, b: GSTData) => a.transaction.localeCompare(b.transaction),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: GSTData) =>
        record.transaction.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'GST Type',
      dataIndex: 'gstType',
      key: 'gstType',
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount.toFixed(2),
      sorter: (a: GSTData, b: GSTData) => a.amount - b.amount,
    },
    {
      title: 'GST Amount (₹)',
      dataIndex: 'gstAmount',
      key: 'gstAmount',
      render: (gstAmount: number) => gstAmount.toFixed(2),
      sorter: (a: GSTData, b: GSTData) => a.gstAmount - b.gstAmount,
    },
  ] as any;

  const getTableData = () => {
    if (!data || !data.transactions) return [];

    return data.transactions.map((item: any, index: number) => ({
      key: `transaction-${index}`,
      transaction: item.description || item.name,
      gstType: item.gstType || 'CGST+SGST',
      amount: item.amount || 0,
      gstAmount: item.gstAmount || 0,
    }));
  };

  return (
    <div className='report-content-section'>
      {setPeriod && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>Period:</span>
            <Select
              value={period || 'current-month'}
              onChange={setPeriod}
              style={{ width: 200 }}
              placeholder='Select Period'
            >
              <Option value='current-month'>Current Month</Option>
              <Option value='last-month'>Last Month</Option>
              <Option value='current-quarter'>Current Quarter</Option>
              <Option value='last-quarter'>Last Quarter</Option>
              <Option value='current-year'>Current Year</Option>
            </Select>
          </Space>
        </div>
      )}
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

export default GSTReport;
