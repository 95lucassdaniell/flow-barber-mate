-- Update RLS policies for provider_subscription_plans to give admins full control

-- Drop existing policies
DROP POLICY IF EXISTS "Providers can manage their own subscription plans" ON public.provider_subscription_plans;
DROP POLICY IF EXISTS "Providers can view their own subscription plans" ON public.provider_subscription_plans;

-- Create new policies for admin control
CREATE POLICY "Admins can manage all subscription plans in their barbershop" 
ON public.provider_subscription_plans 
FOR ALL 
USING (
  barbershop_id = get_user_barbershop_id() AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND barbershop_id = get_user_barbershop_id()
  )
);

-- Allow providers to view their own plans (read-only)
CREATE POLICY "Providers can view their own subscription plans" 
ON public.provider_subscription_plans 
FOR SELECT 
USING (
  provider_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Allow users to view plans from their barbershop for subscription creation
CREATE POLICY "Users can view subscription plans from their barbershop" 
ON public.provider_subscription_plans 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());