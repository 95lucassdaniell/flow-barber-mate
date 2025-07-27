-- Add missing foreign keys to commands table
ALTER TABLE public.commands 
ADD CONSTRAINT commands_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id);

ALTER TABLE public.commands 
ADD CONSTRAINT commands_barber_id_fkey 
FOREIGN KEY (barber_id) REFERENCES public.profiles(id);

ALTER TABLE public.commands 
ADD CONSTRAINT commands_barbershop_id_fkey 
FOREIGN KEY (barbershop_id) REFERENCES public.barbershops(id);

ALTER TABLE public.commands 
ADD CONSTRAINT commands_appointment_id_fkey 
FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);

-- Add missing foreign keys to command_items table
ALTER TABLE public.command_items 
ADD CONSTRAINT command_items_command_id_fkey 
FOREIGN KEY (command_id) REFERENCES public.commands(id) ON DELETE CASCADE;

ALTER TABLE public.command_items 
ADD CONSTRAINT command_items_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES public.services(id);

ALTER TABLE public.command_items 
ADD CONSTRAINT command_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id);