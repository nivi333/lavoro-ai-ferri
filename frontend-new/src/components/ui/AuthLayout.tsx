/**
 * Auth Layout Component
 * Reusable layout for authentication pages with logo and animated background
 */

import { ReactNode } from 'react';
import AnimatedBackground from './AnimatedBackground';

interface AuthLayoutProps {
  children: ReactNode;
  backgroundGradient?: string;
  backgroundDecorations?: ReactNode;
  animated?: boolean;
  animationVariant?: 'login' | 'register' | 'forgot-password';
}

export default function AuthLayout({
  children,
  backgroundGradient = 'linear-gradient(135deg, #faf5ff 0%, #f0f9ff 50%, #ffffff 100%)',
  backgroundDecorations,
  animated = true,
  animationVariant = 'login',
}: AuthLayoutProps) {
  return (
    <div
      className='min-h-screen flex items-center justify-center p-12 relative overflow-hidden'
      style={{ background: backgroundGradient }}
    >
      {/* Logo in top-left */}
      <div className='absolute top-6 left-6 z-10'>
        <img src='/src/assets/brand-logo.png' alt='Ayphen' className='w-[70px] h-[60px]' />
      </div>

      {/* Background decoration */}
      <div className='absolute inset-0 overflow-hidden z-0'>
        {animated ? (
          <AnimatedBackground variant={animationVariant}>
            {backgroundDecorations}
          </AnimatedBackground>
        ) : (
          backgroundDecorations
        )}
      </div>

      {/* Main content container */}
      <div className='relative z-10 w-full max-w-[448px]'>{children}</div>
    </div>
  );
}
