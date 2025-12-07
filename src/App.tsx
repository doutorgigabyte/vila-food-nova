import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AdminAccessProvider } from "./contexts/AdminAccessContext";
import { CartProvider } from "./hooks/useCart";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Vila from "./pages/Vila";
import Vilas from "./pages/Vilas";
import Conheca from "./pages/Conheca";
import VilasManagement from "./pages/admin/VilasManagement";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RecoverPassword from "./pages/RecoverPassword";
import RegisterEstablishment from "./pages/RegisterEstablishment";
import Marketplace from "./pages/Marketplace";
import Store from "./pages/Store";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import EstablishmentDashboard from "./pages/dashboard/EstablishmentDashboard";
import ProductsManagement from "./pages/dashboard/ProductsManagement";
import CategoriesManagement from "./pages/dashboard/CategoriesManagement";
import OrdersManagement from "./pages/dashboard/OrdersManagement";
import PDV from "./pages/dashboard/PDV";
import BannersManagement from "./pages/dashboard/BannersManagement";
import CouponsManagement from "./pages/dashboard/CouponsManagement";
import DeliveryFeesManagement from "./pages/dashboard/DeliveryFeesManagement";
import CashFlowManagement from "./pages/dashboard/CashFlowManagement";
import QRCodeManagement from "./pages/dashboard/QRCodeManagement";
import ReportsManagement from "./pages/dashboard/ReportsManagement";
import WhatsAppManagement from "./pages/dashboard/WhatsAppManagement";
import IntegrationsManagement from "./pages/dashboard/IntegrationsManagement";
import ServiceAreaManagement from "./pages/dashboard/ServiceAreaManagement";
import MercadoPagoManagement from "./pages/dashboard/MercadoPagoManagement";
import MercadoPagoCallback from "./pages/dashboard/MercadoPagoCallback";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AffiliateDashboard from "./pages/dashboard/AffiliateDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import EstablishmentsManagement from "./pages/admin/EstablishmentsManagement";
import PlansManagement from "./pages/admin/PlansManagement";
import SubscriptionsManagement from "./pages/admin/SubscriptionsManagement";
import CitiesManagement from "./pages/admin/CitiesManagement";
import StatesManagement from "./pages/admin/StatesManagement";
import SegmentsManagement from "./pages/admin/SegmentsManagement";
import MainCategoriesManagement from "./pages/admin/MainCategoriesManagement";
import AdminProductsManagement from "./pages/admin/AdminProductsManagement";
import AdminCategoriesManagement from "./pages/admin/AdminCategoriesManagement";
import AdminOrdersManagement from "./pages/admin/AdminOrdersManagement";
import AdminVouchersManagement from "./pages/admin/AdminVouchersManagement";
import NotFound from "./pages/NotFound";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
// New dashboard pages
import WaiterApp from "./pages/dashboard/WaiterApp";
import KitchenDisplay from "./pages/dashboard/KitchenDisplay";
import CashbackManagement from "./pages/dashboard/CashbackManagement";
import AbandonedCartsManagement from "./pages/dashboard/AbandonedCartsManagement";
import ScheduledOrdersManagement from "./pages/dashboard/ScheduledOrdersManagement";
import DeliveryDriversManagement from "./pages/dashboard/DeliveryDriversManagement";
import AnalyticsPixelsManagement from "./pages/dashboard/AnalyticsPixelsManagement";
import InventoryManagement from "./pages/dashboard/InventoryManagement";
import AdvancedFinanceManagement from "./pages/dashboard/AdvancedFinanceManagement";
import SuppliersManagement from "./pages/dashboard/SuppliersManagement";
import PaymentsManagement from "./pages/dashboard/PaymentsManagement";
import DataMigration from "./pages/admin/DataMigration";
import ExternalDataMigration from "./pages/admin/ExternalDataMigration";
import Roadmap from "./pages/admin/Roadmap";
import SystemHealthCheck from "./pages/admin/SystemHealthCheck";
import AffiliatesManagement from "./pages/admin/AffiliatesManagement";
import ImageFillManager from "./pages/admin/ImageFillManager";
import VilaTokPage from "./pages/VilaTok";
import VideosManagement from "./pages/dashboard/VideosManagement";
import StoriesManagement from "./pages/dashboard/StoriesManagement";
import CategoryPage from "./pages/CategoryPage";
import Menu from "./pages/Menu";
import Favorites from "./pages/Favorites";
import ProductsListing from "./pages/ProductsListing";
import ProductDetail from "./pages/ProductDetail";
import AIAnalysisDashboard from "./pages/dashboard/AIAnalysisDashboard";
import EstablishmentSettings from "./pages/dashboard/EstablishmentSettings";
import { OrderSourceProvider } from "./hooks/useOrderSource";
import { NotificationProvider } from "./components/notifications/NotificationProvider";
// Affiliate pages
import AffiliateReferrals from "./pages/affiliate/AffiliateReferrals";
import AffiliateCommissions from "./pages/affiliate/AffiliateCommissions";
import AffiliateVouchers from "./pages/affiliate/AffiliateVouchers";
import AffiliateReports from "./pages/affiliate/AffiliateReports";
import AffiliateSettings from "./pages/affiliate/AffiliateSettings";
// Admin settings
import AdminSettings from "./pages/admin/AdminSettings";
import DatabaseManagement from "./pages/admin/DatabaseManagement";
// Driver app
import DriverApp from "./pages/driver/DriverApp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Routes>
                <Route path="/" element={<Index />} />
              <Route path="/conheca" element={<Conheca />} />
              <Route path="/marketplace" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/recuperar-senha" element={<RecoverPassword />} />
              <Route path="/loja/:slug" element={<Store />} />
              <Route path="/vilatok" element={<VilaTokPage />} />
              <Route path="/categoria/:categoryId" element={<CategoryPage />} />
              <Route path="/categoria/:categoryId/:subcategoryId" element={<CategoryPage />} />
              <Route path="/vilas" element={<Vilas />} />
              <Route path="/vila/:slug" element={<Vila />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/favoritos" element={<Favorites />} />
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
              <Route path="/painel/:slug/cashback" element={<CashbackManagement />} />
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
              <Route path="/painel/cashback" element={<CashbackManagement />} />
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
              <Route path="/admin/roadmap" element={<ProtectedAdminRoute><Roadmap /></ProtectedAdminRoute>} />
              <Route path="/admin/health" element={<ProtectedAdminRoute><SystemHealthCheck /></ProtectedAdminRoute>} />
              <Route path="/admin/preencher-imagens" element={<ProtectedAdminRoute><ImageFillManager /></ProtectedAdminRoute>} />
              <Route path="/admin/configuracoes" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
              <Route path="/admin/banco-dados" element={<ProtectedAdminRoute><DatabaseManagement /></ProtectedAdminRoute>} />
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
            </BrowserRouter>
              </TooltipProvider>
            </NotificationProvider>
          </CartProvider>
        </OrderSourceProvider>
      </AdminAccessProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
