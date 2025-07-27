import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LoadTestConfig {
  barbershops: number;
  usersPerBarbershop: number;
  appointmentsPerBarbershop: number;
  salesPerBarbershop: number;
  commandsPerBarbershop: number;
  clientsPerBarbershop: number;
}

interface TestResult {
  phase: string;
  duration: number;
  recordsCreated: number;
  errors: number;
  avgResponseTime: number;
}

const generateRandomData = () => {
  const names = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Lucia', 'Rafael', 'Carla', 'Bruno', 'Sofia'];
  const surnames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento'];
  const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília', 'Fortaleza', 'Curitiba', 'Recife', 'Porto Alegre', 'Manaus'];
  const serviceNames = ['Corte Masculino', 'Corte Feminino', 'Barba', 'Sobrancelha', 'Luzes', 'Escova', 'Hidratação', 'Tratamento', 'Penteado', 'Manicure'];
  
  return {
    randomName: () => names[Math.floor(Math.random() * names.length)],
    randomSurname: () => surnames[Math.floor(Math.random() * surnames.length)],
    randomCity: () => cities[Math.floor(Math.random() * cities.length)],
    randomService: () => serviceNames[Math.floor(Math.random() * serviceNames.length)],
    randomPhone: () => `(11) 9${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    randomEmail: (name: string) => `${name.toLowerCase()}${Math.floor(Math.random() * 1000)}@test.com`,
    randomPrice: () => Math.floor(Math.random() * 100) + 20,
    randomDate: (daysBack: number = 30) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
      return date.toISOString().split('T')[0];
    },
    randomTime: () => `${Math.floor(Math.random() * 10) + 8}:${Math.random() > 0.5 ? '00' : '30'}`,
  };
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

    const { config }: { config: LoadTestConfig } = await req.json();

    console.log('Starting load test with config:', config);
    
    const results: TestResult[] = [];
    const data = generateRandomData();

    // Phase 1: Create Barbershops
    console.log('Phase 1: Creating barbershops...');
    const startTime1 = Date.now();
    let errors1 = 0;
    
    const barbershops = [];
    for (let i = 0; i < config.barbershops; i++) {
      const name = `${data.randomName()} Barbershop ${i + 1}`;
      const barbershop = {
        name,
        slug: `barbershop-test-${i + 1}`,
        email: data.randomEmail(name.split(' ')[0]),
        phone: data.randomPhone(),
        address: `Rua Test ${i + 1}, ${data.randomCity()}`,
        status: 'active',
        plan: Math.random() > 0.7 ? 'premium' : 'basic',
        payment_status: 'current',
        monthly_revenue: Math.floor(Math.random() * 10000) + 1000,
      };
      
      try {
        const { data: newBarbershop, error } = await supabase
          .from('barbershops')
          .insert(barbershop)
          .select()
          .single();
        
        if (error) throw error;
        barbershops.push(newBarbershop);
      } catch (error) {
        errors1++;
        console.error(`Error creating barbershop ${i + 1}:`, error);
      }
    }

    const duration1 = Date.now() - startTime1;
    results.push({
      phase: 'barbershops',
      duration: duration1,
      recordsCreated: barbershops.length,
      errors: errors1,
      avgResponseTime: duration1 / config.barbershops,
    });

    console.log(`Phase 1 completed: ${barbershops.length} barbershops created in ${duration1}ms`);

    // Phase 2: Create Users (Profiles)
    console.log('Phase 2: Creating users...');
    const startTime2 = Date.now();
    let errors2 = 0;
    let totalUsers = 0;

    for (const barbershop of barbershops) {
      for (let j = 0; j < config.usersPerBarbershop; j++) {
        const firstName = data.randomName();
        const lastName = data.randomSurname();
        const role = j === 0 ? 'admin' : (j === 1 ? 'receptionist' : 'barber');
        
        const profile = {
          barbershop_id: barbershop.id,
          full_name: `${firstName} ${lastName}`,
          email: data.randomEmail(firstName),
          role,
          commission_rate: role === 'barber' ? Math.floor(Math.random() * 30) + 20 : 0,
        };

        try {
          const { error } = await supabase
            .from('profiles')
            .insert(profile);
          
          if (error) throw error;
          totalUsers++;
        } catch (error) {
          errors2++;
          console.error(`Error creating user for barbershop ${barbershop.id}:`, error);
        }
      }
    }

    const duration2 = Date.now() - startTime2;
    results.push({
      phase: 'users',
      duration: duration2,
      recordsCreated: totalUsers,
      errors: errors2,
      avgResponseTime: duration2 / (config.barbershops * config.usersPerBarbershop),
    });

    console.log(`Phase 2 completed: ${totalUsers} users created in ${duration2}ms`);

    // Phase 3: Create Services
    console.log('Phase 3: Creating services...');
    const startTime3 = Date.now();
    let errors3 = 0;
    let totalServices = 0;

    for (const barbershop of barbershops) {
      for (let j = 0; j < 5; j++) { // 5 services per barbershop
        const service = {
          barbershop_id: barbershop.id,
          name: `${data.randomService()} ${j + 1}`,
          price: data.randomPrice(),
          duration: Math.floor(Math.random() * 60) + 30,
          is_active: true,
        };

        try {
          const { error } = await supabase
            .from('services')
            .insert(service);
          
          if (error) throw error;
          totalServices++;
        } catch (error) {
          errors3++;
          console.error(`Error creating service for barbershop ${barbershop.id}:`, error);
        }
      }
    }

    const duration3 = Date.now() - startTime3;
    results.push({
      phase: 'services',
      duration: duration3,
      recordsCreated: totalServices,
      errors: errors3,
      avgResponseTime: duration3 / (config.barbershops * 5),
    });

    console.log(`Phase 3 completed: ${totalServices} services created in ${duration3}ms`);

    // Phase 4: Create Clients
    console.log('Phase 4: Creating clients...');
    const startTime4 = Date.now();
    let errors4 = 0;
    let totalClients = 0;

    for (const barbershop of barbershops) {
      for (let j = 0; j < config.clientsPerBarbershop; j++) {
        const firstName = data.randomName();
        const lastName = data.randomSurname();
        
        const client = {
          barbershop_id: barbershop.id,
          name: `${firstName} ${lastName}`,
          phone: data.randomPhone(),
          email: Math.random() > 0.3 ? data.randomEmail(firstName) : null,
          birth_date: Math.random() > 0.5 ? data.randomDate(365 * 30) : null,
        };

        try {
          const { error } = await supabase
            .from('clients')
            .insert(client);
          
          if (error) throw error;
          totalClients++;
        } catch (error) {
          errors4++;
          console.error(`Error creating client for barbershop ${barbershop.id}:`, error);
        }
      }
    }

    const duration4 = Date.now() - startTime4;
    results.push({
      phase: 'clients',
      duration: duration4,
      recordsCreated: totalClients,
      errors: errors4,
      avgResponseTime: duration4 / (config.barbershops * config.clientsPerBarbershop),
    });

    console.log(`Phase 4 completed: ${totalClients} clients created in ${duration4}ms`);

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

    console.log('Load test completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Load test error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});