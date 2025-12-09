# Guia de Migração para Produção - Credenciais

## Checklist de Secrets para Produção

### ✅ Mercado Pago (Obrigatório)

1. **MERCADOPAGO_ACCESS_TOKEN**
   - Obter em: https://www.mercadopago.com.br/developers/panel/app → Suas credenciais → Produção
   - Formato: `APP_USR-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
   - ⚠️ Nunca use token de teste em produção

2. **MERCADOPAGO_CLIENT_ID**
   - Obter em: https://www.mercadopago.com.br/developers/panel/app → Configuração OAuth
   - Usado para OAuth de lojistas

3. **MERCADOPAGO_CLIENT_SECRET**
   - Obter junto com CLIENT_ID
   - ⚠️ Mantenha em segredo absoluto

4. **MERCADOPAGO_REDIRECT_URI**
   - Valor produção: `https://vilafood.app/painel/callback/mercadopago`
   - Deve estar registrado no painel MP

### ✅ PagSeguro/PagBank (Se usado)

1. **PAGSEGURO_ENVIRONMENT**
   - Valor produção: `production`
   - ⚠️ CRÍTICO: Sem isso, usa sandbox por padrão

2. **PAGSEGURO_PLATFORM_ACCOUNT_ID**
   - ID da conta principal da plataforma para split
   - Obter em: https://minhaconta.pagseguro.uol.com.br

3. **PAGSEGURO_CLIENT_ID** e **PAGSEGURO_PUBLIC_KEY**
   - Obter no painel PagBank

### ✅ AWS (Se S3/CloudFront usado)

Verificar que são credenciais de produção:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_BUCKET_NAME
- AWS_CLOUDFRONT_URL
- AWS_REGION

### ✅ Evolution API (WhatsApp)

- EVOLUTION_API_URL
- EVOLUTION_API_KEY

### ✅ Google Maps

- GOOGLE_API_KEY (verificar quota e restrições de domínio)

---

## Como Atualizar Secrets

1. Acesse o painel Lovable
2. Vá em Settings → Integrations → Lovable Cloud
3. Clique em "Manage Secrets"
4. Atualize cada secret com valor de produção

---

## Verificação Pós-Migração

### Teste Mercado Pago OAuth
1. Acesse /painel/[slug]/configuracoes
2. Clique "Conectar Mercado Pago"
3. Verifique se redireciona para MP produção (não sandbox)
4. Complete autenticação e verifique token salvo

### Teste PIX
1. Faça pedido de teste (valor baixo R$1)
2. Verifique se QR Code é gerado
3. Confirme recebimento na conta de produção

### Teste Checkout Pro
1. Faça pedido com cartão
2. Verifique se redireciona para checkout MP produção
3. Confirme aprovação e webhook

---

## Rollback de Emergência

Se problemas em produção:
1. Reverta MERCADOPAGO_ACCESS_TOKEN para token de teste
2. Defina PAGSEGURO_ENVIRONMENT=sandbox
3. Notifique equipe

---

## Limpeza de Dados de Teste

Após migração, limpar dados de sandbox do banco:

```sql
-- Remover mp_user_id de teste dos establishments
UPDATE establishments 
SET mp_user_id = NULL, pix_key = NULL 
WHERE mp_user_id LIKE '304%'; -- IDs de teste começam com 304

-- Opcional: Marcar transações de teste
UPDATE mp_transactions 
SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{is_test}', 'true')
WHERE created_at < '2025-01-01'; -- Data antes da migração
```

---

## Contatos de Suporte

- Mercado Pago: https://www.mercadopago.com.br/developers/pt/support
- PagBank: https://dev.pagbank.uol.com.br/docs/suporte
