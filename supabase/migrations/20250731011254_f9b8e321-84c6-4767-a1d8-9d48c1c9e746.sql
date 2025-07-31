-- Corrigir horários de funcionamento da barbeariavargas
-- Quinta-feira e quarta-feira devem fechar às 18:00, não 23:50

UPDATE barbershops 
SET opening_hours = jsonb_set(
    jsonb_set(
        opening_hours,
        '{wednesday,close}',
        '"18:00"'
    ),
    '{thursday,close}',
    '"18:00"'
)
WHERE slug = 'barbeariavargas';