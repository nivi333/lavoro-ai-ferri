import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, DatePicker, InputNumber, Switch, Button, Space, App, Row, Col } from 'antd';
import { garmentManufacturingService, CreateGarmentManufacturingData, GARMENT_TYPES, PRODUCTION_STAGES } from '../../services/textileService';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface GarmentManufacturingDrawerProps {
  visible: boolean;
  mode: 'create' | 'edit';
  garmentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const GarmentManufacturingDrawer: React.FC<GarmentManufacturingDrawerProps> = ({
  visible,
  mode,
  garmentId,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && mode === 'edit' && garmentId) {
      fetchGarmentDetails();
    } else if (visible && mode === 'create') {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
        qualityPassed: false,
        defectCount: 0,
        productionStage: 'CUTTING',
      });
    }
  }, [visible, mode, garmentId]);

  const fetchGarmentDetails = async () => {
    if (!garmentId) return;
    
    setLoading(true);
    try {
      const garment = await garmentManufacturingService.getGarmentManufacturingById(garmentId);
      form.setFieldsValue({
        ...garment,
        cutDate: garment.cutDate ? dayjs(garment.cutDate) : undefined,
        sewDate: garment.sewDate ? dayjs(garment.sewDate) : undefined,
        finishDate: garment.finishDate ? dayjs(garment.finishDate) : undefined,
        packDate: garment.packDate ? dayjs(garment.packDate) : undefined,
      });
    } catch (error) {
      console.error('Error fetching garment details:', error);
      message.error('Failed to load garment details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data: CreateGarmentManufacturingData = {
        garmentType: values.garmentType,
        styleNumber: values.styleNumber,
        size: values.size,
        color: values.color,
        fabricId: values.fabricId,
        quantity: values.quantity,
        productionStage: values.productionStage,
        cutDate: values.cutDate?.toISOString(),
        sewDate: values.sewDate?.toISOString(),
        finishDate: values.finishDate?.toISOString(),
        packDate: values.packDate?.toISOString(),
        operatorName: values.operatorName,
        lineNumber: values.lineNumber,
        qualityPassed: values.qualityPassed,
        defectCount: values.defectCount,
        locationId: values.locationId,
        notes: values.notes,
        isActive: values.isActive,
      };

      if (mode === 'create') {
        await garmentManufacturingService.createGarmentManufacturing(data);
        message.success('Garment record created successfully');
      } else if (garmentId) {
        await garmentManufacturingService.updateGarmentManufacturing(garmentId, data);
        message.success('Garment record updated successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving garment:', error);
      message.error('Failed to save garment record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={mode === 'create' ? 'Add Garment Record' : 'Edit Garment Record'}
      width={720}
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          <span>Active</span>
          <Form.Item name="isActive" valuePropName="checked" noStyle>
            <Switch disabled={mode === 'create'} />
          </Form.Item>
        </Space>
      }
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" loading={loading} onClick={() => form.submit()}>
              {mode === 'create' ? 'Create' : 'Update'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          isActive: true,
          qualityPassed: false,
          defectCount: 0,
          productionStage: 'CUTTING',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="garmentType"
              label="Garment Type"
              rules={[{ required: true, message: 'Please select garment type' }]}
            >
              <Select placeholder="Select garment type">
                {GARMENT_TYPES.map(type => (
                  <Option key={type.value} value={type.value}>{type.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="styleNumber"
              label="Style Number"
              rules={[{ required: true, message: 'Please enter style number' }]}
            >
              <Input placeholder="Enter style number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="size"
              label="Size"
              rules={[{ required: true, message: 'Please enter size' }]}
            >
              <Input placeholder="e.g., S, M, L, XL" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="color"
              label="Color"
              rules={[{ required: true, message: 'Please enter color' }]}
            >
              <Input placeholder="Enter color" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter quantity" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="productionStage"
              label="Production Stage"
              rules={[{ required: true, message: 'Please select production stage' }]}
            >
              <Select placeholder="Select production stage">
                {PRODUCTION_STAGES.map(stage => (
                  <Option key={stage.value} value={stage.value}>{stage.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="lineNumber" label="Line Number">
              <Input placeholder="Enter production line number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="operatorName" label="Operator Name">
              <Input placeholder="Enter operator name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="fabricId" label="Fabric ID">
              <Input placeholder="Enter fabric ID (optional)" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="cutDate" label="Cut Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="sewDate" label="Sew Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="finishDate" label="Finish Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="packDate" label="Pack Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="qualityPassed" label="Quality Passed" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="defectCount" label="Defect Count">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="notes" label="Notes">
          <TextArea rows={3} placeholder="Enter any additional notes" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default GarmentManufacturingDrawer;
