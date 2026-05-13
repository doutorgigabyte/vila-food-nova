import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { TVSlideTemplateProps } from "./types";

/**
 * Template V2: Hero Banner
 * --------------------------------
 * Layout: fullbleed media com Ken Burns + headline gigante com gradient
 * mask + badge animado entrando do topo + CTA pulse.
 *
 * Ideal para: anuncios institucionais, banners de campanha, novos produtos.
 *
 * Anim:
 * - Bg: Ken Burns scale 1.05 → 1.0 ao longo de 8s
 * - Title: fade up + letter-by-letter reveal
 * - Subtitle: fade up delayed
 * - Badge: spring scale-in
 */
export function HeroBannerTemplate({ slide, establishment, isActive }: TVSlideTemplateProps) {
  const isVideo = slide.media_type === "video" || /\.(mp4|webm|mov)$/i.test(slide.image_url);
  const accent = establishment.primary_color || "hsl(var(--primary))";

  const title = slide.title || establishment.name;
  const titleWords = title.split(" ");

  return (
    <motion.div
      key={slide.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="relative w-full h-full overflow-hidden bg-black"
    >
      {/* Bg media com Ken Burns */}
      <motion.div
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "linear" }}
        className="absolute inset-0"
      >
        {isVideo ? (
          <video
            src={slide.image_url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={slide.image_url}
            alt={title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        )}
      </motion.div>

      {/* Vignette + gradient pra legibilidade do texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30" />
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          background: `radial-gradient(circle at 30% 70%, ${accent}40 0%, transparent 60%)`,
        }}
      />

      {/* Badge */}
      <AnimatePresence>
        {slide.badge_text && isActive && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 24,
              delay: 0.3,
            }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20"
          >
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full vt-glass-elevated"
              style={{ borderColor: `${accent}80` }}
            >
              <Sparkles className="w-4 h-4" style={{ color: accent }} />
              <span className="text-white font-bold text-sm tracking-widest uppercase vt-text-on-media">
                {slide.badge_text}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Headline gigante — letter-by-letter reveal */}
      <div className="absolute left-0 right-0 bottom-0 p-16 z-10">
        <h1 className="text-white font-black leading-[0.95] tracking-tight mb-6">
          {titleWords.map((word, i) => (
            <motion.span
              key={`${slide.id}-w-${i}`}
              initial={{ opacity: 0, y: 60 }}
              animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
              transition={{
                duration: 0.7,
                delay: 0.4 + i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="inline-block mr-3"
              style={{
                fontSize: "clamp(3rem, 9vw, 8rem)",
                textShadow: "0 4px 24px rgba(0,0,0,0.7)",
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {slide.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.5,
              delay: 0.4 + titleWords.length * 0.12 + 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="text-white/90 text-3xl md:text-4xl font-medium max-w-3xl vt-text-on-media-strong"
          >
            {slide.subtitle}
          </motion.p>
        )}
      </div>

      {/* Accent corner — Claude design touch */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={isActive ? { opacity: 0.6, scale: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: accent }}
      />
    </motion.div>
  );
}
