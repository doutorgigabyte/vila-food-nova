import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
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
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AffiliateDashboard from "./pages/dashboard/AffiliateDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import EstablishmentsManagement from "./pages/admin/EstablishmentsManagement";
import PlansManagement from "./pages/admin/PlansManagement";
import SubscriptionsManagement from "./pages/admin/SubscriptionsManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/recuperar-senha" element={<RecoverPassword />} />
            <Route path="/cadastro-estabelecimento" element={<RegisterEstablishment />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/loja/:slug" element={<Store />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/painel" element={<EstablishmentDashboard />} />
            <Route path="/painel/produtos" element={<ProductsManagement />} />
            <Route path="/painel/categorias" element={<CategoriesManagement />} />
            <Route path="/painel/pedidos" element={<OrdersManagement />} />
            <Route path="/painel/pdv" element={<PDV />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/usuarios" element={<UsersManagement />} />
            <Route path="/admin/estabelecimentos" element={<EstablishmentsManagement />} />
            <Route path="/admin/planos" element={<PlansManagement />} />
            <Route path="/admin/assinaturas" element={<SubscriptionsManagement />} />
            <Route path="/afiliado" element={<AffiliateDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
