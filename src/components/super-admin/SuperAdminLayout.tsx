import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Menu, 
  BarChart3, 
  Building2, 
  Users, 
  Settings, 
  LogOut,
  Shield,
  Activity,
  DollarSign,
  Monitor,
  Bell
} from "lucide-react";
import { useSuperAuth } from "@/hooks/useSuperAuth";
import { Link, useLocation } from "react-router-dom";
import usePageTitle from "@/hooks/usePageTitle";

interface SuperAdminLayoutProps {
  children: ReactNode;
  activeTab?: string;
}

export default function SuperAdminLayout({ children, activeTab }: SuperAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { superAdmin, signOut } = useSuperAuth();
  const location = useLocation();

  // Get current page title from pathname
  const getCurrentTitle = () => {
    const pathParts = location.pathname.split('/');
    const page = pathParts[pathParts.length - 1] || 'dashboard';
    
    const titles: Record<string, string> = {
      'super-admin': 'Dashboard',
      'dashboard': 'Dashboard',
      'barbershops': 'Barbearias',
      'users': 'Usuários',
      'financial': 'Financeiro',
      'monitoring': 'Monitoramento',
      'audit': 'Auditoria',
      'settings': 'Configurações',
      'historical': 'Dados Históricos'
    };
    
    return titles[page] || 'Dashboard';
  };

  // Update page title
  usePageTitle({ 
    title: `${getCurrentTitle()} | Super Admin` 
  });

  const navigation = [
    { name: "Dashboard", icon: BarChart3, href: "/super-admin", current: location.pathname === "/super-admin" },
    { name: "Barbearias", icon: Building2, href: "/super-admin/barbershops", current: location.pathname === "/super-admin/barbershops" },
    { name: "Usuários", icon: Users, href: "/super-admin/users", current: location.pathname === "/super-admin/users" },
    { name: "Financeiro", icon: DollarSign, href: "/super-admin/financial", current: location.pathname === "/super-admin/financial" },
    { name: "Monitoramento", icon: Monitor, href: "/super-admin/monitoring", current: location.pathname === "/super-admin/monitoring" },
    { name: "Auditoria", icon: Activity, href: "/super-admin/audit", current: location.pathname === "/super-admin/audit" },
    { name: "Configurações", icon: Settings, href: "/super-admin/settings", current: location.pathname === "/super-admin/settings" },
  ];

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-card border-r">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Shield className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold">Super Admin</span>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t p-4">
            <div className="flex items-center w-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {superAdmin?.full_name?.charAt(0) || "SA"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{superAdmin?.full_name}</p>
                <p className="text-xs text-muted-foreground">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden fixed top-4 left-4 z-40"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex flex-col h-full bg-card">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <Shield className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold">Super Admin</span>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      item.current
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t p-4">
              <div className="flex items-center w-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {superAdmin?.full_name?.charAt(0) || "SA"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">{superAdmin?.full_name}</p>
                  <p className="text-xs text-muted-foreground">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Header */}
      <div className="md:pl-64 flex flex-col flex-1">
        <header className="bg-background border-b h-14 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">{getCurrentTitle()}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {superAdmin?.full_name?.charAt(0) || "SA"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}