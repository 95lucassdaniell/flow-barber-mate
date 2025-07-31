import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePageVisibility } from '@/hooks/usePageVisibility';

export const LiveClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const isPageVisible = usePageVisibility();

  useEffect(() => {
    if (!isPageVisible) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isPageVisible]);

  const formattedDate = format(currentTime, "dd/MM/yyyy", { locale: ptBR });
  const formattedTime = format(currentTime, "HH:mm:ss", { locale: ptBR });

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Clock className="h-4 w-4" />
      <div className="flex flex-col text-right">
        <div className="text-sm font-medium">{formattedDate}</div>
        <div className="text-xs">{formattedTime}</div>
      </div>
    </div>
  );
};