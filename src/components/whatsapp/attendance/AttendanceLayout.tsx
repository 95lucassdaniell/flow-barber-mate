import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBarbershopSlug } from "@/hooks/useBarbershopSlug";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, LogOut, LogIn, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface AttendanceLayoutProps {
  children: ReactNode;
}

export const AttendanceLayout = ({ children }: AttendanceLayoutProps) => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate(`/app/${slug}`);
  };

  // Show authentication loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user || !profile?.barbershop_id) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-2xl mx-auto mt-20">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <LogIn className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Acesso restrito</h2>
              <p className="text-muted-foreground">
                Você precisa estar logado para acessar o atendimento WhatsApp.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Fazer Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBackToDashboard}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <div>
              <h1 className="text-xl font-semibold">Atendimento WhatsApp</h1>
              <p className="text-sm text-muted-foreground">
                Sistema dedicado para atendimento ao cliente
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={signOut}
              className="hover:bg-muted"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-73px)]">
        {children}
      </main>
    </div>
  );
};