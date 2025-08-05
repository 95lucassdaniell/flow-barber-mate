export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'subscription' | 'billing' | 'auth' | 'api' | 'component' | 'general';

interface LogConfig {
  enabled: boolean;
  categories: Set<LogCategory>;
  levels: Set<LogLevel>;
  showTimestamp: boolean;
  groupLogs: boolean;
}

class DebugLogger {
  private config: LogConfig = {
    enabled: true,
    categories: new Set(['subscription', 'billing', 'auth', 'api', 'component']),
    levels: new Set(['debug', 'info', 'warn', 'error']),
    showTimestamp: true,
    groupLogs: true
  };

  private colors = {
    debug: '#6366f1',
    info: '#3b82f6', 
    warn: '#f59e0b',
    error: '#ef4444',
    subscription: '#8b5cf6',
    billing: '#06b6d4',
    auth: '#10b981',
    api: '#f97316',
    component: '#ec4899'
  };

  configure(newConfig: Partial<LogConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  enableCategory(category: LogCategory) {
    this.config.categories.add(category);
  }

  disableCategory(category: LogCategory) {
    this.config.categories.delete(category);
  }

  enableLevel(level: LogLevel) {
    this.config.levels.add(level);
  }

  disableLevel(level: LogLevel) {
    this.config.levels.delete(level);
  }

  private shouldLog(category: LogCategory, level: LogLevel): boolean {
    return this.config.enabled && 
           this.config.categories.has(category) && 
           this.config.levels.has(level);
  }

  private formatMessage(category: LogCategory, level: LogLevel, component: string, message: string): string {
    const timestamp = this.config.showTimestamp ? `[${new Date().toLocaleTimeString()}]` : '';
    return `${timestamp} [${category.toUpperCase()}] ${component}: ${message}`;
  }

  private getStyle(category: LogCategory, level: LogLevel): string {
    const categoryColor = this.colors[category];
    const levelColor = this.colors[level];
    return `color: ${levelColor}; font-weight: bold; background: ${categoryColor}15; padding: 2px 8px; border-radius: 4px;`;
  }

  log(category: LogCategory, level: LogLevel, component: string, message: string, data?: any) {
    if (!this.shouldLog(category, level)) return;

    const formattedMessage = this.formatMessage(category, level, component, message);
    const style = this.getStyle(category, level);

    switch (level) {
      case 'debug':
        console.debug(`%c${formattedMessage}`, style, data || '');
        break;
      case 'info':
        console.info(`%c${formattedMessage}`, style, data || '');
        break;
      case 'warn':
        console.warn(`%c${formattedMessage}`, style, data || '');
        break;
      case 'error':
        console.error(`%c${formattedMessage}`, style, data || '');
        break;
    }
  }

  group(category: LogCategory, component: string, label: string, fn: () => void) {
    if (!this.shouldLog(category, 'debug') || !this.config.groupLogs) {
      fn();
      return;
    }

    const style = this.getStyle(category, 'debug');
    console.group(`%c[${category.toUpperCase()}] ${component}: ${label}`, style);
    fn();
    console.groupEnd();
  }

  // Convenience methods
  subscription = {
    debug: (component: string, message: string, data?: any) => 
      this.log('subscription', 'debug', component, message, data),
    info: (component: string, message: string, data?: any) => 
      this.log('subscription', 'info', component, message, data),
    warn: (component: string, message: string, data?: any) => 
      this.log('subscription', 'warn', component, message, data),
    error: (component: string, message: string, data?: any) => 
      this.log('subscription', 'error', component, message, data),
    group: (component: string, label: string, fn: () => void) => 
      this.group('subscription', component, label, fn)
  };

  billing = {
    debug: (component: string, message: string, data?: any) => 
      this.log('billing', 'debug', component, message, data),
    info: (component: string, message: string, data?: any) => 
      this.log('billing', 'info', component, message, data),
    warn: (component: string, message: string, data?: any) => 
      this.log('billing', 'warn', component, message, data),
    error: (component: string, message: string, data?: any) => 
      this.log('billing', 'error', component, message, data),
    group: (component: string, label: string, fn: () => void) => 
      this.group('billing', component, label, fn)
  };

  // Métodos para controle via console
  showHelp() {
    console.log(`%c
🚀 Sistema de Debug - Comandos Disponíveis:

debugLogger.enableCategory('subscription')  - Ativar logs de assinatura
debugLogger.disableCategory('subscription') - Desativar logs de assinatura

Categorias disponíveis: subscription, billing, auth, api, component

debugLogger.enableLevel('debug')   - Ativar nível debug
debugLogger.disableLevel('debug')  - Desativar nível debug

Níveis disponíveis: debug, info, warn, error

debugLogger.configure({ enabled: false })  - Desativar todos os logs
debugLogger.configure({ enabled: true })   - Ativar todos os logs

Para logs apenas de assinatura:
debugLogger.configure({ categories: new Set(['subscription']) })

Para resetar configuração:
debugLogger.configure({ 
  categories: new Set(['subscription', 'billing', 'auth', 'api', 'component']),
  levels: new Set(['debug', 'info', 'warn', 'error'])
})
    `, 'color: #10b981; font-size: 12px;');
  }
}

export const debugLogger = new DebugLogger();

// Disponibilizar globalmente para controle via console
if (typeof window !== 'undefined') {
  (window as any).debugLogger = debugLogger;
}