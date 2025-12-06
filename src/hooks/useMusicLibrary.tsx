import { useState } from 'react';

const CLOUDFRONT_URL = 'https://d2fhl3f70zfvod.cloudfront.net';
const MUSIC_PATH = '_uploads/Musicas%20VilaFood';

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: string;
  url: string;
  category: string;
}

// Music library from S3 - actual files uploaded
const musicLibrary: MusicTrack[] = [
  // Energético
  { id: '1', name: 'Cyberpunk', artist: 'Alex Productions', duration: '3:20', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/--%20Angry%20Dubstep%20Music%20(No%20Copyright)%20-%20_Cyberpunk_%20by%20Alex%20Productions%20----%20(MP3_320K).mp3`, category: 'Energético' },
  { id: '2', name: 'Free Instrumental Trap', artist: 'Unknown', duration: '2:45', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/%5BFREE%20NO%20COPYRIGHT%20BEAT%202020%5D%20FREE%20INSTRUMENTAL%20TRAP%20_8(MP3_160K).mp3`, category: 'Energético' },
  { id: '3', name: 'Hard Bass Russian Slav', artist: 'Leo', duration: '3:10', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/%5BFREE%5D%20Hard%20Bass%20Type%20Beat%20Russian%20_Slav_%20(prod.%20Leo)%20hard%20bass%20type%20beat(MP3_320K).mp3`, category: 'Energético' },
  { id: '4', name: 'Push', artist: 'Alex Productions', duration: '2:30', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Extreme%20Sport%20Electronic%20Stomp%20by%20Alex-Productions%20%5BNo%20Copyright%20Music%5D%20_%20Push(MP3_160K).mp3`, category: 'Energético' },
  
  // Relaxante
  { id: '5', name: 'Glass', artist: 'Anno Domini Beats', duration: '3:00', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Anno%20Domini%20Beats%20-%20Glass(MP3_160K).mp3`, category: 'Relaxante' },
  { id: '6', name: 'Stand Up', artist: 'Infraction', duration: '2:50', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Fashion%20Saxophone%20Rnb%20Beat%20by%20Infraction%20%5BNo%20Copyright%20Music%5D%20_%20Stand%20Up(MP3_160K).mp3`, category: 'Relaxante' },
  { id: '7', name: 'Land of Fire', artist: 'Feel', duration: '3:15', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Feel%20-%20Land%20of%20Fire%20(No%20Copyright%20Music)%20_%20Release%20Preview(MP3_320K).mp3`, category: 'Relaxante' },
  { id: '8', name: 'Pleasant', artist: 'SebastiAn', duration: '2:40', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/SebastiAn%20-%20Pleasant(MP3_320K).mp3`, category: 'Relaxante' },
  
  // Alegre
  { id: '9', name: 'Doraemon', artist: 'Unknown', duration: '2:20', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Doraemon(MP3_320K).mp3`, category: 'Alegre' },
  { id: '10', name: 'Okay Energy', artist: 'Unknown', duration: '2:35', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Okay%20Energy(MP3_160K).mp3`, category: 'Alegre' },
  { id: '11', name: 'Happy-Go-Lively', artist: 'SpongeBob Music', duration: '1:45', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/SpongeBob%20Music_Happy-Go-Lively(MP3_320K).mp3`, category: 'Alegre' },
  { id: '12', name: 'The Disc', artist: 'Infraction', duration: '2:55', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Upbeat%20Dance%20Funk%20Pop%20by%20Infraction%20%5BNo%20Copyright%20Music%5D%20_%20The%20Disc(MP3_320K).mp3`, category: 'Alegre' },
  
  // Urbano
  { id: '13', name: 'Getaway Instrumental', artist: 'Ryan Trahan', duration: '3:05', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Palm%20City-%20Getaway%20Instrumental%20(Ryan%20Trahan%20Donation%20List%20Music)%20(MP3_320K).mp3`, category: 'Urbano' },
  { id: '14', name: 'Past', artist: 'Alex Productions', duration: '2:25', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/PAST%20%C3%94%C3%87%C3%B4%20Alex-Productions%20(No%20Copyright%20Music)(MP3_160K).mp3`, category: 'Urbano' },
  { id: '15', name: 'The GOAT', artist: 'Alex Productions', duration: '3:00', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Powerful%20Upbeat%20Energetic%20Lo-Fi%20Hip%20Hop%20by%20Alex-Productions%20%5BNo%20Copyright%20Music%5D%20_%20The%20GOAT(MP3_160K).mp3`, category: 'Urbano' },
  { id: '16', name: 'Rebel', artist: 'Alex Productions', duration: '2:40', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Rebel%20%C3%94%C3%87%C3%B4%20Alex-Productions%20(No%20Copyright%20Music)(MP3_160K).mp3`, category: 'Urbano' },
  { id: '17', name: 'Uplifting Hip Hop', artist: 'Unknown', duration: '2:50', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Uplifting%20Hip%20Hop%20Background%20Music%20for%20Videos%20(Free%20For%20Non-Commercial%20Use)%20(MP3_160K).mp3`, category: 'Urbano' },
  
  // Acústico/Rock
  { id: '18', name: 'Promotional Video', artist: 'Alex Productions', duration: '2:45', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Powerful%20Indie%20Rock%20music%20by%20Alex-Productions%20(No%20Copyright%20Music)%20_%20Promotional%20Video(MP3_160K).mp3`, category: 'Acústico' },
  { id: '19', name: 'Bubbles', artist: 'Alex Productions', duration: '2:30', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Sport%20Percussive%20Rap%20by%20Alex-Productions%20(No%20Copyright%20Music)%20_%20Bubbles(MP3_160K).mp3`, category: 'Acústico' },
  { id: '20', name: 'Punch', artist: 'Infraction', duration: '2:55', url: `${CLOUDFRONT_URL}/${MUSIC_PATH}/Sport%20Rock%20Racing%20Workout%20by%20Infraction%20%5BNo%20Copyright%20Music%5D%20_%20Punch(MP3_160K).mp3`, category: 'Acústico' },
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
