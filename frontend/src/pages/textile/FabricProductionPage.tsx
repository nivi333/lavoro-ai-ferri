import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Tag, 
  Dropdown, 
  Modal, 
  message,
  Card,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { 
  fabricProductionService, 
  FabricProduction, 
  FABRIC_TYPES, 
  QUALITY_GRADES 
} from '../../services/textileService';
import FabricProductionDrawer from '../../components/textile/FabricProductionDrawer';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const FabricProductionPage: React.FC = () => {
  const [fabrics, setFabrics] = useState<FabricProduction[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingFabric, setEditingFabric] = useState<FabricProduction | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    fabricType: '',
    qualityGrade: '',
    isActive: true,
    dateRange: null as any,
  });

  // Statistics
  const [stats, setStats] = useState({
    totalProduction: 0,
    activeRecords: 0,
    totalMeters: 0,
    avgQuality: 0,
  });

  useEffect(() => {
    fetchFabrics();
  }, [filters]);

  const fetchFabrics = async () => {
    try {
      setLoading(true);
      const queryFilters: any = {};
      
      if (filters.search) queryFilters.search = filters.search;
      if (filters.fabricType) queryFilters.fabricType = filters.fabricType;
      if (filters.qualityGrade) queryFilters.qualityGrade = filters.qualityGrade;
      if (filters.isActive !== undefined) queryFilters.isActive = filters.isActive;
      if (filters.dateRange) {
        queryFilters.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        queryFilters.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const data = await fabricProductionService.getFabricProductions(queryFilters);
      setFabrics(data);
      
      // Calculate statistics
      const totalMeters = data.reduce((sum, fabric) => sum + fabric.quantityMeters, 0);
      const activeCount = data.filter(fabric => fabric.isActive).length;
      const aGradeCount = data.filter(fabric => fabric.qualityGrade === 'A_GRADE').length;
      
      setStats({
        totalProduction: data.length,
        activeRecords: activeCount,
        totalMeters: Math.round(totalMeters),
        avgQuality: data.length > 0 ? Math.round((aGradeCount / data.length) * 100) : 0,
      });
    } catch (error) {
      console.error('Error fetching fabrics:', error);
      message.error('Failed to fetch fabric production data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFabric(null);
    setDrawerVisible(true);
  };

  const handleEdit = (fabric: FabricProduction) => {
    setEditingFabric(fabric);
    setDrawerVisible(true);
  };

  const handleDelete = async (fabricId: string) => {
    Modal.confirm({
      title: 'Delete Fabric Production',
      content: 'Are you sure you want to delete this fabric production record?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await fabricProductionService.deleteFabricProduction(fabricId);
          message.success('Fabric production deleted successfully');
          fetchFabrics();
        } catch (error) {
          console.error('Error deleting fabric:', error);
          message.error('Failed to delete fabric production');
        }
      },
    });
  };

  const handleDrawerClose = (shouldRefresh?: boolean) => {
    setDrawerVisible(false);
    setEditingFabric(null);
    if (shouldRefresh) {
      fetchFabrics();
    }
  };

  const getQualityGradeColor = (grade: string) => {
    switch (grade) {
      case 'A_GRADE': return 'green';
      case 'B_GRADE': return 'blue';
      case 'C_GRADE': return 'orange';
      case 'REJECT': return 'red';
      default: return 'default';
    }
  };

  const getFabricTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'COTTON': 'green',
      'SILK': 'purple',
      'WOOL': 'orange',
      'POLYESTER': 'blue',
      'NYLON': 'cyan',
      'LINEN': 'lime',
      'RAYON': 'magenta',
      'SPANDEX': 'red',
      'BLEND': 'gold',
    };
    return colors[type] || 'default';
  };

  const columns: ColumnsType<FabricProduction> = [
    {
      title: 'Fabric ID',
      dataIndex: 'fabricId',
      key: 'fabricId',
      width: 100,
      fixed: 'left',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Fabric Name',
      dataIndex: 'fabricName',
      key: 'fabricName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'fabricType',
      key: 'fabricType',
      width: 120,
      render: (type) => (
        <Tag color={getFabricTypeColor(type)}>
          {FABRIC_TYPES.find(t => t.value === type)?.label || type}
        </Tag>
      ),
    },
    {
      title: 'Composition',
      dataIndex: 'composition',
      key: 'composition',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Weight (GSM)',
      dataIndex: 'weightGsm',
      key: 'weightGsm',
      width: 100,
      align: 'right',
    },
    {
      title: 'Width (inches)',
      dataIndex: 'widthInches',
      key: 'widthInches',
      width: 100,
      align: 'right',
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div 
            style={{ 
              width: 16, 
              height: 16, 
              backgroundColor: color.toLowerCase(),
              border: '1px solid #d9d9d9',
              borderRadius: 2 
            }} 
          />
          {color}
        </div>
      ),
    },
    {
      title: 'Quantity (m)',
      dataIndex: 'quantityMeters',
      key: 'quantityMeters',
      width: 120,
      align: 'right',
      render: (quantity) => `${quantity.toLocaleString()} m`,
    },
    {
      title: 'Batch Number',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 120,
    },
    {
      title: 'Quality Grade',
      dataIndex: 'qualityGrade',
      key: 'qualityGrade',
      width: 120,
      render: (grade) => (
        <Tag color={getQualityGradeColor(grade)}>
          {QUALITY_GRADES.find(g => g.value === grade)?.label || grade}
        </Tag>
      ),
    },
    {
      title: 'Production Date',
      dataIndex: 'productionDate',
      key: 'productionDate',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: 'View Details',
                icon: <EyeOutlined />,
                onClick: () => handleEdit(record),
              },
              {
                key: 'edit',
                label: 'Edit',
                icon: <EditOutlined />,
                onClick: () => handleEdit(record),
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                label: 'Delete',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDelete(record.fabricId),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="fabric-production-page">
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Production"
              value={stats.totalProduction}
              prefix={<span style={{ color: '#1890ff' }}>📊</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Records"
              value={stats.activeRecords}
              prefix={<span style={{ color: '#52c41a' }}>✅</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Meters"
              value={stats.totalMeters}
              suffix="m"
              prefix={<span style={{ color: '#722ed1' }}>📏</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="A-Grade Quality"
              value={stats.avgQuality}
              suffix="%"
              prefix={<span style={{ color: '#fa8c16' }}>⭐</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <div>
          <h2 style={{ margin: 0 }}>🧶 Fabric Production</h2>
          <p style={{ margin: 0, color: '#666' }}>
            Manage fabric production records and quality control
          </p>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />}>Export</Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
          >
            Add Fabric Production
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="Search fabrics..."
              allowClear
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Fabric Type"
              allowClear
              value={filters.fabricType || undefined}
              onChange={(value) => setFilters(prev => ({ ...prev, fabricType: value || '' }))}
              style={{ width: '100%' }}
            >
              {FABRIC_TYPES.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Quality Grade"
              allowClear
              value={filters.qualityGrade || undefined}
              onChange={(value) => setFilters(prev => ({ ...prev, qualityGrade: value || '' }))}
              style={{ width: '100%' }}
            >
              {QUALITY_GRADES.map(grade => (
                <Option key={grade.value} value={grade.value}>{grade.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Status"
              value={filters.isActive}
              onChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}
              style={{ width: '100%' }}
            >
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <RangePicker
              placeholder={['Start Date', 'End Date']}
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={fabrics}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            total: fabrics.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} fabric production records`,
          }}
        />
      </Card>

      {/* Drawer */}
      <FabricProductionDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        fabric={editingFabric}
      />
    </div>
  );
};

export default FabricProductionPage;
