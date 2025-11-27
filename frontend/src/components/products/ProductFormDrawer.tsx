import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Row,
  Col,
  Switch,
  Upload,
  Avatar,
} from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { GradientButton } from '../ui';
import { productService, CreateProductRequest, ProductDetail } from '../../services/productService';
import './ProductFormDrawer.scss';

const { Option } = Select;
const { TextArea } = Input;

// UOM (Unit of Measure) options for textile manufacturing
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

interface ProductFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode?: 'create' | 'edit';
  editingProductId?: string | null;
  categories: any[];
}

interface ProductFormValues {
  productCode?: string;
  name: string;
  description?: string;
  productType: string;
  material?: string;
  color?: string;
  size?: string;
  weight?: number;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity?: number;
  reorderLevel?: number;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
}

export const ProductFormDrawer: React.FC<ProductFormDrawerProps> = ({
  visible,
  onClose,
  onSaved,
  mode = 'create',
  editingProductId,
}) => {
  const [form] = Form.useForm<ProductFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const isEditing = mode === 'edit' && !!editingProductId;

  useEffect(() => {
    if (!visible) return;

    const loadData = async () => {
      try {
        if (isEditing && editingProductId) {
          const product = await productService.getProductById(editingProductId);
          populateForm(product);
        } else {
          // Reset form with default values for create mode
          form.resetFields();
          // Set default values AFTER reset to ensure they stick
          form.setFieldsValue({
            unitOfMeasure: 'PCS',
            productType: 'OWN_MANUFACTURE',
            isActive: true, // Default to active in create mode
            stockQuantity: 0,
          });
          setIsActive(true);
          setImageUrl('');
        }
      } catch (error: any) {
        console.error('Error loading product:', error);
        message.error(error.message || 'Failed to load product');
      }
    };

    loadData();
  }, [visible, isEditing, editingProductId]);


  const populateForm = (product: ProductDetail) => {
    form.setFieldsValue({
      productCode: product.productCode,
      name: product.name,
      description: product.description,
      productType: product.productType,
      material: product.material,
      color: product.color,
      size: product.size,
      weight: product.weight,
      unitOfMeasure: product.unitOfMeasure,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
      barcode: product.barcode,
      isActive: product.isActive,
    });
    setIsActive(product.isActive);
    if (product.imageUrl) {
      setImageUrl(product.imageUrl);
    }
  };

  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
      return false;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = e => {
      setImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    return false; // Prevent automatic upload
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload: CreateProductRequest = {
        productCode: values.productCode,
        name: values.name,
        description: values.description,
        productType: values.productType,
        material: values.material,
        color: values.color,
        size: values.size,
        weight: values.weight,
        unitOfMeasure: values.unitOfMeasure,
        costPrice: values.costPrice,
        sellingPrice: values.sellingPrice,
        stockQuantity: values.stockQuantity,
        reorderLevel: values.reorderLevel,
        barcode: values.barcode,
        imageUrl: imageUrl || undefined,
        isActive: values.isActive,
      };

      if (isEditing && editingProductId) {
        await productService.updateProduct(editingProductId, payload);
        message.success('Product updated successfully');
      } else {
        await productService.createProduct(payload);
        message.success('Product created successfully');
      }

      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.message || 'Failed to save product');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setImageUrl('');
    onClose();
  };

  return (
    <Drawer
      title={
        <div className='drawer-header-with-switch'>
          <span>{isEditing ? 'Edit Product' : 'Create Product'}</span>
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
      open={visible}
      onClose={handleCancel}
      footer={
        <div className='drawer-footer'>
          <Button onClick={handleCancel} disabled={submitting} size='middle'>
            Cancel
          </Button>
          <GradientButton onClick={handleSubmit} loading={submitting} size='middle'>
            {isEditing ? 'Update Product' : 'Create Product'}
          </GradientButton>
        </div>
      }
    >
      <Form
        form={form}
        layout='vertical'
        className='product-form'
        onValuesChange={(_, allValues) => {
          if (allValues.isActive !== undefined) {
            setIsActive(allValues.isActive);
          }
        }}
      >
        <Form.Item name='isActive' valuePropName='checked' hidden>
          <Switch />
        </Form.Item>
        {/* Section 1: Basic Information with Image */}
        <div className='form-section'>
          <h3 className='section-title'>Basic Information</h3>

          {/* Image Upload */}
          <Col span={24}>
            <Upload
              name='avatar'
              listType='picture-circle'
              className='product-image-upload'
              showUploadList={false}
              beforeUpload={beforeUpload}
            >
              {imageUrl ? (
                <Avatar src={imageUrl} size={120} className='product-avatar' />
              ) : (
                <span className='product-upload-icon'>
                  <AppstoreOutlined />
                </span>
              )}
            </Upload>
            <div className='product-image-help-text'>
              Upload Product Image (JPG/PNG, max 2MB)
              <br />
              Drag & drop or click to upload
            </div>
          </Col>

          <Row gutter={12}>
            <Col span={24}>
              <Form.Item
                name='name'
                label='Product Name'
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input placeholder='Enter product name' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name='productCode' label='Product Code'>
                <Input placeholder='Auto generated' disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='barcode' label='Barcode/SKU'>
                <Input placeholder='Enter barcode or SKU' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={24}>
              <Form.Item name='description' label='Description'>
                <TextArea rows={3} placeholder='Enter product description' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={24}>
              <Form.Item
                name='productType'
                label='Product Type'
                rules={[{ required: true, message: 'Please select product type' }]}
              >
                <Select placeholder='Select product type'>
                  <Option value='OWN_MANUFACTURE'>Own Manufacture</Option>
                  <Option value='VENDOR_SUPPLIED'>Vendor Supplied</Option>
                  <Option value='OUTSOURCED'>Outsourced</Option>
                  <Option value='RAW_MATERIAL'>Raw Material</Option>
                  <Option value='FINISHED_GOODS'>Finished Goods</Option>
                  <Option value='SEMI_FINISHED'>Semi-Finished</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 2: Pricing */}
        <div className='form-section'>
          <h3 className='section-title'>Pricing</h3>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name='costPrice'
                label='Cost Price'
                rules={[{ required: true, message: 'Please enter cost price' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder='0.00'
                  prefix='₹'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='sellingPrice'
                label='Selling Price'
                rules={[{ required: true, message: 'Please enter selling price' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder='0.00'
                  prefix='₹'
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 3: Inventory */}
        <div className='form-section'>
          <h3 className='section-title'>Inventory</h3>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name='stockQuantity' label='Stock Quantity'>
                <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder='0' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='unitOfMeasure' label='Unit of Measure'>
                <Select placeholder='Select UOM' showSearch>
                  {UOM_OPTIONS.map(uom => (
                    <Option key={uom.value} value={uom.value}>
                      {uom.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name='reorderLevel' label='Reorder Level'>
                <InputNumber
                  min={0}
                  precision={0}
                  style={{ width: '100%' }}
                  placeholder='Minimum stock level'
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 4: Specifications */}
        <div className='form-section'>
          <h3 className='section-title'>Specifications</h3>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name='material' label='Material'>
                <Input placeholder='e.g., Cotton, Polyester' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='color' label='Color'>
                <Input placeholder='e.g., White, Blue' />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name='size' label='Size'>
                <Input placeholder='e.g., 60 inches width' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='weight' label='Weight (kg)'>
                <InputNumber min={0} precision={3} style={{ width: '100%' }} placeholder='0.000' />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Drawer>
  );
};
