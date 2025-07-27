-- Get current user info from auth and create/update profile
DO $$
DECLARE
    current_user_id uuid;
    user_email text;
    profile_exists boolean;
BEGIN
    -- Get the current user ID
    SELECT auth.uid() INTO current_user_id;
    
    -- Get user email from auth.users (requires service role)
    -- Since we can't access auth.users directly, we'll use a default email
    user_email := 'lucasdanielmarques@gmail.com';
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = current_user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Create profile for the current user with the correct barbershop_id
        INSERT INTO public.profiles (user_id, barbershop_id, role, full_name, email)
        VALUES (current_user_id, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', 'admin', 'Lucas Daniel', user_email);
    ELSE
        -- Update existing profile with correct barbershop_id
        UPDATE public.profiles 
        SET barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a',
            email = COALESCE(email, user_email)
        WHERE user_id = current_user_id;
    END IF;
END $$;