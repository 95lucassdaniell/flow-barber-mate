import { useState } from "react";
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
  Scissors
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import logo from "@/assets/barberflow-logo.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

const DashboardLayout = ({ children, activeTab = "dashboard" }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { slug } = useParams();

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3, href: `/dashboard/${slug}` },
    { id: "agenda", name: "Agenda", icon: Calendar, href: `/dashboard/${slug}/agenda` },
    { id: "clients", name: "Clientes", icon: Users, href: `/dashboard/${slug}/clients` },
    { id: "services", name: "Serviços", icon: Scissors, href: `/dashboard/${slug}/services` },
    { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, href: `/dashboard/${slug}/whatsapp` },
    { id: "financial", name: "Financeiro", icon: DollarSign, href: `/dashboard/${slug}/financial` },
    { id: "settings", name: "Configurações", icon: Settings, href: `/dashboard/${slug}/settings` },
  ];

  return (
    <div className="min-h-screen bg-secondary/20 flex">
      {/* Sidebar */}
      <aside className={`bg-card border-r border-border transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-16 md:w-64"
      }`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="BarberFlow" className="w-8 h-8" />
            <div className={`${sidebarOpen ? "block" : "hidden md:block"}`}>
              <h2 className="font-semibold">Navalha de Ouro</h2>
              <p className="text-sm text-muted-foreground">Admin</p>
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
          <Button variant="ghost" className="w-full justify-start" size="sm">
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
                <AvatarFallback>CS</AvatarFallback>
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