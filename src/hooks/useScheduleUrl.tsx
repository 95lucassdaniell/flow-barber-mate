import { useParams, useNavigate } from 'react-router-dom';
import { format, isValid, parseISO } from 'date-fns';

export const useScheduleUrl = () => {
  const { slug, date } = useParams<{ slug: string; date?: string }>();
  const navigate = useNavigate();

  // Validar e processar a data da URL
  const getValidDate = (): Date => {
    if (!date) {
      return new Date(); // Se não há data na URL, usar hoje
    }

    try {
      const parsedDate = parseISO(date);
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    } catch (error) {
      console.warn('Data inválida na URL:', date);
    }

    // Se a data é inválida, redirecionar para hoje
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');
    navigate(`/app/${slug}/agenda/${todayString}`, { replace: true });
    return today;
  };

  const selectedDate = getValidDate();

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