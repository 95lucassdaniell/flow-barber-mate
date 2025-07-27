-- Fechar todas as comandas abertas com distribuição de pagamento (corrigido v2)
DO $$
DECLARE
    comando RECORD;
    metodo_pagamento text;
    rand_num numeric;
    contador integer := 0;
    sale_id uuid;
    item RECORD;
    sale_item_id uuid;
    admin_user_id uuid;
BEGIN
    -- Buscar um admin para usar como created_by
    SELECT user_id INTO admin_user_id 
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- Se não encontrar admin, usar o primeiro usuário
    IF admin_user_id IS NULL THEN
        SELECT user_id INTO admin_user_id 
        FROM profiles 
        LIMIT 1;
    END IF;
    
    -- Processar TODAS as comandas com status = 'open'
    FOR comando IN 
        SELECT c.id, c.barber_id, c.barbershop_id, c.client_id, c.total_amount
        FROM commands c 
        WHERE c.status = 'open'
        ORDER BY c.created_at ASC -- processar as mais antigas primeiro
    LOOP
        contador := contador + 1;
        
        -- Definir método de pagamento baseado na distribuição
        rand_num := random();
        IF rand_num <= 0.40 THEN
            metodo_pagamento := 'cash';
        ELSIF rand_num <= 0.75 THEN -- 40% + 35% = 75%
            metodo_pagamento := 'card';
        ELSE
            metodo_pagamento := 'pix';
        END IF;
        
        -- Fechar a comanda
        UPDATE commands 
        SET status = 'closed',
            payment_method = metodo_pagamento,
            payment_status = 'paid',
            closed_at = now(),
            updated_at = now()
        WHERE id = comando.id;
        
        -- Criar registro de venda correspondente
        INSERT INTO sales (
            barbershop_id, client_id, barber_id, created_by,
            total_amount, final_amount, discount_amount, 
            payment_method, payment_status, sale_date
        ) VALUES (
            comando.barbershop_id, comando.client_id, comando.barber_id, admin_user_id,
            comando.total_amount, comando.total_amount, 0,
            metodo_pagamento, 'paid', CURRENT_DATE
        ) RETURNING id INTO sale_id;
        
        -- Criar sale_items e commissions baseados nos command_items
        FOR item IN 
            SELECT ci.*
            FROM command_items ci
            WHERE ci.command_id = comando.id
        LOOP
            -- Inserir sale_item
            INSERT INTO sale_items (
                sale_id, service_id, product_id, item_type,
                quantity, unit_price, total_price,
                commission_rate, commission_amount
            ) VALUES (
                sale_id, item.service_id, item.product_id, item.item_type,
                item.quantity, item.unit_price, item.total_price,
                item.commission_rate, item.commission_amount
            ) RETURNING id INTO sale_item_id;
            
            -- Criar comissão se for serviço e tiver valor de comissão
            IF item.service_id IS NOT NULL AND item.commission_amount > 0 THEN
                INSERT INTO commissions (
                    sale_id, sale_item_id, barber_id, barbershop_id,
                    commission_type, base_amount, commission_rate, commission_amount,
                    commission_date, status
                ) VALUES (
                    sale_id, sale_item_id,
                    comando.barber_id, comando.barbershop_id,
                    'service', item.total_price, item.commission_rate, item.commission_amount,
                    CURRENT_DATE, 'pending'
                );
            END IF;
        END LOOP;
        
        -- A cada 50 processados, dar um feedback
        IF contador % 50 = 0 THEN
            RAISE NOTICE 'Fechadas % comandas...', contador;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Total de % comandas fechadas com sucesso!', contador;
    RAISE NOTICE 'Distribuição de pagamento aplicada: 40%% dinheiro, 35%% cartão, 25%% PIX';
END $$;