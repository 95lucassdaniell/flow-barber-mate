-- Generate historical appointments for BarberiaVargas testing
-- Insert appointments from January 2024 to January 2025
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
date_series AS (
    SELECT generate_series(
        '2024-01-01'::date,
        '2025-01-31'::date,
        '1 day'::interval
    )::date as appointment_date
),
client_patterns AS (
    SELECT 
        id,
        name,
        created_at,
        CASE 
            WHEN (id::text::bigint % 5) = 0 THEN 'VIP'        -- 20% VIP
            WHEN (id::text::bigint % 5) IN (1,2) THEN 'Regular' -- 40% Regular
            WHEN (id::text::bigint % 5) = 3 THEN 'Occasional'   -- 20% Occasional
            ELSE 'Inactive'                                     -- 20% Inactive
        END as pattern
    FROM clients 
    WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
),
appointment_schedule AS (
    SELECT 
        cp.id as client_id,
        cp.pattern,
        ds.appointment_date,
        ps.provider_id,
        ps.service_id,
        -- Calculate if this client should have an appointment on this date
        CASE cp.pattern
            WHEN 'VIP' THEN 
                CASE WHEN (ds.appointment_date - cp.created_at::date) % 14 = 0 THEN true ELSE false END
            WHEN 'Regular' THEN 
                CASE WHEN (ds.appointment_date - cp.created_at::date) % 30 = 0 THEN true ELSE false END
            WHEN 'Occasional' THEN 
                CASE WHEN (ds.appointment_date - cp.created_at::date) % 60 = 0 THEN true ELSE false END
            ELSE 
                CASE WHEN (ds.appointment_date - cp.created_at::date) % 120 = 0 THEN true ELSE false END
        END as should_book,
        -- Apply seasonal factor
        CASE EXTRACT(month FROM ds.appointment_date)
            WHEN 1 THEN 0.7  -- January low
            WHEN 2 THEN 0.7  -- February low
            WHEN 6 THEN 1.2  -- June high
            WHEN 7 THEN 1.2  -- July high
            WHEN 11 THEN 1.5 -- November peak
            WHEN 12 THEN 1.5 -- December peak
            ELSE 1.0
        END as seasonal_factor
    FROM client_patterns cp
    CROSS JOIN date_series ds
    CROSS JOIN provider_service ps
    WHERE ds.appointment_date >= cp.created_at::date
    AND ds.appointment_date <= '2025-01-31'
)
SELECT 
    '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'::uuid,
    client_id,
    provider_id,
    service_id,
    appointment_date,
    ('09:00'::time + (floor(random() * 9) * interval '1 hour'))::time,
    ('09:30'::time + (floor(random() * 9) * interval '1 hour'))::time,
    CASE 
        WHEN appointment_date < CURRENT_DATE THEN 
            CASE WHEN random() < 0.9 THEN 'completed' ELSE 'cancelled' END
        ELSE 'scheduled'
    END,
    CASE pattern
        WHEN 'VIP' THEN 45.00 + (random() * 15)
        WHEN 'Regular' THEN 30.00 + (random() * 10)
        ELSE 25.00 + (random() * 10)
    END,
    'admin',
    appointment_date::timestamp,
    appointment_date::timestamp
FROM appointment_schedule
WHERE should_book = true
AND random() < (seasonal_factor * 0.7)  -- 70% chance adjusted by seasonal factor
AND appointment_date < '2025-01-31'
LIMIT 3000;