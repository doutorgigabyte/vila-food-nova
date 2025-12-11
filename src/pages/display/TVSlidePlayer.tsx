import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { DOMAIN } from "@/lib/constants";

interface TVSlide { id: string; title: string | null; description: string | null; image_url: string; product_id: string | null; template_type: string; duration_seconds: number; product?: { id: string; name: string; price: number; promotional_price: number | null; } | null; }
interface Establishment { id: string; name: string; slug: string; logo_url: string | null; primary_color: string | null; }

export default function TVSlidePlayer() {
  const { token } = useParams<{ token: string }>();
  const [slides, setSlides] = useState<TVSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);

  useEffect(() => { if (token) validateAndFetch(); }, [token]);
  useEffect(() => { if (slides.length === 0) return; const duration = (slides[currentIndex]?.duration_seconds || 8) * 1000; const timer = setTimeout(() => setCurrentIndex((prev) => (prev + 1) % slides.length), duration); return () => clearTimeout(timer); }, [currentIndex, slides]);

  const validateAndFetch = async () => {
    try {
      const { data: tokenData, error: tokenError } = await (supabase.from("public_display_tokens" as any).select("establishment_id").eq("token", token).eq("display_type", "tv_slides").eq("is_active", true).single() as any);
      if (tokenError || !tokenData) { setError("Token inválido ou expirado"); setLoading(false); return; }
      const { data: estData } = await supabase.from("establishments").select("id, name, slug, logo_url, primary_color").eq("id", tokenData.establishment_id).single();
      if (estData) setEstablishment(estData);
      const { data: slidesData } = await (supabase.from("tv_slides" as any).select("*, product:products(id, name, price, promotional_price)").eq("establishment_id", tokenData.establishment_id).eq("is_active", true).order("sort_order", { ascending: true }) as any);
      setSlides((slidesData || []) as TVSlide[]);
    } catch (err) { setError("Erro ao carregar slides"); } finally { setLoading(false); }
  };

  if (loading) return <div className="fixed inset-0 bg-black flex items-center justify-center"><div className="animate-pulse text-white text-2xl">Carregando...</div></div>;
  if (error) return <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white"><AlertCircle className="w-16 h-16 text-red-500 mb-4" /><h1 className="text-2xl font-bold mb-2">Acesso Negado</h1><p className="text-gray-400">{error}</p></div>;
  if (slides.length === 0) return <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white"><h1 className="text-3xl font-bold mb-4">{establishment?.name}</h1><p className="text-gray-400">Nenhum slide configurado</p></div>;

  const currentSlide = slides[currentIndex];
  const storeUrl = establishment ? `https://${establishment.slug}.${DOMAIN}` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(storeUrl)}`;
  const primaryColor = establishment?.primary_color || '#FF6B00';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={currentSlide.id} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }} className="absolute inset-0">
          {currentSlide.template_type === 'minimal' && <div className="relative w-full h-full"><img src={currentSlide.image_url} alt={currentSlide.title || 'Slide'} className="w-full h-full object-cover" />{establishment?.logo_url && <div className="absolute top-8 left-8"><img src={establishment.logo_url} alt={establishment.name} className="h-16 w-auto rounded-lg shadow-lg" /></div>}<div className="absolute bottom-8 right-8 bg-white p-3 rounded-xl shadow-lg"><img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" /></div></div>}
          {currentSlide.template_type === 'product_showcase' && <div className="relative w-full h-full flex"><div className="w-2/3 h-full relative"><img src={currentSlide.image_url} alt={currentSlide.title || 'Produto'} className="w-full h-full object-cover" /><div className="absolute inset-0 border-[12px] pointer-events-none" style={{ borderColor: primaryColor }} /></div><div className="w-1/3 h-full flex flex-col justify-center items-center p-8 text-white" style={{ backgroundColor: primaryColor }}>{establishment?.logo_url && <img src={establishment.logo_url} alt={establishment.name} className="h-20 w-auto mb-8 rounded-lg" />}{currentSlide.product && <><h2 className="text-4xl font-bold text-center mb-4">{currentSlide.product.name}</h2><div className="text-5xl font-black mb-8">R$ {(currentSlide.product.promotional_price || currentSlide.product.price).toFixed(2)}</div></>}{currentSlide.title && !currentSlide.product && <h2 className="text-4xl font-bold text-center mb-4">{currentSlide.title}</h2>}<div className="bg-white p-4 rounded-xl"><img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" /></div><p className="text-lg mt-4 font-medium">Escaneie e peça!</p></div></div>}
          {currentSlide.template_type === 'promo' && <div className="relative w-full h-full"><img src={currentSlide.image_url} alt={currentSlide.title || 'Promoção'} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />{establishment?.logo_url && <div className="absolute top-8 left-8"><img src={establishment.logo_url} alt={establishment.name} className="h-16 w-auto rounded-lg shadow-lg" /></div>}<motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute top-8 right-8 px-6 py-3 rounded-full text-white font-bold text-2xl" style={{ backgroundColor: primaryColor }}>🔥 PROMOÇÃO</motion.div><div className="absolute bottom-0 left-0 right-0 p-12 text-white"><div className="flex items-end justify-between"><div>{currentSlide.product && <><h2 className="text-5xl font-bold mb-4">{currentSlide.product.name}</h2>{currentSlide.product.promotional_price && <div className="flex items-center gap-4 mb-2"><span className="text-3xl text-gray-400 line-through">R$ {currentSlide.product.price.toFixed(2)}</span></div>}<div className="text-6xl font-black" style={{ color: primaryColor }}>R$ {(currentSlide.product.promotional_price || currentSlide.product.price).toFixed(2)}</div></>}{currentSlide.title && !currentSlide.product && <h2 className="text-5xl font-bold">{currentSlide.title}</h2>}</div><div className="flex flex-col items-center"><div className="bg-white p-4 rounded-xl mb-2"><img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" /></div><p className="text-lg font-medium flex items-center gap-2"><span>👆 EU QUERO!</span></p></div></div></div></div>}
          {currentSlide.template_type === 'full_image' && <img src={currentSlide.image_url} alt={currentSlide.title || 'Slide'} className="w-full h-full object-cover" />}
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">{slides.map((_, idx) => <div key={idx} className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />)}</div>
    </div>
  );
}