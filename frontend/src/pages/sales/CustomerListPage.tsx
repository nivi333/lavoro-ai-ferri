import { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Tag,
  Avatar,
  Dropdown,
  Modal,
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
  UserOutlined,
  MoreOutlined,
  SearchOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { customerService, Customer, CustomerFilters } from '../../services/customerService';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { CustomerDrawer } from '../../components/sales/CustomerDrawer';
import './CustomerListPage.scss';

export default function CustomerListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string | undefined>(undefined);
  const [customerCategoryFilter, setCustomerCategoryFilter] = useState<string | undefined>(
    undefined
  );
  const [paymentTermsFilter, setPaymentTermsFilter] = useState<string | undefined>(undefined);
  const [activeStatusFilter, setActiveStatusFilter] = useState<boolean | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  // Set header actions when component mounts
  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton
        onClick={handleAddCustomer}
        size='small'
        className='add-customer-btn'
        disabled={isEmployee}
      >
        Add Customer
      </GradientButton>
    );

    // Cleanup when component unmounts
    return () => setHeaderActions(null);
  }, [setHeaderActions, currentCompany?.role]);

  useEffect(() => {
    if (currentCompany) {
      fetchCustomers();
    }
  }, [
    currentCompany,
    searchText,
    customerTypeFilter,
    customerCategoryFilter,
    paymentTermsFilter,
    activeStatusFilter,
  ]);

  const fetchCustomers = async () => {
    if (fetchInProgressRef.current) {
      return;
    }

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const filters: CustomerFilters = {
        search: searchText || undefined,
        customerType: customerTypeFilter,
        customerCategory: customerCategoryFilter,
        paymentTerms: paymentTermsFilter,
        isActive: activeStatusFilter,
      };
      const result = await customerService.getCustomers(filters);
      setCustomers(result.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error('Failed to fetch customers');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(undefined);
    setDrawerOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setDrawerOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Modal.confirm({
      title: 'Delete Customer',
      content: `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setTableLoading(true);
          await customerService.deleteCustomer(customer.id);
          message.success('Customer deleted successfully');
          fetchCustomers();
        } catch (error) {
          console.error('Error deleting customer:', error);
          message.error('Failed to delete customer');
        } finally {
          setTableLoading(false);
        }
      },
    });
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingCustomer(undefined);
  };

  const handleCustomerSaved = () => {
    fetchCustomers();
    handleDrawerClose();
  };

  const getActionMenuItems = (customer: Customer) => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    return [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => handleEditCustomer(customer),
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit',
        onClick: () => handleEditCustomer(customer),
        disabled: isEmployee,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'create-order',
        icon: <ShoppingCartOutlined />,
        label: 'Create Order',
        onClick: () => {
          message.info('Create Order functionality coming soon');
        },
        disabled: isEmployee,
      },
      {
        key: 'view-orders',
        icon: <FileTextOutlined />,
        label: 'View Orders',
        onClick: () => {
          message.info('View Orders functionality coming soon');
        },
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete',
        onClick: () => handleDeleteCustomer(customer),
        danger: true,
        disabled: isEmployee,
      },
    ];
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      sorter: (a: Customer, b: Customer) => (a.code || '').localeCompare(b.code || ''),
      render: (code: string) => (
        <span className='table-cell-secondary' style={{ fontFamily: 'monospace' }}>
          {code}
        </span>
      ),
    },
    {
      title: 'Customer Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      ellipsis: true,
      sorter: (a: Customer, b: Customer) => (a.name || '').localeCompare(b.name || ''),
      render: (name: string, record: Customer) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar icon={<UserOutlined />} style={{ flexShrink: 0, backgroundColor: '#df005c' }}>
            {name.charAt(0)}
          </Avatar>
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <div
              className='customer-name'
              style={{
                fontWeight: 500,
                marginBottom: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name}
            </div>
            {record.companyName && (
              <div
                className='company-name'
                style={{
                  color: '#666',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {record.companyName}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true,
      sorter: (a: Customer, b: Customer) => (a.email || '').localeCompare(b.email || ''),
      render: (email: string) => email || '—',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      ellipsis: true,
      sorter: (a: Customer, b: Customer) => (a.phone || '').localeCompare(b.phone || ''),
      render: (phone: string) => phone || '—',
    },
    {
      title: 'Type',
      dataIndex: 'customerType',
      key: 'customerType',
      width: 100,
      sorter: (a: Customer, b: Customer) =>
        (a.customerType || '').localeCompare(b.customerType || ''),
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          INDIVIDUAL: 'blue',
          BUSINESS: 'green',
          DISTRIBUTOR: 'purple',
          RETAILER: 'orange',
          WHOLESALER: 'cyan',
        };
        const color = colorMap[type] || 'default';
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: 'Credit Limit',
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      width: 120,
      sorter: (a: Customer, b: Customer) => (a.creditLimit || 0) - (b.creditLimit || 0),
      render: (creditLimit?: number) => {
        if (!creditLimit) return '—';
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
        }).format(creditLimit);
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 80,
      sorter: (a: Customer, b: Customer) => (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0),
      render: (record: Customer) => (
        <Tag color={record.isActive ? 'success' : 'default'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (record: Customer) => (
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
        <div className='no-company-message'>Please select a company to manage customers.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2}>Customers</Heading>
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
              placeholder='Customer Type'
              value={customerTypeFilter}
              onChange={setCustomerTypeFilter}
              style={{ width: 140 }}
              allowClear
            >
              <Select.Option value='INDIVIDUAL'>Individual</Select.Option>
              <Select.Option value='BUSINESS'>Business</Select.Option>
              <Select.Option value='DISTRIBUTOR'>Distributor</Select.Option>
              <Select.Option value='RETAILER'>Retailer</Select.Option>
              <Select.Option value='WHOLESALER'>Wholesaler</Select.Option>
            </Select>
            <Select
              placeholder='Category'
              value={customerCategoryFilter}
              onChange={setCustomerCategoryFilter}
              style={{ width: 120 }}
              allowClear
            >
              <Select.Option value='VIP'>VIP</Select.Option>
              <Select.Option value='REGULAR'>Regular</Select.Option>
              <Select.Option value='NEW'>New</Select.Option>
              <Select.Option value='INACTIVE'>Inactive</Select.Option>
            </Select>
            <Select
              placeholder='Payment Terms'
              value={paymentTermsFilter}
              onChange={setPaymentTermsFilter}
              style={{ width: 140 }}
              allowClear
            >
              <Select.Option value='NET_30'>Net 30</Select.Option>
              <Select.Option value='NET_60'>Net 60</Select.Option>
              <Select.Option value='NET_90'>Net 90</Select.Option>
              <Select.Option value='ADVANCE'>Advance</Select.Option>
              <Select.Option value='COD'>Cash on Delivery</Select.Option>
              <Select.Option value='CREDIT'>Credit</Select.Option>
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
          {loading && customers.length === 0 ? (
            <div className='loading-container'>
              <Spin size='large' />
            </div>
          ) : customers.length === 0 && !searchText ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No Customers found'>
              <GradientButton
                size='small'
                onClick={handleAddCustomer}
                disabled={currentCompany?.role === 'EMPLOYEE'}
              >
                Create First Customer
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={customers}
              rowKey='id'
              loading={tableLoading || loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`,
              }}
              scroll={{ x: 1000 }}
              className='customers-table'
            />
          )}
        </div>
      </div>

      <CustomerDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onCustomerCreated={handleCustomerSaved}
        onCustomerUpdated={handleCustomerSaved}
        mode={editingCustomer ? 'edit' : 'create'}
        customerId={editingCustomer?.id}
        initialData={editingCustomer}
      />
    </MainLayout>
  );
}
