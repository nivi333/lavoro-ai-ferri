import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Switch, Button, App, Row, Col, Tag, Divider } from 'antd';
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import {
  designPatternService,
  CreateDesignPatternData,
  DESIGN_CATEGORIES,
  DESIGN_STATUSES,
} from '../../services/textileService';
import { GradientButton, ImageUpload } from '../ui';
import '../CompanyCreationDrawer.scss';

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
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [colorInput, setColorInput] = useState('');
  const [colorPalette, setColorPalette] = useState<string[]>([]);

  const isEditing = mode === 'edit';

  useEffect(() => {
    if (visible && mode === 'edit' && designId) {
      fetchDesignDetails();
    } else if (visible && mode === 'create') {
      form.resetFields();
      setColorPalette([]);
      setImageUrl('');
      setIsActive(true);
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
      setIsActive(design.isActive ?? true);
      setImageUrl(design.sampleImageUrl || '');
      form.setFieldsValue({
        ...design,
      });
    } catch (error) {
      console.error('Error fetching design details:', error);
      message.error('Failed to load design details');
    }
  };

  const handleClose = () => {
    form.resetFields();
    setColorPalette([]);
    setImageUrl('');
    setIsActive(true);
    onClose();
  };

  const handleAddColor = () => {
    if (colorInput && !colorPalette.includes(colorInput)) {
      const newPalette = [...colorPalette, colorInput];
      setColorPalette(newPalette);
      form.setFieldsValue({ colorPalette: newPalette });
      setColorInput('');
    }
  };

  const handleRemoveColor = (color: string) => {
    const newPalette = colorPalette.filter(c => c !== color);
    setColorPalette(newPalette);
    form.setFieldsValue({ colorPalette: newPalette });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data: CreateDesignPatternData = {
        designName: values.designName,
        designCategory: values.designCategory,
        colorPalette: colorPalette,
        season: values.season,
        status: values.status,
        designerName: values.designerName,
        sampleImageUrl: imageUrl || undefined,
        notes: values.notes,
        isActive,
      };

      if (mode === 'create') {
        await designPatternService.createDesignPattern(data);
        message.success('Design pattern created successfully');
      } else if (designId) {
        await designPatternService.updateDesignPattern(designId, data);
        message.success('Design pattern updated successfully');
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving design:', error);
      message.error('Failed to save design pattern');
    } finally {
      setLoading(false);
    }
  };

  const drawerTitle = isEditing ? 'Edit Design Pattern' : 'Create Design Pattern';
  const submitLabel = isEditing ? 'Save Changes' : 'Create';

  return (
    <Drawer
      title={
        <div className='drawer-header-with-switch'>
          <span className='ccd-title'>{drawerTitle}</span>
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
      onClose={handleClose}
      open={visible}
      className='company-creation-drawer'
      styles={{ body: { padding: 0 } }}
      footer={null}
    >
      <div className='ccd-content'>
        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          initialValues={{
            isActive: true,
            status: 'CONCEPT',
            colorPalette: [],
          }}
          className='ccd-form'
        >
          <Form.Item name='isActive' valuePropName='checked' hidden>
            <Switch />
          </Form.Item>
          <div className='ccd-form-content'>
            {/* Section 1: Basic Information */}
            <div className='ccd-section'>
              <div className='ccd-section-header'>
                <div className='ccd-section-title'>Basic Information</div>
              </div>
              <Col span={24}>
                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  icon={<AppstoreOutlined />}
                  helpText='Upload Design Image (PNG/JPG/SVG, max 2MB)'
                />
              </Col>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Design Name'
                    name='designName'
                    rules={[{ required: true, message: 'Please enter design name' }]}
                  >
                    <Input
                      maxLength={64}
                      autoComplete='off'
                      placeholder='Enter design name'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label='Category'
                    name='designCategory'
                    rules={[{ required: true, message: 'Please select category' }]}
                  >
                    <Select placeholder='Select category' className='ccd-select'>
                      {DESIGN_CATEGORIES.map(cat => (
                        <Option key={cat.value} value={cat.value}>
                          {cat.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label='Status'
                    name='status'
                    rules={[{ required: true, message: 'Please select status' }]}
                  >
                    <Select placeholder='Select status' className='ccd-select'>
                      {DESIGN_STATUSES.map(status => (
                        <Option key={status.value} value={status.value}>
                          {status.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Designer Name' name='designerName'>
                    <Input
                      maxLength={64}
                      autoComplete='off'
                      placeholder='Enter designer name'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='ccd-divider' />

            {/* Section 2: Design Details */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Design Details</div>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Season' name='season'>
                    <Input
                      maxLength={32}
                      autoComplete='off'
                      placeholder='e.g., Spring/Summer 2024'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Pattern Repeat' name='patternRepeat'>
                    <Input
                      maxLength={64}
                      autoComplete='off'
                      placeholder='e.g., 12cm x 12cm'
                      className='ccd-input'
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item label='Color Palette' name='colorPalette'>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <Input
                        value={colorInput}
                        onChange={e => setColorInput(e.target.value)}
                        placeholder='Enter color name'
                        className='ccd-input'
                        style={{ flex: 1 }}
                        onPressEnter={e => {
                          e.preventDefault();
                          handleAddColor();
                        }}
                      />
                      <Button icon={<PlusOutlined />} onClick={handleAddColor}>
                        Add
                      </Button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {colorPalette.map(color => (
                        <Tag key={color} closable onClose={() => handleRemoveColor(color)}>
                          {color}
                        </Tag>
                      ))}
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider className='ccd-divider' />

            {/* Section 3: Additional Information */}
            <div className='ccd-section'>
              <div className='ccd-section-title'>Additional Information</div>
              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item label='Notes' name='notes'>
                    <TextArea
                      rows={3}
                      maxLength={500}
                      autoComplete='off'
                      placeholder='Enter any additional notes...'
                      className='ccd-textarea'
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <div className='ccd-actions'>
            <Button onClick={handleClose} className='ccd-cancel-btn'>
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

export default DesignPatternDrawer;
