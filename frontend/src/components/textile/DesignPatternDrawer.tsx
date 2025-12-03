import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Switch, Button, Space, App, Row, Col, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { designPatternService, CreateDesignPatternData, DESIGN_CATEGORIES, DESIGN_STATUSES } from '../../services/textileService';

const { Option } = Select;
const { TextArea } = Input;

interface DesignPatternDrawerProps {
  visible: boolean;
  mode: 'create' | 'edit';
  designId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DesignPatternDrawer: React.FC<DesignPatternDrawerProps> = ({
  visible,
  mode,
  designId,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [colorInput, setColorInput] = useState('');
  const [colorPalette, setColorPalette] = useState<string[]>([]);

  useEffect(() => {
    if (visible && mode === 'edit' && designId) {
      fetchDesignDetails();
    } else if (visible && mode === 'create') {
      form.resetFields();
      setColorPalette([]);
      form.setFieldsValue({
        isActive: true,
        status: 'CONCEPT',
        colorPalette: [],
      });
    }
  }, [visible, mode, designId]);

  const fetchDesignDetails = async () => {
    if (!designId) return;
    
    try {
      const design = await designPatternService.getDesignPatternById(designId);
      setColorPalette(design.colorPalette || []);
      form.setFieldsValue({
        ...design,
        colorPalette: design.colorPalette || [],
      });
    } catch (error) {
      console.error('Error fetching design details:', error);
      message.error('Failed to load design details');
    }
  };

  const handleAddColor = () => {
    if (colorInput && !colorPalette.includes(colorInput)) {
      const newPalette = [...colorPalette, colorInput];
      setColorPalette(newPalette);
      form.setFieldsValue({ colorPalette: newPalette });
      setColorInput('');
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
    const newPalette = colorPalette.filter(c => c !== colorToRemove);
    setColorPalette(newPalette);
    form.setFieldsValue({ colorPalette: newPalette });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data: CreateDesignPatternData = {
        designName: values.designName,
        designCategory: values.designCategory,
        designerName: values.designerName,
        season: values.season,
        colorPalette: colorPalette,
        patternRepeat: values.patternRepeat,
        designFileUrl: values.designFileUrl,
        sampleImageUrl: values.sampleImageUrl,
        status: values.status,
        notes: values.notes,
        isActive: values.isActive,
      };

      if (mode === 'create') {
        await designPatternService.createDesignPattern(data);
        message.success('Design pattern created successfully');
      } else if (designId) {
        await designPatternService.updateDesignPattern(designId, data);
        message.success('Design pattern updated successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving design:', error);
      message.error('Failed to save design pattern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={mode === 'create' ? 'Add Design Pattern' : 'Edit Design Pattern'}
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
          status: 'CONCEPT',
          colorPalette: [],
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="designName"
              label="Design Name"
              rules={[{ required: true, message: 'Please enter design name' }]}
            >
              <Input placeholder="Enter design name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="designCategory"
              label="Category"
              rules={[{ required: true, message: 'Please select category' }]}
            >
              <Select placeholder="Select category">
                {DESIGN_CATEGORIES.map(cat => (
                  <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="designerName" label="Designer Name">
              <Input placeholder="Enter designer name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="season" label="Season">
              <Input placeholder="e.g., Spring 2024, Fall/Winter 2024" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                {DESIGN_STATUSES.map(status => (
                  <Option key={status.value} value={status.value}>{status.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="patternRepeat" label="Pattern Repeat">
              <Input placeholder="e.g., 12cm x 12cm" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Color Palette">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Input
                placeholder="Enter color (hex or name)"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onPressEnter={handleAddColor}
                style={{ width: 200 }}
              />
              <Button icon={<PlusOutlined />} onClick={handleAddColor}>
                Add Color
              </Button>
            </Space>
            <div style={{ marginTop: 8 }}>
              {colorPalette.map((color, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => handleRemoveColor(color)}
                  style={{ marginBottom: 4 }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      backgroundColor: color,
                      marginRight: 4,
                      borderRadius: 2,
                      border: '1px solid #d9d9d9',
                    }}
                  />
                  {color}
                </Tag>
              ))}
            </div>
          </Space>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="designFileUrl" label="Design File URL">
              <Input placeholder="Enter design file URL" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="sampleImageUrl" label="Sample Image URL">
              <Input placeholder="Enter sample image URL" />
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

export default DesignPatternDrawer;
