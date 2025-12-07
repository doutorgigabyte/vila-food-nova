import { cn } from '@/lib/utils';

interface VilaTokAudioIndicatorProps {
  isPlaying: boolean;
  className?: string;
}

export function VilaTokAudioIndicator({ isPlaying, className }: VilaTokAudioIndicatorProps) {
  const bars = [
    { height: 24, delay: '0ms' },
    { height: 32, delay: '100ms' },
    { height: 20, delay: '200ms' },
    { height: 28, delay: '150ms' },
    { height: 16, delay: '50ms' },
  ];

  return (
    <div className={cn("flex items-end gap-[3px] h-10", className)}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] bg-white/90 rounded-full transition-all",
            isPlaying && "vilatok-audio-bar"
          )}
          style={{
            height: isPlaying ? `${bar.height}px` : '6px',
            animationDelay: bar.delay,
          }}
        />
      ))}
    </div>
  );
}
