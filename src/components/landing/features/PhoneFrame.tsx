import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
}

const PhoneFrame = ({ children, className = "" }: PhoneFrameProps) => {
  return (
    <div className={`relative ${className}`}>
      {/* Phone frame */}
      <div className="relative mx-auto w-full max-w-[280px] aspect-[9/16] rounded-[2.5rem] bg-gradient-to-b from-zinc-800 to-zinc-900 p-2 shadow-2xl">
        {/* Inner bezel */}
        <div className="relative w-full h-full rounded-[2rem] bg-black overflow-hidden">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700" />
          </div>
          
          {/* Screen content */}
          <div className="w-full h-full bg-zinc-950 overflow-hidden">
            {children}
          </div>
          
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
      
      {/* Reflection effect */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
    </div>
  );
};

export default PhoneFrame;
