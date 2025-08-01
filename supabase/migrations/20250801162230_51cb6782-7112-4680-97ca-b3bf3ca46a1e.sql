-- Generate historical sales for BarberiaVargas based on completed appointments
-- Create realistic sales data with proper payment methods and commission tracking

WITH completed_appointments AS (
    SELECT 
        a.barbershop_id,
        a.client_id,
        a.barber_id,
        a.appointment_date,
        a.start_time,
        a.total_price,
        a.created_at,
        a.updated_at,
        p.commission_rate,
        p.id as barber_profile_id
    FROM appointments a
    JOIN profiles p ON a.barber_id = p.id
    WHERE a.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    AND a.status = 'completed'
    AND a.appointment_date >= '2024-01-01'
    ORDER BY a.appointment_date, a.start_time
    LIMIT 2000
),
sales_to_create AS (
    SELECT 
        gen_random_uuid() as id,
        barbershop_id,
        client_id,
        barber_id,
        appointment_date as sale_date,
        start_time as sale_time,
        total_price as total_amount,
        0 as discount_amount, -- No discount for historical data
        total_price as final_amount,
        -- Realistic payment method distribution
        CASE 
            WHEN random() < 0.35 THEN 'cash'
            WHEN random() < 0.65 THEN 'card'
            WHEN random() < 0.85 THEN 'pix'
            ELSE 'multiple'
        END as payment_method,
        'completed' as payment_status,
        NULL as notes,
        barber_profile_id as created_by,
        created_at,
        updated_at,
        commission_rate,
        (total_price * commission_rate / 100) as commission_amount
    FROM completed_appointments
)
INSERT INTO sales (
    id,
    barbershop_id,
    client_id,
    barber_id,
    sale_date,
    sale_time,
    total_amount,
    discount_amount,
    final_amount,
    payment_method,
    payment_status,
    notes,
    created_by,
    created_at,
    updated_at
)
SELECT 
    id,
    barbershop_id,
    client_id,
    barber_id,
    sale_date,
    sale_time,
    total_amount,
    discount_amount,
    final_amount,
    payment_method,
    payment_status,
    notes,
    created_by,
    created_at,
    updated_at
FROM sales_to_create;

-- Generate sale_items for the historical sales
WITH services_lookup AS (
    SELECT 
        s.id as service_id,
        s.price,
        s.name
    FROM services s
    WHERE s.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    LIMIT 1 -- Just get one service for historical data
),
new_sales AS (
    SELECT 
        s.id as sale_id,
        s.final_amount,
        s.barber_id,
        p.commission_rate
    FROM sales s
    JOIN profiles p ON s.barber_id = p.id
    WHERE s.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    AND s.created_at >= NOW() - INTERVAL '5 minutes' -- Only recent sales from this migration
)
INSERT INTO sale_items (
    sale_id,
    service_id,
    item_type,
    quantity,
    unit_price,
    total_price,
    commission_rate,
    commission_amount
)
SELECT 
    ns.sale_id,
    sl.service_id,
    'service',
    1,
    ns.final_amount,
    ns.final_amount,
    ns.commission_rate,
    (ns.final_amount * ns.commission_rate / 100)
FROM new_sales ns
CROSS JOIN services_lookup sl;

-- Generate commissions for the historical sales
WITH new_sales_for_commission AS (
    SELECT 
        s.id as sale_id,
        s.barber_id,
        s.final_amount,
        s.sale_date,
        p.commission_rate,
        (s.final_amount * p.commission_rate / 100) as commission_amount
    FROM sales s
    JOIN profiles p ON s.barber_id = p.id
    WHERE s.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    AND s.created_at >= NOW() - INTERVAL '5 minutes' -- Only recent sales from this migration
)
INSERT INTO commissions (
    sale_id,
    barber_id,
    commission_amount,
    commission_date,
    status
)
SELECT 
    sale_id,
    barber_id,
    commission_amount,
    sale_date,
    'paid'
FROM new_sales_for_commission;