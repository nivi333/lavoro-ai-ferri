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
  dyeingFinishingService,
  DyeingFinishing,
  DYEING_PROCESSES,
} from '../../services/textileService';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { DyeingFinishingDrawer } from '../../components/textile/DyeingFinishingDrawer';
import './TextileListPage.scss';

export default function DyeingFinishingListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [processes, setProcesses] = useState<DyeingFinishing[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<DyeingFinishing | undefined>(undefined);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [processTypeFilter, setProcessTypeFilter] = useState<string | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton onClick={handleAddProcess} size='small' disabled={isEmployee}>
        New Process
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions, currentCompany?.role]);

  useEffect(() => {
    if (currentCompany) {
      fetchProcesses();
    }
  }, [currentCompany, searchText, processTypeFilter]);

  const fetchProcesses = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const filters: any = {
        search: searchText || undefined,
        processType: processTypeFilter,
      };
      const result = await dyeingFinishingService.getDyeingFinishing(filters);
      setProcesses(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching processes:', error);
      message.error('Failed to fetch dyeing & finishing records');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleAddProcess = () => {
    setEditingProcess(undefined);
    setDrawerOpen(true);
  };

  const handleEditProcess = (process: DyeingFinishing) => {
    setEditingProcess(process);
    setDrawerOpen(true);
  };

  const handleDeleteProcess = async (process: DyeingFinishing) => {
    try {
      setTableLoading(true);
      await dyeingFinishingService.deleteDyeingFinishing(process.id);
      message.success('Process deleted successfully');
      fetchProcesses();
    } catch (error) {
      console.error('Error deleting process:', error);
      message.error('Failed to delete process');
    } finally {
      setTableLoading(false);
    }
  };

  const handleDrawerClose = (shouldRefresh?: boolean) => {
    setDrawerOpen(false);
    setEditingProcess(undefined);
    if (shouldRefresh) {
      fetchProcesses();
    }
  };

  const getProcessTypeLabel = (type: string) => {
    const found = DYEING_PROCESSES.find(p => p.value === type);
    return found ? found.label : type;
  };

  const columns = [
    {
      title: 'Process ID',
      dataIndex: 'processId',
      key: 'processId',
      width: 120,
      render: (processId: string) => <span className='code-text'>{processId}</span>,
    },
    {
      title: 'Color',
      dataIndex: 'colorName',
      key: 'colorName',
      ellipsis: true,
      render: (colorName: string, record: DyeingFinishing) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: record.colorCode,
              borderRadius: 4,
              border: '1px solid #d9d9d9',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <div
              className='primary-text'
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {colorName}
            </div>
            <div
              className='secondary-text'
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {record.colorCode}
            </div>
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
      render: (type: string) => <Tag>{getProcessTypeLabel(type)}</Tag>,
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
      title: 'Quality',
      dataIndex: 'qualityCheck',
      key: 'qualityCheck',
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
      title: 'Date',
      dataIndex: 'processDate',
      key: 'processDate',
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
      render: (_: any, record: DyeingFinishing) => {
        const isEmployee = currentCompany?.role === 'EMPLOYEE';
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditProcess(record),
            disabled: isEmployee,
          },
          { type: 'divider' as const },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteProcess(record),
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
          Please select a company to manage dyeing & finishing.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2} className='page-title'>
            Dyeing & Finishing
          </Heading>
        </div>

        <div className='filters-section'>
          <Space size='middle'>
            <Input
              placeholder='Search processes...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder='Process Type'
              value={processTypeFilter}
              onChange={setProcessTypeFilter}
              style={{ width: 150 }}
              allowClear
            >
              {DYEING_PROCESSES.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
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
          ) : processes.length === 0 ? (
            <Empty description='No dyeing & finishing records found'>
              <GradientButton
                size='small'
                onClick={handleAddProcess}
                disabled={currentCompany?.role === 'EMPLOYEE'}
              >
                Create First Process
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={processes}
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

      <DyeingFinishingDrawer
        open={drawerOpen}
        onClose={() => handleDrawerClose(false)}
        onSuccess={() => handleDrawerClose(true)}
        mode={editingProcess ? 'edit' : 'create'}
        processId={editingProcess?.processId}
        initialData={editingProcess}
      />
    </MainLayout>
  );
}

export { DyeingFinishingListPage };
