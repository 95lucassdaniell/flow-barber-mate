-- Create table for public client reviews
CREATE TABLE public.public_client_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL,
  barber_id UUID NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  nps_score INTEGER NOT NULL CHECK (nps_score >= 0 AND nps_score <= 10),
  star_rating INTEGER NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  review_text TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.public_client_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for public reviews
-- Anyone can insert reviews (public access)
CREATE POLICY "Anyone can create public reviews" 
ON public.public_client_reviews 
FOR INSERT 
WITH CHECK (true);

-- Only barbershop users can view their reviews
CREATE POLICY "Barbershop users can view their reviews" 
ON public.public_client_reviews 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

-- Only barbershop admins can update/delete reviews
CREATE POLICY "Barbershop admins can manage their reviews" 
ON public.public_client_reviews 
FOR UPDATE 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

CREATE POLICY "Barbershop admins can delete their reviews" 
ON public.public_client_reviews 
FOR DELETE 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_public_client_reviews_updated_at
BEFORE UPDATE ON public.public_client_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_public_client_reviews_barbershop_id ON public.public_client_reviews(barbershop_id);
CREATE INDEX idx_public_client_reviews_created_at ON public.public_client_reviews(created_at DESC);