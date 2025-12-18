import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TVFrameProps {
  children: ReactNode;
  className?: string;
}

const TVFrame = ({ children, className }: TVFrameProps) => {
  return (
    <div className={cn("relative", className)}>
      {/* Samsung-style Modern TV */}
      <div className="relative">
        {/* Ultra-thin Bezel Frame */}
        <div className="relative bg-[#0a0a0a] rounded-[4px] p-[3px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
          {/* Inner Frame with subtle metallic edge */}
          <div className="relative rounded-[2px] overflow-hidden ring-1 ring-white/5">
            {/* Screen Container - 16:9 aspect ratio */}
            <div className="relative aspect-video bg-black overflow-hidden">
              {/* Screen Content */}
              <div className="absolute inset-0">
                {children}
              </div>
              
              {/* Ambient Light Effect on edges */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              </div>
              
              {/* Subtle Screen Reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
        
        {/* Samsung-style Center Stand */}
        <div className="flex justify-center">
          {/* Neck */}
          <div className="relative -mt-[1px]">
            <div className="w-16 h-4 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-b-sm" />
          </div>
        </div>
        
        {/* Base */}
        <div className="flex justify-center -mt-[2px]">
          <div className="w-36 h-[6px] bg-gradient-to-b from-[#1a1a1a] via-[#252525] to-[#0d0d0d] rounded-full shadow-lg" />
        </div>
        
        {/* LED Indicator */}
        <div className="absolute bottom-[26px] left-1/2 -translate-x-1/2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/60 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
        </div>
      </div>
      
      {/* Brand Badge - floating below */}
      <div className="flex justify-center mt-3">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-card/30 rounded-full border border-border/30">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">VilaTok TV</span>
        </div>
      </div>
    </div>
  );
};

export default TVFrame;
