import { Button } from 'antd';
import { ReactNode } from 'react';

interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  type?: 'primary' | 'secondary';
  size?: 'small' | 'middle' | 'large';
  block?: boolean;
  className?: string;
  htmlType?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

// Reusable gradient button component
export default function GradientButton({
  children,
  onClick,
  loading = false,
  disabled = false,
  type = 'primary',
  size = 'middle',
  block = false,
  className = '',
  htmlType = 'button',
  style = {},
}: GradientButtonProps) {
  const getGradientClassName = () => {
    switch (type) {
      case 'primary':
        return 'gradient-primary-btn';
      case 'secondary':
        return 'gradient-secondary-btn';
      default:
        return 'gradient-primary-btn';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { height: '32px', fontSize: '12px', padding: '0 16px' };
      case 'middle':
        return { height: '36px', fontSize: '14px', padding: '0 24px' };
      case 'large':
        return { height: '48px', fontSize: '16px', padding: '0 32px' };
      default:
        return { height: '40px', fontSize: '14px', padding: '0 24px' };
    }
  };

  return (
    <Button
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      block={block}
      size={size}
      htmlType={htmlType}
      className={`${getGradientClassName()} ${className}`}
      style={{
        ...getSizeStyle(),
        ...style,
      }}
    >
      {children}
    </Button>
  );
}
