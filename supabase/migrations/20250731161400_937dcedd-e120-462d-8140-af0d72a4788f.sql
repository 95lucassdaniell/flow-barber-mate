-- Fix inconsistent appointment data where status is 'completed' for future dates
-- This happens when appointments are marked as completed but the date is in the future

-- First, update appointments marked as 'completed' that are for future dates to 'scheduled'
UPDATE public.appointments 
SET 
  status = 'scheduled',
  updated_at = now()
WHERE 
  status = 'completed' 
  AND appointment_date >= CURRENT_DATE;

-- Add a check to prevent this issue in the future by creating a validation trigger
CREATE OR REPLACE FUNCTION public.validate_appointment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent marking future appointments as completed
  IF NEW.status = 'completed' AND NEW.appointment_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot mark future appointments as completed. Date: %, Current Date: %', NEW.appointment_date, CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the validation
DROP TRIGGER IF EXISTS check_appointment_status ON public.appointments;
CREATE TRIGGER check_appointment_status
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_appointment_status();