import { CacheManager } from '@/utils/cacheManager';

// Função para resetar a aplicação
const resetApplicationState = () => {
  CacheManager.emergencyReset();
};

const EmergencyStopUI = () => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}
      onClick={resetApplicationState}
      title="Clique para resetar a aplicação e limpar erros de cache"
    >
      🚨 RESET APP
    </div>
  );
};

export default EmergencyStopUI;