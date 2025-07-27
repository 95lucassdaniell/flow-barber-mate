-- Povoar comandas zeradas com dados realistas (corrigido)
DO $$
DECLARE
    comando RECORD;
    servico_id uuid;
    produto_id uuid;
    preco_servico numeric;
    taxa_comissao numeric;
    valor_comissao numeric;
    metodo_pagamento text;
    incluir_produto boolean;
    incluir_segundo_produto boolean;
    rand_num numeric;
    barbershop_uuid uuid;
    provider_price_record RECORD;
    product_price numeric;
BEGIN
    -- Processar comandas com total_amount = 0
    FOR comando IN 
        SELECT c.id, c.barber_id, c.barbershop_id, c.client_id
        FROM commands c 
        WHERE c.total_amount = 0 
        AND c.status = 'open'
        LIMIT 500 -- Processar em lotes para evitar timeout
    LOOP
        barbershop_uuid := comando.barbershop_id;
        
        -- Selecionar serviço baseado na popularidade
        rand_num := random();
        
        IF rand_num <= 0.40 THEN
            -- Corte (40%)
            SELECT id INTO servico_id FROM services 
            WHERE name ILIKE '%corte%' AND name NOT ILIKE '%barba%' AND name NOT ILIKE '%lavagem%'
            AND barbershop_id = barbershop_uuid LIMIT 1;
        ELSIF rand_num <= 0.70 THEN
            -- Corte + Barba (30%)
            SELECT id INTO servico_id FROM services 
            WHERE name ILIKE '%corte%' AND name ILIKE '%barba%'
            AND barbershop_id = barbershop_uuid LIMIT 1;
        ELSIF rand_num <= 0.85 THEN
            -- Barba (15%)
            SELECT id INTO servico_id FROM services 
            WHERE name ILIKE '%barba%' AND name NOT ILIKE '%corte%'
            AND barbershop_id = barbershop_uuid LIMIT 1;
        ELSIF rand_num <= 0.93 THEN
            -- Lavagem + Corte (8%)
            SELECT id INTO servico_id FROM services 
            WHERE name ILIKE '%lavagem%'
            AND barbershop_id = barbershop_uuid LIMIT 1;
        ELSIF rand_num <= 0.98 THEN
            -- Sobrancelha (5%)
            SELECT id INTO servico_id FROM services 
            WHERE name ILIKE '%sobrancelha%'
            AND barbershop_id = barbershop_uuid LIMIT 1;
        ELSE
            -- Platinado (2%)
            SELECT id INTO servico_id FROM services 
            WHERE name ILIKE '%platinado%'
            AND barbershop_id = barbershop_uuid LIMIT 1;
        END IF;
        
        -- Se não encontrou o serviço específico, pegar qualquer serviço ativo
        IF servico_id IS NULL THEN
            SELECT id INTO servico_id FROM services 
            WHERE barbershop_id = barbershop_uuid AND is_active = true
            ORDER BY random() LIMIT 1;
        END IF;
        
        -- Obter preço do serviço do provider_services
        SELECT ps.price, p.commission_rate INTO provider_price_record
        FROM provider_services ps
        JOIN profiles p ON p.id = ps.provider_id
        WHERE ps.provider_id = comando.barber_id 
        AND ps.service_id = servico_id 
        AND ps.is_active = true
        LIMIT 1;
        
        preco_servico := COALESCE(provider_price_record.price, 50); -- fallback para R$ 50
        taxa_comissao := COALESCE(provider_price_record.commission_rate, 15); -- fallback para 15%
        valor_comissao := preco_servico * (taxa_comissao / 100);
        
        -- Inserir serviço como command_item
        IF servico_id IS NOT NULL THEN
            INSERT INTO command_items (
                command_id, service_id, item_type, quantity, 
                unit_price, total_price, commission_rate, commission_amount
            ) VALUES (
                comando.id, servico_id, 'service', 1,
                preco_servico, preco_servico, taxa_comissao, valor_comissao
            );
        END IF;
        
        -- Determinar se inclui produtos (30% chance de 1 produto, 6% chance total de 2 produtos)
        rand_num := random();
        incluir_produto := rand_num <= 0.30;
        incluir_segundo_produto := rand_num <= 0.06;
        
        -- Adicionar primeiro produto se necessário
        IF incluir_produto THEN
            SELECT id INTO produto_id FROM products 
            WHERE barbershop_id = barbershop_uuid AND is_active = true
            ORDER BY random() LIMIT 1;
            
            IF produto_id IS NOT NULL THEN
                -- Obter preço do produto
                SELECT selling_price INTO product_price FROM products WHERE id = produto_id;
                
                INSERT INTO command_items (
                    command_id, product_id, item_type, quantity, 
                    unit_price, total_price, commission_rate, commission_amount
                ) VALUES (
                    comando.id, produto_id, 'product', 1,
                    product_price, product_price, 0, 0
                );
                
                preco_servico := preco_servico + product_price;
            END IF;
        END IF;
        
        -- Adicionar segundo produto se necessário
        IF incluir_segundo_produto THEN
            SELECT id INTO produto_id FROM products 
            WHERE barbershop_id = barbershop_uuid AND is_active = true
            AND id != produto_id -- diferente do primeiro produto
            ORDER BY random() LIMIT 1;
            
            IF produto_id IS NOT NULL THEN
                -- Obter preço do segundo produto
                SELECT selling_price INTO product_price FROM products WHERE id = produto_id;
                
                INSERT INTO command_items (
                    command_id, product_id, item_type, quantity, 
                    unit_price, total_price, commission_rate, commission_amount
                ) VALUES (
                    comando.id, produto_id, 'product', 1,
                    product_price, product_price, 0, 0
                );
                
                preco_servico := preco_servico + product_price;
            END IF;
        END IF;
        
        -- Definir método de pagamento aleatório
        rand_num := random();
        IF rand_num <= 0.40 THEN
            metodo_pagamento := 'cash';
        ELSIF rand_num <= 0.75 THEN
            metodo_pagamento := 'card';
        ELSE
            metodo_pagamento := 'pix';
        END IF;
        
        -- Atualizar comando com o valor total e método de pagamento
        UPDATE commands 
        SET total_amount = preco_servico,
            payment_method = metodo_pagamento,
            updated_at = now()
        WHERE id = comando.id;
        
    END LOOP;
    
    RAISE NOTICE 'Comandas povoadas com sucesso!';
END $$;