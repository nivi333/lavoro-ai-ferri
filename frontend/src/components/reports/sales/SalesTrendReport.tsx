import React from 'react';
import { Table, Select, Space } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

const { Option } = Select;

interface SalesTrendData {
  key: string;
  period: string;
  sales: number;
  orders: number;
  avgOrderValue: number;
  growth: number;
}

interface SalesTrendReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
  groupBy?: string;
  setGroupBy?: (val: string) => void;
}

const SalesTrendReport: React.FC<SalesTrendReportProps> = ({
  data,
  loading,
  searchText,
  groupBy,
  setGroupBy,
}) => {
  const columns = [
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      sorter: (a: SalesTrendData, b: SalesTrendData) => {
        const aVal = a.period || '';
        const bVal = b.period || '';
        return aVal.localeCompare(bVal);
      },
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: SalesTrendData) =>
        (record.period || '').toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Sales (₹)',
      dataIndex: 'sales',
      key: 'sales',
      render: (sales: number) => (sales || 0).toFixed(2),
      sorter: (a: SalesTrendData, b: SalesTrendData) => (a.sales || 0) - (b.sales || 0),
    },
    {
      title: 'Orders',
      dataIndex: 'orders',
      key: 'orders',
      sorter: (a: SalesTrendData, b: SalesTrendData) => (a.orders || 0) - (b.orders || 0),
    },
    {
      title: 'Avg Order Value (₹)',
      dataIndex: 'avgOrderValue',
      key: 'avgOrderValue',
      render: (value: number) => (value || 0).toFixed(2),
      sorter: (a: SalesTrendData, b: SalesTrendData) =>
        (a.avgOrderValue || 0) - (b.avgOrderValue || 0),
    },
    {
      title: 'Growth (%)',
      dataIndex: 'growth',
      key: 'growth',
      render: (growth: number) => {
        const val = growth || 0;
        const color = val >= 0 ? '#52c41a' : '#ff4d4f';
        return <span style={{ color }}>{val.toFixed(2)}%</span>;
      },
      sorter: (a: SalesTrendData, b: SalesTrendData) => (a.growth || 0) - (b.growth || 0),
    },
  ] as any;

  const getTableData = () => {
    if (!data || !data.trends) return [];

    return data.trends.map((item: any, index: number) => ({
      key: `trend-${index}`,
      period: item.period || item.date || 'N/A',
      sales: item.totalSales || item.sales || 0,
      orders: item.totalOrders || item.orders || 0,
      avgOrderValue: item.averageOrderValue || item.avgOrderValue || 0,
      growth: item.growthRate || item.growth || 0,
    }));
  };

  return (
    <div className='report-content-section'>
      {/* Group By Filter specific to Trend Report - kept here as it's specific */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>Group By:</span>
          <Select value={groupBy} onChange={setGroupBy} style={{ width: 150 }}>
            <Option value='day'>Daily</Option>
            <Option value='week'>Weekly</Option>
            <Option value='month'>Monthly</Option>
            <Option value='quarter'>Quarterly</Option>
          </Select>
        </Space>
      </div>

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

export default SalesTrendReport;
