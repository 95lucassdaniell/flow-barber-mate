-- Create storage bucket for barbershop logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('barbershop-logos', 'barbershop-logos', true);

-- Create storage policies for barbershop logos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'barbershop-logos');

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'barbershop-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their barbershop logo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'barbershop-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their barbershop logo"
ON storage.objects FOR DELETE
USING (bucket_id = 'barbershop-logos' AND auth.role() = 'authenticated');