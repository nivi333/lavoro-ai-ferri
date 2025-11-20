import React, { useEffect } from 'react';
import { Drawer, Form, Input, Select, DatePicker, InputNumber, Button, Space, message } from 'antd';
import dayjs from 'dayjs';
import { qualityService } from '../../services/qualityService';
import './QualityCheckpointFormDrawer.scss';

const { TextArea } = Input;

interface QualityCheckpointFormDrawerProps {
  visible: boolean;
  checkpoint: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const QualityCheckpointFormDrawer: React.FC<QualityCheckpointFormDrawerProps> = ({
  visible,
  checkpoint,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (visible && checkpoint) {
      form.setFieldsValue({
        checkpointName: checkpoint.checkpointName,
        checkpointType: checkpoint.checkpointType,
        inspectorName: checkpoint.inspectorName,
        inspectionDate: checkpoint.inspectionDate ? dayjs(checkpoint.inspectionDate) : null,
        status: checkpoint.status,
        overallScore: checkpoint.overallScore,
        notes: checkpoint.notes,
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, checkpoint, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data = {
        checkpointName: values.checkpointName,
        checkpointType: values.checkpointType,
        inspectorName: values.inspectorName,
        inspectionDate: values.inspectionDate.toISOString(),
        overallScore: values.overallScore,
        notes: values.notes,
        ...(checkpoint && { status: values.status }),
      };

      if (checkpoint) {
        await qualityService.updateCheckpoint(checkpoint.id, data);
        message.success('Quality checkpoint updated successfully');
      } else {
        await qualityService.createCheckpoint(data);
        message.success('Quality checkpoint created successfully');
      }

      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.message || 'Failed to save quality checkpoint');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={checkpoint ? 'Edit Quality Checkpoint' : 'Create Quality Checkpoint'}
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
            {checkpoint ? 'Update' : 'Create'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        className="quality-checkpoint-form"
      >
        <div className="form-section">
          <h3>Checkpoint Information</h3>

          <Form.Item
            name="checkpointName"
            label="Checkpoint Name"
            rules={[{ required: true, message: 'Please enter checkpoint name' }]}
          >
            <Input placeholder="Enter checkpoint name" />
          </Form.Item>

          <Form.Item
            name="checkpointType"
            label="Checkpoint Type"
            rules={[{ required: true, message: 'Please select checkpoint type' }]}
          >
            <Select placeholder="Select checkpoint type">
              <Select.Option value="INCOMING_MATERIAL">Incoming Material</Select.Option>
              <Select.Option value="IN_PROCESS">In Process</Select.Option>
              <Select.Option value="FINAL_INSPECTION">Final Inspection</Select.Option>
              <Select.Option value="PACKAGING">Packaging</Select.Option>
              <Select.Option value="RANDOM_SAMPLING">Random Sampling</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="inspectorName"
            label="Inspector Name"
            rules={[{ required: true, message: 'Please enter inspector name' }]}
          >
            <Input placeholder="Enter inspector name" />
          </Form.Item>

          <Form.Item
            name="inspectionDate"
            label="Inspection Date"
            rules={[{ required: true, message: 'Please select inspection date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
          </Form.Item>

          {checkpoint && (
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                <Select.Option value="PENDING">Pending</Select.Option>
                <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
                <Select.Option value="PASSED">Passed</Select.Option>
                <Select.Option value="FAILED">Failed</Select.Option>
                <Select.Option value="CONDITIONAL_PASS">Conditional Pass</Select.Option>
                <Select.Option value="REWORK_REQUIRED">Rework Required</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="overallScore"
            label="Overall Score (%)"
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              placeholder="Enter overall score"
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea
              rows={4}
              placeholder="Enter any additional notes"
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};

export default QualityCheckpointFormDrawer;
