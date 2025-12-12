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
import { supplierService, Supplier } from '../../services/supplierService';
import { productService, ProductSummary } from '../../services/productService';
import { purchaseOrderService, PurchaseOrderSummary } from '../../services/purchaseOrderService';
import {
  billService,
  CreateBillRequest,
  BillDetail,
  BillItemInput,
  PaymentTerms,
} from '../../services/billService';
import './BillFormDrawer.scss';

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

interface BillFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode?: 'create' | 'edit';
  editingBillId?: string | null;
}

interface BillFormValues {
  billCode?: string;
  supplierId?: string;
  supplierName: string;
  supplierCode?: string;
  purchaseOrderId?: string;
  locationId: string;
  billNumber?: string;
  billDate: Dayjs;
  dueDate: Dayjs;
  paymentTerms?: PaymentTerms;
  currency?: string;
  shippingCharges?: number;
  notes?: string;
  supplierInvoiceNo?: string;
  isActive?: boolean;
  items: {
    productId?: string;
    itemCode: string;
    description?: string;
    quantity: number;
    unitOfMeasure: string;
    unitCost: number;
    discountPercent?: number;
    taxRate?: number;
  }[];
}

export const BillFormDrawer: React.FC<BillFormDrawerProps> = ({
  visible,
  onClose,
  onSaved,
  mode = 'create',
  editingBillId,
}) => {
  const [form] = Form.useForm<BillFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderSummary[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);

  const isEditing = mode === 'edit' && !!editingBillId;

  useEffect(() => {
    if (!visible) return;

    const loadData = async () => {
      try {
        const [locs, suppliersData, productsData, posData, bill] = await Promise.all([
          locationService.getLocations(),
          fetchSuppliers(),
          fetchProducts(),
          fetchPurchaseOrders(),
          isEditing && editingBillId
            ? billService.getBillById(editingBillId)
            : Promise.resolve(null),
        ]);

        setLocations(locs);
        setSuppliers(suppliersData);
        setProducts(productsData);
        setPurchaseOrders(posData);

        if (bill) {
          populateForm(bill);
        } else {
          form.resetFields();
          const defaultLocation = locs.find(l => l.isDefault && l.isHeadquarters);
          form.setFieldsValue({
            currency: 'INR',
            billDate: dayjs(),
            dueDate: dayjs().add(30, 'day'),
            paymentTerms: 'NET_30',
            locationId: defaultLocation?.id,
            items: [
              {
                itemCode: '',
                description: '',
                quantity: 1,
                unitOfMeasure: 'PCS',
                unitCost: 0,
              },
            ],
          } as any);
        }
      } catch (error: any) {
        console.error('Error initializing bill form:', error);
        message.error(error.message || 'Failed to initialize bill form');
      }
    };

    loadData();
  }, [visible, isEditing, editingBillId, form]);

  const fetchSuppliers = async (): Promise<Supplier[]> => {
    try {
      setLoadingSuppliers(true);
      const response = await supplierService.getSuppliers({ isActive: true });
      return response.suppliers || [];
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      message.error('Failed to load suppliers');
      return [];
    } finally {
      setLoadingSuppliers(false);
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

  const fetchPurchaseOrders = async (): Promise<PurchaseOrderSummary[]> => {
    try {
      setLoadingPOs(true);
      const posData = await purchaseOrderService.getPurchaseOrders();
      // Filter to only show POs that can have bills (not cancelled)
      return posData.filter(po => po.status !== 'CANCELLED');
    } catch (error: any) {
      console.error('Error fetching purchase orders:', error);
      message.error('Failed to load purchase orders');
      return [];
    } finally {
      setLoadingPOs(false);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      form.setFieldsValue({
        supplierName: supplier.name,
        supplierCode: supplier.code,
      });
    }
  };

  const handlePurchaseOrderChange = async (poId: string | undefined) => {
    setSelectedPOId(poId || null);

    if (!poId) {
      return;
    }

    try {
      const po = await purchaseOrderService.getPurchaseOrderById(poId);
      if (po) {
        // Auto-fill supplier info from PO
        form.setFieldsValue({
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          supplierCode: po.supplierCode,
          locationId: po.locationId,
        });

        // Auto-fill items from PO
        const items = po.items.map(item => ({
          productId: item.productId,
          itemCode: item.itemCode,
          description: item.description,
          quantity: Number(item.quantity),
          unitOfMeasure: item.unitOfMeasure,
          unitCost: Number(item.unitCost),
          discountPercent: Number(item.discountPercent),
          taxRate: Number(item.taxRate),
        }));

        form.setFieldsValue({ items });
      }
    } catch (error: any) {
      console.error('Error fetching PO details:', error);
      message.error('Failed to load purchase order details');
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
        unitCost: product.costPrice,
      };
      form.setFieldsValue({ items });
    }
  };

  const handlePaymentTermsChange = (paymentTerms: PaymentTerms) => {
    const billDate = form.getFieldValue('billDate') as Dayjs;
    if (billDate) {
      let dueDate: Dayjs;
      switch (paymentTerms) {
        case 'IMMEDIATE':
        case 'ADVANCE':
        case 'COD':
          dueDate = billDate;
          break;
        case 'NET_15':
          dueDate = billDate.add(15, 'day');
          break;
        case 'NET_30':
          dueDate = billDate.add(30, 'day');
          break;
        case 'NET_60':
          dueDate = billDate.add(60, 'day');
          break;
        case 'NET_90':
          dueDate = billDate.add(90, 'day');
          break;
        default:
          dueDate = billDate.add(30, 'day');
      }
      form.setFieldsValue({ dueDate });
    }
  };

  const populateForm = (bill: BillDetail) => {
    setIsActive(bill.isActive ?? true);
    setSelectedPOId(bill.purchaseOrder?.poId || null);
    form.setFieldsValue({
      billCode: bill.billId,
      supplierId: bill.supplierId,
      supplierName: bill.supplierName,
      supplierCode: bill.supplierCode,
      purchaseOrderId: bill.purchaseOrder?.poId,
      locationId: bill.locationId,
      billNumber: bill.billNumber,
      billDate: dayjs(bill.billDate),
      dueDate: dayjs(bill.dueDate),
      paymentTerms: bill.paymentTerms,
      currency: bill.currency,
      shippingCharges: Number(bill.shippingCharges),
      notes: bill.notes,
      supplierInvoiceNo: bill.supplierInvoiceNo,
      isActive: bill.isActive ?? true,
      items: bill.items.map(item => ({
        productId: item.productId,
        itemCode: item.itemCode,
        description: item.description,
        quantity: Number(item.quantity),
        unitOfMeasure: item.unitOfMeasure,
        unitCost: Number(item.unitCost),
        discountPercent: Number(item.discountPercent),
        taxRate: Number(item.taxRate),
      })),
    } as any);
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedPOId(null);
    onClose();
  };

  const buildPayload = (values: BillFormValues): CreateBillRequest => {
    const items: BillItemInput[] = values.items.map(item => ({
      productId: item.productId,
      itemCode: item.itemCode,
      description: item.description,
      quantity: item.quantity,
      unitOfMeasure: item.unitOfMeasure,
      unitCost: item.unitCost,
      discountPercent: item.discountPercent,
      taxRate: item.taxRate,
    }));

    return {
      supplierId: values.supplierId,
      supplierName: values.supplierName,
      supplierCode: values.supplierCode || undefined,
      purchaseOrderId: values.purchaseOrderId || undefined,
      locationId: values.locationId,
      billNumber: values.billNumber || undefined,
      billDate: values.billDate.toISOString(),
      dueDate: values.dueDate.toISOString(),
      paymentTerms: values.paymentTerms,
      currency: values.currency || 'INR',
      shippingCharges: values.shippingCharges || 0,
      notes: values.notes || undefined,
      supplierInvoiceNo: values.supplierInvoiceNo || undefined,
      items,
    };
  };

  const handleSubmit = async (values: BillFormValues) => {
    // Validate: if no PO reference, product is required for each item
    if (!values.purchaseOrderId) {
      for (let i = 0; i < values.items.length; i++) {
        if (!values.items[i].productId) {
          message.error(
            `Product is required for item ${i + 1} when not linked to a Purchase Order`
          );
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const payload = buildPayload(values);

      if (isEditing && editingBillId) {
        await billService.updateBill(editingBillId, payload);
        message.success('Bill updated successfully');
      } else {
        await billService.createBill(payload);
        message.success('Bill created successfully');
      }

      onSaved();
      handleClose();
    } catch (error: any) {
      console.error('Error saving bill:', error);
      message.error(error.message || 'Failed to save bill');
    } finally {
      setSubmitting(false);
    }
  };

  const drawerTitle = isEditing ? 'Edit Bill' : 'Create Bill';
  const submitLabel = isEditing ? 'Update Bill' : 'Create Bill';

  return (
    <Drawer
      title={
        <div className='drawer-header-with-switch'>
          <span className='bill-drawer-title'>{drawerTitle}</span>
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
      className='bill-form-drawer'
      styles={{ body: { padding: 0 } }}
      footer={null}
    >
      <div className='bill-drawer-content'>
        <Form<BillFormValues>
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          className='bill-form'
        >
          <div className='bill-form-content'>
            {/* Hidden isActive field */}
            <Form.Item name='isActive' valuePropName='checked' hidden>
              <Switch />
            </Form.Item>

            {/* Bill Info */}
            <div className='bill-section'>
              <div className='bill-section-title'>Bill Info</div>
              <Row gutter={[5, 10]}>
                <Col span={12}>
                  <Form.Item label='Bill Code' name='billCode'>
                    <Input disabled placeholder='Auto-generated' />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Bill Number' name='billNumber'>
                    <Input placeholder='Supplier bill number (optional)' />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label='Purchase Order Reference' name='purchaseOrderId'>
                    <Select
                      showSearch
                      allowClear
                      placeholder='Link to Purchase Order (optional)'
                      loading={loadingPOs}
                      onChange={handlePurchaseOrderChange}
                      filterOption={(input, option) =>
                        String(option?.children || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {purchaseOrders.map(po => (
                        <Option key={po.poId} value={po.poId}>
                          {po.poId} - {po.supplierName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Supplier'
                    name='supplierId'
                    rules={[{ required: true, message: 'Please select a supplier' }]}
                  >
                    <Select
                      showSearch
                      placeholder='Search and select supplier'
                      loading={loadingSuppliers}
                      onChange={handleSupplierChange}
                      filterOption={(input, option) =>
                        String(option?.children || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {suppliers.map(supplier => (
                        <Option key={supplier.id} value={supplier.id}>
                          {supplier.name} {supplier.code ? `(${supplier.code})` : ''}
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
                    <Select placeholder='Select location' showSearch optionFilterProp='children'>
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
                {/* Hidden fields for supplier name and code */}
                <Form.Item name='supplierName' hidden>
                  <Input />
                </Form.Item>
                <Form.Item name='supplierCode' hidden>
                  <Input />
                </Form.Item>
                <Col span={8}>
                  <Form.Item
                    label='Bill Date'
                    name='billDate'
                    rules={[{ required: true, message: 'Please select bill date' }]}
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
                <Col span={8}>
                  <Form.Item label='Currency' name='currency'>
                    <Input maxLength={10} placeholder='INR' />
                  </Form.Item>
                </Col>
                <Col span={8}>
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
                <Col span={8}>
                  <Form.Item label='Supplier Invoice No' name='supplierInvoiceNo'>
                    <Input placeholder='Supplier reference' />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='bill-divider' />

            {/* Items */}
            <div className='bill-section'>
              <div className='bill-section-title'>
                Bill Items
                {!selectedPOId && (
                  <span style={{ fontSize: '12px', color: '#ff4d4f', marginLeft: '8px' }}>
                    (Product required when not linked to PO)
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
                        <Row gutter={[5, 10]} className='bill-item-row' align='top'>
                          <Col span={24}>
                            <Form.Item
                              {...field}
                              label={index === 0 ? 'Product' : ''}
                              name={[field.name, 'productId']}
                              rules={
                                !selectedPOId
                                  ? [{ required: true, message: 'Product required' }]
                                  : []
                              }
                            >
                              <Select
                                showSearch
                                placeholder={
                                  selectedPOId
                                    ? 'Product (auto-filled from PO)'
                                    : 'Select product (required)'
                                }
                                loading={loadingProducts}
                                allowClear={!!selectedPOId}
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
                        <Row gutter={[5, 10]} className='bill-item-row' align='top'>
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
                              label={index === 0 ? 'Unit Cost' : ''}
                              name={[field.name, 'unitCost']}
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

            <Divider className='bill-divider' />

            {/* Additional Details */}
            <div className='bill-section'>
              <div className='bill-section-title'>Additional Details</div>
              <Row gutter={[5, 10]}>
                <Col span={24}>
                  <Form.Item label='Notes' name='notes'>
                    <Input.TextArea rows={2} maxLength={500} placeholder='Internal notes' />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <div className='bill-actions'>
            <Button onClick={handleClose} className='bill-cancel-btn'>
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
