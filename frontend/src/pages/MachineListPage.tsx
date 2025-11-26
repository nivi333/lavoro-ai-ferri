import { useEffect, useRef, useState } from 'react';
import { Table, Tag, Space, Button, Dropdown, Empty, Spin, message, Input, Select } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import useAuth from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { MainLayout } from '../components/layout';
import { Heading } from '../components/Heading';
import { GradientButton } from '../components/ui';
import { machineService, Machine } from '../services/machineService';
import { locationService, Location } from '../services/locationService';
import { MachineFormDrawer } from '../components/machines/MachineFormDrawer';
import './MachineListPage.scss';

export default function MachineListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    setHeaderActions(
      <GradientButton onClick={handleCreateMachine} size='small' className='machines-create-btn'>
        Add Machine
      </GradientButton>,
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  useEffect(() => {
    if (currentCompany) {
      fetchData();
    }
  }, [currentCompany, searchText, selectedLocation, statusFilter]);

  const fetchData = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const [machinesData, locationsData] = await Promise.all([
        machineService.getMachines({
          search: searchText || undefined,
          locationId: selectedLocation,
          status: statusFilter as any,
        }),
        locationService.getLocations(),
      ]);
      setMachines(machinesData.data || []);
      setLocations(locationsData || []);
    } catch (error: any) {
      console.error('Error fetching machines:', error);
      message.error(error.message || 'Failed to fetch machines');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const refreshMachines = async () => {
    try {
      setTableLoading(true);
      const machinesData = await machineService.getMachines({
        search: searchText || undefined,
        locationId: selectedLocation,
        status: statusFilter as any,
      });
      setMachines(machinesData.data || []);
    } catch (error: any) {
      console.error('Error refreshing machines:', error);
      message.error(error.message || 'Failed to refresh machines');
    } finally {
      setTableLoading(false);
    }
  };

  const handleCreateMachine = () => {
    setEditingMachineId(null);
    setDrawerVisible(true);
  };

  const handleEditMachine = (machine: Machine) => {
    setEditingMachineId(machine.id);
    setDrawerVisible(true);
  };

  const handleDeleteMachine = async (_machine: Machine) => {
    // TODO: Implement delete functionality when backend API is ready
    message.info('Delete functionality will be implemented when backend API is ready');
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setEditingMachineId(null);
  };

  const handleMachineSaved = () => {
    refreshMachines();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_USE': return 'green';
      case 'UNDER_MAINTENANCE': return 'orange';
      case 'UNDER_REPAIR': return 'red';
      case 'IDLE': return 'default';
      case 'DECOMMISSIONED': return 'red';
      default: return 'default';
    }
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return '—';
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : '—';
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imageUrl: string | undefined, record: Machine) => (
        <div className='machine-image-cell'>
          {imageUrl ? (
            <img src={imageUrl} alt={record.name} className='machine-thumbnail' />
          ) : (
            <div className='machine-placeholder'>{record.name.charAt(0)}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Machine Code',
      dataIndex: 'machineCode',
      key: 'machineCode',
      width: 120,
      render: (machineCode: string) => (
        <div className='machine-code'>{machineCode}</div>
      ),
    },
    {
      title: 'Machine Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Machine) => (
        <div>
          <div className='machine-name'>{name}</div>
          <div className='machine-type'>Type: {record.machineType || 'Not specified'}</div>
        </div>
      ),
    },
    {
      title: 'Manufacturer',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 150,
      render: (manufacturer?: string) => (
        <div className='machine-manufacturer'>{manufacturer || '—'}</div>
      ),
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      width: 120,
      render: (model?: string) => (
        <div className='machine-model'>{model || '—'}</div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: any, record: Machine) => getLocationName(record.locationId),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status?.replace('_', ' ') || 'Unknown'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Machine) => {
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditMachine(record),
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteMachine(record),
          },
        ];

        return (
          <Space>
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement='bottomRight'>
              <Button type='text' icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  if (!currentCompany) {
    return (
      <MainLayout>
        <div className='no-company-message'>Please select a company to manage machines.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2} className='page-title'>
            Machines
          </Heading>
        </div>

        <div className='filters-section'>
          <Space size='middle'>
            <Input
              placeholder='Search machines...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder='All Locations'
              value={selectedLocation}
              onChange={setSelectedLocation}
              style={{ width: 200 }}
              allowClear
            >
              {locations.map(location => (
                <Select.Option key={location.id} value={location.id}>
                  {location.name}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder='All Status'
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              allowClear
            >
              <Select.Option value='IN_USE'>In Use</Select.Option>
              <Select.Option value='UNDER_MAINTENANCE'>Under Maintenance</Select.Option>
              <Select.Option value='UNDER_REPAIR'>Under Repair</Select.Option>
              <Select.Option value='IDLE'>Idle</Select.Option>
              <Select.Option value='DECOMMISSIONED'>Decommissioned</Select.Option>
            </Select>
          </Space>
        </div>

        <div className='table-container'>
          {loading ? (
            <div className='loading-container'>
              <Spin size='large' />
            </div>
          ) : machines.length === 0 ? (
            <Empty description='No machines found'>
              <GradientButton size='small' onClick={handleCreateMachine}>
                Add First Machine
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={machines}
              rowKey={(record) => record.id}
              loading={tableLoading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} machines`,
              }}
              className='machines-table'
            />
          )}
        </div>
      </div>

      <MachineFormDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        onSaved={handleMachineSaved}
        mode={editingMachineId ? 'edit' : 'create'}
        editingMachineId={editingMachineId}
        locations={locations}
      />
    </MainLayout>
  );
}
