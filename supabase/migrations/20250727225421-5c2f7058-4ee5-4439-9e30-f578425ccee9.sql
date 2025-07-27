-- First, let's check if there's a profile for the current user
DO $$
DECLARE
    current_user_id uuid;
    profile_exists boolean;
BEGIN
    -- Get the current user ID
    SELECT auth.uid() INTO current_user_id;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = current_user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Create profile for the current user with the correct barbershop_id
        INSERT INTO public.profiles (user_id, barbershop_id, role, full_name)
        VALUES (current_user_id, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', 'admin', 'Lucas Daniel');
    ELSE
        -- Update existing profile with correct barbershop_id
        UPDATE public.profiles 
        SET barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
        WHERE user_id = current_user_id;
    END IF;
END $$;