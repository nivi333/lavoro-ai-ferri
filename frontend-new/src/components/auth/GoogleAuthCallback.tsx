import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { LoadingSpinner } from '../globalComponents';
import { API_BASE_URL } from '@/config/api';
import { AuthStorage } from '@/utils/storage';

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Check for errors from Google
      if (error) {
        setStatus('error');
        toast.error('Google authentication failed', {
          description: error === 'access_denied' ? 'Access was denied' : error,
        });
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Validate state for CSRF protection
      const savedState = sessionStorage.getItem('google_oauth_state');
      if (state && savedState && state !== savedState) {
        setStatus('error');
        toast.error('Security validation failed', {
          description: 'Please try signing in again.',
        });
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      sessionStorage.removeItem('google_oauth_state');

      if (!code) {
        setStatus('error');
        toast.error('No authorization code received');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // Exchange code for tokens with backend
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to authenticate with Google');
        }

        const data = await response.json();
        
        // Store tokens and redirect
        if (data.tokens) {
          AuthStorage.setTokens(data.tokens);
          toast.success('Successfully signed in with Google!');
          navigate('/companies');
        } else {
          throw new Error('No tokens received from server');
        }
      } catch (err: any) {
        setStatus('error');
        toast.error('Google Sign-In failed', {
          description: err.message || 'Please try again.',
        });
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className='flex h-screen items-center justify-center flex-col gap-4'>
      <LoadingSpinner size='lg' />
      <p className='text-muted-foreground'>
        {status === 'processing' ? 'Processing Google authentication...' : 'Redirecting...'}
      </p>
    </div>
  );
}
