import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { AdminAccessProvider } from "./contexts/AdminAccessContext";
import { CartProvider } from "./hooks/useCart";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { DareChatWidget } from "./components/dare/DareChatWidget";
import { OrderSourceProvider } from "./hooks/useOrderSource";
import { NotificationProvider } from "./components/notifications/NotificationProvider";
import PageSkeleton from "./components/ui/PageSkeleton";
import ErrorBoundary from "./components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";

// Critical pages - load immediately
import Index from "./pages/Index";
import Store from "./pages/Store";
import Auth from "./pages/Auth";

// Lazy loaded pages - load on demand
const Vila = lazy(() => import("./pages/Vila"));
const Vilas = lazy(() => import("./pages/Vilas"));
const Conheca = lazy(() => import("./pages/Conheca"));
const RecoverPassword = lazy(() => import("./pages/RecoverPassword"));
const RecoverPasswordWhatsApp = lazy(() => import("./pages/RecoverPasswordWhatsApp"));
const RegisterEstablishment = lazy(() => import("./pages/RegisterEstablishment"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderTracking = lazy(() => import("./pages/orders/OrderTracking"));
const Menu = lazy(() => import("./pages/Menu"));
const Favorites = lazy(() => import("./pages/Favorites"));
const ProductsListing = lazy(() => import("./pages/ProductsListing"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const ProductKitDetail = lazy(() => import("./pages/ProductKitDetail"));
const VilaTokPage = lazy(() => import("./pages/VilaTok"));
const VilaTokProfile = lazy(() => import("./pages/VilaTokProfile"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const Account = lazy(() => import("./pages/Account"));
const Addresses = lazy(() => import("./pages/Addresses"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Dashboard pages - lazy loaded
const EstablishmentDashboard = lazy(() => import("./pages/dashboard/EstablishmentDashboard"));
const ProductsManagement = lazy(() => import("./pages/dashboard/ProductsManagement"));
const CategoriesManagement = lazy(() => import("./pages/dashboard/CategoriesManagement"));
const OrdersManagement = lazy(() => import("./pages/dashboard/OrdersManagement"));
const PDV = lazy(() => import("./pages/dashboard/PDV"));
const BannersManagement = lazy(() => import("./pages/dashboard/BannersManagement"));
const CouponsManagement = lazy(() => import("./pages/dashboard/CouponsManagement"));
const DeliveryFeesManagement = lazy(() => import("./pages/dashboard/DeliveryFeesManagement"));
const CashFlowManagement = lazy(() => import("./pages/dashboard/CashFlowManagement"));
const QRCodeManagement = lazy(() => import("./pages/dashboard/QRCodeManagement"));
const ReportsManagement = lazy(() => import("./pages/dashboard/ReportsManagement"));
const WhatsAppManagement = lazy(() => import("./pages/dashboard/WhatsAppManagement"));
const IntegrationsManagement = lazy(() => import("./pages/dashboard/IntegrationsManagement"));
const IFoodIntegration = lazy(() => import("./pages/dashboard/IFoodIntegration"));
const ServiceAreaManagement = lazy(() => import("./pages/dashboard/ServiceAreaManagementNew"));
const MercadoPagoManagement = lazy(() => import("./pages/dashboard/MercadoPagoManagement"));
const MercadoPagoCallback = lazy(() => import("./pages/dashboard/MercadoPagoCallback"));
const WaiterApp = lazy(() => import("./pages/dashboard/WaiterApp"));
const KitchenDisplay = lazy(() => import("./pages/dashboard/KitchenDisplay"));

const AbandonedCartsManagement = lazy(() => import("./pages/dashboard/AbandonedCartsManagement"));
const ScheduledOrdersManagement = lazy(() => import("./pages/dashboard/ScheduledOrdersManagement"));
const DeliveryDriversManagement = lazy(() => import("./pages/dashboard/DeliveryDriversManagement"));
const AnalyticsPixelsManagement = lazy(() => import("./pages/dashboard/AnalyticsPixelsManagement"));
const InventoryManagement = lazy(() => import("./pages/dashboard/InventoryManagement"));
const AdvancedFinanceManagement = lazy(() => import("./pages/dashboard/AdvancedFinanceManagement"));

const PaymentsManagement = lazy(() => import("./pages/dashboard/PaymentsManagement"));
const VilaTokManagement = lazy(() => import("./pages/dashboard/VilaTokManagement"));
const AIAnalysisDashboard = lazy(() => import("./pages/dashboard/AIAnalysisDashboard"));
const EstablishmentSettings = lazy(() => import("./pages/dashboard/EstablishmentSettings"));
const AffiliateDashboard = lazy(() => import("./pages/dashboard/AffiliateDashboard"));
const ReviewsManagement = lazy(() => import("./pages/dashboard/ReviewsManagement"));
const ProductKitsManagement = lazy(() => import("./pages/dashboard/ProductKitsManagement"));
const ProductComplementsManagement = lazy(() => import("./pages/dashboard/ProductComplementsManagement"));
const CommissionDebtManagement = lazy(() => import("./pages/dashboard/CommissionDebtManagement"));
const SupportManagement = lazy(() => import("./pages/dashboard/SupportManagement"));
const UpgradePage = lazy(() => import("./pages/dashboard/UpgradePage"));
const TeamManagement = lazy(() => import("./pages/dashboard/TeamManagement"));
const TVSlideManagement = lazy(() => import("./pages/dashboard/TVSlideManagement"));
const MarketingHub = lazy(() => import("./pages/dashboard/MarketingHub"));
const DeliveryHub = lazy(() => import("./pages/dashboard/DeliveryHub"));
const IntelligenceHub = lazy(() => import("./pages/dashboard/IntelligenceHub"));
const AdminHub = lazy(() => import("./pages/dashboard/AdminHub"));
const ABCAnalysis = lazy(() => import("./pages/dashboard/ABCAnalysis"));
const DREReport = lazy(() => import("./pages/dashboard/DREReport"));
const LoyaltyManagement = lazy(() => import("./pages/dashboard/LoyaltyManagement"));
const BirthdayList = lazy(() => import("./pages/dashboard/BirthdayList"));
const TVSlidePlayer = lazy(() => import("./pages/display/TVSlidePlayer"));
const PublicKitchenDisplay = lazy(() => import("./pages/display/PublicKitchenDisplay"));

// Checkout callback pages
const CheckoutResult = lazy(() => import("./pages/checkout/CheckoutResult"));
const SubscriptionCallback = lazy(() => import("./pages/SubscriptionCallback"));

// Public pages
const ReviewOrder = lazy(() => import("./pages/ReviewOrder"));

// Admin pages - lazy loaded
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const EstablishmentsManagement = lazy(() => import("./pages/admin/EstablishmentsManagement"));
const VilasManagement = lazy(() => import("./pages/admin/VilasManagement"));
const PlansManagement = lazy(() => import("./pages/admin/PlansManagement"));
const SubscriptionsManagement = lazy(() => import("./pages/admin/SubscriptionsManagement"));
const AffiliatesManagement = lazy(() => import("./pages/admin/AffiliatesManagement"));
const CitiesManagement = lazy(() => import("./pages/admin/CitiesManagement"));
const StatesManagement = lazy(() => import("./pages/admin/StatesManagement"));
const SegmentsManagement = lazy(() => import("./pages/admin/SegmentsManagement"));
const MainCategoriesManagement = lazy(() => import("./pages/admin/MainCategoriesManagement"));
const AdminProductsManagement = lazy(() => import("./pages/admin/AdminProductsManagement"));
const AdminCategoriesManagement = lazy(() => import("./pages/admin/AdminCategoriesManagement"));
const CategorySuggestionsManagement = lazy(() => import("./pages/admin/CategorySuggestionsManagement"));
const AdminOrdersManagement = lazy(() => import("./pages/admin/AdminOrdersManagement"));
const AdminVouchersManagement = lazy(() => import("./pages/admin/AdminVouchersManagement"));
const DataMigration = lazy(() => import("./pages/admin/DataMigration"));
const ExternalDataMigration = lazy(() => import("./pages/admin/ExternalDataMigration"));
const DiagnosticoSistema = lazy(() => import("./pages/admin/DiagnosticoSistema"));
const ImplementationRoadmap = lazy(() => import("./pages/admin/ImplementationRoadmap"));
const DevelopmentRoadmap = lazy(() => import("./pages/admin/DevelopmentRoadmap"));
const SystemHealthCheck = lazy(() => import("./pages/admin/SystemHealthCheck"));
const ImageFillManager = lazy(() => import("./pages/admin/ImageFillManager"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const DatabaseManagement = lazy(() => import("./pages/admin/DatabaseManagement"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminFinancial = lazy(() => import("./pages/admin/AdminFinancial"));
const SecurityCenter = lazy(() => import("./pages/admin/SecurityCenter"));
const PixelsDiagnostic = lazy(() => import("./pages/admin/PixelsDiagnostic"));
const AdminWhatsAppManagement = lazy(() => import("./pages/admin/AdminWhatsAppManagement"));
const SystemBroadcastCRM = lazy(() => import("./pages/admin/SystemBroadcastCRM"));
const TestimonialsManagement = lazy(() => import("./pages/admin/TestimonialsManagement"));
const FAQManagement = lazy(() => import("./pages/admin/FAQManagement"));
const CompetitorFeesManagement = lazy(() => import("./pages/admin/CompetitorFeesManagement"));
const SecurityDocumentation = lazy(() => import("./pages/admin/SecurityDocumentation"));
const TestingGuide = lazy(() => import("./pages/admin/TestingGuide"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Saude = lazy(() => import("./pages/Saude"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
import { LojistaToPanel } from "./components/LegacyRedirects";

const AffiliateReferrals = lazy(() => import("./pages/affiliate/AffiliateReferrals"));
const AffiliateCommissions = lazy(() => import("./pages/affiliate/AffiliateCommissions"));
const AffiliateVouchers = lazy(() => import("./pages/affiliate/AffiliateVouchers"));
const AffiliateReports = lazy(() => import("./pages/affiliate/AffiliateReports"));
const AffiliateSettings = lazy(() => import("./pages/affiliate/AffiliateSettings"));

// Driver app - lazy loaded
const DriverApp = lazy(() => import("./pages/driver/DriverApp"));
const DriverRegister = lazy(() => import("./pages/driver/DriverRegister"));

const queryClient = new QueryClient();

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  
  return null;
};

// Component to handle browser back button after logout
// Must be inside AuthProvider
const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Check if user is authenticated when page loads (including from cache)
    const checkAuth = async () => {
      if (loading) return;
      
      // Skip check for public routes and admin routes (admin has its own auth handling)
      const publicRoutes = ['/auth', '/', '/marketplace', '/conheca', '/cadastro-estabelecimento', '/entregador/cadastro', '/recuperar-senha', '/recuperar-senha-whatsapp', '/termos', '/privacidade', '/saude', '/checkout'];
      const adminRoutes = location.pathname.startsWith('/admin');
      const isPublicRoute = publicRoutes.includes(location.pathname) || 
        location.pathname.startsWith('/loja/') || 
        location.pathname.startsWith('/vila/') || 
        location.pathname.startsWith('/vilas') || 
        location.pathname.startsWith('/vilatok') || 
        location.pathname.startsWith('/categoria/') ||
        location.pathname.startsWith('/checkout/') ||
        location.pathname.startsWith('/pedidos/') ||
        location.pathname.startsWith('/produto/') ||
        location.pathname.startsWith('/kit/') ||
        location.pathname.startsWith('/produtos/');
      
      // Skip global auth check for public routes and admin routes
      // Admin routes have their own ProtectedAdminRoute component handling auth
      if (isPublicRoute || adminRoutes) {
        return;
      }

      try {
        // Check if there's a valid session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If no session and trying to access protected route, redirect to auth
        if (!session && !user) {
          navigate('/auth', { replace: true });
        }
      } catch (error: any) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth();
  }, [location.pathname, user, loading, navigate]);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
                <Route path="/" element={<Index />} />
              <Route path="/conheca" element={<Conheca />} />
              <Route path="/cadastro-estabelecimento" element={<RegisterEstablishment />} />
              <Route path="/marketplace" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/termos" element={<TermsOfUse />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
              <Route path="/saude" element={<Saude />} />
              <Route path="/membro/privacidade" element={<Privacidade />} />
              <Route path="/recuperar-senha" element={<RecoverPassword />} />
              <Route path="/recuperar-senha-whatsapp" element={<RecoverPasswordWhatsApp />} />
              <Route path="/loja/:slug" element={<Store />} />
              <Route path="/vilatok" element={<VilaTokPage />} />
              <Route path="/vilatok/perfil/:username" element={<VilaTokProfile />} />
              <Route path="/categoria/:categoryId" element={<CategoryPage />} />
              <Route path="/categoria/:categoryId/:subcategoryId" element={<CategoryPage />} />
              <Route path="/vilas" element={<Vilas />} />
              <Route path="/vila/:slug" element={<Vila />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/resultado" element={<CheckoutResult />} />
              <Route path="/assinatura/resultado" element={<SubscriptionCallback />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/pedidos/:orderId/rastreamento" element={<OrderTracking />} />
              <Route path="/pedidos/:orderId/avaliar/:token" element={<ReviewOrder />} />
              <Route path="/meus-pedidos" element={<Orders />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/favoritos" element={<Favorites />} />
              <Route path="/conta" element={<Account />} />
              <Route path="/enderecos" element={<Addresses />} />
              <Route path="/produtos" element={<Navigate to="/produtos/destaques" replace />} />
              <Route path="/produtos/:section" element={<ProductsListing />} />
              <Route path="/produto/:id" element={<ProductDetail />} />
              <Route path="/kit/:id" element={<ProductKitDetail />} />
              {/* Dashboard routes with slug parameter for admin access */}
              <Route path="/painel" element={<EstablishmentDashboard />} />
              <Route path="/painel/:slug" element={<EstablishmentDashboard />} />
              <Route path="/painel/:slug/produtos" element={<ProductsManagement />} />
              <Route path="/painel/:slug/categorias" element={<CategoriesManagement />} />
              <Route path="/painel/:slug/pedidos" element={<OrdersManagement />} />
              <Route path="/painel/:slug/pdv" element={<PDV />} />
              <Route path="/painel/:slug/banners" element={<BannersManagement />} />
              <Route path="/painel/:slug/cupons" element={<CouponsManagement />} />
              <Route path="/painel/:slug/frete" element={<DeliveryFeesManagement />} />
              <Route path="/painel/:slug/fluxo" element={<CashFlowManagement />} />
              <Route path="/painel/:slug/qrcode" element={<QRCodeManagement />} />
              <Route path="/painel/:slug/relatorios" element={<ReportsManagement />} />
              <Route path="/painel/:slug/whatsapp" element={<WhatsAppManagement />} />
              <Route path="/painel/:slug/integracoes" element={<IntegrationsManagement />} />
              <Route path="/painel/:slug/ifood" element={<IFoodIntegration />} />
              <Route path="/painel/:slug/area-atendimento" element={<ServiceAreaManagement />} />
              <Route path="/painel/:slug/mercadopago" element={<MercadoPagoManagement />} />
              <Route path="/painel/:slug/comanda" element={<WaiterApp />} />
              <Route path="/painel/:slug/cozinha" element={<KitchenDisplay />} />
              
              <Route path="/painel/:slug/carrinhos-abandonados" element={<AbandonedCartsManagement />} />
              <Route path="/painel/:slug/agendados" element={<ScheduledOrdersManagement />} />
              <Route path="/painel/:slug/entregadores" element={<DeliveryDriversManagement />} />
              <Route path="/painel/:slug/pixels" element={<AnalyticsPixelsManagement />} />
              <Route path="/painel/:slug/estoque" element={<InventoryManagement />} />
              <Route path="/painel/:slug/financeiro" element={<AdvancedFinanceManagement />} />
              
              <Route path="/painel/:slug/pagamentos" element={<PaymentsManagement />} />
              <Route path="/painel/:slug/vilatok" element={<VilaTokManagement />} />
              <Route path="/painel/:slug/analise-ia" element={<AIAnalysisDashboard />} />
              <Route path="/painel/:slug/configuracoes" element={<EstablishmentSettings />} />
              <Route path="/painel/:slug/kits" element={<ProductKitsManagement />} />
              <Route path="/painel/:slug/complementos" element={<ProductComplementsManagement />} />
              <Route path="/painel/:slug/avaliacoes" element={<ReviewsManagement />} />
              <Route path="/painel/:slug/comissoes" element={<CommissionDebtManagement />} />
              <Route path="/painel/:slug/suporte" element={<SupportManagement />} />
              <Route path="/painel/:slug/upgrade" element={<UpgradePage />} />
              <Route path="/painel/:slug/equipe" element={<TeamManagement />} />
              <Route path="/painel/:slug/vilatok-tv" element={<TVSlideManagement />} />
              {/* Routes without slug for establishment owners */}
              <Route path="/painel/produtos" element={<ProductsManagement />} />
              <Route path="/painel/categorias" element={<CategoriesManagement />} />
              <Route path="/painel/pedidos" element={<OrdersManagement />} />
              <Route path="/painel/pdv" element={<PDV />} />
              <Route path="/painel/banners" element={<BannersManagement />} />
              <Route path="/painel/cupons" element={<CouponsManagement />} />
              <Route path="/painel/frete" element={<DeliveryFeesManagement />} />
              <Route path="/painel/fluxo" element={<CashFlowManagement />} />
              <Route path="/painel/qrcode" element={<QRCodeManagement />} />
              <Route path="/painel/relatorios" element={<ReportsManagement />} />
              <Route path="/painel/whatsapp" element={<WhatsAppManagement />} />
              <Route path="/painel/integracoes" element={<IntegrationsManagement />} />
              <Route path="/painel/area-atendimento" element={<ServiceAreaManagement />} />
              <Route path="/painel/mercadopago" element={<MercadoPagoManagement />} />
              <Route path="/painel/comanda" element={<WaiterApp />} />
              <Route path="/painel/cozinha" element={<KitchenDisplay />} />
              
              <Route path="/painel/carrinhos-abandonados" element={<AbandonedCartsManagement />} />
              <Route path="/painel/agendados" element={<ScheduledOrdersManagement />} />
              <Route path="/painel/entregadores" element={<DeliveryDriversManagement />} />
              <Route path="/painel/pixels" element={<AnalyticsPixelsManagement />} />
              <Route path="/painel/estoque" element={<InventoryManagement />} />
              <Route path="/painel/financeiro" element={<AdvancedFinanceManagement />} />
              
              <Route path="/painel/pagamentos" element={<PaymentsManagement />} />
              <Route path="/painel/vilatok" element={<VilaTokManagement />} />
              <Route path="/painel/vilatok-tv" element={<TVSlideManagement />} />
              <Route path="/painel/comissoes" element={<CommissionDebtManagement />} />
              <Route path="/painel/analise-ia" element={<AIAnalysisDashboard />} />
              <Route path="/painel/configuracoes" element={<EstablishmentSettings />} />
              <Route path="/painel/kits" element={<ProductKitsManagement />} />
              <Route path="/painel/complementos" element={<ProductComplementsManagement />} />
              <Route path="/painel/avaliacoes" element={<ReviewsManagement />} />
              <Route path="/painel/suporte" element={<SupportManagement />} />
              <Route path="/painel/upgrade" element={<UpgradePage />} />
              <Route path="/painel/equipe" element={<TeamManagement />} />
              
              {/* Hub pages - with and without slug */}
              <Route path="/painel/:slug/marketing" element={<MarketingHub />} />
              <Route path="/painel/:slug/entregas" element={<DeliveryHub />} />
              <Route path="/painel/:slug/inteligencia" element={<IntelligenceHub />} />
              <Route path="/painel/:slug/administracao" element={<AdminHub />} />
              <Route path="/painel/marketing" element={<MarketingHub />} />
              <Route path="/painel/entregas" element={<DeliveryHub />} />
              <Route path="/painel/inteligencia" element={<IntelligenceHub />} />
              <Route path="/painel/administracao" element={<AdminHub />} />
              
              {/* Financial analysis pages - with and without slug */}
              <Route path="/painel/:slug/curva-abc" element={<ABCAnalysis />} />
              <Route path="/painel/:slug/dre" element={<DREReport />} />
              <Route path="/painel/:slug/fidelidade" element={<LoyaltyManagement />} />
              <Route path="/painel/:slug/aniversariantes" element={<BirthdayList />} />
              <Route path="/painel/curva-abc" element={<ABCAnalysis />} />
              <Route path="/painel/dre" element={<DREReport />} />
              <Route path="/painel/fidelidade" element={<LoyaltyManagement />} />
              <Route path="/painel/aniversariantes" element={<BirthdayList />} />
              
              <Route path="/dashboard/mercadopago/callback" element={<MercadoPagoCallback />} />
              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
              <Route path="/admin/usuarios" element={<ProtectedAdminRoute><UsersManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/estabelecimentos" element={<ProtectedAdminRoute><EstablishmentsManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/vilas" element={<ProtectedAdminRoute><VilasManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/planos" element={<ProtectedAdminRoute><PlansManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/assinaturas" element={<ProtectedAdminRoute><SubscriptionsManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/afiliados" element={<ProtectedAdminRoute><AffiliatesManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/cidades" element={<ProtectedAdminRoute><CitiesManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/estados" element={<ProtectedAdminRoute><StatesManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/segmentos" element={<ProtectedAdminRoute><SegmentsManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/categorias-principais" element={<ProtectedAdminRoute><MainCategoriesManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/produtos" element={<ProtectedAdminRoute><AdminProductsManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/categorias" element={<ProtectedAdminRoute><AdminCategoriesManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/sugestoes-categorias" element={<ProtectedAdminRoute><CategorySuggestionsManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/pedidos" element={<ProtectedAdminRoute><AdminOrdersManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/vouchers" element={<ProtectedAdminRoute><AdminVouchersManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/migracao" element={<DataMigration />} />
              <Route path="/admin/migracao-externa" element={<ProtectedAdminRoute><ExternalDataMigration /></ProtectedAdminRoute>} />
              <Route path="/admin/diagnostico" element={<ProtectedAdminRoute><DiagnosticoSistema /></ProtectedAdminRoute>} />
              <Route path="/admin/health" element={<ProtectedAdminRoute><SystemHealthCheck /></ProtectedAdminRoute>} />
              <Route path="/admin/progresso" element={<ProtectedAdminRoute><ImplementationRoadmap /></ProtectedAdminRoute>} />
              <Route path="/admin/roadmap" element={<ProtectedAdminRoute><DevelopmentRoadmap /></ProtectedAdminRoute>} />
              <Route path="/admin/preencher-imagens" element={<ProtectedAdminRoute><ImageFillManager /></ProtectedAdminRoute>} />
              <Route path="/admin/configuracoes" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
              <Route path="/admin/banco-dados" element={<ProtectedAdminRoute><DatabaseManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/relatorios" element={<ProtectedAdminRoute><AdminReports /></ProtectedAdminRoute>} />
              <Route path="/admin/financeiro" element={<ProtectedAdminRoute><AdminFinancial /></ProtectedAdminRoute>} />
              <Route path="/admin/central-seguranca" element={<ProtectedAdminRoute><SecurityCenter /></ProtectedAdminRoute>} />
              <Route path="/admin/diagnostico-pixels" element={<ProtectedAdminRoute><PixelsDiagnostic /></ProtectedAdminRoute>} />
              <Route path="/admin/whatsapp" element={<ProtectedAdminRoute><AdminWhatsAppManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/crm-disparos" element={<ProtectedAdminRoute><SystemBroadcastCRM /></ProtectedAdminRoute>} />
              <Route path="/admin/depoimentos" element={<ProtectedAdminRoute><TestimonialsManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/faq" element={<ProtectedAdminRoute><FAQManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/taxas-concorrentes" element={<ProtectedAdminRoute><CompetitorFeesManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/documentacao-seguranca" element={<ProtectedAdminRoute><SecurityDocumentation /></ProtectedAdminRoute>} />
              <Route path="/admin/guia-testes" element={<ProtectedAdminRoute><TestingGuide /></ProtectedAdminRoute>} />
              {/* Affiliate routes */}
              <Route path="/afiliado" element={<AffiliateDashboard />} />
              <Route path="/afiliado/indicacoes" element={<AffiliateReferrals />} />
              <Route path="/afiliado/comissoes" element={<AffiliateCommissions />} />
              <Route path="/afiliado/vouchers" element={<AffiliateVouchers />} />
              <Route path="/afiliado/relatorios" element={<AffiliateReports />} />
              <Route path="/afiliado/configuracoes" element={<AffiliateSettings />} />
              {/* Driver app */}
              <Route path="/entregador" element={<DriverApp />} />
              <Route path="/entregador/cadastro" element={<DriverRegister />} />
              {/* Public display routes */}
              <Route path="/display/tv/:token" element={<TVSlidePlayer />} />
              <Route path="/display/cozinha/:token" element={<PublicKitchenDisplay />} />
              {/* Legacy redirects - /lojista → /painel */}
              <Route path="/lojista" element={<Navigate to="/painel" replace />} />
              <Route path="/lojista/:slug/*" element={<LojistaToPanel />} />
              <Route path="/lojista/:slug" element={<LojistaToPanel />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <AdminAccessProvider>
                <OrderSourceProvider>
                  <CartProvider>
                    <TooltipProvider>
                      <BrowserRouter>
                        <NotificationProvider>
                          <Toaster />
                          <Sonner />
                          <PWAInstallPrompt />
                          <CookieConsentBanner />
                          {/* Daré IA chat widget — gated por feature flag.
                              O componente também faz seu próprio gate por
                              `isDareConfigured()` (envs presentes). */}
                          {import.meta.env.VITE_DARE_ENABLED === "true" && (
                            <DareChatWidget />
                          )}
                          <AppRoutes />
                        </NotificationProvider>
                      </BrowserRouter>
                    </TooltipProvider>
                  </CartProvider>
                </OrderSourceProvider>
              </AdminAccessProvider>
            </AuthProvider>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
