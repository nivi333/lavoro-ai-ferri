import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, InputNumber, Select, message, Row, Col } from 'antd';
import { GradientButton } from '../ui';
import { inventoryService, UpdateLocationInventoryRequest } from '../../services/inventoryService';
import { locationService } from '../../services/locationService';
import ProductSelector from '../products/ProductSelector';
import useAuth from '../../contexts/AuthContext';
import './InventoryFormDrawer.scss';

const { Option } = Select;

interface InventoryFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InventoryFormValues {
  inventoryCode?: string;
  productId: string;
  locationId: string;
  stockQuantity: number;
  reservedQuantity: number;
  reorderLevel?: number;
  maxStockLevel?: number;
}

export const InventoryFormDrawer: React.FC<InventoryFormDrawerProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<InventoryFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const { currentCompany } = useAuth();

  useEffect(() => {
    if (visible && currentCompany?.id) {
      fetchLocations();
    }
  }, [visible, currentCompany?.id]);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getLocations();
      setLocations(response || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      message.error('Failed to load locations');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload: UpdateLocationInventoryRequest = {
        productId: values.productId,
        locationId: values.locationId,
        stockQuantity: values.stockQuantity,
        reservedQuantity: values.reservedQuantity || 0,
        reorderLevel: values.reorderLevel,
        maxStockLevel: values.maxStockLevel,
      };

      await inventoryService.updateLocationInventory(payload);
      message.success('Inventory added successfully');
      
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding inventory:', error);
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.message || 'Failed to add inventory');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title='Add Inventory'
      placement='right'
      width={720}
      onClose={handleCancel}
      open={visible}
      footer={
        <div style={{ textAlign: 'right' }}>
          <button className='cancel-btn' onClick={handleCancel} disabled={submitting} style={{ marginRight: 8 }}>
            Cancel
          </button>
          <GradientButton onClick={handleSubmit} loading={submitting}>
            Add Inventory
          </GradientButton>
        </div>
      }
    >
      <Form
        form={form}
        layout='vertical'
        initialValues={{
          stockQuantity: 0,
          reservedQuantity: 0,
        }}
      >
        {/* Section 1: Product & Location */}
        <div className='form-section'>
          <h3 className='section-title'>Product & Location</h3>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name='inventoryCode'
                label='Inventory Code'
                tooltip='Auto-generated upon creation'
              >
                <Input disabled placeholder='Auto-generated (e.g., INV001)' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name='productId'
                label='Product'
                rules={[{ required: true, message: 'Please select a product' }]}
              >
                <ProductSelector
                  value={form.getFieldValue('productId')}
                  onChange={(value) => form.setFieldsValue({ productId: value })}
                  placeholder='Select product'
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name='locationId'
                label='Location'
                rules={[{ required: true, message: 'Please select a location' }]}
              >
                <Select placeholder='Select location' showSearch optionFilterProp='children'>
                  {locations.map((location) => (
                    <Option key={location.id} value={location.id}>
                      {location.name}
                      {location.isDefault && ' (Default)'}
                      {location.isHeadquarters && ' (HQ)'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 2: Stock Levels */}
        <div className='form-section'>
          <h3 className='section-title'>Stock Levels</h3>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='stockQuantity'
                label='Stock Quantity'
                rules={[
                  { required: true, message: 'Please enter stock quantity' },
                  {
                    validator: (_, value) =>
                      value >= 0
                        ? Promise.resolve()
                        : Promise.reject(new Error('Stock quantity must be 0 or greater')),
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  precision={0}
                  style={{ width: '100%' }}
                  placeholder='Enter stock quantity'
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name='reservedQuantity'
                label='Reserved Quantity'
                rules={[
                  {
                    validator: (_, value) =>
                      value >= 0
                        ? Promise.resolve()
                        : Promise.reject(new Error('Reserved quantity must be 0 or greater')),
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  precision={0}
                  style={{ width: '100%' }}
                  placeholder='Enter reserved quantity'
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 3: Reorder Settings */}
        <div className='form-section'>
          <h3 className='section-title'>Reorder Settings (Optional)</h3>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='reorderLevel'
                label='Reorder Level'
                tooltip='Minimum stock level before alert is triggered'
              >
                <InputNumber
                  min={0}
                  precision={0}
                  style={{ width: '100%' }}
                  placeholder='Enter reorder level'
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name='maxStockLevel'
                label='Maximum Stock Level'
                tooltip='Maximum stock level to maintain'
              >
                <InputNumber
                  min={0}
                  precision={0}
                  style={{ width: '100%' }}
                  placeholder='Enter max stock level'
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Drawer>
  );
};
