/**
 * Utilitários para manipulação consistente de datas no fuso horário local
 * 
 * PROBLEMA IDENTIFICADO:
 * - new Date(date) interpreta strings como UTC, causando problemas de timezone
 * - Precisamos criar datas sempre no fuso horário local brasileiro
 */

import { format, startOfDay } from 'date-fns';

/**
 * Cria uma data no fuso horário local a partir de uma string YYYY-MM-DD
 * 
 * @param dateString - String no formato "YYYY-MM-DD" 
 * @returns Date object no fuso horário local
 */
export const createLocalDate = (dateString: string): Date => {
  console.log('🔧 CREATING LOCAL DATE:', { 
    input: dateString,
    inputType: typeof dateString 
  });
  
  try {
    // Parse manual para garantir fuso horário local
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // month é 0-indexado
    
    console.log('🔧 LOCAL DATE CREATED:', {
      dateString,
      year,
      month: month - 1, // 0-indexado
      day,
      resultISO: localDate.toISOString(),
      resultLocal: localDate.toLocaleDateString('pt-BR'),
      resultTime: localDate.toLocaleTimeString('pt-BR'),
      getTime: localDate.getTime()
    });
    
    return startOfDay(localDate);
  } catch (error) {
    console.error('❌ Error creating local date:', { dateString, error });
    return startOfDay(new Date());
  }
};

/**
 * Compara se duas datas representam o mesmo dia (ignora horário)
 */
export const isSameLocalDay = (date1: Date, date2: Date): boolean => {
  const day1 = startOfDay(date1);
  const day2 = startOfDay(date2);
  return day1.getTime() === day2.getTime();
};

/**
 * Formata uma data para string YYYY-MM-DD garantindo fuso local
 */
export const formatLocalDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Cria uma data a partir de uma string de data e horário
 * Usado para comparações de agendamentos
 */
export const createLocalDateTime = (dateString: string, timeString: string): Date => {
  const baseDate = createLocalDate(dateString);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const dateTime = new Date(baseDate);
  dateTime.setHours(hours, minutes, 0, 0);
  
  return dateTime;
};