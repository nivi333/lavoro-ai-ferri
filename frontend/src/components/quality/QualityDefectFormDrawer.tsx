import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  message,
  Switch,
  Row,
  Col,
} from 'antd';
import { qualityService } from '../../services/qualityService';
import { productService } from '../../services/productService';
import { GradientButton } from '../ui';
import './QualityDefectFormDrawer.scss';

const { TextArea } = Input;

interface QualityDefectFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QualityDefectFormDrawer: React.FC<QualityDefectFormDrawerProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldsValue({ isActive: true });
      fetchCheckpoints();
      fetchProducts();
    }
  }, [visible, form]);

  const fetchCheckpoints = async () => {
    try {
      const data = await qualityService.getCheckpoints();
      setCheckpoints(data);
    } catch (error: any) {
      message.error('Failed to fetch checkpoints');
    }
  };

  const fetchProducts = async () => {
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
        checkpointId: values.checkpointId,
        productId: values.productId,
        defectCategory: values.defectCategory,
        defectType: values.defectType,
        severity: values.severity,
        quantity: values.quantity,
        batchNumber: values.batchNumber,
        lotNumber: values.lotNumber,
        affectedItems: values.affectedItems,
        description: values.description,
      };

      await qualityService.createDefect(data);
      message.success('Quality defect reported successfully');
      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.message || 'Failed to report quality defect');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Report Quality Defect</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Active</span>
            <Form.Item name='isActive' valuePropName='checked' noStyle>
              <Switch disabled />
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
            Report
          </GradientButton>
        </Space>
      }
    >
      <Form form={form} layout='vertical' className='quality-defect-form'>
        <div className='form-section'>
          <h3>Defect Information</h3>

          <Form.Item label='Defect Code' help='Defect code will be auto-generated (e.g., DEF001)'>
            <Input disabled placeholder='Auto-generated' />
          </Form.Item>

          <Form.Item
            name='checkpointId'
            label='Quality Checkpoint'
            rules={[{ required: true, message: 'Please select checkpoint' }]}
          >
            <Select placeholder='Select checkpoint'>
              {checkpoints.map(cp => (
                <Select.Option key={cp.id} value={cp.id}>
                  {cp.checkpointId} - {cp.checkpointName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name='productId'
            label='Product'
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              placeholder='Select affected product'
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
                name='defectCategory'
                label='Defect Category'
                rules={[{ required: true, message: 'Please select defect category' }]}
              >
                <Select placeholder='Select defect category'>
                  <Select.Option value='FABRIC'>Fabric</Select.Option>
                  <Select.Option value='STITCHING'>Stitching</Select.Option>
                  <Select.Option value='COLOR'>Color</Select.Option>
                  <Select.Option value='MEASUREMENT'>Measurement</Select.Option>
                  <Select.Option value='PACKAGING'>Packaging</Select.Option>
                  <Select.Option value='FINISHING'>Finishing</Select.Option>
                  <Select.Option value='LABELING'>Labeling</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='defectType'
                label='Defect Type'
                rules={[{ required: true, message: 'Please enter defect type' }]}
              >
                <Input placeholder='e.g., Thread breakage, Color mismatch' />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name='severity'
            label='Severity'
            rules={[{ required: true, message: 'Please select severity' }]}
          >
            <Select placeholder='Select severity'>
              <Select.Option value='CRITICAL'>Critical</Select.Option>
              <Select.Option value='MAJOR'>Major</Select.Option>
              <Select.Option value='MINOR'>Minor</Select.Option>
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name='quantity'
                label='Defect Quantity'
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder='Enter defect quantity' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='affectedItems'
                label='Affected Items'
                tooltip='Total number of items affected by this defect'
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder='e.g., 15'
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name='batchNumber'
                label='Batch Number'
                tooltip='Which batch has the defect (e.g., Batch-7)'
              >
                <Input placeholder='e.g., Batch-7' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='lotNumber'
                label='Lot Number'
                tooltip='Specific lot within the batch (optional)'
              >
                <Input placeholder='e.g., Lot-A' />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='description' label='Description'>
            <TextArea
              rows={4}
              placeholder='Describe the defect in detail (e.g., Color difference observed in Batch-7)'
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};

export default QualityDefectFormDrawer;
