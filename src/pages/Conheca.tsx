import { lazy, Suspense, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import IFoodCalculator from "@/components/landing/IFoodCalculator";
import StickyCalculatorBar from "@/components/landing/StickyCalculatorBar";
import { useFAQItems } from "@/hooks/useFAQItems";
import { usePlans } from "@/hooks/usePlans";

// Lazy load sections below the fold for performance
const TrustBadgesSection = lazy(() => import("@/components/landing/TrustBadgesSection"));
const LiveStatsSection = lazy(() => import("@/components/landing/LiveStatsSection"));
const AllFeaturesSection = lazy(() => import("@/components/landing/AllFeaturesSection"));
const UseCasesSection = lazy(() => import("@/components/landing/UseCasesSection"));
const VilasConceptSection = lazy(() => import("@/components/landing/VilasConceptSection"));
const ComparisonSection = lazy(() => import("@/components/landing/ComparisonSection"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const PricingSection = lazy(() => import("@/components/landing/PricingSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const CTASection = lazy(() => import("@/components/landing/CTASection"));
const Footer = lazy(() => import("@/components/landing/Footer"));

// Simple loading skeleton
const SectionSkeleton = () => (
  <div className="py-16 md:py-24 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const SITE_URL = "https://vilafood.delivery";
const PAGE_URL = `${SITE_URL}/conheca`;
const PAGE_TITLE = "VilaFood — Delivery sem taxas abusivas para seu restaurante";
const PAGE_DESCRIPTION =
  "Crie seu delivery local com 0% de taxa por pedido, WhatsApp com IA 24/7, marketplace regional e pagamentos integrados. Compare e economize até 27% vs iFood.";

// JSON-LD: Organization (sitewide). Coloquei aqui pois /conheca e a pagina
// canonica da empresa; em outras paginas publicas pode ser adicionado o mesmo.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VilaFood",
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.png`,
  description: PAGE_DESCRIPTION,
  email: "contato@vilafood.delivery",
  telephone: "+5581983655465",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tamandaré",
    addressRegion: "PE",
    addressCountry: "BR",
  },
  sameAs: [
    "https://instagram.com/vilafood",
    "https://facebook.com/vilafood",
  ],
};

const Conheca = () => {
  const { data: plans } = usePlans();
  const faqCategories = useFAQItems();
  const plansReady = (plans?.length ?? 0) > 0;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // react-helmet-async nao remove tags estaticas do index.html que tenham
  // mesmo `name` — resulta em 2x <meta name="description"> no DOM (a do
  // index.html + a do Helmet). Dedupar manualmente preservando a do Helmet
  // (a que tem `data-react-helmet` ou eh adicionada por ultimo).
  useEffect(() => {
    const descs = Array.from(document.querySelectorAll('meta[name="description"]'));
    if (descs.length <= 1) return;
    // Mantem a ultima (Helmet adiciona apos a estatica)
    descs.slice(0, -1).forEach((el) => el.remove());
  }, []);

  // SoftwareApplication schema com offers a partir do hook usePlans.
  // So renderiza quando plans estao carregados — evita Helmet criar 2
  // versoes (loading sem offers + loaded com offers) sem conseguir dedupar.
  const softwareSchema = plansReady
    ? {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "VilaFood",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, iOS, Android",
        description: PAGE_DESCRIPTION,
        url: PAGE_URL,
        image: `${SITE_URL}/og-image.png`,
        publisher: { "@type": "Organization", name: "VilaFood" },
        offers: plans!.map((p) => ({
          "@type": "Offer",
          name: p.name,
          price: p.price?.toFixed(2) ?? "0.00",
          priceCurrency: "BRL",
          category: p.slug,
          availability: "https://schema.org/InStock",
        })),
      }
    : null;

  // FAQPage schema a partir das categorias importadas de FAQSection.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCategories.flatMap((category) =>
      category.questions.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.answer,
        },
      }))
    ),
  };

  return (
    <>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <link rel="canonical" href={PAGE_URL} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="VilaFood" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        {/* JSON-LD: Organization */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>

        {/* JSON-LD: SoftwareApplication com offers dinamicas.
            So renderiza quando plans carregados pra evitar duplicacao
            no DOM (Helmet nao dedupa inline scripts com conteudo diferente). */}
        {softwareSchema && (
          <script type="application/ld+json">
            {JSON.stringify(softwareSchema)}
          </script>
        )}

        {/* JSON-LD: FAQPage */}
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <Navbar />
        <HeroSection />
        <IFoodCalculator />

        <Suspense fallback={<SectionSkeleton />}>
          <TrustBadgesSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <LiveStatsSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <AllFeaturesSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <UseCasesSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <VilasConceptSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <ComparisonSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HowItWorksSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <PricingSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <TestimonialsSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <FAQSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <CTASection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <Footer />
        </Suspense>

        <StickyCalculatorBar />
      </main>
    </>
  );
};

export default Conheca;
