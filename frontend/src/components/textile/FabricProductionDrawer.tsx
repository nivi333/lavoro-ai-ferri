import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Switch,
  message,
  Card,
} from 'antd';
import dayjs from 'dayjs';
import {
  fabricProductionService,
  FabricProduction,
  CreateFabricProductionData,
  FABRIC_TYPES,
  QUALITY_GRADES,
} from '../../services/textileService';

const { Option } = Select;
const { TextArea } = Input;

interface FabricProductionDrawerProps {
  visible: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  fabric?: FabricProduction | null;
}

const FabricProductionDrawer: React.FC<FabricProductionDrawerProps> = ({
  visible,
  onClose,
  fabric,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEditing = !!fabric;

  useEffect(() => {
    if (visible) {
      if (fabric) {
        // Populate form with existing fabric data
        form.setFieldsValue({
          ...fabric,
          productionDate: dayjs(fabric.productionDate),
          isActive: fabric.isActive,
        });
      } else {
        // Reset form for new fabric
        form.resetFields();
        form.setFieldsValue({
          isActive: true,
          productionDate: dayjs(),
        });
      }
    }
  }, [visible, fabric, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const fabricData: CreateFabricProductionData = {
        ...values,
        productionDate: values.productionDate.toISOString(),
        weightGsm: Number(values.weightGsm),
        widthInches: Number(values.widthInches),
        quantityMeters: Number(values.quantityMeters),
      };

      if (isEditing && fabric) {
        await fabricProductionService.updateFabricProduction(fabric.fabricId, fabricData);
        message.success('Fabric production updated successfully');
      } else {
        await fabricProductionService.createFabricProduction(fabricData);
        message.success('Fabric production created successfully');
      }

      onClose(true);
    } catch (error) {
      console.error('Error saving fabric production:', error);
      message.error('Failed to save fabric production');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const title = (
    <div className="drawer-header-with-switch">
      <span>{isEditing ? 'Edit Fabric Production' : 'Create Fabric Production'}</span>
      <div className="header-switch">
        <span className="switch-label">Active</span>
        <Form.Item name="isActive" valuePropName="checked" noStyle>
          <Switch disabled={!isEditing} />
        </Form.Item>
      </div>
    </div>
  );

  return (
    <Drawer
      title={title}
      width={720}
      open={visible}
      onClose={handleClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        {/* Basic Information */}
        <Card title="📋 Basic Information" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fabricName"
                label="Fabric Name"
                rules={[{ required: true, message: 'Please enter fabric name' }]}
              >
                <Input placeholder="Enter fabric name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fabricType"
                label="Fabric Type"
                rules={[{ required: true, message: 'Please select fabric type' }]}
              >
                <Select placeholder="Select fabric type">
                  {FABRIC_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="composition"
                label="Composition"
                rules={[{ required: true, message: 'Please enter composition' }]}
              >
                <Input placeholder="e.g., 100% Cotton, 60% Cotton 40% Polyester" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="weightGsm"
                label="Weight (GSM)"
                rules={[{ required: true, message: 'Please enter weight' }]}
              >
                <InputNumber
                  placeholder="Enter weight in GSM"
                  min={0}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="widthInches"
                label="Width (inches)"
                rules={[{ required: true, message: 'Please enter width' }]}
              >
                <InputNumber
                  placeholder="Enter width in inches"
                  min={0}
                  step={0.1}
                  style={{ width: '100%' }}
                />
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
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pattern" label="Pattern">
                <Input placeholder="Enter pattern (optional)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="finishType" label="Finish Type">
                <Input placeholder="Enter finish type (optional)" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Production Details */}
        <Card title="🏭 Production Details" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantityMeters"
                label="Quantity (Meters)"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber
                  placeholder="Enter quantity in meters"
                  min={0}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="productionDate"
                label="Production Date"
                rules={[{ required: true, message: 'Please select production date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="batchNumber"
                label="Batch Number"
                rules={[{ required: true, message: 'Please enter batch number' }]}
              >
                <Input placeholder="Enter batch number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="qualityGrade"
                label="Quality Grade"
                rules={[{ required: true, message: 'Please select quality grade' }]}
              >
                <Select placeholder="Select quality grade">
                  {QUALITY_GRADES.map(grade => (
                    <Option key={grade.value} value={grade.value}>
                      {grade.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Additional Information */}
        <Card title="📝 Additional Information">
          <Form.Item name="notes" label="Notes">
            <TextArea
              rows={4}
              placeholder="Enter any additional notes or comments..."
            />
          </Form.Item>
        </Card>
      </Form>
    </Drawer>
  );
};

export default FabricProductionDrawer;
