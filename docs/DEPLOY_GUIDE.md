# 🚀 Guia de Deploy - VilaFood v1.0.0

**Data:** 14/12/2024  
**Ambiente:** Produção  
**Domínio:** vilafood.delivery

---

## 📋 Pré-requisitos

### 1. Verificações Obrigatórias
- [ ] Todos os testes de fase Beta aprovados
- [ ] Scan de segurança sem erros críticos pendentes
- [ ] RLS validado em todas as tabelas
- [ ] Credenciais de produção configuradas

### 2. Credenciais Necessárias
| Serviço | Secret Name | Status |
|---------|-------------|--------|
| Mercado Pago | `MERCADOPAGO_ACCESS_TOKEN` | Configurado |
| Mercado Pago | `MERCADOPAGO_CLIENT_ID` | Configurado |
| Mercado Pago | `MERCADOPAGO_CLIENT_SECRET` | Configurado |
| Evolution API | `EVOLUTION_API_KEY` | Configurado |
| Evolution API | `EVOLUTION_API_URL` | Configurado |
| Google Maps | `GOOGLE_API_KEY` | Configurado |
| AWS S3 | `AWS_ACCESS_KEY_ID` | Configurado |
| AWS S3 | `AWS_SECRET_ACCESS_KEY` | Configurado |
| AWS S3 | `AWS_BUCKET_NAME` | Configurado |
| AWS CloudFront | `AWS_CLOUDFRONT_URL` | Configurado |
| PagSeguro | `PAGSEGURO_CLIENT_ID` | Configurado |
| PagSeguro | `PAGSEGURO_PUBLIC_KEY` | Configurado |

---

## 🔧 Procedimento de Deploy

### Etapa 1: Verificação Pré-Deploy

```bash
# 1. Verificar status do projeto
# Acessar: https://lovable.dev/projects/[PROJECT_ID]/settings

# 2. Verificar Edge Functions
# Listar todas as functions ativas e verificar logs recentes

# 3. Verificar banco de dados
# Executar linter de segurança via Lovable Cloud
```

### Etapa 2: Configuração de Domínio

1. **Acesse Project Settings > Domains**
2. **Adicione o domínio:** `vilafood.delivery`
3. **Configure DNS no registrador:**
   - Tipo: `CNAME`
   - Nome: `@` ou `vilafood.delivery`
   - Valor: Fornecido pelo Lovable

4. **Aguarde propagação DNS** (até 48h)

### Etapa 3: Publicação

1. **Clique em "Publish"** no canto superior direito
2. **Selecione "Update"** para atualizar o frontend
3. **Verifique o deploy** acessando `https://vilafood.delivery`

---

## 🔐 Configurações de Segurança

### RLS (Row Level Security)
Todas as tabelas críticas possuem RLS habilitado:
- ✅ `orders` - Acesso por customer_id ou establishment
- ✅ `customers` - Acesso por establishment
- ✅ `products` - Leitura pública, escrita por owner
- ✅ `establishments` - Leitura pública (dados não-sensíveis)
- ✅ `delivery_drivers` - Acesso por establishment

### Edge Functions com JWT
| Function | Autenticação |
|----------|--------------|
| `mercadopago-pix` | Pública (valida order_id) |
| `mercadopago-sale` | Pública (valida order_id) |
| `ai-recommendations` | JWT obrigatório |
| `analyze-establishment` | JWT obrigatório |
| `whatsapp-auth-session` | Pública (token validation) |
| `whatsapp-webhook` | Assinatura HMAC |

---

## 📊 Monitoramento Pós-Deploy

### 1. Verificações Imediatas (0-15 min)
- [ ] Site acessível em `https://vilafood.delivery`
- [ ] Login funcionando
- [ ] Marketplace carregando estabelecimentos
- [ ] Página de loja funcionando

### 2. Verificações de Fluxo (15-60 min)
- [ ] Fluxo de compra completo (PIX)
- [ ] Fluxo de compra (Cartão)
- [ ] Painel do lojista acessível
- [ ] Dashboard admin funcionando

### 3. Verificações Contínuas
- [ ] Monitorar logs de Edge Functions
- [ ] Verificar webhooks de pagamento
- [ ] Acompanhar erros no console

---

## 🚨 Rollback de Emergência

### Se houver problemas críticos:

1. **Acesse o histórico de versões** no Lovable
2. **Restaure a versão anterior** estável
3. **Documente o problema** para análise

### Contatos de Emergência
- **QA Lead:** [Definir contato]
- **Suporte Técnico:** suporte@vilafood.delivery

---

## 📝 Checklist Final

```
PRÉ-DEPLOY
[ ] Backup do banco realizado
[ ] Credenciais de produção verificadas
[ ] DNS configurado corretamente
[ ] SSL/HTTPS funcionando

DEPLOY
[ ] Frontend publicado
[ ] Edge Functions deployadas
[ ] Domínio customizado ativo

PÓS-DEPLOY
[ ] Teste de smoke realizado
[ ] Fluxos críticos validados
[ ] Monitoramento ativo
[ ] Equipe notificada
```

---

## 📚 Referências

- [Documentação Lovable](https://docs.lovable.dev/)
- [Mercado Pago API](https://www.mercadopago.com.br/developers/pt/docs)
- [Evolution API](https://doc.evolution-api.com/)
- [Supabase Docs](https://supabase.com/docs)
