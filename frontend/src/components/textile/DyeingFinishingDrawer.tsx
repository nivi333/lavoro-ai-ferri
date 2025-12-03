import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  DatePicker,
  InputNumber,
  Switch,
  Divider,
  App,
} from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import {
  dyeingFinishingService,
  DyeingFinishing,
  CreateDyeingFinishingData,
  DYEING_PROCESSES,
} from '../../services/textileService';
import { GradientButton, ImageUpload } from '../ui';
import dayjs from 'dayjs';
import '../CompanyCreationDrawer.scss';

const { Option } = Select;
const { TextArea } = Input;

interface DyeingFinishingDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: 'create' | 'edit';
  processId?: string;
  initialData?: Partial<DyeingFinishing>;
}

export const DyeingFinishingDrawer: React.FC<DyeingFinishingDrawerProps> = ({
  open,
  onClose,
  onSuccess,
  mode = 'create',
  processId,
  initialData,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>('');

  const isEditing = mode === 'edit' && !!processId;

  useEffect(() => {
    if (open) {
      if (isEditing && processId) {
        fetchProcessDetails(processId);
      } else if (initialData) {
        setFormData(initialData);
      } else {
        resetForm();
      }
    }
  }, [open, isEditing, processId, initialData]);

  const fetchProcessDetails = async (id: string) => {
    try {
      setLoading(true);
      const data = await dyeingFinishingService.getDyeingFinishingById(id);
      setFormData(data);
    } catch (error) {
      message.error('Failed to fetch process details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const setFormData = (data: any) => {
    form.setFieldsValue({
      ...data,
      processDate: data.processDate ? dayjs(data.processDate) : undefined,
    });
    setIsActive(data.isActive ?? true);
    setImageUrl(data.imageUrl || '');
  };

  const resetForm = () => {
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      processDate: dayjs(),
      processType: 'DYEING',
      qualityCheck: false,
    });
    setIsActive(true);
    setImageUrl('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const processData: CreateDyeingFinishingData = {
        ...values,
        processDate: values.processDate?.toISOString(),
        temperature: values.temperature ? Number(values.temperature) : undefined,
        duration: values.duration ? Number(values.duration) : undefined,
        imageUrl: imageUrl || undefined,
        isActive,
      };

      if (isEditing && processId) {
        await dyeingFinishingService.updateDyeingFinishing(processId, processData);
        message.success('Process updated successfully');
      } else {
        await dyeingFinishingService.createDyeingFinishing(processData);
        message.success('Process created successfully');
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error saving process:', error);
      message.error('Failed to save process');
    } finally {
      setLoading(false);
    }
  };

  const drawerTitle = isEditing ? 'Edit Dyeing & Finishing' : 'Create Dyeing & Finishing';
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
      onClose={handleClose}
      open={open}
      className='company-creation-drawer'
      styles={{ body: { padding: 0 } }}
      footer={null}
    >
      <div className='ccd-content'>
        <Form
          form={form}
          layout='vertical'
          onFinish={handleFinish}
          initialValues={{
            isActive: true,
            processType: 'DYEING',
            qualityCheck: false,
          }}
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
                  helpText='Upload Process Image (PNG/JPG/SVG, max 2MB)'
                />
              </Col>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Process Type'
                    name='processType'
                    rules={[{ required: true, message: 'Please select process type' }]}
                  >
                    <Select placeholder='Select process type' className='ccd-select'>
                      {DYEING_PROCESSES.map(process => (
                        <Option key={process.value} value={process.value}>
                          {process.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
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
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Fabric ID'
                    name='fabricId'
                    rules={[{ required: true, message: 'Please enter fabric ID' }]}
                  >
                    <Input
                      maxLength={32}
                      autoComplete='off'
                      placeholder='Enter fabric ID'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Color Code'
                    name='colorCode'
                    rules={[{ required: true, message: 'Please enter color code' }]}
                  >
                    <Input
                      maxLength={32}
                      autoComplete='off'
                      placeholder='Enter color code'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Color Name' name='colorName'>
                    <Input
                      maxLength={32}
                      autoComplete='off'
                      placeholder='Enter color name'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Chemical Used' name='chemicalUsed'>
                    <Input
                      maxLength={64}
                      autoComplete='off'
                      placeholder='Enter chemicals used'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='ccd-divider' />

            {/* Section 2: Process Details */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Process Details</div>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Process Date'
                    name='processDate'
                    rules={[{ required: true, message: 'Please select process date' }]}
                  >
                    <DatePicker
                      placeholder='Select process date'
                      className='ccd-input'
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Machine ID' name='machineId'>
                    <Input
                      maxLength={32}
                      autoComplete='off'
                      placeholder='Enter machine ID'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Temperature (°C)' name='temperature'>
                    <InputNumber
                      placeholder='Enter temperature'
                      min={0}
                      step={0.1}
                      style={{ width: '100%' }}
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Duration (minutes)' name='duration'>
                    <InputNumber
                      placeholder='Enter duration'
                      min={0}
                      style={{ width: '100%' }}
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Operator Name' name='operatorName'>
                    <Input
                      maxLength={64}
                      autoComplete='off'
                      placeholder='Enter operator name'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Quality Check' name='qualityCheck' valuePropName='checked'>
                    <Switch />
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

export default DyeingFinishingDrawer;
