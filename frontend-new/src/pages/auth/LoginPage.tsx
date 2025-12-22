/**
 * Login Page
 * User authentication with email/phone and password
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '@/contexts/AuthContext';
import {
  TextInput,
  PasswordInput,
  PrimaryButton,
  Label,
  Card,
} from '@/components/globalComponents';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
    rememberMe: false,
  });

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login({
        emailOrPhone: formData.emailOrPhone,
        password: formData.password,
      });

      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        {/* Logo and Title */}
        <div className='mb-8 text-center'>
          <img
            src='/src/assets/brand-logo.png'
            alt='Ayphen'
            className='mx-auto mb-4 h-12'
          />
          <h1 className='text-heading-2 font-heading font-semibold'>Welcome</h1>
          <p className='mt-2 text-sm text-muted-foreground'>Sign in to your account to continue</p>
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
              Email or Phone
            </Label>
            <TextInput
              id='emailOrPhone'
              type='text'
              placeholder='Enter your email or phone'
              value={formData.emailOrPhone}
              onChange={e => setFormData({ ...formData, emailOrPhone: e.target.value })}
              required
              disabled={isLoading}
            />
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
              required
              disabled={isLoading}
            />
          </div>

          <div className='flex items-center justify-between'>
            <label className='flex items-center gap-2'>
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
              Forgot password?
            </Link>
          </div>

          <PrimaryButton type='submit' className='w-full' loading={isLoading} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </PrimaryButton>
        </form>

        {/* Register Link */}
        <div className='mt-6 text-center text-sm'>
          <span className='text-muted-foreground'>Don't have an account? </span>
          <Link to='/register' className='text-primary hover:underline font-medium'>
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
}
