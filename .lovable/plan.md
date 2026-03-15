

# Plano: Corrigir cadastro e acesso

## Problema
O cadastro exige confirmação de email, mas os emails de confirmação não estão sendo entregues no novo Cloud. Isso impede o acesso após o cadastro.

## Solução
1. **Habilitar auto-confirm de email** — para que o usuário tenha acesso imediato após o cadastro, sem precisar confirmar email
2. **Ajustar o fluxo de registro** — remover o step 3 de confirmação de email, já que não será mais necessário. Após criar usuário + barbershop + profile, redirecionar direto para o dashboard.

## Mudanças
- Usar `cloud--configure_auth` para habilitar `autoConfirmEmail: true`
- O `RegisterForm.tsx` já tem a lógica correta para quando `authData.session` existe (pula o step 3 e cria barbershop + profile direto)

Isso é uma mudança simples e resolve o problema imediatamente.

