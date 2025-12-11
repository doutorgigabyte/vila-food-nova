import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Phone, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { DOMAIN } from "@/lib/constants";

interface TVSlide {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  product_id: string | null;
  template_type: string;
  duration_seconds: number;
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
    const duration = (slides[currentIndex]?.duration_seconds || 8) * 1000;
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
  const secondaryColor = '#F5E6D3'; // Cream/beige background

  // Format phone for display
  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const displayPhone = formatPhone(establishment?.whatsapp || establishment?.phone);

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
          {/* Template: Marina Style - Product Showcase Left */}
          {currentSlide.template_type === 'product_showcase' && (
            <div className="relative w-full h-full flex flex-col">
              {/* Wave Background */}
              <WavePattern color={primaryColor} opacity={0.15} />
              
              {/* Main Content Area */}
              <div className="flex-1 flex relative z-10">
                {/* Left side - Product Image */}
                <div className="w-1/2 h-full flex items-center justify-center p-8">
                  <motion.div
                    initial={{ scale: 0.9, rotate: -2 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative"
                  >
                    <img
                      src={currentSlide.image_url}
                      alt={currentSlide.title || 'Produto'}
                      className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
                      style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}
                    />
                  </motion.div>
                </div>

                {/* Right side - Info */}
                <div className="w-1/2 h-full flex flex-col justify-center items-start p-12">
                  {/* Logo */}
                  {establishment?.logo_url && (
                    <motion.img
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      src={establishment.logo_url}
                      alt={establishment.name}
                      className="h-24 w-auto mb-8"
                    />
                  )}

                  {/* Product Name */}
                  <motion.h1
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-7xl font-black uppercase mb-6 leading-tight"
                    style={{ 
                      color: primaryColor,
                      textShadow: '3px 3px 0 rgba(0,0,0,0.1)',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  >
                    {currentSlide.title || currentSlide.product?.name || 'Destaque'}
                  </motion.h1>

                  {/* Description */}
                  {currentSlide.description && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl text-gray-700 mb-8 max-w-lg"
                    >
                      {currentSlide.description}
                    </motion.p>
                  )}

                  {/* Price if product */}
                  {currentSlide.product && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-6xl font-black text-gray-800 mb-8"
                    >
                      R$ {(currentSlide.product.promotional_price || currentSlide.product.price).toFixed(2).replace('.', ',')}
                    </motion.div>
                  )}

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="px-12 py-5 rounded-full text-white text-3xl font-bold shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Peça agora
                  </motion.div>
                </div>
              </div>

              {/* Bottom Contact Bar */}
              <div 
                className="h-24 flex items-center justify-center gap-16 px-12"
                style={{ backgroundColor: primaryColor }}
              >
                {displayPhone && (
                  <div className="flex items-center gap-4 text-white">
                    <Phone className="w-8 h-8" />
                    <span className="text-2xl font-semibold tracking-wide">PEÇA O SEU!</span>
                    <span className="text-2xl font-bold">{displayPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-white">
                  <Globe className="w-8 h-8" />
                  <span className="text-2xl font-semibold">{establishment?.slug}.{DOMAIN}</span>
                </div>
                <div className="bg-white p-2 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
                </div>
              </div>
            </div>
          )}

          {/* Template: Minimal - Full Image with Overlay */}
          {currentSlide.template_type === 'minimal' && (
            <div className="relative w-full h-full">
              {/* Background Image */}
              <img
                src={currentSlide.image_url}
                alt={currentSlide.title || 'Slide'}
                className="w-full h-full object-cover"
              />
              
              {/* Logo Top Left */}
              {establishment?.logo_url && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute top-8 left-8"
                >
                  <img
                    src={establishment.logo_url}
                    alt={establishment.name}
                    className="h-20 w-auto drop-shadow-lg"
                  />
                </motion.div>
              )}

              {/* QR Code Bottom Right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-8 right-8 bg-white p-4 rounded-2xl shadow-2xl"
              >
                <img src={qrCodeUrl} alt="QR Code" className="w-28 h-28" />
                <p className="text-center text-sm font-medium mt-2 text-gray-600">Escaneie e peça!</p>
              </motion.div>

              {/* Title Overlay if exists */}
              {currentSlide.title && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-sm px-8 py-4 rounded-2xl"
                >
                  <h2 className="text-4xl font-bold text-white">{currentSlide.title}</h2>
                </motion.div>
              )}
            </div>
          )}

          {/* Template: Promo - Sale/Promotion Style */}
          {currentSlide.template_type === 'promo' && (
            <div className="relative w-full h-full flex flex-col">
              <WavePattern color={primaryColor} opacity={0.12} />
              
              <div className="flex-1 flex relative z-10">
                {/* Left side - Text */}
                <div className="w-2/5 h-full flex flex-col justify-center p-12">
                  {/* Logo */}
                  {establishment?.logo_url && (
                    <img
                      src={establishment.logo_url}
                      alt={establishment.name}
                      className="h-20 w-auto mb-6"
                    />
                  )}

                  {/* Badge */}
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-xl font-bold text-white mb-6 w-fit"
                    style={{ backgroundColor: '#C4A574' }}
                  >
                    ⭐ Menu Especial
                  </motion.div>

                  {/* Product Name */}
                  <h1
                    className="text-6xl font-black uppercase leading-none mb-4"
                    style={{ 
                      color: primaryColor,
                      textShadow: '2px 2px 0 rgba(0,0,0,0.1)'
                    }}
                  >
                    {currentSlide.title || currentSlide.product?.name}
                  </h1>

                  {/* Price */}
                  {currentSlide.product && (
                    <div className="mb-8">
                      {currentSlide.product.promotional_price && (
                        <span className="text-3xl text-gray-400 line-through mr-4">
                          R$ {currentSlide.product.price.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      <span className="text-5xl font-black text-gray-800">
                        R$ {(currentSlide.product.promotional_price || currentSlide.product.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-3 text-gray-700">
                    {displayPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-6 h-6" style={{ color: primaryColor }} />
                        <span className="text-xl">{displayPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Globe className="w-6 h-6" style={{ color: primaryColor }} />
                      <span className="text-xl">{establishment?.slug}.{DOMAIN}</span>
                    </div>
                  </div>
                </div>

                {/* Right side - Image */}
                <div className="w-3/5 h-full flex items-center justify-center p-8 relative">
                  <motion.img
                    initial={{ scale: 0.9, x: 50 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    src={currentSlide.image_url}
                    alt={currentSlide.title || 'Produto'}
                    className="max-w-full max-h-[70vh] object-contain rounded-2xl"
                    style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))' }}
                  />

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute bottom-12 right-12 px-10 py-4 rounded-full text-white text-2xl font-bold shadow-xl"
                    style={{ backgroundColor: '#C4A574' }}
                  >
                    Peça agora
                  </motion.div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div 
                className="h-20 flex items-center justify-center gap-12"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-4 text-white">
                  <Phone className="w-7 h-7" />
                  <span className="text-xl font-semibold">PEÇA O SEU!</span>
                  <span className="text-xl font-bold">{displayPhone}</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-14 h-14" />
                </div>
              </div>
            </div>
          )}

          {/* Template: Full Image - Clean Full Screen */}
          {currentSlide.template_type === 'full_image' && (
            <div className="relative w-full h-full">
              <img
                src={currentSlide.image_url}
                alt={currentSlide.title || 'Slide'}
                className="w-full h-full object-cover"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              
              {/* Logo */}
              {establishment?.logo_url && (
                <div className="absolute top-6 left-6">
                  <img
                    src={establishment.logo_url}
                    alt={establishment.name}
                    className="h-16 w-auto drop-shadow-lg"
                  />
                </div>
              )}

              {/* Bottom Bar */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-between px-12"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-8 text-white">
                  {displayPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-6 h-6" />
                      <span className="text-lg font-medium">{displayPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6" />
                    <span className="text-lg">{establishment?.slug}.{DOMAIN}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white text-lg font-medium">Faça seu pedido →</span>
                  <div className="bg-white p-1.5 rounded-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-14 h-14" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-10 bg-white shadow-lg' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}