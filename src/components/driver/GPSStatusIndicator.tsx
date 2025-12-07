import { cn } from '@/lib/utils';
import { Navigation, NavigationOff, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GPSStatusIndicatorProps {
  isTracking: boolean;
  hasError: boolean;
  lastUpdate: Date | null;
  accuracy?: number | null;
  className?: string;
}

const GPSStatusIndicator = ({ 
  isTracking, 
  hasError, 
  lastUpdate, 
  accuracy,
  className 
}: GPSStatusIndicatorProps) => {
  const getStatusColor = () => {
    if (hasError) return 'text-destructive';
    if (!isTracking) return 'text-muted-foreground';
    if (accuracy && accuracy > 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (hasError) return 'GPS com erro';
    if (!isTracking) return 'GPS desativado';
    if (accuracy && accuracy > 50) return `GPS ativo (precisão: ${accuracy.toFixed(0)}m)`;
    return 'GPS ativo';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            isTracking && !hasError ? 'bg-green-500/10' : 'bg-muted',
            className
          )}>
            {isTracking && !hasError ? (
              <Navigation className={cn('w-3 h-3 animate-pulse', getStatusColor())} />
            ) : hasError ? (
              <NavigationOff className={cn('w-3 h-3', getStatusColor())} />
            ) : (
              <Navigation className={cn('w-3 h-3', getStatusColor())} />
            )}
            <span className={getStatusColor()}>
              {hasError ? 'Erro' : isTracking ? 'GPS' : 'Off'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs">
            <p className="font-medium">{getStatusText()}</p>
            {lastUpdate && (
              <p className="text-muted-foreground">
                Última atualização: {formatDistanceToNow(lastUpdate, { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GPSStatusIndicator;
