/**
 * Global Components
 * Reusable styled components with theme-driven styling
 * NO HARDCODED VALUES - All styling from @ayphen-web/theme
 */

import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, Eye, EyeOff, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-base text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-primary via-[#c10351] to-[#ab0d4f] text-white hover:scale-[1.02] active:scale-[0.98]',
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

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn('min-h-[280px]', className)} ref={ref} {...props}>
        {children}
      </div>
    );
  }
);
PageContainer.displayName = 'PageContainer';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn('flex items-center justify-between mb-sm', className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PageHeader.displayName = 'PageHeader';

export interface PageTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const PageTitle = forwardRef<HTMLHeadingElement, PageTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h2
        className={cn('font-heading text-heading-3 font-semibold m-0', className)}
        ref={ref}
        {...props}
      >
        {children}
      </h2>
    );
  }
);
PageTitle.displayName = 'PageTitle';

export interface ActionBarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ActionBar = forwardRef<HTMLDivElement, ActionBarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn('flex items-center gap-md mb-md', className)} ref={ref} {...props}>
        {children}
      </div>
    );
  }
);
ActionBar.displayName = 'ActionBar';

// ============================================================================
// COMMON UI ELEMENTS
// ============================================================================

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className='flex items-center justify-center'>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
    </div>
  );
};

export interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, message, action, className }: EmptyStateProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && <div className='mb-4 text-muted-foreground'>{icon}</div>}
      <p className='text-muted-foreground mb-4'>{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label className={cn('block text-sm font-medium mb-1', className)} ref={ref} {...props}>
        {children}
        {required && <span className='text-error ml-1'>*</span>}
      </label>
    );
  }
);
Label.displayName = 'Label';

// ============================================================================
// CARD COMPONENTS
// ============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'rounded-base border bg-card text-card-foreground shadow-base p-lg',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
}

export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  ({ className, icon, value, label, ...props }, ref) => {
    return (
      <div
        className={cn(
          'rounded-base border bg-card text-card-foreground shadow-base p-lg hover:shadow-secondary transition-shadow cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      >
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <p className='text-2xl font-bold mb-1'>{value}</p>
            <p className='text-sm text-muted-foreground'>{label}</p>
          </div>
          {icon && <div className='ml-4 text-primary'>{icon}</div>}
        </div>
      </div>
    );
  }
);
StatsCard.displayName = 'StatsCard';

export interface TableCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TableCard = forwardRef<HTMLDivElement, TableCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'rounded-base border bg-card text-card-foreground shadow-base overflow-hidden',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TableCard.displayName = 'TableCard';

// ============================================================================
// BADGE/TAG COMPONENTS
// ============================================================================

const badgeVariants = cva(
  'inline-flex items-center rounded-base px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        success: 'bg-success/10 text-success border border-success/20',
        warning: 'bg-warning/10 text-warning border border-warning/20',
        error: 'bg-error/10 text-error border border-error/20',
        info: 'bg-info/10 text-info border border-info/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <span className={cn(badgeVariants({ variant }), className)} ref={ref} {...props}>
        {children}
      </span>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

export interface CountBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
}

export const CountBadge = forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({ className, count, ...props }, ref) => {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium min-w-[20px] h-5 px-1.5',
          className
        )}
        ref={ref}
        {...props}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  }
);
CountBadge.displayName = 'CountBadge';

