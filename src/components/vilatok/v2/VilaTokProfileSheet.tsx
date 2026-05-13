import { useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { VilaTokProfileContent } from "./VilaTokProfileContent";

/**
 * Sheet que abre o perfil do estabelecimento sem destruir o estado
 * do feed por baixo. Animacao spring-based com Framer Motion.
 *
 * Layout:
 * - Mobile: side sheet entrando da direita (90% da viewport)
 * - Desktop: side sheet (520px max-width)
 *
 * Pode ser fechado por:
 * - X button (dentro do VilaTokProfileContent quando mode="sheet")
 * - Tap no backdrop
 * - Drag pra direita (fecha quando passa de 30% da largura ou flick rapido)
 * - ESC key
 *
 * Visualmente o sheet tem glassmorphism elevado pra distinguir do feed.
 */

export interface VilaTokProfileSheetProps {
  /** Slug do estabelecimento, sem @. null = sheet fechado. */
  slug: string | null;
  onClose: () => void;
}

const SHEET_WIDTH_VW = 90;          // 90vw em mobile
const SHEET_MAX_WIDTH_PX = 520;     // desktop cap
const DISMISS_THRESHOLD_PX = 120;
const DISMISS_VELOCITY = 0.4;

export function VilaTokProfileSheet({ slug, onClose }: VilaTokProfileSheetProps) {
  const x = useMotionValue(0);

  // Opacity do backdrop muda conforme drag (feedback visual)
  const backdropOpacity = useTransform(x, [0, 300], [1, 0]);

  // Reseta drag quando fecha
  useEffect(() => {
    if (!slug) {
      x.set(0);
    }
  }, [slug, x]);

  // ESC pra fechar
  useEffect(() => {
    if (!slug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slug, onClose]);

  // Trava scroll do body quando sheet aberto
  useEffect(() => {
    if (!slug) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [slug]);

  return (
    <AnimatePresence>
      {slug && (
        <div
          className="fixed inset-0"
          style={{ zIndex: "var(--vt-z-sheet)" as never }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            style={{ opacity: backdropOpacity as unknown as number }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Perfil do estabelecimento"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 480,
              damping: 40,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.4 }}
            dragMomentum={false}
            style={{
              x,
              width: `min(${SHEET_WIDTH_VW}vw, ${SHEET_MAX_WIDTH_PX}px)`,
            }}
            onDragEnd={(_, info) => {
              if (info.offset.x > DISMISS_THRESHOLD_PX || info.velocity.x > DISMISS_VELOCITY * 1000) {
                onClose();
              } else {
                x.set(0);
              }
            }}
            className="absolute top-0 right-0 h-full vt-glass-elevated overflow-y-auto vt-gpu shadow-2xl"
          >
            {/* Drag handle — afordancia visual */}
            <div className="sticky top-0 z-20 flex items-center justify-center py-2 pointer-events-none">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>

            <VilaTokProfileContent slug={slug} mode="sheet" onClose={onClose} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
