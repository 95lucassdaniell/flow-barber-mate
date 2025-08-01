-- Generate historical sales for BarberiaVargas based on completed appointments
-- Create realistic sales data with proper payment methods and commission tracking

-- Step 1: Generate Sales
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
        COALESCE(p.commission_rate, 15) as commission_rate,
        p.id as barber_profile_id
    FROM appointments a
    JOIN profiles p ON a.barber_id = p.id
    WHERE a.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    AND a.status = 'completed'
    AND a.appointment_date >= '2024-01-01'
    ORDER BY a.appointment_date, a.start_time
    LIMIT 2000
),
sales_data AS (
    SELECT 
        gen_random_uuid() as sale_id,
        barbershop_id,
        client_id,
        barber_id,
        appointment_date as sale_date,
        start_time as sale_time,
        total_price as total_amount,
        0 as discount_amount,
        total_price as final_amount,
        -- Realistic payment method distribution
        CASE 
            WHEN random() < 0.35 THEN 'cash'
            WHEN random() < 0.65 THEN 'card'
            WHEN random() < 0.85 THEN 'pix'
            ELSE 'multiple'
        END as payment_method,
        'completed' as payment_status,
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
    sale_id,
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
    NULL as notes,
    created_by,
    created_at,
    updated_at
FROM sales_data;

-- Step 2: Generate Sale Items
WITH recent_sales AS (
    SELECT 
        s.id as sale_id,
        s.final_amount,
        s.barber_id,
        COALESCE(p.commission_rate, 15) as commission_rate
    FROM sales s
    JOIN profiles p ON s.barber_id = p.id
    WHERE s.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    AND s.created_at >= NOW() - INTERVAL '10 minutes'
),
service_to_use AS (
    SELECT id as service_id
    FROM services 
    WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    AND is_active = true
    LIMIT 1
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
    rs.sale_id,
    stu.service_id,
    'service',
    1,
    rs.final_amount,
    rs.final_amount,
    rs.commission_rate,
    (rs.final_amount * rs.commission_rate / 100)
FROM recent_sales rs
CROSS JOIN service_to_use stu;

-- Step 3: Generate Commissions
WITH commission_data AS (
    SELECT 
        s.id as sale_id,
        s.barber_id,
        s.final_amount,
        s.sale_date,
        COALESCE(p.commission_rate, 15) as commission_rate,
        (s.final_amount * COALESCE(p.commission_rate, 15) / 100) as commission_amount
    FROM sales s
    JOIN profiles p ON s.barber_id = p.id
    WHERE s.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    AND s.created_at >= NOW() - INTERVAL '10 minutes'
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
FROM commission_data;