import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Tag, Row, Col, Select, DatePicker, Tooltip, App } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { garmentManufacturingService, GarmentManufacturing, GARMENT_TYPES, PRODUCTION_STAGES } from '../../services/textileService';
import { GarmentManufacturingDrawer } from '../../components/textile/GarmentManufacturingDrawer';
import { PageHeader } from '../../components/layout/PageHeader';
import { useDebounce } from '../../hooks/useDebounce';

const { Option } = Select;
const { RangePicker } = DatePicker;

export const GarmentManufacturingListPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GarmentManufacturing[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    garmentType: undefined as string | undefined,
    productionStage: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | undefined>(undefined);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');

  const debouncedSearch = useDebounce(searchText, 500);

  const fetchGarments = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const queryParams: any = {
        page,
        limit: pageSize,
        search: debouncedSearch,
        ...filters,
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(key => 
        queryParams[key] === undefined && delete queryParams[key]
      );

      const response = await garmentManufacturingService.getGarmentManufacturing(queryParams);
      
      if (Array.isArray(response)) {
          setData(response);
          setPagination({ ...pagination, current: page, pageSize, total: response.length });
      } else if ((response as any).data) {
           setData((response as any).data);
           setPagination({
               current: (response as any).pagination?.page || 1,
               pageSize: (response as any).pagination?.limit || 10,
               total: (response as any).pagination?.total || 0
           });
      }
      
    } catch (error) {
      console.error('Error fetching garments:', error);
      message.error('Failed to load garment manufacturing records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGarments(pagination.current, pagination.pageSize);
  }, [debouncedSearch, filters, pagination.current, pagination.pageSize]);

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setPagination({ ...pagination, current: 1 });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination({ ...pagination, current: 1 });
  };

  const handleDateRangeChange = (_dates: any, dateStrings: [string, string]) => {
    setFilters(prev => ({
      ...prev,
      startDate: dateStrings[0] || undefined,
      endDate: dateStrings[1] || undefined,
    }));
    setPagination({ ...pagination, current: 1 });
  };

  const handleCreate = () => {
    setSelectedGarmentId(undefined);
    setDrawerMode('create');
    setDrawerVisible(true);
  };

  const handleEdit = (record: GarmentManufacturing) => {
    setSelectedGarmentId(record.id);
    setDrawerMode('edit');
    setDrawerVisible(true);
  };

  const handleDelete = (record: GarmentManufacturing) => {
    modal.confirm({
      title: 'Delete Garment Record',
      content: `Are you sure you want to delete garment "${record.styleNumber}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await garmentManufacturingService.deleteGarmentManufacturing(record.id);
          message.success('Garment record deleted successfully');
          fetchGarments(pagination.current, pagination.pageSize);
        } catch (error) {
          console.error('Error deleting garment:', error);
          message.error('Failed to delete garment record');
        }
      },
    });
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedGarmentId(undefined);
  };

  const handleDrawerSuccess = () => {
    handleDrawerClose();
    fetchGarments(pagination.current, pagination.pageSize);
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      CUTTING: 'blue',
      SEWING: 'orange',
      FINISHING: 'purple',
      PACKING: 'cyan',
      COMPLETED: 'green',
    };
    return colors[stage] || 'default';
  };

  const columns = [
    {
      title: 'Garment ID',
      dataIndex: 'garmentId',
      key: 'garmentId',
      width: 120,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: 'Style Number',
      dataIndex: 'styleNumber',
      key: 'styleNumber',
      width: 150,
    },
    {
      title: 'Type',
      dataIndex: 'garmentType',
      key: 'garmentType',
      width: 120,
      render: (type: string) => {
        const typeLabel = GARMENT_TYPES.find(t => t.value === type)?.label || type;
        return <Tag>{typeLabel}</Tag>;
      },
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 80,
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      width: 100,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: 'Stage',
      dataIndex: 'productionStage',
      key: 'productionStage',
      width: 120,
      render: (stage: string) => {
        const stageLabel = PRODUCTION_STAGES.find(s => s.value === stage)?.label || stage;
        return <Tag color={getStageColor(stage)}>{stageLabel}</Tag>;
      },
    },
    {
      title: 'Quality',
      dataIndex: 'qualityPassed',
      key: 'qualityPassed',
      width: 100,
      render: (passed: boolean) => (
        passed ? (
          <Tag icon={<CheckCircleOutlined />} color="success">Passed</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>
        )
      ),
    },
    {
      title: 'Defects',
      dataIndex: 'defectCount',
      key: 'defectCount',
      width: 80,
      render: (count: number) => (
        <Tag color={count > 0 ? 'red' : 'green'}>{count}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: GarmentManufacturing) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Garment Manufacturing"
        subtitle="Manage garment production records"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Garment
          </Button>
        }
      />

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search by style number..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Garment Type"
              value={filters.garmentType}
              onChange={(value) => handleFilterChange('garmentType', value)}
              allowClear
              style={{ width: '100%' }}
            >
              {GARMENT_TYPES.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Production Stage"
              value={filters.productionStage}
              onChange={(value) => handleFilterChange('productionStage', value)}
              allowClear
              style={{ width: '100%' }}
            >
              {PRODUCTION_STAGES.map(stage => (
                <Option key={stage.value} value={stage.value}>{stage.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchGarments(pagination.current, pagination.pageSize)}
            >
              Refresh
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} records`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      <GarmentManufacturingDrawer
        visible={drawerVisible}
        mode={drawerMode}
        garmentId={selectedGarmentId}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
};

export default GarmentManufacturingListPage;
