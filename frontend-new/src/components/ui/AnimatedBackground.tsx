/**
 * Animated Background Component
 * Provides animated floating shapes for auth pages
 */

import { ReactNode } from 'react';

interface AnimatedBackgroundProps {
  variant?: 'login' | 'register' | 'forgot-password';
  children?: ReactNode;
}

export default function AnimatedBackground({
  variant = 'login',
  children,
}: AnimatedBackgroundProps) {
  const getColorScheme = () => {
    switch (variant) {
      case 'register':
        return {
          primary: '#df005c',
          secondary: '#a2d8e5',
          accent: '#e879f9',
        };
      case 'forgot-password':
        return {
          primary: '#fb923c',
          secondary: '#f59e0b',
          accent: '#fbbf24',
        };
      default: // login
        return {
          primary: '#df005c',
          secondary: '#a2d8e5',
          accent: '#c084fc',
        };
    }
  };

  const colors = getColorScheme();

  return (
    <>
      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(90deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
          75% { transform: translateY(-30px) rotate(270deg); }
        }
        
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(360deg); }
          25% { transform: translateY(30px) rotate(270deg); }
          50% { transform: translateY(15px) rotate(180deg); }
          75% { transform: translateY(25px) rotate(90deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
        }
        
        @keyframes drift {
          0% { transform: translateX(0px); }
          50% { transform: translateX(20px); }
          100% { transform: translateX(0px); }
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }
      `}</style>

      {/* Large floating circles */}
      <div
        className='absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10 blur-[40px]'
        style={{
          background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
          animation: 'float 20s ease-in-out infinite, pulse 8s ease-in-out infinite',
        }}
      />

      <div
        className='absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10 blur-[40px]'
        style={{
          background: `linear-gradient(45deg, ${colors.secondary}, ${colors.primary})`,
          animation: 'floatReverse 25s ease-in-out infinite, pulse 10s ease-in-out infinite',
        }}
      />

      {/* Medium floating elements */}
      <div
        className='absolute top-[20%] left-[10%] w-30 h-30 opacity-8 blur-[20px]'
        style={{
          background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          animation: 'float 15s ease-in-out infinite, drift 12s ease-in-out infinite',
        }}
      />

      <div
        className='absolute bottom-[30%] right-[15%] w-20 h-20 rounded-full opacity-10 blur-[15px]'
        style={{
          background: `linear-gradient(225deg, ${colors.secondary}, ${colors.accent})`,
          animation: 'floatReverse 18s ease-in-out infinite, drift 8s ease-in-out infinite reverse',
        }}
      />

      {/* Small decorative elements */}
      <div
        className='absolute top-[60%] left-[5%] w-10 h-10 rounded-full opacity-6'
        style={{
          background: colors.primary,
          animation: 'float 10s ease-in-out infinite, fadeInOut 6s ease-in-out infinite',
        }}
      />

      <div
        className='absolute top-[15%] right-[8%] w-15 h-15 opacity-5'
        style={{
          background: colors.accent,
          borderRadius: '20% 80% 80% 20% / 20% 20% 80% 80%',
          animation: 'floatReverse 14s ease-in-out infinite, fadeInOut 9s ease-in-out infinite',
        }}
      />

      <div
        className='absolute bottom-[10%] left-[20%] w-[30px] h-[30px] rounded-full opacity-8'
        style={{
          background: colors.secondary,
          animation: 'float 12s ease-in-out infinite, drift 7s ease-in-out infinite',
        }}
      />

      {/* Gradient overlay for depth */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 0%, rgba(255,255,255,0.02) 100%)',
        }}
      />

      {children}
    </>
  );
}
