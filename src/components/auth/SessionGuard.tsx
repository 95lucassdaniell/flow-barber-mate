import { ReactNode } from 'react';
import { useSessionRestore } from '@/hooks/useSessionRestore';
import { Loader2 } from 'lucide-react';

interface SessionGuardProps {
  children: ReactNode;
}

const SessionGuard = ({ children }: SessionGuardProps) => {
  const { isRestoring } = useSessionRestore();

  if (isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Restaurando sessão...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SessionGuard;