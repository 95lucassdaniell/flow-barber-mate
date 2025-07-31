// Singleton Global Simplificado - Foco em Performance
class GlobalStateManager {
  private static instance: GlobalStateManager;
  private emergencyStopActive = false;
  private operationTimeouts: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): GlobalStateManager {
    if (!GlobalStateManager.instance) {
      GlobalStateManager.instance = new GlobalStateManager();
    }
    return GlobalStateManager.instance;
  }

  // Sistema simplificado - apenas Emergency Stop
  activateEmergencyStop(): void {
    this.emergencyStopActive = true;
    console.error('🚨 EMERGENCY STOP ATIVADO');
    
    // Limpar todos os timeouts
    this.operationTimeouts.forEach(timeout => clearTimeout(timeout));
    this.operationTimeouts.clear();
    
    // Notificar usuário
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('emergency-stop-activated'));
    }
  }

  deactivateEmergencyStop(): void {
    this.emergencyStopActive = false;
    console.log('✅ Emergency Stop desativado');
  }

  isEmergencyStopActive(): boolean {
    return this.emergencyStopActive;
  }

  // Timeout simples para operações
  setOperationTimeout(key: string, callback: () => void, timeoutMs: number = 3000): void {
    // Limpar timeout anterior se existir
    const existing = this.operationTimeouts.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timeout = setTimeout(() => {
      callback();
      this.operationTimeouts.delete(key);
    }, timeoutMs);

    this.operationTimeouts.set(key, timeout);
  }

  clearOperationTimeout(key: string): void {
    const timeout = this.operationTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.operationTimeouts.delete(key);
    }
  }

  // Reset completo do sistema
  fullReset(): void {
    this.operationTimeouts.clear();
    this.emergencyStopActive = false;
    console.log('🔄 Sistema completamente resetado');
  }
}

export const globalState = GlobalStateManager.getInstance();

// Cache simples com TTL
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem<any>> = new Map();

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  set<T>(key: string, data: T, ttlMs: number = 30000): void { // 30s default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

export const cacheManager = CacheManager.getInstance();