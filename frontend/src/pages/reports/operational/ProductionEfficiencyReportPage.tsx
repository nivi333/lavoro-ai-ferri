import React, { useState, useEffect } from 'react';
import { useHeader } from '../../../contexts/HeaderContext';
import {
  Typography,
  Table,
  Button,
  Space,
  Breadcrumb,
  DatePicker,
  Card,
  Select,
  Row,
  Col,
  Spin,
  Input,
} from 'antd';
import { DownloadOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import MainLayout from '../../../components/layout/MainLayout';
import { GradientButton } from '../../../components/ui';
import './ProductionEfficiencyReportPage.scss';
import dayjs from 'dayjs';

const { Title } = Typography;
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
  oee: number; // Overall Equipment Effectiveness
}

const ProductionEfficiencyReportPage: React.FC = () => {
  const { setHeaderActions } = useHeader();

  useEffect(() => {
    setHeaderActions(
      <GradientButton size='small' onClick={() => handleExportReport('pdf')}>
        Export Report
      </GradientButton>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedProductionLine, setSelectedProductionLine] = useState<string | null>(null);

  // Sample data - in a real app, this would come from an API call
  const productionData: ProductionData[] = [
    {
      id: '1',
      date: '2025-12-01',
      department: 'Spinning',
      productionLine: 'Line A',
      plannedOutput: 1000,
      actualOutput: 950,
      efficiency: 95,
      downtime: 45,
      qualityRate: 98.5,
      oee: 93.2,
    },
    {
      id: '2',
      date: '2025-12-02',
      department: 'Spinning',
      productionLine: 'Line A',
      plannedOutput: 1000,
      actualOutput: 980,
      efficiency: 98,
      downtime: 20,
      qualityRate: 99.0,
      oee: 97.0,
    },
    {
      id: '3',
      date: '2025-12-03',
      department: 'Spinning',
      productionLine: 'Line A',
      plannedOutput: 1000,
      actualOutput: 920,
      efficiency: 92,
      downtime: 60,
      qualityRate: 97.8,
      oee: 90.0,
    },
    {
      id: '4',
      date: '2025-12-01',
      department: 'Weaving',
      productionLine: 'Line B',
      plannedOutput: 800,
      actualOutput: 760,
      efficiency: 95,
      downtime: 30,
      qualityRate: 98.0,
      oee: 93.1,
    },
    {
      id: '5',
      date: '2025-12-02',
      department: 'Weaving',
      productionLine: 'Line B',
      plannedOutput: 800,
      actualOutput: 790,
      efficiency: 98.8,
      downtime: 15,
      qualityRate: 99.2,
      oee: 98.0,
    },
    {
      id: '6',
      date: '2025-12-03',
      department: 'Weaving',
      productionLine: 'Line B',
      plannedOutput: 800,
      actualOutput: 740,
      efficiency: 92.5,
      downtime: 50,
      qualityRate: 97.5,
      oee: 90.1,
    },
    {
      id: '7',
      date: '2025-12-01',
      department: 'Dyeing',
      productionLine: 'Line C',
      plannedOutput: 600,
      actualOutput: 580,
      efficiency: 96.7,
      downtime: 25,
      qualityRate: 98.3,
      oee: 95.0,
    },
    {
      id: '8',
      date: '2025-12-02',
      department: 'Dyeing',
      productionLine: 'Line C',
      plannedOutput: 600,
      actualOutput: 570,
      efficiency: 95.0,
      downtime: 35,
      qualityRate: 97.9,
      oee: 93.0,
    },
    {
      id: '9',
      date: '2025-12-03',
      department: 'Dyeing',
      productionLine: 'Line C',
      plannedOutput: 600,
      actualOutput: 590,
      efficiency: 98.3,
      downtime: 20,
      qualityRate: 99.1,
      oee: 97.4,
    },
  ];

  // Filter data based on selections
  const filteredData = productionData.filter(item => {
    const itemDate = dayjs(item.date);
    const inDateRange = itemDate.isAfter(dateRange[0]) && itemDate.isBefore(dateRange[1]);
    const matchesDepartment = !selectedDepartment || item.department === selectedDepartment;
    const matchesLine = !selectedProductionLine || item.productionLine === selectedProductionLine;

    return inDateRange && matchesDepartment && matchesLine;
  });

  // Get unique departments and production lines for filters
  const departments = [...new Set(productionData.map(item => item.department))];
  const productionLines = [...new Set(productionData.map(item => item.productionLine))];

  // Calculate summary metrics
  const totalPlannedOutput = filteredData.reduce((sum, item) => sum + item.plannedOutput, 0);
  const totalActualOutput = filteredData.reduce((sum, item) => sum + item.actualOutput, 0);
  const averageEfficiency =
    filteredData.reduce((sum, item) => sum + item.efficiency, 0) / filteredData.length || 0;
  const totalDowntime = filteredData.reduce((sum, item) => sum + item.downtime, 0);
  const averageOEE =
    filteredData.reduce((sum, item) => sum + item.oee, 0) / filteredData.length || 0;

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0], dates[1]]);
      // In a real app, you would fetch new data here
      setLoading(true);
      setTimeout(() => setLoading(false), 800); // Simulate API call
    }
  };

  const handleGenerateReport = () => {
    setLoading(true);
    // In a real app, you would fetch data from the API here
    setTimeout(() => setLoading(false), 800); // Simulate API call
  };

  const handleExportReport = (type: string) => {
    // In a real app, this would trigger a download of the report in the specified format
    console.log(`Exporting report as ${type}`);
  };

  const handleSaveConfiguration = () => {
    // In a real app, this would save the current report configuration
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
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      sorter: (a: ProductionData, b: ProductionData) => a.department.localeCompare(b.department),
    },
    {
      title: 'Production Line',
      dataIndex: 'productionLine',
      key: 'productionLine',
      sorter: (a: ProductionData, b: ProductionData) =>
        a.productionLine.localeCompare(b.productionLine),
    },
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
    {
      title: 'Downtime (min)',
      dataIndex: 'downtime',
      key: 'downtime',
      sorter: (a: ProductionData, b: ProductionData) => a.downtime - b.downtime,
    },
    {
      title: 'Quality Rate (%)',
      dataIndex: 'qualityRate',
      key: 'qualityRate',
      render: (value: number) => value.toFixed(1) + '%',
      sorter: (a: ProductionData, b: ProductionData) => a.qualityRate - b.qualityRate,
    },
    {
      title: 'OEE (%)',
      dataIndex: 'oee',
      key: 'oee',
      render: (value: number) => value.toFixed(1) + '%',
      sorter: (a: ProductionData, b: ProductionData) => a.oee - b.oee,
    },
  ];

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Breadcrumb
            items={[
              { title: 'Home', href: '/' },
              { title: 'Reports', href: '/reports' },
              { title: 'Operational Reports', href: '/reports/operational' },
              { title: 'Production Efficiency' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Production Efficiency Report</Title>
        </div>

        <div className='filters-section'>
          <Space size='middle'>
            <Input
              placeholder='Search data...'
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              allowClear
            />
            <RangePicker value={dateRange} onChange={handleDateRangeChange} />
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
            <GradientButton size='small' onClick={handleGenerateReport}>
              Generate Report
            </GradientButton>
          </Space>

          <Space>
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
    </MainLayout>
  );
};

export default ProductionEfficiencyReportPage;
