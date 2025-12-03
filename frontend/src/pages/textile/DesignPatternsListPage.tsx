import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Tag, Row, Col, Select, Tooltip, App, Image } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { designPatternService, DesignPattern, DESIGN_CATEGORIES, DESIGN_STATUSES } from '../../services/textileService';
import { DesignPatternDrawer } from '../../components/textile/DesignPatternDrawer';
import { PageHeader } from '../../components/layout/PageHeader';
import { useDebounce } from '../../hooks/useDebounce';

const { Option } = Select;

export const DesignPatternsListPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DesignPattern[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    designCategory: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDesignId, setSelectedDesignId] = useState<string | undefined>(undefined);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');

  const debouncedSearch = useDebounce(searchText, 500);

  const fetchDesigns = async (page = 1, pageSize = 10) => {
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

      const response = await designPatternService.getDesignPatterns(queryParams);
      
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
      console.error('Error fetching designs:', error);
      message.error('Failed to load design patterns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns(pagination.current, pagination.pageSize);
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

  const handleCreate = () => {
    setSelectedDesignId(undefined);
    setDrawerMode('create');
    setDrawerVisible(true);
  };

  const handleEdit = (record: DesignPattern) => {
    setSelectedDesignId(record.id);
    setDrawerMode('edit');
    setDrawerVisible(true);
  };

  const handleDelete = (record: DesignPattern) => {
    modal.confirm({
      title: 'Delete Design Pattern',
      content: `Are you sure you want to delete design "${record.designName}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await designPatternService.deleteDesignPattern(record.id);
          message.success('Design pattern deleted successfully');
          fetchDesigns(pagination.current, pagination.pageSize);
        } catch (error) {
          console.error('Error deleting design:', error);
          message.error('Failed to delete design pattern');
        }
      },
    });
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedDesignId(undefined);
  };

  const handleDrawerSuccess = () => {
    handleDrawerClose();
    fetchDesigns(pagination.current, pagination.pageSize);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CONCEPT: 'default',
      DRAFT: 'blue',
      REVIEW: 'orange',
      APPROVED: 'green',
      PRODUCTION: 'purple',
      ARCHIVED: 'gray',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Design ID',
      dataIndex: 'designId',
      key: 'designId',
      width: 120,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: 'Preview',
      dataIndex: 'sampleImageUrl',
      key: 'sampleImageUrl',
      width: 80,
      render: (url: string) => (
        url ? (
          <Image
            src={url}
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9teleIlXQqI0bQnnfNBbiqhKKhFz0xB+z4G7SzUvBIEnHo0ox9xsMjYAChmkThGvADI8nHIwVwC0bgxyHOE3Rg5im+YjBqFvFz8A"
          />
        ) : (
          <div style={{ width: 50, height: 50, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            N/A
          </div>
        )
      ),
    },
    {
      title: 'Design Name',
      dataIndex: 'designName',
      key: 'designName',
      width: 200,
    },
    {
      title: 'Category',
      dataIndex: 'designCategory',
      key: 'designCategory',
      width: 120,
      render: (category: string) => {
        const categoryLabel = DESIGN_CATEGORIES.find(c => c.value === category)?.label || category;
        return <Tag>{categoryLabel}</Tag>;
      },
    },
    {
      title: 'Designer',
      dataIndex: 'designerName',
      key: 'designerName',
      width: 150,
      render: (name: string) => name || '—',
    },
    {
      title: 'Season',
      dataIndex: 'season',
      key: 'season',
      width: 100,
      render: (season: string) => season || '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusLabel = DESIGN_STATUSES.find(s => s.value === status)?.label || status;
        return <Tag color={getStatusColor(status)}>{statusLabel}</Tag>;
      },
    },
    {
      title: 'Colors',
      dataIndex: 'colorPalette',
      key: 'colorPalette',
      width: 150,
      render: (colors: string[]) => (
        <Space size={4}>
          {colors?.slice(0, 4).map((color, index) => (
            <div
              key={index}
              style={{
                width: 20,
                height: 20,
                backgroundColor: color,
                borderRadius: 4,
                border: '1px solid #d9d9d9',
              }}
              title={color}
            />
          ))}
          {colors?.length > 4 && <span>+{colors.length - 4}</span>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: DesignPattern) => (
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
        title="Design & Patterns"
        subtitle="Manage design patterns and collections"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Design
          </Button>
        }
      />

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by design name..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Category"
              value={filters.designCategory}
              onChange={(value) => handleFilterChange('designCategory', value)}
              allowClear
              style={{ width: '100%' }}
            >
              {DESIGN_CATEGORIES.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
              style={{ width: '100%' }}
            >
              {DESIGN_STATUSES.map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchDesigns(pagination.current, pagination.pageSize)}
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

      <DesignPatternDrawer
        visible={drawerVisible}
        mode={drawerMode}
        designId={selectedDesignId}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
};

export default DesignPatternsListPage;
