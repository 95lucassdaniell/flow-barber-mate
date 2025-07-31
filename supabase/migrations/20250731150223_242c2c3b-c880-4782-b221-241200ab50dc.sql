-- Enable RLS on sales_partitioned main table and all partitions
ALTER TABLE public.sales_partitioned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_partitioned_2025_01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_partitioned_2025_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_partitioned_2025_03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_partitioned_2025_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_partitioned_2025_05 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_partitioned_2025_06 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_partitioned_2025_07 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_partitioned_2025_08 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_partitioned_2025_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_partitioned_2025_10 ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES FOR MAIN TABLE sales_partitioned
CREATE POLICY "Users can view sales from their barbershop" 
ON public.sales_partitioned 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop" 
ON public.sales_partitioned 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- CREATE RLS POLICIES FOR PARTITION 2025_01
CREATE POLICY "Users can view sales from their barbershop partition" 
ON public.sales_partitioned_2025_01 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop partition" 
ON public.sales_partitioned_2025_01 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- CREATE RLS POLICIES FOR PARTITION 2025_02
CREATE POLICY "Users can view sales from their barbershop partition" 
ON public.sales_partitioned_2025_02 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop partition" 
ON public.sales_partitioned_2025_02 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- CREATE RLS POLICIES FOR PARTITION 2025_03
CREATE POLICY "Users can view sales from their barbershop partition" 
ON public.sales_partitioned_2025_03 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop partition" 
ON public.sales_partitioned_2025_03 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- CREATE RLS POLICIES FOR PARTITION 2025_04
CREATE POLICY "Users can view sales from their barbershop partition" 
ON public.sales_partitioned_2025_04 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop partition" 
ON public.sales_partitioned_2025_04 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- CREATE RLS POLICIES FOR PARTITION 2025_05
CREATE POLICY "Users can view sales from their barbershop partition" 
ON public.sales_partitioned_2025_05 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop partition" 
ON public.sales_partitioned_2025_05 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- CREATE RLS POLICIES FOR PARTITION 2025_06
CREATE POLICY "Users can view sales from their barbershop partition" 
ON public.sales_partitioned_2025_06 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop partition" 
ON public.sales_partitioned_2025_06 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- CREATE RLS POLICIES FOR PARTITION 2025_07
CREATE POLICY "Users can view sales from their barbershop partition" 
ON public.sales_partitioned_2025_07 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop partition" 
ON public.sales_partitioned_2025_07 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- CREATE RLS POLICIES FOR PARTITION 2025_08
CREATE POLICY "Users can view sales from their barbershop partition" 
ON public.sales_partitioned_2025_08 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop partition" 
ON public.sales_partitioned_2025_08 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- CREATE RLS POLICIES FOR PARTITION 2025_09
CREATE POLICY "Users can view sales from their barbershop partition" 
ON public.sales_partitioned_2025_09 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop partition" 
ON public.sales_partitioned_2025_09 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- CREATE RLS POLICIES FOR PARTITION 2025_10
CREATE POLICY "Users can view sales from their barbershop partition" 
ON public.sales_partitioned_2025_10 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop partition" 
ON public.sales_partitioned_2025_10 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());