-- Enable RLS and create policies for the tables that were missing them
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expenses table  
CREATE POLICY "Users can view expenses from their barbershop" ON public.expenses
FOR SELECT USING (barbershop_id = public.get_user_barbershop_id());

CREATE POLICY "Users can create expenses for their barbershop" ON public.expenses
FOR INSERT WITH CHECK (barbershop_id = public.get_user_barbershop_id());

CREATE POLICY "Users can update expenses from their barbershop" ON public.expenses
FOR UPDATE USING (barbershop_id = public.get_user_barbershop_id());

CREATE POLICY "Users can delete expenses from their barbershop" ON public.expenses
FOR DELETE USING (barbershop_id = public.get_user_barbershop_id());