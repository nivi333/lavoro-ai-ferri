import React from 'react';
import './Heading.css';

interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({ level = 2, children, style, className }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return (
    <Tag className={`app-heading app-heading-h${level} ${className || ''}`} style={style}>
      {children}
    </Tag>
  );
};
