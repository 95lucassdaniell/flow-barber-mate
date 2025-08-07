-- Identificar e corrigir as últimas funções sem search_path
-- Listar todas as funções sem SET search_path = ''
SELECT n.nspname as schema, p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true  -- SECURITY DEFINER functions
AND NOT EXISTS (
    SELECT 1 FROM pg_proc_config pc 
    WHERE pc.oid = p.oid 
    AND pc.configuration[1] LIKE 'search_path=%'
);

-- Corrigir as funções que ainda não têm search_path configurado
DO $$
DECLARE
    rec RECORD;
    func_definition TEXT;
BEGIN
    FOR rec IN 
        SELECT n.nspname as schema, p.proname as function_name, p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND NOT EXISTS (
            SELECT 1 FROM pg_proc_config pc 
            WHERE pc.oid = p.oid 
            AND pc.configuration[1] LIKE 'search_path=%'
        )
    LOOP
        -- Log das funções que precisam ser corrigidas
        RAISE NOTICE 'Function needs search_path fix: %.%', rec.schema, rec.function_name;
    END LOOP;
END $$;