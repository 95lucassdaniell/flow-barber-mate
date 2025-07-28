-- Atualizar todos os agendamentos de 2024 para 2025, mantendo dia e mês
UPDATE appointments 
SET appointment_date = appointment_date + INTERVAL '1 year'
WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
AND EXTRACT(YEAR FROM appointment_date) = 2024;