import { useParams, useNavigate } from 'react-router-dom';
import { format, isValid, parseISO, startOfDay } from 'date-fns';
import { useMemo } from 'react';

export const useScheduleUrl = () => {
  const { slug, date } = useParams<{ slug: string; date?: string }>();
  const navigate = useNavigate();

  // Memoizar a data validada para evitar re-renders desnecessários
  const selectedDate = useMemo(() => {
    if (!date) {
      const today = startOfDay(new Date());
      console.log('🗓️ No date in URL, using today:', { 
        today: today.toISOString(), 
        localString: today.toLocaleDateString('pt-BR')
      });
      return today;
    }

    try {
      // Criar data no fuso horário local em vez de UTC para evitar problemas de timezone
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day); // month é 0-indexado
      
      console.log('🗓️ Parsing date from URL:', { 
        dateString: date, 
        parsedUTC: parseISO(date).toISOString(),
        parsedLocal: localDate.toISOString(),
        localString: localDate.toLocaleDateString('pt-BR'),
        isValid: isValid(localDate)
      });
      
      if (isValid(localDate)) {
        return startOfDay(localDate);
      }
    } catch (error) {
      console.warn('Data inválida na URL:', date, error);
    }

    // Se a data é inválida, redirecionar para hoje (sem replace para evitar loops)
    const today = startOfDay(new Date());
    const todayString = format(today, 'yyyy-MM-dd');
    console.log('🗓️ Invalid date, redirecting to today:', { todayString });
    navigate(`/app/${slug}/agenda/${todayString}`);
    return today;
  }, [date, slug, navigate]);

  // Função para navegar para uma data específica
  const navigateToDate = (newDate: Date) => {
    const dateString = format(newDate, 'yyyy-MM-dd');
    navigate(`/app/${slug}/agenda/${dateString}`);
  };

  // Função para navegar para hoje (sem data na URL)
  const navigateToToday = () => {
    navigate(`/app/${slug}/agenda`);
  };

  return {
    selectedDate,
    navigateToDate,
    navigateToToday,
    slug,
    hasDateInUrl: !!date
  };
};