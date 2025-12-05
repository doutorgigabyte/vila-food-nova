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
import AdminProductsManagement from "./pages/admin/AdminProductsManagement";
import AdminCategoriesManagement from "./pages/admin/AdminCategoriesManagement";
import AdminOrdersManagement from "./pages/admin/AdminOrdersManagement";
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
import Roadmap from "./pages/admin/Roadmap";
import SystemHealthCheck from "./pages/admin/SystemHealthCheck";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminAccessProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/recuperar-senha" element={<RecoverPassword />} />
              <Route path="/cadastro-estabelecimento" element={<RegisterEstablishment />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/loja/:slug" element={<Store />} />
              <Route path="/vilas" element={<Vilas />} />
              <Route path="/vila/:slug" element={<Vila />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pedidos" element={<Orders />} />
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
              <Route path="/dashboard/mercadopago" element={<MercadoPagoManagement />} />
              <Route path="/dashboard/mercadopago/callback" element={<MercadoPagoCallback />} />
              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
              <Route path="/admin/usuarios" element={<ProtectedAdminRoute><UsersManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/estabelecimentos" element={<ProtectedAdminRoute><EstablishmentsManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/vilas" element={<ProtectedAdminRoute><VilasManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/planos" element={<ProtectedAdminRoute><PlansManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/assinaturas" element={<ProtectedAdminRoute><SubscriptionsManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/cidades" element={<ProtectedAdminRoute><CitiesManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/estados" element={<ProtectedAdminRoute><StatesManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/segmentos" element={<ProtectedAdminRoute><SegmentsManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/produtos" element={<ProtectedAdminRoute><AdminProductsManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/categorias" element={<ProtectedAdminRoute><AdminCategoriesManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/pedidos" element={<ProtectedAdminRoute><AdminOrdersManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/migracao" element={<DataMigration />} />
              <Route path="/admin/roadmap" element={<ProtectedAdminRoute><Roadmap /></ProtectedAdminRoute>} />
              <Route path="/admin/health" element={<ProtectedAdminRoute><SystemHealthCheck /></ProtectedAdminRoute>} />
              <Route path="/afiliado" element={<AffiliateDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AdminAccessProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
