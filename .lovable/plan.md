

# Plano: Recriar Schema do Banco de Dados no Lovable Cloud

O projeto tem um banco de dados Cloud vazio e o `types.ts` gerado não contém tabelas, causando todos os erros de build (`'clients' is not assignable to parameter of type 'never'`).

## Tabelas identificadas no código

Baseado na análise de todos os hooks e componentes, estas são as tabelas necessárias:

### Core
1. **barbershops** - id, name, slug (unique), address, phone, email, logo_url, opening_hours (jsonb), created_by, created_at, updated_at
2. **profiles** - id, user_id, barbershop_id (FK), role (admin/receptionist/barber), full_name, email, phone, commission_rate, is_active, status, created_at, updated_at
3. **clients** - id, name, phone, email, birth_date, notes, barbershop_id (FK), created_at, updated_at
4. **services** - id, name, description, duration_minutes, is_active, barbershop_id (FK), created_at, updated_at
5. **appointments** - id, barbershop_id, client_id, barber_id, service_id, appointment_date, start_time, end_time, total_price, status, notes, created_at, updated_at

### Financeiro
6. **sales** - id, barbershop_id, client_id, barber_id, sale_date, sale_time, total_amount, discount_amount, final_amount, payment_method, payment_status, cash_register_id, notes, created_by, created_at, updated_at
7. **sale_items** - id, sale_id, item_type, service_id, product_id, quantity, unit_price, total_price, commission_rate, commission_amount, created_at, updated_at
8. **products** - id, barbershop_id, name, description, category, barcode, cost_price, selling_price, stock_quantity, min_stock_alert, supplier, image_url, is_active, commission_rate, commission_type, created_at, updated_at
9. **expenses** - id, barbershop_id, category, description, amount, due_date, payment_date, payment_status, created_by, created_at, updated_at
10. **cash_registers** - id, user_id, barbershop_id, opened_at, closed_at, opening_balance, closing_balance, total_sales, total_cash, total_card, total_pix, total_multiple, sales_count, status, notes, created_at, updated_at
11. **cash_movements** - id, cash_register_id, type, description, amount, notes, created_by, created_at
12. **cash_register_closures** - id, cash_register_id, barbershop_id, closed_by, total_sales, total_cash, total_card, total_pix, closing_balance, notes, created_at

### Comandas
13. **commands** - id, command_number, appointment_id, client_id, barber_id, barbershop_id, status, total_amount, payment_method, payment_status, notes, created_at, closed_at
14. **command_items** - id, command_id, item_type, service_id, product_id, quantity, unit_price, total_price, commission_rate, commission_amount

### Cupons
15. **coupons** - id, barbershop_id, code, name, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, usage_count, applies_to, valid_from, valid_until, is_active, created_at, updated_at
16. **coupon_applicable_items** - id, coupon_id, item_type, item_id

### Assinaturas
17. **provider_subscription_plans** - id, provider_id, barbershop_id, name, description, monthly_price, included_services_count, enabled_service_ids (text[]), commission_percentage, is_active, created_at, updated_at
18. **client_subscriptions** - id, client_id, provider_id, barbershop_id, plan_id, start_date, end_date, status, remaining_services, last_reset_date, created_at, updated_at

### Provider
19. **provider_services** - id, provider_id, service_id, price, is_active, created_at, updated_at
20. **provider_goals** - id, provider_id, barbershop_id, goal_type, target_value, current_value, period_start, period_end, specific_service_id, specific_product_id, is_active, created_by, created_at, updated_at

### Schedule
21. **schedule_blocks** - id, barbershop_id, provider_id, title, description, block_date, start_time, end_time, is_full_day, recurrence_type, days_of_week (int[]), start_date, end_date, status, created_by, created_at, updated_at

### WhatsApp
22. **whatsapp_instances** - id, barbershop_id, instance_name, instance_id, api_key, phone_number, status, business_name, auto_reply, auto_reply_message, last_connected_at, created_at, updated_at
23. **whatsapp_messages** - id, phone_number, contact_name, content (jsonb), message_type, direction, status, message_id, instance_id, appointment_id, client_id, barbershop_id, created_at
24. **whatsapp_templates** - id, barbershop_id, name, content, created_at, updated_at
25. **whatsapp_automations** - id, barbershop_id, template_id, trigger_type, trigger_conditions (jsonb), is_active, created_at, updated_at

### Automações
26. **automation_rules** - id, barbershop_id, type, name, description, trigger_conditions (jsonb), actions (jsonb), message_template, is_active, created_at, updated_at
27. **automation_executions** - id, rule_id, client_id, execution_date, status, message_content, error_message, created_at

### Avaliações
28. **public_client_reviews** - id, barbershop_id, barber_id, client_name, client_phone, nps_score, star_rating, review_text, created_at, updated_at

### Super Admin
29. **super_admins** - id, user_id, full_name, email, created_at
30. **audit_logs** - id, super_admin_id, action, details (jsonb), target_type, target_id, created_at

### Funções RPC
- `generate_command_number` - gera número sequencial de comanda
- `set_provider_password` - define senha do provider
- Funções de monitoramento (get_connection_stats, etc.) - menos críticas

### Realtime
- Habilitar realtime para `appointments`

## Abordagem

Dado o tamanho do schema (~30 tabelas), vou dividir em **3 migrações** para evitar timeout:

1. **Migração 1**: Tabelas core (barbershops, profiles, clients, services, appointments, products)
2. **Migração 2**: Tabelas financeiras e comandas (sales, sale_items, expenses, cash_registers, cash_movements, commands, command_items, coupons, etc.)
3. **Migração 3**: Tabelas de subscriptions, WhatsApp, automações, reviews, super admin, schedule blocks, provider services/goals + funções RPC + realtime

Cada migração incluirá RLS policies básicas (authenticated users podem acessar dados da própria barbershop).

Após as migrações, o `types.ts` será regenerado automaticamente e os erros de build serão resolvidos.

## Nota sobre dados

As migrações criam apenas a **estrutura** (schema). Para migrar os **dados** do projeto antigo, você precisará:
1. Exportar os dados do Supabase antigo (CSV ou SQL dump)
2. Me enviar ou inserir manualmente via Cloud

