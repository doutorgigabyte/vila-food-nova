import { cn } from "@/lib/utils";
import { Check, Sparkles, Palette, Target, Camera, PartyPopper, Palmtree } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TemplateOption {
  value: string;
  label: string;
  description: string;
  preview: React.ReactNode;
  category?: string;
}

interface TemplatePreviewSelectorProps {
  templates: TemplateOption[];
  value: string;
  onValueChange: (value: string) => void;
}

// ========== MINIMALISTAS ==========
const TemplatePreviewCleanWhite = () => (
  <div className="relative w-full h-full bg-white rounded overflow-hidden">
    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 rounded" />
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
      <div className="w-4 h-1 bg-gray-400 rounded-sm" />
      <div className="w-3 h-0.5 bg-gray-300 rounded-sm" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100" />
  </div>
);

const TemplatePreviewZenSimple = () => (
  <div className="relative w-full h-full bg-stone-50 rounded overflow-hidden">
    <div className="absolute inset-2 flex flex-col justify-center">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-full h-[1px] bg-stone-200 my-1" />
      ))}
    </div>
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-200" />
  </div>
);

const TemplatePreviewMonoMinimal = () => (
  <div className="relative w-full h-full bg-white rounded overflow-hidden border border-black">
    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-black" />
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
      <div className="w-4 h-1 bg-black rounded-sm" />
      <div className="w-3 h-0.5 bg-gray-600 rounded-sm" />
    </div>
  </div>
);

const TemplatePreviewPastelSoft = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 rounded overflow-hidden">
    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-white/80 rounded-full" />
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
      <div className="w-4 h-1 bg-purple-300 rounded-full" />
      <div className="w-3 h-0.5 bg-pink-200 rounded-full" />
    </div>
  </div>
);

const TemplatePreviewGlassCard = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 rounded overflow-hidden">
    <div className="absolute inset-2 bg-white/40 backdrop-blur rounded-lg border border-white/50">
      <div className="absolute top-1 left-1 w-4 h-4 bg-white/60 rounded-full" />
      <div className="absolute bottom-1 right-1 flex flex-col gap-0.5">
        <div className="w-3 h-0.5 bg-white/80 rounded-sm" />
      </div>
    </div>
  </div>
);

// ========== VIBRANTES ==========
const TemplatePreviewNeonGlow = () => (
  <div className="relative w-full h-full bg-gray-950 rounded overflow-hidden">
    <div className="absolute top-1 left-1 w-4 h-4 bg-pink-500/60 rounded-full blur-[3px]" />
    <div className="absolute bottom-1 right-1 w-3 h-3 bg-cyan-400/60 rounded-full blur-[2px]" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-5 h-5 bg-white/90 rounded-full border border-pink-400" />
    </div>
  </div>
);

const TemplatePreviewPopArt = () => (
  <div className="relative w-full h-full bg-yellow-400 rounded overflow-hidden">
    <div className="absolute inset-0 opacity-30" style={{
      backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
      backgroundSize: '6px 6px'
    }} />
    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full border-2 border-black" />
    <div className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-2 bg-black" />
  </div>
);

const TemplatePreviewGradientBurst = () => (
  <div className="relative w-full h-full rounded overflow-hidden" style={{
    background: 'conic-gradient(from 180deg, #f472b6, #818cf8, #34d399, #fbbf24, #f472b6)'
  }}>
    <div className="absolute inset-1 bg-white/20 backdrop-blur rounded" />
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full" />
  </div>
);

const TemplatePreviewDynamicSplash = () => (
  <div className="relative w-full h-full bg-orange-500 rounded overflow-hidden">
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M0,50 Q25,30 50,50 T100,40 L100,100 L0,100 Z" fill="#fff" opacity="0.3" />
      <path d="M0,70 Q30,50 60,70 T100,60 L100,100 L0,100 Z" fill="#fff" opacity="0.2" />
    </svg>
    <div className="absolute top-2 right-2 w-4 h-4 bg-white/90 rounded-full" />
  </div>
);

