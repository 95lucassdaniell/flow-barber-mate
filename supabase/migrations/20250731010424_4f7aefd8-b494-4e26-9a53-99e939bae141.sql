-- Corrigir os horários incorretos da barbearia Vargas
UPDATE barbershops 
SET opening_hours = jsonb_set(
  jsonb_set(
    opening_hours,
    '{thursday,close}',
    '"18:00"'
  ),
  '{wednesday,close}',
  '"18:00"'
)
WHERE slug = 'barbeariavargas';