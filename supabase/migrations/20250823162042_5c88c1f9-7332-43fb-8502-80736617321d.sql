-- Add trigger for automatic coupon usage increment
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment usage count when a coupon redemption is recorded
  UPDATE public.coupons 
  SET usage_count = usage_count + 1
  WHERE id = NEW.coupon_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger on coupon_redemptions table
CREATE TRIGGER increment_coupon_usage_trigger
  AFTER INSERT ON public.coupon_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_coupon_usage();