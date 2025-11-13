import React, { useCallback, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Divider,
  Select,
  Upload,
  message,
  Row,
  Col,
  DatePicker,
  Space,
} from 'antd';
import { BankOutlined, DeleteOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import { companyService, CreateCompanyRequest } from '../services/companyService';
import { EmailPhoneInput } from './ui/EmailPhoneInput';
import { GradientButton } from './ui';
import './CompanyCreationDrawer.scss';

const { Option } = Select;

interface CompanyCreationDrawerProps {
  open: boolean;
  onClose: () => void;
  onCompanyCreated: () => void;
}

export const CompanyCreationDrawer: React.FC<CompanyCreationDrawerProps> = ({
  open,
  onClose,
  onCompanyCreated,
}) => {
  const [form] = Form.useForm();
  const [logoFile, setLogoFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugUnique, setSlugUnique] = useState(true);

  const resetFormState = useCallback(() => {
    form.resetFields();
    setLogoFile(null);
    setSlugChecking(false);
    setSlugUnique(true);
  }, [form]);

  const handleRemoveLogo = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setLogoFile(null);
  };

  const handleDrawerClose = () => {
    resetFormState();
    onClose();
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!form.getFieldValue('slug') || form.getFieldValue('slugAuto')) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      form.setFieldsValue({ slug, slugAuto: true });
      checkSlugUnique(slug);
    }
  };

  // Slug uniqueness validation
  const checkSlugUnique = async (slug: string) => {
    if (!slug) {
      setSlugUnique(true);
      return;
    }

    setSlugChecking(true);
    try {
      const isAvailable = await companyService.checkSlugAvailability(slug);
      setSlugUnique(isAvailable);
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugUnique(true); // Fallback to allow submission
    } finally {
      setSlugChecking(false);
    }
  };

  // Logo upload handlers
  const handleLogoChange = (info: any) => {
    const { file } = info;

    // Handle file validation errors
    if (file.status === 'error') {
      message.error('Failed to upload image. Please try again.');
      return;
    }

    // Validate file type
    const isValidType =
      file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg';
    if (!isValidType) {
      message.error('You can only upload JPG/PNG files!');
      return;
    }

    // Validate file size (2MB)
    const isValidSize = file.size / 1024 / 1024 < 2;
    if (!isValidSize) {
      message.error('Image must be smaller than 2MB!');
      return;
    }

    if (file.status === 'done' || file.status === 'uploading' || !file.status) {
      // Create preview URL for the uploaded file
      const fileObj = file.originFileObj || file;
      if (fileObj) {
        const reader = new FileReader();
        reader.onload = () => {
          setLogoFile({
            ...file,
            originFileObj: fileObj, // Ensure we preserve the original file object
            url: reader.result,
            status: 'done',
          });
        };
        reader.onerror = () => {
          message.error('Failed to read image file!');
        };
        reader.readAsDataURL(fileObj);
      }
    }

    if (file.status === 'removed') {
      setLogoFile(null);
    }
  };

  // Form submission
  const handleFinish = async (values: any) => {
    setUploading(true);
    try {
      // Convert logo file to base64 if uploaded
      let logoUrl: string | undefined;
      if (logoFile && logoFile.originFileObj) {
        logoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoFile.originFileObj);
        });
      }

      // Prepare the data for API call
      const companyData: CreateCompanyRequest = {
        name: values.name,
        slug: values.slug,
        industry: values.industry,
        description: values.description,
        logoUrl: logoUrl,
        country: values.country,
        locationName: values.locationName,
        address1: values.address1,
        address2: values.address2,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        establishedDate: values.establishedDate?.format('YYYY-MM-DD'),
        businessType: values.businessType,
        certifications: values.certifications,
        contactInfo: values.contactInfo,
        website: values.website,
        taxId: values.taxId,
      };

      await companyService.createCompany(companyData);

      message.success('Company created successfully!');
      handleDrawerClose();
      onCompanyCreated();
      form.resetFields();
      setLogoFile(null);
    } catch (error: any) {
      message.error(error.message || 'Failed to create company');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Drawer
      title={<span className='ccd-title'>Create Company</span>}
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
          initialValues={{ slugAuto: true }}
        >
          {/* Section 1: Basic Information */}
          <div className='ccd-section'>
            <div className='ccd-section-title'>Basic Information</div>
            <Col span={24}>
              <ImgCrop rotate aspect={1}>
                <Upload
                  name='logo'
                  accept='image/*'
                  listType='picture-circle'
                  beforeUpload={() => false}
                  showUploadList={false}
                  onChange={handleLogoChange}
                  maxCount={1}
                  className='ccd-logo-upload'
                >
                  {logoFile && logoFile.url ? (
                    <div className='ccd-logo-preview'>
                      <img src={logoFile.url} alt='Company Logo' />
                      <button
                        type='button'
                        className='ccd-logo-delete-btn'
                        onClick={handleRemoveLogo}
                        aria-label='Remove company logo'
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  ) : (
                    <span className='ccd-upload-icon'>
                      <BankOutlined />
                    </span>
                  )}
                </Upload>
              </ImgCrop>
              <div className='ccd-logo-help-text'>
                Upload Logo (PNG/JPG, max 2MB)
                <br />
                Drag & drop or click to upload
              </div>
            </Col>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label='Company Name'
                  name='name'
                  rules={[{ required: true, message: 'Please enter company name' }]}
                >
                  <Input
                    onChange={handleNameChange}
                    maxLength={48}
                    autoComplete='off'
                    placeholder='Enter company name'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='Company Slug'
                  name='slug'
                  rules={[
                    { required: true, message: 'Please enter company slug' },
                    {
                      pattern: /^[a-z0-9-]+$/,
                      message: 'Slug must be lowercase, alphanumeric or hyphens',
                    },
                    () => ({
                      validator(_) {
                        if (slugChecking) return Promise.reject('Checking slug...');
                        if (!slugUnique) return Promise.reject('Slug already taken');
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Space.Compact block className='ccd-slug-compact'>
                    <span className='ccd-slug-prefix' aria-hidden='true'>lavoro.ai/</span>
                    <Input
                      value={form.getFieldValue('slug') || ''}
                      maxLength={32}
                      autoComplete='off'
                      placeholder='Enter company slug'
                      className='ccd-input'
                      onChange={e => {
                        const rawValue = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '');
                        form.setFieldsValue({ slug: rawValue, slugAuto: false });
                        checkSlugUnique(rawValue);
                      }}
                    />
                  </Space.Compact>
                </Form.Item>
                <Form.Item name='slugAuto' hidden>
                  <Input type='hidden' />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label='Industry'
                  name='industry'
                  rules={[{ required: true, message: 'Please select industry' }]}
                >
                  <Select placeholder='Select industry' className='ccd-select'>
                    <Option value='Textile & Fabrics'>Textile & Fabrics</Option>
                    <Option value='Garments & Apparel'>Garments & Apparel</Option>
                    <Option value='Fashion & Clothing'>Fashion & Clothing</Option>
                    <Option value='Home Textiles'>Home Textiles</Option>
                    <Option value='Technical Textiles'>Technical Textiles</Option>
                    <Option value='Yarn & Fiber'>Yarn & Fiber</Option>
                    <Option value='Denim & Jeans'>Denim & Jeans</Option>
                    <Option value='Sportswear & Activewear'>Sportswear & Activewear</Option>
                    <Option value='Lingerie & Undergarments'>Lingerie & Undergarments</Option>
                    <Option value='Leather & Accessories'>Leather & Accessories</Option>
                    <Option value='Manufacturing & Production'>Manufacturing & Production</Option>
                    <Option value='Trading & Export'>Trading & Export</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label='Description' name='description'>
                  <Input.TextArea
                    rows={1}
                    maxLength={80}
                    autoComplete='off'
                    placeholder='Enter description'
                    className='ccd-textarea'
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label='Country'
                  name='country'
                  rules={[{ required: true, message: 'Please select country' }]}
                >
                  <Select showSearch placeholder='Select country' className='ccd-select'>
                    <Option value='India'>India</Option>
                    <Option value='USA'>USA</Option>
                    <Option value='UK'>UK</Option>
                    <Option value='China'>China</Option>
                    <Option value='Bangladesh'>Bangladesh</Option>
                    <Option value='Vietnam'>Vietnam</Option>
                    <Option value='Turkey'>Turkey</Option>
                    <Option value='Italy'>Italy</Option>
                    <Option value='Germany'>Germany</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='Default Location Name'
                  name='locationName'
                  rules={[{ required: true, message: 'Please enter location name' }]}
                >
                  <Input
                    maxLength={32}
                    autoComplete='off'
                    placeholder='Enter location name'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider className='ccd-divider' />

          {/* Section 2: Head Office Location */}
          <div className='ccd-section'>
            <div className='ccd-section-title'>Head Office Location</div>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label='Address Line 1'
                  name='address1'
                  rules={[{ required: true, message: 'Please enter address' }]}
                >
                  <Input
                    maxLength={64}
                    autoComplete='off'
                    placeholder='Enter address'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label='Address Line 2' name='address2'>
                  <Input
                    maxLength={64}
                    autoComplete='off'
                    placeholder='Enter address'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label='City'
                  name='city'
                  rules={[{ required: true, message: 'Please enter city' }]}
                >
                  <Input
                    maxLength={32}
                    autoComplete='off'
                    placeholder='Enter city'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='State'
                  name='state'
                  rules={[{ required: true, message: 'Please enter state' }]}
                >
                  <Input
                    maxLength={32}
                    autoComplete='off'
                    placeholder='Enter state'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='Pincode'
                  name='pincode'
                  rules={[{ required: true, message: 'Please enter pincode' }]}
                >
                  <Input
                    maxLength={12}
                    autoComplete='off'
                    placeholder='Enter pincode'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider className='ccd-divider' />

          {/* Section 3: Business Details */}
          <div className='ccd-section'>
            <div className='ccd-section-title'>Business Details</div>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label='Established Date'
                  name='establishedDate'
                  rules={[{ required: true, message: 'Please select established date' }]}
                >
                  <DatePicker
                    placeholder='Select established date'
                    className='ccd-input'
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='Business Type'
                  name='businessType'
                  rules={[{ required: true, message: 'Please select type' }]}
                >
                  <Select placeholder='Select type' className='ccd-select'>
                    <Option value='Manufacturer'>Manufacturer</Option>
                    <Option value='Trader'>Trader</Option>
                    <Option value='Exporter'>Exporter</Option>
                    <Option value='Other'>Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label='Certifications' name='certifications'>
              <Input
                maxLength={64}
                autoComplete='off'
                placeholder='Enter certifications (comma separated)'
                className='ccd-input'
              />
            </Form.Item>
          </div>

          <Divider className='ccd-divider' />

          {/* Section 4: Contact Information */}
          <div className='ccd-section'>
            <div className='ccd-section-title'>Contact Information</div>
            <Row gutter={12}>
              <Col span={24}>
                <EmailPhoneInput
                  name='contactInfo'
                  label='Contact Information'
                  placeholder='Enter email or phone number'
                  required={true}
                />
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label='Website' name='website'>
                  <Input
                    maxLength={48}
                    autoComplete='off'
                    placeholder='Enter website'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label='Tax ID' name='taxId'>
                  <Input
                    maxLength={24}
                    autoComplete='off'
                    placeholder='Enter tax ID'
                    className='ccd-input'
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Action Buttons */}
          <div className='ccd-actions'>
            <Button onClick={onClose} className='ccd-cancel-btn'>
              Cancel
            </Button>
            <GradientButton size='small' htmlType='submit' loading={uploading}>
              Create Company
            </GradientButton>
          </div>
        </Form>
      </div>
    </Drawer>
  );
};
