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
    const systemPrompt = `Você é a recepcionista virtual da ${barbershop?.name || 'barbearia'}. 

INSTRUÇÕES IMPORTANTES:
- Use linguagem educada e objetiva, sem emojis ou diminutivos
- Mantenha respostas curtas e diretas
- Você pode agendar, remarcar, cancelar agendamentos e responder dúvidas básicas
- Se não souber responder algo, encaminhe para atendimento humano

DADOS DA BARBEARIA:
- Nome: ${barbershop?.name}
- Endereço: ${barbershop?.address || 'Não informado'}
- Horários: ${JSON.stringify(barbershop?.opening_hours)}

SERVIÇOS DISPONÍVEIS:
${services?.map(s => `- ${s.name}: ${s.duration_minutes}min, R$ ${s.price}`).join('\n') || 'Nenhum serviço cadastrado'}

BARBEIROS DISPONÍVEIS:
${providers?.map(p => `- ${p.full_name}`).join('\n') || 'Nenhum barbeiro cadastrado'}

CONTEXTO ATUAL:
- Etapa: ${aiContext?.step}
- Intenção detectada: ${aiContext?.intent || 'Não detectada'}
- Dados coletados: ${JSON.stringify(aiContext?.collected_data)}

RESPONDA com base na mensagem do cliente e no contexto atual.`;

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
            name: 'detect_intent',
            description: 'Detecta a intenção do cliente e coleta dados',
            parameters: {
              type: 'object',
              properties: {
                intent: { 
                  type: 'string', 
                  enum: ['agendar', 'remarcar', 'cancelar', 'duvida', 'saudacao', 'transfer_human'] 
                },
                collected_data: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    service: { type: 'string' },
                    provider: { type: 'string' },
                    date: { type: 'string' },
                    time: { type: 'string' }
                  }
                },
                next_step: { type: 'string' },
                needs_human: { type: 'boolean' }
              },
              required: ['intent']
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

    if (functionCall && functionCall.name === 'detect_intent') {
      const functionArgs = JSON.parse(functionCall.arguments);
      console.log('Function Args:', functionArgs);

      // Atualizar contexto da IA
      const { data: newContext } = await supabase
        .from('whatsapp_ai_context')
        .update({
          intent: functionArgs.intent,
          collected_data: { 
            ...aiContext.collected_data, 
            ...functionArgs.collected_data 
          },
          step: functionArgs.next_step || aiContext.step,
          context_data: {
            ...aiContext.context_data,
            last_intent: functionArgs.intent,
            needs_human: functionArgs.needs_human
          }
        })
        .eq('id', aiContext.id)
        .select()
        .single();

      updatedContext = newContext;

      // Aplicar etiquetas baseadas na intenção
      const intentTagMap = {
        'agendar': 'Quer Agendar',
        'remarcar': 'Remarcar', 
        'cancelar': 'Cancelar',
        'duvida': 'Dúvida'
      };

      const tagName = intentTagMap[functionArgs.intent];
      if (tagName) {
        const { data: tag } = await supabase
          .from('whatsapp_tags')
          .select('id')
          .eq('barbershop_id', barbershop_id)
          .eq('name', tagName)
          .single();

        if (tag) {
          await supabase
            .from('whatsapp_conversation_tags')
            .upsert({
              conversation_id: conversation.id,
              tag_id: tag.id
            });
          appliedTags.push(tagName);
        }
      }

      // Se precisa de humano, transferir
      if (functionArgs.needs_human) {
        await supabase
          .from('whatsapp_conversations')
          .update({ human_takeover: true })
          .eq('id', conversation.id);

        const { data: humanTag } = await supabase
          .from('whatsapp_tags')
          .select('id')
          .eq('barbershop_id', barbershop_id)
          .eq('name', 'Atendimento Humano')
          .single();

        if (humanTag) {
          await supabase
            .from('whatsapp_conversation_tags')
            .upsert({
              conversation_id: conversation.id,
              tag_id: humanTag.id
            });
          appliedTags.push('Atendimento Humano');
        }

        aiResponse = "Entendi que você precisa de um atendimento mais personalizado. Vou transferir você para um de nossos atendentes que responderá em breve.";
      }
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