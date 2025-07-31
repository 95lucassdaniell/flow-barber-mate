import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Users, 
  MessageCircle, 
  DollarSign, 
  Settings, 
  Menu,
  Bell,
  LogOut,
  BarChart3,
  Scissors,
  TrendingUp,
  Package,
  Receipt,
  Brain
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBarbershopBySlug } from "@/hooks/useBarbershopBySlug";
import logo from "@/assets/barberflow-logo.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

const DashboardLayout = ({ children, activeTab = "dashboard" }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3, href: `/app/${slug}` },
    { id: "agenda", name: "Agenda", icon: Calendar, href: `/app/${slug}/agenda` },
    { id: "clients", name: "Clientes", icon: Users, href: `/app/${slug}/clients` },
    { id: "crm", name: "CRM", icon: TrendingUp, href: `/app/${slug}/crm` },
    { id: "ai", name: "IA Preditiva", icon: Brain, href: `/app/${slug}/ai` },
    { id: "providers", name: "Prestadores", icon: Users, href: `/app/${slug}/prestadores` },
    { id: "services", name: "Serviços", icon: Scissors, href: `/app/${slug}/services` },
    { id: "produtos", name: "Produtos", icon: Package, href: `/app/${slug}/produtos` },
    { id: "comandas", name: "Comandas", icon: Receipt, href: `/app/${slug}/comandas` },
    { id: "caixa", name: "Caixa", icon: DollarSign, href: `/app/${slug}/caixa` },
    { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, href: `/app/${slug}/whatsapp` },
    { id: "financial", name: "Financeiro", icon: DollarSign, href: `/app/${slug}/financial` },
    { id: "settings", name: "Configurações", icon: Settings, href: `/app/${slug}/settings` },
  ];

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

  return (
    <div className="min-h-screen bg-secondary/20 flex">
      {/* Sidebar */}
      <aside className={`bg-card border-r border-border transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-16 md:w-64"
      }`}>
        <div className="p-4 border-b border-border">
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="w-36 h-36">
              <AvatarImage src={barbershopData.logo_url} alt="Logo da barbearia" />
              <AvatarFallback className="text-2xl">
                {barbershopData.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className={`text-center ${sidebarOpen ? "block" : "hidden md:block"}`}>
              <h2 className="font-semibold text-lg">{barbershopData.name}</h2>
              <p className="text-sm text-muted-foreground">
                {profile?.role === 'admin' ? 'Administrador' : 
                 profile?.role === 'receptionist' ? 'Recepcionista' : 'Barbeiro'}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className={`${sidebarOpen ? "block" : "hidden md:block"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10" 
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className={`${sidebarOpen ? "block" : "hidden md:block"}`}>
              Sair
            </span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-semibold">
                {navigation.find(item => item.id === activeTab)?.name || "Dashboard"}
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
  );
};

export default DashboardLayout;