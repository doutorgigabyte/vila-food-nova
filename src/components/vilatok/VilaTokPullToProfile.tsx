import { ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VilaTokPullToProfileProps {
  progress: number; // 0-100
  isVisible: boolean;
  establishmentName?: string;
}

export function VilaTokPullToProfile({ 
  progress, 
  isVisible, 
  establishmentName 
}: VilaTokPullToProfileProps) {
  if (!isVisible) return null;

  const opacity = Math.min(1, progress / 50);
  const scale = 0.8 + (progress / 100) * 0.2;
  const isComplete = progress >= 80;

  return (
    <div 
      className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-40 pr-2"
      style={{ opacity }}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Circular progress ring */}
        <div 
          className="relative w-14 h-14 flex items-center justify-center"
          style={{ transform: `scale(${scale})` }}
        >
          {/* Background ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="3"
            />
            {/* Progress ring */}
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke={isComplete ? 'hsl(var(--primary))' : 'white'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progress * 1.5} 150`}
              className="transition-all duration-100"
            />
          </svg>
          {/* Icon */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200",
            isComplete ? "bg-primary" : "bg-white/20"
          )}>
            {isComplete ? (
              <User className="w-5 h-5 text-primary-foreground" />
            ) : (
              <ChevronRight className="w-6 h-6 text-white animate-pulse" />
            )}
          </div>
        </div>
        
        {/* Label */}
        <span 
          className={cn(
            "text-xs font-medium whitespace-nowrap transition-colors duration-200",
            isComplete ? "text-primary" : "text-white/80"
          )}
        >
          {isComplete ? 'Soltar para abrir' : 'Abrir Perfil'}
        </span>
        
        {establishmentName && isComplete && (
          <span className="text-[10px] text-white/60 max-w-20 truncate">
            @{establishmentName}
          </span>
        )}
      </div>
    </div>
  );
}
