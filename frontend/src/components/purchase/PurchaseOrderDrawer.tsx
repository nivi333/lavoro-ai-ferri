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
import {
  purchaseOrderService,
  CreatePurchaseOrderRequest,
  PurchaseOrderDetail,
  PurchaseOrderItemInput,
} from '../../services/purchaseOrderService';
import './PurchaseOrderDrawer.scss';

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

interface PurchaseOrderDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode?: 'create' | 'edit';
  editingPOId?: string | null;
}

interface POFormValues {
  poCode?: string;
  supplierId?: string;
  supplierName: string;
  supplierCode?: string;
  poDate: Dayjs;
  expectedDeliveryDate?: Dayjs;
  currency?: string;
  notes?: string;
  locationId?: string;
  shippingMethod?: string;
  isActive?: boolean;
  items: {
    productId?: string;
    itemCode: string;
    description?: string;
    quantity: number;
    unitOfMeasure: string;
    unitCost: number;
  }[];
}

export const PurchaseOrderDrawer: React.FC<PurchaseOrderDrawerProps> = ({
  visible,
  onClose,
  onSaved,
  mode = 'create',
  editingPOId,
}) => {
  const [form] = Form.useForm<POFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const isEditing = mode === 'edit' && !!editingPOId;

  useEffect(() => {
    if (!visible) return;

    const loadData = async () => {
      try {
        const [locs, suppliersData, productsData, po] = await Promise.all([
          locationService.getLocations(),
          fetchSuppliers(),
          fetchProducts(),
          isEditing && editingPOId
            ? purchaseOrderService.getPurchaseOrderById(editingPOId)
            : Promise.resolve(null),
        ]);

        setLocations(locs);
        setSuppliers(suppliersData);
        setProducts(productsData);

        if (po) {
          populateForm(po);
        } else {
          form.resetFields();
          form.setFieldsValue({
            currency: 'INR',
            poDate: dayjs(),
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
        console.error('Error initializing PO form:', error);
        message.error(error.message || 'Failed to initialize PO form');
      }
    };

    loadData();
  }, [visible, isEditing, editingPOId, form]);

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

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      form.setFieldsValue({
        supplierName: supplier.name,
        supplierCode: supplier.code,
      });
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

  const populateForm = (po: PurchaseOrderDetail) => {
    setIsActive(po.isActive ?? true);
    form.setFieldsValue({
      poCode: po.poId,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      supplierCode: po.supplierCode,
      poDate: dayjs(po.poDate),
      expectedDeliveryDate: po.expectedDeliveryDate ? dayjs(po.expectedDeliveryDate) : undefined,
      currency: po.currency,
      notes: po.notes,
      locationId: po.locationId,
      shippingMethod: po.shippingMethod,
      isActive: po.isActive ?? true,
      items: po.items.map(item => ({
        productId: item.productId,
        itemCode: item.itemCode,
        description: item.description,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
        unitCost: item.unitCost,
      })),
    } as any);
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const buildPayload = (values: POFormValues): CreatePurchaseOrderRequest => {
    const items: PurchaseOrderItemInput[] = values.items.map(item => ({
      productId: item.productId,
      itemCode: item.itemCode,
      description: item.description,
      quantity: item.quantity,
      unitOfMeasure: item.unitOfMeasure,
      unitCost: item.unitCost,
    }));

    return {
      supplierId: values.supplierId,
      supplierName: values.supplierName,
      supplierCode: values.supplierCode || undefined,
      poDate: values.poDate.toISOString(),
      expectedDeliveryDate: values.expectedDeliveryDate
        ? values.expectedDeliveryDate.toISOString()
        : undefined,
      currency: values.currency || 'INR',
      notes: values.notes || undefined,
      locationId: values.locationId || undefined,
      shippingMethod: values.shippingMethod || undefined,
      items,
    };
  };

  const handleSubmit = async (values: POFormValues) => {
    try {
      setSubmitting(true);
      const payload = buildPayload(values);

      if (isEditing && editingPOId) {
        await purchaseOrderService.updatePurchaseOrder(editingPOId, payload);
        message.success('Purchase Order updated successfully');
      } else {
        await purchaseOrderService.createPurchaseOrder(payload);
        message.success('Purchase Order created successfully');
      }

      onSaved();
      handleClose();
    } catch (error: any) {
      console.error('Error saving PO:', error);
      message.error(error.message || 'Failed to save purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const drawerTitle = isEditing ? 'Edit Purchase Order' : 'Create Purchase Order';
  const submitLabel = isEditing ? 'Update PO' : 'Create PO';

  return (
    <Drawer
      title={
        <div className='drawer-header-with-switch'>
          <span className='po-drawer-title'>{drawerTitle}</span>
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
      className='purchase-order-drawer'
      styles={{ body: { padding: 0 } }}
      footer={null}
    >
      <div className='po-drawer-content'>
        <Form<POFormValues>
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          className='po-form'
        >
          <div className='po-form-content'>
            {/* Hidden isActive field */}
            <Form.Item name='isActive' valuePropName='checked' hidden>
              <Switch />
            </Form.Item>

            {/* PO Info */}
            <div className='po-section'>
              <div className='po-section-title'>Purchase Order Info</div>
              <Row gutter={[5, 10]}>
                <Col span={12}>
                  <Form.Item label='PO Code' name='poCode'>
                    <Input disabled placeholder='Auto-generated' />
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
                {/* Hidden fields for supplier name and code */}
                <Form.Item name='supplierName' hidden>
                  <Input />
                </Form.Item>
                <Form.Item name='supplierCode' hidden>
                  <Input />
                </Form.Item>
                <Col span={12}>
                  <Form.Item
                    label='PO Date'
                    name='poDate'
                    rules={[{ required: true, message: 'Please select PO date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Currency' name='currency'>
                    <Input maxLength={10} placeholder='INR' />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label='Notes' name='notes'>
                    <Input.TextArea rows={2} maxLength={1000} placeholder='Optional notes' />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label='Location' name='locationId'>
                    <Select
                      allowClear
                      placeholder='Select receiving location'
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
              </Row>
            </div>

            <Divider className='po-divider' />

            {/* Items */}
            <div className='po-section'>
              <div className='po-section-title'>Items</div>

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
                        <Row gutter={[5, 10]} className='po-item-row' align='top'>
                          <Col span={24}>
                            <Form.Item
                              {...field}
                              label={index === 0 ? 'Product' : ''}
                              name={[field.name, 'productId']}
                              fieldKey={[field.fieldKey!, 'productId']}
                            >
                              <Select
                                showSearch
                                placeholder='Search and select product (optional)'
                                loading={loadingProducts}
                                allowClear
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
                        <Row gutter={[5, 10]} className='po-item-row' align='top'>
                          <Col span={4}>
                            <Form.Item
                              {...field}
                              label={index === 0 ? 'Item Code' : ''}
                              name={[field.name, 'itemCode']}
                              fieldKey={[field.fieldKey!, 'itemCode']}
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
                              fieldKey={[field.fieldKey!, 'description']}
                            >
                              <Input maxLength={500} placeholder='Description (optional)' />
                            </Form.Item>
                          </Col>
                          <Col span={3}>
                            <Form.Item
                              {...field}
                              label={index === 0 ? 'Qty' : ''}
                              name={[field.name, 'quantity']}
                              fieldKey={[field.fieldKey!, 'quantity']}
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
                              fieldKey={[field.fieldKey!, 'unitOfMeasure']}
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
                              fieldKey={[field.fieldKey!, 'unitCost']}
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

            <Divider className='po-divider' />

            {/* Delivery Details */}
            <div className='po-section'>
              <div className='po-section-title'>Delivery Details</div>
              <Row gutter={[5, 10]}>
                <Col span={12}>
                  <Form.Item label='Expected Delivery Date' name='expectedDeliveryDate'>
                    <DatePicker style={{ width: '100%' }} placeholder='Select date' />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Shipping Method' name='shippingMethod'>
                    <Input maxLength={255} placeholder='e.g., Air, Sea, Road' />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <div className='po-actions'>
            <Button onClick={handleClose} className='po-cancel-btn'>
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
