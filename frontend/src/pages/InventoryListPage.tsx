import React, { useState, useEffect, useRef } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Avatar, 
  Typography, 
  Empty,
  Spin,
  message, 
  Dropdown,
  Tooltip
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  MoreOutlined,
  StockOutlined,
  SwapOutlined,
  BookOutlined,
  AlertOutlined,
  AppstoreOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Heading } from '../components/Heading';
import { GradientButton } from '../components/ui';
import { MainLayout } from '../components/layout';
import { useHeader } from '../contexts/HeaderContext';
import { inventoryService, LocationInventory, InventoryFilters } from '../services/inventoryService';
import { locationService } from '../services/locationService';
import useAuth from '../contexts/AuthContext';
import ProductSelector from '../components/products/ProductSelector';
import { StockMovementModal, StockReservationModal } from '../components/inventory';
import './InventoryListPage.scss';

const { Text } = Typography;

interface Location {
  id: string;
  locationId: string;
  name: string;
  isDefault: boolean;
  isHeadquarters: boolean;
}

const InventoryListPage: React.FC = () => {
  const [inventory, setInventory] = useState<LocationInventory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [filters] = useState<InventoryFilters>({});
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>(undefined);
  const [stockMovementModalVisible, setStockMovementModalVisible] = useState(false);
  const [stockReservationModalVisible, setStockReservationModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LocationInventory | null>(null);
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const fetchRef = useRef<boolean>(false);

  // Set header actions
  useEffect(() => {
    setHeaderActions(
      <GradientButton onClick={handleAddInventory} size='small'>
        Add Inventory
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      if (!currentCompany?.id) return;

      try {
        const response = await locationService.getLocations();
        setLocations(response || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, [currentCompany?.id]);

  // Fetch inventory data
  const fetchInventory = async () => {
    if (!currentCompany?.id || fetchRef.current) return;

    fetchRef.current = true;
    setLoading(true);

    try {
      const currentFilters = {
        ...filters,
        search: searchText || undefined,
        locationId: selectedLocation,
        productId: selectedProduct
      };
      const response = await inventoryService.getLocationInventory(currentFilters);
      if (response.success) {
        setInventory(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      message.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
      fetchRef.current = false;
    }
  };

  const refreshInventory = async () => {
    try {
      setTableLoading(true);
      const currentFilters = {
        ...filters,
        search: searchText || undefined,
        locationId: selectedLocation,
        productId: selectedProduct
      };
      const response = await inventoryService.getLocationInventory(currentFilters);
      if (response.success) {
        setInventory(response.data || []);
      }
    } catch (error) {
      console.error('Error refreshing inventory:', error);
      message.error('Failed to refresh inventory data');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompany) {
      fetchInventory();
    }
  }, [currentCompany, searchText, selectedLocation, selectedProduct]);

  // Handle add inventory
  const handleAddInventory = () => {
    message.info('Add inventory feature coming soon');
  };

  // Clear filters
  const clearFilters = () => {
    setSearchText('');
    setSelectedLocation(undefined);
    setSelectedProduct(undefined);
  };

  // Get stock status
  const getStockStatus = (item: LocationInventory) => {
    if (item.availableQuantity <= 0) {
      return { status: 'error', text: 'Out of Stock', color: '#ff4d4f' };
    }
    if (item.reorderLevel && item.availableQuantity <= item.reorderLevel) {
      return { status: 'warning', text: 'Low Stock', color: '#faad14' };
    }
    return { status: 'success', text: 'In Stock', color: '#52c41a' };
  };

  // Table columns
  const columns: ColumnsType<LocationInventory> = [
    {
      title: 'Product',
      key: 'product',
      width: 300,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            size={40}
            src={record.product.imageUrl}
            icon={<AppstoreOutlined />}
            style={{ 
              backgroundColor: record.product.imageUrl ? undefined : '#f0f0f0',
              color: '#666'
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
              {record.product.name}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.product.productCode} • {record.product.sku}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '14px' }}>
            {record.location.name}
          </div>
          <Space size={4} style={{ marginTop: '2px' }}>
            {record.location.isHeadquarters && (
              <Tag color="blue">HQ</Tag>
            )}
            {record.location.isDefault && (
              <Tag color="green">Default</Tag>
            )}
          </Space>
        </div>
      ),
    },
    {
      title: 'Stock Quantity',
      key: 'stockQuantity',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>
            {record.stockQuantity}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.product.unitOfMeasure}
          </div>
        </div>
      ),
    },
    {
      title: 'Reserved',
      key: 'reservedQuantity',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 500, fontSize: '14px', color: '#fa8c16' }}>
            {record.reservedQuantity}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.product.unitOfMeasure}
          </div>
        </div>
      ),
    },
    {
      title: 'Available',
      key: 'availableQuantity',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const status = getStockStatus(record);
        return (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '16px', color: status.color }}>
              {record.availableQuantity}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.product.unitOfMeasure}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const status = getStockStatus(record);
        return (
          <Tag color={status.status} style={{ margin: 0 }}>
            {status.text}
          </Tag>
        );
      },
    },
    {
      title: 'Reorder Level',
      key: 'reorderLevel',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <div style={{ textAlign: 'right' }}>
          {record.reorderLevel ? (
            <>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>
                {record.reorderLevel}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {record.product.unitOfMeasure}
              </div>
            </>
          ) : (
            <Text type="secondary">Not set</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Value',
      key: 'value',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>
            ₹{(record.stockQuantity * record.product.costPrice).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            @ ₹{record.product.costPrice}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'adjust',
                label: 'Adjust Stock',
                icon: <StockOutlined />,
                onClick: () => handleStockAdjustment(record),
              },
              {
                key: 'transfer',
                label: 'Transfer Stock',
                icon: <SwapOutlined />,
                onClick: () => handleStockTransfer(record),
              },
              {
                key: 'reserve',
                label: 'Reserve Stock',
                icon: <BookOutlined />,
                onClick: () => handleStockReservation(record),
              },
              {
                key: 'history',
                label: 'View History',
                icon: <AlertOutlined />,
                onClick: () => handleViewHistory(record),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            style={{ color: '#666' }}
          />
        </Dropdown>
      ),
    },
  ];

  // Action handlers
  const handleStockAdjustment = (record: LocationInventory) => {
    setSelectedRecord(record);
    setStockMovementModalVisible(true);
  };

  const handleStockTransfer = (record: LocationInventory) => {
    setSelectedRecord(record);
    setStockMovementModalVisible(true);
  };

  const handleStockReservation = (record: LocationInventory) => {
    setSelectedRecord(record);
    setStockReservationModalVisible(true);
  };

  const handleViewHistory = (_record: LocationInventory) => {
    message.info('Stock history feature coming soon');
  };

  // Modal handlers
  const handleModalSuccess = () => {
    fetchInventory();
  };

  const handleStockMovementModalClose = () => {
    setStockMovementModalVisible(false);
    setSelectedRecord(null);
  };

  const handleStockReservationModalClose = () => {
    setStockReservationModalVisible(false);
    setSelectedRecord(null);
  };

  if (!currentCompany) {
    return (
      <MainLayout>
        <div className='no-company-message'>Please select a company to manage inventory.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2} className='page-title'>
            Inventory
          </Heading>
        </div>

        <div className='filters-section'>
          <Space size='middle'>
            <Input
              placeholder='Search products...'
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
                  {location.isHeadquarters && ' (HQ)'}
                </Select.Option>
              ))}
            </Select>
            <ProductSelector
              placeholder="All Products"
              style={{ width: 200 }}
              value={selectedProduct}
              onChange={setSelectedProduct}
              allowClear
              showStockInfo={false}
            />
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={refreshInventory}
                loading={tableLoading}
              />
            </Tooltip>
            <Button
              icon={<FilterOutlined />}
              onClick={clearFilters}
              disabled={!searchText && !selectedLocation && !selectedProduct}
            >
              Clear
            </Button>
          </Space>
        </div>

        <div className='table-container'>
          {loading ? (
            <div className='loading-container'>
              <Spin size='large' />
            </div>
          ) : inventory.length === 0 ? (
            <Empty description='No inventory found'>
              <GradientButton size='small' onClick={handleAddInventory}>
                Add First Inventory
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={inventory}
              rowKey="id"
              loading={tableLoading}
              pagination={{
                total: inventory.length,
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 1200 }}
              size="middle"
              className='inventory-table'
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <StockMovementModal
        visible={stockMovementModalVisible}
        onClose={handleStockMovementModalClose}
        onSuccess={handleModalSuccess}
        initialProductId={selectedRecord?.productId}
        initialLocationId={selectedRecord?.locationId}
      />

      <StockReservationModal
        visible={stockReservationModalVisible}
        onClose={handleStockReservationModalClose}
        onSuccess={handleModalSuccess}
        initialProductId={selectedRecord?.productId}
        initialLocationId={selectedRecord?.locationId}
      />
    </MainLayout>
  );
};

export default InventoryListPage;
