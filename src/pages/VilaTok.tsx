import { useCallback, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Flame } from "lucide-react";

import { useVilaTok } from "@/hooks/useVilaTok";
import { VilaTokFeedV2 } from "@/components/vilatok/v2/VilaTokFeedV2";
import { VilaTokTutorial } from "@/components/vilatok/VilaTokTutorial";
import { toast } from "sonner";

/**
 * VilaTok page — orquestrador externo. Estado do feed (estabelecimento/video
 * ativo, gestos, animacoes) vive dentro do VilaTokFeedV2.
 *
 * Esta page e responsavel apenas por:
 * - Data fetching (useVilaTok hook)
 * - Loading/empty states
 * - Tutorial first-access
 * - Toast de erro nas mutations (like)
 *
 * Refactor: substitui o swiper duplo legado pelo novo gesture system
 * com axis lock + edge-pull pra perfil. Ver
 * src/components/vilatok/v2/useVilaTokGestures.ts pra detalhes.
 */

const TUTORIAL_STORAGE_KEY = "vilatok_tutorial_completed";

export default function VilaTok() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");

  const {
    establishments,
    isLoading,
    likedVideos,
    toggleLike,
    incrementViews,
    incrementShares,
  } = useVilaTok({ mainCategorySlug: categorySlug });

  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShowTutorial(!localStorage.getItem(TUTORIAL_STORAGE_KEY));
    }
  }, []);

  const handleTutorialComplete = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    setShowTutorial(false);
  }, []);

  const handleLike = useCallback(
    async (videoId: string) => {
      try {
        return await toggleLike(videoId);
      } catch (e) {
        toast.error("Erro ao curtir");
        return null;
      }
    },
    [toggleLike]
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Flame className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }

  if (!establishments.length) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8">
        <button
          onClick={() => navigate(-1)}
          className="vt-touch absolute top-4 left-4 vt-glass rounded-full flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <Flame className="w-20 h-20 text-primary mb-6" />
        <h2 className="text-white text-2xl font-bold mb-2">VilaTok</h2>
        <p className="text-white/70 text-center mb-8">Nenhum vídeo disponível ainda.</p>
        <button
          onClick={() => navigate("/")}
          className="vt-touch px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium active:scale-95 transition-transform"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <>
      <VilaTokFeedV2
        establishments={establishments}
        likedVideos={likedVideos}
        onLike={handleLike}
        onIncrementViews={incrementViews}
        onIncrementShares={incrementShares}
      />
      {showTutorial && <VilaTokTutorial onComplete={handleTutorialComplete} />}
    </>
  );
}
