import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import type { TVSlideTemplateProps } from "./types";

/**
 * Template V2: Story / Quote
 * --------------------------------
 * Layout estilo testimunho/citação. Imagem como portrait circular grande
 * à esquerda + quote gigante à direita com aspas animadas em SVG. Glow
 * sutil rotacionando atrás da foto. Estrelas de avaliacao opcional.
 *
 * Ideal para: depoimento de cliente, frase de impacto, equipe.
 *
 * Anim:
 * - Portrait: spring scale-in com rotation suave
 * - Quote marks: scale + opacity stagger
 * - Texto: typewriter-like (word reveal)
 * - Glow: spin lento infinito
 */
export function StoryQuoteTemplate({ slide, establishment, isActive }: TVSlideTemplateProps) {
  const accent = establishment.primary_color || "hsl(var(--primary))";
  const quote = slide.subtitle || slide.title || "";
  const author = slide.title && slide.subtitle ? slide.title : establishment.name;
  const words = quote.split(" ");

  return (
    <motion.div
      key={slide.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full h-full overflow-hidden bg-gradient-to-bl from-zinc-900 via-black to-zinc-950"
    >
      {/* Glow rotativo no fundo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3, rotate: 360 }}
        transition={{
          opacity: { duration: 1, delay: 0.3 },
          rotate: { duration: 40, ease: "linear", repeat: Infinity },
        }}
        className="absolute top-1/2 left-1/4 w-[60vmin] h-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, ${accent}, transparent 50%, ${accent}80)`,
        }}
      />

      {/* Pattern sutil */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full h-full grid grid-cols-[40%_60%] items-center px-16">
        {/* Portrait à esquerda */}
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={
              isActive
                ? { scale: 1, opacity: 1, rotate: 0 }
                : { scale: 0.6, opacity: 0, rotate: -8 }
            }
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 22,
              delay: 0.2,
            }}
            className="relative"
          >
            {/* Ring com gradiente */}
            <div
              className="absolute -inset-3 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${accent}, ${accent}40, ${accent})`,
                animation: "spin 8s linear infinite",
              }}
            />
            <div className="relative w-[44vmin] h-[44vmin] rounded-full overflow-hidden bg-black ring-8 ring-black shadow-2xl">
              <img
                src={slide.image_url}
                alt={author}
                className="w-full h-full object-cover"
              />
              {/* Vignette sobre a foto */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent" />
            </div>

            {/* Floating decorative dot */}
            <motion.div
              initial={{ scale: 0 }}
              animate={isActive ? { scale: 1 } : { scale: 0 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 400 }}
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full vt-glass-elevated flex items-center justify-center"
            >
              <Star className="w-7 h-7 fill-yellow-400 text-yellow-400" />
            </motion.div>
          </motion.div>
        </div>

        {/* Quote à direita */}
        <div className="flex flex-col justify-center gap-8 pl-8">
          {/* Aspas grandes em SVG */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={
              isActive
                ? { opacity: 0.25, scale: 1, rotate: 0 }
                : { opacity: 0, scale: 0.5 }
            }
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.4 }}
          >
            <Quote
              className="w-32 h-32 -mb-12 -ml-4"
              style={{ color: accent, transform: "scaleX(-1)" }}
              strokeWidth={1.5}
            />
          </motion.div>

          {/* Quote text word-by-word */}
          <blockquote
            className="text-white font-medium leading-tight max-w-3xl"
            style={{ fontSize: "clamp(2rem, 4vw, 4.5rem)" }}
          >
            {words.map((word, i) => (
              <motion.span
                key={`${slide.id}-qw-${i}`}
                initial={{ opacity: 0, y: 24 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{
                  duration: 0.5,
                  delay: 0.6 + i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block mr-3"
                style={{ textShadow: "0 4px 16px rgba(0,0,0,0.6)" }}
              >
                {word}
              </motion.span>
            ))}
          </blockquote>

          {/* Author + estabelecimento */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{
              duration: 0.5,
              delay: 0.6 + words.length * 0.05 + 0.3,
            }}
            className="flex items-center gap-4"
          >
            <div
              className="h-0.5 w-12 rounded-full"
              style={{ background: accent }}
            />
            <div>
              <p className="text-white font-bold text-2xl">{author}</p>
              {author !== establishment.name && (
                <p className="text-white/60 text-lg">{establishment.name}</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
