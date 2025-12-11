import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Phone, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { DOMAIN } from "@/lib/constants";

interface TVSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  product_id: string | null;
  template_type: string;
  badge_text?: string | null;
  secondary_images?: string[];
  product?: {
    id: string;
    name: string;
    price: number;
    promotional_price: number | null;
  } | null;
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  phone: string | null;
  whatsapp: string | null;
}

// Blob SVG component for modern templates
const BlobPattern = ({ color, className }: { color: string; className?: string }) => (
  <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <path fill={color} d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.1,73.1,42.1C64.8,55.1,53.8,66.4,40.4,74.4C27,82.4,13.5,87,-0.7,88.2C-14.9,89.4,-29.8,87.2,-42.8,79.8C-55.8,72.4,-66.9,59.8,-74.5,45.5C-82.1,31.2,-86.2,15.6,-86.8,-0.3C-87.4,-16.3,-84.4,-32.6,-76.4,-46C-68.4,-59.4,-55.3,-69.9,-41,-76.8C-26.7,-83.7,-13.3,-87,-0.2,-86.7C12.9,-86.4,25.8,-82.5,44.7,-76.4Z" transform="translate(100 100)" />
  </svg>
);

// Wave pattern SVG component
const WavePattern = ({ color, opacity = 0.3 }: { color: string; opacity?: number }) => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    viewBox="0 0 1920 1080"
    preserveAspectRatio="none"
    style={{ opacity }}
  >
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <path
        key={i}
        d={`M0 ${180 + i * 150} Q 480 ${100 + i * 150} 960 ${180 + i * 150} T 1920 ${180 + i * 150}`}
        fill="none"
        stroke={color}
        strokeWidth="40"
        strokeLinecap="round"
      />
    ))}
  </svg>
);

