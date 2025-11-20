import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, InputNumber, Button, Space, message } from 'antd';
import { qualityService } from '../../services/qualityService';
import './QualityDefectFormDrawer.scss';

const { TextArea } = Input;

interface QualityDefectFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QualityDefectFormDrawer: React.FC<QualityDefectFormDrawerProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      fetchCheckpoints();
    }
  }, [visible, form]);

  const fetchCheckpoints = async () => {
    try {
      const data = await qualityService.getCheckpoints();
      setCheckpoints(data);
    } catch (error: any) {
      message.error('Failed to fetch checkpoints');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data = {
        checkpointId: values.checkpointId,
        defectCategory: values.defectCategory,
        defectType: values.defectType,
        severity: values.severity,
        quantity: values.quantity,
        description: values.description,
      };

      await qualityService.createDefect(data);
      message.success('Quality defect reported successfully');
      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.message || 'Failed to report quality defect');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="Report Quality Defect"
      width={720}
      open={visible}
      onClose={onClose}
      styles={{
        footer: {
          textAlign: 'right',
        },
      }}
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Report
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        className="quality-defect-form"
      >
        <div className="form-section">
          <h3>Defect Information</h3>

          <Form.Item
            name="checkpointId"
            label="Quality Checkpoint"
            rules={[{ required: true, message: 'Please select checkpoint' }]}
          >
            <Select placeholder="Select checkpoint">
              {checkpoints.map(cp => (
                <Select.Option key={cp.id} value={cp.id}>
                  {cp.checkpointId} - {cp.checkpointName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="defectCategory"
            label="Defect Category"
            rules={[{ required: true, message: 'Please select defect category' }]}
          >
            <Select placeholder="Select defect category">
              <Select.Option value="FABRIC">Fabric</Select.Option>
              <Select.Option value="STITCHING">Stitching</Select.Option>
              <Select.Option value="COLOR">Color</Select.Option>
              <Select.Option value="MEASUREMENT">Measurement</Select.Option>
              <Select.Option value="PACKAGING">Packaging</Select.Option>
              <Select.Option value="FINISHING">Finishing</Select.Option>
              <Select.Option value="LABELING">Labeling</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="defectType"
            label="Defect Type"
            rules={[{ required: true, message: 'Please enter defect type' }]}
          >
            <Input placeholder="e.g., Thread breakage, Color mismatch" />
          </Form.Item>

          <Form.Item
            name="severity"
            label="Severity"
            rules={[{ required: true, message: 'Please select severity' }]}
          >
            <Select placeholder="Select severity">
              <Select.Option value="CRITICAL">Critical</Select.Option>
              <Select.Option value="MAJOR">Major</Select.Option>
              <Select.Option value="MINOR">Minor</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder="Enter defect quantity"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              rows={4}
              placeholder="Describe the defect in detail"
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};

export default QualityDefectFormDrawer;
