import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TVFrameProps {
  children: ReactNode;
  className?: string;
}

const TVFrame = ({ children, className }: TVFrameProps) => {
  return (
    <div className={cn("relative", className)}>
      {/* TV Outer Frame */}
      <div className="relative bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-2xl p-3 shadow-2xl">
        {/* Top Bezel with Camera/Sensors */}
        <div className="flex items-center justify-between px-4 py-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
          </div>
          <div className="text-[8px] text-gray-500 font-medium tracking-widest">SMART TV</div>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
        
        {/* Screen Container - 16:9 aspect ratio */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-gray-700/50 shadow-inner">
          {/* Screen Content */}
          <div className="absolute inset-0">
            {children}
          </div>
          
          {/* Screen Glare Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          
          {/* Subtle Vignette */}
          <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] pointer-events-none" />
        </div>
        
        {/* Bottom Bezel with Logo */}
        <div className="flex items-center justify-center py-2 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[2px] bg-primary rounded-full" />
            <span className="text-[9px] text-gray-400 font-semibold tracking-wider">VILAFOOD</span>
            <div className="w-4 h-[2px] bg-primary rounded-full" />
          </div>
        </div>
      </div>
      
      {/* TV Stand */}
      <div className="flex justify-center -mt-1">
        <div className="w-24 h-3 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-lg" />
      </div>
      <div className="flex justify-center -mt-0.5">
        <div className="w-32 h-2 bg-gradient-to-b from-gray-700 to-gray-800 rounded-full shadow-lg" />
      </div>
    </div>
  );
};

export default TVFrame;
