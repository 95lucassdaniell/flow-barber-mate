import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barbershopId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('Processing automations for barbershop:', barbershopId);

    // Buscar regras ativas
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true);

    if (rulesError) {
      console.error('Error fetching rules:', rulesError);
      throw rulesError;
    }

    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ executed: 0, message: 'No active rules found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar dados necessários para as automações
    const [clientsResult, appointmentsResult, whatsappInstanceResult] = await Promise.all([
      supabase.from('clients').select('*').eq('barbershop_id', barbershopId),
      supabase.from('appointments').select('*').eq('barbershop_id', barbershopId).gte('appointment_date', new Date().toISOString().split('T')[0]),
      supabase.from('whatsapp_instances').select('*').eq('barbershop_id', barbershopId).eq('status', 'connected').single()
    ]);

    const clients = clientsResult.data || [];
    const appointments = appointmentsResult.data || [];
    const whatsappInstance = whatsappInstanceResult.data;

    let executedCount = 0;

    for (const rule of rules) {
      console.log('Processing rule:', rule.name);

      const candidates = await findAutomationCandidates(rule, clients, appointments, supabase);
      
      for (const candidate of candidates) {
        try {
          const messageContent = processMessageTemplate(rule.message_template, candidate, barbershopId);
          
          // Criar execução
          const { data: execution, error: executionError } = await supabase
            .from('automation_executions')
            .insert({
              rule_id: rule.id,
              client_id: candidate.client_id,
              message_content: messageContent,
              status: 'pending'
            })
            .select()
            .single();

          if (executionError) {
            console.error('Error creating execution:', executionError);
            continue;
          }

          // Executar ações da regra
          if (rule.actions?.send_whatsapp && whatsappInstance) {
            await sendWhatsAppMessage(candidate.phone, messageContent, whatsappInstance, supabase);
            
            // Atualizar status da execução
            await supabase
              .from('automation_executions')
              .update({ status: 'sent' })
              .eq('id', execution.id);
          }

          if (rule.actions?.notify_staff) {
            await notifyStaff(rule, candidate, barbershopId, supabase);
          }

          executedCount++;
          
        } catch (error) {
          console.error('Error executing automation for candidate:', error);
          
          // Atualizar status como falhou
          await supabase
            .from('automation_executions')
            .update({ 
              status: 'failed',
              error_message: error.message 
            })
            .eq('rule_id', rule.id)
            .eq('client_id', candidate.client_id);
        }
      }
    }

    console.log('Completed automation processing. Executed:', executedCount);

    return new Response(JSON.stringify({ executed: executedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-automations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function findAutomationCandidates(rule: any, clients: any[], appointments: any[], supabase: any) {
  const candidates = [];
  const now = new Date();

  switch (rule.type) {
    case 'reminder':
      // Lembretes de agendamento (24h antes)
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.toDateString() === tomorrow.toDateString();
      });

      for (const apt of upcomingAppointments) {
        const client = clients.find(c => c.id === apt.client_id);
        if (client) {
          candidates.push({
            client_id: client.id,
            client_name: client.name,
            phone: client.phone,
            appointment_date: apt.appointment_date,
            appointment_time: apt.start_time,
            appointment_id: apt.id
          });
        }
      }
      break;

    case 'follow_up':
      // Follow-up pós-atendimento (3 dias após)
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const recentAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.toDateString() === threeDaysAgo.toDateString() && apt.status === 'completed';
      });

      for (const apt of recentAppointments) {
        const client = clients.find(c => c.id === apt.client_id);
        if (client) {
          candidates.push({
            client_id: client.id,
            client_name: client.name,
            phone: client.phone,
            last_visit: apt.appointment_date
          });
        }
      }
      break;

    case 'churn_alert':
      // Clientes que não retornam há mais de 30 dias
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const client of clients) {
        const lastAppointment = appointments
          .filter(apt => apt.client_id === client.id && apt.status === 'completed')
          .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0];

        if (lastAppointment && new Date(lastAppointment.appointment_date) < thirtyDaysAgo) {
          candidates.push({
            client_id: client.id,
            client_name: client.name,
            phone: client.phone,
            last_visit: lastAppointment.appointment_date,
            days_since_visit: Math.floor((now.getTime() - new Date(lastAppointment.appointment_date).getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      }
      break;

    case 'promotion':
      // Promoções baseadas em horários ociosos
      const lowOccupancyClients = clients.filter(client => {
        const clientAppointments = appointments.filter(apt => apt.client_id === client.id);
        return clientAppointments.length > 0; // Clientes que já agendaram antes
      });

      for (const client of lowOccupancyClients.slice(0, 10)) { // Limitar a 10 por execução
        candidates.push({
          client_id: client.id,
          client_name: client.name,
          phone: client.phone,
          promotion_details: 'Desconto especial de 20% em qualquer serviço!'
        });
      }
      break;
  }

  return candidates;
}

function processMessageTemplate(template: string, candidate: any, barbershopId: string): string {
  let message = template;
  
  // Substituir variáveis básicas
  message = message.replace(/\{\{client_name\}\}/g, candidate.client_name || 'Cliente');
  message = message.replace(/\{\{barbershop_name\}\}/g, 'Nossa Barbearia');
  
  // Variáveis específicas por tipo
  if (candidate.appointment_date) {
    const aptDate = new Date(candidate.appointment_date);
    message = message.replace(/\{\{appointment_date\}\}/g, aptDate.toLocaleDateString('pt-BR'));
  }
  
  if (candidate.appointment_time) {
    message = message.replace(/\{\{appointment_time\}\}/g, candidate.appointment_time);
  }
  
  if (candidate.promotion_details) {
    message = message.replace(/\{\{promotion_details\}\}/g, candidate.promotion_details);
  }
  
  if (candidate.days_since_visit) {
    message = message.replace(/\{\{days_since_visit\}\}/g, candidate.days_since_visit.toString());
  }
  
  // Data de expiração (7 dias a partir de hoje)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  message = message.replace(/\{\{expiry_date\}\}/g, expiryDate.toLocaleDateString('pt-BR'));
  
  return message;
}

async function sendWhatsAppMessage(phone: string, message: string, instance: any, supabase: any) {
  const zapiToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
  if (!zapiToken) {
    throw new Error('Z-API token not configured');
  }

  const formattedPhone = phone.replace(/\D/g, '');

  const response = await fetch(`https://api.z-api.io/instances/${instance.instance_id}/token/${instance.instance_token}/send-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': zapiToken
    },
    body: JSON.stringify({
      phone: formattedPhone,
      message: message
    })
  });

  const data = await response.json();

  if (data.value) {
    // Salvar mensagem no histórico
    await supabase
      .from('whatsapp_messages')
      .insert({
        barbershop_id: instance.barbershop_id,
        instance_id: instance.id,
        message_id: data.value,
        phone_number: formattedPhone,
        message_type: 'text',
        content: { text: message },
        direction: 'outgoing',
        status: 'sent'
      });
    
    console.log('WhatsApp message sent successfully to:', formattedPhone);
  } else {
    throw new Error('Failed to send WhatsApp message: ' + JSON.stringify(data));
  }
}

async function notifyStaff(rule: any, candidate: any, barbershopId: string, supabase: any) {
  // Buscar perfis de staff (admin e receptionist)
  const { data: staffProfiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .in('role', ['admin', 'receptionist']);

  // Aqui você pode implementar notificações por email, push notifications, etc.
  console.log('Staff notification:', {
    rule: rule.name,
    client: candidate.client_name,
    staff: staffProfiles?.length || 0
  });
}