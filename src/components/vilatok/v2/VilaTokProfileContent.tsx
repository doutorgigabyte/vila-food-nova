import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Eye, Store, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Conteudo do perfil do estabelecimento — extraido pra ser reusavel
 * tanto na rota full-page (/vilatok/perfil/@slug) quanto no
 * VilaTokProfileSheet (modal bottom/side sheet aberto via gesture).
 *
 * Recebe `slug` por prop, busca os dados sozinho. Layout responsivo:
 * - Mobile: header sticky, avatar grande, grid 3 col
 * - Desktop (dentro do sheet): mais compacto
 *
 * Modo `sheet` esconde o header com voltar e mostra `onClose` X no topo.
 */

interface EstablishmentProfile {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
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

export interface VilaTokProfileContentProps {
  slug: string;
  mode?: "page" | "sheet";
  onClose?: () => void;
}

const formatCount = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
};

export function VilaTokProfileContent({
  slug,
  mode = "page",
  onClose,
}: VilaTokProfileContentProps) {
  const navigate = useNavigate();
  const cleanSlug = slug?.replace(/^@/, "") ?? "";

  const [establishment, setEstablishment] = useState<EstablishmentProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    if (!cleanSlug) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: est, error } = await supabase
        .from("establishments")
        .select("id, name, slug, logo_url, banner_url, description")
        .eq("slug", cleanSlug)
        .eq("status", "active")
        .single();

      if (cancelled) return;

      if (error || !est) {
        setEstablishment(null);
        setLoading(false);
        return;
      }

      setEstablishment(est as EstablishmentProfile);

      const { data: vids } = await supabase
        .from("establishment_videos")
        .select("id, video_url, thumbnail_url, title, views_count, created_at")
        .eq("establishment_id", est.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (vids) {
        setVideos(vids as Video[]);
        setTotalViews(vids.reduce((s, v) => s + (v.views_count || 0), 0));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [cleanSlug]);

  const handleVideoClick = (videoId: string) => {
    if (mode === "sheet") {
      onClose?.();
      navigate(`/vilatok?video=${videoId}`);
    } else {
      navigate(`/vilatok?video=${videoId}`);
    }
  };

  if (loading) {
    return (
      <div className="relative bg-black text-white min-h-full">
        {mode === "sheet" && (
          <button
            onClick={onClose}
            className="vt-touch absolute top-3 right-3 vt-glass rounded-full flex items-center justify-center z-10"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
        <div className="flex flex-col items-center gap-4 py-10 px-4">
          <Skeleton className="h-24 w-24 rounded-full bg-white/10" />
          <Skeleton className="h-6 w-40 bg-white/10" />
          <Skeleton className="h-4 w-24 bg-white/10" />
        </div>
        <div className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[9/16] bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-black text-white gap-4 py-16">
        <p className="text-lg">Perfil não encontrado</p>
        <Button variant="outline" onClick={() => (mode === "sheet" ? onClose?.() : navigate(-1))}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="relative bg-black text-white min-h-full">
      {/* Close button — so no modo sheet */}
      {mode === "sheet" && (
        <button
          onClick={onClose}
          className="vt-touch absolute top-3 right-3 vt-glass rounded-full flex items-center justify-center z-10"
          aria-label="Fechar perfil"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Banner com gradiente — visual moderno */}
      {establishment.banner_url ? (
        <div className="relative w-full h-32 overflow-hidden">
          <img
            src={establishment.banner_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />
        </div>
      ) : (
        <div className="w-full h-24 bg-gradient-to-br from-primary/30 via-accent/10 to-transparent" />
      )}

      {/* Avatar + meta — ascendendo sobre o banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        className="flex flex-col items-center gap-3 px-4 -mt-12"
      >
        {/* Avatar com ring animado se tem videos */}
        <button
          onClick={() => {
            if (videos.length === 0) return;
            if (mode === "sheet") onClose?.();
            navigate(`/vilatok?establishment=${establishment.slug}`);
          }}
          className="relative group cursor-pointer"
        >
          {videos.length > 0 && (
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-0.5"
              style={{
                animation: "spin 4s linear infinite",
              }}
            >
              <div className="w-full h-full rounded-full bg-black" />
            </div>
          )}
          <div className="relative w-24 h-24 rounded-full p-0.5">
            <Avatar className="h-full w-full ring-2 ring-black">
              <AvatarImage
                src={establishment.logo_url || ""}
                alt={establishment.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {establishment.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          {videos.length > 0 && (
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          )}
        </button>

        <div className="text-center">
          <h1 className="text-xl font-bold vt-text-on-media">{establishment.name}</h1>
          <p className="text-white/60 text-sm">@{establishment.slug}</p>
        </div>

        {establishment.description && (
          <p className="text-sm text-white/80 text-center max-w-xs leading-relaxed">
            {establishment.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-8 mt-1">
          <div className="text-center">
            <span className="font-bold text-lg block">{videos.length}</span>
            <p className="text-xs text-white/60">vídeos</p>
          </div>
          <div className="text-center">
            <span className="font-bold text-lg block">{formatCount(totalViews)}</span>
            <p className="text-xs text-white/60">visualizações</p>
          </div>
        </div>

        <Button
          onClick={() => {
            if (mode === "sheet") onClose?.();
            navigate(`/loja/${establishment.slug}`);
          }}
          className="mt-2 gap-2"
        >
          <Store className="w-4 h-4" />
          Visitar Loja
        </Button>
      </motion.div>

      {/* Videos grid */}
      <div className="mt-6 border-t border-white/10">
        <div className="grid grid-cols-3 gap-0.5">
          {videos.map((video, idx) => (
            <motion.button
              key={video.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.28 }}
              onClick={() => handleVideoClick(video.id)}
              className="relative aspect-[9/16] bg-white/5 overflow-hidden group vt-touch"
            >
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title || "Video"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  src={video.video_url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs vt-text-on-media">
                <Eye className="h-3 w-3" />
                <span>{formatCount(video.views_count || 0)}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-white/60">
            <Play className="h-12 w-12 mb-4 opacity-40" />
            <p>Nenhum vídeo publicado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
