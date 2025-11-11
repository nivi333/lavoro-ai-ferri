import './HeadingText.scss';

interface HeadingTextProps {
  children: React.ReactNode;
  className?: string;
}

export function HeadingText({ children, className = '' }: HeadingTextProps) {
  return (
    <h3 className={`headingText ${className}`.trim()}>
      {children}
    </h3>
  );
}
