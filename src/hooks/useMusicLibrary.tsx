import { useState, useEffect } from 'react';

const CLOUDFRONT_URL = 'https://d2fhl3f70zfvod.cloudfront.net';

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: string;
  url: string;
  category: string;
}

// Music library from S3 - organized by category
const musicLibrary: MusicTrack[] = [
  // Alegre
  { id: 'alegre-1', name: 'Happy Morning', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/alegre/happy-morning.mp3`, category: 'Alegre' },
  { id: 'alegre-2', name: 'Sunny Day', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/alegre/sunny-day.mp3`, category: 'Alegre' },
  { id: 'alegre-3', name: 'Good Vibes', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/alegre/good-vibes.mp3`, category: 'Alegre' },
  { id: 'alegre-4', name: 'Joyful Dance', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/alegre/joyful-dance.mp3`, category: 'Alegre' },
  { id: 'alegre-5', name: 'Celebrate Life', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/alegre/celebrate-life.mp3`, category: 'Alegre' },
  
  // Relaxante
  { id: 'relaxante-1', name: 'Peaceful Mind', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/relaxante/peaceful-mind.mp3`, category: 'Relaxante' },
  { id: 'relaxante-2', name: 'Calm Waters', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/relaxante/calm-waters.mp3`, category: 'Relaxante' },
  { id: 'relaxante-3', name: 'Gentle Breeze', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/relaxante/gentle-breeze.mp3`, category: 'Relaxante' },
  { id: 'relaxante-4', name: 'Soft Dreams', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/relaxante/soft-dreams.mp3`, category: 'Relaxante' },
  { id: 'relaxante-5', name: 'Serenity', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/relaxante/serenity.mp3`, category: 'Relaxante' },
  
  // Energético
  { id: 'energetico-1', name: 'Power Up', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/energetico/power-up.mp3`, category: 'Energético' },
  { id: 'energetico-2', name: 'Go Hard', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/energetico/go-hard.mp3`, category: 'Energético' },
  { id: 'energetico-3', name: 'Adrenaline Rush', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/energetico/adrenaline-rush.mp3`, category: 'Energético' },
  { id: 'energetico-4', name: 'Unstoppable', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/energetico/unstoppable.mp3`, category: 'Energético' },
  { id: 'energetico-5', name: 'Fire Beats', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/energetico/fire-beats.mp3`, category: 'Energético' },
  
  // Acústico
  { id: 'acustico-1', name: 'Guitar Dreams', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/acustico/guitar-dreams.mp3`, category: 'Acústico' },
  { id: 'acustico-2', name: 'Acoustic Sunrise', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/acustico/acoustic-sunrise.mp3`, category: 'Acústico' },
  { id: 'acustico-3', name: 'Coffee Shop', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/acustico/coffee-shop.mp3`, category: 'Acústico' },
  { id: 'acustico-4', name: 'Folk Tales', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/acustico/folk-tales.mp3`, category: 'Acústico' },
  { id: 'acustico-5', name: 'Strings & Soul', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/acustico/strings-soul.mp3`, category: 'Acústico' },
  
  // Urbano
  { id: 'urbano-1', name: 'City Nights', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/urbano/city-nights.mp3`, category: 'Urbano' },
  { id: 'urbano-2', name: 'Street Flow', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/urbano/street-flow.mp3`, category: 'Urbano' },
  { id: 'urbano-3', name: 'Urban Dreams', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/urbano/urban-dreams.mp3`, category: 'Urbano' },
  { id: 'urbano-4', name: 'Metro Groove', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/urbano/metro-groove.mp3`, category: 'Urbano' },
  { id: 'urbano-5', name: 'Concrete Jungle', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/urbano/concrete-jungle.mp3`, category: 'Urbano' },
  
  // Festivo
  { id: 'festivo-1', name: 'Party Time', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/festivo/party-time.mp3`, category: 'Festivo' },
  { id: 'festivo-2', name: 'Celebration', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/festivo/celebration.mp3`, category: 'Festivo' },
  { id: 'festivo-3', name: 'Dance Floor', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/festivo/dance-floor.mp3`, category: 'Festivo' },
  { id: 'festivo-4', name: 'Summer Fiesta', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/festivo/summer-fiesta.mp3`, category: 'Festivo' },
  { id: 'festivo-5', name: 'Let\'s Go', artist: 'VilaFood', duration: '0:30', url: `${CLOUDFRONT_URL}/_uploads/music/festivo/lets-go.mp3`, category: 'Festivo' },
];

export const categories = ['Todos', 'Alegre', 'Relaxante', 'Energético', 'Acústico', 'Urbano', 'Festivo'];

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
