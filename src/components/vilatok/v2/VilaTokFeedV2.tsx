import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { ArrowLeft, Flame, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import type { EstablishmentWithVideos } from "@/hooks/useVilaTok";
import { VilaTokPlayerV2 } from "./VilaTokPlayerV2";
import { VilaTokProfileSheet } from "./VilaTokProfileSheet";
import { useVilaTokGestures } from "./useVilaTokGestures";
import { VilaTokOverlay } from "@/components/vilatok/VilaTokOverlay";
import { VilaTokSidebar } from "@/components/vilatok/VilaTokSidebar";
import { VilaTokProgressBars } from "@/components/vilatok/VilaTokProgressBars";
import { VilaTokNavigation } from "@/components/vilatok/VilaTokNavigation";
import { VilaTokComments } from "@/components/vilatok/VilaTokComments";

/**
 * Feed V2 — substitui o swiper duplo do VilaTok.tsx legado.
 *
 * Arquitetura:
 * - 1 gesture controller (useVilaTokGestures) decide o eixo em <12px
 * - Vertical pan move um motion value `verticalY` (entre estabelecimentos)
 * - Horizontal pan move um motion value `horizontalX` (entre videos do mesmo estabelecimento)
 * - EDGE_RIGHT_PULL abre o ProfileSheet (sem perder estado do feed)
 * - Virtual scroll: so renderiza estabelecimentos N-1, N, N+1
 *
 * Bugs do legado resolvidos:
 * 1. Conflito de gesto pull-to-profile vs slide horizontal: agora separado em eixos
 *    (horizontal sempre = trocar video, edge-pull = abrir perfil)
 * 2. Pull progress visivel em tempo real (motion value -> opacity/scale)
 * 3. Sidebar/overlay nao precisam de hack `closest('button')` — pointer-events isolado
 * 4. Long press funciona sem race com pan
 * 5. Tap zonal preciso (filterTaps no use-gesture)
 */

const SLOT_HEIGHT_VH = 100;
const COMMIT_DISTANCE = 80;
const COMMIT_VELOCITY = 0.5;

interface SpringConfig {
  type: "spring";
  stiffness: number;
  damping: number;
}

const SNAP_SPRING: SpringConfig = { type: "spring", stiffness: 480, damping: 40 };
const SOFT_SPRING: SpringConfig = { type: "spring", stiffness: 240, damping: 28 };

export interface VilaTokFeedV2Props {
  establishments: EstablishmentWithVideos[];
  likedVideos: Set<string>;
  onLike: (videoId: string) => Promise<unknown>;
  onIncrementViews: (videoId: string) => void;
  onIncrementShares: (videoId: string) => void;
  onCommentsCountChange?: (videoId: string, count: number) => void;
}

export function VilaTokFeedV2({
  establishments,
  likedVideos,
  onLike,
  onIncrementViews,
  onIncrementShares,
}: VilaTokFeedV2Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Estado de navegacao
  const [activeEstIdx, setActiveEstIdx] = useState(0);
  const [activeVidIdx, setActiveVidIdx] = useState<Map<number, number>>(new Map());
  const [currentProgress, setCurrentProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Motion values pra pan em tempo real (Framer Motion = GPU-accelerated)
  const verticalY = useMotionValue(0);
  const horizontalX = useMotionValue(0);
  const sheetPullX = useMotionValue(0); // pull progress da right-edge -> sheet

  // Visibilidade do hint "puxar pra abrir perfil"
  const pullHintOpacity = useTransform(sheetPullX, [-10, -120], [0, 1]);
  const pullHintScale = useTransform(sheetPullX, [-10, -120], [0.8, 1]);

  const containerRef = useRef<HTMLDivElement>(null);
  const slotHeightPxRef = useRef(0);

  // Mede o slot uma vez (e em resize)
  useEffect(() => {
    const measure = () => {
      slotHeightPxRef.current = containerRef.current?.clientHeight ?? window.innerHeight;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const getVidIdx = useCallback(
    (estIdx: number) => activeVidIdx.get(estIdx) ?? 0,
    [activeVidIdx]
  );

  // ---------------- Navegacao programatica ----------------

  const goToEstablishment = useCallback(
    (newIdx: number, opts: { animated?: boolean } = {}) => {
      const clamped = Math.max(0, Math.min(establishments.length - 1, newIdx));
      const slotH = slotHeightPxRef.current;

      if (opts.animated !== false) {
        animate(verticalY, -clamped * slotH, SNAP_SPRING);
      } else {
        verticalY.set(-clamped * slotH);
      }

      setActiveEstIdx(clamped);
      setCurrentProgress(0);
      // Reset video index do novo estabelecimento
      setActiveVidIdx((prev) => {
        if (prev.get(clamped) === 0) return prev;
        const next = new Map(prev);
        next.set(clamped, 0);
        return next;
      });
      horizontalX.set(0);
    },
    [establishments.length, verticalY, horizontalX]
  );

  const goToVideo = useCallback(
    (estIdx: number, newVidIdx: number, opts: { animated?: boolean } = {}) => {
      const est = establishments[estIdx];
      if (!est) return;
      const clamped = Math.max(0, Math.min(est.videos.length - 1, newVidIdx));
      const slotW = containerRef.current?.clientWidth ?? window.innerWidth;

      if (opts.animated !== false) {
        animate(horizontalX, -clamped * slotW, SNAP_SPRING);
      } else {
        horizontalX.set(-clamped * slotW);
      }

      setActiveVidIdx((prev) => {
        const next = new Map(prev);
        next.set(estIdx, clamped);
        return next;
      });
      setCurrentProgress(0);
    },
    [establishments, horizontalX]
  );

  const handleAutoAdvance = useCallback(() => {
    const est = establishments[activeEstIdx];
    if (!est) return;
    const curVid = getVidIdx(activeEstIdx);

    if (curVid < est.videos.length - 1) {
      goToVideo(activeEstIdx, curVid + 1);
    } else if (activeEstIdx < establishments.length - 1) {
      goToEstablishment(activeEstIdx + 1);
    }
  }, [activeEstIdx, establishments, getVidIdx, goToEstablishment, goToVideo]);

  // ---------------- Gesture handlers ----------------

  const openProfileSheet = useCallback(() => {
    const est = establishments[activeEstIdx];
    if (est) setProfileSlug(est.establishment.slug);
  }, [activeEstIdx, establishments]);

  const bind = useVilaTokGestures({
    disabled: !!profileSlug || showComments,
    onDrag: (d) => {
      if (d.state === "VERTICAL") {
        const slotH = slotHeightPxRef.current;
        const base = -activeEstIdx * slotH;
        // Resistencia nas bordas
        let target = base + d.my;
        if (activeEstIdx === 0 && d.my > 0) target = base + d.my * 0.3;
        if (activeEstIdx === establishments.length - 1 && d.my < 0) target = base + d.my * 0.3;
        verticalY.set(target);
      } else if (d.state === "HORIZONTAL") {
        const slotW = containerRef.current?.clientWidth ?? window.innerWidth;
        const est = establishments[activeEstIdx];
        const curVid = getVidIdx(activeEstIdx);
        const base = -curVid * slotW;
        let target = base + d.mx;
        if (curVid === 0 && d.mx > 0) target = base + d.mx * 0.3;
        if (est && curVid === est.videos.length - 1 && d.mx < 0) target = base + d.mx * 0.3;
        horizontalX.set(target);
      } else if (d.state === "EDGE_RIGHT_PULL") {
        // Pull progress visual: limit negativo (mx < 0)
        sheetPullX.set(Math.max(-200, d.mx));
      }
    },
    onEnd: (d) => {
      if (d.state === "TAP") {
        if (d.tapZone === "left") {
          const cur = getVidIdx(activeEstIdx);
          if (cur > 0) goToVideo(activeEstIdx, cur - 1);
        } else if (d.tapZone === "right") {
          const est = establishments[activeEstIdx];
          const cur = getVidIdx(activeEstIdx);
          if (est && cur < est.videos.length - 1) {
            goToVideo(activeEstIdx, cur + 1);
          } else if (activeEstIdx < establishments.length - 1) {
            goToEstablishment(activeEstIdx + 1);
          }
        }
        // Center tap nao faz nada — player nao pausa por tap, so por long press
        return;
      }

      if (d.state === "VERTICAL") {
        const commit =
          Math.abs(d.my) > COMMIT_DISTANCE || Math.abs(d.vy) > COMMIT_VELOCITY;
        if (commit && d.my < 0) goToEstablishment(activeEstIdx + 1);
        else if (commit && d.my > 0) goToEstablishment(activeEstIdx - 1);
        else animate(verticalY, -activeEstIdx * slotHeightPxRef.current, SNAP_SPRING);
        return;
      }

      if (d.state === "HORIZONTAL") {
        const slotW = containerRef.current?.clientWidth ?? window.innerWidth;
        const est = establishments[activeEstIdx];
        const curVid = getVidIdx(activeEstIdx);
        const commit =
          Math.abs(d.mx) > COMMIT_DISTANCE || Math.abs(d.vx) > COMMIT_VELOCITY;
        if (commit && d.mx < 0 && est && curVid < est.videos.length - 1) {
          goToVideo(activeEstIdx, curVid + 1);
        } else if (commit && d.mx > 0 && curVid > 0) {
          goToVideo(activeEstIdx, curVid - 1);
        } else {
          animate(horizontalX, -curVid * slotW, SNAP_SPRING);
        }
        return;
      }

      if (d.state === "EDGE_RIGHT_PULL") {
        const commit = d.mx < -120 || d.vx < -COMMIT_VELOCITY;
        if (commit) {
          openProfileSheet();
        }
        // Reseta o motion value (mesmo se commitou — proxima abertura comeca de 0)
        animate(sheetPullX, 0, SOFT_SPRING);
        return;
      }
    },
    onLongPress: () => setIsLongPressing(true),
    onLongPressRelease: () => setIsLongPressing(false),
  });

  // ---------------- Actions: like, comment, share, buy ----------------

  const activeEst = establishments[activeEstIdx];
  const activeVid = activeEst?.videos[getVidIdx(activeEstIdx)];

  const handleShare = useCallback(async () => {
    if (!activeEst || !activeVid) return;
    const url = `${window.location.origin}/vilatok?v=${activeVid.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: activeVid.title || activeEst.establishment.name,
          text: activeVid.description || `Confira ${activeEst.establishment.name} no VilaTok!`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
      onIncrementShares(activeVid.id);
    } catch (e) {
      // silently ignore — usuario cancelou share
    }
  }, [activeEst, activeVid, onIncrementShares]);

  const handleAddToCart = useCallback(async () => {
    if (!activeEst || !activeVid?.product) return;
    await addToCart(
      {
        id: activeVid.product.id,
        name: activeVid.product.name,
        price: activeVid.product.price,
        promotional_price: activeVid.product.promotional_price,
        image_url: activeVid.product.image_url,
        establishment_id: activeEst.establishment.id,
      },
      {
        id: activeEst.establishment.id,
        name: activeEst.establishment.name,
        slug: activeEst.establishment.slug,
        logo_url: activeEst.establishment.logo_url,
        vila_id: null,
        delivery_base_fee: 0,
        min_order_value: 0,
        accepts_pickup: true,
        accepts_delivery: true,
      }
    );
  }, [activeEst, activeVid, addToCart]);

  // ---------------- Virtual scroll: render apenas N-1, N, N+1 ----------------

  const renderableEstIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = -1; i <= 1; i++) {
      const idx = activeEstIdx + i;
      if (idx >= 0 && idx < establishments.length) indices.push(idx);
    }
    return indices;
  }, [activeEstIdx, establishments.length]);

  // ---------------- Render ----------------

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden vt-pan-none vt-gpu"
      {...bind()}
      style={{ zIndex: "var(--vt-z-bg)" as never }}
    >
      {/* Centralizador 9:16 */}
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="relative w-full h-full md:w-auto md:flex-shrink-0"
          style={{
            maxWidth: "calc(100vh * 9 / 16)",
            maxHeight: "100vh",
            aspectRatio: "9/16",
          }}
        >
          {/* Header */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"
            style={{ zIndex: "var(--vt-z-header)" as never }}
          >
            <button
              onClick={() => navigate(-1)}
              className="vt-touch vt-glass rounded-full flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2 pointer-events-none">
              <Flame className="w-6 h-6 text-primary" />
              <span className="text-white font-bold text-lg vt-text-on-media">VilaTok</span>
            </div>
            <button
              onClick={openProfileSheet}
              className="vt-touch vt-glass rounded-full flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
              aria-label="Abrir perfil"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Progress bars */}
          {activeEst && (
            <VilaTokProgressBars
              totalVideos={activeEst.videos.length}
              currentVideoIndex={getVidIdx(activeEstIdx)}
              currentProgress={currentProgress}
            />
          )}

          {/* Vertical track (estabelecimentos) */}
          <motion.div
            className="absolute inset-0 vt-gpu"
            style={{ y: verticalY }}
          >
            {renderableEstIndices.map((estIdx) => {
              const est = establishments[estIdx];
              const isActiveEst = estIdx === activeEstIdx;
              const curVidIdx = getVidIdx(estIdx);

              return (
                <div
                  key={est.establishment.id}
                  className="absolute left-0 right-0 vt-gpu"
                  style={{
                    top: `${estIdx * SLOT_HEIGHT_VH}vh`,
                    height: `${SLOT_HEIGHT_VH}vh`,
                  }}
                >
                  {/* Horizontal track (videos) — so anima no estabelecimento ativo */}
                  <motion.div
                    className="absolute inset-0 vt-gpu"
                    style={{ x: isActiveEst ? horizontalX : -curVidIdx * (containerRef.current?.clientWidth ?? 0) }}
                  >
                    {est.videos.map((video, vidIdx) => {
                      const isActiveVid = isActiveEst && vidIdx === curVidIdx;
                      const isNearVid = Math.abs(vidIdx - curVidIdx) <= 1;
                      const slotW = containerRef.current?.clientWidth ?? 0;

                      return (
                        <div
                          key={video.id}
                          className="absolute top-0 h-full vt-gpu"
                          style={{
                            left: `${vidIdx * (slotW || 0)}px`,
                            width: slotW ? `${slotW}px` : "100vw",
                          }}
                        >
                          <div className="relative w-full h-full">
                            {isNearVid && (
                              <VilaTokPlayerV2
                                videoUrl={video.video_url}
                                thumbnailUrl={video.thumbnail_url}
                                musicUrl={video.music_url}
                                isActive={isActiveVid}
                                isPaused={isActiveVid && isLongPressing}
                                onProgressUpdate={isActiveVid ? setCurrentProgress : undefined}
                                onAutoAdvance={isActiveVid ? handleAutoAdvance : undefined}
                                onViewCountIncrement={() => onIncrementViews(video.id)}
                              />
                            )}

                            <VilaTokOverlay
                              establishment={est.establishment}
                              video={{ title: video.title, description: video.description }}
                              product={video.product}
                              onProductClick={handleAddToCart}
                            />

                            <VilaTokSidebar
                              likesCount={video.likes_count}
                              sharesCount={video.shares_count}
                              commentsCount={video.comments_count || 0}
                              isLiked={likedVideos.has(video.id)}
                              hasProduct={!!video.product}
                              onLike={async () => {
                                const result = await onLike(video.id);
                                if (!result) {
                                  toast.error("Faça login para curtir", {
                                    action: {
                                      label: "Entrar",
                                      onClick: () => navigate("/auth"),
                                    },
                                  });
                                }
                              }}
                              onComment={() => {
                                if (!user) {
                                  toast.error("Faça login para comentar", {
                                    action: {
                                      label: "Entrar",
                                      onClick: () => navigate("/auth"),
                                    },
                                  });
                                  return;
                                }
                                setShowComments(true);
                              }}
                              onShare={handleShare}
                              onBuy={() => {
                                if (video.product) navigate(`/produto/${video.product.id}`);
                              }}
                              onStore={() => navigate(`/loja/${est.establishment.slug}`)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              );
            })}
          </motion.div>

          {/* Navigation indicator */}
          <VilaTokNavigation
            totalEstablishments={establishments.length}
            currentEstablishmentIndex={activeEstIdx}
            totalVideos={activeEst?.videos.length || 0}
            currentVideoIndex={getVidIdx(activeEstIdx)}
          />

          {/* Pull-to-profile hint (visual feedback do edge swipe) */}
          <motion.div
            style={{
              opacity: pullHintOpacity,
              scale: pullHintScale,
              zIndex: "var(--vt-z-pull-hint)" as never,
            }}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none"
            )}
          >
            <div className="vt-glass-elevated rounded-full w-14 h-14 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-white/90 font-medium vt-text-on-media whitespace-nowrap">
              Soltar para abrir
            </span>
          </motion.div>
        </div>
      </div>

      {/* Comments sheet */}
      <VilaTokComments
        videoId={activeVid?.id || ""}
        isOpen={showComments && !!activeVid}
        onClose={() => setShowComments(false)}
        commentsCount={activeVid?.comments_count || 0}
        onCommentsCountChange={() => {
          // hook do useVilaTok ja propaga via realtime
        }}
      />

      {/* Profile sheet */}
      <VilaTokProfileSheet slug={profileSlug} onClose={() => setProfileSlug(null)} />
    </div>
  );
}
