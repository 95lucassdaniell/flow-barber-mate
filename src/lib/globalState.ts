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

// Sistema de Cache Inteligente com Invalidação Automática
interface CacheItemWithTriggers<T> extends CacheItem<T> {
  triggers: string[];
  barbershopId?: string;
}

interface RealtimeSubscription {
  channel: any;
  callback: () => void;
}

class IntelligentCacheManager extends CacheManager {
  private static intelligentInstance: IntelligentCacheManager;
  private cacheWithTriggers: Map<string, CacheItemWithTriggers<any>> = new Map();
  private triggerToKeysMap: Map<string, Set<string>> = new Map();
  private realtimeSubscriptions: Map<string, RealtimeSubscription> = new Map();
  private isListeningToRealtime = false;

  static getInstance(): IntelligentCacheManager {
    if (!IntelligentCacheManager.intelligentInstance) {
      IntelligentCacheManager.intelligentInstance = new IntelligentCacheManager();
    }
    return IntelligentCacheManager.intelligentInstance;
  }

  // Cache com triggers de invalidação
  setWithInvalidation<T>(
    key: string, 
    data: T, 
    ttlMs: number = 300000, // 5 minutos default
    triggers: string[] = [],
    barbershopId?: string
  ): void {
    this.cacheWithTriggers.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      triggers,
      barbershopId
    });

    // Mapear triggers para keys
    triggers.forEach(trigger => {
      if (!this.triggerToKeysMap.has(trigger)) {
        this.triggerToKeysMap.set(trigger, new Set());
      }
      this.triggerToKeysMap.get(trigger)!.add(key);
    });

    this.ensureRealtimeSubscriptions();
  }

  // Buscar com verificação de invalidação
  getIntelligent<T>(key: string): { data: T | null; fromCache: boolean } {
    const item = this.cacheWithTriggers.get(key);
    
    if (!item) {
      return { data: null, fromCache: false };
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cacheWithTriggers.delete(key);
      return { data: null, fromCache: false };
    }

    return { data: item.data, fromCache: true };
  }

  // Invalidar cache por trigger
  invalidateByTrigger(trigger: string, barbershopId?: string): void {
    const keysToInvalidate = this.triggerToKeysMap.get(trigger);
    
    if (!keysToInvalidate) return;

    keysToInvalidate.forEach(key => {
      const item = this.cacheWithTriggers.get(key);
      
      // Se tem barbershopId, só invalidar se corresponder
      if (item && (!barbershopId || item.barbershopId === barbershopId)) {
        this.cacheWithTriggers.delete(key);
        console.log(`🗑️ Cache invalidado: ${key} (trigger: ${trigger})`);
      }
    });

    // Limpar referências vazias
    keysToInvalidate.clear();
  }

  // Configurar subscriptions de realtime
  private ensureRealtimeSubscriptions(): void {
    if (this.isListeningToRealtime) return;

    const tables = [
      'commands', 'command_items', 'sales', 'commissions',
      'subscription_financial_records', 'client_subscriptions',
      'expenses', 'profiles', 'clients'
    ];

    // Importar supabase dinamicamente para evitar circular dependency
    import('@/integrations/supabase/client').then(({ supabase }) => {
      tables.forEach(table => {
        const channel = supabase
          .channel(`cache-invalidation-${table}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table
          }, (payload) => this.handleRealtimeChange(table, payload))
          .subscribe();

        this.realtimeSubscriptions.set(table, {
          channel,
          callback: () => this.invalidateByTrigger(table)
        });
      });

      this.isListeningToRealtime = true;
      console.log('🔄 Realtime cache invalidation ativado');
    });
  }

  // Manipular mudanças em tempo real
  private handleRealtimeChange(table: string, payload: any): void {
    const barbershopId = payload.new?.barbershop_id || payload.old?.barbershop_id;
    
    console.log(`🔔 Realtime change detected: ${table}`, payload.eventType);
    
    // Invalidar cache específico da barbearia
    this.invalidateByTrigger(table, barbershopId);
    
    // Invalidar triggers relacionados
    const relatedTriggers = this.getRelatedTriggers(table);
    relatedTriggers.forEach(trigger => {
      this.invalidateByTrigger(trigger, barbershopId);
    });
  }

  // Mapear triggers relacionados
  private getRelatedTriggers(table: string): string[] {
    const triggerMap: Record<string, string[]> = {
      'commands': ['financial-stats', 'barber-rankings', 'commissions'],
      'command_items': ['financial-stats', 'barber-rankings', 'commissions'],
      'sales': ['financial-stats'],
      'subscription_financial_records': ['subscription-billing', 'subscription-stats'],
      'client_subscriptions': ['subscription-stats', 'subscription-billing'],
      'expenses': ['expense-data'],
      'profiles': ['barber-rankings'],
      'clients': ['commissions', 'subscription-billing']
    };

    return triggerMap[table] || [];
  }

  // Limpar subscriptions
  destroy(): void {
    this.realtimeSubscriptions.forEach(({ channel }) => {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.warn('Erro ao desinscrever canal:', error);
      }
    });
    
    this.realtimeSubscriptions.clear();
    this.cacheWithTriggers.clear();
    this.triggerToKeysMap.clear();
    this.isListeningToRealtime = false;
  }

  // Debug: obter estatísticas do cache
  getCacheStats(): {
    totalItems: number;
    hitRate: number;
    triggers: string[];
    subscriptions: string[];
  } {
    return {
      totalItems: this.cacheWithTriggers.size,
      hitRate: 0, // Implementar se necessário
      triggers: Array.from(this.triggerToKeysMap.keys()),
      subscriptions: Array.from(this.realtimeSubscriptions.keys())
    };
  }
}

export const intelligentCache = IntelligentCacheManager.getInstance();