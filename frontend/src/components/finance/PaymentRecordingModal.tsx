import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Row, Col, message, Statistic, Card } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { paymentService, PaymentMethod, RecordPaymentRequest } from '../../services/paymentService';
import { GradientButton } from '../ui';

const { Option } = Select;
const { TextArea } = Input;

interface PaymentRecordingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  referenceType: 'INVOICE' | 'BILL';
  referenceId: string;
  partyName: string;
  totalAmount: number;
  balanceDue: number;
  currency: string;
}

export default function PaymentRecordingModal({
  open,
  onClose,
  onSuccess,
  referenceType,
  referenceId,
  partyName,
  totalAmount,
  balanceDue,
  currency,
}: PaymentRecordingModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        amount: balanceDue,
        paymentDate: dayjs(),
        paymentMethod: 'BANK_TRANSFER',
        currency: currency,
      });
      setPaymentMethod('BANK_TRANSFER');
    }
  }, [open, balanceDue, currency, form]);

  const handlePaymentMethodChange = (value: PaymentMethod) => {
    setPaymentMethod(value);
    // Clear method-specific fields when changing payment method
    form.setFieldsValue({
      chequeNumber: undefined,
      chequeDate: undefined,
      upiId: undefined,
      bankName: undefined,
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const paymentData: RecordPaymentRequest = {
        referenceType,
        referenceId,
        amount: values.amount,
        currency: values.currency || currency,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        paymentMethod: values.paymentMethod,
        transactionRef: values.transactionRef,
        bankName: values.bankName,
        chequeNumber: values.chequeNumber,
        chequeDate: values.chequeDate ? values.chequeDate.format('YYYY-MM-DD') : undefined,
        upiId: values.upiId,
        notes: values.notes,
      };

      await paymentService.recordPayment(paymentData);
      message.success('Payment recorded successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      message.error(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={`Record Payment - ${referenceType === 'INVOICE' ? 'Invoice' : 'Bill'} ${referenceId}`}
      open={open}
      onCancel={handleCancel}
      footer={[
        <GradientButton key='cancel' onClick={handleCancel} style={{ background: '#f5f5f5', color: '#666' }}>
          Cancel
        </GradientButton>,
        <GradientButton key='submit' loading={loading} onClick={handleSubmit}>
          Record Payment
        </GradientButton>,
      ]}
      width={600}
      destroyOnClose
    >
      {/* Payment Summary */}
      <Card className='payment-summary-card' style={{ marginBottom: 16, background: '#f9f9f9' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title={referenceType === 'INVOICE' ? 'Customer' : 'Supplier'}
              value={partyName}
              valueStyle={{ fontSize: '14px', fontWeight: 500 }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title='Total Amount'
              value={totalAmount}
              precision={2}
              prefix={<DollarOutlined />}
              suffix={currency}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title='Balance Due'
              value={balanceDue}
              precision={2}
              prefix={<DollarOutlined />}
              suffix={currency}
              valueStyle={{ fontSize: '14px', color: balanceDue > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Col>
        </Row>
      </Card>

      <Form form={form} layout='vertical'>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name='amount'
              label='Payment Amount'
              rules={[
                { required: true, message: 'Please enter payment amount' },
                {
                  validator: (_, value) => {
                    if (value > balanceDue) {
                      return Promise.reject(`Amount cannot exceed balance due (${balanceDue})`);
                    }
                    if (value <= 0) {
                      return Promise.reject('Amount must be greater than 0');
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0.01}
                max={balanceDue}
                precision={2}
                placeholder='0.00'
                addonAfter={currency}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name='paymentDate'
              label='Payment Date'
              rules={[{ required: true, message: 'Please select payment date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name='paymentMethod'
              label='Payment Method'
              rules={[{ required: true, message: 'Please select payment method' }]}
            >
              <Select placeholder='Select payment method' onChange={handlePaymentMethodChange}>
                <Option value='CASH'>Cash</Option>
                <Option value='CHEQUE'>Cheque</Option>
                <Option value='BANK_TRANSFER'>Bank Transfer</Option>
                <Option value='UPI'>UPI</Option>
                <Option value='CARD'>Card</Option>
                <Option value='OTHER'>Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name='transactionRef' label='Transaction Reference'>
              <Input placeholder='Enter transaction reference' />
            </Form.Item>
          </Col>
        </Row>

        {/* Conditional fields based on payment method */}
        {paymentMethod === 'CHEQUE' && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='chequeNumber'
                label='Cheque Number'
                rules={[{ required: true, message: 'Please enter cheque number' }]}
              >
                <Input placeholder='Enter cheque number' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='chequeDate'
                label='Cheque Date'
                rules={[{ required: true, message: 'Please select cheque date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        )}

        {paymentMethod === 'BANK_TRANSFER' && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name='bankName' label='Bank Name'>
                <Input placeholder='Enter bank name' />
              </Form.Item>
            </Col>
          </Row>
        )}

        {paymentMethod === 'UPI' && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name='upiId'
                label='UPI ID'
                rules={[{ required: true, message: 'Please enter UPI ID' }]}
              >
                <Input placeholder='Enter UPI ID (e.g., name@upi)' />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name='notes' label='Notes'>
              <TextArea rows={3} placeholder='Enter any additional notes' />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
