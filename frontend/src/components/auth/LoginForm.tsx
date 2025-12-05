import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Checkbox, Divider, Space } from 'antd';
import {
  GoogleOutlined,
  FacebookOutlined,
  YoutubeOutlined,
  InstagramOutlined,
} from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthCard, LinkButton, GradientButton } from '../ui';
import { googleAuth } from '../../utils/googleAuth';

const { Text } = Typography;

interface LoginFormData {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export default function LoginForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/companies';

  // Check for remembered user on component mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      form.setFieldsValue({
        emailOrPhone: rememberedUser,
        rememberMe: true,
      });
    }
  }, [form]);

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    try {
      // Handle remember me functionality
      if (values.rememberMe) {
        // Store email/phone in localStorage for future visits
        localStorage.setItem('rememberedUser', values.emailOrPhone);
      } else {
        // Clear any remembered user
        localStorage.removeItem('rememberedUser');
      }

      await login(values);
      message.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed. Please try again.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Check if Google Client ID is configured
      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        message.error('Google Sign-In is not configured. Please contact administrator.');
        return;
      }

      // Generate PKCE challenge
      const { verifier } = await googleAuth.generatePKCE();

      // Store code verifier for later use
      sessionStorage.setItem('google_code_verifier', verifier);

      // Use the initiateAuthFlow method instead of buildAuthUrl
      await googleAuth.initiateAuthFlow();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Google Sign-In failed. Please try again.';
      message.error(errorMessage);
      setGoogleLoading(false);
    }
  };

  const handleSocialClick = (_platform: string, url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AuthCard heading='Sign In'>
      <Form form={form} name='login' onFinish={onFinish} layout='vertical' size='middle'>
        <Form.Item
          name='emailOrPhone'
          label={<span className='auth-form-label'>Email or Phone Number</span>}
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
            placeholder='Enter your email or phone number'
            autoComplete='username'
            className='form-input-global'
          />
        </Form.Item>

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
          ]}
        >
          <Input.Password
            placeholder='Enter your password'
            autoComplete='current-password'
            className='form-input-global'
          />
        </Form.Item>

        {/* Remember Me & Forgot Password */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <Form.Item name='rememberMe' valuePropName='checked' style={{ margin: 0 }}>
            <Checkbox style={{ color: '#374151', fontSize: '14px' }}>Remember me</Checkbox>
          </Form.Item>

          <LinkButton onClick={() => navigate('/forgot-password')}>
            Forgot your password?
          </LinkButton>
        </div>

        <Form.Item style={{ marginBottom: '16px' }}>
          <GradientButton type='primary' htmlType='submit' loading={loading} block>
            Sign In
          </GradientButton>
        </Form.Item>
      </Form>

      <Divider style={{ margin: '16px 0', borderColor: '#e5e7eb' }}>
        <Text type='secondary' style={{ fontSize: '12px' }}>
          OR
        </Text>
      </Divider>

      <Button
        icon={<GoogleOutlined style={{ fontSize: '16px', color: '#4285f4' }} />}
        loading={googleLoading}
        onClick={handleGoogleSignIn}
        block
        size='middle'
        style={{
          height: '40px',
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          backgroundColor: '#ffffff',
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        Continue with Google
      </Button>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <Text type='secondary' style={{ fontSize: '12px' }}>
          Don't have an account?{' '}
          <LinkButton onClick={() => navigate('/register')}>Sign up</LinkButton>
        </Text>
      </div>

      <Divider style={{ margin: '16px 0', borderColor: '#e5e7eb' }}>
        <Text type='secondary' style={{ fontSize: '12px' }}>
          Follow us
        </Text>
      </Divider>

      <Space size='middle' style={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          type='text'
          icon={<FacebookOutlined style={{ fontSize: '18px', color: '#1877f2' }} />}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => handleSocialClick('Facebook', 'https://facebook.com')}
          aria-label='Follow us on Facebook'
        />
        <Button
          type='text'
          icon={<YoutubeOutlined style={{ fontSize: '18px', color: '#ff0000' }} />}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => handleSocialClick('YouTube', 'https://youtube.com')}
          aria-label='Follow us on YouTube'
        />
        <Button
          type='text'
          icon={<InstagramOutlined style={{ fontSize: '18px', color: '#e4405f' }} />}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => handleSocialClick('Instagram', 'https://instagram.com')}
          aria-label='Follow us on Instagram'
        />
      </Space>
    </AuthCard>
  );
}
