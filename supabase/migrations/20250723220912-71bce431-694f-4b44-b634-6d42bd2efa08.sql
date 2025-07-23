-- Add super_admin role to the existing role enum
ALTER TYPE public.user_role ADD VALUE 'super_admin';

-- Add status and plan fields to barbershops table
ALTER TABLE public.barbershops 
ADD COLUMN status text NOT NULL DEFAULT 'active',
ADD COLUMN plan text NOT NULL DEFAULT 'basic',
ADD COLUMN created_by uuid REFERENCES auth.users(id),
ADD COLUMN monthly_revenue numeric DEFAULT 0,
ADD COLUMN total_appointments integer DEFAULT 0,
ADD COLUMN total_users integer DEFAULT 0;

-- Create super_admins table
CREATE TABLE public.super_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on super_admins
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table for tracking super admin actions
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  super_admin_id uuid REFERENCES public.super_admins(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins 
    WHERE user_id = auth.uid()
  );
$$;

-- Function to get super admin info
CREATE OR REPLACE FUNCTION public.get_super_admin_info()
RETURNS TABLE(id uuid, full_name text, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT sa.id, sa.full_name, sa.email 
  FROM public.super_admins sa
  WHERE sa.user_id = auth.uid()
  LIMIT 1;
$$;

-- RLS Policies for super_admins table
CREATE POLICY "Super admins can view their own record"
ON public.super_admins
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admins can update their own record"
ON public.super_admins
FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for barbershops (super admin access)
CREATE POLICY "Super admins can view all barbershops"
ON public.barbershops
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can manage all barbershops"
ON public.barbershops
FOR ALL
USING (is_super_admin());

-- RLS Policies for profiles (super admin access)
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_super_admin());

-- RLS Policies for audit_logs
CREATE POLICY "Super admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (is_super_admin());

-- Add trigger for updated_at on super_admins
CREATE TRIGGER update_super_admins_updated_at
BEFORE UPDATE ON public.super_admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update barbershops table to track statistics
CREATE OR REPLACE FUNCTION public.update_barbershop_stats()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.barbershops 
  SET 
    total_users = (
      SELECT COUNT(*) 
      FROM public.profiles 
      WHERE barbershop_id = barbershops.id
    ),
    total_appointments = (
      SELECT COUNT(*) 
      FROM public.appointments 
      WHERE barbershop_id = barbershops.id
    );
$$;