import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Select,
  DatePicker,
  Table,
  Space,
  Spin,
  message,
} from 'antd';
import { SearchOutlined, DownloadOutlined, SaveOutlined } from '@ant-design/icons';
import { reportService } from '../../../services/reportService';
import '../../../pages/reports/shared/ReportStyles.scss';
import dayjs from 'dayjs';
import { GradientButton } from '../../ui';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface ProductionData {
  id: string;
  date: string;
  department: string;
  productionLine: string;
  plannedOutput: number;
  actualOutput: number;
  efficiency: number;
  downtime: number;
  qualityRate: number;
  oee: number;
}

const ProductionEfficiencyReport: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(false);
  // const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  // const [selectedProductionLine, setSelectedProductionLine] = useState<string | null>(null);
  const [productionData, setProductionData] = useState<ProductionData[]>([]);

  const fetchProductionData = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportService.getProductionEfficiencyReport(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      );

      // Map API response to table data
      // API returns efficiencyByDay which matches some fields
      const mappedData: ProductionData[] = response.efficiencyByDay.map((item, index) => ({
        id: `prod-${index}`,
        date: item.date,
        department: 'N/A', // Not in API response
        productionLine: 'N/A', // Not in API response
        plannedOutput: item.planned,
        actualOutput: item.actual,
        efficiency: item.efficiency,
        downtime: 0, // Not in daily breakdown, maybe in summary or other lists
        qualityRate: 0,
        oee: 0,
      }));

      setProductionData(mappedData);
    } catch (error) {
      console.error('Error fetching production data:', error);
      message.error('Failed to fetch production data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchProductionData();
  }, [fetchProductionData]);

  const filteredData = productionData; // Client-side filtering can be added back if needed, but for now we trust the API date range

  // ... (summary calculations might need to be adjusted or taken from response.summary directly if available in state)
  // But let's keep the client-side calc if we have the list.

  const totalPlannedOutput = filteredData.reduce((sum, item) => sum + item.plannedOutput, 0);
  const totalActualOutput = filteredData.reduce((sum, item) => sum + item.actualOutput, 0);
  const averageEfficiency =
    filteredData.reduce((sum, item) => sum + item.efficiency, 0) / (filteredData.length || 1);
  const totalDowntime = filteredData.reduce((sum, item) => sum + item.downtime, 0);
  const averageOEE =
    filteredData.reduce((sum, item) => sum + item.oee, 0) / (filteredData.length || 1);

  // ... columns ...

  // Filters for department and production line are not supported by the current API response structure
  // const departments = [...new Set(productionData.map(item => item.department))];
  // const productionLines = [...new Set(productionData.map(item => item.productionLine))];

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const handleGenerateReport = () => {
    fetchProductionData();
  };

  const handleExportReport = (type: string) => {
    console.log(`Exporting report as ${type}`);
  };

  const handleSaveConfiguration = () => {
    console.log('Saving report configuration');
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => dayjs(text).format('MMM DD, YYYY'),
      sorter: (a: ProductionData, b: ProductionData) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    // Department and Production Line colums removed as data is not available per day in this report type
    // {
    //   title: 'Department',
    //   dataIndex: 'department',
    //   key: 'department',
    //   sorter: (a: ProductionData, b: ProductionData) => a.department.localeCompare(b.department),
    // },
    // {
    //   title: 'Production Line',
    //   dataIndex: 'productionLine',
    //   key: 'productionLine',
    //   sorter: (a: ProductionData, b: ProductionData) =>
    //     a.productionLine.localeCompare(b.productionLine),
    // },
    {
      title: 'Planned Output',
      dataIndex: 'plannedOutput',
      key: 'plannedOutput',
      sorter: (a: ProductionData, b: ProductionData) => a.plannedOutput - b.plannedOutput,
    },
    {
      title: 'Actual Output',
      dataIndex: 'actualOutput',
      key: 'actualOutput',
      sorter: (a: ProductionData, b: ProductionData) => a.actualOutput - b.actualOutput,
    },
    {
      title: 'Efficiency (%)',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (value: number) => value.toFixed(1) + '%',
      sorter: (a: ProductionData, b: ProductionData) => a.efficiency - b.efficiency,
    },
    // Downtime ...
  ];

  return (
    <div className='report-container'>
      <div className='filters-section'>
        <Space size='middle' wrap>
          <Input
            placeholder='Search data...'
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
          />
          <RangePicker value={dateRange} onChange={handleDateRangeChange} />
          {/* Filters removed 
          <Select
            placeholder='All Departments'
            style={{ width: 200 }}
            allowClear
            onChange={value => setSelectedDepartment(value)}
          >
            {departments.map(dept => (
              <Option key={dept} value={dept}>
                {dept}
              </Option>
            ))}
          </Select>
          <Select
            placeholder='All Lines'
            style={{ width: 150 }}
            allowClear
            onChange={value => setSelectedProductionLine(value)}
          >
            {productionLines.map(line => (
              <Option key={line} value={line}>
                {line}
              </Option>
            ))}
          </Select>
          */}
          <GradientButton size='small' onClick={handleGenerateReport}>
            Generate Report
          </GradientButton>
        </Space>

        <Space style={{ marginTop: 16 }}>
          <Button icon={<SaveOutlined />} onClick={handleSaveConfiguration}>
            Save Configuration
          </Button>
          <Select
            defaultValue='pdf'
            style={{ width: 120 }}
            dropdownRender={menu => (
              <div>
                {menu}
                <div style={{ padding: '8px', textAlign: 'center' }}>
                  <Button
                    type='primary'
                    icon={<DownloadOutlined />}
                    onClick={() => handleExportReport('pdf')}
                    block
                  >
                    Export
                  </Button>
                </div>
              </div>
            )}
          >
            <Option value='pdf'>PDF</Option>
            <Option value='excel'>Excel</Option>
            <Option value='csv'>CSV</Option>
          </Select>
        </Space>
      </div>

      <div className='report-summary-section'>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card className='summary-card'>
              <div className='summary-title'>Planned Output</div>
              <div className='summary-value'>{totalPlannedOutput.toLocaleString()}</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card className='summary-card'>
              <div className='summary-title'>Actual Output</div>
              <div className='summary-value'>{totalActualOutput.toLocaleString()}</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card className='summary-card'>
              <div className='summary-title'>Efficiency</div>
              <div className='summary-value'>{averageEfficiency.toFixed(1)}%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card className='summary-card'>
              <div className='summary-title'>Total Downtime</div>
              <div className='summary-value'>{totalDowntime} min</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card className='summary-card'>
              <div className='summary-title'>Average OEE</div>
              <div className='summary-value'>{averageOEE.toFixed(1)}%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card className='summary-card'>
              <div className='summary-title'>Records</div>
              <div className='summary-value'>{filteredData.length}</div>
            </Card>
          </Col>
        </Row>
      </div>

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
              dataSource={filteredData}
              rowKey='id'
              pagination={false}
              size='middle'
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionEfficiencyReport;
