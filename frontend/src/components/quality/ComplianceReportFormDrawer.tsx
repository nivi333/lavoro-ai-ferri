import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, DatePicker, Button, message, Upload, Switch } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { qualityService } from '../../services/qualityService';
import { GradientButton } from '../ui';
import './ComplianceReportFormDrawer.scss';

const { TextArea } = Input;

interface ComplianceReportFormDrawerProps {
  visible: boolean;
  report: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ComplianceReportFormDrawer: React.FC<ComplianceReportFormDrawerProps> = ({
  visible,
  report,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string>('');

  const isEditing = !!report;

  useEffect(() => {
    if (visible && report) {
      form.setFieldsValue({
        reportType: report.reportType,
        reportDate: report.reportDate ? dayjs(report.reportDate) : null,
        auditorName: report.auditorName,
        certification: report.certification,
        validityPeriod: report.validityPeriod,
        status: report.status,
        findings: report.findings,
        recommendations: report.recommendations,
        isActive: report.isActive !== undefined ? report.isActive : true,
      });
      if (report.documentUrl) {
        setDocumentUrl(report.documentUrl);
      }
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({
        reportDate: dayjs(),
        status: 'PENDING_REVIEW',
        isActive: true,
      });
      setDocumentUrl('');
    }
  }, [visible, report, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data = {
        reportType: values.reportType,
        reportDate: values.reportDate.toISOString(),
        auditorName: values.auditorName,
        certification: values.certification,
        validityPeriod: values.validityPeriod,
        status: values.status,
        findings: values.findings,
        recommendations: values.recommendations,
        documentUrl: documentUrl || undefined,
      };

      if (isEditing) {
        await qualityService.updateComplianceReport(report.id, data);
        message.success('Compliance report updated successfully');
      } else {
        await qualityService.createComplianceReport(data);
        message.success('Compliance report created successfully');
      }

      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.message || 'Failed to save compliance report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDocumentUrl('');
    onClose();
  };

  const beforeUpload = (file: File) => {
    const isPdf = file.type === 'application/pdf';
    if (!isPdf) {
      message.error('You can only upload PDF files!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File must be smaller than 5MB!');
      return false;
    }

    // Convert to base64 or upload to server
    const reader = new FileReader();
    reader.onload = e => {
      setDocumentUrl(e.target?.result as string);
      message.success('Document uploaded successfully');
    };
    reader.readAsDataURL(file);

    return false; // Prevent automatic upload
  };

  return (
    <Drawer
      title={
        <div className='drawer-header-with-switch'>
          <span>{isEditing ? 'Edit Compliance Report' : 'Create Compliance Report'}</span>
          <div className='header-switch'>
            <span className='switch-label'>Active</span>
            <Form.Item name='isActive' valuePropName='checked' noStyle>
              <Switch disabled={!isEditing} />
            </Form.Item>
          </div>
        </div>
      }
      width={720}
      open={visible}
      onClose={handleCancel}
      footer={
        <div className='drawer-footer'>
          <Button onClick={handleCancel} disabled={loading} size='middle'>
            Cancel
          </Button>
          <GradientButton onClick={handleSubmit} loading={loading} size='middle'>
            {isEditing ? 'Update Report' : 'Create Report'}
          </GradientButton>
        </div>
      }
    >
      <Form form={form} layout='vertical' className='compliance-report-form'>
        {/* Section 1: Report Information */}
        <div className='form-section'>
          <Form.Item
            name='reportType'
            label='Report Type'
            rules={[{ required: true, message: 'Please select report type' }]}
          >
            <Select placeholder='Select report type'>
              <Select.Option value='ISO_9001'>ISO 9001 - Quality Management</Select.Option>
              <Select.Option value='ISO_14001'>ISO 14001 - Environmental Management</Select.Option>
              <Select.Option value='OEKO_TEX'>OEKO-TEX - Textile Safety</Select.Option>
              <Select.Option value='GOTS'>GOTS - Organic Textile Standard</Select.Option>
              <Select.Option value='WRAP'>
                WRAP - Worldwide Responsible Accredited Production
              </Select.Option>
              <Select.Option value='SA8000'>SA8000 - Social Accountability</Select.Option>
              <Select.Option value='BSCI'>
                BSCI - Business Social Compliance Initiative
              </Select.Option>
              <Select.Option value='SEDEX'>SEDEX - Supplier Ethical Data Exchange</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name='reportDate'
            label='Report Date'
            rules={[{ required: true, message: 'Please select report date' }]}
          >
            <DatePicker style={{ width: '100%' }} format='DD MMM YYYY' />
          </Form.Item>

          <Form.Item
            name='auditorName'
            label='Auditor Name'
            rules={[{ required: true, message: 'Please enter auditor name' }]}
          >
            <Input placeholder='Enter auditor or auditing company name' />
          </Form.Item>
        </div>

        {/* Section 2: Certification Details */}
        <div className='form-section'>
          <Form.Item name='certification' label='Certification Number'>
            <Input placeholder='Enter certification number (if applicable)' />
          </Form.Item>

          <Form.Item name='validityPeriod' label='Validity Period'>
            <Input placeholder='e.g., 1 year, 3 years, 2024-2027' />
          </Form.Item>

          <Form.Item
            name='status'
            label='Compliance Status'
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder='Select compliance status'>
              <Select.Option value='COMPLIANT'>Compliant</Select.Option>
              <Select.Option value='NON_COMPLIANT'>Non-Compliant</Select.Option>
              <Select.Option value='PENDING_REVIEW'>Pending Review</Select.Option>
              <Select.Option value='EXPIRED'>Expired</Select.Option>
            </Select>
          </Form.Item>
        </div>

        {/* Section 3: Findings & Recommendations */}
        <div className='form-section'>
          <Form.Item name='findings' label='Audit Findings'>
            <TextArea
              rows={4}
              placeholder='Enter key findings from the audit...'
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item name='recommendations' label='Recommendations'>
            <TextArea
              rows={4}
              placeholder='Enter recommendations for improvement...'
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item label='Upload Document'>
            <Upload beforeUpload={beforeUpload} maxCount={1} accept='.pdf'>
              <Button icon={<UploadOutlined />}>Upload Report Document (PDF, max 5MB)</Button>
            </Upload>
            {documentUrl && (
              <div style={{ marginTop: 8, color: '#52c41a' }}>✓ Document uploaded successfully</div>
            )}
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};

export default ComplianceReportFormDrawer;
