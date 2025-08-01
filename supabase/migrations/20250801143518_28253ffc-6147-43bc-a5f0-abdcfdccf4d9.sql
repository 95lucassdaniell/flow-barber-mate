-- Generate controlled historical data for BarberiaVargas AI testing
-- This will create data from January 2024 to January 2025

DO $$
DECLARE
    barbershop_uuid uuid := '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a';
    provider_id uuid;
    service_id uuid;
    client_record RECORD;
    appointment_date date;
    client_pattern text;
    visit_frequency_days integer;
    total_clients_created integer := 0;
    total_appointments_created integer := 0;
    current_month integer;
    seasonal_factor numeric;
    appointments_this_month integer;
    i integer;
BEGIN
    -- Get a provider and service for the barbershop
    SELECT id INTO provider_id FROM profiles 
    WHERE barbershop_id = barbershop_uuid AND role = 'barber' 
    LIMIT 1;
    
    SELECT id INTO service_id FROM services 
    WHERE barbershop_id = barbershop_uuid 
    LIMIT 1;
    
    -- Create 200 new clients with different registration dates
    FOR i IN 1..200 LOOP
        INSERT INTO clients (
            barbershop_id,
            name,
            phone,
            email,
            birth_date,
            created_at,
            updated_at
        ) VALUES (
            barbershop_uuid,
            'Cliente Teste ' || (202 + i),
            '(' || LPAD((11 + (i % 89))::text, 2, '0') || ') ' || 
            LPAD((90000 + (i * 7) % 10000)::text, 5, '0') || '-' || 
            LPAD((1000 + (i * 11) % 9000)::text, 4, '0'),
            'cliente' || (202 + i) || '@teste.com',
            '1980-01-01'::date + (i * 100) % 15000,
            '2024-01-01'::timestamp + (i * 3600) * interval '1 second',
            '2024-01-01'::timestamp + (i * 3600) * interval '1 second'
        );
        total_clients_created := total_clients_created + 1;
    END LOOP;

    -- Generate appointments from January 2024 to January 2025
    FOR client_record IN 
        SELECT id, name, created_at,
               CASE 
                   WHEN random() < 0.2 THEN 'VIP'        -- 20% VIP clients
                   WHEN random() < 0.5 THEN 'Regular'    -- 30% Regular clients  
                   WHEN random() < 0.8 THEN 'Occasional' -- 30% Occasional clients
                   ELSE 'Inactive'                       -- 20% Inactive clients
               END as pattern
        FROM clients 
        WHERE barbershop_id = barbershop_uuid
    LOOP
        -- Set visit frequency based on client pattern
        visit_frequency_days := CASE client_record.pattern
            WHEN 'VIP' THEN 14        -- Every 2 weeks
            WHEN 'Regular' THEN 30    -- Every month
            WHEN 'Occasional' THEN 60 -- Every 2 months
            ELSE 120                  -- Every 4 months
        END;
        
        -- Generate appointments for this client
        appointment_date := client_record.created_at::date;
        
        WHILE appointment_date <= '2025-01-31'::date LOOP
            current_month := EXTRACT(month FROM appointment_date);
            
            -- Apply seasonal factors
            seasonal_factor := CASE current_month
                WHEN 1, 2 THEN 0.7      -- Low season (January, February)
                WHEN 11, 12 THEN 1.5    -- High season (November, December)
                WHEN 6, 7 THEN 1.2      -- Summer peak
                ELSE 1.0                -- Normal months
            END;
            
            -- Create appointment based on seasonal factor
            IF random() < (seasonal_factor * 0.8) THEN
                INSERT INTO appointments (
                    barbershop_id,
                    client_id,
                    barber_id,
                    service_id,
                    appointment_date,
                    start_time,
                    end_time,
                    status,
                    total_price,
                    booking_source,
                    created_at,
                    updated_at
                ) VALUES (
                    barbershop_uuid,
                    client_record.id,
                    provider_id,
                    service_id,
                    appointment_date,
                    ('09:00'::time + (floor(random() * 9) * interval '1 hour')),
                    ('09:30'::time + (floor(random() * 9) * interval '1 hour')),
                    CASE 
                        WHEN appointment_date < CURRENT_DATE THEN 
                            CASE WHEN random() < 0.9 THEN 'completed' ELSE 'cancelled' END
                        ELSE 'scheduled'
                    END,
                    CASE client_record.pattern
                        WHEN 'VIP' THEN 45.00 + (random() * 15)
                        WHEN 'Regular' THEN 30.00 + (random() * 10)
                        ELSE 25.00 + (random() * 10)
                    END,
                    'admin',
                    appointment_date::timestamp,
                    appointment_date::timestamp
                );
                
                total_appointments_created := total_appointments_created + 1;
            END IF;
            
            -- Add some randomness to visit frequency
            appointment_date := appointment_date + 
                (visit_frequency_days + floor(random() * 7 - 3))::integer;
        END LOOP;
    END LOOP;

    -- Generate sales for completed appointments
    INSERT INTO sales (
        barbershop_id,
        appointment_id,
        client_id,
        barber_id,
        sale_date,
        items,
        subtotal,
        discount,
        final_amount,
        payment_method,
        payment_status,
        created_at,
        updated_at
    )
    SELECT 
        a.barbershop_id,
        a.id,
        a.client_id,
        a.barber_id,
        a.appointment_date,
        jsonb_build_array(
            jsonb_build_object(
                'type', 'service',
                'name', 'Corte de Cabelo',
                'price', a.total_price,
                'quantity', 1
            )
        ),
        a.total_price,
        0,
        a.total_price,
        CASE 
            WHEN random() < 0.4 THEN 'cash'
            WHEN random() < 0.7 THEN 'card'
            ELSE 'pix'
        END,
        'paid',
        a.appointment_date::timestamp,
        a.appointment_date::timestamp
    FROM appointments a
    WHERE a.barbershop_id = barbershop_uuid 
    AND a.status = 'completed'
    AND a.appointment_date >= '2024-01-01'
    AND NOT EXISTS (
        SELECT 1 FROM sales s WHERE s.appointment_id = a.id
    );

    RAISE NOTICE 'Historical data generation completed:';
    RAISE NOTICE 'Clients created: %', total_clients_created;
    RAISE NOTICE 'Appointments created: %', total_appointments_created;
    RAISE NOTICE 'Sales will be generated for completed appointments';
    
END $$;