const TemplatePreviewElectricBlue = () => (
  <div className="relative w-full h-full bg-blue-950 rounded overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-blue-400/0 via-blue-400 to-blue-400/0" />
      <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-cyan-400/0 via-cyan-400 to-cyan-400/0" />
      <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-blue-400/0 via-blue-400 to-blue-400/0" />
    </div>
    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-cyan-400" />
  </div>
);

// ========== MEDIANOS/EQUILIBRADOS ==========
const TemplatePreviewModernClassic = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded overflow-hidden">
    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-primary/30 rounded" />
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
      <div className="w-4 h-1 bg-slate-600 rounded-sm" />
      <div className="w-3 h-0.5 bg-slate-400 rounded-sm" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary/60" />
  </div>
);

const TemplatePreviewCorporateClean = () => (
  <div className="relative w-full h-full bg-gray-100 rounded overflow-hidden">
    <div className="absolute top-1 left-1 w-3 h-3 bg-blue-600 rounded" />
    <div className="absolute left-2 bottom-2 right-2 top-4 border border-gray-300 rounded bg-white">
      <div className="absolute bottom-1 left-1 flex flex-col gap-0.5">
        <div className="w-4 h-0.5 bg-gray-600" />
        <div className="w-3 h-0.5 bg-gray-400" />
      </div>
    </div>
  </div>
);

const TemplatePreviewWarmCozy = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 rounded overflow-hidden">
    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-amber-300/50 rounded-full" />
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
      <div className="w-4 h-1 bg-amber-700 rounded-sm" />
      <div className="w-3 h-0.5 bg-amber-500 rounded-sm" />
    </div>
  </div>
);

const TemplatePreviewFreshGreen = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 rounded overflow-hidden">
    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-green-400/50 rounded-full" />
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
      <div className="w-4 h-1 bg-green-700 rounded-sm" />
      <div className="w-3 h-0.5 bg-green-500 rounded-sm" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500/30" />
  </div>
);

// ========== VINTAGE ==========
const TemplatePreviewRetro70s = () => (
  <div className="relative w-full h-full bg-amber-100 rounded overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-[3px] border-orange-400 opacity-40" />
      <div className="absolute w-6 h-6 rounded-full border-[2px] border-amber-600 opacity-30" />
    </div>
    <div className="absolute bottom-1 left-1 w-4 h-1 bg-amber-800 rounded" />
  </div>
);

const TemplatePreviewVintageFilm = () => (
  <div className="relative w-full h-full bg-amber-50 rounded overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-amber-800/20" />
    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-amber-200/80 rounded" />
    <div className="absolute right-1 bottom-1 w-4 h-4 border-2 border-amber-600/30 rounded" />
  </div>
);

const TemplatePreviewArtDeco = () => (
  <div className="relative w-full h-full bg-gray-900 rounded overflow-hidden">
    <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100">
      <path d="M50 0 L50 30 L20 0 Z" fill="#D4AF37" />
      <path d="M50 0 L50 30 L80 0 Z" fill="#D4AF37" />
      <path d="M50 100 L50 70 L20 100 Z" fill="#D4AF37" />
      <path d="M50 100 L50 70 L80 100 Z" fill="#D4AF37" />
    </svg>
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-amber-400 rounded-full" />
  </div>
);

const TemplatePreviewRusticWood = () => (
  <div className="relative w-full h-full bg-amber-800 rounded overflow-hidden">
    <div className="absolute inset-0 opacity-30" style={{
      backgroundImage: 'repeating-linear-gradient(90deg, #5d3a1a 0px, #5d3a1a 1px, transparent 1px, transparent 8px)'
    }} />
    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-amber-100/90 rounded" />
    <div className="absolute right-1 bottom-1 w-3 h-3 bg-amber-200/80 rounded" />
  </div>
);

// ========== DATAS COMEMORATIVAS ==========
const TemplatePreviewChristmas = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-red-700 to-green-800 rounded overflow-hidden">
    <div className="absolute top-1 left-1 text-[8px]">❄</div>
    <div className="absolute top-2 right-2 text-[8px]">❄</div>
    <div className="absolute bottom-2 left-2 text-[8px]">🎄</div>
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 rounded-full" />
  </div>
);

