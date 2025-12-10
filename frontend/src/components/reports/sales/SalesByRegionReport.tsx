import React from 'react';
import { Table, Select, Space } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

const { Option } = Select;

interface SalesByRegionData {
  key: string;
  locationCode: string;
  locationName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProduct: string;
}

interface SalesByRegionReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
  locationId?: string;
  setLocationId?: (val: string) => void;
}

const SalesByRegionReport: React.FC<SalesByRegionReportProps> = ({
  data,
  loading,
  searchText,
  locationId,
  setLocationId,
}) => {
  const columns = [
    {
      title: 'Location Code',
      dataIndex: 'locationCode',
      key: 'locationCode',
    },
    {
      title: 'Location Name',
      dataIndex: 'locationName',
      key: 'locationName',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: SalesByRegionData) =>
        record.locationName.toLowerCase().includes(String(value).toLowerCase()) ||
        record.locationCode.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: (a: SalesByRegionData, b: SalesByRegionData) => a.totalOrders - b.totalOrders,
    },
    {
      title: 'Total Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      sorter: (a: SalesByRegionData, b: SalesByRegionData) => a.totalRevenue - b.totalRevenue,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Avg Order Value',
      dataIndex: 'averageOrderValue',
      key: 'averageOrderValue',
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Top Product',
      dataIndex: 'topProduct',
      key: 'topProduct',
    },
  ] as any;

  return (
    <div className='report-content-section'>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>Location:</span>
          <Select
            value={locationId || 'all'}
            onChange={setLocationId}
            style={{ width: 200 }}
            placeholder='Select Location'
          >
            <Option value='all'>All Locations</Option>
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

export default SalesByRegionReport;
