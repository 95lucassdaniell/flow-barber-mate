// Singleton Global para Controle de Estado e Emergency Stop System
class GlobalStateManager {
  private static instance: GlobalStateManager;
  private mutex: Map<string, boolean> = new Map();
  private operationCounters: Map<string, number> = new Map();
  private lastOperationTime: Map<string, number> = new Map();
  private circuitBreaker: boolean = false;
  private maxOperationsPerSecond = 5;
  private emergencyStopActive = false;

  static getInstance(): GlobalStateManager {
    if (!GlobalStateManager.instance) {
      GlobalStateManager.instance = new GlobalStateManager();
    }
    return GlobalStateManager.instance;
  }

  // Mutex para prevenir operações simultâneas
  async acquireLock(operationKey: string): Promise<boolean> {
    if (this.emergencyStopActive) {
      console.warn('🚨 Emergency Stop ativo - operação bloqueada:', operationKey);
      return false;
    }

    if (this.mutex.get(operationKey)) {
      console.log('🔒 Mutex ativo para:', operationKey);
      return false;
    }

    // Verificar rate limiting
    const now = Date.now();
    const lastTime = this.lastOperationTime.get(operationKey) || 0;
    
    if (now - lastTime < 200) { // Mínimo 200ms entre operações
      console.log('⏱️ Rate limit ativo para:', operationKey);
      return false;
    }

    this.mutex.set(operationKey, true);
    this.lastOperationTime.set(operationKey, now);
    
    // Incrementar contador e verificar loop
    const count = (this.operationCounters.get(operationKey) || 0) + 1;
    this.operationCounters.set(operationKey, count);

    if (count > this.maxOperationsPerSecond) {
      console.error('🚨 Loop detectado para:', operationKey, 'Count:', count);
      this.activateEmergencyStop();
      return false;
    }

    // Reset contador após 1 segundo
    setTimeout(() => {
      this.operationCounters.set(operationKey, 0);
    }, 1000);

    return true;
  }

  releaseLock(operationKey: string): void {
    this.mutex.set(operationKey, false);
  }

  // Sistema de Circuit Breaker
  activateCircuitBreaker(): void {
    this.circuitBreaker = true;
    console.error('🔴 Circuit Breaker ativado - todas as operações suspensas');
    
    // Auto-reset após 5 segundos
    setTimeout(() => {
      this.circuitBreaker = false;
      console.log('🟢 Circuit Breaker resetado');
    }, 5000);
  }

  isCircuitBreakerActive(): boolean {
    return this.circuitBreaker;
  }

  // Emergency Stop System
  activateEmergencyStop(): void {
    this.emergencyStopActive = true;
    console.error('🚨 EMERGENCY STOP ATIVADO - Todas as operações bloqueadas');
    
    // Limpar todos os locks
    this.mutex.clear();
    this.operationCounters.clear();
    
    // Notificar usuário
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('emergency-stop-activated'));
    }
  }

  deactivateEmergencyStop(): void {
    this.emergencyStopActive = false;
    this.operationCounters.clear();
    console.log('✅ Emergency Stop desativado');
  }

  isEmergencyStopActive(): boolean {
    return this.emergencyStopActive;
  }

  // Relatório de debug
  getDebugReport(): any {
    return {
      mutexState: Object.fromEntries(this.mutex),
      operationCounters: Object.fromEntries(this.operationCounters),
      circuitBreakerActive: this.circuitBreaker,
      emergencyStopActive: this.emergencyStopActive,
      lastOperationTimes: Object.fromEntries(this.lastOperationTime)
    };
  }

  // Reset completo do sistema
  fullReset(): void {
    this.mutex.clear();
    this.operationCounters.clear();
    this.lastOperationTime.clear();
    this.circuitBreaker = false;
    this.emergencyStopActive = false;
    console.log('🔄 Sistema completamente resetado');
  }
}

export const globalState = GlobalStateManager.getInstance();

// Cache robusto com TTL
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

  set<T>(key: string, data: T, ttlMs: number = 300000): void { // 5 min default
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