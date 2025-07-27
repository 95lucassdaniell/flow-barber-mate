import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HistoricalDataConfig {
  barbershopId: string;
  clientsToCreate: number;
  appointmentsToCreate: number;
  startDate: string; // 6 months ago
  endDate: string; // 1 month ahead
  preserveExisting: boolean;
}

interface TestResult {
  phase: string;
  duration: number;
  recordsCreated: number;
  errors: number;
  avgResponseTime: number;
}

const generateRandomData = () => {
  const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Lucia', 'Rafael', 'Carla', 'Bruno', 'Sofia', 'Fernando', 'Patricia', 'Ricardo', 'Juliana', 'Marcos', 'Fernanda', 'Antonio', 'Roberta', 'Alexandre', 'Camila'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Ferreira', 'Araújo', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Carvalho', 'Barbosa', 'Monteiro', 'Dias'];
  
  return {
    randomName: () => firstNames[Math.floor(Math.random() * firstNames.length)],
    randomLastName: () => lastNames[Math.floor(Math.random() * lastNames.length)],
    randomPhone: () => `(11) 9${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    randomEmail: (name: string, lastName: string) => `${name.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@gmail.com`,
    
    // Generate date within a range
    randomDateInRange: (startDate: Date, endDate: Date) => {
      const start = startDate.getTime();
      const end = endDate.getTime();
      const randomTime = start + Math.random() * (end - start);
      return new Date(randomTime);
    },
    
    // Generate time slots (business hours)
    randomBusinessTime: () => {
      const hours = [9, 10, 11, 13, 14, 15, 16, 17];
      const minutes = ['00', '30'];
      const hour = hours[Math.floor(Math.random() * hours.length)];
      const minute = minutes[Math.floor(Math.random() * minutes.length)];
      return `${hour.toString().padStart(2, '0')}:${minute}:00`;
    },
    
    // Generate birth date (18-80 years old)
    randomBirthDate: () => {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - (18 + Math.floor(Math.random() * 62));
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      return `${birthYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  };
};

// Client behavior patterns
const getClientPattern = () => {
  const patterns = [
    { type: 'VIP', frequency: 15, probability: 0.15, productPurchase: 0.6 }, // Every 15 days, 60% buy products
    { type: 'Regular', frequency: 30, probability: 0.50, productPurchase: 0.3 }, // Every 30 days, 30% buy products  
    { type: 'Occasional', frequency: 60, probability: 0.30, productPurchase: 0.1 }, // Every 60 days, 10% buy products
    { type: 'Inactive', frequency: 120, probability: 0.05, productPurchase: 0.05 } // Every 120 days, 5% buy products
  ];
  
  const random = Math.random();
  let cumulative = 0;
  
  for (const pattern of patterns) {
    cumulative += pattern.probability;
    if (random <= cumulative) {
      return pattern;
    }
  }
  
  return patterns[1]; // Default to Regular
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { config }: { config: HistoricalDataConfig } = await req.json();

    console.log('Starting historical data generation with config:', config);
    
    const results: TestResult[] = [];
    const data = generateRandomData();

    // Get existing barbershop data
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('*')
      .eq('id', config.barbershopId)
      .single();

    if (barbershopError || !barbershop) {
      throw new Error('Barbershop not found');
    }

    // Get existing providers (barbers)
    const { data: providers, error: providersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('barbershop_id', config.barbershopId)
      .eq('role', 'barber');

    if (providersError || !providers || providers.length === 0) {
      throw new Error('No barbers found for this barbershop');
    }

    // Get existing services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('barbershop_id', config.barbershopId)
      .eq('is_active', true);

    if (servicesError || !services || services.length === 0) {
      throw new Error('No services found for this barbershop');
    }

    // Get existing products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('barbershop_id', config.barbershopId)
      .eq('is_active', true);

    console.log(`Found: ${providers.length} barbers, ${services.length} services, ${products?.length || 0} products`);

    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    const currentDate = new Date();

    // Phase 1: Create Clients
    console.log('Phase 1: Creating clients...');
    const startTime1 = Date.now();
    let errors1 = 0;
    const createdClients = [];

    for (let i = 0; i < config.clientsToCreate; i++) {
      const firstName = data.randomName();
      const lastName = data.randomLastName();
      
      // Distribute client creation dates over the past 6 months
      const registrationDate = data.randomDateInRange(startDate, currentDate);
      
      const client = {
        barbershop_id: config.barbershopId,
        name: `${firstName} ${lastName}`,
        phone: data.randomPhone(),
        email: Math.random() > 0.2 ? data.randomEmail(firstName, lastName) : null,
        birth_date: Math.random() > 0.3 ? data.randomBirthDate() : null,
        created_at: registrationDate.toISOString(),
        updated_at: registrationDate.toISOString(),
      };

      try {
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert(client)
          .select()
          .single();
        
        if (error) throw error;
        
        // Add client pattern for appointment generation
        createdClients.push({
          ...newClient,
          pattern: getClientPattern(),
          registrationDate
        });
      } catch (error) {
        errors1++;
        console.error(`Error creating client ${i + 1}:`, error);
      }
    }

    const duration1 = Date.now() - startTime1;
    results.push({
      phase: 'clients',
      duration: duration1,
      recordsCreated: createdClients.length,
      errors: errors1,
      avgResponseTime: duration1 / config.clientsToCreate,
    });

    console.log(`Phase 1 completed: ${createdClients.length} clients created in ${duration1}ms`);

    // Phase 2: Create Historical Appointments (6 months back)
    console.log('Phase 2: Creating historical appointments...');
    const startTime2 = Date.now();
    let errors2 = 0;
    const createdAppointments = [];
    let appointmentCount = 0;

    for (const client of createdClients) {
      // Generate appointments based on client pattern
      let nextAppointmentDate = new Date(client.registrationDate);
      
      while (nextAppointmentDate <= currentDate && appointmentCount < config.appointmentsToCreate * 0.85) { // 85% historical
        // Skip weekends occasionally
        if (nextAppointmentDate.getDay() === 0 && Math.random() > 0.1) { // 90% skip Sunday
          nextAppointmentDate.setDate(nextAppointmentDate.getDate() + 1);
          continue;
        }

        const randomProvider = providers[Math.floor(Math.random() * providers.length)];
        const randomService = services[Math.floor(Math.random() * services.length)];
        
        // Determine appointment status
        let status = 'completed';
        if (Math.random() < 0.15) status = 'cancelled'; // 15% cancelled
        
        const startTime = data.randomBusinessTime();
        const serviceDuration = randomService.duration || 30;
        const endTimeDate = new Date(`2024-01-01T${startTime}`);
        endTimeDate.setMinutes(endTimeDate.getMinutes() + serviceDuration);
        const endTime = endTimeDate.toTimeString().slice(0, 8);

        const appointment = {
          barbershop_id: config.barbershopId,
          client_id: client.id,
          barber_id: randomProvider.id,
          service_id: randomService.id,
          appointment_date: nextAppointmentDate.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          total_price: randomService.price,
          status,
          created_at: nextAppointmentDate.toISOString(),
          updated_at: nextAppointmentDate.toISOString(),
        };

        try {
          const { data: newAppointment, error } = await supabase
            .from('appointments')
            .insert(appointment)
            .select()
            .single();
          
          if (error) throw error;
          
          createdAppointments.push({
            ...newAppointment,
            client,
            provider: randomProvider,
            service: randomService
          });
          appointmentCount++;
        } catch (error) {
          errors2++;
          console.error(`Error creating appointment:`, error);
        }

        // Schedule next appointment based on client pattern
        nextAppointmentDate = new Date(nextAppointmentDate);
        nextAppointmentDate.setDate(nextAppointmentDate.getDate() + client.pattern.frequency + Math.floor(Math.random() * 7 - 3)); // ±3 days variation
      }
    }

    const duration2 = Date.now() - startTime2;
    results.push({
      phase: 'historical_appointments',
      duration: duration2,
      recordsCreated: createdAppointments.length,
      errors: errors2,
      avgResponseTime: duration2 / createdAppointments.length,
    });

    console.log(`Phase 2 completed: ${createdAppointments.length} historical appointments created in ${duration2}ms`);

    // Phase 3: Create Future Appointments (1 month ahead)
    console.log('Phase 3: Creating future appointments...');
    const startTime3 = Date.now();
    let errors3 = 0;
    let futureAppointmentCount = 0;
    const remainingAppointments = config.appointmentsToCreate - appointmentCount;

    for (const client of createdClients) {
      if (futureAppointmentCount >= remainingAppointments) break;
      
      // Only create future appointments for active clients (not inactive pattern)
      if (client.pattern.type === 'Inactive') continue;
      
      // Create 1-2 future appointments per active client
      const futureAppointments = Math.random() > 0.5 ? 1 : 2;
      
      for (let i = 0; i < futureAppointments && futureAppointmentCount < remainingAppointments; i++) {
        const futureDate = new Date(currentDate);
        futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1); // 1-30 days ahead
        
        if (futureDate > endDate) continue;

        const randomProvider = providers[Math.floor(Math.random() * providers.length)];
        const randomService = services[Math.floor(Math.random() * services.length)];
        
        const startTime = data.randomBusinessTime();
        const serviceDuration = randomService.duration || 30;
        const endTimeDate = new Date(`2024-01-01T${startTime}`);
        endTimeDate.setMinutes(endTimeDate.getMinutes() + serviceDuration);
        const endTime = endTimeDate.toTimeString().slice(0, 8);

        const appointment = {
          barbershop_id: config.barbershopId,
          client_id: client.id,
          barber_id: randomProvider.id,
          service_id: randomService.id,
          appointment_date: futureDate.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          total_price: randomService.price,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          const { error } = await supabase
            .from('appointments')
            .insert(appointment);
          
          if (error) throw error;
          futureAppointmentCount++;
        } catch (error) {
          errors3++;
          console.error(`Error creating future appointment:`, error);
        }
      }
    }

    const duration3 = Date.now() - startTime3;
    results.push({
      phase: 'future_appointments',
      duration: duration3,
      recordsCreated: futureAppointmentCount,
      errors: errors3,
      avgResponseTime: duration3 / futureAppointmentCount,
    });

    console.log(`Phase 3 completed: ${futureAppointmentCount} future appointments created in ${duration3}ms`);

    // Phase 4: Process Commands and Sales for Completed Appointments
    console.log('Phase 4: Processing commands and sales...');
    const startTime4 = Date.now();
    let errors4 = 0;
    let salesCount = 0;

    const completedAppointments = createdAppointments.filter(apt => apt.status === 'completed');
    
    for (const appointment of completedAppointments) {
      try {
        // Commands are automatically created by trigger, so we need to get the created command
        const { data: command, error: commandError } = await supabase
          .from('commands')
          .select('*')
          .eq('appointment_id', appointment.id)
          .single();

        if (commandError) {
          console.error('Command not found for appointment:', appointment.id);
          continue;
        }

        // Close command and create sale
        const paymentMethods = ['cash', 'card', 'pix'];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        // Update command as paid
        await supabase
          .from('commands')
          .update({
            status: 'paid',
            payment_method: paymentMethod,
            payment_status: 'paid',
            closed_at: appointment.created_at
          })
          .eq('id', command.id);

        // Add products to some appointments (based on client pattern)
        let totalAmount = command.total_amount;
        
        if (products && products.length > 0 && Math.random() < appointment.client.pattern.productPurchase) {
          const productCount = Math.random() > 0.7 ? 2 : 1; // 30% chance of 2 products
          
          for (let p = 0; p < productCount; p++) {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.random() > 0.8 ? 2 : 1; // 20% chance of quantity 2
            
            await supabase
              .from('command_items')
              .insert({
                command_id: command.id,
                product_id: randomProduct.id,
                item_type: 'product',
                quantity,
                unit_price: randomProduct.price,
                total_price: randomProduct.price * quantity,
                commission_rate: 0,
                commission_amount: 0
              });
            
            totalAmount += randomProduct.price * quantity;
          }
        }

        // Create sale record
        const sale = {
          barbershop_id: config.barbershopId,
          command_id: command.id,
          client_id: appointment.client_id,
          total_amount: totalAmount,
          discount_amount: 0,
          final_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: 'paid',
          sale_date: appointment.appointment_date,
          created_at: appointment.created_at,
          updated_at: appointment.created_at,
        };

        const { error: saleError } = await supabase
          .from('sales')
          .insert(sale);

        if (saleError) throw saleError;
        salesCount++;

      } catch (error) {
        errors4++;
        console.error(`Error processing sale for appointment ${appointment.id}:`, error);
      }
    }

    const duration4 = Date.now() - startTime4;
    results.push({
      phase: 'sales_processing',
      duration: duration4,
      recordsCreated: salesCount,
      errors: errors4,
      avgResponseTime: duration4 / completedAppointments.length,
    });

    console.log(`Phase 4 completed: ${salesCount} sales processed in ${duration4}ms`);

    // Calculate total test time and summary
    const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);
    const totalRecords = results.reduce((sum, result) => sum + result.recordsCreated, 0);
    const totalErrors = results.reduce((sum, result) => sum + result.errors, 0);

    const summary = {
      testConfig: config,
      results,
      summary: {
        totalDuration,
        totalRecords,
        totalErrors,
        recordsPerSecond: Math.round((totalRecords / totalDuration) * 1000),
        errorRate: Math.round((totalErrors / totalRecords) * 100 * 100) / 100,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Historical data generation completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Historical data generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});