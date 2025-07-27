-- Exclusão de registros em ordem respeitando dependências
-- IMPORTANTE: Esta operação exclui APENAS os dados, mantendo estruturas, RLS, triggers, etc.

-- 1. Excluir comissões (dependem de sales)
DELETE FROM public.commissions;

-- 2. Excluir itens de comandas (dependem de commands)
DELETE FROM public.command_items;

-- 3. Excluir itens de vendas (dependem de sales)
DELETE FROM public.sale_items;

-- 4. Excluir vendas (após excluir dependências)
DELETE FROM public.sales;

-- 5. Excluir comandas (após excluir command_items)
DELETE FROM public.commands;

-- 6. Excluir agendamentos
DELETE FROM public.appointments;

-- 7. Excluir movimentações de caixa
DELETE FROM public.cash_movements;

-- 8. Excluir dados das tabelas particionadas
-- Appointments particionados
DELETE FROM public.appointments_partitioned_2025_01;
DELETE FROM public.appointments_partitioned_2025_02;
DELETE FROM public.appointments_partitioned_2025_03;
DELETE FROM public.appointments_partitioned_2025_04;
DELETE FROM public.appointments_partitioned_2025_05;
DELETE FROM public.appointments_partitioned_2025_06;
DELETE FROM public.appointments_partitioned_2025_07;
DELETE FROM public.appointments_partitioned_2025_08;
DELETE FROM public.appointments_partitioned_2025_09;
DELETE FROM public.appointments_partitioned_2025_10;

-- Commands particionados
DELETE FROM public.commands_partitioned_2025_01;
DELETE FROM public.commands_partitioned_2025_02;
DELETE FROM public.commands_partitioned_2025_03;
DELETE FROM public.commands_partitioned_2025_04;
DELETE FROM public.commands_partitioned_2025_05;
DELETE FROM public.commands_partitioned_2025_06;
DELETE FROM public.commands_partitioned_2025_07;
DELETE FROM public.commands_partitioned_2025_08;
DELETE FROM public.commands_partitioned_2025_09;
DELETE FROM public.commands_partitioned_2025_10;

-- 9. Reset sequences para começar do zero
SELECT setval('public.command_number_seq', 1, false);

-- 10. Verificação final - contar registros restantes
SELECT 
  'appointments' as tabela, COUNT(*) as registros FROM public.appointments
UNION ALL
SELECT 
  'commands' as tabela, COUNT(*) as registros FROM public.commands
UNION ALL
SELECT 
  'sales' as tabela, COUNT(*) as registros FROM public.sales
UNION ALL
SELECT 
  'commissions' as tabela, COUNT(*) as registros FROM public.commissions
UNION ALL
SELECT 
  'command_items' as tabela, COUNT(*) as registros FROM public.command_items
UNION ALL
SELECT 
  'sale_items' as tabela, COUNT(*) as registros FROM public.sale_items
UNION ALL
SELECT 
  'cash_movements' as tabela, COUNT(*) as registros FROM public.cash_movements;