const TemplatePreviewEaster = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 rounded overflow-hidden">
    <div className="absolute top-1 left-1 text-[8px]">🥚</div>
    <div className="absolute top-1 right-1 text-[8px]">🐰</div>
    <div className="absolute bottom-1 right-2 text-[8px]">🌸</div>
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 rounded-full border border-pink-300" />
  </div>
);

const TemplatePreviewValentines = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-pink-200 to-red-200 rounded overflow-hidden">
    <div className="absolute top-1 left-2 text-[10px] text-red-400">♥</div>
    <div className="absolute bottom-1 right-1 text-[8px] text-red-400">♥</div>
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 rounded-full border-2 border-red-300" />
  </div>
);

const TemplatePreviewHalloween = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-orange-600 to-gray-900 rounded overflow-hidden">
    <div className="absolute top-1 left-1 text-[8px]">🎃</div>
    <div className="absolute top-1 right-1 text-[8px]">🦇</div>
    <div className="absolute bottom-1 left-2 text-[8px]">👻</div>
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 rounded-full" />
  </div>
);

const TemplatePreviewSaoJoao = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 rounded overflow-hidden">
    <div className="absolute top-0 left-0 right-0 flex gap-1 justify-center">
      <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[5px] border-l-transparent border-r-transparent border-t-red-500" />
      <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[5px] border-l-transparent border-r-transparent border-t-green-500" />
      <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[5px] border-l-transparent border-r-transparent border-t-yellow-400" />
    </div>
    <div className="absolute bottom-1 left-1 text-[8px]">⭐</div>
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 rounded-full" />
  </div>
);

const TemplatePreviewCarnival = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 rounded overflow-hidden">
    {[0,1,2,3,4].map(i => (
      <div key={i} className="absolute w-1 h-2 rounded-full" style={{
        backgroundColor: ['#ef4444', '#22c55e', '#eab308', '#3b82f6', '#a855f7'][i],
        left: `${20 + i * 15}%`,
        top: `${20 + (i % 3) * 20}%`,
        transform: `rotate(${i * 30}deg)`
      }} />
    ))}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 rounded-full" />
  </div>
);

// ========== NORDESTE/TROPICAL ==========
const TemplatePreviewBeachTropical = () => (
  <div className="relative w-full h-full bg-gradient-to-b from-sky-400 to-cyan-300 rounded overflow-hidden">
    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-200 to-amber-100" />
    <div className="absolute bottom-1/3 left-0 right-0 h-2 bg-cyan-400/50" />
    <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-5 h-5 bg-white/90 rounded-full" />
  </div>
);

const TemplatePreviewOceanWaves = () => (
  <div className="relative w-full h-full bg-gradient-to-b from-blue-600 to-blue-800 rounded overflow-hidden">
    <svg className="absolute bottom-0 left-0 right-0 h-1/2" viewBox="0 0 100 50" preserveAspectRatio="none">
      <path d="M0,25 Q25,10 50,25 T100,25 L100,50 L0,50 Z" fill="#60a5fa" opacity="0.5" />
      <path d="M0,35 Q25,20 50,35 T100,35 L100,50 L0,50 Z" fill="#93c5fd" opacity="0.5" />
    </svg>
    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-white/90 rounded-full" />
  </div>
);

const TemplatePreviewCoconutPalm = () => (
  <div className="relative w-full h-full bg-gradient-to-b from-sky-300 to-green-200 rounded overflow-hidden">
    <div className="absolute bottom-0 left-1 w-1 h-3 bg-amber-700" />
    <div className="absolute bottom-2 left-0 w-3 h-1 bg-green-500 rounded-full transform -rotate-45" />
    <div className="absolute bottom-2 left-0 w-3 h-1 bg-green-500 rounded-full transform rotate-45" />
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 rounded-full" />
  </div>
);

