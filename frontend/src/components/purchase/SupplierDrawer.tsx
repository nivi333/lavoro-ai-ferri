import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Divider,
  Select,
  Row,
  Col,
  Switch,
  InputNumber,
  Space,
  Tag,
  App,
} from 'antd';
import {
  supplierService,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  Supplier,
} from '../../services/supplierService';
import { GradientButton, CountrySelect } from '../ui';
import '../CompanyCreationDrawer.scss'; // Reuse existing layout styles
import '../products/ProductFormDrawer.scss'; // Reuse drawer header styles

interface SupplierDrawerProps {
  open: boolean;
  onClose: () => void;
  onSupplierCreated?: () => void;
  onSupplierUpdated?: (supplier: Supplier) => void;
  mode?: 'create' | 'edit';
  supplierId?: string;
  initialData?: Partial<Supplier>;
}

export const SupplierDrawer: React.FC<SupplierDrawerProps> = ({
  open,
  onClose,
  onSupplierCreated,
  onSupplierUpdated,
  mode = 'create',
  supplierId,
  initialData,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [inputCertification, setInputCertification] = useState('');
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [inputCategory, setInputCategory] = useState('');

  const isEditing = mode === 'edit' && !!supplierId;

  const handleDrawerClose = () => {
    form.resetFields();
    setTags([]);
    setInputTag('');
    setCertifications([]);
    setInputCertification('');
    setProductCategories([]);
    setInputCategory('');
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

  const handleAddCertification = () => {
    if (inputCertification && !certifications.includes(inputCertification)) {
      setCertifications([...certifications, inputCertification]);
      setInputCertification('');
      form.setFieldsValue({ certifications: [...certifications, inputCertification] });
    }
  };

  const handleRemoveCertification = (certToRemove: string) => {
    const newCerts = certifications.filter(cert => cert !== certToRemove);
    setCertifications(newCerts);
    form.setFieldsValue({ certifications: newCerts });
  };

  const handleAddCategory = () => {
    if (inputCategory && !productCategories.includes(inputCategory)) {
      setProductCategories([...productCategories, inputCategory]);
      setInputCategory('');
      form.setFieldsValue({ productCategories: [...productCategories, inputCategory] });
    }
  };

  const handleRemoveCategory = (catToRemove: string) => {
    const newCats = productCategories.filter(cat => cat !== catToRemove);
    setProductCategories(newCats);
    form.setFieldsValue({ productCategories: newCats });
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        tags: tags,
        certifications: certifications,
        productCategories: productCategories,
      };

      if (isEditing && supplierId) {
        const updatePayload: UpdateSupplierRequest = payload;
        const updatedSupplier = await supplierService.updateSupplier(supplierId, updatePayload);
        message.success('Supplier updated successfully!');
        onSupplierUpdated?.(updatedSupplier);
        handleDrawerClose();
      } else {
        const createPayload: CreateSupplierRequest = {
          ...payload,
          isActive: true, // Default for new suppliers
        };
        await supplierService.createSupplier(createPayload);
        message.success('Supplier created successfully!');
        onSupplierCreated?.();
        handleDrawerClose();
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to save supplier');
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
        setCertifications(initialData.certifications || []);
        setProductCategories(initialData.productCategories || []);
      } else {
        form.resetFields();
        form.setFieldsValue({
          isActive: true,
          supplierType: 'MANUFACTURER',
          currency: 'INR',
        });
        setIsActive(true);
        setTags([]);
        setCertifications([]);
        setProductCategories([]);
      }
    }
  }, [open, isEditing, initialData, form]);

  const drawerTitle = isEditing ? 'Edit Supplier' : 'Create Supplier';
  const submitLabel = isEditing ? 'Save Changes' : 'Create Supplier';

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
            supplierType: 'MANUFACTURER',
            currency: 'INR',
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
                  <Form.Item label='Supplier Code' name='code'>
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
                    label='Supplier Name'
                    name='name'
                    rules={[{ required: true, message: 'Please enter supplier name' }]}
                  >
                    <Input
                      maxLength={100}
                      autoComplete='off'
                      placeholder='Enter supplier name'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Supplier Type' name='supplierType'>
                    <Select placeholder='Select type' className='ccd-select' allowClear>
                      <Select.Option value='MANUFACTURER'>Manufacturer</Select.Option>
                      <Select.Option value='DISTRIBUTOR'>Distributor</Select.Option>
                      <Select.Option value='WHOLESALER'>Wholesaler</Select.Option>
                      <Select.Option value='IMPORTER'>Importer</Select.Option>
                      <Select.Option value='LOCAL_VENDOR'>Local Vendor</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Company Registration Number' name='companyRegNo'>
                    <Input
                      maxLength={50}
                      autoComplete='off'
                      placeholder='Enter registration number'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Supplier Category' name='supplierCategory'>
                    <Select placeholder='Select category' className='ccd-select' allowClear>
                      <Select.Option value='PREFERRED'>Preferred</Select.Option>
                      <Select.Option value='APPROVED'>Approved</Select.Option>
                      <Select.Option value='TRIAL'>Trial</Select.Option>
                      <Select.Option value='BLACKLISTED'>Blacklisted</Select.Option>
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
                      placeholder='supplier@company.com'
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
                <Col span={8}>
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
                <Col span={8}>
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
                <Col span={8}>
                  <Form.Item label='Fax' name='fax'>
                    <Input autoComplete='off' placeholder='Fax number' className='ccd-input' />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='ccd-divider' />

            {/* Address Information */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Business Address</div>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Address Line 1' name='addressLine1'>
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
                  <Form.Item label='City' name='city'>
                    <Input
                      maxLength={100}
                      autoComplete='off'
                      placeholder='Enter city'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='State/Province' name='state'>
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
                  <Form.Item label='Country' name='country'>
                    <CountrySelect className='ccd-select' />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Postal/ZIP Code' name='postalCode'>
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
                  <Form.Item label='Credit Period (Days)' name='creditPeriod'>
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder='Credit Period'
                      className='ccd-input'
                      min={0}
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
              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item label='Bank Account Details' name='bankDetails'>
                    <Input.TextArea
                      rows={2}
                      maxLength={500}
                      placeholder='Bank account details for direct transfers...'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='ccd-divider' />

            {/* Supply Information */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Supply Information</div>
              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item label='Product Categories Supplied' name='productCategories'>
                    <div>
                      <Space style={{ marginBottom: 8 }}>
                        <Input
                          style={{ width: 200 }}
                          placeholder='Add a category'
                          value={inputCategory}
                          onChange={e => setInputCategory(e.target.value)}
                          onPressEnter={handleAddCategory}
                        />
                        <Button type='primary' onClick={handleAddCategory}>
                          Add
                        </Button>
                      </Space>
                      <div>
                        {productCategories.map(cat => (
                          <Tag
                            key={cat}
                            closable
                            onClose={() => handleRemoveCategory(cat)}
                            style={{ marginBottom: 4 }}
                          >
                            {cat}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label='Lead Time (Days)' name='leadTimeDays'>
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder='Typical delivery time'
                      className='ccd-input'
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label='Minimum Order Quantity' name='minOrderQty'>
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder='Min order qty'
                      className='ccd-input'
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label='Minimum Order Value' name='minOrderValue'>
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder='Min order value'
                      className='ccd-input'
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='ccd-divider' />

            {/* Quality & Compliance */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Quality & Compliance</div>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Quality Rating' name='qualityRating'>
                    <Select placeholder='Select rating' className='ccd-select' allowClear>
                      <Select.Option value='EXCELLENT'>Excellent</Select.Option>
                      <Select.Option value='GOOD'>Good</Select.Option>
                      <Select.Option value='AVERAGE'>Average</Select.Option>
                      <Select.Option value='POOR'>Poor</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Compliance Status' name='complianceStatus'>
                    <Select placeholder='Select status' className='ccd-select' allowClear>
                      <Select.Option value='COMPLIANT'>Compliant</Select.Option>
                      <Select.Option value='NON_COMPLIANT'>Non-Compliant</Select.Option>
                      <Select.Option value='PENDING_REVIEW'>Pending Review</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item label='Certifications' name='certifications'>
                    <div>
                      <Space style={{ marginBottom: 8 }}>
                        <Input
                          style={{ width: 200 }}
                          placeholder='Add a certification'
                          value={inputCertification}
                          onChange={e => setInputCertification(e.target.value)}
                          onPressEnter={handleAddCertification}
                        />
                        <Button type='primary' onClick={handleAddCertification}>
                          Add
                        </Button>
                      </Space>
                      <div>
                        {certifications.map(cert => (
                          <Tag
                            key={cert}
                            closable
                            onClose={() => handleRemoveCertification(cert)}
                            style={{ marginBottom: 4 }}
                          >
                            {cert}
                          </Tag>
                        ))}
                      </div>
                    </div>
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
                      placeholder='Additional notes about this supplier...'
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
