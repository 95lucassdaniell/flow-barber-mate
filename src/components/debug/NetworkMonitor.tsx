import { useEffect, useState } from 'react';

interface NetworkCall {
  id: string;
  method: string;
  url: string;
  timestamp: Date;
  isOldProject: boolean;
  blocked: boolean;
}

const NetworkMonitor = () => {
  const [calls, setCalls] = useState<NetworkCall[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;

    // Monitor fetch calls
    window.fetch = function(...args) {
      const url = args[0] instanceof Request ? args[0].url : args[0].toString();
      const method = args[1]?.method || 'GET';
      
      const call: NetworkCall = {
        id: Date.now() + Math.random().toString(),
        method,
        url,
        timestamp: new Date(),
        isOldProject: url.includes('qtasdgvngwsukvqdzkdn'),
        blocked: url.includes('qtasdgvngwsukvqdzkdn')
      };

      setCalls(prev => [call, ...prev.slice(0, 49)]); // Keep last 50
      
      return originalFetch.apply(this, args);
    };

    // Monitor XHR calls
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args) {
      const urlString = url.toString();
      
      const call: NetworkCall = {
        id: Date.now() + Math.random().toString(),
        method,
        url: urlString,
        timestamp: new Date(),
        isOldProject: urlString.includes('qtasdgvngwsukvqdzkdn'),
        blocked: urlString.includes('qtasdgvngwsukvqdzkdn')
      };

      setCalls(prev => [call, ...prev.slice(0, 49)]);
      
      return originalXHROpen.call(this, method, url, ...args);
    };

    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white px-3 py-2 rounded text-xs"
      >
        📡 Network Monitor
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg w-96 max-h-80 overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 border-b flex justify-between items-center">
        <span className="font-semibold text-sm">Network Monitor</span>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="p-2 max-h-64 overflow-y-auto">
        {calls.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma chamada detectada</p>
        ) : (
          calls.map(call => (
            <div 
              key={call.id} 
              className={`mb-2 p-2 rounded text-xs ${
                call.isOldProject 
                  ? 'bg-red-100 border border-red-300' 
                  : 'bg-green-100 border border-green-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-mono font-semibold">{call.method}</span>
                <span className="text-gray-500">
                  {call.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-1 break-all">
                {call.url.length > 80 ? call.url.substring(0, 80) + '...' : call.url}
              </div>
              {call.isOldProject && (
                <div className="mt-1 text-red-600 font-semibold">
                  🚨 PROJETO ANTIGO DETECTADO
                </div>
              )}
              {call.blocked && (
                <div className="mt-1 text-orange-600 font-semibold">
                  🛑 BLOQUEADO
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="bg-gray-100 px-3 py-2 border-t">
        <button 
          onClick={() => setCalls([])}
          className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
        >
          Limpar Log
        </button>
      </div>
    </div>
  );
};

export default NetworkMonitor;