const TemplatePreviewNordesteRustic = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-amber-200 to-orange-200 rounded overflow-hidden">
    <div className="absolute inset-0 opacity-20">
      {[0,1,2].map(i => (
        <div key={i} className="absolute w-3 h-3 rounded-full border border-amber-700" style={{
          left: `${20 + i * 30}%`,
          top: `${30 + (i % 2) * 30}%`
        }} />
      ))}
    </div>
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 rounded-full border border-amber-600" />
  </div>
);

const TemplatePreviewSunsetBeach = () => (
  <div className="relative w-full h-full rounded overflow-hidden" style={{
    background: 'linear-gradient(to bottom, #fb923c 0%, #f472b6 50%, #7c3aed 100%)'
  }}>
    <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-300" />
    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gray-900/40" />
  </div>
);

const TemplatePreviewTropicalFruits = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-yellow-200 to-orange-200 rounded overflow-hidden">
    <div className="absolute top-1 left-1 text-[8px]">🥭</div>
    <div className="absolute top-1 right-1 text-[8px]">🍍</div>
    <div className="absolute bottom-1 left-2 text-[8px]">🥥</div>
    <div className="absolute bottom-1 right-1 text-[8px]">🍋</div>
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 rounded-full" />
  </div>
);

// ========== TEMPLATES ORIGINAIS PRESERVADOS ==========
const TemplatePreviewMinimal = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded overflow-hidden">
    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-primary/60 rounded-sm" />
    <div className="absolute bottom-1 right-1 w-3 h-3 bg-white rounded-sm border border-gray-300" />
  </div>
);

const TemplatePreviewProductShowcase = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 rounded overflow-hidden flex">
    <div className="w-1/2 p-1 flex items-center justify-center">
      <div className="w-6 h-6 bg-primary/20 rounded-full" />
    </div>
    <div className="w-1/2 p-1 flex flex-col justify-center gap-0.5">
      <div className="w-full h-1.5 bg-primary/60 rounded-sm" />
      <div className="w-3/4 h-1 bg-gray-300 rounded-sm" />
      <div className="w-1/2 h-1 bg-gray-400 rounded-sm" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-primary/80" />
  </div>
);

const TemplatePreviewPromo = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 rounded overflow-hidden flex">
    <div className="w-2/5 p-1 flex flex-col justify-center gap-0.5">
      <div className="w-3 h-1.5 bg-amber-400 rounded-full" />
      <div className="w-full h-2 bg-primary/60 rounded-sm" />
      <div className="w-1/2 h-1 bg-gray-400 rounded-sm" />
    </div>
    <div className="w-3/5 p-1 flex items-center justify-center">
      <div className="w-8 h-8 bg-primary/20 rounded-lg" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary/80" />
  </div>
);

const TemplatePreviewFullImage = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded overflow-hidden">
    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/60 rounded-full" />
    <div className="absolute inset-2 border-2 border-dashed border-white/50 rounded" />
  </div>
);

const TemplatePreviewBlobModern = () => (
  <div className="relative w-full h-full bg-gray-900 rounded overflow-hidden">
    <div className="absolute top-1 left-1 w-3 h-3 bg-primary/40 rounded-full blur-[2px]" />
    <div className="absolute bottom-2 right-2 w-4 h-4 bg-primary/30 rounded-full blur-[3px]" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-6 h-6 bg-white/90 rounded-full border-2 border-white" />
    </div>
  </div>
);

const TemplatePreviewPolaroid = () => (
  <div className="relative w-full h-full bg-gray-800 rounded overflow-hidden">
    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/60 rounded-full" />
    <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-5 h-6 bg-white rounded-sm transform -rotate-6 shadow-sm">
      <div className="w-full h-4 bg-gray-300" />
    </div>
  </div>
);

const TemplatePreviewDiamond = () => (
  <div className="relative w-full h-full bg-amber-50 rounded overflow-hidden">
    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/60 rounded-full" />
    <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-5 h-5 bg-primary/30 transform rotate-45" />
    <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-0.5">
      <div className="w-4 h-1.5 bg-primary/60 rounded-sm" />
      <div className="w-3 h-1 bg-gray-400 rounded-sm" />
    </div>
  </div>
);

