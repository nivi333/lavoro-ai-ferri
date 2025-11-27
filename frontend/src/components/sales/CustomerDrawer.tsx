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
} from 'antd';
import { customerService, CreateCustomerRequest, UpdateCustomerRequest, Customer } from '../../services/customerService';
import { GradientButton } from '../ui';
import '../CompanyCreationDrawer.scss'; // Reuse existing styles

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

    const isEditing = mode === 'edit' && !!customerId;

    const handleDrawerClose = () => {
        form.resetFields();
        onClose();
    };

    const handleFinish = async (values: any) => {
        setLoading(true);
        try {
            if (isEditing && customerId) {
                const updatePayload: UpdateCustomerRequest = {
                    ...values,
                };
                const updatedCustomer = await customerService.updateCustomer(customerId, updatePayload);
                message.success('Customer updated successfully!');
                onCustomerUpdated?.(updatedCustomer);
                handleDrawerClose();
            } else {
                const createPayload: CreateCustomerRequest = {
                    ...values,
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
            } else {
                form.resetFields();
                form.setFieldsValue({ isActive: true, customerType: 'RETAIL' });
                setIsActive(true);
            }
        }
    }, [open, isEditing, initialData, form]);

    const drawerTitle = isEditing ? 'Edit Customer' : 'Create Customer';
    const submitLabel = isEditing ? 'Save Changes' : 'Create Customer';

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
                    initialValues={{ isActive: true, customerType: 'RETAIL' }}
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
                                <Col span={12}>
                                    <Form.Item
                                        label='Customer Type'
                                        name='customerType'
                                        rules={[{ required: true, message: 'Please select type' }]}
                                    >
                                        <Select placeholder='Select type' className='ccd-select'>
                                            <Select.Option value='RETAIL'>Retail</Select.Option>
                                            <Select.Option value='WHOLESALE'>Wholesale</Select.Option>
                                            <Select.Option value='DISTRIBUTOR'>Distributor</Select.Option>
                                            <Select.Option value='ONLINE'>Online</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item
                                        label='Email Address'
                                        name='email'
                                        rules={[
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
                                    <Form.Item label='Phone Number' name='phone'>
                                        <Input
                                            autoComplete='off'
                                            placeholder='+1 234 567 8900'
                                            className='ccd-input'
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
                                            <Select.Option value='Afghanistan'>Afghanistan</Select.Option>
                                            <Select.Option value='Albania'>Albania</Select.Option>
                                            <Select.Option value='Algeria'>Algeria</Select.Option>
                                            <Select.Option value='Argentina'>Argentina</Select.Option>
                                            <Select.Option value='Australia'>Australia</Select.Option>
                                            <Select.Option value='Austria'>Austria</Select.Option>
                                            <Select.Option value='Bangladesh'>Bangladesh</Select.Option>
                                            <Select.Option value='Belgium'>Belgium</Select.Option>
                                            <Select.Option value='Brazil'>Brazil</Select.Option>
                                            <Select.Option value='Bulgaria'>Bulgaria</Select.Option>
                                            <Select.Option value='Canada'>Canada</Select.Option>
                                            <Select.Option value='Chile'>Chile</Select.Option>
                                            <Select.Option value='China'>China</Select.Option>
                                            <Select.Option value='Colombia'>Colombia</Select.Option>
                                            <Select.Option value='Croatia'>Croatia</Select.Option>
                                            <Select.Option value='Czech Republic'>Czech Republic</Select.Option>
                                            <Select.Option value='Denmark'>Denmark</Select.Option>
                                            <Select.Option value='Egypt'>Egypt</Select.Option>
                                            <Select.Option value='Finland'>Finland</Select.Option>
                                            <Select.Option value='France'>France</Select.Option>
                                            <Select.Option value='Germany'>Germany</Select.Option>
                                            <Select.Option value='Greece'>Greece</Select.Option>
                                            <Select.Option value='Hungary'>Hungary</Select.Option>
                                            <Select.Option value='Iceland'>Iceland</Select.Option>
                                            <Select.Option value='India'>India</Select.Option>
                                            <Select.Option value='Indonesia'>Indonesia</Select.Option>
                                            <Select.Option value='Iran'>Iran</Select.Option>
                                            <Select.Option value='Iraq'>Iraq</Select.Option>
                                            <Select.Option value='Ireland'>Ireland</Select.Option>
                                            <Select.Option value='Israel'>Israel</Select.Option>
                                            <Select.Option value='Italy'>Italy</Select.Option>
                                            <Select.Option value='Japan'>Japan</Select.Option>
                                            <Select.Option value='Jordan'>Jordan</Select.Option>
                                            <Select.Option value='Kenya'>Kenya</Select.Option>
                                            <Select.Option value='South Korea'>South Korea</Select.Option>
                                            <Select.Option value='Kuwait'>Kuwait</Select.Option>
                                            <Select.Option value='Lebanon'>Lebanon</Select.Option>
                                            <Select.Option value='Libya'>Libya</Select.Option>
                                            <Select.Option value='Malaysia'>Malaysia</Select.Option>
                                            <Select.Option value='Mexico'>Mexico</Select.Option>
                                            <Select.Option value='Morocco'>Morocco</Select.Option>
                                            <Select.Option value='Netherlands'>Netherlands</Select.Option>
                                            <Select.Option value='New Zealand'>New Zealand</Select.Option>
                                            <Select.Option value='Norway'>Norway</Select.Option>
                                            <Select.Option value='Pakistan'>Pakistan</Select.Option>
                                            <Select.Option value='Peru'>Peru</Select.Option>
                                            <Select.Option value='Philippines'>Philippines</Select.Option>
                                            <Select.Option value='Poland'>Poland</Select.Option>
                                            <Select.Option value='Portugal'>Portugal</Select.Option>
                                            <Select.Option value='Qatar'>Qatar</Select.Option>
                                            <Select.Option value='Romania'>Romania</Select.Option>
                                            <Select.Option value='Russia'>Russia</Select.Option>
                                            <Select.Option value='Saudi Arabia'>Saudi Arabia</Select.Option>
                                            <Select.Option value='Singapore'>Singapore</Select.Option>
                                            <Select.Option value='South Africa'>South Africa</Select.Option>
                                            <Select.Option value='Spain'>Spain</Select.Option>
                                            <Select.Option value='Sweden'>Sweden</Select.Option>
                                            <Select.Option value='Switzerland'>Switzerland</Select.Option>
                                            <Select.Option value='Syria'>Syria</Select.Option>
                                            <Select.Option value='Thailand'>Thailand</Select.Option>
                                            <Select.Option value='Tunisia'>Tunisia</Select.Option>
                                            <Select.Option value='Turkey'>Turkey</Select.Option>
                                            <Select.Option value='Ukraine'>Ukraine</Select.Option>
                                            <Select.Option value='United Arab Emirates'>United Arab Emirates</Select.Option>
                                            <Select.Option value='United Kingdom'>United Kingdom</Select.Option>
                                            <Select.Option value='United States'>United States</Select.Option>
                                            <Select.Option value='Venezuela'>Venezuela</Select.Option>
                                            <Select.Option value='Vietnam'>Vietnam</Select.Option>
                                            <Select.Option value='Yemen'>Yemen</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        <Divider className='ccd-divider' />

                        {/* Address Information */}
                        <div className='ccd-section'>
                            <div className='ccd-section-title'>Address Information</div>
                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item
                                        label='Address Line 1'
                                        name='addressLine1'
                                        rules={[{ required: true, message: 'Please enter address' }]}
                                    >
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
                                    <Form.Item
                                        label='City'
                                        name='city'
                                        rules={[{ required: true, message: 'Please enter city' }]}
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
                                    <Form.Item
                                        label='State/Province'
                                        name='state'
                                        rules={[{ required: true, message: 'Please enter state' }]}
                                    >
                                        <Input
                                            maxLength={100}
                                            autoComplete='off'
                                            placeholder='Enter state'
                                            className='ccd-input'
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label='Postal/ZIP Code'
                                        name='pincode'
                                        rules={[{ required: true, message: 'Please enter postal code' }]}
                                    >
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

                        {/* Financial Details */}
                        <div className='ccd-section'>
                            <div className='ccd-section-title'>Financial Details</div>
                            <Row gutter={12}>
                                <Col span={8}>
                                    <Form.Item label='Tax ID' name='taxId'>
                                        <Input placeholder='Tax ID / GSTIN' className='ccd-input' maxLength={50} />
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
                                <Col span={8}>
                                    <Form.Item label='Payment Terms' name='paymentTerms'>
                                        <Select placeholder='Select terms' className='ccd-select'>
                                            <Select.Option value='IMMEDIATE'>Immediate</Select.Option>
                                            <Select.Option value='NET15'>Net 15</Select.Option>
                                            <Select.Option value='NET30'>Net 30</Select.Option>
                                            <Select.Option value='NET60'>Net 60</Select.Option>
                                        </Select>
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
