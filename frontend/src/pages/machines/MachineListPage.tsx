import { useEffect, useRef, useState } from 'react';
import { Table, Tag, Button, Dropdown, Empty, Spin, message, Input, Select, Avatar, Space, Tooltip, Modal } from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ToolOutlined,
  WarningOutlined,
  CalendarOutlined,
  HistoryOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { machineService, Machine } from '../../services/machineService';
import { locationService, Location } from '../../services/locationService';
import { MachineFormDrawer } from '../../components/machines/MachineFormDrawer';
import { MaintenanceScheduleModal } from '../../components/machines/MaintenanceScheduleModal';
import { BreakdownReportModal } from '../../components/machines/BreakdownReportModal';
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
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [breakdownModalVisible, setBreakdownModalVisible] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton 
        onClick={handleCreateMachine} 
        size='small' 
        className='machines-create-btn'
        disabled={isEmployee}
      >
        Add Machine
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions, currentCompany?.role]);

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

      console.log('=== MACHINES DATA FROM BACKEND (AFTER CONVERSION) ===');
      console.log('✅ Data converted from snake_case to camelCase');
      if (machinesData.data && machinesData.data.length > 0) {
        console.log('First machine:', machinesData.data[0]);
        console.log('✅ machineCode:', machinesData.data[0].machineCode);
        console.log('✅ machineType:', machinesData.data[0].machineType);
        console.log('✅ isActive:', machinesData.data[0].isActive);
        console.log('✅ location.name:', machinesData.data[0].location?.name);
      }

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

  const handleDeleteMachine = async (machine: Machine) => {
    Modal.confirm({
      title: 'Delete Machine',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete machine <strong>{machine.name}</strong> ({machine.machineCode})?</p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
            This will decommission the machine and mark it as inactive. This action cannot be undone.
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setTableLoading(true);
          const result = await machineService.deleteMachine(machine.id);
          if (result.success) {
            message.success('Machine deleted successfully');
            refreshMachines();
          } else {
            message.error(result.message || 'Failed to delete machine');
          }
        } catch (error: any) {
          console.error('Error deleting machine:', error);
          message.error(error.message || 'Failed to delete machine');
        } finally {
          setTableLoading(false);
        }
      },
    });
  };

  const handleScheduleMaintenance = (machine: Machine) => {
    setSelectedMachine(machine);
    setMaintenanceModalVisible(true);
  };

  const handleReportBreakdown = (machine: Machine) => {
    setSelectedMachine(machine);
    setBreakdownModalVisible(true);
  };

  const handleMaintenanceScheduled = () => {
    refreshMachines();
    message.success('Maintenance scheduled successfully');
  };

  const handleBreakdownReported = () => {
    refreshMachines();
    message.success('Breakdown reported successfully');
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
      case 'NEW':
        return 'blue';
      case 'IN_USE':
        return 'green';
      case 'UNDER_MAINTENANCE':
        return 'orange';
      case 'UNDER_REPAIR':
        return 'red';
      case 'IDLE':
        return 'default';
      case 'DECOMMISSIONED':
        return 'red';
      default:
        return 'default';
    }
  };

  const getOperationalStatusColor = (status: string) => {
    switch (status) {
      case 'FREE':
        return 'green';
      case 'BUSY':
        return 'orange';
      case 'RESERVED':
        return 'blue';
      case 'UNAVAILABLE':
        return 'red';
      default:
        return 'default';
    }
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return '—';
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : '—';
  };

  const columns = [
    {
      title: 'Machine',
      key: 'machine',
      width: 300,
      sorter: (a: Machine, b: Machine) => (a.name || '').localeCompare(b.name || ''),
      render: (record: Machine) => (
        <div className='machine-info'>
          <Avatar src={record.imageUrl} icon={<ToolOutlined />} className='location-avatar'>
            {record.name.charAt(0)}
          </Avatar>
          <div className='machine-details'>
            <div className='machine-name'>{record.name}</div>
            <div className='machine-meta'>{record.machineCode} </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Machine Type',
      dataIndex: 'machineType',
      key: 'machineType',
      width: 150,
      sorter: (a: Machine, b: Machine) => (a.machineType || '').localeCompare(b.machineType || ''),
      render: (machineType?: string) => machineType || '—',
    },
    {
      title: 'Purchase Date',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 120,
      sorter: (a: Machine, b: Machine) => new Date(a.purchaseDate || 0).getTime() - new Date(b.purchaseDate || 0).getTime(),
      render: (date?: string) => (date ? new Date(date).toLocaleDateString() : '—'),
    },
    {
      title: 'Warranty Expiry',
      dataIndex: 'warrantyExpiry',
      key: 'warrantyExpiry',
      width: 130,
      sorter: (a: Machine, b: Machine) => new Date(a.warrantyExpiry || 0).getTime() - new Date(b.warrantyExpiry || 0).getTime(),
      render: (date?: string) => (date ? new Date(date).toLocaleDateString() : '—'),
    },
    {
      title: 'Location',
      key: 'location',
      width: 150,
      sorter: (a: Machine, b: Machine) => (a.location?.name || '').localeCompare(b.location?.name || ''),
      render: (record: Machine) =>
        record.location?.name || getLocationName(record.locationId) || '—',
    },
    {
      title: 'Current Operator',
      key: 'currentOperator',
      width: 150,
      render: (record: Machine) => {
        if (record.currentOperator) {
          return (
            <Tooltip
              title={`Operator: ${record.currentOperator.firstName} ${record.currentOperator.lastName}`}
            >
              <Space>
                <Avatar size='small' icon={<UserOutlined />} />
                {`${record.currentOperator.firstName} ${record.currentOperator.lastName}`}
              </Space>
            </Tooltip>
          );
        }
        return '—';
      },
    },
    {
      title: 'Operational Status',
      dataIndex: 'operationalStatus',
      key: 'operationalStatus',
      width: 140,
      sorter: (a: Machine, b: Machine) => (a.operationalStatus || '').localeCompare(b.operationalStatus || ''),
      render: (status: string) => (
        <Tag color={getOperationalStatusColor(status)}>{status || 'Unknown'}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      sorter: (a: Machine, b: Machine) => (a.status || '').localeCompare(b.status || ''),
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status?.replace('_', ' ') || 'Unknown'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (record: Machine) => {
        const isEmployee = currentCompany?.role === 'EMPLOYEE';
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditMachine(record),
            disabled: isEmployee,
          },
          {
            key: 'maintenance',
            icon: <CalendarOutlined />,
            label: 'Schedule Maintenance',
            onClick: () => handleScheduleMaintenance(record),
            disabled: isEmployee,
          },
          {
            key: 'breakdown',
            icon: <WarningOutlined />,
            label: 'Report Breakdown',
            onClick: () => handleReportBreakdown(record),
          },
          {
            key: 'history',
            icon: <HistoryOutlined />,
            label: 'View History',
            onClick: () => message.info('History view coming soon'),
          },
          {
            key: 'assign',
            icon: <UserOutlined />,
            label: 'Assign Operator',
            onClick: () => message.info('Operator assignment coming soon'),
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
        <div className='no-company-message'>Please select a company to manage machines.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2} className='page-title'>
            Machine Management
          </Heading>
          <div className='filters-section'>
            <Space size='middle'>
              <Input
                placeholder='Search machines...'
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
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
                <Select.Option value='NEW'>New</Select.Option>
                <Select.Option value='IN_USE'>In Use</Select.Option>
                <Select.Option value='UNDER_MAINTENANCE'>Under Maintenance</Select.Option>
                <Select.Option value='UNDER_REPAIR'>Under Repair</Select.Option>
                <Select.Option value='IDLE'>Idle</Select.Option>
                <Select.Option value='DECOMMISSIONED'>Decommissioned</Select.Option>
              </Select>
            </Space>
          </div>
        </div>

        <div className='table-container'>
          {loading ? (
            <div className='loading-container'>
              <Spin size='large' />
            </div>
          ) : machines.length === 0 ? (
            <Empty description='No machines found'>
              <GradientButton 
                size='small' 
                onClick={handleCreateMachine}
                disabled={currentCompany?.role === 'EMPLOYEE'}
              >
                Add First Machine
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={machines}
              rowKey='id'
              loading={tableLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} machines`,
              }}
              scroll={{ x: 1200 }}
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

      {selectedMachine && (
        <>
          <MaintenanceScheduleModal
            visible={maintenanceModalVisible}
            onClose={() => setMaintenanceModalVisible(false)}
            onScheduled={handleMaintenanceScheduled}
            machine={selectedMachine}
          />

          <BreakdownReportModal
            visible={breakdownModalVisible}
            onClose={() => setBreakdownModalVisible(false)}
            onReported={handleBreakdownReported}
            machine={selectedMachine}
          />
        </>
      )}
    </MainLayout>
  );
}
