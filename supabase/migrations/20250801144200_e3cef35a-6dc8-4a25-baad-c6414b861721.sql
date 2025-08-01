-- Generate historical appointments for BarberiaVargas testing  
-- Create appointments with controlled patterns
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
)
WITH provider_service AS (
    SELECT 
        p.id as provider_id,
        s.id as service_id
    FROM profiles p, services s
    WHERE p.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    AND s.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    AND p.role = 'barber'
    LIMIT 1
),
clients_with_index AS (
    SELECT 
        id,
        name,
        created_at,
        ROW_NUMBER() OVER (ORDER BY id) as client_index
    FROM clients 
    WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
),
client_patterns AS (
    SELECT 
        id,
        name,
        created_at,
        client_index,
        CASE 
            WHEN client_index % 5 = 1 THEN 'VIP'        -- 20% VIP
            WHEN client_index % 5 IN (2,3) THEN 'Regular' -- 40% Regular
            WHEN client_index % 5 = 4 THEN 'Occasional'   -- 20% Occasional
            ELSE 'Inactive'                               -- 20% Inactive
        END as pattern
    FROM clients_with_index
),
appointments_to_create AS (
    SELECT 
        cp.id as client_id,
        cp.pattern,
        ps.provider_id,
        ps.service_id,
        -- Generate appointment dates based on pattern
        CASE cp.pattern
            WHEN 'VIP' THEN 
                (cp.created_at::date + (generate_series * 14))::date
            WHEN 'Regular' THEN 
                (cp.created_at::date + (generate_series * 30))::date
            WHEN 'Occasional' THEN 
                (cp.created_at::date + (generate_series * 60))::date
            ELSE 
                (cp.created_at::date + (generate_series * 120))::date
        END as apt_date,
        generate_series
    FROM client_patterns cp
    CROSS JOIN provider_service ps
    CROSS JOIN generate_series(0, 20) -- Up to 20 appointments per client over 2 years
    WHERE (cp.created_at::date + (
        CASE cp.pattern
            WHEN 'VIP' THEN generate_series * 14
            WHEN 'Regular' THEN generate_series * 30
            WHEN 'Occasional' THEN generate_series * 60
            ELSE generate_series * 120
        END
    )) <= '2025-01-31'::date
),
final_appointments AS (
    SELECT 
        '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'::uuid as barbershop_id,
        client_id,
        provider_id,
        service_id,
        apt_date as appointment_date,
        ('09:00'::time + (floor(random() * 9) * interval '1 hour'))::time as start_time,
        ('09:30'::time + (floor(random() * 9) * interval '1 hour'))::time as end_time,
        CASE 
            WHEN apt_date < CURRENT_DATE THEN 
                CASE WHEN random() < 0.9 THEN 'completed' ELSE 'cancelled' END
            ELSE 'scheduled'
        END as status,
        CASE pattern
            WHEN 'VIP' THEN 45.00 + (random() * 15)
            WHEN 'Regular' THEN 30.00 + (random() * 10)
            ELSE 25.00 + (random() * 10)
        END as total_price,
        'admin' as booking_source,
        apt_date::timestamp as created_at,
        apt_date::timestamp as updated_at
    FROM appointments_to_create
    WHERE apt_date >= '2024-01-01'
    -- Apply seasonal randomness
    AND random() < CASE EXTRACT(month FROM apt_date)
        WHEN 1 THEN 0.5  -- January low
        WHEN 2 THEN 0.5  -- February low
        WHEN 6 THEN 0.8  -- June high
        WHEN 7 THEN 0.8  -- July high
        WHEN 11 THEN 0.9 -- November peak
        WHEN 12 THEN 0.9 -- December peak
        ELSE 0.7
    END
    ORDER BY apt_date
    LIMIT 2000
)
SELECT * FROM final_appointments;