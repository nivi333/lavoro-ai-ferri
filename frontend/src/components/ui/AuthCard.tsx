import { ReactNode } from 'react';
import { Card } from 'antd';
import HeadingText from './HeadingText';
import './AuthCard.scss';

interface AuthCardProps {
  children: ReactNode;
  heading?: string;
}

// Reusable auth card component with logo and title
export default function AuthCard({ children, heading }: AuthCardProps) {
  return (
    <div className="auth-card-wrapper">
      <Card className="auth-card">
        {/* Page heading inside card */}
        {heading && (
          <div className="auth-card-heading">
            <HeadingText>{heading}</HeadingText>
          </div>
        )}

        {children}
      </Card>
    </div>
  );
}
