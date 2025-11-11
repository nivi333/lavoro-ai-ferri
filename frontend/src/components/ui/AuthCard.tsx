import { ReactNode } from 'react';
import { Card } from 'antd';
import { HeadingText } from './HeadingText';

interface AuthCardProps {
  children: ReactNode;
  heading?: string;
}

// Reusable auth card component with logo and title
export function AuthCard({ children, heading }: AuthCardProps) {
  return (
    <div style={{ maxWidth: '448px', margin: '0 auto' }}>
      <Card 
        style={{
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: 'none',
        }}
      >
        {/* Page heading inside card */}
        {heading && (
          <div style={{ marginBottom: '24px' }}>
            <HeadingText>{heading}</HeadingText>
          </div>
        )}

        {children}
      </Card>
    </div>
  );
}
