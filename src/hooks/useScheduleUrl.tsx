import { useParams, useNavigate } from 'react-router-dom';
import { format, isValid, parseISO, startOfDay } from 'date-fns';
import { useMemo } from 'react';

export const useScheduleUrl = () => {
  const { slug, date } = useParams<{ slug: string; date?: string }>();
  const navigate = useNavigate();

  // Memoizar a data validada para evitar re-renders desnecessários
  const selectedDate = useMemo(() => {
    if (!date) {
      return startOfDay(new Date()); // Se não há data na URL, usar hoje
    }

    try {
      const parsedDate = parseISO(date);
      if (isValid(parsedDate)) {
        return startOfDay(parsedDate);
      }
    } catch (error) {
      console.warn('Data inválida na URL:', date);
    }

    // Se a data é inválida, redirecionar para hoje (sem replace para evitar loops)
    const today = startOfDay(new Date());
    const todayString = format(today, 'yyyy-MM-dd');
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