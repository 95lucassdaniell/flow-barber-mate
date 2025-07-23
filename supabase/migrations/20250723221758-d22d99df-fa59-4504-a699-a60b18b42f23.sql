-- Create super admin user
-- First, we need to create the user in auth.users, then reference it in super_admins

-- Insert super admin record (the user_id will need to be updated after the user is created via signup)
-- This is a placeholder - the actual user needs to be created via the signup process first

-- Create a function to add super admin after user signup
CREATE OR REPLACE FUNCTION public.create_super_admin(
  user_email text,
  user_full_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record record;
  super_admin_id uuid;
BEGIN
  -- Find the user by email
  SELECT id INTO user_record FROM auth.users WHERE email = user_email;
  
  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert into super_admins table
  INSERT INTO public.super_admins (user_id, full_name, email)
  VALUES (user_record.id, user_full_name, user_email)
  RETURNING id INTO super_admin_id;
  
  RETURN super_admin_id;
END;
$$;