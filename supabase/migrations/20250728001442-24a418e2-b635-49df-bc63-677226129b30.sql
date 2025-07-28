-- Distribuir as vendas de 27/07/2025 ao longo dos últimos 90 dias
-- Isso fará com que os filtros de 7, 30 e 90 dias funcionem corretamente

-- Primeiro, vamos verificar quantas vendas temos para distribuir
DO $$
DECLARE
    sales_to_distribute RECORD;
    days_back INTEGER;
    random_days_back INTEGER;
    new_sale_date DATE;
    counter INTEGER := 0;
BEGIN
    -- Distribuir as vendas ao longo dos últimos 90 dias
    FOR sales_to_distribute IN 
        SELECT id, sale_date 
        FROM sales 
        WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' 
        AND sale_date = '2025-07-27'
        ORDER BY id
    LOOP
        -- Calcular um número aleatório de dias atrás (entre 0 e 89)
        random_days_back := floor(random() * 90)::INTEGER;
        new_sale_date := '2025-07-27'::DATE - (random_days_back || ' days')::INTERVAL;
        
        -- Atualizar a data da venda
        UPDATE sales 
        SET sale_date = new_sale_date 
        WHERE id = sales_to_distribute.id;
        
        counter := counter + 1;
        
        -- Log a cada 100 registros processados
        IF counter % 100 = 0 THEN
            RAISE NOTICE 'Processados % registros', counter;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total de vendas redistribuídas: %', counter;
END $$;