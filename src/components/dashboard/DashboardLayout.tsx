import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Users, 
  MessageCircle, 
  DollarSign, 
  Settings, 
  Bell,
  LogOut,
  BarChart3,
  Scissors,
  TrendingUp,
  Package,
  Receipt,
  Brain,
  Target,
  CreditCard,
  HandCoins,
  UsersIcon,
  ChevronRight,
  ChevronDown,
  FolderOpen
} from "lucide-react";
import salaoAiIcon from "@/assets/salao-ai-icon.png";
import { NavLink, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBarbershopBySlug } from "@/hooks/useBarbershopBySlug";
import usePageTitle from "@/hooks/usePageTitle";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

const AppSidebar = ({ barbershopData, profile, handleLogout, slug }: {
  barbershopData: { name: string; logo_url: string };
  profile: any;
  handleLogout: () => void;
  slug: string | undefined;
}) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [financialMenuOpen, setFinancialMenuOpen] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [cadastrosMenuOpen, setCadastrosMenuOpen] = useState(false);

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3, href: `/app/${slug}` },
    { id: "agenda", name: "Agenda", icon: Calendar, href: `/app/${slug}/agenda` },
    { id: "crm", name: "CRM", icon: TrendingUp, href: `/app/${slug}/crm` },
    { id: "metas", name: "Metas", icon: Target, href: `/app/${slug}/metas` },
    { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, href: `/app/${slug}/whatsapp` },
    { id: "settings", name: "Configurações", icon: Settings, href: `/app/${slug}/settings` },
  ];

  const cadastrosSubItems = [
    { id: "clients", name: "Clientes", icon: Users, href: `/app/${slug}/clients` },
    { id: "providers", name: "Prestadores", icon: Users, href: `/app/${slug}/prestadores` },
    { id: "produtos", name: "Produtos", icon: Package, href: `/app/${slug}/produtos` },
    { id: "services", name: "Serviços", icon: Scissors, href: `/app/${slug}/services` },
  ];

  const aiSubItems = [
    { id: "ai-insights", name: "Insights", icon: Brain, href: `/app/${slug}/ai/insights` },
    { id: "ai-clients", name: "Clientes", icon: Users, href: `/app/${slug}/ai/clientes` },
    { id: "ai-sales", name: "Vendas", icon: TrendingUp, href: `/app/${slug}/ai/vendas` },
    { id: "ai-automations", name: "Automações", icon: Target, href: `/app/${slug}/ai/automacoes` },
  ];

  const financialSubItems = [
    { id: "financial-dashboard", name: "Dashboard Geral", icon: BarChart3, href: `/app/${slug}/financial/dashboard` },
    { id: "financial-subscriptions", name: "Assinaturas", icon: CreditCard, href: `/app/${slug}/financial/assinaturas` },
    { id: "financial-commissions", name: "Comissões", icon: HandCoins, href: `/app/${slug}/financial/comissoes` },
    { id: "financial-providers", name: "Prestadores", icon: UsersIcon, href: `/app/${slug}/financial/prestadores` },
    { id: "comandas", name: "Comandas", icon: Receipt, href: `/app/${slug}/comandas` },
    { id: "caixa", name: "Caixa", icon: DollarSign, href: `/app/${slug}/caixa` },
  ];

  const isFinancialActive = currentPath.includes('/financial') || currentPath.includes('/comandas') || currentPath.includes('/caixa');
  const isAIActive = currentPath.includes('/ai');
  const isCadastrosActive = currentPath.includes('/clients') || currentPath.includes('/prestadores') || currentPath.includes('/produtos') || currentPath.includes('/services');
  const getNavCls = (href: string) => 
    currentPath === href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50";

  // Auto-expand menus if user is on their respective pages
  useEffect(() => {
    if (isFinancialActive) {
      setFinancialMenuOpen(true);
    }
    if (isAIActive) {
      setAiMenuOpen(true);
    }
    if (isCadastrosActive) {
      setCadastrosMenuOpen(true);
    }
  }, [isFinancialActive, isAIActive, isCadastrosActive]);

  return (
    <Sidebar>
      <SidebarContent>
        {/* Header with logo and barbershop info */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="w-24 h-24">
              <AvatarImage src={barbershopData.logo_url} alt="Logo da barbearia" />
              <AvatarFallback className="text-xl">
                {barbershopData.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="font-semibold text-lg text-sidebar-foreground">{barbershopData.name}</h2>
              <p className="text-sm text-sidebar-foreground/70">
                {profile?.role === 'admin' ? 'Administrador' : 
                 profile?.role === 'receptionist' ? 'Recepcionista' : 'Barbeiro'}
              </p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.href} className={getNavCls(item.href)}>
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              {/* Cadastros submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setCadastrosMenuOpen(!cadastrosMenuOpen)}
                  className={`cursor-pointer ${isCadastrosActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}
                >
                  <FolderOpen className="w-5 h-5" />
                  <span>Cadastros</span>
                  {cadastrosMenuOpen ? (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </SidebarMenuButton>
                {cadastrosMenuOpen && (
                  <SidebarMenuSub>
                    {cadastrosSubItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      
                      return (
                        <SidebarMenuSubItem key={subItem.id}>
                          <SidebarMenuSubButton asChild>
                            <NavLink to={subItem.href} className={getNavCls(subItem.href)}>
                              <SubIcon className="w-4 h-4" />
                              <span>{subItem.name}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              
              {/* AI submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setAiMenuOpen(!aiMenuOpen)}
                  className={`cursor-pointer ${isAIActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}
                >
                  <img src={salaoAiIcon} alt="Salão AI" className="w-5 h-5" />
                  <span>Salão AI</span>
                  {aiMenuOpen ? (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </SidebarMenuButton>
                {aiMenuOpen && (
                  <SidebarMenuSub>
                    {aiSubItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      
                      return (
                        <SidebarMenuSubItem key={subItem.id}>
                          <SidebarMenuSubButton asChild>
                            <NavLink to={subItem.href} className={getNavCls(subItem.href)}>
                              <SubIcon className="w-4 h-4" />
                              <span>{subItem.name}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              
              {/* Financial submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setFinancialMenuOpen(!financialMenuOpen)}
                  className={`cursor-pointer ${isFinancialActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Financeiro</span>
                  {financialMenuOpen ? (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </SidebarMenuButton>
                {financialMenuOpen && (
                  <SidebarMenuSub>
                    {financialSubItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      
                      return (
                        <SidebarMenuSubItem key={subItem.id}>
                          <SidebarMenuSubButton asChild>
                            <NavLink to={subItem.href} className={getNavCls(subItem.href)}>
                              <SubIcon className="w-4 h-4" />
                              <span>{subItem.name}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout button */}
        <div className="mt-auto p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10" 
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>Sair</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

const DashboardLayout = ({ children, activeTab = "dashboard" }: DashboardLayoutProps) => {
  const { slug } = useParams();
  const { profile, signOut } = useAuth();
  
  // Use slug-based fallback for immediate barbershop data
  const { barbershop: barbershopBySlug, loading: slugLoading } = useBarbershopBySlug(slug || '');
  
  const [barbershopData, setBarbershopData] = useState<{
    name: string;
    logo_url: string;
  }>({
    name: "Barbearia",
    logo_url: ""
  });

  // Debug logs for troubleshooting
  useEffect(() => {
    console.log('🏪 DashboardLayout state:', {
      slug,
      profileId: profile?.id,
      profileBarbershopId: profile?.barbershop_id,
      barbershopBySlugName: barbershopBySlug?.name,
      barbershopBySlugId: barbershopBySlug?.id,
      slugLoading,
      currentDataName: barbershopData.name,
      authLoading: !profile && !barbershopBySlug
    });
  }, [slug, profile, barbershopBySlug, slugLoading, barbershopData]);

  // Fallback effect: Use slug-based data immediately when available
  useEffect(() => {
    if (barbershopBySlug) {
      console.log('🔄 Using slug-based barbershop data (fallback):', barbershopBySlug);
      setBarbershopData({
        name: barbershopBySlug.name || "Barbearia",
        logo_url: barbershopBySlug.logo_url || ""
      });
    }
  }, [barbershopBySlug]);

  // Primary effect: Use profile-based data when available (can override slug data)
  useEffect(() => {
    if (profile?.barbershop_id) {
      console.log('🎯 Profile available, fetching barbershop data via profile...');
      fetchBarbershopData();
    }
  }, [profile]);

  const fetchBarbershopData = async () => {
    if (!profile?.barbershop_id) {
      console.warn('🚫 No barbershop_id in profile, skipping fetch');
      return;
    }

    try {
      console.log('📡 Fetching barbershop data for ID:', profile.barbershop_id);
      
      const { data, error } = await supabase
        .from('barbershops')
        .select('name, logo_url')
        .eq('id', profile.barbershop_id)
        .single();

      if (error) {
        console.error('Error fetching barbershop data via profile:', error);
        // Don't throw error, keep using fallback data
        return;
      }

      if (data) {
        console.log('✅ Barbershop data fetched via profile:', data.name);
        setBarbershopData({
          name: data.name || "Barbearia",
          logo_url: data.logo_url || ""
        });
      }
    } catch (error) {
      console.error('Error fetching barbershop data:', error);
      // Keep using fallback data from slug
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getTabTitle = (tabId: string) => {
    const tabNames: Record<string, string> = {
      dashboard: "Dashboard",
      agenda: "Agenda",
      clients: "Clientes",
      crm: "CRM",
      ai: "IA Preditiva",
      providers: "Prestadores",
      metas: "Metas",
      services: "Serviços",
      produtos: "Produtos",
      comandas: "Comandas",
      caixa: "Caixa",
      whatsapp: "WhatsApp",
      financial: "Financeiro",
      "financial-dashboard": "Dashboard Geral",
      "financial-subscriptions": "Assinaturas", 
      "financial-commissions": "Comissões",
      "financial-providers": "Prestadores",
      cadastros: "Cadastros",
      settings: "Configurações"
    };
    return tabNames[tabId] || "Dashboard";
  };

  // Update page title
  usePageTitle({ 
    title: getTabTitle(activeTab), 
    barbershopName: barbershopData.name 
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-secondary/20 flex w-full">
        <AppSidebar 
          barbershopData={barbershopData}
          profile={profile}
          handleLogout={handleLogout}
          slug={slug}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-semibold">
                  {getTabTitle(activeTab)}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Bell className="w-5 h-5" />
                </Button>
                <Avatar className="w-8 h-8">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;