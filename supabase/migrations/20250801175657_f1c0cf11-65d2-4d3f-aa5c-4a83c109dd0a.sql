-- Create RLS policies for public_client_reviews table
-- Enable RLS
ALTER TABLE public.public_client_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view reviews from their barbershop
CREATE POLICY "Users can view reviews from their barbershop" 
ON public.public_client_reviews 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

-- Admins can manage reviews in their barbershop
CREATE POLICY "Admins can manage reviews in their barbershop" 
ON public.public_client_reviews 
FOR ALL 
USING (
  barbershop_id = get_user_barbershop_id() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'receptionist')
    AND barbershop_id = get_user_barbershop_id()
  )
);