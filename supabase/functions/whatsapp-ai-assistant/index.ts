import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  message: string;
  phone: string;
  barbershop_id: string;
  message_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { message, phone, barbershop_id, message_type = 'text' }: AIRequest = await req.json();

    console.log('Processing AI message:', { phone, barbershop_id, message: message.substring(0, 100) });

    // 1. Buscar ou criar conversa
    let { data: conversation, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('barbershop_id', barbershop_id)
      .eq('client_phone', phone)
      .single();

    if (convError && convError.code === 'PGRST116') {
      // Criar nova conversa
      const { data: newConv, error: createError } = await supabase
        .from('whatsapp_conversations')
        .insert({
          barbershop_id,
          client_phone: phone,
          status: 'active',
          ai_enabled: true,
          human_takeover: false
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        throw createError;
      }

      conversation = newConv;

      // Aplicar etiqueta "Novo Cliente"
      const { data: newClientTag } = await supabase
        .from('whatsapp_tags')
        .select('id')
        .eq('barbershop_id', barbershop_id)
        .eq('name', 'Novo Cliente')
        .single();

      if (newClientTag) {
        await supabase
          .from('whatsapp_conversation_tags')
          .insert({
            conversation_id: conversation.id,
            tag_id: newClientTag.id
          });
      }
    }

    // Verificar se humano assumiu controle
    if (conversation.human_takeover) {
      console.log('Human takeover active, skipping AI');
      return new Response(JSON.stringify({ 
        success: true, 
        ai_response: null,
        human_takeover: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Buscar contexto da IA
    let { data: aiContext } = await supabase
      .from('whatsapp_ai_context')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!aiContext) {
      const { data: newContext } = await supabase
        .from('whatsapp_ai_context')
        .insert({
          conversation_id: conversation.id,
          context_data: {},
          collected_data: {},
          step: 'greeting'
        })
        .select()
        .single();
      
      aiContext = newContext;
    }

    // 3. Buscar dados da barbearia
    const { data: barbershop } = await supabase
      .from('barbershops')
      .select('name, opening_hours, address')
      .eq('id', barbershop_id)
      .single();

    const { data: services } = await supabase
      .from('services')
      .select('name, duration_minutes, price')
      .eq('barbershop_id', barbershop_id)
      .eq('is_active', true);

    const { data: providers } = await supabase
      .from('profiles')
      .select('full_name, id')
      .eq('barbershop_id', barbershop_id)
      .eq('role', 'provider')
      .eq('is_active', true);

    // 4. Preparar prompt para OpenAI
    const systemPrompt = `Você é um assistente virtual especializado em agendamentos para a barbearia "${barbershop?.name}".

INFORMAÇÕES DA BARBEARIA:
- Nome: ${barbershop?.name}
- Endereço: ${barbershop?.address || 'Não informado'}
- Horário de funcionamento: ${JSON.stringify(barbershop?.opening_hours || {})}

SERVIÇOS DISPONÍVEIS:
${services?.map(service => `- ${service.name}: R$ ${service.price || 'Consultar'} (${service.duration_minutes || 30} min)`).join('\n')}

BARBEIROS DISPONÍVEIS:
${providers?.map(provider => `- ${provider.full_name}`).join('\n')}

INSTRUÇÕES:
1. Seja sempre cordial, profissional e prestativo
2. Ajude o cliente a agendar serviços ou responda dúvidas sobre a barbearia
3. Para agendamentos, colete: nome completo, serviço desejado, barbeiro (opcional), data e horário preferido
4. Quando tiver todos os dados, use a função 'check_availability' para verificar disponibilidade
5. Se disponível, use 'create_booking' para confirmar o agendamento
6. Confirme todos os detalhes antes de finalizar qualquer agendamento
7. Se não souber algo específico, seja honesto e ofereça ajuda alternativa
8. Mantenha conversas focadas em serviços da barbearia
9. Se o cliente precisar de atendimento humano complexo, use a função 'request_human_assistance'
10. Formate datas como YYYY-MM-DD e horários como HH:MM

CONTEXTO DA CONVERSA ANTERIOR:
${JSON.stringify(aiContext?.collected_data) || 'Primeira interação com este cliente'}

Responda de forma natural e conversacional, sempre em português brasileiro.`;

    // 5. Chamar OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        functions: [
          {
            name: 'check_availability',
            description: 'Verificar disponibilidade de horário antes de agendar',
            parameters: {
              type: 'object',
              properties: {
                client_name: { type: 'string', description: 'Nome completo do cliente' },
                service_name: { type: 'string', description: 'Nome do serviço desejado' },
                barber_name: { type: 'string', description: 'Nome do barbeiro (opcional)' },
                date: { type: 'string', description: 'Data desejada no formato YYYY-MM-DD' },
                time: { type: 'string', description: 'Horário desejado no formato HH:MM' }
              },
              required: ['client_name', 'service_name', 'date', 'time']
            }
          },
          {
            name: 'create_booking',
            description: 'Confirmar agendamento após verificar disponibilidade',
            parameters: {
              type: 'object',
              properties: {
                client_name: { type: 'string', description: 'Nome completo do cliente' },
                service_name: { type: 'string', description: 'Nome do serviço desejado' },
                barber_name: { type: 'string', description: 'Nome do barbeiro (opcional)' },
                date: { type: 'string', description: 'Data desejada no formato YYYY-MM-DD' },
                time: { type: 'string', description: 'Horário desejado no formato HH:MM' }
              },
              required: ['client_name', 'service_name', 'date', 'time']
            }
          },
          {
            name: 'request_human_assistance',
            description: 'Solicitar atendimento humano para casos complexos',
            parameters: {
              type: 'object',
              properties: {
                reason: { type: 'string', description: 'Motivo da solicitação de atendimento humano' }
              },
              required: ['reason']
            }
          }
        ],
        function_call: 'auto'
      }),
    });

    const aiResult = await openaiResponse.json();
    let aiResponse = aiResult.choices[0].message.content;
    let functionCall = aiResult.choices[0].message.function_call;

    console.log('AI Response:', aiResponse);
    console.log('Function Call:', functionCall);

    // 6. Processar function call se houver
    let updatedContext = aiContext;
    let appliedTags = [];
    let extractedInfo = {};

    if (functionCall) {
      console.log('🤖 Function call detected:', functionCall);
      
      if (functionCall.name === 'check_availability') {
        const appointmentData = JSON.parse(functionCall.arguments);
        console.log('🔍 Checking availability for:', appointmentData);
        
        // Call booking API to check availability
        const bookingResponse = await fetch('https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/whatsapp-booking-api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            barbershop_id,
            client_phone: phone,
            client_name: appointmentData.client_name,
            service_name: appointmentData.service_name,
            barber_name: appointmentData.barber_name,
            appointment_date: appointmentData.date,
            start_time: appointmentData.time,
            action: 'check_availability'
          })
        });

        const bookingResult = await bookingResponse.json();
        console.log('📅 Availability check result:', bookingResult);

        if (bookingResult.success && bookingResult.available) {
          extractedInfo = { 
            type: 'availability_check', 
            data: { ...appointmentData, ...bookingResult },
            status: 'available'
          };
          aiResponse = `✅ Perfeito! O horário está disponível:
          
📅 **${appointmentData.date}** às **${appointmentData.time}**
💇‍♂️ **Serviço:** ${bookingResult.service.name}
👨‍💼 **Barbeiro:** ${bookingResult.barber.name}
💰 **Valor:** R$ ${bookingResult.service.price}
⏱️ **Duração:** ${bookingResult.service.duration} minutos

Posso confirmar este agendamento para você?`;
        } else {
          extractedInfo = { 
            type: 'availability_check', 
            data: appointmentData,
            status: 'unavailable'
          };
          aiResponse = `❌ Infelizmente este horário não está disponível. 

Que tal escolher outro horário? Posso verificar outras opções para você.`;
        }
        
        // Apply automatic tag
        const { data: tag } = await supabase
          .from('whatsapp_tags')
          .select('id')
          .eq('name', 'Agendamento')
          .eq('barbershop_id', barbershop_id)
          .single();

        if (tag) {
          await supabase
            .from('whatsapp_conversation_tags')
            .insert({
              conversation_id: conversation.id,
              tag_id: tag.id
            })
            .onConflict('conversation_id,tag_id')
            .merge();
          appliedTags.push('Agendamento');
        }

      } else if (functionCall.name === 'create_booking') {
        const appointmentData = JSON.parse(functionCall.arguments);
        console.log('✅ Creating booking for:', appointmentData);
        
        // Call booking API to create appointment
        const bookingResponse = await fetch('https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/whatsapp-booking-api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            barbershop_id,
            client_phone: phone,
            client_name: appointmentData.client_name,
            service_name: appointmentData.service_name,
            barber_name: appointmentData.barber_name,
            appointment_date: appointmentData.date,
            start_time: appointmentData.time,
            action: 'create_booking'
          })
        });

        const bookingResult = await bookingResponse.json();
        console.log('📅 Booking result:', bookingResult);

        if (bookingResult.success) {
          extractedInfo = { 
            type: 'appointment_confirmed', 
            data: { ...appointmentData, ...bookingResult.appointment },
            status: 'confirmed'
          };
          aiResponse = `🎉 **Agendamento confirmado com sucesso!**

📅 **Data:** ${bookingResult.appointment.date}
🕒 **Horário:** ${bookingResult.appointment.start_time}
💇‍♂️ **Serviço:** ${bookingResult.appointment.service}
👨‍💼 **Barbeiro:** ${bookingResult.appointment.barber}
💰 **Valor:** R$ ${bookingResult.appointment.total_price}

${barbershop.name}
${barbershop.address || ''}

Até lá! 😊`;
        } else {
          extractedInfo = { 
            type: 'appointment_error', 
            data: appointmentData,
            error: bookingResult.error
          };
          aiResponse = `❌ Não foi possível confirmar o agendamento: ${bookingResult.error}

Por favor, tente novamente ou entre em contato conosco.`;
        }
        
        // Apply automatic tag
        const { data: tag } = await supabase
          .from('whatsapp_tags')
          .select('id')
          .eq('name', 'Agendamento')
          .eq('barbershop_id', barbershop_id)
          .single();

        if (tag) {
          await supabase
            .from('whatsapp_conversation_tags')
            .insert({
              conversation_id: conversation.id,
              tag_id: tag.id
            })
            .onConflict('conversation_id,tag_id')
            .merge();
          appliedTags.push('Agendamento');
        }

      } else if (functionCall.name === 'request_human_assistance') {
        const assistanceData = JSON.parse(functionCall.arguments);
        extractedInfo = { 
          type: 'human_assistance_request', 
          data: assistanceData 
        };
        
        // Update conversation for human takeover
        await supabase
          .from('whatsapp_conversations')
          .update({ 
            human_takeover: true,
            ai_enabled: false 
          })
          .eq('id', conversation.id);
        
        // Apply automatic tag
        const { data: tag } = await supabase
          .from('whatsapp_tags')
          .select('id')
          .eq('name', 'Assistência Humana')
          .eq('barbershop_id', barbershop_id)
          .single();

        if (tag) {
          await supabase
            .from('whatsapp_conversation_tags')
            .insert({
              conversation_id: conversation.id,
              tag_id: tag.id
            })
            .onConflict('conversation_id,tag_id')
            .merge();
          appliedTags.push('Assistência Humana');
        }

        aiResponse += '\n\n*Transferindo para atendimento humano...*';
      }

      // Update AI context with extracted information
      await supabase
        .from('whatsapp_ai_context')
        .update({
          context_data: {
            ...aiContext.context_data,
            extracted_info: extractedInfo,
            last_function_call: functionCall.name
          }
        })
        .eq('id', aiContext.id);
    }

    // 7. Atualizar última mensagem da conversa
    await supabase
      .from('whatsapp_conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        client_name: updatedContext?.collected_data?.name || conversation.client_name
      })
      .eq('id', conversation.id);

    return new Response(JSON.stringify({
      success: true,
      ai_response: aiResponse,
      conversation_id: conversation.id,
      intent: updatedContext?.intent,
      collected_data: updatedContext?.collected_data,
      applied_tags: appliedTags,
      human_takeover: updatedContext?.context_data?.needs_human || false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in whatsapp-ai-assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});