// ============================================================================
// SEPARATOR COMPONENT
// ============================================================================

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        className={cn(
          'bg-border',
          orientation === 'horizontal' ? 'h-[1px] w-full my-[5px]' : 'w-[1px] h-full mx-[5px]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Separator.displayName = 'Separator';

// ============================================================================
// TABLE COMPONENTS
// ============================================================================

export interface DataTableProps extends React.HTMLAttributes<HTMLTableElement> {}

/**
 * DataTable - Standard data table wrapper
 * - Border from theme
 * - Padding: 10px per cell (from .ant-table-cell)
 * - Hover row effect
 */
export const DataTable = forwardRef<HTMLTableElement, DataTableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className='relative w-full overflow-auto'>
        <table
          ref={ref}
          className={cn(
            'w-full caption-bottom text-sm border-collapse',
            'border border-border rounded-base',
            className
          )}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);
DataTable.displayName = 'DataTable';

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

/**
 * TableHeader - Sticky table header
 * - Background from theme
 * - Font weight: 500
 * - White-space: nowrap
 */
export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn('sticky top-0 bg-muted/50 backdrop-blur z-10', className)}
        {...props}
      >
        {children}
      </thead>
    );
  }
);
TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props}>
        {children}
      </tbody>
    );
  }
);
TableBody.displayName = 'TableBody';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-b border-border transition-colors',
          'hover:bg-muted/50 data-[state=selected]:bg-muted',
          className
        )}
        {...props}
      >
        {children}
      </tr>
    );
  }
);
TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, sortable = false, sortDirection = null, onSort, ...props }, ref) => {
    const handleClick = () => {
      if (sortable && onSort) {
        onSort();
      }
    };

    return (
      <th
        ref={ref}
        className={cn(
          'h-12 px-[10px] text-left align-middle',
          'font-medium text-muted-foreground',
          'whitespace-nowrap',
          '[&:has([role=checkbox])]:pr-0',
          sortable && 'cursor-pointer select-none hover:bg-muted/80 transition-colors',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <div className='flex items-center gap-2'>
          {children}
          {sortable && (
            <div className='flex flex-col'>
              <ChevronUp
                className={cn(
                  'h-3 w-3 -mb-1',
                  sortDirection === 'asc' ? 'text-primary' : 'text-muted-foreground/40'
                )}
              />
              <ChevronDown
                className={cn(
                  'h-3 w-3',
                  sortDirection === 'desc' ? 'text-primary' : 'text-muted-foreground/40'
                )}
              />
            </div>
          )}
        </div>
      </th>
    );
  }
);
TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

/**
 * TableCell - Standard table cell
 * - Padding from theme (10px)
 * - Text color variants (primary, secondary, success)
 */
export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantClasses = {
      default: '',
      primary: 'text-primary font-medium',
      secondary: 'text-muted-foreground',
      success: 'text-success font-medium',
      warning: 'text-warning font-medium',
      error: 'text-error font-medium',
    };

    return (
      <td
        ref={ref}
        className={cn(
          'px-[10px] py-[10px] align-middle',
          '[&:has([role=checkbox])]:pr-0',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </td>
    );
  }
);
TableCell.displayName = 'TableCell';

// ============================================================================
// SELECT COMPONENT
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const Select = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
  disabled,
}: SelectProps) => {
  return (
    <ShadcnSelect value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
  );
};

// ============================================================================
// SHEET/DRAWER COMPONENTS
// ============================================================================

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader as ShadcnSheetHeader,
  SheetTitle,
  SheetFooter as ShadcnSheetFooter,
} from '@/components/ui/sheet';

export interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const FormSheet = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: FormSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-[600px] overflow-y-auto'>
        <ShadcnSheetHeader className='border-b pb-1'>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </ShadcnSheetHeader>

        <div className='py-4'>{children}</div>

        {footer && <ShadcnSheetFooter className='border-t pt-4 mt-4'>{footer}</ShadcnSheetFooter>}
      </SheetContent>
    </Sheet>
  );
};

export interface SheetHeaderProps {
  title: string;
  description?: string;
}

export const SheetHeaderComponent = ({ title, description }: SheetHeaderProps) => {
  return (
    <ShadcnSheetHeader className='border-b pb-4'>
      <SheetTitle>{title}</SheetTitle>
      {description && <SheetDescription>{description}</SheetDescription>}
    </ShadcnSheetHeader>
  );
};

export interface SheetFooterProps {
  onCancel?: () => void;
  onSave?: () => void;
  cancelText?: string;
  saveText?: string;
  saveLoading?: boolean;
  saveDisabled?: boolean;
}

export const SheetFooterComponent = ({
  onCancel,
  onSave,
  cancelText = 'Cancel',
  saveText = 'Save',
  saveLoading = false,
  saveDisabled = false,
}: SheetFooterProps) => {
  return (
    <ShadcnSheetFooter className='border-t pt-4 flex gap-2'>
      {onCancel && (
        <OutlinedButton onClick={onCancel} type='button'>
          {cancelText}
        </OutlinedButton>
      )}
      {onSave && (
        <PrimaryButton
          onClick={onSave}
          loading={saveLoading}
          disabled={saveDisabled || saveLoading}
          type='button'
        >
          {saveText}
        </PrimaryButton>
      )}
    </ShadcnSheetFooter>
  );
};

// ============================================================================
// DIALOG/MODAL COMPONENTS
// ============================================================================

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className='flex items-center gap-3'>
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                variant === 'danger' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
              )}
            >
              <AlertTriangle className='h-5 w-5' />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className='mt-2'>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={variant === 'danger' ? 'bg-error hover:bg-error-hover' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const FormDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}: FormDialogProps) => {
  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidthClasses[maxWidth])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className='py-4'>{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};
