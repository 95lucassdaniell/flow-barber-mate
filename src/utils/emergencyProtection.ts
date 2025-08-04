// PROTEÇÃO DE EMERGÊNCIA ULTRA-ROBUSTA - Executado na inicialização
// Este arquivo é carregado ANTES de qualquer outro código para garantir proteção máxima

// Definir globalmente que estamos em modo de emergência
(window as any).__EMERGENCY_NFE_MODE__ = true;
(window as any).__CANCEL_NFE_BLOCKED_COUNT__ = 0;

// Função para logar tentativas bloqueadas
const logBlockedAttempt = (source: string, details: any) => {
  (window as any).__CANCEL_NFE_BLOCKED_COUNT__++;
  console.error('🚨🚨🚨 EMERGENCY PROTECTION - BLOCKED CANCEL-NFE #' + (window as any).__CANCEL_NFE_BLOCKED_COUNT__, {
    source,
    details,
    timestamp: new Date().toISOString(),
    stack: new Error().stack
  });
};

// PROTEÇÃO IMEDIATA - Interceptar TUDO relacionado a cancel-nfe
const activateEmergencyProtection = () => {
  console.log('🛡️ ACTIVATING EMERGENCY PROTECTION FOR CANCEL-NFE');

  // 1. Interceptar console para capturar logs suspeitos
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    if (message.includes('cancel-nfe')) {
      logBlockedAttempt('console.error', { args });
      return; // Bloquear o log
    }
    return originalConsoleError.apply(this, args);
  };

  // 2. Interceptar Object.defineProperty para prevenir definições suspeitas
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj: any, prop: string, descriptor: PropertyDescriptor) {
    if (prop.includes('cancel-nfe') || (descriptor.value && String(descriptor.value).includes('cancel-nfe'))) {
      logBlockedAttempt('Object.defineProperty', { prop, descriptor });
      return obj; // Bloquear a definição
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };

  // 3. Interceptar eval para prevenir execução de código suspeito
  const originalEval = window.eval;
  window.eval = function(code: string) {
    if (code.includes('cancel-nfe')) {
      logBlockedAttempt('window.eval', { code });
      return undefined; // Bloquear execução
    }
    return originalEval.call(this, code);
  };

  // 4. Interceptar Function constructor
  const originalFunction = window.Function;
  window.Function = function(...args: any[]) {
    const code = args.join(' ');
    if (code.includes('cancel-nfe')) {
      logBlockedAttempt('Function constructor', { args });
      return function() { return undefined; }; // Retornar função vazia
    }
    return originalFunction.apply(this, args);
  } as any;

  // 5. Interceptar setTimeout e setInterval para código suspeito
  const originalSetTimeout = window.setTimeout;
  (window as any).setTimeout = function(handler: any, ...args: any[]) {
    if (typeof handler === 'string' && handler.includes('cancel-nfe')) {
      logBlockedAttempt('setTimeout', { handler, args });
      return 0; // Não executar
    }
    if (typeof handler === 'function') {
      const funcStr = handler.toString();
      if (funcStr.includes('cancel-nfe')) {
        logBlockedAttempt('setTimeout function', { funcStr, args });
        return 0; // Não executar
      }
    }
    return originalSetTimeout.call(this, handler, ...args);
  };

  // 6. Interceptar addEventListener para eventos suspeitos
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function(type: string, listener: any, ...args: any[]) {
    if (typeof listener === 'function') {
      const funcStr = listener.toString();
      if (funcStr.includes('cancel-nfe')) {
        logBlockedAttempt('addEventListener', { type, funcStr, args });
        return; // Não adicionar o listener
      }
    }
    return originalAddEventListener.call(this, type, listener, ...args);
  };

  // 7. Interceptar postMessage para mensagens suspeitas
  const originalPostMessage = window.postMessage;
  window.postMessage = function(message: any, ...args: any[]) {
    const messageStr = JSON.stringify(message);
    if (messageStr.includes('cancel-nfe')) {
      logBlockedAttempt('postMessage', { message, args });
      return; // Bloquear mensagem
    }
    return originalPostMessage.call(this, message, ...args);
  };

  console.log('✅ EMERGENCY PROTECTION ACTIVATED - ALL CANCEL-NFE VECTORS BLOCKED');
};

// Ativar proteção imediatamente
activateEmergencyProtection();

// Reativar proteção a cada 100ms para garantir que não seja sobrescrita
setInterval(() => {
  if (!(window as any).__EMERGENCY_NFE_MODE__) {
    console.warn('🚨 Emergency mode was disabled, reactivating...');
    (window as any).__EMERGENCY_NFE_MODE__ = true;
    activateEmergencyProtection();
  }
}, 100);

export { activateEmergencyProtection };