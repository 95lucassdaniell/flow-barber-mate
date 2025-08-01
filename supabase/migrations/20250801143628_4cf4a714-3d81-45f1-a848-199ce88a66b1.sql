-- Generate controlled historical data for BarberiaVargas AI testing
-- Create 200 new clients
INSERT INTO clients (
    barbershop_id,
    name,
    phone,
    email,
    birth_date,
    created_at,
    updated_at
)
SELECT 
    '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'::uuid,
    'Cliente Teste ' || generate_series,
    '(' || LPAD((11 + generate_series % 89)::text, 2, '0') || ') ' || 
    LPAD((90000 + generate_series * 7 % 10000)::text, 5, '0') || '-' || 
    LPAD((1000 + generate_series * 11 % 9000)::text, 4, '0'),
    'cliente' || generate_series || '@teste.com',
    '1980-01-01'::date + (generate_series * 100) % 15000,
    '2024-01-01'::timestamp + (generate_series * 3600) * interval '1 second',
    '2024-01-01'::timestamp + (generate_series * 3600) * interval '1 second'
FROM generate_series(203, 402) as generate_series;