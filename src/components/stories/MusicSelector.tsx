import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Music, 
  Play, 
  Pause, 
  Search, 
  ArrowLeft, 
  Check,
  Volume2,
  VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicSelectorProps {
  selectedMusic: string | null;
  onSelect: (musicUrl: string | null) => void;
  onSkip: () => void;
  onBack: () => void;
}

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: string;
  url: string;
  category: string;
}

// Sample royalty-free music tracks (in production, fetch from API or S3)
const sampleTracks: MusicTrack[] = [
  {
    id: "1",
    name: "Happy Vibes",
    artist: "VilaFood Music",
    duration: "0:15",
    url: "/music/happy-vibes.mp3",
    category: "Alegre"
  },
  {
    id: "2",
    name: "Chill Beats",
    artist: "VilaFood Music",
    duration: "0:15",
    url: "/music/chill-beats.mp3",
    category: "Relaxante"
  },
  {
    id: "3",
    name: "Energy Boost",
    artist: "VilaFood Music",
    duration: "0:15",
    url: "/music/energy-boost.mp3",
    category: "Energético"
  },
  {
    id: "4",
    name: "Acoustic Morning",
    artist: "VilaFood Music",
    duration: "0:15",
    url: "/music/acoustic-morning.mp3",
    category: "Acústico"
  },
  {
    id: "5",
    name: "Urban Groove",
    artist: "VilaFood Music",
    duration: "0:15",
    url: "/music/urban-groove.mp3",
    category: "Urbano"
  },
  {
    id: "6",
    name: "Summer Party",
    artist: "VilaFood Music",
    duration: "0:15",
    url: "/music/summer-party.mp3",
    category: "Festivo"
  },
];

const categories = ["Todos", "Alegre", "Relaxante", "Energético", "Acústico", "Urbano", "Festivo"];

const MusicSelector = ({ selectedMusic, onSelect, onSkip, onBack }: MusicSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [localSelected, setLocalSelected] = useState<string | null>(selectedMusic);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter tracks
  const filteredTracks = sampleTracks.filter(track => {
    const matchesSearch = 
      track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || track.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const togglePlay = (track: MusicTrack) => {
    if (playingTrack === track.id) {
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // In production, we'd actually play the audio
      // For demo, we'll just toggle state
      setPlayingTrack(track.id);
      
      // Create audio element (in production with real URLs)
      // audioRef.current = new Audio(track.url);
      // audioRef.current.play();
    }
  };

  const handleSelectTrack = (track: MusicTrack) => {
    setLocalSelected(track.url);
  };

  const handleConfirm = () => {
    onSelect(localSelected);
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold mb-1">Adicionar Música</h2>
        <p className="text-muted-foreground text-sm">
          Escolha uma música de fundo (opcional)
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar música..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-feedback",
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Music List */}
      <div className="flex-1 overflow-auto space-y-2">
        {filteredTracks.length === 0 ? (
          <div className="text-center py-8">
            <Music className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhuma música encontrada</p>
          </div>
        ) : (
          filteredTracks.map(track => (
            <div
              key={track.id}
              onClick={() => handleSelectTrack(track)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer touch-feedback",
                localSelected === track.url
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              {/* Play button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay(track);
                }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  playingTrack === track.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border"
                )}
              >
                {playingTrack === track.id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
              </div>

              {/* Duration & Selection */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{track.duration}</span>
                {localSelected === track.url && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note about music */}
      <p className="text-xs text-muted-foreground text-center py-3">
        🎵 Todas as músicas são livres de royalty
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          variant="ghost"
          onClick={onSkip}
          className="flex-1"
        >
          Pular
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!localSelected}
          className="flex-1"
        >
          <Music className="w-4 h-4 mr-2" />
          Usar
        </Button>
      </div>
    </div>
  );
};

export default MusicSelector;
