import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Divider,
  Select,
  message,
  Row,
  Col,
  Switch,
  InputNumber,
  Checkbox,
  Space,
  Tag,
} from 'antd';
import {
  customerService,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  Customer,
} from '../../services/customerService';
import { GradientButton, CountrySelect } from '../ui';
import '../CompanyCreationDrawer.scss'; // Reuse existing layout styles
import '../products/ProductFormDrawer.scss'; // Reuse drawer header styles

interface CustomerDrawerProps {
  open: boolean;
  onClose: () => void;
  onCustomerCreated?: () => void;
  onCustomerUpdated?: (customer: Customer) => void;
  mode?: 'create' | 'edit';
  customerId?: string;
  initialData?: Partial<Customer>;
}

export const CustomerDrawer: React.FC<CustomerDrawerProps> = ({
  open,
  onClose,
  onCustomerCreated,
  onCustomerUpdated,
  mode = 'create',
  customerId,
  initialData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');

  const isEditing = mode === 'edit' && !!customerId;

  const handleDrawerClose = () => {
    form.resetFields();
    setTags([]);
    setInputTag('');
    setSameAsBilling(true);
    onClose();
  };

  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag)) {
      setTags([...tags, inputTag]);
      setInputTag('');
      form.setFieldsValue({ tags: [...tags, inputTag] });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setFieldsValue({ tags: newTags });
  };

  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked);
    form.setFieldsValue({ sameAsBillingAddress: checked });
    if (checked) {
      // Copy billing address to shipping address
      const billingValues = {
        shippingAddressLine1: form.getFieldValue('billingAddressLine1'),
        shippingAddressLine2: form.getFieldValue('billingAddressLine2'),
        shippingCity: form.getFieldValue('billingCity'),
        shippingState: form.getFieldValue('billingState'),
        shippingCountry: form.getFieldValue('billingCountry'),
        shippingPostalCode: form.getFieldValue('billingPostalCode'),
      };
      form.setFieldsValue(billingValues);
    }
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        tags: tags,
      };

      if (isEditing && customerId) {
        const updatePayload: UpdateCustomerRequest = payload;
        const updatedCustomer = await customerService.updateCustomer(customerId, updatePayload);
        message.success('Customer updated successfully!');
        onCustomerUpdated?.(updatedCustomer);
        handleDrawerClose();
      } else {
        const createPayload: CreateCustomerRequest = {
          ...payload,
          isActive: true, // Default for new customers
        };
        await customerService.createCustomer(createPayload);
        message.success('Customer created successfully!');
        onCustomerCreated?.();
        handleDrawerClose();
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      if (isEditing && initialData) {
        form.setFieldsValue({
          ...initialData,
        });
        setIsActive(initialData.isActive ?? true);
        setTags(initialData.tags || []);
        setSameAsBilling(initialData.sameAsBillingAddress ?? true);
      } else {
        form.resetFields();
        form.setFieldsValue({
          isActive: true,
          customerType: 'INDIVIDUAL',
          customerCategory: 'REGULAR',
          currency: 'INR',
          sameAsBillingAddress: true,
        });
        setIsActive(true);
        setSameAsBilling(true);
        setTags([]);
      }
    }
  }, [open, isEditing, initialData, form]);

  const drawerTitle = isEditing ? 'Edit Customer' : 'Create Customer';
  const submitLabel = isEditing ? 'Save Changes' : 'Create Customer';

  return (
    <Drawer
      title={
        <div className='drawer-header-with-switch'>
          <span>{drawerTitle}</span>
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
      onClose={handleDrawerClose}
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
            customerType: 'INDIVIDUAL',
            customerCategory: 'REGULAR',
            currency: 'INR',
            sameAsBillingAddress: true,
          }}
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
            {/* Basic Information */}
            <div className='ccd-section'>
              <div className='ccd-section-header'>
                <div className='ccd-section-title'>Basic Information</div>
              </div>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Customer Code' name='code'>
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
                    label='Customer Name'
                    name='name'
                    rules={[{ required: true, message: 'Please enter customer name' }]}
                  >
                    <Input
                      maxLength={100}
                      autoComplete='off'
                      placeholder='Enter customer name'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Customer Type'
                    name='customerType'
                    rules={[{ required: true, message: 'Please select type' }]}
                  >
                    <Select placeholder='Select type' className='ccd-select'>
                      <Select.Option value='INDIVIDUAL'>Individual</Select.Option>
                      <Select.Option value='BUSINESS'>Business</Select.Option>
                      <Select.Option value='DISTRIBUTOR'>Distributor</Select.Option>
                      <Select.Option value='RETAILER'>Retailer</Select.Option>
                      <Select.Option value='WHOLESALER'>Wholesaler</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Company Name'
                    name='companyName'
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (getFieldValue('customerType') === 'BUSINESS' && !value) {
                            return Promise.reject(
                              new Error('Company name is required for business type')
                            );
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <Input
                      maxLength={100}
                      autoComplete='off'
                      placeholder='Enter company name'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Customer Category' name='customerCategory'>
                    <Select placeholder='Select category' className='ccd-select' allowClear>
                      <Select.Option value='VIP'>VIP</Select.Option>
                      <Select.Option value='REGULAR'>Regular</Select.Option>
                      <Select.Option value='NEW'>New</Select.Option>
                      <Select.Option value='INACTIVE'>Inactive</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Primary Contact Person'
                    name='primaryContactPerson'
                    rules={[{ required: true, message: 'Please enter primary contact person' }]}
                  >
                    <Input
                      maxLength={100}
                      autoComplete='off'
                      placeholder='Enter contact person name'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='ccd-divider' />

            {/* Contact Information */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Contact Information</div>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Email Address'
                    name='email'
                    rules={[
                      { required: true, message: 'Please enter email address' },
                      {
                        type: 'email',
                        message: 'Please enter a valid email address',
                      },
                    ]}
                  >
                    <Input
                      autoComplete='off'
                      placeholder='customer@company.com'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Phone Number'
                    name='phone'
                    rules={[
                      { required: true, message: 'Please enter phone number' },
                      {
                        pattern: /^[+]?[1-9][\d]{0,15}$/,
                        message: 'Please enter a valid phone number with country code',
                      },
                    ]}
                  >
                    <Input autoComplete='off' placeholder='+1 234 567 8900' className='ccd-input' />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Alternate Phone'
                    name='alternatePhone'
                    rules={[
                      {
                        pattern: /^[+]?[1-9][\d]{0,15}$/,
                        message: 'Please enter a valid phone number with country code',
                      },
                    ]}
                  >
                    <Input autoComplete='off' placeholder='+1 234 567 8900' className='ccd-input' />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Website'
                    name='website'
                    rules={[
                      {
                        type: 'url',
                        message: 'Please enter a valid URL',
                      },
                    ]}
                  >
                    <Input
                      autoComplete='off'
                      placeholder='https://www.example.com'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='ccd-divider' />

            {/* Billing Address */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Billing Address</div>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Address Line 1' name='billingAddressLine1'>
                    <Input
                      maxLength={255}
                      autoComplete='off'
                      placeholder='Street address'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Address Line 2' name='billingAddressLine2'>
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
                    name='billingCity'
                    rules={[{ required: true, message: 'Please enter billing city' }]}
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
                  <Form.Item label='State/Province' name='billingState'>
                    <Input
                      maxLength={100}
                      autoComplete='off'
                      placeholder='Enter state'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Country'
                    name='billingCountry'
                    rules={[{ required: true, message: 'Please select country' }]}
                  >
                    <CountrySelect className='ccd-select' />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Postal/ZIP Code' name='billingPostalCode'>
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

            {/* Shipping Address */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Shipping Address</div>
              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item name='sameAsBillingAddress' valuePropName='checked'>
                    <Checkbox onChange={e => handleSameAsBillingChange(e.target.checked)}>
                      Same as billing address
                    </Checkbox>
                  </Form.Item>
                </Col>
              </Row>
              {!sameAsBilling && (
                <>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label='Address Line 1' name='shippingAddressLine1'>
                        <Input
                          maxLength={255}
                          autoComplete='off'
                          placeholder='Street address'
                          className='ccd-input'
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label='Address Line 2' name='shippingAddressLine2'>
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
                      <Form.Item label='City' name='shippingCity'>
                        <Input
                          maxLength={100}
                          autoComplete='off'
                          placeholder='Enter city'
                          className='ccd-input'
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label='State/Province' name='shippingState'>
                        <Input
                          maxLength={100}
                          autoComplete='off'
                          placeholder='Enter state'
                          className='ccd-input'
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label='Country' name='shippingCountry'>
                        <CountrySelect className='ccd-select' />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label='Postal/ZIP Code' name='shippingPostalCode'>
                        <Input
                          maxLength={20}
                          autoComplete='off'
                          placeholder='Enter postal code'
                          className='ccd-input'
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}
            </div>

            <Divider className='ccd-divider' />

            {/* Financial Information */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Financial Information</div>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label='Currency' name='currency'>
                    <Select placeholder='Select currency' className='ccd-select'>
                      <Select.Option value='INR'>INR (Indian Rupee)</Select.Option>
                      <Select.Option value='USD'>USD (US Dollar)</Select.Option>
                      <Select.Option value='EUR'>EUR (Euro)</Select.Option>
                      <Select.Option value='GBP'>GBP (British Pound)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label='Payment Terms' name='paymentTerms'>
                    <Select placeholder='Select terms' className='ccd-select'>
                      <Select.Option value='NET_30'>Net 30</Select.Option>
                      <Select.Option value='NET_60'>Net 60</Select.Option>
                      <Select.Option value='NET_90'>Net 90</Select.Option>
                      <Select.Option value='ADVANCE'>Advance</Select.Option>
                      <Select.Option value='COD'>Cash on Delivery</Select.Option>
                      <Select.Option value='CREDIT'>Credit</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label='Credit Limit' name='creditLimit'>
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder='Credit Limit'
                      className='ccd-input'
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Tax ID / GST Number' name='taxId'>
                    <Input placeholder='Tax ID / GSTIN' className='ccd-input' maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='PAN Number'
                    name='panNumber'
                    rules={[
                      {
                        pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                        message: 'Please enter a valid PAN number (e.g., ABCDE1234F)',
                      },
                    ]}
                  >
                    <Input placeholder='PAN Number' className='ccd-input' maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='ccd-divider' />

            {/* Additional Information */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Additional Information</div>
              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item label='Tags' name='tags'>
                    <div>
                      <Space style={{ marginBottom: 8 }}>
                        <Input
                          style={{ width: 200 }}
                          placeholder='Add a tag'
                          value={inputTag}
                          onChange={e => setInputTag(e.target.value)}
                          onPressEnter={handleAddTag}
                        />
                        <Button type='primary' onClick={handleAddTag}>
                          Add
                        </Button>
                      </Space>
                      <div>
                        {tags.map(tag => (
                          <Tag
                            key={tag}
                            closable
                            onClose={() => handleRemoveTag(tag)}
                            style={{ marginBottom: 4 }}
                          >
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item label='Notes' name='notes'>
                    <Input.TextArea
                      rows={3}
                      maxLength={500}
                      placeholder='Additional notes about this customer...'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <div className='ccd-actions'>
            <Button onClick={onClose} className='ccd-cancel-btn'>
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
