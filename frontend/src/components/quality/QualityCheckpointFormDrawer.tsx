import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  message,
  Switch,
  Row,
  Col,
} from 'antd';
import dayjs from 'dayjs';
import { qualityService } from '../../services/qualityService';
import { productService } from '../../services/productService';
import { GradientButton } from '../ui';
import './QualityCheckpointFormDrawer.scss';

const { TextArea } = Input;

interface QualityCheckpointFormDrawerProps {
  visible: boolean;
  checkpoint: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const QualityCheckpointFormDrawer: React.FC<QualityCheckpointFormDrawerProps> = ({
  visible,
  checkpoint,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [checkpointType, setCheckpointType] = useState<string>('');

  // Load products when drawer opens
  useEffect(() => {
    if (visible) {
      loadProducts();
      if (checkpoint) {
        // Editing existing checkpoint
        setCheckpointType(checkpoint.checkpointType || '');
        form.setFieldsValue({
          checkpointName: checkpoint.checkpointName,
          checkpointType: checkpoint.checkpointType,
          inspectorName: checkpoint.inspectorName,
          inspectionDate: checkpoint.inspectionDate ? dayjs(checkpoint.inspectionDate) : null,
          productId: checkpoint.productId,
          batchNumber: checkpoint.batchNumber,
          lotNumber: checkpoint.lotNumber,
          sampleSize: checkpoint.sampleSize,
          testedQuantity: checkpoint.testedQuantity,
          status: checkpoint.status,
          overallScore: checkpoint.overallScore,
          notes: checkpoint.notes,
        });
      } else {
        // Creating new checkpoint - reset form
        setCheckpointType('');
        form.resetFields();
        form.setFieldsValue({
          checkpointName: undefined,
          checkpointType: undefined,
          inspectorName: undefined,
          inspectionDate: undefined,
          productId: undefined,
          batchNumber: undefined,
          lotNumber: undefined,
          sampleSize: undefined,
          testedQuantity: undefined,
          status: undefined,
          overallScore: undefined,
          notes: undefined,
          isActive: true,
        });
      }
    }
  }, [visible, checkpoint, form]);

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      message.error('Failed to load products');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data = {
        checkpointName: values.checkpointName,
        checkpointType: values.checkpointType,
        inspectorName: values.inspectorName,
        inspectionDate: values.inspectionDate.toISOString(),
        productId: values.productId,
        batchNumber: values.batchNumber,
        lotNumber: values.lotNumber,
        sampleSize: values.sampleSize,
        testedQuantity: values.testedQuantity,
        overallScore: values.overallScore,
        notes: values.notes,
        ...(checkpoint && { status: values.status }),
      };

      if (checkpoint) {
        await qualityService.updateCheckpoint(checkpoint.id, data);
        message.success('Quality checkpoint updated successfully');
      } else {
        await qualityService.createCheckpoint(data);
        message.success('Quality checkpoint created successfully');
      }

      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.message || 'Failed to save quality checkpoint');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{checkpoint ? 'Edit Quality Checkpoint' : 'Create Quality Checkpoint'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Active</span>
            <Form.Item name='isActive' valuePropName='checked' noStyle>
              <Switch disabled={!checkpoint} />
            </Form.Item>
          </div>
        </div>
      }
      width={720}
      open={visible}
      onClose={onClose}
      styles={{
        footer: {
          textAlign: 'right',
        },
      }}
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <GradientButton onClick={handleSubmit} loading={loading}>
            {checkpoint ? 'Update' : 'Create'}
          </GradientButton>
        </Space>
      }
    >
      <Form form={form} layout='vertical' className='quality-checkpoint-form'>
        <div className='form-section'>
          <h3>Checkpoint Information</h3>

          <Form.Item
            label='Quality Code'
            help={checkpoint ? undefined : 'Checkpoint code will be auto-generated (e.g., QC001)'}
          >
            <Input disabled placeholder='Auto-generated' />
          </Form.Item>

          <Form.Item
            name='checkpointName'
            label='Checkpoint Name'
            rules={[{ required: true, message: 'Please enter checkpoint name' }]}
          >
            <Input placeholder='Enter checkpoint name' />
          </Form.Item>

          <Form.Item
            name='productId'
            label='Product'
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              placeholder='Select product to test'
              showSearch
              optionFilterProp='children'
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {products.map(product => (
                <Select.Option key={product.id} value={product.id}>
                  {product.productCode} - {product.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name='inspectorName'
                label='Inspector Name'
                rules={[{ required: true, message: 'Please enter inspector name' }]}
              >
                <Input placeholder='Enter inspector name' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='inspectionDate'
                label='Inspection Date'
                rules={[{ required: true, message: 'Please select inspection date' }]}
              >
                <DatePicker style={{ width: '100%' }} format='DD MMM YYYY' />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name='checkpointType'
            label='Checkpoint Type'
            rules={[{ required: true, message: 'Please select checkpoint type' }]}
          >
            <Select
              placeholder='Select checkpoint type'
              onChange={value => setCheckpointType(value)}
            >
              <Select.Option value='INCOMING_MATERIAL'>Incoming Material</Select.Option>
              <Select.Option value='IN_PROCESS'>In Process</Select.Option>
              <Select.Option value='FINAL_INSPECTION'>Final Inspection</Select.Option>
              <Select.Option value='PACKAGING'>Packaging</Select.Option>
              <Select.Option value='RANDOM_SAMPLING'>Random Sampling</Select.Option>
              <Select.Option value='BATCH_TEST'>Batch Test</Select.Option>
            </Select>
          </Form.Item>

          {checkpointType === 'BATCH_TEST' && (
            <>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name='totalBatch'
                    label='Total Batch'
                    tooltip='Total number of batches for this product'
                    rules={[{ required: true, message: 'Please enter total batch count' }]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      placeholder='e.g., 10'
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name='lotNumber'
                    label='Lot Number'
                    tooltip='Lot within the batch (optional)'
                  >
                    <Input placeholder='e.g., Lot-A' />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name='sampleSize'
                    label='Each Batch Size'
                    tooltip='Number of items in each batch'
                    rules={[{ required: true, message: 'Please enter batch size' }]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      placeholder='e.g., 1000'
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name='testedQuantity'
                    label='Tested Quantity'
                    tooltip='Number of items actually tested from each batch'
                    rules={[{ required: true, message: 'Please enter tested quantity' }]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      placeholder='e.g., 10'
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {checkpoint && (
            <Form.Item
              name='status'
              label='Status'
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder='Select status'>
                <Select.Option value='PENDING'>Pending</Select.Option>
                <Select.Option value='IN_PROGRESS'>In Progress</Select.Option>
                <Select.Option value='PASSED'>Passed</Select.Option>
                <Select.Option value='FAILED'>Failed</Select.Option>
                <Select.Option value='CONDITIONAL_PASS'>Conditional Pass</Select.Option>
                <Select.Option value='REWORK_REQUIRED'>Rework Required</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item name='overallScore' label='Overall Score (%)'>
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              placeholder='Enter overall score'
            />
          </Form.Item>

          <Form.Item name='notes' label='Notes'>
            <TextArea rows={4} placeholder='Enter any additional notes' />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};

export default QualityCheckpointFormDrawer;
