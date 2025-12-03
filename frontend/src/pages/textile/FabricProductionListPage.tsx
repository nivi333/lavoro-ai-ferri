import { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Tag,
  Dropdown,
  message,
  Empty,
  Spin,
  Input,
  Space,
  Select,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { fabricProductionService, FabricProduction, FABRIC_TYPES, QUALITY_GRADES } from '../../services/textileService';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { FabricProductionDrawer } from '../../components/textile/FabricProductionDrawer';
import './TextileListPage.scss';

export default function FabricProductionListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [fabrics, setFabrics] = useState<FabricProduction[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingFabric, setEditingFabric] = useState<FabricProduction | undefined>(undefined);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [fabricTypeFilter, setFabricTypeFilter] = useState<string | undefined>(undefined);
  const [qualityGradeFilter, setQualityGradeFilter] = useState<string | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton
        onClick={handleAddFabric}
        size='small'
        disabled={isEmployee}
      >
        New Production
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions, currentCompany?.role]);

  useEffect(() => {
    if (currentCompany) {
      fetchFabrics();
    }
  }, [currentCompany, searchText, fabricTypeFilter, qualityGradeFilter]);

  const fetchFabrics = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const filters: any = {
        search: searchText || undefined,
        fabricType: fabricTypeFilter,
        qualityGrade: qualityGradeFilter,
      };
      const result = await fabricProductionService.getFabricProductions(filters);
      setFabrics(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching fabrics:', error);
      message.error('Failed to fetch fabric productions');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleAddFabric = () => {
    setEditingFabric(undefined);
    setDrawerOpen(true);
  };

  const handleEditFabric = (fabric: FabricProduction) => {
    setEditingFabric(fabric);
    setDrawerOpen(true);
  };

  const handleDeleteFabric = async (fabric: FabricProduction) => {
    try {
      setTableLoading(true);
      await fabricProductionService.deleteFabricProduction(fabric.id);
      message.success('Fabric production deleted successfully');
      fetchFabrics();
    } catch (error) {
      console.error('Error deleting fabric:', error);
      message.error('Failed to delete fabric production');
    } finally {
      setTableLoading(false);
    }
  };

  const handleDrawerClose = (shouldRefresh?: boolean) => {
    setDrawerOpen(false);
    setEditingFabric(undefined);
    if (shouldRefresh) {
      fetchFabrics();
    }
  };

  const getQualityGradeLabel = (grade: string) => {
    const found = QUALITY_GRADES.find(g => g.value === grade);
    return found ? found.label : grade;
  };

  const getFabricTypeLabel = (type: string) => {
    const found = FABRIC_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const columns = [
    {
      title: 'Fabric ID',
      dataIndex: 'fabricId',
      key: 'fabricId',
      width: 120,
      render: (fabricId: string) => <span className='code-text'>{fabricId}</span>,
    },
    {
      title: 'Fabric Name',
      dataIndex: 'fabricName',
      key: 'fabricName',
      render: (name: string, record: FabricProduction) => (
        <div>
          <div className='primary-text'>{name}</div>
          <div className='secondary-text'>{record.composition}</div>
        </div>
      ),
    },
    {
      title: 'Batch No',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 120,
    },
    {
      title: 'Type',
      dataIndex: 'fabricType',
      key: 'fabricType',
      width: 100,
      render: (type: string) => getFabricTypeLabel(type),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantityMeters',
      key: 'quantityMeters',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => `${qty?.toLocaleString() || 0} m`,
    },
    {
      title: 'Grade',
      dataIndex: 'qualityGrade',
      key: 'qualityGrade',
      width: 100,
      render: (grade: string) => {
        const color = grade === 'A_GRADE' ? 'green' : grade === 'B_GRADE' ? 'blue' : grade === 'C_GRADE' ? 'orange' : 'red';
        return <Tag color={color}>{getQualityGradeLabel(grade)}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'productionDate',
      key: 'productionDate',
      width: 110,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '—',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: FabricProduction) => {
        const isEmployee = currentCompany?.role === 'EMPLOYEE';
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditFabric(record),
            disabled: isEmployee,
          },
          { type: 'divider' as const },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteFabric(record),
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
        <div className='no-company-message'>Please select a company to manage fabric production.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2} className='page-title'>
            Fabric Production
          </Heading>
        </div>

        <div className='filters-section'>
          <Space size='middle'>
            <Input
              placeholder='Search fabrics...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder='Fabric Type'
              value={fabricTypeFilter}
              onChange={setFabricTypeFilter}
              style={{ width: 150 }}
              allowClear
            >
              {FABRIC_TYPES.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder='Quality Grade'
              value={qualityGradeFilter}
              onChange={setQualityGradeFilter}
              style={{ width: 150 }}
              allowClear
            >
              {QUALITY_GRADES.map(grade => (
                <Select.Option key={grade.value} value={grade.value}>
                  {grade.label}
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
          ) : fabrics.length === 0 ? (
            <Empty description='No fabric productions found'>
              <GradientButton
                size='small'
                onClick={handleAddFabric}
                disabled={currentCompany?.role === 'EMPLOYEE'}
              >
                Create First Production
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={fabrics}
              rowKey={record => record.id}
              loading={tableLoading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} records`,
              }}
              className='textile-table'
            />
          )}
        </div>
      </div>

      <FabricProductionDrawer
        visible={drawerOpen}
        onClose={handleDrawerClose}
        fabric={editingFabric}
      />
    </MainLayout>
  );
}

export { FabricProductionListPage };
