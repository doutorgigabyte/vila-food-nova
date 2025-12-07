import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface EstablishmentProfile {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
}

interface Video {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  views_count: number;
  created_at: string;
}

export default function VilaTokProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState<EstablishmentProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);

  // Remove @ from username if present
  const cleanUsername = username?.replace('@', '') || '';

  useEffect(() => {
    async function fetchProfile() {
      if (!cleanUsername) return;

      setLoading(true);

      // Fetch establishment by slug
      const { data: estData, error: estError } = await supabase
        .from('establishments')
        .select('id, name, slug, logo_url, description')
        .eq('slug', cleanUsername)
        .eq('status', 'active')
        .single();

      if (estError || !estData) {
        console.error('Establishment not found:', estError);
        setLoading(false);
        return;
      }

      setEstablishment(estData);

      // Fetch videos for this establishment
      const { data: videosData, error: videosError } = await supabase
        .from('establishment_videos')
        .select('id, video_url, thumbnail_url, title, views_count, created_at')
        .eq('establishment_id', estData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!videosError && videosData) {
        setVideos(videosData);
        setTotalViews(videosData.reduce((sum, v) => sum + (v.views_count || 0), 0));
      }

      setLoading(false);
    }

    fetchProfile();
  }, [cleanUsername]);

  const handleVideoClick = (videoId: string) => {
    // Navigate to VilaTok with specific video
    navigate(`/vilatok?video=${videoId}`);
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="p-4">
          <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
        </div>
        <div className="flex flex-col items-center gap-4 p-6">
          <Skeleton className="h-24 w-24 rounded-full bg-white/10" />
          <Skeleton className="h-6 w-40 bg-white/10" />
          <Skeleton className="h-4 w-24 bg-white/10" />
        </div>
        <div className="grid grid-cols-3 gap-1 p-1">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-[9/16] bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-lg">Perfil não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/vilatok')}>
          Voltar ao VilaTok
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold">@{establishment.slug}</span>
        </div>
      </header>

      {/* Profile Section */}
      <div className="flex flex-col items-center gap-4 py-8 px-4">
        <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-black">
          <AvatarImage src={establishment.logo_url || ''} alt={establishment.name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {establishment.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="text-center">
          <h1 className="text-xl font-bold">{establishment.name}</h1>
          <p className="text-white/60">@{establishment.slug}</p>
        </div>

        {establishment.description && (
          <p className="text-sm text-white/80 text-center max-w-xs">
            {establishment.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-8 mt-2">
          <div className="text-center">
            <span className="font-bold text-lg">{videos.length}</span>
            <p className="text-xs text-white/60">vídeos</p>
          </div>
          <div className="text-center">
            <span className="font-bold text-lg">{formatCount(totalViews)}</span>
            <p className="text-xs text-white/60">visualizações</p>
          </div>
        </div>

        {/* Visit Store Button */}
        <Button
          onClick={() => navigate(`/loja/${establishment.slug}`)}
          className="mt-2 bg-primary hover:bg-primary/90"
        >
          Visitar Loja
        </Button>
      </div>

      {/* Videos Grid - Reels Style */}
      <div className="border-t border-white/10">
        <div className="grid grid-cols-3 gap-0.5">
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => handleVideoClick(video.id)}
              className="relative aspect-[9/16] bg-white/5 overflow-hidden group"
            >
              {/* Thumbnail or Video Preview */}
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title || 'Video'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={video.video_url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Views Count */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                <Eye className="h-3 w-3" />
                <span>{formatCount(video.views_count || 0)}</span>
              </div>
            </button>
          ))}
        </div>

        {videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-white/60">
            <Play className="h-12 w-12 mb-4" />
            <p>Nenhum vídeo publicado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
