import { ReactNode, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProviderAuth } from '@/hooks/useProviderAuth';
import { useProviderBarbershop } from '@/hooks/useProviderBarbershop';
import { 
  Menu, 
  Calendar, 
  DollarSign, 
  Target, 
  Users, 
  LogOut,
  BarChart3,
  CreditCard
} from 'lucide-react';

interface ProviderDashboardLayoutProps {
  children: ReactNode;
  activeTab?: string;
}

const ProviderDashboardLayout = ({ children, activeTab }: ProviderDashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useProviderAuth();
  const { barbershop } = useProviderBarbershop();
  const location = useLocation();
  const { slug } = useParams();

  const navigation = [
    {
      name: 'Painel',
      href: `/prestador/${slug}/painel`,
      icon: BarChart3,
      current: activeTab === 'painel' || location.pathname === `/prestador/${slug}/painel`
    },
    {
      name: 'Agenda',
      href: `/prestador/${slug}/agenda`,
      icon: Calendar,
      current: activeTab === 'agenda'
    },
    {
      name: 'Assinaturas',
      href: `/prestador/${slug}/assinaturas`,
      icon: CreditCard,
      current: activeTab === 'assinaturas'
    },
    {
      name: 'Comissões',
      href: `/prestador/${slug}/comissoes`,
      icon: DollarSign,
      current: activeTab === 'comissoes'
    },
    {
      name: 'Metas',
      href: `/prestador/${slug}/metas`,
      icon: Target,
      current: activeTab === 'metas'
    },
    {
      name: 'Clientes',
      href: `/prestador/${slug}/clientes`,
      icon: Users,
      current: activeTab === 'clientes'
    }
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-full' : 'w-64'}`}>
      <div className="flex items-center gap-2 p-6 border-b">
        <Avatar className="w-8 h-8">
          {barbershop?.logo_url ? (
            <AvatarImage src={barbershop.logo_url} alt={barbershop.name} />
          ) : null}
          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
            {barbershop?.name?.charAt(0).toUpperCase() || 'P'}
          </AvatarFallback>
        </Avatar>
        <span className="font-bold text-lg">{barbershop?.name || 'Portal do Prestador'}</span>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${item.current 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">
              {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.full_name || 'Prestador'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <div className="flex flex-col w-full bg-card border-r">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-4 border-b bg-card">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                {barbershop?.logo_url ? (
                  <AvatarImage src={barbershop.logo_url} alt={barbershop.name} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                  {barbershop?.name?.charAt(0).toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <span className="font-bold">{barbershop?.name || 'Portal do Prestador'}</span>
            </div>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
          </div>
        </div>
        <SheetContent side="left" className="p-0 w-80">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ProviderDashboardLayout;