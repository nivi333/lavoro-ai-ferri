import React, { useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Upload,
  Divider,
  Alert,
  Table,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  UploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { userService, InviteUserRequest } from '../../services/userService';
import './UserInviteDrawer.scss';

const { Option } = Select;

interface UserInviteDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BulkUser {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const UserInviteDrawer: React.FC<UserInviteDrawerProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [inviteMode, setInviteMode] = useState<'single' | 'bulk'>('single');
  const [bulkUsers, setBulkUsers] = useState<BulkUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('EMPLOYEE');

  const rolePermissions = {
    OWNER: ['Full system access', 'Manage all users', 'Company settings', 'Billing'],
    ADMIN: ['Manage users', 'All modules access', 'Reports', 'Settings'],
    MANAGER: ['Team management', 'Module access', 'Reports'],
    EMPLOYEE: ['Limited module access', 'Basic operations'],
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const inviteData: InviteUserRequest = {
        email: values.email,
        phone: values.phone,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
        role: values.role,
        department: values.department,
        locationId: values.locationId,
      };

      await userService.inviteUser(inviteData);
      message.success('User invited successfully');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkInvite = async () => {
    if (bulkUsers.length === 0) {
      message.warning('Please add users to invite');
      return;
    }

    setLoading(true);
    try {
      const result = await userService.bulkInviteUsers({ users: bulkUsers as any });
      message.success(`Invited ${result.success.length} users successfully`);
      if (result.failed.length > 0) {
        message.warning(`${result.failed.length} invitations failed`);
      }
      setBulkUsers([]);
      onSuccess();
    } catch (error: any) {
      message.error(error.message || 'Failed to bulk invite users');
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = (file: UploadFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const users: BulkUser[] = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [email, firstName, lastName, role] = line.split(',');
        if (email && firstName && lastName) {
          users.push({
            email: email.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: (role?.trim() || 'EMPLOYEE').toUpperCase(),
          });
        }
      }

      if (users.length > 100) {
        message.warning('Maximum 100 users allowed. Only first 100 will be processed.');
        setBulkUsers(users.slice(0, 100));
      } else {
        setBulkUsers(users);
        message.success(`${users.length} users loaded from CSV`);
      }
    };
    reader.readAsText(file as any);
    return false; // Prevent auto upload
  };

  const bulkColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, __: BulkUser, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            const newUsers = [...bulkUsers];
            newUsers.splice(index, 1);
            setBulkUsers(newUsers);
          }}
        />
      ),
    },
  ];

  const handleClose = () => {
    form.resetFields();
    setBulkUsers([]);
    setInviteMode('single');
    onClose();
  };

  return (
    <Drawer
      title="Invite User"
      width={720}
      open={visible}
      onClose={handleClose}
      styles={{
        footer: {
          textAlign: 'right',
        },
      }}
      footer={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          {inviteMode === 'single' ? (
            <Button type="primary" onClick={() => form.submit()} loading={loading}>
              Send Invitation
            </Button>
          ) : (
            <Button type="primary" onClick={handleBulkInvite} loading={loading}>
              Invite {bulkUsers.length} Users
            </Button>
          )}
        </Space>
      }
    >
      <div className="user-invite-drawer">
        <div className="invite-mode-switch">
          <Button
            type={inviteMode === 'single' ? 'primary' : 'default'}
            onClick={() => setInviteMode('single')}
          >
            Single Invite
          </Button>
          <Button
            type={inviteMode === 'bulk' ? 'primary' : 'default'}
            onClick={() => setInviteMode('bulk')}
          >
            Bulk Invite
          </Button>
        </div>

        {inviteMode === 'single' ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="invite-form"
          >
            <Divider orientation="left">User Information</Divider>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Invalid email format' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="user@example.com" />
            </Form.Item>

            <Form.Item
              label="Phone (Optional)"
              name="phone"
            >
              <Input prefix={<PhoneOutlined />} placeholder="+1234567890" />
            </Form.Item>

            <Space style={{ width: '100%' }} size="middle">
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: 'First name is required' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input prefix={<UserOutlined />} placeholder="John" />
              </Form.Item>

              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: 'Last name is required' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input prefix={<UserOutlined />} placeholder="Doe" />
              </Form.Item>
            </Space>

            <Form.Item
              label="Temporary Password"
              name="password"
              rules={[
                { required: true, message: 'Password is required' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
              extra="User will be prompted to change this on first login"
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Temporary password" />
            </Form.Item>

            <Divider orientation="left">Role & Permissions</Divider>

            <Form.Item
              label="Role"
              name="role"
              initialValue="EMPLOYEE"
              rules={[{ required: true, message: 'Role is required' }]}
            >
              <Select onChange={(value) => setSelectedRole(value)}>
                <Option value="OWNER">Owner</Option>
                <Option value="ADMIN">Admin</Option>
                <Option value="MANAGER">Manager</Option>
                <Option value="EMPLOYEE">Employee</Option>
              </Select>
            </Form.Item>

            <Alert
              message="Role Permissions"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {rolePermissions[selectedRole as keyof typeof rolePermissions]?.map(
                    (perm, index) => (
                      <li key={index}>{perm}</li>
                    )
                  )}
                </ul>
              }
              type="info"
              style={{ marginBottom: 16 }}
            />

            <Form.Item label="Department (Optional)" name="department">
              <Input placeholder="e.g., Production, Quality Control" />
            </Form.Item>

            <Form.Item label="Location (Optional)" name="locationId">
              <Select placeholder="Select location">
                <Option value="">No specific location</Option>
                {/* Locations will be loaded dynamically */}
              </Select>
            </Form.Item>
          </Form>
        ) : (
          <div className="bulk-invite-section">
            <Alert
              message="Bulk Invite Instructions"
              description="Upload a CSV file with columns: Email, First Name, Last Name, Role (optional). Maximum 100 users per upload."
              type="info"
              style={{ marginBottom: 16 }}
            />

            <Upload
              accept=".csv"
              beforeUpload={handleCSVUpload}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} block>
                Upload CSV File
              </Button>
            </Upload>

            {bulkUsers.length > 0 && (
              <>
                <Divider>Users to Invite ({bulkUsers.length})</Divider>
                <Table
                  columns={bulkColumns}
                  dataSource={bulkUsers}
                  rowKey="email"
                  pagination={false}
                  size="small"
                  scroll={{ y: 300 }}
                />
              </>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default UserInviteDrawer;