const TemplatePreviewDiagonal = () => (
  <div className="relative w-full h-full bg-amber-100 rounded overflow-hidden">
    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/80 rounded-full" />
    <div className="absolute top-0 left-0 w-3/5 h-full bg-gradient-to-r from-gray-300 to-gray-200" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 100%)' }} />
    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
      <div className="w-4 h-2 bg-primary/60 rounded-sm" />
      <div className="w-3 h-1 bg-gray-500 rounded-sm" />
    </div>
  </div>
);

const TemplatePreviewMenuGrid = () => (
  <div className="relative w-full h-full bg-gray-900 rounded overflow-hidden">
    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/60 rounded-full" />
    <div className="absolute bottom-1 left-2 grid grid-cols-4 gap-0.5">
      {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 bg-white/80 rounded-full" />)}
    </div>
    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/90 rounded-full" />
  </div>
);

const TemplatePreviewSpecialDay = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-primary/80 to-primary rounded overflow-hidden">
    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/80 rounded-full" />
    <div className="absolute bottom-2 right-2 w-5 h-5 bg-white/80 rounded-full" />
    <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full" />
  </div>
);

const TemplatePreviewCatering = () => (
  <div className="relative w-full h-full bg-gray-200 rounded overflow-hidden flex">
    <div className="w-3/5 bg-gradient-to-br from-gray-300 to-gray-400">
      <div className="absolute top-1 left-1/4 w-3 h-3 bg-white/60 rounded-full" />
    </div>
    <div className="w-2/5 bg-primary/80 flex flex-col items-center justify-center gap-0.5 p-1">
      <div className="w-4 h-1 bg-white/90 rounded-sm" />
      <div className="w-3 h-0.5 bg-white/60 rounded-sm" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-100" />
  </div>
);

const TemplatePreviewCircles = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-primary/70 to-primary/90 rounded overflow-hidden">
    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/80 rounded-full" />
    <div className="absolute top-1/2 -translate-y-1/2 left-2 w-4 h-4 bg-white/90 rounded-full border-2 border-amber-400" />
    <div className="absolute bottom-1/3 right-2 w-4 h-4 bg-white/90 rounded-full border-2 border-amber-400" />
  </div>
);

