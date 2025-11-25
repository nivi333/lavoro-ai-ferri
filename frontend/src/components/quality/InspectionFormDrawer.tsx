import React, { useCallback, useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Divider,
  Select,
  message,
  DatePicker,
  Switch,
} from 'antd';
import dayjs from 'dayjs';
import { inspectionService, Inspection, InspectionDetail } from '../../services/inspectionService';
import { GradientButton } from '../ui';

const { TextArea } = Input;
const { Option } = Select;

interface InspectionFormDrawerProps {
  visible: boolean;
  inspection?: Inspection | InspectionDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

const InspectionFormDrawer: React.FC<InspectionFormDrawerProps> = ({
  visible,
  inspection,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const resetFormState = useCallback(() => {
    form.resetFields();
  }, [form]);

  const handleDrawerClose = () => {
    resetFormState();
    onClose();
  };

  useEffect(() => {
    if (visible && !inspection) {
      form.resetFields();
      // Set default values for new inspection
      form.setFieldsValue({
        isActive: true, // Default to active for new inspections
      });
    } else if (visible && inspection) {
      const inspectionDetail = inspection as InspectionDetail;
      form.setFieldsValue({
        inspectionType: inspection.inspectionType,
        referenceType: inspection.referenceType,
        referenceId: inspection.referenceId,
        inspectorName: inspection.inspectorName || (inspection.inspector?.firstName + ' ' + inspection.inspector?.lastName) || '',
        inspectionDate: dayjs(inspection.inspectionDate || inspection.scheduledDate),
        nextInspectionDate: (inspection as any).nextInspectionDate ? dayjs((inspection as any).nextInspectionDate) : null,
        status: inspection.status,
        qualityScore: inspection.qualityScore,
        inspectorNotes: inspectionDetail.inspectorNotes,
        recommendations: inspectionDetail.recommendations,
        isActive: (inspection as any).isActive !== undefined ? (inspection as any).isActive : true,
      });
    }
  }, [visible, inspection, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        inspectionType: values.inspectionType,
        referenceType: values.referenceType,
        referenceId: values.referenceId,
        inspectorName: values.inspectorName,
        inspectionDate: values.inspectionDate.toISOString(),
        nextInspectionDate: values.nextInspectionDate ? values.nextInspectionDate.toISOString() : null,
        status: values.status,
        qualityScore: values.qualityScore,
        inspectorNotes: values.inspectorNotes,
        recommendations: values.recommendations,
        isActive: values.isActive !== undefined ? values.isActive : true,
      };

      if (inspection) {
        await inspectionService.updateInspection(inspection.id, payload);
        message.success('Inspection updated successfully');
      } else {
        await inspectionService.createInspection(payload);
        message.success('Inspection created successfully');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving inspection:', error);
      message.error(error.message || 'Failed to save inspection');
    } finally {
      setLoading(false);
    }
  };

  const submitLabel = inspection ? 'Update Inspection' : 'Create Inspection';

  return (
    <Drawer
      title={
        <div className='drawer-header-with-switch'>
          <span>{inspection ? 'Edit Inspection' : 'Create Inspection'}</span>
          <div className='header-switch'>
            <span className='switch-label'>Active</span>
            <Form.Item name='isActive' valuePropName='checked' noStyle>
              <Switch disabled={!inspection} />
            </Form.Item>
          </div>
        </div>
      }
      placement='right'
      onClose={handleDrawerClose}
      open={visible}
      width={720}
      styles={{ body: { padding: 0 } }}
    >
      <div className='ifd-content'>
        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          className='ifd-form'
        >
          <div className='ifd-form-content'>
            {/* Section 1: Basic Information */}
            <div className='ifd-section'>
              <div className='ifd-section-title'>Basic Information</div>

              <Form.Item
                label='Inspection Code'
                help={inspection ? undefined : 'Inspection code will be auto-generated (e.g., INS001)'}
              >
                <Input 
                  value={inspection?.inspectionNumber} 
                  disabled 
                  placeholder='Auto-generated'
                  className='ifd-input'
                />
              </Form.Item>

              <Form.Item
                name='inspectionType'
                label='Inspection Type'
                rules={[{ required: true, message: 'Please select inspection type' }]}
              >
                <Select placeholder='Select inspection type' className='ifd-select'>
                  <Option value='INCOMING_MATERIAL'>Incoming Material</Option>
                  <Option value='IN_PROCESS'>In Process</Option>
                  <Option value='FINAL_PRODUCT'>Final Product</Option>
                  <Option value='RANDOM_CHECK'>Random Check</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name='status'
                label='Status'
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder='Select status' className='ifd-select'>
                  <Option value='PENDING'>Pending</Option>
                  <Option value='IN_PROGRESS'>In Progress</Option>
                  <Option value='PASSED'>Passed</Option>
                  <Option value='FAILED'>Failed</Option>
                  <Option value='CONDITIONAL'>Conditional</Option>
                </Select>
              </Form.Item>
            </div>

            <Divider className='ifd-divider' />

            {/* Section 2: Reference Information */}
            <div className='ifd-section'>
              <div className='ifd-section-title'>Reference Information</div>

              <Form.Item
                name='referenceType'
                label='Reference Type'
                rules={[{ required: true, message: 'Please select reference type' }]}
              >
                <Select placeholder='Select reference type' className='ifd-select'>
                  <Option value='PRODUCT'>Product</Option>
                  <Option value='ORDER'>Order</Option>
                  <Option value='BATCH'>Batch</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name='referenceId'
                label='Reference ID'
                rules={[{ required: true, message: 'Please enter reference ID' }]}
              >
                <Input placeholder='Enter reference ID' className='ifd-input' />
              </Form.Item>
            </div>

            <Divider className='ifd-divider' />

            {/* Section 3: Inspector & Schedule */}
            <div className='ifd-section'>
              <div className='ifd-section-title'>Inspector & Schedule</div>

              <Form.Item
                name='inspectorName'
                label='Inspector Name'
                rules={[{ required: true, message: 'Please enter inspector name' }]}
              >
                <Input 
                  placeholder='Enter inspector name' 
                  className='ifd-input'
                />
              </Form.Item>

              <Form.Item
                name='inspectionDate'
                label='Inspection Date'
                rules={[{ required: true, message: 'Please select inspection date' }]}
              >
                <DatePicker 
                  placeholder='Select inspection date' 
                  className='ifd-input' 
                  style={{ width: '100%' }} 
                  format='DD MMM YYYY'
                />
              </Form.Item>

              <Form.Item
                name='nextInspectionDate'
                label='Next Inspection Date'
              >
                <DatePicker 
                  placeholder='Select next inspection date' 
                  className='ifd-input' 
                  style={{ width: '100%' }} 
                  format='DD MMM YYYY'
                />
              </Form.Item>
            </div>

            <Divider className='ifd-divider' />

            {/* Section 4: Quality Assessment */}
            <div className='ifd-section'>
              <div className='ifd-section-title'>Quality Assessment</div>

              <Form.Item
                name='qualityScore'
                label='Quality Score (%)'
                rules={[
                  {
                    pattern: /^(100|[1-9]?[0-9])$/,
                    message: 'Please enter a valid score between 0 and 100',
                  },
                ]}
              >
                <Input
                  type='number'
                  placeholder='Enter quality score (0-100)'
                  min={0}
                  max={100}
                  className='ifd-input'
                />
              </Form.Item>

              <Form.Item name='inspectorNotes' label='Inspector Notes'>
                <TextArea
                  placeholder='Enter inspector notes'
                  rows={3}
                  maxLength={1000}
                  className='ifd-input'
                />
              </Form.Item>

              <Form.Item name='recommendations' label='Recommendations'>
                <TextArea
                  placeholder='Enter recommendations'
                  rows={3}
                  maxLength={1000}
                  className='ifd-input'
                />
              </Form.Item>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='ifd-actions'>
            <Button onClick={handleDrawerClose} className='ifd-cancel-btn'>
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

export default InspectionFormDrawer;
