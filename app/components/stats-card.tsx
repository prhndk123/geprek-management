import { LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: number;
  className?: string;
  iconClassName?: string;
}

export const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  className,
  iconClassName,
}: StatsCardProps) => {
  return (
    <div className={cn('stats-card', className)}>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            'bg-primary/10',
            iconClassName
          )}>
            {Icon && <Icon className="w-6 h-6 text-primary" />}
          </div>
          {trend && (
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              trend > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

interface MiniStatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
}

export const MiniStatsCard = ({ title, value, icon: Icon }: MiniStatsCardProps) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      )}
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
