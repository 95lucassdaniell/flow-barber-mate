-- Create session_tokens table for automatic authentication via URL
CREATE TABLE public.session_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  barbershop_slug TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_tokens ENABLE ROW LEVEL SECURITY;

-- Policy to allow creation of session tokens
CREATE POLICY "Anyone can create session tokens" 
ON public.session_tokens 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow reading of session tokens for validation
CREATE POLICY "Anyone can read session tokens for validation" 
ON public.session_tokens 
FOR SELECT 
USING (true);

-- Policy to allow updating session tokens when used
CREATE POLICY "Anyone can update session tokens" 
ON public.session_tokens 
FOR UPDATE 
USING (true);

-- Index for faster lookups
CREATE INDEX idx_session_tokens_session_id ON public.session_tokens(session_id);
CREATE INDEX idx_session_tokens_expires_at ON public.session_tokens(expires_at);

-- Function to cleanup expired session tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_session_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  deleted_count integer := 0;
BEGIN
  DELETE FROM public.session_tokens 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;