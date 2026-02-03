import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

interface StatusBadgeProps {
  status: 'RUNNING' | 'active' | 'inactive' | boolean | string;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const isActive = status === 'RUNNING' || status === 'active' || status === true;
  
  return (
    <div className={cn(
      isActive ? 'status-active' : 'status-inactive',
      className
    )}>
      {isActive ? 'Aktif' : 'Nonaktif'}
    </div>
  );
};

interface StatusDotProps {
  status: 'RUNNING' | 'active' | 'inactive' | boolean | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const StatusDot = ({ status, size = 'sm' }: StatusDotProps) => {
  const isActive = status === 'RUNNING' || status === 'active' || status === true;
  
  const sizeClasses: Record<string, string> = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <span 
      className={cn(
        'rounded-full inline-block',
        sizeClasses[size],
        isActive ? 'bg-success animate-pulse' : 'bg-destructive'
      )}
    />
  );
};

interface StockBadgeProps {
  level: number;
  className?: string;
}

export const StockBadge = ({ level, className }: StockBadgeProps) => {
  let variant: 'destructive' | 'warning' | 'success' | 'default' = 'default';
  let label = 'Normal';
  
  if (level <= 10) {
    variant = 'destructive';
    label = 'Rendah';
  } else if (level <= 25) {
    variant = 'warning';
    label = 'Sedang';
  } else {
    variant = 'success';
    label = 'Cukup';
  }

  const variantClasses: Record<string, string> = {
    destructive: 'bg-destructive/15 text-destructive border-destructive/20',
    warning: 'bg-warning/15 text-warning border-warning/20',
    success: 'bg-success/15 text-success border-success/20',
    default: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium',
        variantClasses[variant],
        className
      )}
    >
      {label}
    </Badge>
  );
};

export default StatusBadge;
