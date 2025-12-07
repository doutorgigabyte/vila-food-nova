import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import vilaTokLogo from '@/assets/logo.png';

interface VilaTokHeaderProps {
  className?: string;
}

export function VilaTokHeader({ className }: VilaTokHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={`absolute top-0 left-0 right-0 z-30 ${className}`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Back Button with red border - matching reference */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-primary bg-transparent hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-sm">Voltar</span>
        </button>

        {/* VilaTok Logo centered */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm">
          <img 
            src={vilaTokLogo} 
            alt="VilaTok" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-white font-bold text-xl tracking-tight">VilaTok</span>
        </div>

        {/* Spacer for balance */}
        <div className="w-24" />
      </div>
    </div>
  );
}
