import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Play, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getImageUrl } from '@/lib/s3';
import { cn } from '@/lib/utils';

interface Video {
  id: string;
  thumbnail_url: string | null;
  title: string | null;
  establishment: {
    name: string;
    logo_url: string | null;
  };
}

export function VilaTokPreview() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const { data, error } = await supabase
          .from('establishment_videos')
          .select(`
            id,
            thumbnail_url,
            title,
            establishment:establishments(name, logo_url)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        setVideos(data || []);
      } catch (error) {
        console.error('Error fetching VilaTok preview:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVideos();
  }, []);

  if (isLoading || videos.length === 0) return null;

  return (
    <section className="py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">VilaTok</h2>
        </div>
        <button
          onClick={() => navigate('/vilatok')}
          className="flex items-center gap-1 text-primary text-sm font-medium"
        >
          Ver todos <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Videos Grid */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {videos.map((video, index) => (
          <button
            key={video.id}
            onClick={() => navigate('/vilatok')}
            className={cn(
              "relative flex-shrink-0 w-28 h-48 rounded-xl overflow-hidden",
              "bg-muted transition-transform active:scale-95"
            )}
          >
            {/* Thumbnail */}
            {video.thumbnail_url ? (
              <img
                src={getImageUrl(video.thumbnail_url)}
                alt={video.title || 'VilaTok'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Flame className="w-8 h-8 text-primary/50" />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Play icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>

            {/* Establishment info */}
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-xs font-medium line-clamp-2 drop-shadow-lg">
                {video.establishment?.name || 'Estabelecimento'}
              </p>
            </div>

            {/* First item badge */}
            {index === 0 && (
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary rounded-full">
                <span className="text-[10px] text-primary-foreground font-bold">NOVO</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
