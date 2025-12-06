import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Music, 
  Play, 
  Pause, 
  Search, 
  ArrowLeft, 
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusicLibrary, categories, type MusicTrack } from "@/hooks/useMusicLibrary";

interface MusicSelectorProps {
  selectedMusic: string | null;
  onSelect: (musicUrl: string | null) => void;
  onSkip: () => void;
  onBack: () => void;
}

const MusicSelector = ({ selectedMusic, onSelect, onSkip, onBack }: MusicSelectorProps) => {
  const { filterTracks } = useMusicLibrary();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [localSelected, setLocalSelected] = useState<string | null>(selectedMusic);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredTracks = filterTracks(searchTerm, selectedCategory);

  const togglePlay = (track: MusicTrack) => {
    if (playingTrack === track.id) {
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.url);
      audioRef.current.play().catch(console.error);
      setPlayingTrack(track.id);
      
      audioRef.current.onended = () => {
        setPlayingTrack(null);
      };
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
