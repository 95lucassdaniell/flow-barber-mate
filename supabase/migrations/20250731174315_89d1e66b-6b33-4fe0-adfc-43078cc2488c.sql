-- Enable real-time on appointments table
ALTER TABLE public.appointments REPLICA IDENTITY FULL;

-- Add table to realtime publication if not already added
BEGIN;
  -- Check if appointments is already in the publication
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'appointments'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
  END $$;
COMMIT;