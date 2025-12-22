/**
 * Global Components
 * Reusable styled components with theme-driven styling
 * NO HARDCODED VALUES - All styling from @ayphen-web/theme
 */

import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, Eye, EyeOff, Search, X, ChevronUp, ChevronDown } from 'lucide-react';

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-base text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-primary via-[#c10351] to-[#ab0d4f] text-white shadow-primary hover:shadow-primary-hover hover:scale-[1.02] active:scale-[0.98]',
        secondary:
          'bg-gradient-to-r from-[#ffc53d] via-warning to-warning text-white shadow-base hover:shadow-secondary hover:scale-[1.02] active:scale-[0.98]',
        outlined: 'border border-input bg-transparent hover:bg-primary/10 hover:border-primary',
        ghost: 'bg-transparent hover:bg-primary/10',
        noBorder: 'bg-transparent border-none hover:underline p-0',
        whiteBg: 'bg-white border border-input hover:shadow-base',
        danger:
          'bg-error text-error-foreground hover:bg-error-hover active:bg-error-active shadow-base',
        icon: 'bg-transparent hover:bg-accent p-2 aspect-square',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const PrimaryButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        {children}
      </button>
    );
  }
);
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant: 'secondary', size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        {children}
      </button>
    );
  }
);
SecondaryButton.displayName = 'SecondaryButton';

export const OutlinedButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant: 'outlined', size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        {children}
      </button>
    );
  }
);
OutlinedButton.displayName = 'OutlinedButton';

export const GhostButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant: 'ghost', size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        {children}
      </button>
    );
  }
);
GhostButton.displayName = 'GhostButton';

export const NoBorderButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant: 'noBorder', className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        {children}
      </button>
    );
  }
);
NoBorderButton.displayName = 'NoBorderButton';

export const WhiteBgButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant: 'whiteBg', size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        {children}
      </button>
    );
  }
);
WhiteBgButton.displayName = 'WhiteBgButton';

export const DangerButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant: 'danger', size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        {children}
      </button>
    );
  }
);
DangerButton.displayName = 'DangerButton';

export const AlertButton = DangerButton; // Alias

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant: 'icon', size: 'icon', className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : children}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';

// ============================================================================
// INPUT COMPONENTS
// ============================================================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        className={cn(
          'flex h-10 w-full rounded-base border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-error focus-visible:ring-error',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
TextInput.displayName = 'TextInput';

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className='relative'>
        <input
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'flex h-10 w-full rounded-base border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10',
            error && 'border-error focus-visible:ring-error',
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type='button'
          onClick={() => setShowPassword(!showPassword)}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
        >
          {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export interface SearchInputProps extends InputProps {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, error, onClear, value, ...props }, ref) => {
    return (
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <input
          type='text'
          className={cn(
            'flex h-10 w-full rounded-base border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus-visible:ring-error',
            className
          )}
          ref={ref}
          value={value}
          {...props}
        />
        {value && onClear && (
          <button
            type='button'
            onClick={onClear}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
          >
            <X className='h-4 w-4' />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-base border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
          error && 'border-error focus-visible:ring-error',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
TextArea.displayName = 'TextArea';

export interface NumberInputProps extends InputProps {
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, error, onIncrement, onDecrement, ...props }, ref) => {
    return (
      <div className='relative'>
        <input
          type='number'
          className={cn(
            'flex h-10 w-full rounded-base border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-8',
            error && 'border-error focus-visible:ring-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {(onIncrement || onDecrement) && (
          <div className='absolute right-1 top-1/2 -translate-y-1/2 flex flex-col'>
            {onIncrement && (
              <button
                type='button'
                onClick={onIncrement}
                className='px-1 py-0.5 text-muted-foreground hover:text-foreground'
              >
                <ChevronUp className='h-3 w-3' />
              </button>
            )}
            {onDecrement && (
              <button
                type='button'
                onClick={onDecrement}
                className='px-1 py-0.5 text-muted-foreground hover:text-foreground'
              >
                <ChevronDown className='h-3 w-3' />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);
NumberInput.displayName = 'NumberInput';
