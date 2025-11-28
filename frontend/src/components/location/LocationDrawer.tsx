import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Upload,
  Avatar,
  message,
  Form,
  Row,
  Col,
  Divider,
} from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { LOCATION_TYPE_LABELS, LOCATION_TYPE_COLORS } from '../../constants/location';
import { locationService, Location, CreateLocationRequest } from '../../services/locationService';
import { GradientButton, CountrySelect } from '../ui';
import './LocationDrawer.scss';

interface LocationDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingLocation?: Location | null;
  locations: Location[];
}

const LocationDrawer: React.FC<LocationDrawerProps> = ({
  visible,
  onClose,
  onSave,
  editingLocation,
  locations,
}) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (editingLocation) {
        form.setFieldsValue({
          name: editingLocation.name,
          locationId: editingLocation.locationId,
          email: editingLocation.email || '',
          phone: editingLocation.phone || '',
          country: editingLocation.country,
          addressLine1: editingLocation.addressLine1 || '',
          addressLine2: editingLocation.addressLine2 || '',
          city: editingLocation.city,
          state: editingLocation.state,
          pincode: editingLocation.pincode,
          locationType: editingLocation.locationType,
          isDefault: editingLocation.isDefault || false,
          isHeadquarters: editingLocation.isHeadquarters || false,
          isActive: editingLocation.isActive !== undefined ? editingLocation.isActive : true,
        });
        setIsActive(editingLocation.isActive !== undefined ? editingLocation.isActive : true);
        if (editingLocation.imageUrl) {
          setImageUrl(editingLocation.imageUrl);
        }
      } else {
        // Reset form first
        form.resetFields();
        // Then set default values to ensure they stick
        form.setFieldsValue({
          isActive: true, // Default to active for new locations
          isDefault: false,
          isHeadquarters: false,
        });
        setIsActive(true);
        setImageUrl('');
      }
    }
  }, [visible, editingLocation, form]);

  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
      return false;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = e => {
      setImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    return false; // Prevent automatic upload
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      // Validate business logic
      if (values.isDefault && !editingLocation) {
        const existingDefault = locations.find(loc => loc.isDefault);
        if (existingDefault) {
          message.error('Only one default location is allowed per company');
          return;
        }
      }

      if (values.isHeadquarters && !editingLocation) {
        const existingHeadquarters = locations.find(loc => loc.isHeadquarters);
        if (existingHeadquarters) {
          message.error('Only one headquarters location is allowed per company');
          return;
        }
      }

      const { locationId, ...restValues } = values;

      const locationData: CreateLocationRequest = {
        ...restValues,
        imageUrl: imageUrl || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        addressLine2: values.addressLine2 || undefined,
      };

      if (editingLocation) {
        await locationService.updateLocation(editingLocation.id, locationData);
        message.success('Location updated successfully');
      } else {
        await locationService.createLocation(locationData);
        message.success('Location created successfully');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving location:', error);
      message.error('Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setImageUrl('');
    onClose();
  };

  return (
    <Drawer
      title={
        <div className='drawer-header-with-switch'>
          <span>{editingLocation ? 'Edit Location' : 'Add New Location'}</span>
          <div className='header-switch'>
            <span className='switch-label'>Active</span>
            <Switch
              checked={isActive}
              onChange={checked => {
                setIsActive(checked);
                form.setFieldsValue({ isActive: checked });
              }}
              disabled={!editingLocation}
            />
          </div>
        </div>
      }
      placement='right'
      width={680}
      open={visible}
      onClose={handleCancel}
      className='location-drawer'
      footer={null}
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={onFinish}
        className='ccd-form'
        onValuesChange={(_, allValues) => {
          if (allValues.isActive !== undefined) {
            setIsActive(allValues.isActive);
          }
        }}
      >
        <Form.Item name='isActive' valuePropName='checked' hidden>
          <Switch />
        </Form.Item>
        <div className='ccd-form-content'>
          {/* Section 1: Basic Information */}
          <div className='ccd-section'>
            <div className='ccd-section-header'>
              <div className='ccd-section-title'>Basic Information</div>
            </div>
            <Col span={24}>
              <Upload
                name='avatar'
                listType='picture-circle'
                className='ccd-logo-upload'
                showUploadList={false}
                beforeUpload={beforeUpload}
              >
                {imageUrl ? (
                  <Avatar src={imageUrl} className='location-avatar' />
                ) : (
                  <span className='ccd-upload-icon'>
                    <EnvironmentOutlined />
                  </span>
                )}
              </Upload>
              <div className='ccd-logo-help-text'>
                Upload Location Image (JPG/PNG, max 2MB)
                <br />
                Drag & drop or click to upload
              </div>
            </Col>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label='Location ID' name='locationId'>
                  <Input
                    disabled
                    autoComplete='off'
                    placeholder='Auto generated'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='Location Name'
                  name='name'
                  rules={[{ required: true, message: 'Please enter location name' }]}
                >
                  <Input
                    maxLength={100}
                    autoComplete='off'
                    placeholder='Enter location name'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label='Email Address'
                  name='email'
                  rules={[
                    {
                      type: 'email',
                      message: 'Please enter a valid email address',
                    },
                  ]}
                >
                  <Input
                    autoComplete='off'
                    placeholder='location@company.com'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label='Phone Number' name='phone'>
                  <Input autoComplete='off' placeholder='+1 234 567 8900' className='ccd-input' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='Location Type'
                  name='locationType'
                  rules={[{ required: true, message: 'Please select location type' }]}
                >
                  <Select placeholder='Select location type' className='ccd-select'>
                    {Object.entries(LOCATION_TYPE_LABELS).map(([key, label]) => (
                      <Select.Option key={key} value={key}>
                        <Space>
                          <div
                            className='type-indicator'
                            style={{
                              backgroundColor:
                                LOCATION_TYPE_COLORS[key as keyof typeof LOCATION_TYPE_COLORS],
                            }}
                          />
                          {label}
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='Country'
                  name='country'
                  rules={[{ required: true, message: 'Please select country' }]}
                >
                  <CountrySelect className='ccd-select' />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider className='ccd-divider' />

          {/* Section 2: Address Information */}
          <div className='ccd-section'>
            <div className='ccd-section-title'>Address Information</div>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label='Address Line 1'
                  name='addressLine1'
                  rules={[{ required: true, message: 'Please enter address' }]}
                >
                  <Input
                    maxLength={255}
                    autoComplete='off'
                    placeholder='Street address'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label='Address Line 2' name='addressLine2'>
                  <Input
                    maxLength={255}
                    autoComplete='off'
                    placeholder='Apartment, suite, unit, building, floor, etc.'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label='City'
                  name='city'
                  rules={[{ required: true, message: 'Please enter city' }]}
                >
                  <Input
                    maxLength={100}
                    autoComplete='off'
                    placeholder='Enter city'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='State/Province'
                  name='state'
                  rules={[{ required: true, message: 'Please enter state' }]}
                >
                  <Input
                    maxLength={100}
                    autoComplete='off'
                    placeholder='Enter state'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='Postal/ZIP Code'
                  name='pincode'
                  rules={[{ required: true, message: 'Please enter postal code' }]}
                >
                  <Input
                    maxLength={20}
                    autoComplete='off'
                    placeholder='Enter postal code'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider className='ccd-divider' />

          {/* Section 3: Location Settings */}
          <div className='ccd-section'>
            <div className='ccd-section-title'>Location Settings</div>
            <Row gutter={16}>
              <Col span={12}>
                <div className='switch-field'>
                  <Form.Item
                    label='Default Location'
                    name='isDefault'
                    valuePropName='checked'
                    className='switch-form-item'
                  >
                    <Switch />
                  </Form.Item>
                  <div className='switch-label'></div>
                </div>
              </Col>
              <Col span={12}>
                <div className='switch-field'>
                  <Form.Item
                    label='Headquarters'
                    name='isHeadquarters'
                    valuePropName='checked'
                    className='switch-form-item'
                  >
                    <Switch />
                  </Form.Item>
                  <div className='switch-label'></div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Action Buttons */}
        </div>
        <div className='ccd-actions'>
          <Button onClick={handleCancel} className='ccd-cancel-btn'>
            Cancel
          </Button>
          <GradientButton size='small' htmlType='submit' loading={loading}>
            {editingLocation ? 'Update Location' : 'Create Location'}
          </GradientButton>
        </div>
      </Form>
    </Drawer>
  );
};

export default LocationDrawer;
