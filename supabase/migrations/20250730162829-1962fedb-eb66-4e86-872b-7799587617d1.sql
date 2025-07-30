-- Verificar o trigger atual e modificar para configurar automaticamente a instância na Evolution API
-- Primeiro, vamos melhorar o trigger existente para incluir logs e chamar a configuração automática

-- Atualizar a função do trigger para incluir configuração automática
CREATE OR REPLACE FUNCTION public.create_whatsapp_instance_for_barbershop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  instance_name text;
  webhook_url text;
BEGIN
  -- Generate instance name based on barbershop slug
  instance_name := LOWER(REGEXP_REPLACE(NEW.slug, '[^a-zA-Z0-9]', '', 'g'));
  webhook_url := 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/evolution-webhook';
  
  -- Insert WhatsApp instance for the new barbershop with more complete data
  INSERT INTO public.whatsapp_instances (
    barbershop_id,
    api_type,
    evolution_instance_name,
    webhook_url,
    auto_created,
    status,
    business_name,
    auto_reply,
    auto_reply_message,
    notification_settings
  ) VALUES (
    NEW.id,
    'evolution',
    instance_name,
    webhook_url,
    true,
    'disconnected',
    NEW.name, -- Use barbershop name as business name
    false,
    'Olá! Obrigado por entrar em contato. Em breve responderemos sua mensagem.',
    '{
      "appointment_confirmation": true,
      "appointment_reminder": true,
      "appointment_cancellation": true
    }'::jsonb
  );
  
  -- Log the creation for debugging
  RAISE NOTICE 'WhatsApp instance created for barbershop: % with name: %', NEW.name, instance_name;
  
  RETURN NEW;
END;
$function$;

-- Criar uma função auxiliar para configurar automaticamente instâncias criadas
CREATE OR REPLACE FUNCTION public.configure_auto_created_whatsapp_instance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  barbershop_record record;
BEGIN
  -- Só processar se for uma instância auto-criada e ainda não configurada
  IF NEW.auto_created = true AND NEW.instance_id IS NULL AND NEW.instance_token IS NULL THEN
    -- Buscar dados da barbearia
    SELECT * INTO barbershop_record 
    FROM public.barbershops 
    WHERE id = NEW.barbershop_id;
    
    IF FOUND THEN
      -- Log para debugging
      RAISE NOTICE 'Auto-configuring WhatsApp instance for barbershop: %', barbershop_record.name;
      
      -- Aqui tentaremos chamar a função evolution-instance-manager via HTTP
      -- Como não podemos fazer chamadas HTTP diretas no trigger, vamos usar uma abordagem diferente
      -- Vamos atualizar o status para indicar que precisa ser configurado
      UPDATE public.whatsapp_instances 
      SET 
        status = 'pending_configuration',
        updated_at = now()
      WHERE id = NEW.id;
      
      RAISE NOTICE 'WhatsApp instance marked for configuration: %', NEW.evolution_instance_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para configuração automática após inserção
DROP TRIGGER IF EXISTS auto_configure_whatsapp_instance ON public.whatsapp_instances;
CREATE TRIGGER auto_configure_whatsapp_instance
  AFTER INSERT ON public.whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.configure_auto_created_whatsapp_instance();

-- Criar uma função que pode ser chamada manualmente ou via scheduled job para configurar instâncias pendentes
CREATE OR REPLACE FUNCTION public.process_pending_whatsapp_configurations()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  pending_instance record;
  configured_count int := 0;
BEGIN
  -- Buscar instâncias que precisam ser configuradas
  FOR pending_instance IN 
    SELECT wi.*, b.name as barbershop_name, b.slug as barbershop_slug
    FROM public.whatsapp_instances wi
    JOIN public.barbershops b ON wi.barbershop_id = b.id
    WHERE wi.status = 'pending_configuration' 
    AND wi.auto_created = true
  LOOP
    -- Log para debugging
    RAISE NOTICE 'Processing pending configuration for: %', pending_instance.evolution_instance_name;
    
    -- Aqui você pode adicionar lógica adicional se necessário
    -- Por enquanto, vamos apenas marcar como pronto para configuração manual
    UPDATE public.whatsapp_instances 
    SET 
      status = 'disconnected',
      updated_at = now()
    WHERE id = pending_instance.id;
    
    configured_count := configured_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Processed % pending WhatsApp configurations', configured_count;
  RETURN configured_count;
END;
$function$;