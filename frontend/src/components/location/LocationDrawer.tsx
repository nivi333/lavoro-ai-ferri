import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Typography,
  Alert,
  Upload,
  Avatar,
  message,
} from 'antd';
import { EnvironmentOutlined, UploadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LOCATION_TYPE_LABELS,
  LOCATION_TYPE_COLORS,
  LOCATION_VALIDATION_MESSAGES,
  LOCATION_DRAWER_CONFIG,
} from '../../constants/location';
import { locationService, Location, CreateLocationRequest } from '../../services/locationService';
import './LocationDrawer.scss';

const { Title, Text } = Typography;

// Form validation schema
const locationSchema = z.object({
  name: z
    .string()
    .min(2, LOCATION_VALIDATION_MESSAGES.NAME_MIN_LENGTH)
    .max(100, LOCATION_VALIDATION_MESSAGES.NAME_MAX_LENGTH),
  email: z.string().email(LOCATION_VALIDATION_MESSAGES.EMAIL_INVALID).optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().min(1, LOCATION_VALIDATION_MESSAGES.COUNTRY_REQUIRED),
  addressLine1: z.string().min(1, LOCATION_VALIDATION_MESSAGES.ADDRESS_LINE_1_REQUIRED),
  addressLine2: z.string().optional(),
  city: z.string().min(1, LOCATION_VALIDATION_MESSAGES.CITY_REQUIRED),
  state: z.string().min(1, LOCATION_VALIDATION_MESSAGES.STATE_REQUIRED),
  pincode: z.string().min(1, LOCATION_VALIDATION_MESSAGES.PINCODE_REQUIRED),
  locationType: z.enum(['HEADQUARTERS', 'BRANCH', 'WAREHOUSE', 'FACTORY']),
  isDefault: z.boolean(),
  isHeadquarters: z.boolean(),
});

