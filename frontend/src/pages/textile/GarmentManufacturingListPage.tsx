import { useState, useEffect, useRef } from 'react';
import { Table, Button, Tag, Dropdown, message, Empty, Spin, Input, Space, Select } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import {
  garmentManufacturingService,
  GarmentManufacturing,
  GARMENT_TYPES,
  PRODUCTION_STAGES,
} from '../../services/textileService';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { GarmentManufacturingDrawer } from '../../components/textile/GarmentManufacturingDrawer';
import './TextileListPage.scss';

export default function GarmentManufacturingListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [garments, setGarments] = useState<GarmentManufacturing[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState<GarmentManufacturing | undefined>(undefined);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [garmentTypeFilter, setGarmentTypeFilter] = useState<string | undefined>(undefined);
  const [stageFilter, setStageFilter] = useState<string | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton onClick={handleAddGarment} size='small' disabled={isEmployee}>
        New Garment
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions, currentCompany?.role]);

  useEffect(() => {
    if (currentCompany) {
      fetchGarments();
    }
  }, [currentCompany, searchText, garmentTypeFilter, stageFilter]);

  const fetchGarments = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const filters: any = {
        search: searchText || undefined,
        garmentType: garmentTypeFilter,
        productionStage: stageFilter,
      };
      const result = await garmentManufacturingService.getGarmentManufacturing(filters);
      setGarments(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching garments:', error);
      message.error('Failed to fetch garment manufacturing records');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleAddGarment = () => {
    setEditingGarment(undefined);
    setDrawerOpen(true);
  };

  const handleEditGarment = (garment: GarmentManufacturing) => {
    setEditingGarment(garment);
    setDrawerOpen(true);
  };

  const handleDeleteGarment = async (garment: GarmentManufacturing) => {
    try {
      setTableLoading(true);
      await garmentManufacturingService.deleteGarmentManufacturing(garment.id);
      message.success('Garment deleted successfully');
      fetchGarments();
    } catch (error) {
      console.error('Error deleting garment:', error);
      message.error('Failed to delete garment');
    } finally {
      setTableLoading(false);
    }
  };

  const handleDrawerClose = (shouldRefresh?: boolean) => {
    setDrawerOpen(false);
    setEditingGarment(undefined);
    if (shouldRefresh) {
      fetchGarments();
    }
  };

  const getGarmentTypeLabel = (type: string) => {
    const found = GARMENT_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getStageLabel = (stage: string) => {
    const found = PRODUCTION_STAGES.find(s => s.value === stage);
    return found ? found.label : stage;
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
      render: (garmentId: string) => <span className='code-text'>{garmentId}</span>,
    },
    {
      title: 'Style',
      dataIndex: 'styleNumber',
      key: 'styleNumber',
      ellipsis: true,
      render: (style: string, record: GarmentManufacturing) => (
        <div style={{ overflow: 'hidden' }}>
          <div
            className='primary-text'
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {style}
          </div>
          <div
            className='secondary-text'
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {getGarmentTypeLabel(record.garmentType)} • {record.size} • {record.color}
          </div>
        </div>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || 0,
    },
    {
      title: 'Stage',
      dataIndex: 'productionStage',
      key: 'productionStage',
      width: 120,
      ellipsis: true,
      render: (stage: string) => <Tag color={getStageColor(stage)}>{getStageLabel(stage)}</Tag>,
    },
    {
      title: 'Quality',
      dataIndex: 'qualityPassed',
      key: 'qualityPassed',
      width: 100,
      render: (passed: boolean) =>
        passed ? (
          <Tag icon={<CheckCircleOutlined />} color='success'>
            Passed
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color='error'>
            Failed
          </Tag>
        ),
    },
    {
      title: 'Defects',
      dataIndex: 'defectCount',
      key: 'defectCount',
      width: 80,
      render: (count: number) => <Tag color={count > 0 ? 'red' : 'green'}>{count}</Tag>,
    },
    {
      title: 'Status',
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
      render: (_: any, record: GarmentManufacturing) => {
        const isEmployee = currentCompany?.role === 'EMPLOYEE';
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditGarment(record),
            disabled: isEmployee,
          },
          { type: 'divider' as const },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteGarment(record),
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
        <div className='no-company-message'>
          Please select a company to manage garment manufacturing.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2} className='page-title'>
            Garment Manufacturing
          </Heading>
        </div>

        <div className='filters-section'>
          <Space size='middle'>
            <Input
              placeholder='Search garments...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder='Garment Type'
              value={garmentTypeFilter}
              onChange={setGarmentTypeFilter}
              style={{ width: 150 }}
              allowClear
            >
              {GARMENT_TYPES.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder='Stage'
              value={stageFilter}
              onChange={setStageFilter}
              style={{ width: 150 }}
              allowClear
            >
              {PRODUCTION_STAGES.map(stage => (
                <Select.Option key={stage.value} value={stage.value}>
                  {stage.label}
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
          ) : garments.length === 0 ? (
            <Empty description='No garment manufacturing records found'>
              <GradientButton
                size='small'
                onClick={handleAddGarment}
                disabled={currentCompany?.role === 'EMPLOYEE'}
              >
                Create First Garment
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={garments}
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

      <GarmentManufacturingDrawer
        visible={drawerOpen}
        mode={editingGarment ? 'edit' : 'create'}
        garmentId={editingGarment?.id}
        onClose={() => handleDrawerClose(false)}
        onSuccess={() => handleDrawerClose(true)}
      />
    </MainLayout>
  );
}

export { GarmentManufacturingListPage };
