import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  message,
  Row,
  Col,
  Switch,
  Upload,
  Avatar,
  DatePicker,
} from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { GradientButton } from '../ui';
import { machineService, Machine, MachineStatus, OperationalStatus } from '../../services/machineService';
import { userService } from '../../services/userService';
import useAuth from '../../contexts/AuthContext';
import './MachineFormDrawer.scss';

const { Option } = Select;
const { TextArea } = Input;

// Industry-specific machine type options
const MACHINE_TYPE_OPTIONS_BY_INDUSTRY = {
  textile_manufacturing: [
    { value: 'Ring Spinning Frame', label: 'Ring Spinning Frame' },
    { value: 'Open End Spinning Machine', label: 'Open End Spinning Machine' },
    { value: 'Air Jet Loom', label: 'Air Jet Loom' },
    { value: 'Water Jet Loom', label: 'Water Jet Loom' },
    { value: 'Rapier Loom', label: 'Rapier Loom' },
    { value: 'Projectile Loom', label: 'Projectile Loom' },
    { value: 'Circular Knitting Machine', label: 'Circular Knitting Machine' },
    { value: 'Flat Knitting Machine', label: 'Flat Knitting Machine' },
    { value: 'Warp Knitting Machine', label: 'Warp Knitting Machine' },
    { value: 'Warping Machine', label: 'Warping Machine' },
    { value: 'Sizing Machine', label: 'Sizing Machine' },
    { value: 'Drawing Frame', label: 'Drawing Frame' },
    { value: 'Comber Machine', label: 'Comber Machine' },
    { value: 'Card Machine', label: 'Card Machine' },
    { value: 'Blow Room Machine', label: 'Blow Room Machine' },
  ],
  garment_production: [
    { value: 'Industrial Sewing Machine', label: 'Industrial Sewing Machine' },
    { value: 'Overlock Machine', label: 'Overlock Machine' },
    { value: 'Coverstitch Machine', label: 'Coverstitch Machine' },
    { value: 'Buttonhole Machine', label: 'Buttonhole Machine' },
    { value: 'Button Sewing Machine', label: 'Button Sewing Machine' },
    { value: 'Zigzag Machine', label: 'Zigzag Machine' },
    { value: 'Blind Stitch Machine', label: 'Blind Stitch Machine' },
    { value: 'Bartack Machine', label: 'Bartack Machine' },
    { value: 'Embroidery Machine', label: 'Embroidery Machine' },
    { value: 'Cutting Machine', label: 'Cutting Machine' },
    { value: 'Fabric Spreading Machine', label: 'Fabric Spreading Machine' },
    { value: 'Pattern Making Machine', label: 'Pattern Making Machine' },
    { value: 'Pressing Machine', label: 'Pressing Machine' },
    { value: 'Steam Press', label: 'Steam Press' },
    { value: 'Fusing Machine', label: 'Fusing Machine' },
  ],
  fabric_processing: [
    { value: 'Singeing Machine', label: 'Singeing Machine' },
    { value: 'Desizing Machine', label: 'Desizing Machine' },
    { value: 'Scouring Machine', label: 'Scouring Machine' },
    { value: 'Bleaching Machine', label: 'Bleaching Machine' },
    { value: 'Mercerizing Machine', label: 'Mercerizing Machine' },
    { value: 'Dyeing Machine', label: 'Dyeing Machine' },
    { value: 'Printing Machine', label: 'Printing Machine' },
    { value: 'Stentering Machine', label: 'Stentering Machine' },
    { value: 'Calendering Machine', label: 'Calendering Machine' },
    { value: 'Compacting Machine', label: 'Compacting Machine' },
    { value: 'Raising Machine', label: 'Raising Machine' },
    { value: 'Shearing Machine', label: 'Shearing Machine' },
    { value: 'Brushing Machine', label: 'Brushing Machine' },
    { value: 'Heat Setting Machine', label: 'Heat Setting Machine' },
  ],
  knitting_weaving: [
    { value: 'Circular Knitting Machine', label: 'Circular Knitting Machine' },
    { value: 'Flat Bed Knitting Machine', label: 'Flat Bed Knitting Machine' },
    { value: 'Warp Knitting Machine', label: 'Warp Knitting Machine' },
    { value: 'Raschel Machine', label: 'Raschel Machine' },
    { value: 'Tricot Machine', label: 'Tricot Machine' },
    { value: 'Air Jet Loom', label: 'Air Jet Loom' },
    { value: 'Water Jet Loom', label: 'Water Jet Loom' },
    { value: 'Rapier Loom', label: 'Rapier Loom' },
    { value: 'Projectile Loom', label: 'Projectile Loom' },
    { value: 'Shuttle Loom', label: 'Shuttle Loom' },
    { value: 'Jacquard Loom', label: 'Jacquard Loom' },
    { value: 'Dobby Loom', label: 'Dobby Loom' },
    { value: 'Warping Machine', label: 'Warping Machine' },
    { value: 'Sectional Warping Machine', label: 'Sectional Warping Machine' },
  ],
  dyeing_finishing: [
    { value: 'Jigger Dyeing Machine', label: 'Jigger Dyeing Machine' },
    { value: 'Winch Dyeing Machine', label: 'Winch Dyeing Machine' },
    { value: 'Jet Dyeing Machine', label: 'Jet Dyeing Machine' },
    { value: 'Beam Dyeing Machine', label: 'Beam Dyeing Machine' },
    { value: 'Package Dyeing Machine', label: 'Package Dyeing Machine' },
    { value: 'Hank Dyeing Machine', label: 'Hank Dyeing Machine' },
    { value: 'Continuous Dyeing Range', label: 'Continuous Dyeing Range' },
    { value: 'Pad Batch Dyeing Machine', label: 'Pad Batch Dyeing Machine' },
    { value: 'Rotary Screen Printing Machine', label: 'Rotary Screen Printing Machine' },
    { value: 'Flat Screen Printing Machine', label: 'Flat Screen Printing Machine' },
    { value: 'Digital Textile Printer', label: 'Digital Textile Printer' },
    { value: 'Stentering Machine', label: 'Stentering Machine' },
    { value: 'Calendering Machine', label: 'Calendering Machine' },
    { value: 'Compacting Machine', label: 'Compacting Machine' },
    { value: 'Emerizing Machine', label: 'Emerizing Machine' },
  ],
  other: [
    { value: 'Textile Machine', label: 'Textile Machine' },
    { value: 'Production Machine', label: 'Production Machine' },
    { value: 'Processing Equipment', label: 'Processing Equipment' },
    { value: 'Quality Control Equipment', label: 'Quality Control Equipment' },
    { value: 'Packaging Machine', label: 'Packaging Machine' },
    { value: 'Material Handling Equipment', label: 'Material Handling Equipment' },
    { value: 'Testing Equipment', label: 'Testing Equipment' },
    { value: 'Maintenance Equipment', label: 'Maintenance Equipment' },
    { value: 'Other', label: 'Other' },
  ],
};

