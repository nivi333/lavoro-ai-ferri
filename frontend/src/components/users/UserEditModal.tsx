import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  message,
  Divider,
  Alert,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { userService, User, UpdateUserRequest } from '../../services/userService';
import './UserEditModal.scss';

const { Option } = Select;

interface UserEditModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  visible,
  user,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roleChanged, setRoleChanged] = useState(false);
  const [originalRole, setOriginalRole] = useState<string>('');

  useEffect(() => {
    if (user && visible) {
      form.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        locationId: user.locationId,
        isActive: user.isActive,
      });
      setOriginalRole(user.role);
      setRoleChanged(false);
    }
  }, [user, visible, form]);

  const handleRoleChange = (newRole: string) => {
    setRoleChanged(newRole !== originalRole);
  };

  const handleSubmit = async (values: any) => {
    if (!user) return;

    // Show confirmation if role is being changed
    if (roleChanged) {
      Modal.confirm({
        title: 'Confirm Role Change',
        content: `Are you sure you want to change ${user.firstName}'s role from ${originalRole} to ${values.role}? This will affect their permissions.`,
        okText: 'Yes, Change Role',
        cancelText: 'Cancel',
        onOk: async () => {
          await performUpdate(values);
        },
      });
    } else {
      await performUpdate(values);
    }
  };

  const performUpdate = async (values: any) => {
    if (!user) return;

    setLoading(true);
    try {
      const updateData: UpdateUserRequest = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        role: values.role,
        department: values.department,
        locationId: values.locationId,
        isActive: values.isActive,
      };

      await userService.updateUser(user.id, updateData);
      message.success('User updated successfully');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setRoleChanged(false);
    onClose();
  };

  return (
    <Modal
      title={`Edit User: ${user?.firstName} ${user?.lastName}`}
      open={visible}
      onCancel={handleClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={600}
      okText="Save Changes"
      cancelText="Cancel"
    >
      <div className="user-edit-modal">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Divider orientation="left">Personal Information</Divider>

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

          <Divider orientation="left">Contact Details</Divider>

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
            label="Phone"
            name="phone"
          >
            <Input prefix={<PhoneOutlined />} placeholder="+1234567890" />
          </Form.Item>

          <Divider orientation="left">Role & Permissions</Divider>

          {roleChanged && (
            <Alert
              message="Role Change Warning"
              description="Changing the user's role will immediately affect their access permissions. Make sure this is intended."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Role is required' }]}
          >
            <Select onChange={handleRoleChange}>
              <Option value="OWNER">Owner</Option>
              <Option value="ADMIN">Admin</Option>
              <Option value="MANAGER">Manager</Option>
              <Option value="EMPLOYEE">Employee</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Department" name="department">
            <Input placeholder="e.g., Production, Quality Control" />
          </Form.Item>

          <Form.Item label="Location" name="locationId">
            <Select placeholder="Select location" allowClear>
              <Option value="">No specific location</Option>
              {/* Locations will be loaded dynamically */}
            </Select>
          </Form.Item>

          <Divider orientation="left">Account Status</Divider>

          <Form.Item
            label="Active Status"
            name="isActive"
            valuePropName="checked"
            extra="Inactive users cannot log in to the system"
          >
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Inactive"
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default UserEditModal;