// Decorative dots component
const DecorativeDots = ({ color }: { color: string }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          backgroundColor: color,
          width: Math.random() * 20 + 10,
          height: Math.random() * 20 + 10,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity: 0.1 + Math.random() * 0.2,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

export default function TVSlidePlayer() {
  const { token } = useParams<{ token: string }>();
  const [slides, setSlides] = useState<TVSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);

  useEffect(() => {
    if (token) validateAndFetch();
  }, [token]);

  useEffect(() => {
    if (slides.length === 0) return;
    const duration = 8000; // 8 seconds per slide
    const timer = setTimeout(() => setCurrentIndex((prev) => (prev + 1) % slides.length), duration);
    return () => clearTimeout(timer);
  }, [currentIndex, slides]);

  const validateAndFetch = async () => {
    try {
      const { data: tokenData, error: tokenError } = await (supabase
        .from("public_display_tokens" as any)
        .select("establishment_id")
        .eq("token", token)
        .eq("display_type", "tv_slides")
        .eq("is_active", true)
        .single() as any);

      if (tokenError || !tokenData) {
        setError("Token inválido ou expirado");
        setLoading(false);
        return;
      }

      const { data: estData } = await supabase
        .from("establishments")
        .select("id, name, slug, logo_url, primary_color, phone, whatsapp")
        .eq("id", tokenData.establishment_id)
        .single();

      if (estData) setEstablishment(estData);

      const { data: slidesData } = await (supabase
        .from("tv_slides" as any)
        .select("*, product:products(id, name, price, promotional_price)")
        .eq("establishment_id", tokenData.establishment_id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }) as any);

      setSlides((slidesData || []) as TVSlide[]);
    } catch (err) {
      setError("Erro ao carregar slides");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-pulse text-white text-2xl">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold mb-4">{establishment?.name}</h1>
        <p className="text-gray-400">Nenhum slide configurado</p>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];
  const storeUrl = establishment ? `https://${establishment.slug}.${DOMAIN}` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeUrl)}&color=333333&bgcolor=FFFFFF`;
  const primaryColor = establishment?.primary_color || '#2D8B8B';
  const secondaryColor = '#F5E6D3';
  const accentColor = '#C4A574';

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const displayPhone = formatPhone(establishment?.whatsapp || establishment?.phone);
  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: secondaryColor }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* ===== TEMPLATE: PRODUCT SHOWCASE ===== */}
          {currentSlide.template_type === 'product_showcase' && (
            <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: secondaryColor }}>
              <WavePattern color={primaryColor} opacity={0.15} />
              <div className="flex-1 flex relative z-10">
                <div className="w-1/2 h-full flex items-center justify-center p-8">
                  <motion.img
                    initial={{ scale: 0.9, rotate: -2 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    src={currentSlide.image_url}
                    alt={currentSlide.title || 'Produto'}
                    className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
                    style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}
                  />
                </div>
                <div className="w-1/2 h-full flex flex-col justify-center items-start p-12">
                  {establishment?.logo_url && (
                    <motion.img initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} src={establishment.logo_url} alt={establishment.name} className="h-24 w-auto mb-8" />
                  )}
                  <motion.h1 initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="text-7xl font-black uppercase mb-6 leading-tight" style={{ color: primaryColor, textShadow: '3px 3px 0 rgba(0,0,0,0.1)' }}>
                    {currentSlide.title || currentSlide.product?.name || 'Destaque'}
                  </motion.h1>
                  {currentSlide.subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl text-gray-700 mb-8 max-w-lg">{currentSlide.subtitle}</motion.p>}
                  {currentSlide.product && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="text-6xl font-black text-gray-800 mb-8">{formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}</motion.div>}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="px-12 py-5 rounded-full text-white text-3xl font-bold shadow-lg" style={{ backgroundColor: primaryColor }}>Peça agora</motion.div>
                </div>
              </div>
              <div className="h-24 flex items-center justify-center gap-16 px-12" style={{ backgroundColor: primaryColor }}>
                {displayPhone && <div className="flex items-center gap-4 text-white"><Phone className="w-8 h-8" /><span className="text-2xl font-semibold tracking-wide">PEÇA O SEU!</span><span className="text-2xl font-bold">{displayPhone}</span></div>}
                <div className="flex items-center gap-4 text-white"><Globe className="w-8 h-8" /><span className="text-2xl font-semibold">{establishment?.slug}.{DOMAIN}</span></div>
                <div className="bg-white p-2 rounded-lg"><img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" /></div>
              </div>
            </div>
          )}

          {/* ===== TEMPLATE: MINIMAL ===== */}
          {currentSlide.template_type === 'minimal' && (
            <div className="relative w-full h-full">
              <img src={currentSlide.image_url} alt={currentSlide.title || 'Slide'} className="w-full h-full object-cover" />
              {establishment?.logo_url && <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="absolute top-8 left-8"><img src={establishment.logo_url} alt={establishment.name} className="h-20 w-auto drop-shadow-lg" /></motion.div>}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="absolute bottom-8 right-8 bg-white p-4 rounded-2xl shadow-2xl"><img src={qrCodeUrl} alt="QR Code" className="w-28 h-28" /><p className="text-center text-sm font-medium mt-2 text-gray-600">Escaneie e peça!</p></motion.div>
              {currentSlide.title && <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-sm px-8 py-4 rounded-2xl"><h2 className="text-4xl font-bold text-white">{currentSlide.title}</h2></motion.div>}
            </div>
          )}

          {/* ===== TEMPLATE: PROMO ===== */}
          {currentSlide.template_type === 'promo' && (
            <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: secondaryColor }}>
              <WavePattern color={primaryColor} opacity={0.12} />
              <div className="flex-1 flex relative z-10">
                <div className="w-2/5 h-full flex flex-col justify-center p-12">
                  {establishment?.logo_url && <img src={establishment.logo_url} alt={establishment.name} className="h-20 w-auto mb-6" />}
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-xl font-bold text-white mb-6 w-fit" style={{ backgroundColor: accentColor }}>⭐ {currentSlide.badge_text || 'Menu Especial'}</motion.div>
                  <h1 className="text-6xl font-black uppercase leading-none mb-4" style={{ color: primaryColor, textShadow: '2px 2px 0 rgba(0,0,0,0.1)' }}>{currentSlide.title || currentSlide.product?.name}</h1>
                  {currentSlide.product && <div className="mb-8">{currentSlide.product.promotional_price && <span className="text-3xl text-gray-400 line-through mr-4">{formatPrice(currentSlide.product.price)}</span>}<span className="text-5xl font-black text-gray-800">{formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}</span></div>}
                  <div className="space-y-3 text-gray-700">{displayPhone && <div className="flex items-center gap-3"><Phone className="w-6 h-6" style={{ color: primaryColor }} /><span className="text-xl">{displayPhone}</span></div>}<div className="flex items-center gap-3"><Globe className="w-6 h-6" style={{ color: primaryColor }} /><span className="text-xl">{establishment?.slug}.{DOMAIN}</span></div></div>
                </div>
                <div className="w-3/5 h-full flex items-center justify-center p-8 relative">
                  <motion.img initial={{ scale: 0.9, x: 50 }} animate={{ scale: 1, x: 0 }} transition={{ duration: 0.5 }} src={currentSlide.image_url} alt={currentSlide.title || 'Produto'} className="max-w-full max-h-[70vh] object-contain rounded-2xl" style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))' }} />
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="absolute bottom-12 right-12 px-10 py-4 rounded-full text-white text-2xl font-bold shadow-xl" style={{ backgroundColor: accentColor }}>Peça agora</motion.div>
                </div>
              </div>
              <div className="h-20 flex items-center justify-center gap-12" style={{ backgroundColor: primaryColor }}><div className="flex items-center gap-4 text-white"><Phone className="w-7 h-7" /><span className="text-xl font-semibold">PEÇA O SEU!</span><span className="text-xl font-bold">{displayPhone}</span></div><div className="bg-white p-1.5 rounded-lg"><img src={qrCodeUrl} alt="QR Code" className="w-14 h-14" /></div></div>
            </div>
          )}

          {/* ===== TEMPLATE: FULL IMAGE ===== */}
          {currentSlide.template_type === 'full_image' && (
            <div className="relative w-full h-full">
              <img src={currentSlide.image_url} alt={currentSlide.title || 'Slide'} className="w-full h-full object-cover" />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="absolute bottom-6 right-6 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg"><img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" /></motion.div>
            </div>
          )}

          {/* ===== TEMPLATE: BLOB MODERN ===== */}
          {currentSlide.template_type === 'blob_modern' && (
            <div className="relative w-full h-full bg-gray-900 overflow-hidden">
              <BlobPattern color={primaryColor} className="absolute -top-20 -left-20 w-96 h-96 opacity-30" />
              <BlobPattern color={primaryColor} className="absolute -bottom-32 -right-32 w-[500px] h-[500px] opacity-20" />
              <BlobPattern color={accentColor} className="absolute top-1/4 right-1/4 w-64 h-64 opacity-15" />
              <div className="relative z-10 w-full h-full flex items-center px-16">
                <div className="flex-1 flex items-center justify-center">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="relative">
                    <div className="absolute inset-0 rounded-full bg-white/10 blur-3xl scale-110" />
                    <img src={currentSlide.image_url} alt={currentSlide.title || 'Produto'} className="relative w-[500px] h-[500px] object-cover rounded-full border-8 border-white shadow-2xl" />
                  </motion.div>
                </div>
                <div className="flex-1 flex flex-col justify-center pl-8">
                  {establishment?.logo_url && <motion.img initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} src={establishment.logo_url} alt={establishment.name} className="h-16 w-auto mb-8 brightness-0 invert" />}
                  <motion.h1 initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="text-7xl font-black text-white uppercase leading-none mb-4">{currentSlide.title || currentSlide.product?.name || 'Destaque'}</motion.h1>
                  {currentSlide.subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl text-gray-300 mb-6 max-w-md">{currentSlide.subtitle}</motion.p>}
                  {currentSlide.product && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="text-5xl font-black mb-8" style={{ color: accentColor }}>{formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}</motion.div>}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center gap-6"><div className="px-10 py-4 rounded-full text-gray-900 text-2xl font-bold" style={{ backgroundColor: accentColor }}>Peça agora</div><div className="bg-white p-2 rounded-xl"><img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" /></div></motion.div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12 bg-gradient-to-t from-black/80 to-transparent">{displayPhone && <div className="flex items-center gap-3 text-white"><Phone className="w-6 h-6" /><span className="text-xl font-semibold">{displayPhone}</span></div>}<div className="flex items-center gap-3 text-white"><Globe className="w-6 h-6" /><span className="text-xl">{establishment?.slug}.{DOMAIN}</span></div></div>
            </div>
          )}

          {/* ===== TEMPLATE: POLAROID ===== */}
          {currentSlide.template_type === 'polaroid' && (
            <div className="relative w-full h-full bg-gray-800 overflow-hidden">
              <DecorativeDots color={primaryColor} />
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="flex items-center gap-16">
                  <motion.div initial={{ rotate: -12, scale: 0.8, opacity: 0 }} animate={{ rotate: -8, scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="bg-white p-4 pb-16 rounded shadow-2xl transform -rotate-6">
                    <img src={currentSlide.image_url} alt="" className="w-72 h-72 object-cover" />
                    <p className="absolute bottom-4 left-0 right-0 text-center font-handwriting text-gray-700 text-lg">{currentSlide.title || 'Delícia!'}</p>
                  </motion.div>
                  <div className="flex flex-col items-start max-w-md">
                    {establishment?.logo_url && <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={establishment.logo_url} alt={establishment.name} className="h-16 w-auto mb-6 brightness-0 invert" />}
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-6xl font-black text-white uppercase leading-tight mb-4">{currentSlide.title || 'Novidade'}</motion.h1>
                    {currentSlide.subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xl text-gray-300 mb-6">{currentSlide.subtitle}</motion.p>}
                    {currentSlide.product && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-4xl font-black mb-6" style={{ color: accentColor }}>{formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}</motion.div>}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex items-center gap-4"><div className="px-8 py-3 rounded-full text-white text-xl font-bold" style={{ backgroundColor: primaryColor }}>Peça já!</div><div className="bg-white p-2 rounded-lg"><img src={qrCodeUrl} alt="QR Code" className="w-14 h-14" /></div></motion.div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center gap-8" style={{ backgroundColor: primaryColor }}><span className="text-white text-lg font-semibold">{displayPhone}</span><span className="text-white/80">|</span><span className="text-white text-lg">{establishment?.slug}.{DOMAIN}</span></div>
            </div>
          )}

          {/* ===== TEMPLATE: DIAMOND ===== */}
          {currentSlide.template_type === 'diamond' && (
            <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#F8F5F0' }}>
              <DecorativeDots color={primaryColor} />
              <div className="relative z-10 w-full h-full flex items-center px-16">
                <div className="flex-1 flex items-center justify-center">
                  <motion.div initial={{ rotate: 45, scale: 0.6, opacity: 0 }} animate={{ rotate: 45, scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="relative w-80 h-80 transform rotate-45 overflow-hidden rounded-3xl shadow-2xl border-4 border-white">
                    <img src={currentSlide.image_url} alt={currentSlide.title || 'Produto'} className="absolute inset-0 w-full h-full object-cover transform -rotate-45 scale-150" />
                  </motion.div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  {establishment?.logo_url && <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={establishment.logo_url} alt={establishment.name} className="h-16 w-auto mb-6" />}
                  {currentSlide.badge_text && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="inline-flex items-center justify-center w-24 h-24 rounded-full text-white text-xl font-black mb-6 bg-red-500 shadow-lg">{currentSlide.badge_text}</motion.div>}
                  <motion.h1 initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="text-6xl font-black uppercase leading-none mb-4" style={{ color: primaryColor }}>{currentSlide.title || currentSlide.product?.name || 'Especial'}</motion.h1>
                  {currentSlide.subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xl text-gray-600 mb-6 max-w-md">{currentSlide.subtitle}</motion.p>}
                  {currentSlide.product && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-5xl font-black text-gray-800 mb-8">{formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}</motion.div>}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex items-center gap-6"><div className="px-10 py-4 rounded-full text-white text-2xl font-bold shadow-lg" style={{ backgroundColor: primaryColor }}>Peça agora</div><div className="bg-white p-2 rounded-xl shadow-lg"><img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" /></div></motion.div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12" style={{ backgroundColor: primaryColor }}>{displayPhone && <div className="flex items-center gap-3 text-white"><Phone className="w-6 h-6" /><span className="text-xl font-semibold">{displayPhone}</span></div>}<div className="flex items-center gap-3 text-white"><Globe className="w-6 h-6" /><span className="text-xl">{establishment?.slug}.{DOMAIN}</span></div><div className="bg-white p-1.5 rounded-lg"><img src={qrCodeUrl} alt="QR Code" className="w-12 h-12" /></div></div>
            </div>
          )}

          {/* ===== TEMPLATE: DIAGONAL ===== */}
          {currentSlide.template_type === 'diagonal' && (
            <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#F5E6D3' }}>
              <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0, 55% 0, 40% 100%, 0 100%)' }}>
                <img src={currentSlide.image_url} alt={currentSlide.title || 'Produto'} className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-8 right-8">
                {currentSlide.badge_text && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-28 h-28 rounded-full bg-red-500 text-white flex items-center justify-center text-center font-black text-lg shadow-xl">{currentSlide.badge_text}</motion.div>}
              </div>
              <div className="absolute right-16 top-1/2 -translate-y-1/2 max-w-lg">
                {establishment?.logo_url && <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={establishment.logo_url} alt={establishment.name} className="h-14 w-auto mb-6" />}
                <motion.h1 initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="text-6xl font-black uppercase leading-none mb-4" style={{ color: primaryColor }}>{currentSlide.title || currentSlide.product?.name || 'Destaque'}</motion.h1>
                {currentSlide.subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-xl text-gray-700 mb-6">{currentSlide.subtitle}</motion.p>}
                {currentSlide.product && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-5xl font-black text-gray-800 mb-8">{formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}</motion.div>}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center gap-6"><div className="px-10 py-4 rounded-full text-white text-2xl font-bold shadow-lg" style={{ backgroundColor: primaryColor }}>Peça agora</div><div className="bg-white p-2 rounded-xl shadow-lg"><img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" /></div></motion.div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12" style={{ backgroundColor: primaryColor }}>{displayPhone && <div className="flex items-center gap-3 text-white"><Phone className="w-6 h-6" /><span className="text-xl font-semibold">{displayPhone}</span></div>}<div className="flex items-center gap-3 text-white"><Globe className="w-6 h-6" /><span className="text-xl">{establishment?.slug}.{DOMAIN}</span></div></div>
            </div>
          )}

          {/* ===== TEMPLATE: MENU GRID ===== */}
          {currentSlide.template_type === 'menu_grid' && (
            <div className="relative w-full h-full bg-gray-900 overflow-hidden">
              <BlobPattern color={primaryColor} className="absolute -top-32 -left-32 w-[500px] h-[500px] opacity-20" />
              <BlobPattern color={accentColor} className="absolute -bottom-20 left-1/3 w-80 h-80 opacity-15" />
              <div className="relative z-10 w-full h-full flex flex-col p-12">
                <div className="flex items-center justify-between mb-8">
                  {establishment?.logo_url && <img src={establishment.logo_url} alt={establishment.name} className="h-16 w-auto brightness-0 invert" />}
                  <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl font-black text-white uppercase tracking-wide">{currentSlide.title || 'Menu Especial'}</motion.h2>
                  <div className="bg-white p-2 rounded-xl"><img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" /></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="relative">
                    <img src={currentSlide.image_url} alt={currentSlide.title || 'Menu'} className="w-[600px] h-[600px] object-cover rounded-full border-8 border-white shadow-2xl" />
                    {currentSlide.product && <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full text-white text-3xl font-black shadow-xl" style={{ backgroundColor: primaryColor }}>{formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}</div>}
                  </motion.div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12 bg-gradient-to-t from-black/80 to-transparent">{displayPhone && <div className="flex items-center gap-3 text-white"><Phone className="w-6 h-6" /><span className="text-xl font-semibold">{displayPhone}</span></div>}<div className="flex items-center gap-3 text-white"><Globe className="w-6 h-6" /><span className="text-xl">{establishment?.slug}.{DOMAIN}</span></div></div>
            </div>
          )}

          {/* ===== TEMPLATE: SPECIAL DAY ===== */}
          {currentSlide.template_type === 'special_day' && (
            <div className="relative w-full h-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}>
              <BlobPattern color={accentColor} className="absolute -top-20 -right-20 w-96 h-96 opacity-30" />
              <BlobPattern color="#fff" className="absolute -bottom-32 -left-32 w-[500px] h-[500px] opacity-10" />
              <div className="relative z-10 w-full h-full flex items-center px-16">
                <div className="flex-1 flex flex-col justify-center">
                  {establishment?.logo_url && <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={establishment.logo_url} alt={establishment.name} className="h-16 w-auto mb-8 brightness-0 invert" />}
                  <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-7xl font-black text-white uppercase leading-none mb-6">{currentSlide.title || 'Especial do Dia'}</motion.h1>
                  {currentSlide.subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl text-white/80 mb-8 max-w-md">{currentSlide.subtitle}</motion.p>}
                  {currentSlide.product && <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl mb-8" style={{ backgroundColor: accentColor }}><span className="text-gray-900 text-lg font-semibold">APENAS</span><span className="text-4xl font-black text-gray-900">{formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}</span></motion.div>}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center gap-6"><div className="px-10 py-4 rounded-full bg-white text-gray-900 text-2xl font-bold shadow-lg">Peça agora</div><div className="bg-white p-2 rounded-xl"><img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" /></div></motion.div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="relative">
                    <div className="absolute inset-0 rounded-full blur-3xl scale-110" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
                    <img src={currentSlide.image_url} alt={currentSlide.title || 'Produto'} className="relative w-[500px] h-[500px] object-cover rounded-full border-8 border-white shadow-2xl" />
                  </motion.div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12 bg-black/30">{displayPhone && <div className="flex items-center gap-3 text-white"><Phone className="w-6 h-6" /><span className="text-xl font-semibold">{displayPhone}</span></div>}<div className="flex items-center gap-3 text-white"><Globe className="w-6 h-6" /><span className="text-xl">{establishment?.slug}.{DOMAIN}</span></div></div>
            </div>
          )}

          {/* ===== TEMPLATE: CATERING ===== */}
          {currentSlide.template_type === 'catering' && (
            <div className="relative w-full h-full flex overflow-hidden">
              <div className="w-3/5 h-full"><img src={currentSlide.image_url} alt={currentSlide.title || 'Evento'} className="w-full h-full object-cover" /></div>
              <div className="w-2/5 h-full relative" style={{ backgroundColor: primaryColor }}>
                <WavePattern color="#fff" opacity={0.1} />
                <div className="relative z-10 h-full flex flex-col justify-center p-12">
                  {establishment?.logo_url && <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={establishment.logo_url} alt={establishment.name} className="h-14 w-auto mb-8 brightness-0 invert" />}
                  {currentSlide.badge_text && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="inline-flex items-center justify-center px-6 py-2 rounded-full text-lg font-bold mb-6 bg-white/20 text-white border-2 border-white/30">{currentSlide.badge_text}</motion.div>}
                  <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-5xl font-black text-white uppercase leading-tight mb-6">{currentSlide.title || 'Eventos & Catering'}</motion.h1>
                  {currentSlide.subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-xl text-white/80 mb-8">{currentSlide.subtitle}</motion.p>}
                  {currentSlide.product && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-4xl font-black text-white mb-8">{formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}</motion.div>}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col gap-4"><div className="px-8 py-4 rounded-full bg-white text-gray-900 text-xl font-bold text-center shadow-lg">Solicite um orçamento</div><div className="flex items-center justify-center gap-4"><div className="bg-white p-2 rounded-xl"><img src={qrCodeUrl} alt="QR Code" className="w-14 h-14" /></div><span className="text-white/80">Escaneie para ver o menu</span></div></motion.div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-3/5 h-16 bg-black/50 flex items-center justify-center gap-8">{displayPhone && <div className="flex items-center gap-2 text-white"><Phone className="w-5 h-5" /><span className="text-lg">{displayPhone}</span></div>}<div className="flex items-center gap-2 text-white"><Globe className="w-5 h-5" /><span className="text-lg">{establishment?.slug}.{DOMAIN}</span></div></div>
            </div>
          )}

          {/* ===== TEMPLATE: CIRCLES ===== */}
          {currentSlide.template_type === 'circles' && (
            <div className="relative w-full h-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)` }}>
              <div className="relative z-10 w-full h-full flex items-center px-16">
                <div className="flex-1 flex items-center justify-center gap-8">
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }} className="relative">
                    <img src={currentSlide.image_url} alt="" className="w-48 h-48 object-cover rounded-full border-4 shadow-xl" style={{ borderColor: accentColor }} />
                  </motion.div>
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="relative -mt-20">
                    <img src={currentSlide.image_url} alt="" className="w-64 h-64 object-cover rounded-full border-4 shadow-xl" style={{ borderColor: accentColor }} />
                    {currentSlide.product && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: accentColor }}>{formatPrice(currentSlide.product.promotional_price || currentSlide.product.price)}</div>}
                  </motion.div>
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="relative">
                    <img src={currentSlide.image_url} alt="" className="w-48 h-48 object-cover rounded-full border-4 shadow-xl" style={{ borderColor: accentColor }} />
                  </motion.div>
                </div>
                <div className="flex-1 flex flex-col justify-center pl-8">
                  {establishment?.logo_url && <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={establishment.logo_url} alt={establishment.name} className="h-16 w-auto mb-8 brightness-0 invert" />}
                  <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-6xl font-black text-white uppercase leading-tight mb-6">{currentSlide.title || 'Especial'}</motion.h1>
                  {currentSlide.subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-2xl text-white/80 mb-8 max-w-md">{currentSlide.subtitle}</motion.p>}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex items-center gap-6"><div className="px-10 py-4 rounded-full text-gray-900 text-2xl font-bold shadow-lg" style={{ backgroundColor: accentColor }}>Peça agora</div><div className="bg-white p-2 rounded-xl"><img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" /></div></motion.div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-12 bg-black/30">{displayPhone && <div className="flex items-center gap-3 text-white"><Phone className="w-6 h-6" /><span className="text-xl font-semibold">{displayPhone}</span></div>}<div className="flex items-center gap-3 text-white"><Globe className="w-6 h-6" /><span className="text-xl">{establishment?.slug}.{DOMAIN}</span></div></div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
