-- Add new columns to whatsapp_automations table for event-based triggers and timing
ALTER TABLE public.whatsapp_automations 
ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN ('scheduled', 'cancelled', 'completed', 'no_show')),
ADD COLUMN IF NOT EXISTS timing_type TEXT CHECK (timing_type IN ('immediate', 'before', 'after')),
ADD COLUMN IF NOT EXISTS timing_value INTEGER,
ADD COLUMN IF NOT EXISTS timing_unit TEXT CHECK (timing_unit IN ('minutes', 'hours', 'days')),
ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}'::jsonb;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_automations_event_timing 
ON public.whatsapp_automations(barbershop_id, is_active, event_type);

-- Create whatsapp_scheduled_jobs table for managing delayed message sending
CREATE TABLE IF NOT EXISTS public.whatsapp_scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL,
  automation_id UUID NOT NULL REFERENCES public.whatsapp_automations(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'canceled')),
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Create indexes for whatsapp_scheduled_jobs
CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_jobs_status_time 
ON public.whatsapp_scheduled_jobs(status, scheduled_for) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_jobs_appointment 
ON public.whatsapp_scheduled_jobs(appointment_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_jobs_automation 
ON public.whatsapp_scheduled_jobs(automation_id);

-- Unique constraint to prevent duplicate jobs
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_scheduled_jobs_unique 
ON public.whatsapp_scheduled_jobs(appointment_id, automation_id, scheduled_for);

-- Function to schedule WhatsApp automations for an event
CREATE OR REPLACE FUNCTION public.schedule_whatsapp_automations_for_event(
  p_appointment_id UUID,
  p_event_type TEXT,
  p_event_time TIMESTAMPTZ
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  automation_record RECORD;
  scheduled_time TIMESTAMPTZ;
  appointment_record RECORD;
  scheduled_count INTEGER := 0;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record
  FROM public.appointments
  WHERE id = p_appointment_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Find active automations for this event type and barbershop
  FOR automation_record IN
    SELECT * FROM public.whatsapp_automations
    WHERE barbershop_id = appointment_record.barbershop_id
    AND is_active = true
    AND event_type = p_event_type
    AND timing_type != 'immediate'
  LOOP
    -- Calculate scheduled time
    IF automation_record.event_type = 'scheduled' AND automation_record.timing_type = 'before' THEN
      -- For "before" appointments, use appointment start time
      scheduled_time := (appointment_record.appointment_date + appointment_record.start_time::time)::timestamptz;
      
      -- Subtract the timing value
      CASE automation_record.timing_unit
        WHEN 'minutes' THEN scheduled_time := scheduled_time - (automation_record.timing_value || ' minutes')::interval;
        WHEN 'hours' THEN scheduled_time := scheduled_time - (automation_record.timing_value || ' hours')::interval;
        WHEN 'days' THEN scheduled_time := scheduled_time - (automation_record.timing_value || ' days')::interval;
      END CASE;
      
    ELSIF automation_record.timing_type = 'after' THEN
      -- For "after" events, use the event time
      scheduled_time := p_event_time;
      
      -- Add the timing value
      CASE automation_record.timing_unit
        WHEN 'minutes' THEN scheduled_time := scheduled_time + (automation_record.timing_value || ' minutes')::interval;
        WHEN 'hours' THEN scheduled_time := scheduled_time + (automation_record.timing_value || ' hours')::interval;
        WHEN 'days' THEN scheduled_time := scheduled_time + (automation_record.timing_value || ' days')::interval;
      END CASE;
    END IF;
    
    -- Only schedule if time is in the future
    IF scheduled_time > NOW() THEN
      INSERT INTO public.whatsapp_scheduled_jobs (
        barbershop_id,
        appointment_id,
        automation_id,
        scheduled_for
      ) VALUES (
        appointment_record.barbershop_id,
        p_appointment_id,
        automation_record.id,
        scheduled_time
      ) ON CONFLICT (appointment_id, automation_id, scheduled_for) DO NOTHING;
      
      scheduled_count := scheduled_count + 1;
    END IF;
  END LOOP;
  
  RETURN scheduled_count;
END;
$$;

-- Function to trigger immediate WhatsApp automations
CREATE OR REPLACE FUNCTION public.trigger_immediate_whatsapp_automations(
  p_appointment_id UUID,
  p_event_type TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  automation_record RECORD;
  appointment_record RECORD;
  triggered_count INTEGER := 0;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record
  FROM public.appointments
  WHERE id = p_appointment_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Find active immediate automations for this event type and barbershop
  FOR automation_record IN
    SELECT * FROM public.whatsapp_automations
    WHERE barbershop_id = appointment_record.barbershop_id
    AND is_active = true
    AND event_type = p_event_type
    AND timing_type = 'immediate'
  LOOP
    -- Call the whatsapp-automations edge function
    PERFORM net.http_post(
      url := 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/whatsapp-automations',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cXdteGZmanVmZWZvY2drZXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI5OTk3NSwiZXhwIjoyMDY4ODc1OTc1fQ.LW4rbr_-A7FTzMJcZGP7LJt1kNIiZNuOJKX2qnKXDhY"}'::jsonb,
      body := jsonb_build_object(
        'appointment_id', p_appointment_id,
        'automation_id', automation_record.id
      )
    );
    
    triggered_count := triggered_count + 1;
  END LOOP;
  
  RETURN triggered_count;
END;
$$;

-- Function to cancel pending jobs for an appointment
CREATE OR REPLACE FUNCTION public.cancel_whatsapp_jobs_for_appointment(
  p_appointment_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  UPDATE public.whatsapp_scheduled_jobs 
  SET status = 'canceled', processed_at = NOW()
  WHERE appointment_id = p_appointment_id 
  AND status = 'pending';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Migrate existing delay_minutes data to new structure
UPDATE public.whatsapp_automations 
SET 
  event_type = 'scheduled',
  timing_type = CASE 
    WHEN COALESCE(delay_minutes, 0) = 0 THEN 'immediate'
    WHEN delay_minutes > 0 THEN 'after'
    ELSE 'before'
  END,
  timing_value = CASE 
    WHEN COALESCE(delay_minutes, 0) = 0 THEN NULL
    ELSE ABS(delay_minutes)
  END,
  timing_unit = CASE 
    WHEN COALESCE(delay_minutes, 0) = 0 THEN NULL
    ELSE 'minutes'
  END
WHERE event_type IS NULL;

-- Enable RLS on whatsapp_scheduled_jobs (service role only)
ALTER TABLE public.whatsapp_scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policy for whatsapp_scheduled_jobs (service role only for security)
CREATE POLICY "Service role can manage scheduled jobs" ON public.whatsapp_scheduled_jobs
  USING (auth.role() = 'service_role');

-- Update RLS for whatsapp_automations to support new features
DROP POLICY IF EXISTS "Admins can create automation rules" ON public.whatsapp_automations;
DROP POLICY IF EXISTS "Admins can delete automation rules" ON public.whatsapp_automations;
DROP POLICY IF EXISTS "Admins can update automation rules" ON public.whatsapp_automations;
DROP POLICY IF EXISTS "Users can view automation rules from their barbershop" ON public.whatsapp_automations;

CREATE POLICY "Users can manage automations in their barbershop" ON public.whatsapp_automations
  FOR ALL USING (barbershop_id = get_user_barbershop_id())
  WITH CHECK (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can view automations from their barbershop" ON public.whatsapp_automations
  FOR SELECT USING (barbershop_id = get_user_barbershop_id());