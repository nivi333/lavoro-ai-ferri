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
  yarnManufacturingService,
  YarnManufacturing,
  CreateYarnManufacturingData,
  YARN_TYPES,
  QUALITY_GRADES,
} from '../../services/textileService';
import { GradientButton, ImageUpload } from '../ui';
import '../CompanyCreationDrawer.scss';

const { Option } = Select;
const { TextArea } = Input;

interface YarnManufacturingDrawerProps {
  visible: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  yarn?: YarnManufacturing | null;
}

export const YarnManufacturingDrawer: React.FC<YarnManufacturingDrawerProps> = ({
  visible,
  onClose,
  yarn,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>('');

  const isEditing = !!yarn;

  useEffect(() => {
    if (visible) {
      if (yarn) {
        form.setFieldsValue({
          ...yarn,
          productionDate: dayjs(yarn.productionDate),
        });
        setIsActive(yarn.isActive ?? true);
        setImageUrl(yarn.imageUrl || '');
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
  }, [visible, yarn, form]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const yarnData: CreateYarnManufacturingData = {
        ...values,
        productionDate: values.productionDate.toISOString(),
        yarnCount: Number(values.yarnCount),
        quantityKg: Number(values.quantityKg),
        imageUrl: imageUrl || undefined,
        isActive,
      };

      if (isEditing && yarn) {
        await yarnManufacturingService.updateYarnManufacturing(yarn.yarnId, yarnData);
        message.success('Yarn manufacturing updated successfully');
      } else {
        await yarnManufacturingService.createYarnManufacturing(yarnData);
        message.success('Yarn manufacturing created successfully');
      }

      onClose(true);
    } catch (error) {
      console.error('Error saving yarn manufacturing:', error);
      message.error('Failed to save yarn manufacturing');
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

  const drawerTitle = isEditing ? 'Edit Yarn Manufacturing' : 'Create Yarn Manufacturing';
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
                  helpText='Upload Yarn Image (PNG/JPG/SVG, max 2MB)'
                />
              </Col>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Yarn Name'
                    name='yarnName'
                    rules={[{ required: true, message: 'Please enter yarn name' }]}
                  >
                    <Input
                      maxLength={64}
                      autoComplete='off'
                      placeholder='Enter yarn name'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Yarn Type'
                    name='yarnType'
                    rules={[{ required: true, message: 'Please select yarn type' }]}
                  >
                    <Select placeholder='Select yarn type' className='ccd-select'>
                      {YARN_TYPES.map(type => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Fiber Content'
                    name='fiberContent'
                    rules={[{ required: true, message: 'Please enter fiber content' }]}
                  >
                    <Input
                      maxLength={128}
                      autoComplete='off'
                      placeholder='e.g., 100% Cotton, 60% Polyester'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Yarn Count'
                    name='yarnCount'
                    rules={[{ required: true, message: 'Please enter yarn count' }]}
                  >
                    <InputNumber
                      placeholder='Enter yarn count'
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
                  <Form.Item label='Twist Type' name='twistType'>
                    <Input
                      maxLength={32}
                      autoComplete='off'
                      placeholder='Enter twist type (optional)'
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
                    label='Quantity (Kg)'
                    name='quantityKg'
                    rules={[{ required: true, message: 'Please enter quantity' }]}
                  >
                    <InputNumber
                      placeholder='Enter quantity in kg'
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

export default YarnManufacturingDrawer;
