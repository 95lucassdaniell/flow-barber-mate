import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import SchedulePageWithLayout from "./pages/SchedulePageWithLayout";
import ProvidersPage from "./pages/ProvidersPage";
import ClientsPage from "./pages/ClientsPage";
import ServicesPage from "./pages/ServicesPage";
import SettingsPage from "./pages/SettingsPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import CRMPage from "./pages/CRMPage";
import ProductsPage from "./pages/ProductsPage";
import CommandsPage from "./pages/CommandsPage";
import CaixaPage from "./pages/CaixaPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import SuperAdminBarbershopsPage from "./pages/SuperAdminBarbershopsPage";
import SuperAdminUsersPage from "./pages/SuperAdminUsersPage";
import SuperAdminFinancialPage from "./pages/SuperAdminFinancialPage";
import SuperAdminAuditPage from "./pages/SuperAdminAuditPage";
import SuperAdminSettingsPage from "./pages/SuperAdminSettingsPage";
import FinancialPage from "./pages/FinancialPage";
import AIPage from "./pages/AIPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/app/:slug" element={<DashboardPage />} />
          <Route path="/app/:slug/agenda/:date?" element={<SchedulePageWithLayout />} />
          <Route path="/app/:slug/prestadores" element={<ProvidersPage />} />
          <Route path="/app/:slug/clients" element={<ClientsPage />} />
          <Route path="/app/:slug/services" element={<ServicesPage />} />
          <Route path="/app/:slug/servicos" element={<ServicesPage />} />
          <Route path="/app/:slug/produtos" element={<ProductsPage />} />
          <Route path="/app/:slug/comandas" element={<CommandsPage />} />
          <Route path="/app/:slug/caixa" element={<CaixaPage />} />
          <Route path="/app/:slug/settings" element={<SettingsPage />} />
          <Route path="/app/:slug/whatsapp" element={<WhatsAppPage />} />
          <Route path="/app/:slug/crm" element={<CRMPage />} />
          <Route path="/app/:slug/ai" element={<AIPage />} />
          <Route path="/app/:slug/financial" element={<FinancialPage />} />
        <Route path="/super-admin" element={<SuperAdminPage />} />
        <Route path="/super-admin/barbershops" element={<SuperAdminBarbershopsPage />} />
        <Route path="/super-admin/users" element={<SuperAdminUsersPage />} />
        <Route path="/super-admin/financial" element={<SuperAdminFinancialPage />} />
        <Route path="/super-admin/audit" element={<SuperAdminAuditPage />} />
        <Route path="/super-admin/settings" element={<SuperAdminSettingsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
