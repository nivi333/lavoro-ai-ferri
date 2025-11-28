import { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Tag,
  Avatar,
  Dropdown,
  Modal,
  Empty,
  Spin,
  Input,
  Space,
  Select,
  App,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MoreOutlined,
  SearchOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { supplierService, Supplier, SupplierFilters } from '../../services/supplierService';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { SupplierDrawer } from '../../components/purchase/SupplierDrawer';
import '../sales/CustomerListPage.scss'; // Reuse customer list page styles

export default function SupplierListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const { message } = App.useApp();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<string | undefined>(undefined);
  const [supplierCategoryFilter, setSupplierCategoryFilter] = useState<string | undefined>(
    undefined
  );
  const [qualityRatingFilter, setQualityRatingFilter] = useState<string | undefined>(undefined);
  const [activeStatusFilter, setActiveStatusFilter] = useState<boolean | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  // Set header actions when component mounts
  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton
        onClick={handleAddSupplier}
        size='small'
        className='add-supplier-btn'
        disabled={isEmployee}
      >
        Add Supplier
      </GradientButton>
    );

    // Cleanup when component unmounts
    return () => setHeaderActions(null);
  }, [setHeaderActions, currentCompany?.role]);

  useEffect(() => {
    if (currentCompany) {
      fetchSuppliers();
    }
  }, [
    currentCompany,
    searchText,
    supplierTypeFilter,
    supplierCategoryFilter,
    qualityRatingFilter,
    activeStatusFilter,
  ]);

  const fetchSuppliers = async () => {
    if (fetchInProgressRef.current) {
      return;
    }

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const filters: SupplierFilters = {
        search: searchText || undefined,
        supplierType: supplierTypeFilter,
        supplierCategory: supplierCategoryFilter,
        qualityRating: qualityRatingFilter,
        isActive: activeStatusFilter,
      };
      const result = await supplierService.getSuppliers(filters);
      setSuppliers(result.suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleAddSupplier = () => {
    setEditingSupplier(undefined);
    setDrawerOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setDrawerOpen(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    Modal.confirm({
      title: 'Delete Supplier',
      content: `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setTableLoading(true);
          await supplierService.deleteSupplier(supplier.id);
          message.success('Supplier deleted successfully');
          fetchSuppliers();
        } catch (error) {
          console.error('Error deleting supplier:', error);
          message.error('Failed to delete supplier');
        } finally {
          setTableLoading(false);
        }
      },
    });
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingSupplier(undefined);
  };

  const handleSupplierSaved = () => {
    fetchSuppliers();
    handleDrawerClose();
  };

  const getActionMenuItems = (supplier: Supplier) => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    return [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => handleEditSupplier(supplier),
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit',
        onClick: () => handleEditSupplier(supplier),
        disabled: isEmployee,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'create-po',
        icon: <ShoppingCartOutlined />,
        label: 'Create PO',
        onClick: () => {
          message.info('Create PO functionality coming soon');
        },
        disabled: isEmployee,
      },
      {
        key: 'view-pos',
        icon: <FileTextOutlined />,
        label: 'View POs',
        onClick: () => {
          message.info('View POs functionality coming soon');
        },
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete',
        onClick: () => handleDeleteSupplier(supplier),
        danger: true,
        disabled: isEmployee,
      },
    ];
  };

  const columns = [
    {
      title: 'Supplier Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => (
        <span
          style={{
            fontFamily: 'monospace',
            backgroundColor: '#f5f5f5',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {code}
        </span>
      ),
    },
    {
      title: 'Supplier Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: Supplier) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar icon={<UserOutlined />} style={{ flexShrink: 0, backgroundColor: '#7b5fc9' }}>
            {name.charAt(0)}
          </Avatar>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className='supplier-name' style={{ fontWeight: 500, marginBottom: 2 }}>
              {name}
            </div>
            {record.companyRegNo && (
              <div className='company-reg' style={{ color: '#666', fontSize: '12px' }}>
                Reg: {record.companyRegNo}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Contact Person',
      dataIndex: 'primaryContactPerson',
      key: 'primaryContactPerson',
      width: 150,
      render: (contactPerson: string) => contactPerson || '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string) => email || '—',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (phone: string) => phone || '—',
    },
    {
      title: 'Type',
      dataIndex: 'supplierType',
      key: 'supplierType',
      width: 120,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          MANUFACTURER: 'blue',
          DISTRIBUTOR: 'green',
          WHOLESALER: 'purple',
          IMPORTER: 'orange',
          LOCAL_VENDOR: 'cyan',
        };
        const color = colorMap[type] || 'default';
        return <Tag color={color}>{type?.replace('_', ' ')}</Tag>;
      },
    },
    {
      title: 'Lead Time',
      dataIndex: 'leadTimeDays',
      key: 'leadTimeDays',
      width: 100,
      render: (leadTime?: number) => {
        if (!leadTime) return '—';
        return `${leadTime} days`;
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 80,
      render: (record: Supplier) => (
        <Tag color={record.isActive ? 'success' : 'default'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (record: Supplier) => (
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
        <div className='no-company-message'>Please select a company to manage suppliers.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2}>Suppliers</Heading>
        </div>

        <div className='filters-section'>
          <Space wrap>
            <Input
              placeholder='Search by name, code, email, phone...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder='Supplier Type'
              value={supplierTypeFilter}
              onChange={setSupplierTypeFilter}
              style={{ width: 140 }}
              allowClear
            >
              <Select.Option value='MANUFACTURER'>Manufacturer</Select.Option>
              <Select.Option value='DISTRIBUTOR'>Distributor</Select.Option>
              <Select.Option value='WHOLESALER'>Wholesaler</Select.Option>
              <Select.Option value='IMPORTER'>Importer</Select.Option>
              <Select.Option value='LOCAL_VENDOR'>Local Vendor</Select.Option>
            </Select>
            <Select
              placeholder='Category'
              value={supplierCategoryFilter}
              onChange={setSupplierCategoryFilter}
              style={{ width: 120 }}
              allowClear
            >
              <Select.Option value='PREFERRED'>Preferred</Select.Option>
              <Select.Option value='APPROVED'>Approved</Select.Option>
              <Select.Option value='TRIAL'>Trial</Select.Option>
              <Select.Option value='BLACKLISTED'>Blacklisted</Select.Option>
            </Select>
            <Select
              placeholder='Quality Rating'
              value={qualityRatingFilter}
              onChange={setQualityRatingFilter}
              style={{ width: 140 }}
              allowClear
            >
              <Select.Option value='EXCELLENT'>Excellent</Select.Option>
              <Select.Option value='GOOD'>Good</Select.Option>
              <Select.Option value='AVERAGE'>Average</Select.Option>
              <Select.Option value='POOR'>Poor</Select.Option>
            </Select>
            <Select
              placeholder='Status'
              value={
                activeStatusFilter !== undefined
                  ? activeStatusFilter
                    ? 'true'
                    : 'false'
                  : undefined
              }
              onChange={value =>
                setActiveStatusFilter(value !== undefined ? value === 'true' : undefined)
              }
              style={{ width: 100 }}
              allowClear
            >
              <Select.Option value='true'>Active</Select.Option>
              <Select.Option value='false'>Inactive</Select.Option>
            </Select>
          </Space>
        </div>

        <div className='table-container'>
          {loading && suppliers.length === 0 ? (
            <div className='loading-container'>
              <Spin size='large' tip='Loading suppliers...' />
            </div>
          ) : suppliers.length === 0 && !searchText ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No Suppliers found'>
              <GradientButton
                size='small'
                onClick={handleAddSupplier}
                disabled={currentCompany?.role === 'EMPLOYEE'}
              >
                Create First Supplier
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={suppliers}
              rowKey='id'
              loading={tableLoading || loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} suppliers`,
              }}
              scroll={{ x: 1000 }}
              className='suppliers-table'
            />
          )}
        </div>
      </div>

      <SupplierDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onSupplierCreated={handleSupplierSaved}
        onSupplierUpdated={handleSupplierSaved}
        mode={editingSupplier ? 'edit' : 'create'}
        supplierId={editingSupplier?.id}
        initialData={editingSupplier}
      />
    </MainLayout>
  );
}
