import React from 'react';
import logoUrl from '../assets/brand-logo.png';

interface BrandLogoProps {
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  alt = 'Ayphen Technologies',
  style,
  width,
  height,
}) => {
  const defaultStyle = {
    width: '60px',
    height: '50px',
    padding: '7px',
  };

  const finalStyle = {
    ...defaultStyle,
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return <img src={logoUrl} alt={alt} style={finalStyle} className={`inline-block ${className}`} />;
};
