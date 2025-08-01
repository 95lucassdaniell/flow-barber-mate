-- Generate historical sales for completed appointments without sales
-- Create sales with realistic payment methods and commission data

WITH completed_appointments_without_sales AS (
    SELECT 
        a.id as appointment_id,
        a.barbershop_id,
        a.client_id,
        a.barber_id,
        a.appointment_date,
        a.total_price,
        a.created_at,
        a.updated_at,
        p.commission_rate
    FROM appointments a
    LEFT JOIN sales s ON a.id = s.appointment_id
    JOIN profiles p ON a.barber_id = p.id
    WHERE a.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    AND a.status = 'completed'
    AND s.id IS NULL
    ORDER BY a.appointment_date
),
sales_to_create AS (
    SELECT 
        gen_random_uuid() as id,
        barbershop_id,
        client_id,
        barber_id,
        appointment_id,
        appointment_date as sale_date,
        total_price as final_amount,
        -- Realistic payment method distribution
        CASE 
            WHEN random() < 0.35 THEN 'cash'
            WHEN random() < 0.65 THEN 'card'
            WHEN random() < 0.85 THEN 'pix'
            ELSE 'multiple'
        END as payment_method,
        'completed' as payment_status,
        commission_rate,
        (total_price * commission_rate / 100) as commission_amount,
        created_at,
        updated_at
    FROM completed_appointments_without_sales
)
INSERT INTO sales (
    id,
    barbershop_id,
    client_id,
    barber_id,
    appointment_id,
    sale_date,
    final_amount,
    payment_method,
    payment_status,
    created_at,
    updated_at
)
SELECT 
    id,
    barbershop_id,
    client_id,
    barber_id,
    appointment_id,
    sale_date,
    final_amount,
    payment_method,
    payment_status,
    created_at,
    updated_at
FROM sales_to_create;

-- Generate sale_items for each sale
WITH new_sales AS (
    SELECT 
        s.id as sale_id,
        a.service_id,
        s.final_amount,
        p.commission_rate
    FROM sales s
    JOIN appointments a ON s.appointment_id = a.id
    JOIN profiles p ON s.barber_id = p.id
    WHERE s.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
    AND NOT EXISTS (
        SELECT 1 FROM sale_items si WHERE si.sale_id = s.id
    )
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
    sale_id,
    service_id,
    'service',
    1,
    final_amount,
    final_amount,
    commission_rate,
    (final_amount * commission_rate / 100)
FROM new_sales;

-- Generate commissions for sales
WITH new_sales_commissions AS (
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
    AND NOT EXISTS (
        SELECT 1 FROM commissions c WHERE c.sale_id = s.id
    )
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
FROM new_sales_commissions;