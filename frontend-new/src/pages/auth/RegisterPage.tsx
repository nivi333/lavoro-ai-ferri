/**
 * Register Page - Complete Implementation
 * Features: emailOrPhone field (NOT separate email/phone), exact validation from existing frontend
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
import { EmailPhoneInput, validateEmailOrPhone, isEmail } from '@/components/EmailPhoneInput';
import AuthLayout from '@/components/ui/AuthLayout';
import { toast } from 'sonner';
import { User } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailOrPhone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'Please input your first name!';
    } else if (formData.firstName.length < 3 || formData.firstName.length > 50) {
      errors.firstName = 'First name must be between 3 and 50 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName)) {
      errors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes';
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Please input your last name!';
    } else if (formData.lastName.length < 3 || formData.lastName.length > 50) {
      errors.lastName = 'Last name must be between 3 and 50 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName)) {
      errors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes';
    }

    // Email or Phone validation
    const emailPhoneValidation = validateEmailOrPhone(formData.emailOrPhone);
    if (!emailPhoneValidation.valid) {
      errors.emailOrPhone = emailPhoneValidation.message || 'Invalid email or phone';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Please input your password!';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password!';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'The two passwords that you entered do not match!';
    }

    // Terms validation
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'Please accept the terms and conditions';
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
      // Determine if emailOrPhone is email or phone and structure data correctly
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        ...(isEmail(formData.emailOrPhone)
          ? { email: formData.emailOrPhone }
          : { phone: formData.emailOrPhone }),
      };

      await register(registrationData);

      toast.success('Registration successful!', {
        description: 'Please check your email to verify your account.',
        duration: 3000,
      });
      navigate('/login');
    } catch (err: any) {
      toast.error('Registration failed', {
        description: err.message || 'Please try again.',
        duration: 4000,
      });
    }
  };

  return (
    <AuthLayout animated={true} animationVariant='register'>
      <Card className='w-full'>
        {/* Header - Logo is in AuthLayout top-left */}
        <div className='mb-8 text-center'>
          <h1 className='text-heading-3 font-heading font-semibold'>Create Account</h1>
          <p className='mt-2 text-sm text-muted-foreground'>Sign up to get started with Ayphen</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-4 rounded-base border border-error bg-error/10 p-3 text-sm text-error'>
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className='space-y-2'>
          {/* First Name & Last Name */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='firstName' required>
                First Name
              </Label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <TextInput
                  id='firstName'
                  type='text'
                  placeholder='Enter your first name'
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  error={!!validationErrors.firstName}
                  disabled={isLoading}
                  className='pl-10'
                />
              </div>
              {validationErrors.firstName && (
                <p className='mt-1 text-xs text-error'>{validationErrors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor='lastName' required>
                Last Name
              </Label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <TextInput
                  id='lastName'
                  type='text'
                  placeholder='Enter your last name'
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  error={!!validationErrors.lastName}
                  disabled={isLoading}
                  className='pl-10'
                />
              </div>
              {validationErrors.lastName && (
                <p className='mt-1 text-xs text-error'>{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email or Phone Number */}
          <div>
            <Label htmlFor='emailOrPhone' required>
              Email/Phone
            </Label>
            <EmailPhoneInput
              id='emailOrPhone'
              value={formData.emailOrPhone}
              onChange={e => setFormData({ ...formData, emailOrPhone: e.target.value })}
              error={!!validationErrors.emailOrPhone}
              disabled={isLoading}
            />
            {validationErrors.emailOrPhone && (
              <p className='mt-1 text-xs text-error'>{validationErrors.emailOrPhone}</p>
            )}
            <p className='mt-1 text-xs text-muted-foreground'>
              Enter your email address or phone number with country code (e.g., +1 for US, +91 for
              India)
            </p>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor='password' required>
              Password
            </Label>
            <PasswordInput
              id='password'
              placeholder='Create a strong password'
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              error={!!validationErrors.password}
              disabled={isLoading}
            />
            {validationErrors.password && (
              <p className='mt-1 text-xs text-error'>{validationErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor='confirmPassword' required>
              Confirm Password
            </Label>
            <PasswordInput
              id='confirmPassword'
              placeholder='Confirm your password'
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={!!validationErrors.confirmPassword}
              disabled={isLoading}
            />
            {validationErrors.confirmPassword && (
              <p className='mt-1 text-xs text-error'>{validationErrors.confirmPassword}</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div>
            <label className='flex items-start gap-2'>
              <input
                type='checkbox'
                checked={formData.acceptTerms}
                onChange={e => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className='h-4 w-4 rounded border-input mt-0.5'
                disabled={isLoading}
              />
              <span className='text-sm text-muted-foreground'>
                I agree to the{' '}
                <Link to='/legal/terms' target='_blank' className='text-primary hover:underline'>
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link to='/legal/privacy' target='_blank' className='text-primary hover:underline'>
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
    </AuthLayout>
  );
}
