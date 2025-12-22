/**
 * Login Page - Complete Implementation
 * Features: Remember Me (email+password), Social Media Logos, Success/Failure Alerts
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '@/contexts/AuthContext';
import {
  TextInput,
  PasswordInput,
  PrimaryButton,
  Label,
  Card,
  Separator,
} from '@/components/globalComponents';
import AuthLayout from '@/components/ui/AuthLayout';
import { toast } from 'sonner';
import { Facebook, Youtube, Instagram } from 'lucide-react';

// Simple encryption/decryption for localStorage (base64)
const encryptPassword = (password: string): string => {
  return btoa(password);
};

const decryptPassword = (encrypted: string): string => {
  try {
    return atob(encrypted);
  } catch {
    return '';
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
    rememberMe: false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [googleLoading, setGoogleLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/companies';

  // Load remembered credentials on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedUser');
    const rememberedPassword = localStorage.getItem('rememberedPassword');

    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        emailOrPhone: rememberedEmail,
        password: rememberedPassword ? decryptPassword(rememberedPassword) : '',
        rememberMe: true,
      }));
    }
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Email or Phone validation
    if (!formData.emailOrPhone) {
      errors.emailOrPhone = 'Please input your email or phone number!';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;

      if (!emailRegex.test(formData.emailOrPhone) && !phoneRegex.test(formData.emailOrPhone)) {
        errors.emailOrPhone = 'Please enter a valid email address or phone number';
      }
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Please input your password!';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Handle remember me functionality
      if (formData.rememberMe) {
        localStorage.setItem('rememberedUser', formData.emailOrPhone);
        localStorage.setItem('rememberedPassword', encryptPassword(formData.password));
      } else {
        localStorage.removeItem('rememberedUser');
        localStorage.removeItem('rememberedPassword');
      }

      await login({
        emailOrPhone: formData.emailOrPhone,
        password: formData.password,
      });

      // Success alert with animation
      toast.success('Login successful!', {
        description: 'Redirecting to companies...',
        duration: 2000,
      });

      navigate(from, { replace: true });
    } catch (err: any) {
      // Failure alert with animation
      toast.error('Login failed', {
        description: err.message || 'Please check your credentials and try again.',
        duration: 4000,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Check if Google Client ID is configured
      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        toast.error('Google Sign-In not configured', {
          description: 'Please contact administrator.',
        });
        return;
      }

      // TODO: Implement Google Sign-In with PKCE
      toast.info('Google Sign-In', {
        description: 'Feature coming soon...',
      });
    } catch (error: any) {
      toast.error('Google Sign-In failed', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSocialClick = (platform: string, url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AuthLayout animated={true} animationVariant='login'>
      <Card className='w-full'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h1 className='text-heading-2 font-heading font-semibold mb-2'>Welcome</h1>
          <p className='text-sm text-muted-foreground'>Sign in to your account to continue</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-4 rounded-base border border-error bg-error/10 p-3 text-sm text-error'>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='emailOrPhone' required>
              Email or Phone Number
            </Label>
            <TextInput
              id='emailOrPhone'
              type='text'
              placeholder='Enter your email or phone number'
              value={formData.emailOrPhone}
              onChange={e => setFormData({ ...formData, emailOrPhone: e.target.value })}
              error={!!validationErrors.emailOrPhone}
              disabled={isLoading}
              autoComplete='username'
            />
            {validationErrors.emailOrPhone && (
              <p className='mt-1 text-xs text-error'>{validationErrors.emailOrPhone}</p>
            )}
          </div>

          <div>
            <Label htmlFor='password' required>
              Password
            </Label>
            <PasswordInput
              id='password'
              placeholder='Enter your password'
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              error={!!validationErrors.password}
              disabled={isLoading}
              autoComplete='current-password'
            />
            {validationErrors.password && (
              <p className='mt-1 text-xs text-error'>{validationErrors.password}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className='flex items-center justify-between'>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={formData.rememberMe}
                onChange={e => setFormData({ ...formData, rememberMe: e.target.checked })}
                className='h-4 w-4 rounded border-input'
                disabled={isLoading}
              />
              <span className='text-sm text-muted-foreground'>Remember me</span>
            </label>

            <Link to='/forgot-password' className='text-sm text-primary hover:underline'>
              Forgot your password?
            </Link>
          </div>

          <PrimaryButton type='submit' className='w-full' loading={isLoading} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </PrimaryButton>
        </form>

        <Separator className='my-4' />

        {/* Google Sign-In */}
        <button
          type='button'
          onClick={handleGoogleSignIn}
          disabled={googleLoading || isLoading}
          className='w-full h-10 flex items-center justify-center gap-2 rounded-base border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          <svg className='w-4 h-4' viewBox='0 0 24 24'>
            <path
              fill='#4285F4'
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
            />
            <path
              fill='#34A853'
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
            />
            <path
              fill='#FBBC05'
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
            />
            <path
              fill='#EA4335'
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
            />
          </svg>
          <span className='text-sm font-medium'>
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </span>
        </button>

        {/* Register Link */}
        <div className='mt-4 text-center text-sm'>
          <span className='text-muted-foreground'>Don't have an account? </span>
          <Link to='/register' className='text-primary hover:underline font-medium'>
            Sign up
          </Link>
        </div>

        <Separator className='my-4' />

        {/* Social Media Follow */}
        <div className='text-center'>
          <p className='text-xs text-muted-foreground mb-3'>Follow us</p>
          <div className='flex items-center justify-center gap-3'>
            <button
              type='button'
              onClick={() => handleSocialClick('Facebook', 'https://facebook.com')}
              className='w-9 h-9 rounded-full border border-input flex items-center justify-center hover:bg-accent transition-colors'
              aria-label='Follow us on Facebook'
            >
              <Facebook className='w-[18px] h-[18px] text-[#1877f2]' />
            </button>
            <button
              type='button'
              onClick={() => handleSocialClick('YouTube', 'https://youtube.com')}
              className='w-9 h-9 rounded-full border border-input flex items-center justify-center hover:bg-accent transition-colors'
              aria-label='Follow us on YouTube'
            >
              <Youtube className='w-[18px] h-[18px] text-[#ff0000]' />
            </button>
            <button
              type='button'
              onClick={() => handleSocialClick('Instagram', 'https://instagram.com')}
              className='w-9 h-9 rounded-full border border-input flex items-center justify-center hover:bg-accent transition-colors'
              aria-label='Follow us on Instagram'
            >
              <Instagram className='w-[18px] h-[18px] text-[#e4405f]' />
            </button>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
}
