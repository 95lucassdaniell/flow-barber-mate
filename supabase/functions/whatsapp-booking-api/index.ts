import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingRequest {
  barbershop_id: string;
  client_phone: string;
  client_name: string;
  service_name?: string;
  service_id?: string;
  barber_name?: string;
  barber_id?: string;
  appointment_date: string;
  start_time: string;
  action: 'check_availability' | 'create_booking';
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

    const bookingRequest: BookingRequest = await req.json();
    console.log('📅 Booking API Request:', bookingRequest);

    const { barbershop_id, client_phone, client_name, appointment_date, start_time, action } = bookingRequest;

    // Validar dados obrigatórios
    if (!barbershop_id || !client_phone || !client_name || !appointment_date || !start_time) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Dados obrigatórios ausentes: barbershop_id, client_phone, client_name, appointment_date, start_time' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar ou criar cliente
    let client = null;
    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', client_phone)
      .eq('barbershop_id', barbershop_id)
      .single();

    if (existingClient) {
      client = existingClient;
      console.log('📱 Cliente existente encontrado:', client.name);
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: client_name,
          phone: client_phone,
          barbershop_id: barbershop_id
        })
        .select()
        .single();

      if (clientError) {
        console.error('❌ Erro ao criar cliente:', clientError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Erro ao criar cliente: ' + clientError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      client = newClient;
      console.log('🆕 Novo cliente criado:', client.name);
    }

    // Buscar serviços e barbeiros da barbearia
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('barbershop_id', barbershop_id)
      .eq('is_active', true);

    const { data: barbers } = await supabase
      .from('profiles')
      .select('*')
      .eq('barbershop_id', barbershop_id)
      .eq('is_active', true)
      .in('role', ['admin', 'barber']);

    // Resolver serviço
    let service = null;
    if (bookingRequest.service_id) {
      service = services?.find(s => s.id === bookingRequest.service_id);
    } else if (bookingRequest.service_name) {
      service = services?.find(s => 
        s.name.toLowerCase().includes(bookingRequest.service_name!.toLowerCase()) ||
        bookingRequest.service_name!.toLowerCase().includes(s.name.toLowerCase())
      );
    }

    // Se não encontrou serviço específico, usar o primeiro disponível
    if (!service && services && services.length > 0) {
      service = services[0];
    }

    // Resolver barbeiro
    let barber = null;
    if (bookingRequest.barber_id) {
      barber = barbers?.find(b => b.id === bookingRequest.barber_id);
    } else if (bookingRequest.barber_name) {
      barber = barbers?.find(b => 
        b.full_name.toLowerCase().includes(bookingRequest.barber_name!.toLowerCase()) ||
        bookingRequest.barber_name!.toLowerCase().includes(b.full_name.toLowerCase())
      );
    }

    // Se não encontrou barbeiro específico, usar o primeiro disponível
    if (!barber && barbers && barbers.length > 0) {
      barber = barbers[0];
    }

    if (!service || !barber) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Serviço ou barbeiro não encontrado',
        available_services: services?.map(s => ({ id: s.id, name: s.name })) || [],
        available_barbers: barbers?.map(b => ({ id: b.id, name: b.full_name })) || []
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calcular hora de fim baseado na duração do serviço
    const startTimeMinutes = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
    const endTimeMinutes = startTimeMinutes + (service.duration_minutes || 30);
    const end_time = `${Math.floor(endTimeMinutes / 60).toString().padStart(2, '0')}:${(endTimeMinutes % 60).toString().padStart(2, '0')}`;

    // Verificar disponibilidade
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('barber_id', barber.id)
      .eq('appointment_date', appointment_date)
      .neq('status', 'cancelled')
      .gte('end_time', start_time)
      .lte('start_time', end_time);

    const isAvailable = !existingAppointments || existingAppointments.length === 0;

    if (action === 'check_availability') {
      return new Response(JSON.stringify({
        success: true,
        available: isAvailable,
        service: { id: service.id, name: service.name, duration: service.duration_minutes, price: service.price },
        barber: { id: barber.id, name: barber.full_name },
        client: { id: client.id, name: client.name, phone: client.phone },
        appointment_details: {
          date: appointment_date,
          start_time,
          end_time,
          total_price: service.price || 0
        },
        conflicts: existingAppointments || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_booking') {
      if (!isAvailable) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Horário não disponível',
          conflicts: existingAppointments
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Criar agendamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          barbershop_id,
          client_id: client.id,
          barber_id: barber.id,
          service_id: service.id,
          appointment_date,
          start_time,
          end_time,
          total_price: service.price || 0,
          status: 'confirmed',
          booking_source: 'whatsapp',
          notes: 'Agendamento realizado via WhatsApp AI'
        })
        .select()
        .single();

      if (appointmentError) {
        console.error('❌ Erro ao criar agendamento:', appointmentError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Erro ao criar agendamento: ' + appointmentError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Agendamento criado com sucesso:', appointment.id);

      return new Response(JSON.stringify({
        success: true,
        appointment: {
          id: appointment.id,
          date: appointment_date,
          start_time,
          end_time,
          service: service.name,
          barber: barber.full_name,
          client: client.name,
          total_price: appointment.total_price,
          status: appointment.status
        },
        message: `Agendamento confirmado! ${service.name} com ${barber.full_name} no dia ${appointment_date} às ${start_time}.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Ação inválida. Use "check_availability" ou "create_booking"' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na API de agendamento:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erro interno do servidor: ' + error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});