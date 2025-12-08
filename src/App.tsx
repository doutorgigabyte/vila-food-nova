import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { AdminAccessProvider } from "./contexts/AdminAccessContext";
import { CartProvider } from "./hooks/useCart";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
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
const RegisterEstablishment = lazy(() => import("./pages/RegisterEstablishment"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Menu = lazy(() => import("./pages/Menu"));
const Favorites = lazy(() => import("./pages/Favorites"));
const ProductsListing = lazy(() => import("./pages/ProductsListing"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
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
const ServiceAreaManagement = lazy(() => import("./pages/dashboard/ServiceAreaManagement"));
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
const SuppliersManagement = lazy(() => import("./pages/dashboard/SuppliersManagement"));
const PaymentsManagement = lazy(() => import("./pages/dashboard/PaymentsManagement"));
const VideosManagement = lazy(() => import("./pages/dashboard/VideosManagement"));
const StoriesManagement = lazy(() => import("./pages/dashboard/StoriesManagement"));
const AIAnalysisDashboard = lazy(() => import("./pages/dashboard/AIAnalysisDashboard"));
const EstablishmentSettings = lazy(() => import("./pages/dashboard/EstablishmentSettings"));
const AffiliateDashboard = lazy(() => import("./pages/dashboard/AffiliateDashboard"));

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
const AdminOrdersManagement = lazy(() => import("./pages/admin/AdminOrdersManagement"));
const AdminVouchersManagement = lazy(() => import("./pages/admin/AdminVouchersManagement"));
const DataMigration = lazy(() => import("./pages/admin/DataMigration"));
const ExternalDataMigration = lazy(() => import("./pages/admin/ExternalDataMigration"));
const DiagnosticoSistema = lazy(() => import("./pages/admin/DiagnosticoSistema"));
const Roadmap = lazy(() => import("./pages/admin/Roadmap"));
const ImplementationRoadmap = lazy(() => import("./pages/admin/ImplementationRoadmap"));
const SystemHealthCheck = lazy(() => import("./pages/admin/SystemHealthCheck"));
const ImageFillManager = lazy(() => import("./pages/admin/ImageFillManager"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const DatabaseManagement = lazy(() => import("./pages/admin/DatabaseManagement"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminFinancial = lazy(() => import("./pages/admin/AdminFinancial"));
const SecurityCenter = lazy(() => import("./pages/admin/SecurityCenter"));
const PixelsDiagnostic = lazy(() => import("./pages/admin/PixelsDiagnostic"));

const AffiliateReferrals = lazy(() => import("./pages/affiliate/AffiliateReferrals"));
const AffiliateCommissions = lazy(() => import("./pages/affiliate/AffiliateCommissions"));
const AffiliateVouchers = lazy(() => import("./pages/affiliate/AffiliateVouchers"));
const AffiliateReports = lazy(() => import("./pages/affiliate/AffiliateReports"));
const AffiliateSettings = lazy(() => import("./pages/affiliate/AffiliateSettings"));

// Driver app - lazy loaded
const DriverApp = lazy(() => import("./pages/driver/DriverApp"));

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
      
      // Skip check for public routes
      const publicRoutes = ['/auth', '/', '/marketplace', '/conheca', '/recuperar-senha'];
      const isPublicRoute = publicRoutes.includes(location.pathname) || 
        location.pathname.startsWith('/loja/') || 
        location.pathname.startsWith('/vila/') || 
        location.pathname.startsWith('/vilas') || 
        location.pathname.startsWith('/vilatok') || 
        location.pathname.startsWith('/categoria/');
      
      if (isPublicRoute) {
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
              <Route path="/marketplace" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/recuperar-senha" element={<RecoverPassword />} />
              <Route path="/loja/:slug" element={<Store />} />
              <Route path="/vilatok" element={<VilaTokPage />} />
              <Route path="/vilatok/perfil/:username" element={<VilaTokProfile />} />
              <Route path="/categoria/:categoryId" element={<CategoryPage />} />
              <Route path="/categoria/:categoryId/:subcategoryId" element={<CategoryPage />} />
              <Route path="/vilas" element={<Vilas />} />
              <Route path="/vila/:slug" element={<Vila />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/favoritos" element={<Favorites />} />
              <Route path="/conta" element={<Account />} />
              <Route path="/enderecos" element={<Addresses />} />
              <Route path="/produtos/:section" element={<ProductsListing />} />
              <Route path="/produto/:id" element={<ProductDetail />} />
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
              <Route path="/painel/:slug/fornecedores" element={<SuppliersManagement />} />
              <Route path="/painel/:slug/pagamentos" element={<PaymentsManagement />} />
              <Route path="/painel/:slug/videos" element={<VideosManagement />} />
              <Route path="/painel/:slug/stories" element={<StoriesManagement />} />
              <Route path="/painel/:slug/analise-ia" element={<AIAnalysisDashboard />} />
              <Route path="/painel/:slug/configuracoes" element={<EstablishmentSettings />} />
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
              <Route path="/painel/fornecedores" element={<SuppliersManagement />} />
              <Route path="/painel/pagamentos" element={<PaymentsManagement />} />
              <Route path="/painel/stories" element={<StoriesManagement />} />
              <Route path="/painel/analise-ia" element={<AIAnalysisDashboard />} />
              <Route path="/painel/configuracoes" element={<EstablishmentSettings />} />
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
              <Route path="/admin/pedidos" element={<ProtectedAdminRoute><AdminOrdersManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/vouchers" element={<ProtectedAdminRoute><AdminVouchersManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/migracao" element={<DataMigration />} />
              <Route path="/admin/migracao-externa" element={<ProtectedAdminRoute><ExternalDataMigration /></ProtectedAdminRoute>} />
              <Route path="/admin/diagnostico" element={<ProtectedAdminRoute><DiagnosticoSistema /></ProtectedAdminRoute>} />
              <Route path="/admin/roadmap" element={<ProtectedAdminRoute><Roadmap /></ProtectedAdminRoute>} />
              <Route path="/admin/health" element={<ProtectedAdminRoute><SystemHealthCheck /></ProtectedAdminRoute>} />
              <Route path="/admin/progresso" element={<ProtectedAdminRoute><ImplementationRoadmap /></ProtectedAdminRoute>} />
              <Route path="/admin/preencher-imagens" element={<ProtectedAdminRoute><ImageFillManager /></ProtectedAdminRoute>} />
              <Route path="/admin/configuracoes" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
              <Route path="/admin/banco-dados" element={<ProtectedAdminRoute><DatabaseManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/relatorios" element={<ProtectedAdminRoute><AdminReports /></ProtectedAdminRoute>} />
              <Route path="/admin/financeiro" element={<ProtectedAdminRoute><AdminFinancial /></ProtectedAdminRoute>} />
              <Route path="/admin/central-seguranca" element={<ProtectedAdminRoute><SecurityCenter /></ProtectedAdminRoute>} />
              <Route path="/admin/diagnostico-pixels" element={<ProtectedAdminRoute><PixelsDiagnostic /></ProtectedAdminRoute>} />
              {/* Affiliate routes */}
              <Route path="/afiliado" element={<AffiliateDashboard />} />
              <Route path="/afiliado/indicacoes" element={<AffiliateReferrals />} />
              <Route path="/afiliado/comissoes" element={<AffiliateCommissions />} />
              <Route path="/afiliado/vouchers" element={<AffiliateVouchers />} />
              <Route path="/afiliado/relatorios" element={<AffiliateReports />} />
              <Route path="/afiliado/configuracoes" element={<AffiliateSettings />} />
              {/* Driver app */}
              <Route path="/entregador" element={<DriverApp />} />
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <AdminAccessProvider>
              <OrderSourceProvider>
                <CartProvider>
                  <NotificationProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <PWAInstallPrompt />
                      <BrowserRouter>
                        <AppRoutes />
                      </BrowserRouter>
                    </TooltipProvider>
                  </NotificationProvider>
                </CartProvider>
              </OrderSourceProvider>
            </AdminAccessProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