interface MachineFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode?: 'create' | 'edit';
  editingMachineId?: string | null;
  locations: any[];
}

interface MachineFormValues {
  machineCode?: string;
  name: string;
  machineType: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: any;
  warrantyExpiry?: any;
  locationId: string;
  currentOperatorId?: string;
  operationalStatus?: string;
  specifications?: string;
  imageUrl?: string;
  qrCode?: string;
  status?: MachineStatus;
  isActive: boolean;
}

export const MachineFormDrawer: React.FC<MachineFormDrawerProps> = ({
  visible,
  onClose,
  onSaved,
  mode = 'create',
  editingMachineId,
  locations,
}) => {
  const [form] = Form.useForm<MachineFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [isActive, setIsActive] = useState(true);
  const { currentCompany } = useAuth();

  const isEditing = mode === 'edit' && !!editingMachineId;

  // Get machine types based on company industry
  const getMachineTypeOptions = () => {
    const industry = currentCompany?.industry || 'other';
    return (
      MACHINE_TYPE_OPTIONS_BY_INDUSTRY[industry as keyof typeof MACHINE_TYPE_OPTIONS_BY_INDUSTRY] ||
      MACHINE_TYPE_OPTIONS_BY_INDUSTRY.other
    );
  };

  useEffect(() => {
    if (!visible) return;

    const loadData = async () => {
      try {
        // Fetch users for operator dropdown
        const usersData = await userService.getCompanyUsers({ limit: 100 });
        setUsers(usersData.users || []);

        if (isEditing && editingMachineId) {
          const response = await machineService.getMachineById(editingMachineId);
          if (response.success && response.data) {
            populateForm(response.data);
          }
        } else {
          // Reset form first
          form.resetFields();
          const machineTypes = getMachineTypeOptions();
          // Set default values AFTER reset to ensure they stick
          form.setFieldsValue({
            machineType: machineTypes.length > 0 ? machineTypes[0].value : 'Other',
            operationalStatus: 'FREE',
            isActive: true, // Default to active in create mode
          });
          setIsActive(true);
          setImageUrl('');
        }
      } catch (error: any) {
        console.error('Error loading machine:', error);
        message.error(error.message || 'Failed to load machine');
      }
    };

    loadData();
  }, [visible, isEditing, editingMachineId]);

  const populateForm = (machine: Machine) => {
    form.setFieldsValue({
      machineCode: machine.machineCode,
      name: machine.name,
      machineType: machine.machineType,
      manufacturer: machine.manufacturer,
      model: machine.model,
      serialNumber: machine.serialNumber,
      purchaseDate: machine.purchaseDate ? dayjs(machine.purchaseDate) : undefined,
      warrantyExpiry: machine.warrantyExpiry ? dayjs(machine.warrantyExpiry) : undefined,
      locationId: machine.locationId,
      currentOperatorId: machine.currentOperatorId,
      operationalStatus: machine.operationalStatus,
      specifications: machine.specifications,
      qrCode: machine.qrCode,
      status: machine.status,
      isActive: machine.isActive,
    });
    setIsActive(machine.isActive);
    if (machine.imageUrl) {
      setImageUrl(machine.imageUrl);
    }
  };

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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        machineCode: values.machineCode,
        name: values.name,
        machineType: values.machineType,
        manufacturer: values.manufacturer,
        model: values.model,
        serialNumber: values.serialNumber,
        purchaseDate: values.purchaseDate,
        warrantyExpiry: values.warrantyExpiry,
        locationId: values.locationId,
        currentOperatorId: values.currentOperatorId,
        operationalStatus: values.operationalStatus as OperationalStatus,
        specifications: values.specifications,
        qrCode: values.qrCode,
        imageUrl: imageUrl || undefined,
        status: values.status as MachineStatus,
        isActive: values.isActive,
      };

      if (isEditing && editingMachineId) {
        await machineService.updateMachine(editingMachineId, payload);
        message.success('Machine updated successfully');
      } else {
        await machineService.createMachine(payload);
        message.success('Machine created successfully');
      }

      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving machine:', error);
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.message || 'Failed to save machine');
      }
    } finally {
      setSubmitting(false);
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
          <span>{isEditing ? 'Edit Machine' : 'Create Machine'}</span>
          <div className='header-switch'>
            <span className='switch-label'>Active</span>
            <Switch
              checked={isActive}
              onChange={checked => {
                setIsActive(checked);
                form.setFieldsValue({ isActive: checked });
              }}
              disabled={!isEditing}
            />
          </div>
        </div>
      }
      width={720}
      open={visible}
      onClose={handleCancel}
      footer={
        <div className='drawer-footer'>
          <Button onClick={handleCancel} disabled={submitting} size='middle'>
            Cancel
          </Button>
          <GradientButton onClick={handleSubmit} loading={submitting} size='middle'>
            {isEditing ? 'Update Machine' : 'Create Machine'}
          </GradientButton>
        </div>
      }
    >
      <Form
        form={form}
        layout='vertical'
        className='machine-form'
        onValuesChange={(_, allValues) => {
          if (allValues.isActive !== undefined) {
            setIsActive(allValues.isActive);
          }
        }}
      >
        <Form.Item name='isActive' valuePropName='checked' hidden>
          <Switch />
        </Form.Item>
        {/* Section 1: Basic Information with Image */}
        <div className='form-section'>
          <h3 className='section-title'>Basic Information</h3>

          {/* Image Upload */}
          <Col span={24}>
            <Upload
              name='avatar'
              listType='picture-circle'
              className='machine-image-upload'
              showUploadList={false}
              beforeUpload={beforeUpload}
            >
              {imageUrl ? (
                <Avatar src={imageUrl} size={120} className='machine-avatar' />
              ) : (
                <span className='machine-upload-icon'>
                  <ToolOutlined />
                </span>
              )}
            </Upload>
            <div className='machine-image-help-text'>
              Upload Machine Image (JPG/PNG, max 2MB)
              <br />
              Drag & drop or click to upload
            </div>
          </Col>

          <Row gutter={12}>
            <Col span={24}>
              <Form.Item
                name='name'
                label='Machine Name'
                rules={[{ required: true, message: 'Please enter machine name' }]}
              >
                <Input placeholder='Enter machine name' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name='machineCode' label='Machine Code'>
                <Input placeholder='Auto generated' disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='qrCode' label='QR Code'>
                <Input placeholder='Enter QR code' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name='machineType'
                label='Machine Type'
                rules={[{ required: true, message: 'Please select machine type' }]}
              >
                <Select placeholder='Select machine type'>
                  {getMachineTypeOptions().map((type: { value: string; label: string }) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='status'
                label='Machine Status'
                rules={[{ required: true, message: 'Please select machine status' }]}
                initialValue='NEW'
              >
                <Select placeholder='Select machine status'>
                  <Option value='NEW'>New</Option>
                  <Option value='IDLE'>Idle</Option>
                  <Option value='IN_USE'>In Use</Option>
                  <Option value='UNDER_MAINTENANCE'>Under Maintenance</Option>
                  <Option value='UNDER_REPAIR'>Under Repair</Option>
                  <Option value='DECOMMISSIONED'>Decommissioned</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name='currentOperatorId'
                label='Current Operator'
                rules={[{ required: true, message: 'Please select current operator' }]}
              >
                <Select placeholder='Select operator' allowClear showSearch filterOption={(input, option) =>
                  String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                }>
                  {users.map((user: any) => (
                    <Option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='operationalStatus'
                label='Operational Status'
                rules={[{ required: true, message: 'Please select operational status' }]}
                initialValue='FREE'
              >
                <Select placeholder='Select operational status'>
                  <Option value='FREE'>Free</Option>
                  <Option value='BUSY'>Busy</Option>
                  <Option value='RESERVED'>Reserved</Option>
                  <Option value='UNAVAILABLE'>Unavailable</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 2: Machine Details */}
        <div className='form-section'>
          <h3 className='section-title'>Machine Details</h3>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name='manufacturer' label='Manufacturer'>
                <Input placeholder='Enter manufacturer name' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='model' label='Model'>
                <Input placeholder='Enter model number' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name='serialNumber' label='Serial Number'>
                <Input placeholder='Enter serial number' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='locationId'
                label='Location'
                rules={[{ required: true, message: 'Please select location' }]}
              >
                <Select placeholder='Select location'>
                  {locations.map(location => (
                    <Option key={location.id} value={location.id}>
                      {location.name}
                      {location.isHeadquarters && ' (HQ)'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 3: Purchase & Warranty */}
        <div className='form-section'>
          <h3 className='section-title'>Purchase & Warranty</h3>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name='purchaseDate'
                label='Purchase Date'
                rules={[{ required: true, message: 'Please select purchase date' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder='Select purchase date' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='warrantyExpiry'
                label='Warranty Expiry'
                rules={[{ required: true, message: 'Please select warranty expiry date' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder='Select warranty expiry' />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 4: Technical Specifications */}
        <div className='form-section'>
          <h3 className='section-title'>Technical Specifications</h3>
          <Row gutter={12}>
            <Col span={24}>
              <Form.Item name='specifications' label='Technical Specifications'>
                <TextArea
                  rows={4}
                  placeholder='Enter technical specifications (e.g., Width: 200cm, Speed: 300rpm, Power: 5kW)'
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Drawer>
  );
};
