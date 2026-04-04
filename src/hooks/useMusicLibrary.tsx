import { useState } from 'react';

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: string;
  url: string;
  category: string;
}

// Free music from Pixabay (royalty-free, no attribution required)
const musicLibrary: MusicTrack[] = [
  // Energético
  { id: '1', name: 'Electronic Future', artist: 'QubeSounds', duration: '2:30', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3', category: 'Energético' },
  { id: '2', name: 'Powerful Beat', artist: 'SoundGalleryBy', duration: '2:20', url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b0939c8.mp3', category: 'Energético' },
  { id: '3', name: 'Energetic Rock', artist: 'Lexin_Music', duration: '2:45', url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3', category: 'Energético' },
  
  // Relaxante
  { id: '4', name: 'Lofi Chill', artist: 'FASSounds', duration: '2:50', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', category: 'Relaxante' },
  { id: '5', name: 'Ambient Piano', artist: 'SergeQuadrado', duration: '3:15', url: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3', category: 'Relaxante' },
  { id: '6', name: 'Soft Background', artist: 'Lesfm', duration: '2:40', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1edc.mp3', category: 'Relaxante' },
  
  // Alegre
  { id: '7', name: 'Happy Upbeat', artist: 'Lesfm', duration: '2:20', url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_2ac7c27b81.mp3', category: 'Alegre' },
  { id: '8', name: 'Fun Day', artist: 'penguinmusic', duration: '2:35', url: 'https://cdn.pixabay.com/download/audio/2022/08/25/audio_4f3b0a8591.mp3', category: 'Alegre' },
  { id: '9', name: 'Cheerful', artist: 'SoulProdMusic', duration: '2:10', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c518b96b12.mp3', category: 'Alegre' },
  
  // Urbano
  { id: '10', name: 'Hip Hop Beat', artist: 'Prazkhanal', duration: '3:05', url: 'https://cdn.pixabay.com/download/audio/2022/08/04/audio_2dde668d05.mp3', category: 'Urbano' },
  { id: '11', name: 'Trap Vibes', artist: 'SergePavkinMusic', duration: '2:25', url: 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_67bcba3f85.mp3', category: 'Urbano' },
  { id: '12', name: 'Street Style', artist: 'Prazkhanal', duration: '2:40', url: 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3', category: 'Urbano' },
  
  // Acústico
  { id: '13', name: 'Acoustic Guitar', artist: 'AstroMotion', duration: '2:45', url: 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_d16737dc28.mp3', category: 'Acústico' },
  { id: '14', name: 'Folk Melody', artist: 'Lidérc', duration: '2:30', url: 'https://cdn.pixabay.com/download/audio/2022/01/20/audio_b6f2466f10.mp3', category: 'Acústico' },
  { id: '15', name: 'Unplugged', artist: 'Top-Flow', duration: '2:55', url: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_fd3cb7a20a.mp3', category: 'Acústico' },
];

export const categories = ['Todos', 'Alegre', 'Relaxante', 'Energético', 'Acústico', 'Urbano'];

export function useMusicLibrary() {
  const [tracks] = useState<MusicTrack[]>(musicLibrary);
  const [isLoading] = useState(false);

  const filterTracks = (searchTerm: string, category: string) => {
    return tracks.filter(track => {
      const matchesSearch = 
        track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'Todos' || track.category === category;
      return matchesSearch && matchesCategory;
    });
  };

  return {
    tracks,
    categories,
    isLoading,
    filterTracks,
  };
}
