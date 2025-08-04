// NUCLEAR RESET COMPONENT
import { useEffect } from 'react';

const NuclearReset = () => {
  useEffect(() => {
    console.log('🚨 NUCLEAR RESET: Performing EXTREME cache destruction...');
    
    const OLD_PROJECT = 'qtasdgvngwsukvqdzkdn';
    
    // NUCLEAR CACHE DESTRUCTION
    const performNuclearReset = async () => {
      try {
        // 1. Clear ALL storage
        localStorage.clear();
        sessionStorage.clear();
        
        // 2. Clear ALL cookies
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        });
        
        // 3. Clear ALL caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        // 4. Unregister ALL service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
        }
        
        // 5. Clear IndexedDB
        if ('indexedDB' in window) {
          const dbs = ['supabase-cache', 'app-cache', 'workbox-precache'];
          for (const dbName of dbs) {
            try {
              await new Promise((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(dbName);
                deleteReq.onsuccess = () => resolve(true);
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            } catch (e) {
              console.log('DB delete failed:', e);
            }
          }
        }
        
        console.log('✅ NUCLEAR RESET: All caches destroyed');
        
        // 6. NUCLEAR RELOAD with cache busting
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?nuclear_reset=${timestamp}&random=${random}`;
        
        console.log('🚨 NUCLEAR RESET: Reloading with:', newUrl);
        window.location.href = newUrl;
        
      } catch (error) {
        console.error('NUCLEAR RESET ERROR:', error);
        // Force reload anyway
        window.location.reload();
      }
    };
    
    // Check if we need nuclear reset
    const checkForOldProject = () => {
      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('nuclear_reset')) {
        console.log('✅ NUCLEAR RESET: Already performed, skipping');
        return false;
      }
      
      // Check for old project references in various places
      const checks = [
        () => JSON.stringify(window).includes(OLD_PROJECT),
        () => document.documentElement.innerHTML.includes(OLD_PROJECT),
        () => localStorage.getItem('supabase.auth.token')?.includes(OLD_PROJECT),
        () => Object.keys(localStorage).some(key => localStorage.getItem(key)?.includes(OLD_PROJECT))
      ];
      
      for (const check of checks) {
        try {
          if (check()) {
            console.error('🚨 NUCLEAR RESET: Old project reference found!');
            return true;
          }
        } catch (e) {
          // Ignore errors
        }
      }
      
      return false;
    };
    
    // Perform nuclear reset if needed
    if (checkForOldProject()) {
      console.error('🚨 NUCLEAR RESET: Initiating nuclear reset...');
      performNuclearReset();
    }
    
    // Monitor for any future old project calls
    let errorCount = 0;
    const errorHandler = (event: ErrorEvent) => {
      if (event.message?.includes(OLD_PROJECT)) {
        errorCount++;
        console.error(`🚨 NUCLEAR RESET: Error #${errorCount} contains old project:`, event.message);
        
        if (errorCount >= 3) {
          console.error('🚨 NUCLEAR RESET: Too many old project errors - initiating reset');
          performNuclearReset();
        }
      }
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: '90px',
        right: '10px',
        zIndex: 10001,
        backgroundColor: '#7c2d12',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 'bold',
        border: '2px solid #fb923c'
      }}
    >
      ☢️ NUCLEAR RESET ACTIVE
    </div>
  );
};

export default NuclearReset;