import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Divider,
  InputNumber,
  message,
  Row,
  Col,
  Switch,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { GradientButton } from '../ui';
import { locationService, Location } from '../../services/locationService';
import { customerService, Customer } from '../../services/customerService';
import { productService, ProductSummary } from '../../services/productService';
import { orderService, OrderSummary } from '../../services/orderService';
import {
  invoiceService,
  CreateInvoiceRequest,
  InvoiceDetail,
  InvoiceItemInput,
  PaymentTerms,
} from '../../services/invoiceService';
import './InvoiceFormDrawer.scss';

const { Option } = Select;

const UOM_OPTIONS = [
  { value: 'PCS', label: 'PCS - Pieces' },
  { value: 'MTR', label: 'MTR - Meters' },
  { value: 'YDS', label: 'YDS - Yards' },
  { value: 'KG', label: 'KG - Kilograms' },
  { value: 'LBS', label: 'LBS - Pounds' },
  { value: 'ROLL', label: 'ROLL - Rolls' },
  { value: 'BOX', label: 'BOX - Boxes' },
  { value: 'CTN', label: 'CTN - Cartons' },
  { value: 'DOZ', label: 'DOZ - Dozens' },
  { value: 'SET', label: 'SET - Sets' },
  { value: 'BALE', label: 'BALE - Bales' },
  { value: 'CONE', label: 'CONE - Cones' },
  { value: 'SPOOL', label: 'SPOOL - Spools' },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'NET_15', label: 'Net 15 Days' },
  { value: 'NET_30', label: 'Net 30 Days' },
  { value: 'NET_60', label: 'Net 60 Days' },
  { value: 'NET_90', label: 'Net 90 Days' },
  { value: 'ADVANCE', label: 'Advance Payment' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'CREDIT', label: 'Credit' },
];

interface InvoiceFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode?: 'create' | 'edit';
  editingInvoiceId?: string | null;
}

interface InvoiceFormValues {
  invoiceCode?: string;
  customerId?: string;
  customerName: string;
  customerCode?: string;
  orderId?: string;
  locationId: string;
  invoiceNumber?: string;
  invoiceDate: Dayjs;
  dueDate: Dayjs;
  paymentTerms?: PaymentTerms;
  currency?: string;
  shippingCharges?: number;
  notes?: string;
  termsConditions?: string;
  bankDetails?: string;
  isActive?: boolean;
  items: {
    productId?: string;
    itemCode: string;
    description?: string;
    quantity: number;
    unitOfMeasure: string;
    unitPrice: number;
    discountPercent?: number;
    taxRate?: number;
  }[];
}

