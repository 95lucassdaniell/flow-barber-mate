import { useEffect, useState } from 'react';

interface EnvironmentInfo {
  isPreview: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  domain: string;
}

export const useEnvironmentDetection = (): EnvironmentInfo => {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo>({
    isPreview: false,
    isProduction: false,
    isDevelopment: false,
    domain: ''
  });

  useEffect(() => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    const isPreview = hostname.includes('lovable.app') || hostname.includes('localhost');
    const isProduction = !isPreview && protocol === 'https:';
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
    
    setEnvInfo({
      isPreview,
      isProduction,
      isDevelopment,
      domain: hostname
    });

    // Log environment info for debugging
    console.log('🌍 Environment Detection:', {
      hostname,
      protocol,
      isPreview,
      isProduction,
      isDevelopment,
      userAgent: navigator.userAgent
    });
  }, []);

  return envInfo;
};