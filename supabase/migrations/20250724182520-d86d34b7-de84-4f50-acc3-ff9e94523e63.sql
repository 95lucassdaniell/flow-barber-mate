-- Create automation rules table
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'follow_up', 'churn_alert', 'promotion')),
  name TEXT NOT NULL,
  description TEXT,
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  message_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation executions table
CREATE TABLE public.automation_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  execution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  message_content TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

-- Create policies for automation_rules
CREATE POLICY "Users can view automation rules from their barbershop"
ON public.automation_rules
FOR SELECT
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can create automation rules"
ON public.automation_rules
FOR INSERT
WITH CHECK (barbershop_id = get_user_barbershop_id() AND is_user_admin());

CREATE POLICY "Admins can update automation rules"
ON public.automation_rules
FOR UPDATE
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

CREATE POLICY "Admins can delete automation rules"
ON public.automation_rules
FOR DELETE
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- Create policies for automation_executions
CREATE POLICY "Users can view automation executions from their barbershop"
ON public.automation_executions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.automation_rules ar 
  WHERE ar.id = automation_executions.rule_id 
  AND ar.barbershop_id = get_user_barbershop_id()
));

CREATE POLICY "System can insert automation executions"
ON public.automation_executions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.automation_rules ar 
  WHERE ar.id = automation_executions.rule_id 
  AND ar.barbershop_id = get_user_barbershop_id()
));

-- Create triggers for updated_at
CREATE TRIGGER update_automation_rules_updated_at
BEFORE UPDATE ON public.automation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_automation_rules_barbershop_id ON public.automation_rules(barbershop_id);
CREATE INDEX idx_automation_rules_type ON public.automation_rules(type);
CREATE INDEX idx_automation_rules_is_active ON public.automation_rules(is_active);
CREATE INDEX idx_automation_executions_rule_id ON public.automation_executions(rule_id);
CREATE INDEX idx_automation_executions_client_id ON public.automation_executions(client_id);
CREATE INDEX idx_automation_executions_status ON public.automation_executions(status);
CREATE INDEX idx_automation_executions_execution_date ON public.automation_executions(execution_date);