type LocationFormData = z.infer<typeof locationSchema>;

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

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      country: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      locationType: 'BRANCH',
      isDefault: false,
      isHeadquarters: false,
    },
  });

  const watchedIsDefault = watch('isDefault');
  const watchedIsHeadquarters = watch('isHeadquarters');

  useEffect(() => {
    if (editingLocation) {
      reset({
        name: editingLocation.name,
        email: editingLocation.email || '',
        phone: editingLocation.phone || '',
        country: editingLocation.country,
        addressLine1: editingLocation.addressLine1,
        addressLine2: editingLocation.addressLine2 || '',
        city: editingLocation.city,
        state: editingLocation.state,
        pincode: editingLocation.pincode,
        locationType: editingLocation.locationType,
        isDefault: editingLocation.isDefault,
        isHeadquarters: editingLocation.isHeadquarters,
      });
      if (editingLocation.imageUrl) {
        setImageUrl(editingLocation.imageUrl);
      }
    } else {
      reset();
      setImageUrl('');
    }
  }, [editingLocation, reset]);

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

  const onSubmit = async (data: LocationFormData) => {
    try {
      setLoading(true);

      // Validate business logic
      if (data.isDefault && !editingLocation) {
        const existingDefault = locations.find(loc => loc.isDefault);
        if (existingDefault) {
          message.error(LOCATION_VALIDATION_MESSAGES.ONLY_ONE_DEFAULT);
          return;
        }
      }

      if (data.isHeadquarters && !editingLocation) {
        const existingHeadquarters = locations.find(loc => loc.isHeadquarters);
        if (existingHeadquarters) {
          message.error(LOCATION_VALIDATION_MESSAGES.ONLY_ONE_HEADQUARTERS);
          return;
        }
      }

      const locationData: CreateLocationRequest = {
        ...data,
        imageUrl: imageUrl || undefined,
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
    if (isDirty) {
      // You could add a confirmation dialog here if needed
    }
    onClose();
  };

  return (
    <Drawer
      title={
        <div className='drawer-title'>
          <EnvironmentOutlined />
          <span>{editingLocation ? 'Edit Location' : 'Add New Location'}</span>
        </div>
      }
      placement={LOCATION_DRAWER_CONFIG.PLACEMENT}
      width={LOCATION_DRAWER_CONFIG.WIDTH}
      open={visible}
      onClose={handleCancel}
      className='location-drawer'
      footer={
        <div className='drawer-footer'>
          <Space>
            <Button onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type='primary' onClick={handleSubmit(onSubmit)} loading={loading}>
              {editingLocation ? 'Update Location' : 'Create Location'}
            </Button>
          </Space>
        </div>
      }
    >
      <form className='location-form'>
        <div className='form-section'>
          <Title level={5} className='section-title'>
            Basic Information
          </Title>

          <div className='form-row'>
            <div className='form-field'>
              <label className='field-label'>Location Image</label>
              <Upload
                name='avatar'
                listType='picture-card'
                className='avatar-uploader'
                showUploadList={false}
                beforeUpload={beforeUpload}
              >
                {imageUrl ? (
                  <Avatar size={80} src={imageUrl} />
                ) : (
                  <div className='upload-placeholder'>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
              <Text type='secondary' className='field-help'>
                Upload location image (JPG/PNG, max 2MB)
              </Text>
            </div>

            <div className='form-field'>
              <label className='field-label required'>Location Name</label>
              <Controller
                name='name'
                control={control}
                render={({ field }: any) => (
                  <Input
                    {...field}
                    placeholder='Enter location name'
                    status={errors.name ? 'error' : ''}
                  />
                )}
              />
              {errors.name && (
                <Text type='danger' className='field-error'>
                  {errors.name.message}
                </Text>
              )}
            </div>
          </div>

          <div className='form-row'>
            <div className='form-field'>
              <label className='field-label'>Email Address</label>
              <Controller
                name='email'
                control={control}
                render={({ field }: any) => (
                  <Input
                    {...field}
                    placeholder='location@company.com'
                    status={errors.email ? 'error' : ''}
                  />
                )}
              />
              {errors.email && (
                <Text type='danger' className='field-error'>
                  {errors.email.message}
                </Text>
              )}
            </div>

            <div className='form-field'>
              <label className='field-label'>Phone Number</label>
              <Controller
                name='phone'
                control={control}
                render={({ field }: any) => (
                  <Input
                    {...field}
                    placeholder='+1 234 567 8900'
                    status={errors.phone ? 'error' : ''}
                  />
                )}
              />
              {errors.phone && (
                <Text type='danger' className='field-error'>
                  {errors.phone.message}
                </Text>
              )}
            </div>

            <div className='form-field'>
              <label className='field-label required'>Location Type</label>
              <Controller
                name='locationType'
                control={control}
                render={({ field }: any) => (
                  <Select
                    {...field}
                    placeholder='Select location type'
                    status={errors.locationType ? 'error' : ''}
                    options={
                      Object.entries(LOCATION_TYPE_LABELS).map(([key, label]) => ({
                        value: key,
                        label: (
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
                        ),
                      })) as any
                    }
                  />
                )}
              />
              {errors.locationType && (
                <Text type='danger' className='field-error'>
                  {errors.locationType.message}
                </Text>
              )}
            </div>

            <div className='form-field'>
              <label className='field-label required'>Country</label>
              <Controller
                name='country'
                control={control}
                render={({ field }: any) => (
                  <Input
                    {...field}
                    placeholder='Enter country'
                    status={errors.country ? 'error' : ''}
                  />
                )}
              />
              {errors.country && (
                <Text type='danger' className='field-error'>
                  {errors.country.message}
                </Text>
              )}
            </div>

            <div className='form-field'>
              <label className='field-label required'>Address Line 1</label>
              <Controller
                name='addressLine1'
                control={control}
                render={({ field }: any) => (
                  <Input
                    {...field}
                    placeholder='Street address'
                    status={errors.addressLine1 ? 'error' : ''}
                  />
                )}
              />
              {errors.addressLine1 && (
                <Text type='danger' className='field-error'>
                  {errors.addressLine1.message}
                </Text>
              )}
            </div>

            <div className='form-field'>
              <label className='field-label'>Address Line 2</label>
              <Controller
                name='addressLine2'
                control={control}
                render={({ field }: any) => (
                  <Input {...field} placeholder='Apartment, suite, unit, building, floor, etc.' />
                )}
              />
            </div>
          </div>
        </div>

        <div className='form-section'>
          <Title level={5} className='section-title'>
            Address Information
          </Title>

          <div className='form-row'>
            <div className='form-field'>
              <label className='field-label required'>City</label>
              <Controller
                name='city'
                control={control}
                render={({ field }: any) => (
                  <Input {...field} placeholder='Enter city' status={errors.city ? 'error' : ''} />
                )}
              />
              {errors.city && (
                <Text type='danger' className='field-error'>
                  {errors.city.message}
                </Text>
              )}
            </div>

            <div className='form-field'>
              <label className='field-label required'>State/Province</label>
              <Controller
                name='state'
                control={control}
                render={({ field }: any) => (
                  <Input
                    {...field}
                    placeholder='Enter state'
                    status={errors.state ? 'error' : ''}
                  />
                )}
              />
              {errors.state && (
                <Text type='danger' className='field-error'>
                  {errors.state.message}
                </Text>
              )}
            </div>
          </div>

          <div className='form-field'>
            <label className='field-label required'>Postal/ZIP Code</label>
            <Controller
              name='pincode'
              control={control}
              render={({ field }: any) => (
                <Input
                  {...field}
                  placeholder='Enter postal code'
                  status={errors.pincode ? 'error' : ''}
                />
              )}
            />
            {errors.pincode && (
              <Text type='danger' className='field-error'>
                {errors.pincode.message}
              </Text>
            )}
          </div>

          <div className='form-field'>
            <Controller
              name='isDefault'
              control={control}
              render={({ field }: any) => (
                <div className='switch-field'>
                  <Switch {...field} checked={field.value} />
                  <div className='switch-label'>
                    <Text strong>Default Location</Text>
                    <Text type='secondary' className='switch-description'>
                      This location will be used as the default for company operations, invoices,
                      and financial documents.
                    </Text>
                  </div>
                </div>
              )}
            />
          </div>

          <div className='form-field'>
            <Controller
              name='isHeadquarters'
              control={control}
              render={({ field }: any) => (
                <div className='switch-field'>
                  <Switch {...field} checked={field.value} />
                  <div className='switch-label'>
                    <Text strong>Headquarters</Text>
                    <Text type='secondary' className='switch-description'>
                      This location will be designated as the company headquarters. Only one
                      headquarters can be set per company.
                    </Text>
                  </div>
                </div>
              )}
            />
          </div>

          {(watchedIsDefault || watchedIsHeadquarters) && (
            <Alert
              message='Special Location'
              description={
                watchedIsHeadquarters
                  ? 'This location will be marked as the company headquarters.'
                  : 'This location will be used as the default for company operations.'
              }
              type='info'
              showIcon
              icon={<InfoCircleOutlined />}
              className='info-alert'
            />
          )}
        </div>
      </form>
    </Drawer>
  );
};

export default LocationDrawer;