// ========== CATEGORIAS E OPTIONS ==========
interface TemplateCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  templates: TemplateOption[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'minimalist',
    label: '🎨 Minimalistas',
    icon: <Sparkles className="w-4 h-4" />,
    templates: [
      { value: 'minimal', label: 'Minimalista', description: 'Foto fullscreen + logo central + QR discreto', preview: <TemplatePreviewMinimal /> },
      { value: 'clean_white', label: 'Branco Limpo', description: 'Fundo branco puro, elegância simples', preview: <TemplatePreviewCleanWhite /> },
      { value: 'zen_simple', label: 'Zen Simples', description: 'Inspiração japonesa, linhas finas', preview: <TemplatePreviewZenSimple /> },
      { value: 'mono_minimal', label: 'Mono Minimal', description: 'Preto e branco, alto contraste', preview: <TemplatePreviewMonoMinimal /> },
      { value: 'pastel_soft', label: 'Pastel Suave', description: 'Cores pastel, bordas arredondadas', preview: <TemplatePreviewPastelSoft /> },
      { value: 'glass_card', label: 'Vidro', description: 'Efeito glassmorphism elegante', preview: <TemplatePreviewGlassCard /> },
    ]
  },
  {
    id: 'vibrant',
    label: '⚡ Vibrantes',
    icon: <Palette className="w-4 h-4" />,
    templates: [
      { value: 'neon_glow', label: 'Neon', description: 'Fundo escuro, efeitos neon brilhantes', preview: <TemplatePreviewNeonGlow /> },
      { value: 'pop_art', label: 'Pop Art', description: 'Cores saturadas, padrões ousados', preview: <TemplatePreviewPopArt /> },
      { value: 'gradient_burst', label: 'Explosão', description: 'Gradientes explosivos multicoloridos', preview: <TemplatePreviewGradientBurst /> },
      { value: 'dynamic_splash', label: 'Splash', description: 'Respingos dinâmicos de cor', preview: <TemplatePreviewDynamicSplash /> },
      { value: 'electric_blue', label: 'Elétrico', description: 'Azul elétrico, linhas de energia', preview: <TemplatePreviewElectricBlue /> },
    ]
  },
  {
    id: 'balanced',
    label: '🎯 Equilibrados',
    icon: <Target className="w-4 h-4" />,
    templates: [
      { value: 'product_showcase', label: 'Vitrine', description: 'Foto + nome + preço + QR Code', preview: <TemplatePreviewProductShowcase /> },
      { value: 'promo', label: 'Promoção', description: 'Destaque promocional com badge', preview: <TemplatePreviewPromo /> },
      { value: 'modern_classic', label: 'Moderno Clássico', description: 'Mix elegante de estilos', preview: <TemplatePreviewModernClassic /> },
      { value: 'corporate_clean', label: 'Corporativo', description: 'Visual profissional e limpo', preview: <TemplatePreviewCorporateClean /> },
      { value: 'warm_cozy', label: 'Aconchegante', description: 'Tons quentes e acolhedores', preview: <TemplatePreviewWarmCozy /> },
      { value: 'fresh_green', label: 'Verde Fresco', description: 'Natural, frescor, saudável', preview: <TemplatePreviewFreshGreen /> },
    ]
  },
  {
    id: 'vintage',
    label: '📸 Vintage',
    icon: <Camera className="w-4 h-4" />,
    templates: [
      { value: 'polaroid', label: 'Polaroid', description: 'Fotos inclinadas estilo polaroid', preview: <TemplatePreviewPolaroid /> },
      { value: 'retro_70s', label: 'Retrô 70s', description: 'Cores terrosas, círculos vintage', preview: <TemplatePreviewRetro70s /> },
      { value: 'vintage_film', label: 'Filme Antigo', description: 'Efeito película, bordas envelhecidas', preview: <TemplatePreviewVintageFilm /> },
      { value: 'art_deco', label: 'Art Déco', description: 'Padrões geométricos dourados', preview: <TemplatePreviewArtDeco /> },
      { value: 'rustic_wood', label: 'Madeira Rústica', description: 'Textura madeira artesanal', preview: <TemplatePreviewRusticWood /> },
    ]
  },
  {
    id: 'commemorative',
    label: '🎉 Datas Comemorativas',
    icon: <PartyPopper className="w-4 h-4" />,
    templates: [
      { value: 'christmas', label: 'Natal', description: 'Vermelho/verde, flocos de neve', preview: <TemplatePreviewChristmas /> },
      { value: 'easter', label: 'Páscoa', description: 'Coelhos, ovos, cores pastel', preview: <TemplatePreviewEaster /> },
      { value: 'valentines', label: 'Dia dos Namorados', description: 'Corações, rosa e vermelho', preview: <TemplatePreviewValentines /> },
      { value: 'halloween', label: 'Halloween', description: 'Laranja/preto, abóboras', preview: <TemplatePreviewHalloween /> },
      { value: 'sao_joao', label: 'São João', description: 'Bandeirinhas, fogueira, festa', preview: <TemplatePreviewSaoJoao /> },
      { value: 'carnival', label: 'Carnaval', description: 'Confetes, máscaras, cores vivas', preview: <TemplatePreviewCarnival /> },
    ]
  },
  {
    id: 'regional',
    label: '🏖️ Nordeste / Tropical',
    icon: <Palmtree className="w-4 h-4" />,
    templates: [
      { value: 'beach_tropical', label: 'Praia Tropical', description: 'Azul turquesa, areia, sol', preview: <TemplatePreviewBeachTropical /> },
      { value: 'ocean_waves', label: 'Ondas do Mar', description: 'Ondas animadas, tons azuis', preview: <TemplatePreviewOceanWaves /> },
      { value: 'coconut_palm', label: 'Coqueiros', description: 'Verde tropical, palmeiras', preview: <TemplatePreviewCoconutPalm /> },
      { value: 'nordeste_rustic', label: 'Nordeste Rústico', description: 'Barro, renda, artesanato', preview: <TemplatePreviewNordesteRustic /> },
      { value: 'sunset_beach', label: 'Pôr do Sol', description: 'Laranja/rosa, silhuetas', preview: <TemplatePreviewSunsetBeach /> },
      { value: 'tropical_fruits', label: 'Frutas Tropicais', description: 'Manga, caju, cores vibrantes', preview: <TemplatePreviewTropicalFruits /> },
    ]
  },
  {
    id: 'special',
    label: '✨ Especiais',
    icon: <Sparkles className="w-4 h-4" />,
    templates: [
      { value: 'full_image', label: 'Imagem Completa', description: 'Apenas a foto fullscreen', preview: <TemplatePreviewFullImage /> },
      { value: 'blob_modern', label: 'Blobs Modernos', description: 'Fundo escuro com manchas', preview: <TemplatePreviewBlobModern /> },
      { value: 'diamond', label: 'Diamante', description: 'Foto em losango geométrico', preview: <TemplatePreviewDiamond /> },
      { value: 'diagonal', label: 'Diagonal', description: 'Grid diagonal elegante', preview: <TemplatePreviewDiagonal /> },
      { value: 'menu_grid', label: 'Menu Grid', description: 'Foto + grid de produtos', preview: <TemplatePreviewMenuGrid /> },
      { value: 'special_day', label: 'Especial do Dia', description: 'Círculos vibrantes', preview: <TemplatePreviewSpecialDay /> },
      { value: 'catering', label: 'Catering', description: 'Foto + painel lateral', preview: <TemplatePreviewCatering /> },
      { value: 'circles', label: 'Círculos', description: 'Múltiplos círculos decorativos', preview: <TemplatePreviewCircles /> },
    ]
  },
];

