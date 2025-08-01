import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { appointment_id } = await req.json();

    if (!appointment_id) {
      throw new Error('ID do agendamento é obrigatório');
    }

    console.log('Processando solicitação de avaliação para appointment:', appointment_id);

    // Buscar dados do agendamento
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        barbershop_id,
        client_id,
        barber_id,
        clients!inner(name, phone),
        profiles!inner(full_name),
        barbershops!inner(name, slug)
      `)
      .eq('id', appointment_id)
      .eq('status', 'completed')
      .single();

    if (appointmentError || !appointment) {
      console.error('Erro ao buscar agendamento:', appointmentError);
      throw new Error('Agendamento não encontrado ou não finalizado');
    }

    console.log('Agendamento encontrado:', appointment);

    // Buscar template de avaliação
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_templates')
      .select('content')
      .eq('barbershop_id', appointment.barbershop_id)
      .eq('name', 'avaliacao_pos_atendimento')
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Template não encontrado:', templateError);
      throw new Error('Template de avaliação não configurado');
    }

    // Gerar link de avaliação
    const reviewLink = `https://yzqwmxffjufefocgkevz.supabase.co/review/${appointment.barbershops.slug}?client=${appointment.client_id}&barber=${appointment.barber_id}&appointment=${appointment.id}`;

    // Substituir variáveis no template
    let message = template.content;
    message = message.replace('{{client_name}}', appointment.clients.name);
    message = message.replace('{{barbershop_name}}', appointment.barbershops.name);
    message = message.replace('{{barber_name}}', appointment.profiles.full_name);
    message = message.replace('{{evaluation_link}}', reviewLink);

    console.log('Mensagem preparada:', message);
    console.log('Enviando para telefone:', appointment.clients.phone);

    // Enviar mensagem via WhatsApp
    const { data: messageResult, error: messageError } = await supabase.functions.invoke(
      'send-whatsapp-message',
      {
        body: {
          barbershop_id: appointment.barbershop_id,
          phone: appointment.clients.phone,
          message: message,
          message_type: 'evaluation_request'
        }
      }
    );

    if (messageError) {
      console.error('Erro ao enviar mensagem:', messageError);
      throw messageError;
    }

    console.log('Mensagem enviada com sucesso:', messageResult);

    // Registrar log da solicitação
    await supabase
      .from('whatsapp_messages')
      .insert([{
        barbershop_id: appointment.barbershop_id,
        phone: appointment.clients.phone,
        message: message,
        direction: 'outbound',
        status: 'sent',
        message_type: 'evaluation_request',
        metadata: {
          appointment_id: appointment.id,
          client_id: appointment.client_id,
          barber_id: appointment.barber_id,
          review_link: reviewLink
        }
      }]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Solicitação de avaliação enviada com sucesso',
        review_link: reviewLink
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro na função send-review-request:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});