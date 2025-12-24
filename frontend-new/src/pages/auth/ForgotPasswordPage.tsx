/**
 * Forgot Password Page
 * Password reset request
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@/contexts/AuthContext';
import { TextInput, PrimaryButton, Label, Card } from '@/components/globalComponents';
import AuthLayout from '@/components/ui/AuthLayout';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');

  const validateEmail = () => {
    if (!email.trim()) {
      setValidationError('Please enter your email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    try {
      await forgotPassword(email);

      toast.success('Password reset email sent!', {
        description: 'Please check your inbox for reset instructions.',
        duration: 4000,
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      toast.error('Failed to send reset email', {
        description: error.message || 'Please try again.',
        duration: 4000,
      });
    }
  };

  return (
    <AuthLayout animated={true} animationVariant='forgot-password'>
      <Card className='w-full'>
        {/* Header - Logo is in AuthLayout top-left */}
        <div className='mb-8 text-center'>
          <h1 className='text-heading-3 font-heading font-semibold'>Forgot Password?</h1>
          <p className='text-sm text-muted-foreground'>
            Enter your email address and we'll send you instructions to reset your password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='email' required>
              Email Address
            </Label>
            <TextInput
              id='email'
              type='email'
              placeholder='Enter your email address'
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={!!validationError}
              disabled={isLoading}
              autoComplete='email'
            />
            {validationError && <p className='mt-1 text-xs text-error'>{validationError}</p>}
          </div>

          <PrimaryButton type='submit' className='w-full' loading={isLoading} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
          </PrimaryButton>
        </form>

        {/* Back to Login Link */}
        <div className='mt-6 text-center text-sm'>
          <span className='text-muted-foreground'>Remember your password? </span>
          <Link to='/login' className='text-primary hover:underline font-medium'>
            Back to Sign In
          </Link>
        </div>
      </Card>
    </AuthLayout>
  );
}
