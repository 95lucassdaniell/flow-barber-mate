-- Enable RLS on financial tables
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sales table
CREATE POLICY "Users can view sales from their barbershop" ON public.sales
FOR SELECT USING (barbershop_id = public.get_user_barbershop_id());

CREATE POLICY "Users can create sales for their barbershop" ON public.sales
FOR INSERT WITH CHECK (barbershop_id = public.get_user_barbershop_id());

CREATE POLICY "Users can update sales from their barbershop" ON public.sales
FOR UPDATE USING (barbershop_id = public.get_user_barbershop_id());

-- Create RLS policies for commissions table
CREATE POLICY "Users can view commissions from their barbershop" ON public.commissions
FOR SELECT USING (barbershop_id = public.get_user_barbershop_id());

CREATE POLICY "Users can create commissions for their barbershop" ON public.commissions
FOR INSERT WITH CHECK (barbershop_id = public.get_user_barbershop_id());

CREATE POLICY "Users can update commissions from their barbershop" ON public.commissions
FOR UPDATE USING (barbershop_id = public.get_user_barbershop_id());

-- Create RLS policies for sale_items table
CREATE POLICY "Users can view sale items from their barbershop sales" ON public.sale_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_items.sale_id 
    AND sales.barbershop_id = public.get_user_barbershop_id()
  )
);

CREATE POLICY "Users can create sale items for their barbershop sales" ON public.sale_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_items.sale_id 
    AND sales.barbershop_id = public.get_user_barbershop_id()
  )
);

CREATE POLICY "Users can update sale items from their barbershop sales" ON public.sale_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_items.sale_id 
    AND sales.barbershop_id = public.get_user_barbershop_id()
  )
);