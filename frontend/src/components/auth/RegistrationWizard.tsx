import { useState } from 'react';
import { Form, Input, Typography, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AuthCard, LinkButton, GradientButton } from '../ui';

const { Text } = Typography;

interface RegistrationData {
  firstName: string;
  lastName: string;
  emailOrPhone: string;
  password: string;
  confirmPassword: string;
}

export default function RegistrationWizard() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: RegistrationData) => {
    setLoading(true);
    try {
      // Determine if emailOrPhone is email or phone and structure data correctly
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const registrationData = {
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
        ...(emailRegex.test(values.emailOrPhone || '')
          ? { email: values.emailOrPhone }
          : { phone: values.emailOrPhone }),
      };

      // Call register function with the structured values
      await register(registrationData);

      message.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed. Please try again.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateEmailOrPhone = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('Please enter your email or phone number!'));
    }

    // Check if it's a valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value)) {
      return Promise.resolve();
    }

    // Check if it's a valid phone number (with country code)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (phoneRegex.test(value)) {
      return Promise.resolve();
    }

    return Promise.reject(
      new Error(
        'Please enter a valid email address or phone number (with country code, e.g., +1234567890)'
      )
    );
  };

  return (
    <AuthCard heading='Register'>
      <Form form={form} layout='vertical' size='middle' onFinish={onFinish}>
        {/* First Name */}
        <Form.Item
          name='firstName'
          label={<span className='auth-form-label'>First Name</span>}
          rules={[
            {
              required: true,
              message: 'Please input your first name!',
            },
            {
              min: 2,
              max: 50,
              message: 'First name must be between 2 and 50 characters',
            },
            {
              pattern: /^[a-zA-Z\s'-]+$/,
              message: 'First name can only contain letters, spaces, hyphens, and apostrophes',
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder='Enter your first name'
            className='form-input-global'
          />
        </Form.Item>

        {/* Last Name */}
        <Form.Item
          name='lastName'
          label={<span className='auth-form-label'>Last Name</span>}
          rules={[
            {
              required: true,
              message: 'Please input your last name!',
            },
            {
              min: 2,
              max: 50,
              message: 'Last name must be between 2 and 50 characters',
            },
            {
              pattern: /^[a-zA-Z\s'-]+$/,
              message: 'Last name can only contain letters, spaces, hyphens, and apostrophes',
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder='Enter your last name'
            className='form-input-global'
          />
        </Form.Item>

        {/* Email or Phone (Combined Field) */}
        <Form.Item
          name='emailOrPhone'
          label={<span className='auth-form-label'>Email or Phone Number</span>}
          rules={[
            {
              validator: validateEmailOrPhone,
            },
          ]}
        >
          <Input
            placeholder='Enter your email or phone number (e.g., +1234567890)'
            className='form-input-global'
          />
        </Form.Item>

        {/* Help Text */}
        <div style={{ marginBottom: '8px', marginTop: '-8px' }}>
          <Text type='secondary' className='auth-help-text'>
            Enter your email address or phone number with country code (e.g., +1 for US, +91 for
            India)
          </Text>
        </div>

        {/* Password */}
        <Form.Item
          name='password'
          label={<span className='auth-form-label'>Password</span>}
          rules={[
            {
              required: true,
              message: 'Please input your password!',
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
            placeholder='Create a strong password'
            className='form-input-global'
          />
        </Form.Item>

        {/* Confirm Password */}
        <Form.Item
          name='confirmPassword'
          label={<span className='auth-form-label'>Confirm Password</span>}
          dependencies={['password']}
          rules={[
            {
              required: true,
              message: 'Please confirm your password!',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
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
            placeholder='Confirm your password'
            className='form-input-global'
          />
        </Form.Item>

        {/* Terms and Conditions */}
        <Form.Item
          name='agreeToTerms'
          valuePropName='checked'
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Please accept the terms and conditions')),
            },
          ]}
        >
          <Checkbox style={{ color: '#374151', fontSize: '14px' }}>
            I agree to the{' '}
            <LinkButton href='#' target='_blank'>
              Terms and Conditions
            </LinkButton>{' '}
            and{' '}
            <LinkButton href='#' target='_blank'>
              Privacy Policy
            </LinkButton>
          </Checkbox>
        </Form.Item>

        {/* Submit Button */}
        <Form.Item style={{ marginBottom: '16px' }}>
          <GradientButton type='primary' htmlType='submit' loading={loading} block>
            Create Account
          </GradientButton>
        </Form.Item>
      </Form>

      {/* Sign In Link */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <Text type='secondary' className='auth-link-text'>
          Already have an account?{' '}
          <LinkButton onClick={() => navigate('/login')}>Sign in</LinkButton>
        </Text>
      </div>
    </AuthCard>
  );
}
