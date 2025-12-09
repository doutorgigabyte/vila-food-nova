import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface EstablishmentStory {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  hasVideos: boolean;
}

interface VilaTokStoriesRowProps {
  mainCategorySlug?: string | null;
}

const VilaTokStoriesRow = ({ mainCategorySlug }: VilaTokStoriesRowProps) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [establishments, setEstablishments] = useState<EstablishmentStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstablishmentsWithVideos = async () => {
      try {
        // Get establishments that have active videos marked for marketplace display
        const { data: videosData } = await supabase
          .from("establishment_videos")
          .select("establishment_id")
          .eq("is_active", true)
          .eq("display_in_marketplace", true);

        const establishmentIdsWithVideos = new Set(
          videosData?.map((v) => v.establishment_id) || []
        );

        // Build establishments query
        let establishmentQuery = supabase
          .from("establishments")
          .select("id, name, slug, logo_url, segment_id")
          .eq("is_open", true)
          .limit(20);

        const { data: establishments } = await establishmentQuery;

        if (establishments) {
          let filteredEstablishments = establishments;

          // Filter by category if specified
          if (mainCategorySlug) {
            const { data: mainCategory } = await supabase
              .from('main_categories')
              .select('id')
              .eq('slug', mainCategorySlug)
              .single();

            if (mainCategory) {
              const { data: segments } = await supabase
                .from('segments')
                .select('id')
                .eq('parent_category_id', mainCategory.id);

              const segmentIds = new Set(segments?.map(s => s.id) || []);
              
              filteredEstablishments = establishments.filter(est => 
                est.segment_id && segmentIds.has(est.segment_id)
              );
            }
          }

          const sorted = filteredEstablishments
            .map((est) => ({
              ...est,
              hasVideos: establishmentIdsWithVideos.has(est.id),
            }))
            .sort((a, b) => (a.hasVideos === b.hasVideos ? 0 : a.hasVideos ? -1 : 1));
          
          setEstablishments(sorted);
        }
      } catch (error) {
        console.error("Error fetching establishments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEstablishmentsWithVideos();
  }, [mainCategorySlug]);

  const handleStoryClick = (est: EstablishmentStory) => {
    if (est.hasVideos) {
      const url = mainCategorySlug 
        ? `/vilatok?category=${mainCategorySlug}` 
        : "/vilatok";
      navigate(url);
    } else {
      navigate(`/loja/${est.slug}`);
    }
  };

  const handleViewAll = () => {
    const url = mainCategorySlug 
      ? `/vilatok?category=${mainCategorySlug}` 
      : "/vilatok";
    navigate(url);
  };

  if (loading) {
    return (
      <section className="py-2">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted animate-pulse" />
                <div className="w-10 h-2 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (establishments.length === 0) {
    return null;
  }

  return (
    <section className="py-2">
      <div className="container mx-auto px-4">
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {establishments.map((est) => (
            <button
              key={est.id}
              onClick={() => handleStoryClick(est)}
              className="flex flex-col items-center gap-1 shrink-0 group relative"
            >
              {/* Story Ring */}
              <div
                className={cn(
                  "w-14 h-14 md:w-16 md:h-16 rounded-full p-[3px] transition-transform group-hover:scale-105 group-active:scale-95",
                  est.hasVideos
                    ? "bg-gradient-to-br from-primary via-red-500 to-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              >
                {/* Inner White Border */}
                <div className="w-full h-full rounded-full bg-background p-[2px]">
                  {/* Logo */}
                  <div className="w-full h-full rounded-full overflow-hidden bg-muted">
                    {est.logo_url ? (
                      <img
                        src={est.logo_url}
                        alt={est.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(est.name)}&background=random&color=fff&size=100`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                        <span className="text-lg font-bold text-primary">
                          {est.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Play indicator for establishments with videos */}
              {est.hasVideos && (
                <div className="absolute bottom-4 md:bottom-5 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                  <Play className="h-2.5 w-2.5 text-primary-foreground fill-primary-foreground" />
                </div>
              )}

              {/* Name - truncated */}
              <span className="text-[10px] md:text-xs text-muted-foreground text-center w-14 md:w-16 truncate">
                {est.name.split(' ')[0]}
              </span>
            </button>
          ))}

          {/* View All Button */}
          <button
            onClick={handleViewAll}
            className="flex flex-col items-center gap-1 shrink-0 group"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted/60 flex items-center justify-center transition-all group-hover:bg-muted group-active:scale-95">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-[10px] md:text-xs text-muted-foreground">
              Ver mais
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default VilaTokStoriesRow;
