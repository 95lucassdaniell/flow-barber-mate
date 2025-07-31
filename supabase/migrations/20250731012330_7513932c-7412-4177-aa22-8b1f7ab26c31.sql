-- Atualizar horários de funcionamento para 09:00-23:59 todos os dias para barbeariavargas
UPDATE public.barbershops 
SET opening_hours = '{
  "monday": {"open": "09:00", "close": "23:59"},
  "tuesday": {"open": "09:00", "close": "23:59"},
  "wednesday": {"open": "09:00", "close": "23:59"},
  "thursday": {"open": "09:00", "close": "23:59"},
  "friday": {"open": "09:00", "close": "23:59"},
  "saturday": {"open": "09:00", "close": "23:59"},
  "sunday": {"open": "09:00", "close": "23:59"}
}'::jsonb
WHERE slug = 'barbeariavargas';