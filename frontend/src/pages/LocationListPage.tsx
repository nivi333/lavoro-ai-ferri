import { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Tag,
  Space,
  Avatar,
  Dropdown,
  Modal,
  message,
  Typography,
  Empty,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  MoreOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import useAuth from '../contexts/AuthContext';
import { locationService, Location } from '../services/locationService';
import {
  LOCATION_TYPE_LABELS,
  LOCATION_TYPE_COLORS,
  LOCATION_STATUS_COLORS,
  LOCATION_TABLE_CONFIG,
  LOCATION_EMPTY_STATE,
  LOCATION_SUCCESS_MESSAGES,
  LOCATION_ERROR_MESSAGES,
} from '../constants/location';
import LocationDrawer from '../components/location/LocationDrawer';
import { BrandLogo } from '../components/BrandLogo';
import './LocationListPage.scss';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function LocationListPage() {
  const { currentCompany } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    if (currentCompany) {
      fetchLocations();
    }
  }, [currentCompany]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await locationService.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      message.error(LOCATION_ERROR_MESSAGES.FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    setDrawerVisible(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setDrawerVisible(true);
  };

  const handleDeleteLocation = (location: Location) => {
    Modal.confirm({
      title: 'Delete Location',
      content: `Are you sure you want to delete "${location.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setTableLoading(true);
          await locationService.deleteLocation(location.id);
          message.success(LOCATION_SUCCESS_MESSAGES.DELETE);
          fetchLocations();
        } catch (error) {
          console.error('Error deleting location:', error);
          message.error(LOCATION_ERROR_MESSAGES.DELETE_ERROR);
        } finally {
          setTableLoading(false);
        }
      },
    });
  };

  const handleSetDefault = async (location: Location) => {
    try {
      setTableLoading(true);
      await locationService.setDefaultLocation(location.id);
      message.success(LOCATION_SUCCESS_MESSAGES.SET_DEFAULT);
      fetchLocations();
    } catch (error) {
      console.error('Error setting default location:', error);
      message.error(LOCATION_ERROR_MESSAGES.SET_DEFAULT_ERROR);
    } finally {
      setTableLoading(false);
    }
  };

  const handleSetHeadquarters = async (location: Location) => {
    try {
      setTableLoading(true);
      await locationService.setHeadquarters(location.id);
      message.success(LOCATION_SUCCESS_MESSAGES.SET_HEADQUARTERS);
      fetchLocations();
    } catch (error) {
      console.error('Error setting headquarters:', error);
      message.error(LOCATION_ERROR_MESSAGES.SET_HEADQUARTERS_ERROR);
    } finally {
      setTableLoading(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setEditingLocation(null);
  };

  const handleLocationSaved = () => {
    fetchLocations();
    handleDrawerClose();
  };

  const getActionMenuItems = (location: Location) => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => handleEditLocation(location),
    },
    {
      key: 'default',
      icon: <EnvironmentOutlined />,
      label: location.isDefault ? 'Remove as Default' : 'Set as Default',
      onClick: () => handleSetDefault(location),
      disabled: location.isDefault,
    },
    {
      key: 'headquarters',
      icon: <CrownOutlined />,
      label: location.isHeadquarters ? 'Remove as Headquarters' : 'Set as Headquarters',
      onClick: () => handleSetHeadquarters(location),
      disabled: location.isHeadquarters,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      onClick: () => handleDeleteLocation(location),
      danger: true,
      disabled: location.isHeadquarters, // Cannot delete headquarters
    },
  ];

  const columns = [
    {
      title: 'Location',
      key: 'location',
      render: (record: Location) => (
        <Space>
          <Avatar
            size={40}
            src={record.imageUrl}
            icon={<EnvironmentOutlined />}
            style={{ backgroundColor: LOCATION_TYPE_COLORS[record.locationType] }}
          >
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div className="location-name">{record.name}</div>
            <div className="location-address">
              {record.addressLine1}, {record.city}, {record.state}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'locationType',
      key: 'locationType',
      render: (type: string) => (
        <Tag color={LOCATION_TYPE_COLORS[type as keyof typeof LOCATION_TYPE_COLORS]}>
          {LOCATION_TYPE_LABELS[type as keyof typeof LOCATION_TYPE_LABELS]}
        </Tag>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: Location) => (
        <div className="location-contact">
          {record.email && <div>{record.email}</div>}
          {record.phone && <div>{record.phone}</div>}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: Location) => (
        <Space direction="vertical" size="small">
          <Tag color={LOCATION_STATUS_COLORS[record.isActive ? 'ACTIVE' : 'INACTIVE']}>
            {record.isActive ? 'Active' : 'Inactive'}
          </Tag>
          {record.isDefault && (
            <Tag color="#7b5fc9" icon={<EnvironmentOutlined />}>
              Default
            </Tag>
          )}
          {record.isHeadquarters && (
            <Tag color="#faad14" icon={<CrownOutlined />}>
              Headquarters
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: Location) => (
        <Dropdown
          menu={{ items: getActionMenuItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  if (!currentCompany) {
    return (
      <Layout className="location-list-page">
        <Header className="page-header">
          <BrandLogo />
        </Header>
        <Content className="page-content">
          <div className="no-company-message">
            Please select a company to manage locations.
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="location-list-page">
      <Header className="page-header">
        <div className="header-left">
          <BrandLogo />
        </div>
        <div className="header-right">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddLocation}
            className="add-location-btn"
          >
            Add Location
          </Button>
        </div>
      </Header>

      <Content className="page-content">
        <div className="page-container">
          <div className="page-header-section">
            <Title level={2} className="page-title">
              Company Locations
            </Title>
            <div className="page-subtitle">
              Manage your company locations, branches, warehouses, and factories
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : locations.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={LOCATION_EMPTY_STATE.DESCRIPTION}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddLocation}
                >
                  {LOCATION_EMPTY_STATE.BUTTON_TEXT}
                </Button>
              </Empty>
            ) : (
              <Table
                columns={columns}
                dataSource={locations}
                rowKey="id"
                loading={tableLoading}
                pagination={{
                  pageSize: LOCATION_TABLE_CONFIG.PAGE_SIZE,
                  showSizeChanger: LOCATION_TABLE_CONFIG.SHOW_SIZE_CHANGER,
                  showQuickJumper: LOCATION_TABLE_CONFIG.SHOW_QUICK_JUMPER,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} locations`,
                }}
                scroll={{ x: LOCATION_TABLE_CONFIG.SCROLL_X }}
                className="locations-table"
              />
            )}
          </div>
        </div>
      </Content>

      <LocationDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        onSave={handleLocationSaved}
        editingLocation={editingLocation}
        locations={locations}
      />
    </Layout>
  );
}
