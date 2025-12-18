import { useState, useEffect, useRef } from 'react';
import { Table, Button, Tag, Dropdown, message, Empty, Spin, Input, Space, Select } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import {
  yarnManufacturingService,
  YarnManufacturing,
  YARN_TYPES,
  QUALITY_GRADES,
  YARN_PROCESSES,
} from '../../services/textileService';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import './TextileListPage.scss';
import YarnManufacturingDrawer from '@/components/textile/YarnManufacturingDrawer';

export default function YarnManufacturingListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [yarns, setYarns] = useState<YarnManufacturing[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingYarn, setEditingYarn] = useState<YarnManufacturing | undefined>(undefined);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [yarnTypeFilter, setYarnTypeFilter] = useState<string | undefined>(undefined);
  const [qualityGradeFilter, setQualityGradeFilter] = useState<string | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton onClick={handleAddYarn} size='small' disabled={isEmployee}>
        New Production
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions, currentCompany?.role]);

  useEffect(() => {
    if (currentCompany) {
      fetchYarns();
    }
  }, [currentCompany, searchText, yarnTypeFilter, qualityGradeFilter]);

  const fetchYarns = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const filters: any = {
        search: searchText || undefined,
        yarnType: yarnTypeFilter,
        qualityGrade: qualityGradeFilter,
      };
      const result = await yarnManufacturingService.getYarnManufacturing(filters);
      setYarns(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching yarns:', error);
      message.error('Failed to fetch yarn manufacturing records');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleAddYarn = () => {
    setEditingYarn(undefined);
    setDrawerOpen(true);
  };

  const handleEditYarn = (yarn: YarnManufacturing) => {
    setEditingYarn(yarn);
    setDrawerOpen(true);
  };

  const handleDeleteYarn = async (yarn: YarnManufacturing) => {
    try {
      setTableLoading(true);
      await yarnManufacturingService.deleteYarnManufacturing(yarn.id);
      message.success('Yarn manufacturing deleted successfully');
      fetchYarns();
    } catch (error) {
      console.error('Error deleting yarn:', error);
      message.error('Failed to delete yarn manufacturing');
    } finally {
      setTableLoading(false);
    }
  };

  const handleDrawerClose = (shouldRefresh?: boolean) => {
    setDrawerOpen(false);
    setEditingYarn(undefined);
    if (shouldRefresh) {
      fetchYarns();
    }
  };

  const getQualityGradeLabel = (grade: string) => {
    const found = QUALITY_GRADES.find(g => g.value === grade);
    return found ? found.label : grade;
  };

  const getYarnTypeLabel = (type: string) => {
    const found = YARN_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getProcessLabel = (process: string) => {
    const found = YARN_PROCESSES.find(p => p.value === process);
    return found ? found.label : process;
  };

  const columns = [
    {
      title: 'Yarn ID',
      dataIndex: 'yarnId',
      key: 'yarnId',
      width: 120,
      render: (yarnId: string) => <span className='code-text'>{yarnId}</span>,
    },
    {
      title: 'Yarn Details',
      dataIndex: 'yarnType',
      key: 'yarnType',
      ellipsis: true,
      render: (_: string, record: YarnManufacturing) => (
        <div style={{ overflow: 'hidden' }}>
          <div
            className='primary-text'
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {getYarnTypeLabel(record.yarnType)} - {record.yarnCount}
          </div>
          <div
            className='secondary-text'
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {record.ply} Ply • {record.color}
          </div>
        </div>
      ),
    },
    {
      title: 'Batch No',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Process',
      dataIndex: 'processType',
      key: 'processType',
      width: 100,
      ellipsis: true,
      render: (process: string) => getProcessLabel(process),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantityKg',
      key: 'quantityKg',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => `${qty?.toLocaleString() || 0} kg`,
    },
    {
      title: 'Grade',
      dataIndex: 'qualityGrade',
      key: 'qualityGrade',
      width: 100,
      render: (grade: string) => {
        const color =
          grade === 'A_GRADE'
            ? 'green'
            : grade === 'B_GRADE'
              ? 'blue'
              : grade === 'C_GRADE'
                ? 'orange'
                : 'red';
        return <Tag color={color}>{getQualityGradeLabel(grade)}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'productionDate',
      key: 'productionDate',
      width: 110,
      render: (date: string) => (date ? new Date(date).toLocaleDateString() : '—'),
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
      render: (_: any, record: YarnManufacturing) => {
        const isEmployee = currentCompany?.role === 'EMPLOYEE';
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditYarn(record),
            disabled: isEmployee,
          },
          { type: 'divider' as const },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteYarn(record),
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
          Please select a company to manage yarn manufacturing.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2} className='page-title'>
            Yarn Manufacturing
          </Heading>
        </div>

        <div className='filters-section'>
          <Space size='middle'>
            <Input
              placeholder='Search yarns...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder='Yarn Type'
              value={yarnTypeFilter}
              onChange={setYarnTypeFilter}
              style={{ width: 150 }}
              allowClear
            >
              {YARN_TYPES.map(type => (
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
          ) : yarns.length === 0 ? (
            <Empty description='No yarn manufacturing records found'>
              <GradientButton
                size='small'
                onClick={handleAddYarn}
                disabled={currentCompany?.role === 'EMPLOYEE'}
              >
                Create First Production
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={yarns}
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

      <YarnManufacturingDrawer
        open={drawerOpen}
        onClose={() => handleDrawerClose(false)}
        onSuccess={() => handleDrawerClose(true)}
        initialData={editingYarn}
      />
    </MainLayout>
  );
}

export { YarnManufacturingListPage };
