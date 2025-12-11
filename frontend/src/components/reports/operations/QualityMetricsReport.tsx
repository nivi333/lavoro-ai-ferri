import React from 'react';
import { Table, Spin } from 'antd';
import '../../../pages/reports/shared/ReportStyles.scss';

interface QualityData {
  productId: string;
  productName: string;
  averageScore: number;
  inspectionCount: number;
  defectCount: number;
}

interface QualityMetricsReportProps {
  data: any;
  loading: boolean;
  searchText?: string;
}

const QualityMetricsReport: React.FC<QualityMetricsReportProps> = ({
  data,
  loading,
  searchText,
}) => {
  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      sorter: (a: QualityData, b: QualityData) => a.productName.localeCompare(b.productName),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: QualityData) =>
        record.productName.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Inspections',
      dataIndex: 'inspectionCount',
      key: 'inspectionCount',
      sorter: (a: QualityData, b: QualityData) => a.inspectionCount - b.inspectionCount,
    },
    {
      title: 'Defects',
      dataIndex: 'defectCount',
      key: 'defectCount',
      sorter: (a: QualityData, b: QualityData) => a.defectCount - b.defectCount,
    },
    {
      title: 'Avg Score',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (val: number) => val.toFixed(2),
      sorter: (a: QualityData, b: QualityData) => a.averageScore - b.averageScore,
    },
  ] as any;

  const getTableData = () => {
    return data?.qualityByProduct || [];
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
            pagination={{ pageSize: 10 }}
            rowKey='productId'
            size='middle'
          />
        )}
      </div>
    </div>
  );
};

export default QualityMetricsReport;