export const InvoiceFormDrawer: React.FC<InvoiceFormDrawerProps> = ({
  visible,
  onClose,
  onSaved,
  mode = 'create',
  editingInvoiceId,
}) => {
  const [form] = Form.useForm<InvoiceFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const isEditing = mode === 'edit' && !!editingInvoiceId;

  useEffect(() => {
    if (!visible) return;

    const loadData = async () => {
      try {
        const [locs, customersData, productsData, ordersData, invoice] = await Promise.all([
          locationService.getLocations(),
          fetchCustomers(),
          fetchProducts(),
          fetchOrders(),
          isEditing && editingInvoiceId
            ? invoiceService.getInvoiceById(editingInvoiceId)
            : Promise.resolve(null),
        ]);

        setLocations(locs);
        setCustomers(customersData);
        setProducts(productsData);
        setOrders(ordersData);

        if (invoice) {
          populateForm(invoice);
        } else {
          form.resetFields();
          const defaultLocation = locs.find(l => l.isDefault && l.isHeadquarters);
          form.setFieldsValue({
            currency: 'INR',
            invoiceDate: dayjs(),
            dueDate: dayjs().add(30, 'day'),
            paymentTerms: 'NET_30',
            locationId: defaultLocation?.id,
            items: [
              {
                itemCode: '',
                description: '',
                quantity: 1,
                unitOfMeasure: 'PCS',
                unitPrice: 0,
              },
            ],
          } as any);
        }
      } catch (error: any) {
        console.error('Error initializing invoice form:', error);
        message.error(error.message || 'Failed to initialize invoice form');
      }
    };

    loadData();
  }, [visible, isEditing, editingInvoiceId, form]);

  const fetchCustomers = async (): Promise<Customer[]> => {
    try {
      setLoadingCustomers(true);
      const response = await customerService.getCustomers({ isActive: true });
      return response.customers || [];
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      message.error('Failed to load customers');
      return [];
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchProducts = async (): Promise<ProductSummary[]> => {
    try {
      setLoadingProducts(true);
      const response = await productService.getProducts({ isActive: true, limit: 1000 });
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching products:', error);
      message.error('Failed to load products');
      return [];
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async (): Promise<OrderSummary[]> => {
    try {
      setLoadingOrders(true);
      const ordersData = await orderService.getOrders();
      // Filter to only show orders that can have invoices (not cancelled)
      return ordersData.filter(o => o.status !== 'CANCELLED');
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      message.error('Failed to load orders');
      return [];
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      form.setFieldsValue({
        customerName: customer.name,
        customerCode: customer.code,
      });
    }
  };

  const handleOrderChange = async (orderId: string | undefined) => {
    setSelectedOrderId(orderId || null);

    if (!orderId) {
      // Clear order-related fields but keep items
      return;
    }

    try {
      const order = await orderService.getOrderById(orderId);
      if (order) {
        // Auto-fill customer info from order
        form.setFieldsValue({
          customerId: order.customerId,
          customerName: order.customerName,
          customerCode: order.customerCode,
          locationId: order.locationId,
        });

        // Auto-fill items from order
        const items = order.items.map(item => ({
          productId: item.productId,
          itemCode: item.itemCode,
          description: item.description,
          quantity: Number(item.quantity),
          unitOfMeasure: item.unitOfMeasure,
          unitPrice: Number(item.unitPrice),
          discountPercent: Number(item.discountPercent),
          taxRate: Number(item.taxRate),
        }));

        form.setFieldsValue({ items });
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      message.error('Failed to load order details');
    }
  };

  const handleProductChange = (productId: string, fieldIndex: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const items = form.getFieldValue('items') || [];
      items[fieldIndex] = {
        ...items[fieldIndex],
        productId: product.id,
        itemCode: product.productCode,
        description: product.name,
        unitOfMeasure: product.unitOfMeasure,
        unitPrice: product.sellingPrice,
      };
      form.setFieldsValue({ items });
    }
  };

  const handlePaymentTermsChange = (paymentTerms: PaymentTerms) => {
    const invoiceDate = form.getFieldValue('invoiceDate') as Dayjs;
    if (invoiceDate) {
      let dueDate: Dayjs;
      switch (paymentTerms) {
        case 'IMMEDIATE':
        case 'ADVANCE':
        case 'COD':
          dueDate = invoiceDate;
          break;
        case 'NET_15':
          dueDate = invoiceDate.add(15, 'day');
          break;
        case 'NET_30':
          dueDate = invoiceDate.add(30, 'day');
          break;
        case 'NET_60':
          dueDate = invoiceDate.add(60, 'day');
          break;
        case 'NET_90':
          dueDate = invoiceDate.add(90, 'day');
          break;
        default:
          dueDate = invoiceDate.add(30, 'day');
      }
      form.setFieldsValue({ dueDate });
    }
  };

  const populateForm = (invoice: InvoiceDetail) => {
    setIsActive(invoice.isActive ?? true);
    setSelectedOrderId(invoice.order?.orderId || null);
    form.setFieldsValue({
      invoiceCode: invoice.invoiceId,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerCode: invoice.customerCode,
      orderId: invoice.order?.orderId,
      locationId: invoice.locationId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: dayjs(invoice.invoiceDate),
      dueDate: dayjs(invoice.dueDate),
      paymentTerms: invoice.paymentTerms,
      currency: invoice.currency,
      shippingCharges: Number(invoice.shippingCharges),
      notes: invoice.notes,
      termsConditions: invoice.termsConditions,
      bankDetails: invoice.bankDetails,
      isActive: invoice.isActive ?? true,
      items: invoice.items.map(item => ({
        productId: item.productId,
        itemCode: item.itemCode,
        description: item.description,
        quantity: Number(item.quantity),
        unitOfMeasure: item.unitOfMeasure,
        unitPrice: Number(item.unitPrice),
        discountPercent: Number(item.discountPercent),
        taxRate: Number(item.taxRate),
      })),
    } as any);
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedOrderId(null);
    onClose();
  };

  const buildPayload = (values: InvoiceFormValues): CreateInvoiceRequest => {
    const items: InvoiceItemInput[] = values.items.map(item => ({
      productId: item.productId,
      itemCode: item.itemCode,
      description: item.description,
      quantity: item.quantity,
      unitOfMeasure: item.unitOfMeasure,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent,
      taxRate: item.taxRate,
    }));

    return {
      customerId: values.customerId,
      customerName: values.customerName,
      customerCode: values.customerCode || undefined,
      orderId: values.orderId || undefined,
      locationId: values.locationId,
      invoiceNumber: values.invoiceNumber || undefined,
      invoiceDate: values.invoiceDate.toISOString(),
      dueDate: values.dueDate.toISOString(),
      paymentTerms: values.paymentTerms,
      currency: values.currency || 'INR',
      shippingCharges: values.shippingCharges || 0,
      notes: values.notes || undefined,
      termsConditions: values.termsConditions || undefined,
      bankDetails: values.bankDetails || undefined,
      items,
    };
  };

  const handleSubmit = async (values: InvoiceFormValues) => {
    // Validate: if no order reference, product is required for each item
    if (!values.orderId) {
      for (let i = 0; i < values.items.length; i++) {
        if (!values.items[i].productId) {
          message.error(`Product is required for item ${i + 1} when not linked to a Sales Order`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const payload = buildPayload(values);

      if (isEditing && editingInvoiceId) {
        await invoiceService.updateInvoice(editingInvoiceId, payload);
        message.success('Invoice updated successfully');
      } else {
        await invoiceService.createInvoice(payload);
        message.success('Invoice created successfully');
      }

      onSaved();
      handleClose();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      message.error(error.message || 'Failed to save invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const drawerTitle = isEditing ? 'Edit Invoice' : 'Create Invoice';
  const submitLabel = isEditing ? 'Update Invoice' : 'Create Invoice';

  return (
    <Drawer
      title={
        <div className='drawer-header-with-switch'>
          <span className='invoice-drawer-title'>{drawerTitle}</span>
          <div className='header-switch'>
            <span className='switch-label status-label-active'>Active</span>
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
      open={visible}
      className='invoice-form-drawer'
      styles={{ body: { padding: 0 } }}
      footer={null}
    >
      <div className='invoice-drawer-content'>
        <Form<InvoiceFormValues>
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          className='invoice-form'
        >
          <div className='invoice-form-content'>
            {/* Hidden isActive field */}
            <Form.Item name='isActive' valuePropName='checked' hidden>
              <Switch />
            </Form.Item>

            {/* Invoice Info */}
            <div className='invoice-section'>
              <div className='invoice-section-title'>Invoice Info</div>
              <Row gutter={[5, 10]}>
                <Col span={12}>
                  <Form.Item label='Invoice Code' name='invoiceCode'>
                    <Input disabled placeholder='Auto-generated' />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Invoice Number' name='invoiceNumber'>
                    <Input placeholder='Custom invoice number (optional)' />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label='Sales Order Reference' name='orderId'>
                    <Select
                      showSearch
                      allowClear
                      placeholder='Link to Sales Order (optional)'
                      loading={loadingOrders}
                      onChange={handleOrderChange}
                      filterOption={(input, option) =>
                        String(option?.children || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {orders.map(order => (
                        <Option key={order.orderId} value={order.orderId}>
                          {order.orderId} - {order.customerName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Customer'
                    name='customerId'
                    rules={[{ required: true, message: 'Please select a customer' }]}
                  >
                    <Select
                      showSearch
                      placeholder='Search and select customer'
                      loading={loadingCustomers}
                      onChange={handleCustomerChange}
                      filterOption={(input, option) =>
                        String(option?.children || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {customers.map(customer => (
                        <Option key={customer.id} value={customer.id}>
                          {customer.name} {customer.code ? `(${customer.code})` : ''}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Location'
                    name='locationId'
                    rules={[{ required: true, message: 'Please select a location' }]}
                  >
                    <Select
                      placeholder='Select billing location'
                      showSearch
                      optionFilterProp='children'
                    >
                      {locations.map(loc => (
                        <Option key={loc.id} value={loc.id}>
                          {loc.name}
                          {loc.isHeadquarters ? ' • HQ' : ''}
                          {loc.isDefault ? ' • Default' : ''}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                {/* Hidden fields for customer name and code */}
                <Form.Item name='customerName' hidden>
                  <Input />
                </Form.Item>
                <Form.Item name='customerCode' hidden>
                  <Input />
                </Form.Item>
                <Col span={8}>
                  <Form.Item
                    label='Invoice Date'
                    name='invoiceDate'
                    rules={[{ required: true, message: 'Please select invoice date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label='Payment Terms' name='paymentTerms'>
                    <Select placeholder='Select terms' onChange={handlePaymentTermsChange}>
                      {PAYMENT_TERMS_OPTIONS.map(opt => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label='Due Date'
                    name='dueDate'
                    rules={[{ required: true, message: 'Please select due date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Currency' name='currency'>
                    <Input maxLength={10} placeholder='INR' />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Shipping Charges' name='shippingCharges'>
                    <InputNumber
                      min={0}
                      step={0.01}
                      precision={2}
                      style={{ width: '100%' }}
                      placeholder='0.00'
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='invoice-divider' />

            {/* Items */}
            <div className='invoice-section'>
              <div className='invoice-section-title'>
                Invoice Items
                {!selectedOrderId && (
                  <span style={{ fontSize: '12px', color: '#ff4d4f', marginLeft: '8px' }}>
                    (Product required when not linked to SO)
                  </span>
                )}
              </div>

              <Form.List
                name='items'
                rules={[
                  {
                    validator: async (_, items) => {
                      if (!items || items.length === 0) {
                        return Promise.reject(new Error('At least one item is required'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                {(fields, { add, remove }, { errors }) => (
                  <>
                    {fields.map((field, index) => (
                      <div key={field.key}>
                        <Row gutter={[5, 10]} className='invoice-item-row' align='top'>
                          <Col span={24}>
                            <Form.Item
                              {...field}
                              label={index === 0 ? 'Product' : ''}
                              name={[field.name, 'productId']}
                              rules={
                                !selectedOrderId
                                  ? [{ required: true, message: 'Product required' }]
                                  : []
                              }
                            >
                              <Select
                                showSearch
                                placeholder={
                                  selectedOrderId
                                    ? 'Product (auto-filled from SO)'
                                    : 'Select product (required)'
                                }
                                loading={loadingProducts}
                                allowClear={!!selectedOrderId}
                                onChange={value => handleProductChange(value, index)}
                                filterOption={(input, option) =>
                                  String(option?.children || '')
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                                }
                              >
                                {products.map(product => (
                                  <Option key={product.id} value={product.id}>
                                    {product.name} ({product.productCode})
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[5, 10]} className='invoice-item-row' align='top'>
                          <Col span={4}>
                            <Form.Item
                              {...field}
                              label={index === 0 ? 'Item Code' : ''}
                              name={[field.name, 'itemCode']}
                              rules={[{ required: true, message: 'Required' }]}
                            >
                              <Input maxLength={255} placeholder='Item code' />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...field}
                              label={index === 0 ? 'Description' : ''}
                              name={[field.name, 'description']}
                            >
                              <Input maxLength={500} placeholder='Description' />
                            </Form.Item>
                          </Col>
                          <Col span={3}>
                            <Form.Item
                              {...field}
                              label={index === 0 ? 'Qty' : ''}
                              name={[field.name, 'quantity']}
                              rules={[{ required: true, message: 'Required' }]}
                            >
                              <InputNumber
                                min={0.001}
                                step={1}
                                style={{ width: '100%' }}
                                placeholder='1'
                              />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item
                              {...field}
                              label={index === 0 ? 'UOM' : ''}
                              name={[field.name, 'unitOfMeasure']}
                              rules={[{ required: true, message: 'Required' }]}
                            >
                              <Select placeholder='Select UOM' showSearch>
                                {UOM_OPTIONS.map(uom => (
                                  <Option key={uom.value} value={uom.value}>
                                    {uom.label}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={5}>
                            <Form.Item
                              {...field}
                              label={index === 0 ? 'Unit Price' : ''}
                              name={[field.name, 'unitPrice']}
                              rules={[{ required: true, message: 'Required' }]}
                            >
                              <InputNumber
                                min={0}
                                step={0.01}
                                precision={2}
                                style={{ width: '100%' }}
                                placeholder='0.00'
                                formatter={value => {
                                  if (!value) return '';
                                  return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                                }}
                                parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={2}>
                            {fields.length > 1 && (
                              <Button
                                type='text'
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => remove(field.name)}
                                style={{ marginTop: index === 0 ? 30 : 6 }}
                              />
                            )}
                          </Col>
                        </Row>
                      </div>
                    ))}

                    <Form.ErrorList errors={errors} />

                    <Button type='dashed' onClick={() => add()} block style={{ marginTop: 8 }}>
                      Add Item
                    </Button>
                  </>
                )}
              </Form.List>
            </div>

            <Divider className='invoice-divider' />

            {/* Additional Details */}
            <div className='invoice-section'>
              <div className='invoice-section-title'>Additional Details</div>
              <Row gutter={[5, 10]}>
                <Col span={24}>
                  <Form.Item label='Notes' name='notes'>
                    <Input.TextArea rows={2} maxLength={500} placeholder='Internal notes' />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label='Terms & Conditions' name='termsConditions'>
                    <Input.TextArea rows={2} maxLength={1000} placeholder='Terms and conditions' />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label='Bank Details' name='bankDetails'>
                    <Input.TextArea
                      rows={2}
                      maxLength={500}
                      placeholder='Bank details for payment'
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <div className='invoice-actions'>
            <Button onClick={handleClose} className='invoice-cancel-btn'>
              Cancel
            </Button>
            <GradientButton size='small' htmlType='submit' loading={submitting}>
              {submitLabel}
            </GradientButton>
          </div>
        </Form>
      </div>
    </Drawer>
  );
};
