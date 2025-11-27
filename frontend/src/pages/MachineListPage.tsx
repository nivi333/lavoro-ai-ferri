import { useEffect, useRef, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Dropdown,
  Empty,
  Spin,
  message,
  Input,
  Select,
  Avatar,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tooltip,
} from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  HistoryOutlined,
  UserOutlined,
} from '@ant-design/icons';
import useAuth from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { MainLayout } from '../components/layout';
import { Heading } from '../components/Heading';
import { GradientButton } from '../components/ui';
import { machineService, Machine } from '../services/machineService';
import { locationService, Location } from '../services/locationService';
import { MachineFormDrawer } from '../components/machines/MachineFormDrawer';
import { MaintenanceScheduleModal } from '../components/machines/MaintenanceScheduleModal';
import { BreakdownReportModal } from '../components/machines/BreakdownReportModal';
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
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    setHeaderActions(
      <GradientButton onClick={handleCreateMachine} size='small' className='machines-create-btn'>
        Add Machine
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  useEffect(() => {
    if (currentCompany) {
      fetchData();
      fetchAnalytics();
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

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const analyticsData = await machineService.getAnalytics();
      setAnalytics(analyticsData);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
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
      await fetchAnalytics();
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
      render: (machineType?: string) => machineType || '—',
    },
    {
      title: 'Purchase Date',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 120,
      render: (date?: string) => (date ? new Date(date).toLocaleDateString() : '—'),
    },
    {
      title: 'Warranty Expiry',
      dataIndex: 'warrantyExpiry',
      key: 'warrantyExpiry',
      width: 130,
      render: (date?: string) => (date ? new Date(date).toLocaleDateString() : '—'),
    },
    {
      title: 'Location',
      key: 'location',
      width: 150,
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
            <Tooltip title={`Operator: ${record.currentOperator.firstName} ${record.currentOperator.lastName}`}>
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
      render: (status: string) => (
        <Tag color={getOperationalStatusColor(status)}>{status || 'Unknown'}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status?.replace('_', ' ') || 'Unknown'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (record: Machine) => {
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditMachine(record),
          },
          {
            key: 'maintenance',
            icon: <CalendarOutlined />,
            label: 'Schedule Maintenance',
            onClick: () => handleScheduleMaintenance(record),
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
        </div>

        {/* Real-Time Status Dashboard */}
        <div className='stats-section'>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card className='stat-card'>
                <Statistic
                  title='Total Machines'
                  value={analytics?.totalMachines || 0}
                  prefix={<ToolOutlined />}
                  valueStyle={{ color: '#7b5fc9' }}
                  loading={analyticsLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card className='stat-card stat-card-success'>
                <Statistic
                  title='In Use'
                  value={analytics?.machinesByStatus?.IN_USE || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  loading={analyticsLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card className='stat-card stat-card-warning'>
                <Statistic
                  title='Under Maintenance'
                  value={analytics?.machinesByStatus?.UNDER_MAINTENANCE || 0}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#faad14' }}
                  loading={analyticsLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card className='stat-card stat-card-error'>
                <Statistic
                  title='Under Repair'
                  value={analytics?.machinesByStatus?.UNDER_REPAIR || 0}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                  loading={analyticsLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card className='stat-card stat-card-idle'>
                <Statistic
                  title='Idle'
                  value={analytics?.machinesByStatus?.IDLE || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#8c8c8c' }}
                  loading={analyticsLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card className='stat-card'>
                <Statistic
                  title='New'
                  value={analytics?.machinesByStatus?.NEW || 0}
                  prefix={<StopOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                  loading={analyticsLoading}
                />
              </Card>
            </Col>
          </Row>

          {/* Performance KPIs */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12} md={8}>
              <Card className='kpi-card'>
                <div className='kpi-header'>
                  <ThunderboltOutlined className='kpi-icon' />
                  <span className='kpi-title'>Active Breakdowns</span>
                </div>
                <div className='kpi-value'>{analytics?.activeBreakdowns || 0}</div>
                <div className='kpi-subtitle'>Tickets open or in progress</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card className='kpi-card'>
                <div className='kpi-header'>
                  <CalendarOutlined className='kpi-icon' />
                  <span className='kpi-title'>Due Maintenance</span>
                </div>
                <div className='kpi-value'>{analytics?.dueMaintenance || 0}</div>
                <div className='kpi-subtitle'>Next 7 days</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card className='kpi-card kpi-card-danger'>
                <div className='kpi-header'>
                  <HistoryOutlined className='kpi-icon' />
                  <span className='kpi-title'>Overdue Maintenance</span>
                </div>
                <div className='kpi-value'>{analytics?.overdueMaintenance || 0}</div>
                <div className='kpi-subtitle'>Requires immediate attention</div>
              </Card>
            </Col>
          </Row>

          {/* Machine Utilization */}
          {analytics && analytics.totalMachines > 0 && (
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24}>
                <Card title='Machine Utilization' className='utilization-card'>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <div className='utilization-item'>
                        <div className='utilization-label'>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} /> In Use
                        </div>
                        <Progress
                          percent={Math.round(
                            ((analytics.machinesByStatus?.IN_USE || 0) /
                              analytics.totalMachines) *
                              100
                          )}
                          strokeColor='#52c41a'
                        />
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div className='utilization-item'>
                        <div className='utilization-label'>
                          <ClockCircleOutlined style={{ color: '#8c8c8c' }} /> Idle
                        </div>
                        <Progress
                          percent={Math.round(
                            ((analytics.machinesByStatus?.IDLE || 0) /
                              analytics.totalMachines) *
                              100
                          )}
                          strokeColor='#8c8c8c'
                        />
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div className='utilization-item'>
                        <div className='utilization-label'>
                          <WarningOutlined style={{ color: '#faad14' }} /> Under Maintenance
                        </div>
                        <Progress
                          percent={Math.round(
                            ((analytics.machinesByStatus?.UNDER_MAINTENANCE || 0) /
                              analytics.totalMachines) *
                              100
                          )}
                          strokeColor='#faad14'
                        />
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div className='utilization-item'>
                        <div className='utilization-label'>
                          <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Under Repair
                        </div>
                        <Progress
                          percent={Math.round(
                            ((analytics.machinesByStatus?.UNDER_REPAIR || 0) /
                              analytics.totalMachines) *
                              100
                          )}
                          strokeColor='#ff4d4f'
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          )}
        </div>

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
