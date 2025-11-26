import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Space, Typography, Button } from 'antd';
import { companyService } from '../../services/companyService';
import useAuth from '../../contexts/AuthContext';
import { GradientButton } from '../ui';

const { Option } = Select;
const { Text } = Typography;

interface UserInviteModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CompanyLocation {
  id: string;
  name: string;
  type: string;
  isDefault: boolean;
}

const UserInviteModal: React.FC<UserInviteModalProps> = ({ visible, onClose, onSuccess }) => {
  const { currentCompany } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<CompanyLocation[]>([]);

  useEffect(() => {
    if (visible && currentCompany) {
      fetchLocations();
    }
  }, [visible, currentCompany]);

  const fetchLocations = async () => {
    try {
      // Assuming we have a method to get company locations
      // For now, we'll use a default location
      setLocations([
        {
          id: currentCompany?.id || '',
          name: 'Headquarters',
          type: 'HQ',
          isDefault: true,
        },
      ]);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!currentCompany) {
      message.error('No company selected. Please select a company first.');
      return;
    }

    console.log('=== USER INVITE MODAL DEBUG ===');
    console.log('currentCompany:', currentCompany);
    console.log('currentCompany.id:', currentCompany.id);
    console.log('form values:', values);

    setLoading(true);
    try {
      const inviteData = {
        emailOrPhone: values.emailOrPhone.trim(),
        role: values.role,
        companyId: currentCompany.id,
        locationId: values.locationId,
      };

      console.log('invite payload:', inviteData);
      console.log('API URL:', `companies/${currentCompany.id}/invite`);

      const result = await companyService.inviteUser(currentCompany.id, inviteData);
      console.log('API response:', result);

      message.success('User invitation sent successfully');

      form.resetFields();
      onSuccess();
      onClose(); // Close modal on success
    } catch (error: any) {
      console.error('Invite error:', error);
      message.error(error.message || 'Failed to invite users');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title='Invite Team Members'
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key='cancel' onClick={handleClose}>
          Cancel
        </Button>,
        <GradientButton
          key='submit'
          onClick={() => form.submit()}
          loading={loading}
          style={{ marginLeft: 8 }}
        >
          Send Invitation
        </GradientButton>,
      ]}
      width={500}
    >
      <Form form={form} layout='vertical' onFinish={handleSubmit}>
        <Form.Item
          name='emailOrPhone'
          label='Email or Phone'
          rules={[
            { required: true, message: 'Please enter email or phone number' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();

                const trimmedValue = value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^[+]?[0-9\s\-()]{10,}$/;

                if (!emailRegex.test(trimmedValue) && !phoneRegex.test(trimmedValue)) {
                  return Promise.reject(new Error('Please enter a valid email or phone number'));
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder='user@example.com or +1234567890' />
        </Form.Item>

        <Form.Item
          name='role'
          label='Role'
          rules={[{ required: true, message: 'Please select a role' }]}
        >
          <Select placeholder='Select role for all users'>
            <Option value='EMPLOYEE'>Employee</Option>
            <Option value='MANAGER'>Manager</Option>
            <Option value='ADMIN'>Admin</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name='locationId'
          label='Location'
          rules={[{ required: true, message: 'Please select a location' }]}
          initialValue={locations.find(loc => loc.isDefault)?.id}
        >
          <Select placeholder='Select location'>
            {locations.map(location => (
              <Option key={location.id} value={location.id}>
                <Space>
                  <span>{location.name}</span>
                  {location.isDefault && <Text type='secondary'>(Default)</Text>}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <div style={{ marginTop: 16 }}>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            • Only existing users can be invited to join your company
            <br />
            • User will receive an invitation to accept or decline
            <br />• Invalid or non-existent users will be reported
          </Text>
        </div>
      </Form>
    </Modal>
  );
};

export default UserInviteModal;
