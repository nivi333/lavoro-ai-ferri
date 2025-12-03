import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Row,
  Col,
  DatePicker,
  Switch,
  InputNumber,
  Divider,
  Button,
  App,
} from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  fabricProductionService,
  FabricProduction,
  CreateFabricProductionData,
  FABRIC_TYPES,
  QUALITY_GRADES,
} from '../../services/textileService';
import { GradientButton, ImageUpload } from '../ui';
import '../CompanyCreationDrawer.scss';

const { Option } = Select;
const { TextArea } = Input;

interface FabricProductionDrawerProps {
  visible: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  fabric?: FabricProduction | null;
}

export const FabricProductionDrawer: React.FC<FabricProductionDrawerProps> = ({
  visible,
  onClose,
  fabric,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>('');

  const isEditing = !!fabric;

  useEffect(() => {
    if (visible) {
      if (fabric) {
        form.setFieldsValue({
          ...fabric,
          productionDate: dayjs(fabric.productionDate),
        });
        setIsActive(fabric.isActive ?? true);
        setImageUrl(fabric.imageUrl || '');
      } else {
        form.resetFields();
        form.setFieldsValue({
          isActive: true,
          productionDate: dayjs(),
        });
        setIsActive(true);
        setImageUrl('');
      }
    }
  }, [visible, fabric, form]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const fabricData: CreateFabricProductionData = {
        ...values,
        productionDate: values.productionDate.toISOString(),
        weightGsm: Number(values.weightGsm),
        widthInches: Number(values.widthInches),
        quantityMeters: Number(values.quantityMeters),
        imageUrl: imageUrl || undefined,
        isActive,
      };

      if (isEditing && fabric) {
        await fabricProductionService.updateFabricProduction(fabric.fabricId, fabricData);
        message.success('Fabric production updated successfully');
      } else {
        await fabricProductionService.createFabricProduction(fabricData);
        message.success('Fabric production created successfully');
      }

      onClose(true);
    } catch (error) {
      console.error('Error saving fabric production:', error);
      message.error('Failed to save fabric production');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setImageUrl('');
    setIsActive(true);
    onClose();
  };

  const drawerTitle = isEditing ? 'Edit Fabric Production' : 'Create Fabric Production';
  const submitLabel = isEditing ? 'Save Changes' : 'Create';

  return (
    <Drawer
      title={
        <div className='drawer-header-with-switch'>
          <span className='ccd-title'>{drawerTitle}</span>
          <div className='header-switch'>
            <span className='switch-label'>Active</span>
            <Switch
              checked={isActive}
              onChange={(checked) => {
                setIsActive(checked);
                form.setFieldsValue({ isActive: checked });
              }}
              disabled={!isEditing}
            />
          </div>
        </div>
      }
      width={720}
      onClose={handleClose}
      open={visible}
      className='company-creation-drawer'
      styles={{ body: { padding: 0 } }}
      footer={null}
    >
      <div className='ccd-content'>
        <Form
          form={form}
          layout='vertical'
          onFinish={handleFinish}
          initialValues={{ isActive: true }}
          className='ccd-form'
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
                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  icon={<AppstoreOutlined />}
                  helpText='Upload Fabric Image (PNG/JPG/SVG, max 2MB)'
                />
              </Col>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Fabric Name'
                    name='fabricName'
                    rules={[{ required: true, message: 'Please enter fabric name' }]}
                  >
                    <Input
                      maxLength={64}
                      autoComplete='off'
                      placeholder='Enter fabric name'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Fabric Type'
                    name='fabricType'
                    rules={[{ required: true, message: 'Please select fabric type' }]}
                  >
                    <Select placeholder='Select fabric type' className='ccd-select'>
                      {FABRIC_TYPES.map(type => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item
                    label='Composition'
                    name='composition'
                    rules={[{ required: true, message: 'Please enter composition' }]}
                  >
                    <Input
                      maxLength={128}
                      autoComplete='off'
                      placeholder='e.g., 100% Cotton, 60% Cotton 40% Polyester'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Weight (GSM)'
                    name='weightGsm'
                    rules={[{ required: true, message: 'Please enter weight' }]}
                  >
                    <InputNumber
                      placeholder='Enter weight in GSM'
                      min={0}
                      step={0.1}
                      style={{ width: '100%' }}
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Width (inches)'
                    name='widthInches'
                    rules={[{ required: true, message: 'Please enter width' }]}
                  >
                    <InputNumber
                      placeholder='Enter width in inches'
                      min={0}
                      step={0.1}
                      style={{ width: '100%' }}
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Color'
                    name='color'
                    rules={[{ required: true, message: 'Please enter color' }]}
                  >
                    <Input
                      maxLength={32}
                      autoComplete='off'
                      placeholder='Enter color'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Pattern' name='pattern'>
                    <Input
                      maxLength={32}
                      autoComplete='off'
                      placeholder='Enter pattern (optional)'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Finish Type' name='finishType'>
                    <Input
                      maxLength={32}
                      autoComplete='off'
                      placeholder='Enter finish type (optional)'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='ccd-divider' />

            {/* Section 2: Production Details */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Production Details</div>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Quantity (Meters)'
                    name='quantityMeters'
                    rules={[{ required: true, message: 'Please enter quantity' }]}
                  >
                    <InputNumber
                      placeholder='Enter quantity in meters'
                      min={0}
                      step={0.1}
                      style={{ width: '100%' }}
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Production Date'
                    name='productionDate'
                    rules={[{ required: true, message: 'Please select production date' }]}
                  >
                    <DatePicker
                      placeholder='Select production date'
                      className='ccd-input'
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Batch Number'
                    name='batchNumber'
                    rules={[{ required: true, message: 'Please enter batch number' }]}
                  >
                    <Input
                      maxLength={32}
                      autoComplete='off'
                      placeholder='Enter batch number'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Quality Grade'
                    name='qualityGrade'
                    rules={[{ required: true, message: 'Please select quality grade' }]}
                  >
                    <Select placeholder='Select quality grade' className='ccd-select'>
                      {QUALITY_GRADES.map(grade => (
                        <Option key={grade.value} value={grade.value}>
                          {grade.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='ccd-divider' />

            {/* Section 3: Additional Information */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Additional Information</div>
              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item label='Notes' name='notes'>
                    <TextArea
                      rows={3}
                      maxLength={500}
                      autoComplete='off'
                      placeholder='Enter any additional notes...'
                      className='ccd-textarea'
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <div className='ccd-actions'>
            <Button onClick={handleClose} className='ccd-cancel-btn'>
              Cancel
            </Button>
            <GradientButton size='small' htmlType='submit' loading={loading}>
              {submitLabel}
            </GradientButton>
          </div>
        </Form>
      </div>
    </Drawer>
  );
};

export default FabricProductionDrawer;
