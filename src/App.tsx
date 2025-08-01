import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SessionGuard from "./components/auth/SessionGuard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import DashboardRedirect from "./pages/DashboardRedirect";
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
import SuperAdminMonitoringPage from "./pages/SuperAdminMonitoringPage";
import SuperAdminSettingsPage from "./pages/SuperAdminSettingsPage";
import SuperAdminHistoricalDataPage from "./pages/SuperAdminHistoricalDataPage";
import FinancialPage from "./pages/FinancialPage";
import AIPage from "./pages/AIPage";
import GoalsPage from "./pages/GoalsPage";
import ProviderLoginPage from "./components/providers/ProviderLoginPage";
import ProviderProtectedRoute from "./components/providers/ProviderProtectedRoute";
import ProviderDashboard from "./components/providers/dashboard/ProviderDashboard";
import ProviderDashboardLayout from "./components/providers/dashboard/ProviderDashboardLayout";
import ProviderSchedulePage from "./components/providers/schedule/ProviderSchedulePage";
import ProviderGoalsManagement from "./components/providers/goals/ProviderGoalsManagement";
import ProviderCommissionsPage from "./components/providers/commissions/ProviderCommissionsPage";
import ProviderClientsPage from "./components/providers/clients/ProviderClientsPage";
import { PublicBookingPage } from "./pages/PublicBookingPage";
import PublicReviewPage from "./pages/PublicReviewPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes - outside SessionGuard */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Public booking routes - outside SessionGuard */}
            <Route path="/app/:slug/agendamento" element={<PublicBookingPage />} />
            <Route path="/:slug/agendamento" element={<PublicBookingPage />} />
            
            {/* Public review routes - outside SessionGuard */}
            <Route path="/review/:slug" element={<PublicReviewPage />} />
            
            {/* All other routes wrapped in SessionGuard */}
            <Route path="/*" element={
              <SessionGuard>
                <Routes>
                  {/* Redirect invalid /dashboard route */}
                  <Route path="/dashboard" element={<DashboardRedirect />} />
                  
                  {/* Protected Routes */}
                  <Route path="/app/:slug" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/agenda/:date?" element={
                    <ProtectedRoute>
                      <SchedulePageWithLayout />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/prestadores" element={
                    <ProtectedRoute requiresRole="admin">
                      <ProvidersPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/metas" element={
                    <ProtectedRoute requiresRole="admin">
                      <GoalsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/clients" element={
                    <ProtectedRoute>
                      <ClientsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/services" element={
                    <ProtectedRoute requiresRole="admin">
                      <ServicesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/servicos" element={
                    <ProtectedRoute requiresRole="admin">
                      <ServicesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/produtos" element={
                    <ProtectedRoute requiresRole="admin">
                      <ProductsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/comandas" element={
                    <ProtectedRoute>
                      <CommandsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/caixa" element={
                    <ProtectedRoute>
                      <CaixaPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/settings" element={
                    <ProtectedRoute requiresRole="admin">
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/whatsapp" element={
                    <ProtectedRoute requiresRole="admin">
                      <WhatsAppPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/crm" element={
                    <ProtectedRoute requiresRole="admin">
                      <CRMPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/ai" element={
                    <ProtectedRoute requiresRole="admin">
                      <AIPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/:slug/financial" element={
                    <ProtectedRoute requiresRole="admin">
                      <FinancialPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Provider Routes - Portuguese */}
                  <Route path="/prestador/:slug/login" element={<ProviderLoginPage />} />
                  <Route path="/prestador/:slug/painel" element={
                    <ProviderProtectedRoute>
                      <ProviderDashboardLayout activeTab="painel">
                        <ProviderDashboard />
                      </ProviderDashboardLayout>
                    </ProviderProtectedRoute>
                  } />
                  <Route path="/prestador/:slug/agenda" element={
                    <ProviderProtectedRoute>
                      <ProviderDashboardLayout activeTab="agenda">
                        <ProviderSchedulePage />
                      </ProviderDashboardLayout>
                    </ProviderProtectedRoute>
                  } />
                  <Route path="/prestador/:slug/metas" element={
                    <ProviderProtectedRoute>
                      <ProviderDashboardLayout activeTab="metas">
                        <ProviderGoalsManagement />
                      </ProviderDashboardLayout>
                    </ProviderProtectedRoute>
                  } />
                  <Route path="/prestador/:slug/comissoes" element={
                    <ProviderProtectedRoute>
                      <ProviderDashboardLayout activeTab="comissoes">
                        <ProviderCommissionsPage />
                      </ProviderDashboardLayout>
                    </ProviderProtectedRoute>
                  } />
                  <Route path="/prestador/:slug/clientes" element={
                    <ProviderProtectedRoute>
                      <ProviderDashboardLayout activeTab="clientes">
                        <ProviderClientsPage />
                      </ProviderDashboardLayout>
                    </ProviderProtectedRoute>
                  } />

                  {/* Legacy Provider Routes - Redirect to Portuguese */}
                  <Route path="/provider/:slug/login" element={<Navigate to="/prestador/:slug/login" replace />} />
                  <Route path="/provider/:slug/*" element={<Navigate to="/prestador/:slug/painel" replace />} />
                  
                  {/* Super Admin Routes */}
                  <Route path="/super-admin" element={<SuperAdminPage />} />
                  <Route path="/super-admin/barbershops" element={<SuperAdminBarbershopsPage />} />
                  <Route path="/super-admin/users" element={<SuperAdminUsersPage />} />
                  <Route path="/super-admin/financial" element={<SuperAdminFinancialPage />} />
                  <Route path="/super-admin/monitoring" element={<SuperAdminMonitoringPage />} />
                  <Route path="/super-admin/audit" element={<SuperAdminAuditPage />} />
                  <Route path="/super-admin/settings" element={<SuperAdminSettingsPage />} />
                  <Route path="/super-admin/historical-data" element={<SuperAdminHistoricalDataPage />} />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </SessionGuard>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;