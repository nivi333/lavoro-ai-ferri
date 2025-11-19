import { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Avatar,
  Dropdown,
  Modal,
  message,
  Empty,
  Spin,
  Checkbox,
} from 'antd';
import { EditOutlined, DeleteOutlined, EnvironmentOutlined, MoreOutlined } from '@ant-design/icons';
import useAuth from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { locationService, Location } from '../services/locationService';
import { MainLayout } from '../components/layout';
import { Heading } from '../components/Heading';
import { GradientButton } from '../components/ui';
import {
  LOCATION_STATUS_COLORS,
  LOCATION_TABLE_CONFIG,
  LOCATION_EMPTY_STATE,
  LOCATION_SUCCESS_MESSAGES,
  LOCATION_ERROR_MESSAGES,
} from '../constants/location';
import LocationDrawer from '../components/location/LocationDrawer';
import './LocationListPage.scss';

export default function LocationListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const fetchInProgressRef = useRef(false);

  // Set header actions when component mounts
  useEffect(() => {
    setHeaderActions(
      <GradientButton onClick={handleAddLocation} size='small' className='add-location-btn'>
        Add Location
      </GradientButton>
    );

    // Cleanup when component unmounts
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  useEffect(() => {
    if (currentCompany) {
      fetchLocations();
    }
  }, [currentCompany]);

  const fetchLocations = async () => {
    if (fetchInProgressRef.current) {
      return; // Prevent duplicate calls
    }

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const data = await locationService.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      message.error(LOCATION_ERROR_MESSAGES.FETCH_ERROR);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
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
          <Avatar size={70} src={record.imageUrl} icon={<EnvironmentOutlined />}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div className='location-name'>{record.name}</div>
            <div className='location-address'>
              {record.addressLine1}, {record.addressLine2},{record.city}, {record.state}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'locationType',
      key: 'locationType',
      render: (_: string, record: Location) => record.locationType,
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: Location) => (
        <div className='location-contact'>
          {record.email && <div>{record.email}</div>}
          {record.phone && <div>{record.phone}</div>}
        </div>
      ),
    },
    {
      title: 'Default',
      key: 'isDefault',
      width: 100,
      render: (record: Location) => <Checkbox checked={record.isDefault} disabled />,
    },
    {
      title: 'Headquarters',
      key: 'isHeadquarters',
      width: 120,
      render: (record: Location) => <Checkbox checked={record.isHeadquarters} disabled />,
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (record: Location) => (
        <Tag
          color={record.isActive ? LOCATION_STATUS_COLORS.ACTIVE : LOCATION_STATUS_COLORS.INACTIVE}
        >
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
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
          placement='bottomRight'
        >
          <Button type='text' icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  if (!currentCompany) {
    return (
      <MainLayout>
        <div className='no-company-message'>Please select a company to manage locations.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2} className='page-title'>
            Company Locations
          </Heading>
        </div>

        <div className='table-container'>
          {loading ? (
            <div className='loading-container'>
              <Spin size='large' />
            </div>
          ) : locations.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={LOCATION_EMPTY_STATE.DESCRIPTION}
            >
              <GradientButton size='small' onClick={handleAddLocation}>
                {LOCATION_EMPTY_STATE.BUTTON_TEXT}
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={locations}
              rowKey='id'
              loading={tableLoading}
              pagination={{
                pageSize: LOCATION_TABLE_CONFIG.PAGE_SIZE,
                showSizeChanger: LOCATION_TABLE_CONFIG.SHOW_SIZE_CHANGER,
                showQuickJumper: LOCATION_TABLE_CONFIG.SHOW_QUICK_JUMPER,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} locations`,
              }}
              scroll={{ x: LOCATION_TABLE_CONFIG.SCROLL_X }}
              className='locations-table'
            />
          )}
        </div>
      </div>

      <LocationDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        onSave={handleLocationSaved}
        editingLocation={editingLocation}
        locations={locations}
      />
    </MainLayout>
  );
}
