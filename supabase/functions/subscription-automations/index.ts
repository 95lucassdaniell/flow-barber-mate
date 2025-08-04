import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()

    console.log('Processando automação de assinatura:', action)

    switch (action) {
      case 'reset_monthly_services':
        await resetMonthlyServices(supabaseClient)
        break
      
      case 'process_overdue':
        await processOverdueSubscriptions(supabaseClient)
        break
        
      case 'generate_financial_records':
        await generateFinancialRecords(supabaseClient)
        break
        
      default:
        throw new Error(`Ação não reconhecida: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: `Automação ${action} executada com sucesso` }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erro na automação de assinatura:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function resetMonthlyServices(supabase: any) {
  console.log('Iniciando reset mensal de serviços...')
  
  // Chamar função do banco para reset mensal
  const { data, error } = await supabase.rpc('reset_monthly_subscription_services')
  
  if (error) {
    console.error('Erro no reset mensal:', error)
    throw error
  }
  
  console.log('Reset mensal concluído:', data)
}

async function processOverdueSubscriptions(supabase: any) {
  console.log('Processando assinaturas vencidas...')
  
  // Chamar função do banco para processar vencidas
  const { data, error } = await supabase.rpc('process_overdue_subscriptions')
  
  if (error) {
    console.error('Erro ao processar vencidas:', error)
    throw error
  }
  
  console.log('Processamento de vencidas concluído:', data, 'assinaturas processadas')
}

async function generateFinancialRecords(supabase: any) {
  console.log('Gerando lançamentos financeiros mensais...')
  
  // Buscar assinaturas ativas que precisam de cobrança
  const { data: subscriptions, error: subsError } = await supabase
    .from('client_subscriptions')
    .select(`
      *,
      provider_subscription_plans(monthly_price, commission_percentage),
      clients(name),
      barbershops(name)
    `)
    .eq('status', 'active')
    .lte('next_billing_date', new Date().toISOString().split('T')[0])
  
  if (subsError) {
    console.error('Erro ao buscar assinaturas:', subsError)
    throw subsError
  }
  
  if (!subscriptions || subscriptions.length === 0) {
    console.log('Nenhuma assinatura encontrada para cobrança')
    return
  }
  
  console.log(`Processando ${subscriptions.length} assinaturas para cobrança`)
  
  for (const subscription of subscriptions) {
    try {
      const plan = subscription.provider_subscription_plans
      const monthlyPrice = plan.monthly_price || 0
      const commissionAmount = monthlyPrice * ((plan.commission_percentage || 0) / 100)
      const netAmount = monthlyPrice - commissionAmount
      
      // Criar registro financeiro
      const { error: finError } = await supabase
        .from('subscription_financial_records')
        .insert({
          subscription_id: subscription.id,
          amount: monthlyPrice,
          commission_amount: commissionAmount,
          net_amount: netAmount,
          due_date: subscription.next_billing_date,
          status: 'pending',
          description: `Cobrança mensal - ${plan.name} - ${subscription.clients.name}`,
        })
      
      if (finError) {
        console.error('Erro ao criar registro financeiro:', finError)
        continue
      }
      
      // Atualizar próxima data de cobrança (próximo mês)
      const nextBillingDate = new Date(subscription.next_billing_date)
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
      
      const { error: updateError } = await supabase
        .from('client_subscriptions')
        .update({
          next_billing_date: nextBillingDate.toISOString().split('T')[0]
        })
        .eq('id', subscription.id)
      
      if (updateError) {
        console.error('Erro ao atualizar próxima cobrança:', updateError)
      }
      
      console.log(`Cobrança gerada para assinatura ${subscription.id}`)
      
    } catch (error) {
      console.error(`Erro ao processar assinatura ${subscription.id}:`, error)
    }
  }
  
  console.log('Geração de lançamentos financeiros concluída')
}