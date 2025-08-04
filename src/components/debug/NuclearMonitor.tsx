import { useEffect } from 'react';

const NuclearMonitor = () => {
  useEffect(() => {
    console.log('🚨 NUCLEAR MONITOR: Starting extreme monitoring...');
    
    const OLD_PROJECT = 'qtasdgvngwsukvqdzkdn';
    let detectionCount = 0;
    
    // Monitor ALL network activity
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes(OLD_PROJECT)) {
          detectionCount++;
          console.error(`🚨🚨🚨 NUCLEAR ALERT #${detectionCount}: Performance entry detected for old project:`, entry);
          console.log('Entry details:', entry);
          
          // If too many detections, force nuclear reset
          if (detectionCount > 5) {
            console.error('🚨 NUCLEAR OVERLOAD - FORCING EMERGENCY RESET');
            window.location.href = window.location.href + '?nuclear_reset=' + Date.now();
          }
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource', 'navigation'] });
    
    // Monitor console for any old project references
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes(OLD_PROJECT)) {
        console.warn('🚨 NUCLEAR: Console error contains old project reference:', message);
      }
      return originalConsoleError.apply(this, args);
    };
    
    // Check for any global variables that might contain old project references
    const checkGlobals = () => {
      try {
        const globalCheck = JSON.stringify(window).includes(OLD_PROJECT);
        if (globalCheck) {
          console.error('🚨 NUCLEAR: Found old project reference in global scope!');
        }
      } catch (e) {
        // Ignore circular reference errors
      }
    };
    
    checkGlobals();
    const globalCheckInterval = setInterval(checkGlobals, 10000);
    
    return () => {
      observer.disconnect();
      console.error = originalConsoleError;
      clearInterval(globalCheckInterval);
    };
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: '50px',
        right: '10px',
        zIndex: 10000,
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 'bold',
        border: '2px solid #fca5a5'
      }}
    >
      🚨 NUCLEAR MONITOR ACTIVE
    </div>
  );
};

export default NuclearMonitor;