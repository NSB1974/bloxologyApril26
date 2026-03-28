
import React from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TransactionStatusBadge = ({ status, timestamp, className }) => {
  const normalizedStatus = status?.toLowerCase() || 'pending';
  
  const config = {
    pending: {
      icon: Loader2,
      text: 'Pending',
      classes: 'bg-primary/10 text-primary border-primary/20',
      iconClasses: 'animate-spin'
    },
    success: {
      icon: CheckCircle2,
      text: 'Success',
      classes: 'bg-green-500/10 text-green-500 border-green-500/20',
      iconClasses: ''
    },
    failed: {
      icon: XCircle,
      text: 'Failed',
      classes: 'bg-destructive/10 text-destructive border-destructive/20',
      iconClasses: ''
    },
    error: {
      icon: XCircle,
      text: 'Error',
      classes: 'bg-destructive/10 text-destructive border-destructive/20',
      iconClasses: ''
    }
  };

  const currentConfig = config[normalizedStatus] || config.pending;
  const Icon = currentConfig.icon;

  const badge = (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
      currentConfig.classes,
      className
    )}>
      <Icon className={cn("h-3.5 w-3.5", currentConfig.iconClasses)} />
      {currentConfig.text}
    </div>
  );

  if (!timestamp) return badge;

  const date = new Date(timestamp * 1000); // Assuming unix timestamp in seconds
  const formattedDate = isNaN(date.getTime()) ? timestamp : date.toLocaleString();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="glass-card-strong border-border/50 flex items-center gap-2">
          <Clock className="h-3 w-3 text-[var(--text-muted)]" />
          <span className="text-xs">{formattedDate}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TransactionStatusBadge;
