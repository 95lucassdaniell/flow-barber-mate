// Singleton Global Simplificado - Foco em Performance
class GlobalStateManager {
  private static instance: GlobalStateManager;
  private emergencyStopActive = false;
  private operationTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private circuitBreakers = new Map<string, { count: number; lastReset: number; blocked: boolean }>();
  private rateLimiters = new Map<string, { calls: number; lastReset: number }>();

  static getInstance(): GlobalStateManager {
    if (!GlobalStateManager.instance) {
      GlobalStateManager.instance = new GlobalStateManager();
    }
    return GlobalStateManager.instance;
  }

  // Circuit breaker para prevenir loops infinitos
  checkCircuitBreaker(key: string, maxCalls: number = 10, timeWindow: number = 1000): boolean {
    const now = Date.now();
    const breaker = this.circuitBreakers.get(key) || { count: 0, lastReset: now, blocked: false };
    
    // Reset se passou o tempo limite
    if (now - breaker.lastReset > timeWindow) {
      breaker.count = 0;
      breaker.lastReset = now;
      breaker.blocked = false;
    }
    
    // Se está bloqueado, rejeitar
    if (breaker.blocked) {
      return false;
    }
    
    // Incrementar contador
    breaker.count++;
    
    // Se excedeu o limite, bloquear
    if (breaker.count > maxCalls) {
      breaker.blocked = true;
      console.warn(`🚨 Circuit breaker ativado para ${key}. Bloqueando execuções.`);
      return false;
    }
    
    this.circuitBreakers.set(key, breaker);
    return true;
  }

  // Rate limiter para hooks
  checkRateLimit(key: string, maxCalls: number = 5, timeWindow: number = 1000): boolean {
    const now = Date.now();
    const limiter = this.rateLimiters.get(key) || { calls: 0, lastReset: now };
    
    // Reset se passou o tempo limite
    if (now - limiter.lastReset > timeWindow) {
      limiter.calls = 0;
      limiter.lastReset = now;
    }
    
    // Se excedeu o limite, rejeitar
    if (limiter.calls >= maxCalls) {
      return false;
    }
    
    limiter.calls++;
    this.rateLimiters.set(key, limiter);
    return true;
  }

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

  setOperationTimeout(key: string, callback: () => void, timeoutMs: number = 3000): void {
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

  fullReset(): void {
    this.operationTimeouts.clear();
    this.emergencyStopActive = false;
    this.circuitBreakers.clear();
    this.rateLimiters.clear();
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