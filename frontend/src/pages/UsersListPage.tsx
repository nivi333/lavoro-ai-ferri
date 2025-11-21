import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Avatar,
  Tag,
  Dropdown,
  Modal,
  message,
  Empty,
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  UserSwitchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { userService, User, UserFilters } from '../services/userService';
import UserInviteDrawer from '../components/users/UserInviteDrawer';
import UserEditModal from '../components/users/UserEditModal';
import './UsersListPage.scss';

const { Option } = Select;

const UsersListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [inviteDrawerVisible, setInviteDrawerVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: undefined,
    status: undefined,
    page: 1,
    limit: 25,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await userService.getCompanyUsers(filters);
      setUsers(result.users);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total,
      });
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleTableChange = (newPagination: any) => {
    setFilters({
      ...filters,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleRoleFilter = (value: string) => {
    setFilters({ ...filters, role: value || undefined, page: 1 });
  };

  const handleStatusFilter = (value: string) => {
    setFilters({ ...filters, status: value || undefined, page: 1 });
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalVisible(true);
  };

  const handleRemove = (user: User) => {
    Modal.confirm({
      title: 'Remove User',
      content: `Are you sure you want to remove ${user.firstName} ${user.lastName} from this company?`,
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          await userService.removeUser(user.id);
          message.success('User removed successfully');
          fetchUsers();
        } catch (error: any) {
          message.error(error.message || 'Failed to remove user');
        }
      },
    });
  };

  const handleChangeRole = (user: User) => {
    Modal.confirm({
      title: 'Change User Role',
      content: (
        <div>
          <p>Change role for {user.firstName} {user.lastName}:</p>
          <Select
            defaultValue={user.role}
            style={{ width: '100%', marginTop: 16 }}
            id="role-select"
          >
            <Option value="OWNER">Owner</Option>
            <Option value="ADMIN">Admin</Option>
            <Option value="MANAGER">Manager</Option>
            <Option value="EMPLOYEE">Employee</Option>
          </Select>
        </div>
      ),
      onOk: async () => {
        const selectElement = document.getElementById('role-select') as any;
        const newRole = selectElement?.value || user.role;
        try {
          await userService.updateUser(user.id, { role: newRole as any });
          message.success('User role updated successfully');
          fetchUsers();
        } catch (error: any) {
          message.error(error.message || 'Failed to update user role');
        }
      },
    });
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.updateUser(user.id, { isActive: !user.isActive });
      message.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || 'Failed to update user status');
    }
  };

  const handleBulkRoleChange = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select users first');
      return;
    }

    Modal.confirm({
      title: 'Bulk Role Change',
      content: (
        <div>
          <p>Change role for {selectedRowKeys.length} selected users:</p>
          <Select
            placeholder="Select new role"
            style={{ width: '100%', marginTop: 16 }}
            id="bulk-role-select"
          >
            <Option value="ADMIN">Admin</Option>
            <Option value="MANAGER">Manager</Option>
            <Option value="EMPLOYEE">Employee</Option>
          </Select>
        </div>
      ),
      onOk: async () => {
        const selectElement = document.getElementById('bulk-role-select') as any;
        const newRole = selectElement?.value;
        if (!newRole) {
          message.warning('Please select a role');
          return;
        }
        try {
          await userService.bulkUpdateUsers({
            userIds: selectedRowKeys as string[],
            role: newRole,
          });
          message.success('Users updated successfully');
          setSelectedRowKeys([]);
          fetchUsers();
        } catch (error: any) {
          message.error(error.message || 'Failed to update users');
        }
      },
    });
  };

  const handleBulkStatusChange = (isActive: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select users first');
      return;
    }

    Modal.confirm({
      title: `${isActive ? 'Activate' : 'Deactivate'} Users`,
      content: `Are you sure you want to ${isActive ? 'activate' : 'deactivate'} ${selectedRowKeys.length} selected users?`,
      okText: isActive ? 'Activate' : 'Deactivate',
      okType: isActive ? 'primary' : 'danger',
      onOk: async () => {
        try {
          await userService.bulkUpdateUsers({
            userIds: selectedRowKeys as string[],
            isActive,
          });
          message.success(`Users ${isActive ? 'activated' : 'deactivated'} successfully`);
          setSelectedRowKeys([]);
          fetchUsers();
        } catch (error: any) {
          message.error(error.message || 'Failed to update users');
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select users first');
      return;
    }

    Modal.confirm({
      title: 'Remove Users',
      content: `Are you sure you want to remove ${selectedRowKeys.length} selected users from this company?`,
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          await userService.bulkRemoveUsers(selectedRowKeys as string[]);
          message.success('Users removed successfully');
          setSelectedRowKeys([]);
          fetchUsers();
        } catch (error: any) {
          message.error(error.message || 'Failed to remove users');
        }
      },
    });
  };

  const getActionMenu = (user: User): MenuProps => ({
    items: [
      {
        key: 'edit',
        label: 'Edit User',
        icon: <EditOutlined />,
        onClick: () => handleEdit(user),
      },
      {
        key: 'changeRole',
        label: 'Change Role',
        icon: <UserSwitchOutlined />,
        onClick: () => handleChangeRole(user),
      },
      {
        key: 'toggleStatus',
        label: user.isActive ? 'Deactivate' : 'Activate',
        icon: user.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
        onClick: () => handleToggleStatus(user),
      },
      {
        type: 'divider',
      },
      {
        key: 'remove',
        label: 'Remove',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleRemove(user),
      },
    ],
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'blue';
      case 'ADMIN':
        return 'purple';
      case 'MANAGER':
        return 'green';
      case 'EMPLOYEE':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusTag = (isActive: boolean) => {
    return isActive ? (
      <Tag color="success">Active</Tag>
    ) : (
      <Tag color="error">Inactive</Tag>
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatLastActive = (date: string) => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return lastActive.toLocaleDateString();
  };

  const columns: TableColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar size={40} style={{ backgroundColor: '#7b5fc9' }}>
            {getInitials(record.firstName, record.lastName)}
          </Avatar>
          <div>
            <div className="user-name">
              {record.firstName} {record.lastName}
            </div>
            <div className="user-email">{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag color={getRoleBadgeColor(role)}>{role}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      width: 100,
      render: (isActive: boolean) => getStatusTag(isActive),
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActive',
      key: 'lastActive',
      width: 150,
      render: (date: string) => (
        <span className="last-active">{formatLastActive(date)}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      if (newSelectedRowKeys.length > 10) {
        message.warning('Maximum 10 users can be selected at once');
        return;
      }
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div className="users-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Team Members</h1>
          <p className="subtitle">{pagination.total} members</p>
        </div>
        <div className="header-right">
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setInviteDrawerVisible(true)}
          >
            Invite User
          </Button>
        </div>
      </div>

      <div className="filters-section">
        <Space size="middle" wrap>
          <Input
            placeholder="Search by name, email, or role"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            allowClear
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Select
            placeholder="Filter by role"
            style={{ width: 150 }}
            allowClear
            onChange={handleRoleFilter}
          >
            <Option value="OWNER">Owner</Option>
            <Option value="ADMIN">Admin</Option>
            <Option value="MANAGER">Manager</Option>
            <Option value="EMPLOYEE">Employee</Option>
          </Select>
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            allowClear
            onChange={handleStatusFilter}
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </Space>
      </div>

      {selectedRowKeys.length > 0 && (
        <div className="bulk-actions">
          <Space>
            <span className="selected-count">
              {selectedRowKeys.length} users selected
            </span>
            <Button size="small" onClick={handleBulkRoleChange}>
              Change Role
            </Button>
            <Button size="small" onClick={() => handleBulkStatusChange(true)}>
              Activate
            </Button>
            <Button size="small" onClick={() => handleBulkStatusChange(false)}>
              Deactivate
            </Button>
            <Button size="small" danger onClick={handleBulkDelete}>
              Remove
            </Button>
            <Button size="small" type="text" onClick={() => setSelectedRowKeys([])}>
              Clear Selection
            </Button>
          </Space>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowSelection={rowSelection}
        locale={{
          emptyText: (
            <Empty
              image={<FolderOpenOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
              description="No team members found"
            >
              <Button type="primary" onClick={() => setInviteDrawerVisible(true)}>
                Invite Your First User
              </Button>
            </Empty>
          ),
        }}
      />

      <UserInviteDrawer
        visible={inviteDrawerVisible}
        onClose={() => setInviteDrawerVisible(false)}
        onSuccess={() => {
          setInviteDrawerVisible(false);
          fetchUsers();
        }}
      />

      <UserEditModal
        visible={editModalVisible}
        user={selectedUser}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setEditModalVisible(false);
          setSelectedUser(null);
          fetchUsers();
        }}
      />
    </div>
  );
};

export default UsersListPage;
