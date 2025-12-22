/**
 * Register Page
 * New user registration
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@/contexts/AuthContext';
import {
  TextInput,
  PasswordInput,
  PrimaryButton,
  Label,
  Card,
} from '@/components/globalComponents';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
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
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
      });

      toast.success('Registration successful! Please login to continue.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        {/* Logo and Title */}
        <div className='mb-8 text-center'>
          <img src='/src/assets/brand-logo.png' alt='Ayphen' className='mx-auto mb-4 h-12' />
          <h1 className='text-heading-2 font-heading font-semibold'>Create Account</h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            Sign up to get started with Ayphen
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-4 rounded-base border border-error bg-error/10 p-3 text-sm text-error'>
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='firstName' required>
                First Name
              </Label>
              <TextInput
                id='firstName'
                type='text'
                placeholder='John'
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                error={!!validationErrors.firstName}
                disabled={isLoading}
              />
              {validationErrors.firstName && (
                <p className='mt-1 text-xs text-error'>{validationErrors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor='lastName' required>
                Last Name
              </Label>
              <TextInput
                id='lastName'
                type='text'
                placeholder='Doe'
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                error={!!validationErrors.lastName}
                disabled={isLoading}
              />
              {validationErrors.lastName && (
                <p className='mt-1 text-xs text-error'>{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor='email' required>
              Email
            </Label>
            <TextInput
              id='email'
              type='email'
              placeholder='john.doe@example.com'
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              error={!!validationErrors.email}
              disabled={isLoading}
            />
            {validationErrors.email && (
              <p className='mt-1 text-xs text-error'>{validationErrors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor='phone'>Phone (Optional)</Label>
            <TextInput
              id='phone'
              type='tel'
              placeholder='+1 234 567 8900'
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor='password' required>
              Password
            </Label>
            <PasswordInput
              id='password'
              placeholder='At least 8 characters'
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              error={!!validationErrors.password}
              disabled={isLoading}
            />
            {validationErrors.password && (
              <p className='mt-1 text-xs text-error'>{validationErrors.password}</p>
            )}
          </div>

          <div>
            <Label htmlFor='confirmPassword' required>
              Confirm Password
            </Label>
            <PasswordInput
              id='confirmPassword'
              placeholder='Re-enter your password'
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={!!validationErrors.confirmPassword}
              disabled={isLoading}
            />
            {validationErrors.confirmPassword && (
              <p className='mt-1 text-xs text-error'>{validationErrors.confirmPassword}</p>
            )}
          </div>

          <div>
            <label className='flex items-start gap-2'>
              <input
                type='checkbox'
                checked={formData.acceptTerms}
                onChange={e => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className='h-4 w-4 rounded border-input'
                disabled={isLoading}
              />
              <span className='text-sm text-muted-foreground'>
                I accept the{' '}
                <Link to='/terms' className='text-primary hover:underline'>
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link to='/privacy' className='text-primary hover:underline'>
                  Privacy Policy
                </Link>
              </span>
            </label>
            {validationErrors.acceptTerms && (
              <p className='mt-1 text-xs text-error'>{validationErrors.acceptTerms}</p>
            )}
          </div>

          <PrimaryButton type='submit' className='w-full' loading={isLoading} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </PrimaryButton>
        </form>

        {/* Login Link */}
        <div className='mt-6 text-center text-sm'>
          <span className='text-muted-foreground'>Already have an account? </span>
          <Link to='/login' className='text-primary hover:underline font-medium'>
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