// Flatten para manter compatibilidade
export const TEMPLATE_OPTIONS: TemplateOption[] = TEMPLATE_CATEGORIES.flatMap(cat => cat.templates);

export function TemplatePreviewSelector({ templates, value, onValueChange }: TemplatePreviewSelectorProps) {
  // Se templates vazios ou igual ao TEMPLATE_OPTIONS, usa categorias
  const useCategories = !templates || templates.length === 0 || templates.length === TEMPLATE_OPTIONS.length;

  if (useCategories) {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="space-y-6">
          {TEMPLATE_CATEGORIES.map((category) => (
            <div key={category.id}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                {category.label}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {category.templates.map((template) => (
                  <Tooltip key={template.value}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onValueChange(template.value)}
                        className={cn(
                          "relative group p-2 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02]",
                          value === template.value
                            ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-md"
                        )}
                      >
                        <div className="aspect-video w-full rounded-lg overflow-hidden mb-2 ring-1 ring-border/50">
                          {template.preview}
                        </div>
                        <p className={cn(
                          "text-xs font-medium truncate",
                          value === template.value ? "text-primary" : "text-foreground"
                        )}>
                          {template.label}
                        </p>
                        {value === template.value && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md animate-scale-in">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="font-medium">{template.label}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  // Fallback para templates simples
  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {templates.map((template) => (
          <Tooltip key={template.value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onValueChange(template.value)}
                className={cn(
                  "relative group p-2 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02]",
                  value === template.value
                    ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-md"
                )}
              >
                <div className="aspect-video w-full rounded-lg overflow-hidden mb-2 ring-1 ring-border/50">
                  {template.preview}
                </div>
                <p className={cn(
                  "text-xs font-medium truncate",
                  value === template.value ? "text-primary" : "text-foreground"
                )}>
                  {template.label}
                </p>
                {value === template.value && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md animate-scale-in">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px]">
              <p className="font-medium">{template.label}</p>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}