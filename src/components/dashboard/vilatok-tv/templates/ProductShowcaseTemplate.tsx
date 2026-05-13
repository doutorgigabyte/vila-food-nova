import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { ShoppingBag, QrCode } from "lucide-react";
import type { TVSlideTemplateProps } from "./types";
import { formatPrice } from "./types";
import { DOMAIN } from "@/lib/constants";

/**
 * Template V2: Product Showcase
 * --------------------------------
 * Layout: 60/40 split com imagem do produto a esquerda e card de preco
 * + CTA + QR a direita. Glassmorphism no card. Animated price counter.
 *
 * Ideal para: cardapio TV em loja fisica, promocao destacada.
 *
 * Anim:
 * - Imagem: scale-in com leve overshoot
 * - Card: slide-in da direita
 * - Preco: count-up animado de 0 ate o valor real
 * - Promo strike: aparece com flash + risco animado
 */
export function ProductShowcaseTemplate({ slide, establishment, isActive }: TVSlideTemplateProps) {
  const accent = establishment.primary_color || "hsl(var(--primary))";

  const product = slide.product;
  const finalPrice = product?.promotional_price ?? product?.price ?? 0;
  const hasPromo = !!product?.promotional_price && product.promotional_price < (product.price ?? 0);

  // Counter animado do preco
  const priceMv = useMotionValue(0);
  const displayPrice = useTransform(priceMv, (v) => formatPrice(v));

  useEffect(() => {
    if (!isActive) return;
    priceMv.set(0);
    const controls = animate(priceMv, finalPrice, {
      duration: 1.2,
      delay: 0.5,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [isActive, finalPrice, priceMv]);

  const storeUrl = `https://${DOMAIN}/loja/${establishment.slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    storeUrl
  )}`;

  return (
    <motion.div
      key={slide.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-full overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black"
    >
      {/* Backdrop pattern sutil */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${accent}40 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full h-full grid grid-cols-[60%_40%]">
        {/* Imagem do produto — esquerda */}
        <div className="relative flex items-center justify-center p-16">
          <motion.div
            initial={{ scale: 0.85, opacity: 0, rotate: -4 }}
            animate={isActive ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0.85, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 24,
              delay: 0.2,
            }}
            className="relative w-full h-full max-w-[80vmin] max-h-[80vmin]"
          >
            <div
              className="absolute -inset-8 rounded-[3rem] blur-3xl opacity-50"
              style={{ background: accent }}
            />
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl">
              <img
                src={slide.image_url}
                alt={product?.name || slide.title || ""}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>

        {/* Card de info + preco — direita */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={isActive ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 240,
            damping: 28,
            delay: 0.35,
          }}
          className="flex flex-col justify-center p-12 pr-16 gap-6"
        >
          {slide.badge_text && (
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full w-fit"
              style={{
                background: `${accent}30`,
                border: `1px solid ${accent}80`,
              }}
            >
              <span className="text-sm font-bold uppercase tracking-widest text-white">
                {slide.badge_text}
              </span>
            </div>
          )}

          <h2 className="text-white font-black leading-tight" style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}>
            {product?.name || slide.title}
          </h2>

          {slide.subtitle && (
            <p className="text-white/70 text-2xl leading-relaxed">{slide.subtitle}</p>
          )}

          {/* Bloco de preco com counter */}
          {product && (
            <div className="vt-glass-elevated rounded-3xl p-6 flex flex-col gap-2">
              {hasPromo && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 1.4 }}
                  className="relative inline-flex items-center w-fit"
                >
                  <span className="text-white/50 text-2xl line-through">
                    R$ {formatPrice(product.price)}
                  </span>
                </motion.div>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-white/60 text-2xl font-medium">R$</span>
                <motion.span
                  className="text-white font-black tabular-nums leading-none"
                  style={{
                    fontSize: "clamp(3.5rem, 8vw, 7rem)",
                    color: hasPromo ? accent : "white",
                  }}
                >
                  {displayPrice}
                </motion.span>
              </div>
            </div>
          )}

          {/* CTA + QR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            className="flex items-center gap-4 mt-4"
          >
            <div
              className="flex-1 flex items-center gap-3 px-6 py-4 rounded-2xl"
              style={{
                background: accent,
                boxShadow: `0 8px 32px ${accent}60`,
              }}
            >
              <ShoppingBag className="w-6 h-6 text-white" />
              <div className="flex flex-col">
                <span className="text-white/80 text-xs uppercase tracking-wider">Peça pelo</span>
                <span className="text-white font-bold text-lg">{establishment.name}</span>
              </div>
            </div>

            <div className="vt-glass rounded-2xl p-2 flex items-center gap-2">
              <img src={qrUrl} alt="QR Code" className="w-16 h-16 rounded-lg" />
              <QrCode className="w-5 h-5 text-white/70" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
