-- Remove price column from services table
ALTER TABLE public.services DROP COLUMN IF EXISTS price;

-- Create provider_services table to link providers with services and their specific prices
CREATE TABLE public.provider_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, service_id)
);

-- Enable RLS on provider_services
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

-- Create policies for provider_services
CREATE POLICY "Users can view provider services from their barbershop" 
ON public.provider_services 
FOR SELECT 
USING (
  provider_id IN (
    SELECT id FROM public.profiles 
    WHERE barbershop_id = get_user_barbershop_id()
  )
);

CREATE POLICY "Admins can manage provider services in their barbershop" 
ON public.provider_services 
FOR ALL 
USING (
  provider_id IN (
    SELECT id FROM public.profiles 
    WHERE barbershop_id = get_user_barbershop_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'receptionist')
      AND barbershop_id = get_user_barbershop_id()
    )
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_provider_services_updated_at
BEFORE UPDATE ON public.provider_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_provider_services_provider_id ON public.provider_services(provider_id);
CREATE INDEX idx_provider_services_service_id ON public.provider_services(service_id);