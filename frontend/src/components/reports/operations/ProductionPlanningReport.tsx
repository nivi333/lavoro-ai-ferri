import React from 'react';
import { Table, Spin } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

interface ProductionPlanningReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const ProductionPlanningReport: React.FC<ProductionPlanningReportProps> = ({
  data,
  loading,
  searchText,
}) => {
  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: any) =>
        record.productName.toLowerCase().includes(String(value).toLowerCase()),
    },
    { title: 'Order Count', dataIndex: 'orderCount', key: 'orderCount' },
    { title: 'Total Quantity', dataIndex: 'quantity', key: 'quantity' },
  ];

  const getTableData = () => {
    if (!data || !data.ordersByProduct) return [];
    return data.ordersByProduct;
  };

  return (
    <div className='report-content-section'>
      <div className='report-data'>
        {loading ? (
          <div className='loading-container'>
            <Spin size='large' />
            <p>Generating report...</p>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={getTableData()}
            rowKey='productId'
            pagination={{ pageSize: 10 }}
            size='middle'
          />
        )}
      </div>
    </div>
  );
};

export default ProductionPlanningReport;
