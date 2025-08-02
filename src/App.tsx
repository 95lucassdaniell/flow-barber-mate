import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
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

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
            
            {/* Redirect invalid /dashboard route */}
            <Route path="/dashboard" element={
              <SessionGuard>
                <DashboardRedirect />
              </SessionGuard>
            } />
            
            {/* Protected Routes - All wrapped in SessionGuard */}
            <Route path="/app/:slug" element={
              <SessionGuard>
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/agenda/:date?" element={
              <SessionGuard>
                <ProtectedRoute>
                  <SchedulePageWithLayout />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/prestadores" element={
              <SessionGuard>
                <ProtectedRoute requiresRole="admin">
                  <ProvidersPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/metas" element={
              <SessionGuard>
                <ProtectedRoute requiresRole="admin">
                  <GoalsPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/clients" element={
              <SessionGuard>
                <ProtectedRoute>
                  <ClientsPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/services" element={
              <SessionGuard>
                <ProtectedRoute requiresRole="admin">
                  <ServicesPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/servicos" element={
              <SessionGuard>
                <ProtectedRoute requiresRole="admin">
                  <ServicesPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/produtos" element={
              <SessionGuard>
                <ProtectedRoute requiresRole="admin">
                  <ProductsPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/comandas" element={
              <SessionGuard>
                <ProtectedRoute>
                  <CommandsPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/caixa" element={
              <SessionGuard>
                <ProtectedRoute>
                  <CaixaPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/settings" element={
              <SessionGuard>
                <ProtectedRoute requiresRole="admin">
                  <SettingsPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/whatsapp" element={
              <SessionGuard>
                <ProtectedRoute requiresRole="admin">
                  <WhatsAppPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/crm" element={
              <SessionGuard>
                <ProtectedRoute requiresRole="admin">
                  <CRMPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/ai" element={
              <SessionGuard>
                <ProtectedRoute requiresRole="admin">
                  <AIPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/app/:slug/financial" element={
              <SessionGuard>
                <ProtectedRoute requiresRole="admin">
                  <FinancialPage />
                </ProtectedRoute>
              </SessionGuard>
            } />
            
            {/* Provider Routes - Portuguese */}
            <Route path="/prestador/:slug/login" element={<ProviderLoginPage />} />
            <Route path="/prestador/:slug/painel" element={
              <SessionGuard>
                <ProviderProtectedRoute>
                  <ProviderDashboardLayout activeTab="painel">
                    <ProviderDashboard />
                  </ProviderDashboardLayout>
                </ProviderProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/prestador/:slug/agenda" element={
              <SessionGuard>
                <ProviderProtectedRoute>
                  <ProviderDashboardLayout activeTab="agenda">
                    <ProviderSchedulePage />
                  </ProviderDashboardLayout>
                </ProviderProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/prestador/:slug/metas" element={
              <SessionGuard>
                <ProviderProtectedRoute>
                  <ProviderDashboardLayout activeTab="metas">
                    <ProviderGoalsManagement />
                  </ProviderDashboardLayout>
                </ProviderProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/prestador/:slug/comissoes" element={
              <SessionGuard>
                <ProviderProtectedRoute>
                  <ProviderDashboardLayout activeTab="comissoes">
                    <ProviderCommissionsPage />
                  </ProviderDashboardLayout>
                </ProviderProtectedRoute>
              </SessionGuard>
            } />
            <Route path="/prestador/:slug/clientes" element={
              <SessionGuard>
                <ProviderProtectedRoute>
                  <ProviderDashboardLayout activeTab="clientes">
                    <ProviderClientsPage />
                  </ProviderDashboardLayout>
                </ProviderProtectedRoute>
              </SessionGuard>
            } />

            {/* Legacy Provider Routes - Redirect to Portuguese */}
            <Route path="/provider/:slug/login" element={<Navigate to="/prestador/:slug/login" replace />} />
            <Route path="/provider/:slug/*" element={<Navigate to="/prestador/:slug/painel" replace />} />
            
            {/* Super Admin Routes */}
            <Route path="/super-admin" element={
              <SessionGuard>
                <SuperAdminPage />
              </SessionGuard>
            } />
            <Route path="/super-admin/barbershops" element={
              <SessionGuard>
                <SuperAdminBarbershopsPage />
              </SessionGuard>
            } />
            <Route path="/super-admin/users" element={
              <SessionGuard>
                <SuperAdminUsersPage />
              </SessionGuard>
            } />
            <Route path="/super-admin/financial" element={
              <SessionGuard>
                <SuperAdminFinancialPage />
              </SessionGuard>
            } />
            <Route path="/super-admin/monitoring" element={
              <SessionGuard>
                <SuperAdminMonitoringPage />
              </SessionGuard>
            } />
            <Route path="/super-admin/audit" element={
              <SessionGuard>
                <SuperAdminAuditPage />
              </SessionGuard>
            } />
            <Route path="/super-admin/settings" element={
              <SessionGuard>
                <SuperAdminSettingsPage />
              </SessionGuard>
            } />
            <Route path="/super-admin/historical-data" element={
              <SessionGuard>
                <SuperAdminHistoricalDataPage />
              </SessionGuard>
            } />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
}

export default App;