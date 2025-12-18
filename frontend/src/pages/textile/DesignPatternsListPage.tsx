import { useState, useEffect, useRef } from 'react';
import { Table, Button, Tag, Dropdown, message, Empty, Spin, Input, Space, Select } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import {
  designPatternService,
  DesignPattern,
  DESIGN_CATEGORIES,
  DESIGN_STATUSES,
} from '../../services/textileService';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { DesignPatternDrawer } from '../../components/textile/DesignPatternDrawer';
import './TextileListPage.scss';

export default function DesignPatternsListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [designs, setDesigns] = useState<DesignPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<DesignPattern | undefined>(undefined);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton onClick={handleAddDesign} size='small' disabled={isEmployee}>
        New Design
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions, currentCompany?.role]);

  useEffect(() => {
    if (currentCompany) {
      fetchDesigns();
    }
  }, [currentCompany, searchText, categoryFilter, statusFilter]);

  const fetchDesigns = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const filters: any = {
        search: searchText || undefined,
        designCategory: categoryFilter,
        status: statusFilter,
      };
      const result = await designPatternService.getDesignPatterns(filters);
      setDesigns(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching designs:', error);
      message.error('Failed to fetch design patterns');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleAddDesign = () => {
    setEditingDesign(undefined);
    setDrawerOpen(true);
  };

  const handleEditDesign = (design: DesignPattern) => {
    setEditingDesign(design);
    setDrawerOpen(true);
  };

  const handleDeleteDesign = async (design: DesignPattern) => {
    try {
      setTableLoading(true);
      await designPatternService.deleteDesignPattern(design.id);
      message.success('Design pattern deleted successfully');
      fetchDesigns();
    } catch (error) {
      console.error('Error deleting design:', error);
      message.error('Failed to delete design pattern');
    } finally {
      setTableLoading(false);
    }
  };

  const handleDrawerClose = (shouldRefresh?: boolean) => {
    setDrawerOpen(false);
    setEditingDesign(undefined);
    if (shouldRefresh) {
      fetchDesigns();
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = DESIGN_CATEGORIES.find(c => c.value === category);
    return found ? found.label : category;
  };

  const getStatusLabel = (status: string) => {
    const found = DESIGN_STATUSES.find(s => s.value === status);
    return found ? found.label : status;
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
      render: (designId: string) => <span className='code-text'>{designId}</span>,
    },
    {
      title: 'Design Name',
      dataIndex: 'designName',
      key: 'designName',
      ellipsis: true,
      render: (name: string, record: DesignPattern) => (
        <div style={{ overflow: 'hidden' }}>
          <div
            className='primary-text'
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {name}
          </div>
          <div
            className='secondary-text'
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {record.designerName || '—'} • {record.season || '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'designCategory',
      key: 'designCategory',
      width: 120,
      ellipsis: true,
      render: (category: string) => <Tag>{getCategoryLabel(category)}</Tag>,
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'orange'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: DesignPattern) => {
        const isEmployee = currentCompany?.role === 'EMPLOYEE';
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditDesign(record),
            disabled: isEmployee,
          },
          { type: 'divider' as const },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteDesign(record),
            disabled: isEmployee,
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement='bottomRight'>
            <Button type='text' icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  if (!currentCompany) {
    return (
      <MainLayout>
        <div className='no-company-message'>Please select a company to manage design patterns.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2} className='page-title'>
            Design & Patterns
          </Heading>
        </div>

        <div className='filters-section'>
          <Space size='middle'>
            <Input
              placeholder='Search designs...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder='Category'
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 150 }}
              allowClear
            >
              {DESIGN_CATEGORIES.map(cat => (
                <Select.Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder='Status'
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              allowClear
            >
              {DESIGN_STATUSES.map(status => (
                <Select.Option key={status.value} value={status.value}>
                  {status.label}
                </Select.Option>
              ))}
            </Select>
          </Space>
        </div>

        <div className='table-container'>
          {loading ? (
            <div className='loading-container'>
              <Spin size='large' />
            </div>
          ) : designs.length === 0 ? (
            <Empty description='No design patterns found'>
              <GradientButton
                size='small'
                onClick={handleAddDesign}
                disabled={currentCompany?.role === 'EMPLOYEE'}
              >
                Create First Design
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={designs}
              rowKey={record => record.id}
              loading={tableLoading}
              pagination={{
                showSizeChanger: true,
                showTotal: total => `Total ${total} records`,
              }}
              className='textile-table'
            />
          )}
        </div>
      </div>

      <DesignPatternDrawer
        visible={drawerOpen}
        mode={editingDesign ? 'edit' : 'create'}
        designId={editingDesign?.designId}
        onClose={() => handleDrawerClose(false)}
        onSuccess={() => handleDrawerClose(true)}
      />
    </MainLayout>
  );
}

export { DesignPatternsListPage };
