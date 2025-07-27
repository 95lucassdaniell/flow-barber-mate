-- Add status column to profiles table to track provider status
ALTER TABLE public.profiles 
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'pending'));

-- Allow user_id to be nullable for pending providers
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;