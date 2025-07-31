import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { globalState } from '@/lib/globalState';

export const EmergencyStopUI = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const handleEmergencyStop = () => {
      setIsVisible(true);
      setDebugInfo(globalState.getDebugReport());
    };

    window.addEventListener('emergency-stop-activated', handleEmergencyStop);

    // Verificar se já está ativo
    if (globalState.isEmergencyStopActive()) {
      setIsVisible(true);
      setDebugInfo(globalState.getDebugReport());
    }

    return () => {
      window.removeEventListener('emergency-stop-activated', handleEmergencyStop);
    };
  }, []);

  const handleForceReset = () => {
    globalState.fullReset();
    setIsVisible(false);
    setDebugInfo(null);
    window.location.reload(); // Hard reset
  };

  const handleDeactivate = () => {
    globalState.deactivateEmergencyStop();
    setIsVisible(false);
    setDebugInfo(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sistema de Emergência Ativado</AlertTitle>
          <AlertDescription>
            Um loop infinito foi detectado. Todas as operações foram bloqueadas para proteger o sistema.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {debugInfo && (
            <div className="bg-muted p-3 rounded text-xs">
              <p><strong>Emergency Stop:</strong> {debugInfo.emergencyStopActive ? 'Ativo' : 'Inativo'}</p>
              <p><strong>Circuit Breaker:</strong> {debugInfo.circuitBreakerActive ? 'Ativo' : 'Inativo'}</p>
              <p><strong>Operações:</strong> {Object.keys(debugInfo.operationCounters).length}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleDeactivate}
              variant="outline"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Tentar Continuar
            </Button>
            <Button 
              onClick={handleForceReset}
              variant="destructive"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Completo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};