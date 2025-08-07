import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBarbershopSlug } from "@/hooks/useBarbershopSlug";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface AttendanceLayoutProps {
  children: ReactNode;
}

export const AttendanceLayout = ({ children }: AttendanceLayoutProps) => {
  const { profile, signOut } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate(`/app/${slug}`);
  };

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