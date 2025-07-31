-- Corrigir agendamentos corrompidos onde end_time < start_time
-- Primeiro, vamos identificar e corrigir os agendamentos problemáticos

-- Atualizar agendamentos onde end_time é anterior ao start_time
-- Calcular o end_time correto baseado no start_time + duração do serviço
UPDATE public.appointments 
SET end_time = (
  CASE 
    WHEN s.duration_minutes IS NOT NULL THEN 
      (start_time + (s.duration_minutes || ' minutes')::interval)::time
    ELSE 
      (start_time + interval '30 minutes')::time  -- duração padrão de 30 minutos
  END
)
FROM public.services s
WHERE appointments.service_id = s.id 
  AND appointments.end_time < appointments.start_time;

-- Para agendamentos sem serviço associado, usar duração padrão
UPDATE public.appointments 
SET end_time = (start_time + interval '30 minutes')::time
WHERE end_time < start_time 
  AND service_id IS NULL;

-- Criar função para validar e corrigir horários de agendamento
CREATE OR REPLACE FUNCTION public.validate_appointment_times()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    service_duration integer := 30; -- duração padrão em minutos
BEGIN
    -- Buscar duração do serviço se fornecido
    IF NEW.service_id IS NOT NULL THEN
        SELECT duration_minutes INTO service_duration
        FROM public.services 
        WHERE id = NEW.service_id;
        
        -- Se não encontrar duração, usar padrão
        IF service_duration IS NULL THEN
            service_duration := 30;
        END IF;
    END IF;
    
    -- Se end_time não for fornecido ou for inválido, calcular automaticamente
    IF NEW.end_time IS NULL OR NEW.end_time <= NEW.start_time THEN
        NEW.end_time := (NEW.start_time + (service_duration || ' minutes')::interval)::time;
    END IF;
    
    -- Garantir que end_time seja sempre posterior ao start_time
    IF NEW.end_time <= NEW.start_time THEN
        RAISE EXCEPTION 'End time must be after start time. Start: %, End: %', NEW.start_time, NEW.end_time;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Criar trigger para validar horários antes de inserir/atualizar
DROP TRIGGER IF EXISTS validate_appointment_times_trigger ON public.appointments;
CREATE TRIGGER validate_appointment_times_trigger
    BEFORE INSERT OR UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_appointment_times();