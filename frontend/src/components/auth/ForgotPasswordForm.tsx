import { useState } from 'react';
import { Form, Input, Typography, message, Steps, Result } from 'antd';
import { MailOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthCard, LinkButton, GradientButton } from '../ui';

const { Text } = Typography;

export default function ForgotPasswordForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const steps = [
    {
      title: '',
      description: '',
    },
    {
      title: '',
      description: '',
    },
    {
      title: '',
      description: '',
    },
    {
      title: '',
      description: '',
    },
  ];

  const handleRequestReset = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));

      message.success('Reset code sent to your email/phone!');
      setCurrentStep(1);
      form.resetFields();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset code';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (values: { resetCode: string }) => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo: accept "123456" as valid code
      if (values.resetCode === '123456') {
        message.success('Code verified successfully!');
        setCurrentStep(2);
        form.resetFields();
      } else {
        message.error('Invalid reset code. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify code';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));

      message.success('Password reset successfully!');
      setCurrentStep(3);
      form.resetFields();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ marginBottom: '16px' }}>
            <Form form={form} layout='vertical' size='middle' onFinish={handleRequestReset}>
              <Form.Item
                name='emailOrPhone'
                label={
                  <span style={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>
                    Email or Phone Number
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: 'Please input your email or phone number!',
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();

                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      const phoneRegex = /^\+?[1-9]\d{1,14}$/;

                      if (emailRegex.test(value) || phoneRegex.test(value)) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error('Please enter a valid email address or phone number')
                      );
                    },
                  },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder='Enter your email or phone number'
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#f9fafb',
                    fontSize: '14px',
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '16px' }}>
                <GradientButton type='secondary' htmlType='submit' loading={loading} block>
                  Send Reset Code
                </GradientButton>
              </Form.Item>
            </Form>
          </div>
        );

      case 1:
        return (
          <div style={{ marginBottom: '16px' }}>
            <Form form={form} layout='vertical' size='middle' onFinish={handleVerifyCode}>
              <Form.Item
                name='resetCode'
                label={
                  <span style={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>
                    Reset Code
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: 'Please input the reset code!',
                  },
                  {
                    len: 6,
                    message: 'Reset code must be exactly 6 digits',
                  },
                  {
                    pattern: /^\d{6}$/,
                    message: 'Reset code must contain only numbers',
                  },
                ]}
              >
                <Input
                  placeholder='Enter 6-digit code'
                  maxLength={6}
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#f9fafb',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontFamily: 'monospace',
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '16px' }}>
                <GradientButton type='secondary' htmlType='submit' loading={loading} block>
                  Verify Code
                </GradientButton>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center' }}>
              <LinkButton onClick={() => setCurrentStep(0)}>
                ← Back to request reset code
              </LinkButton>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ marginBottom: '16px' }}>
            <Form form={form} layout='vertical' size='middle' onFinish={handleResetPassword}>
              <Form.Item
                name='newPassword'
                label={
                  <span style={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>
                    New Password
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: 'Please input your new password!',
                  },
                  {
                    min: 8,
                    message: 'Password must be at least 8 characters long',
                  },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message:
                      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder='Create a new password'
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#f9fafb',
                    fontSize: '14px',
                  }}
                />
              </Form.Item>

              <Form.Item
                name='confirmPassword'
                label={
                  <span style={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>
                    Confirm New Password
                  </span>
                }
                dependencies={['newPassword']}
                rules={[
                  {
                    required: true,
                    message: 'Please confirm your new password!',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error('The two passwords that you entered do not match!')
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder='Confirm your new password'
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#f9fafb',
                    fontSize: '14px',
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '16px' }}>
                <GradientButton type='secondary' htmlType='submit' loading={loading} block>
                  Reset Password
                </GradientButton>
              </Form.Item>
            </Form>
          </div>
        );

      case 3:
        return (
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title='Password Reset Successful!'
            subTitle='Your password has been reset successfully. You will be redirected to the login page shortly.'
            extra={
              <GradientButton size='small' onClick={() => navigate('/login')}>
                Go to Login
              </GradientButton>
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <AuthCard heading='Forgot Password'>
      <Steps current={currentStep} size='small' style={{ marginBottom: '16px' }}>
        {steps.map((step, index) => (
          <Steps.Step key={index} title={step.title} description={step.description} />
        ))}
      </Steps>

      {renderStepContent()}

      <div style={{ textAlign: 'center' }}>
        <Text type='secondary' style={{ fontSize: '12px' }}>
          Remember your password?{' '}
          <LinkButton onClick={() => navigate('/login')}>Sign in</LinkButton>
        </Text>
      </div>
    </AuthCard>
  );
}
