# 📊 Configuração de Monitoramento - VilaFood

**Data:** 14/12/2024  
**Ambiente:** Produção

---

## 🔔 Alertas Configurados

### 1. Edge Function Errors
Monitorar via Lovable Cloud → Edge Functions → Logs

**Funções Críticas para Monitorar:**
| Função | Criticidade | Ação em Falha |
|--------|-------------|---------------|
| `mercadopago-pix` | 🔴 Alta | Verificar token MP |
| `mercadopago-sale` | 🔴 Alta | Verificar token MP |
| `mercadopago-webhook` | 🔴 Alta | Verificar assinatura |
| `whatsapp-webhook` | 🟡 Média | Verificar Evolution API |
| `whatsapp-auth-session` | 🟡 Média | Verificar instância admin |
| `create-team-member` | 🟢 Baixa | Verificar permissões |

### 2. Database Monitoring
Consultas para verificar saúde do sistema:

```sql
-- Pedidos pendentes há mais de 30 minutos
SELECT COUNT(*) as pedidos_parados
FROM orders 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '30 minutes';

-- Erros de pagamento nas últimas 24h
SELECT COUNT(*) as pagamentos_falhos
FROM mp_transactions 
WHERE status = 'error' 
AND created_at > NOW() - INTERVAL '24 hours';

-- Webhooks não processados
SELECT COUNT(*) as webhooks_pendentes
FROM webhook_logs 
WHERE processed = false 
AND created_at > NOW() - INTERVAL '1 hour';
```

### 3. Métricas de Negócio
```sql
-- Volume de pedidos por hora
SELECT 
  date_trunc('hour', created_at) as hora,
  COUNT(*) as total_pedidos,
  SUM(total) as volume_vendas
FROM orders 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1 ORDER BY 1 DESC;

-- Taxa de conversão (visitantes → pedidos)
-- Requer implementação de analytics
```

---

## 📱 Alertas WhatsApp

O sistema envia alertas automáticos via WhatsApp para:
- ❌ Falhas de pagamento críticas
- ⚠️ Pedidos parados por muito tempo
- 🔴 Erros de sistema detectados

**Instância de Notificações:** Sistema (Doutorgigabyte)

---

## 🔍 Checklist de Monitoramento Diário

### Manhã (09:00)
- [ ] Verificar logs de Edge Functions
- [ ] Verificar pedidos pendentes overnight
- [ ] Checar status das instâncias WhatsApp
- [ ] Revisar alertas de anomalias

### Tarde (15:00)
- [ ] Verificar volume de transações
- [ ] Checar taxa de sucesso de pagamentos
- [ ] Revisar feedback de clientes

### Noite (21:00)
- [ ] Verificar pedidos do dia
- [ ] Checar performance geral
- [ ] Preparar relatório diário

---

## 🚨 Procedimentos de Emergência

### Pagamentos Falhando
1. Verificar status Mercado Pago: https://status.mercadopago.com
2. Verificar token OAuth: `/admin/configuracoes` → Mercado Pago
3. Testar webhook manualmente
4. Contatar suporte MP se necessário

### WhatsApp Offline
1. Verificar instância Evolution: `/admin/whatsapp`
2. Reconectar QR Code se desconectado
3. Verificar logs da Edge Function
4. Reiniciar instância se necessário

### Site Lento/Offline
1. Verificar status Lovable: https://status.lovable.dev
2. Verificar logs de deploy recentes
3. Fazer rollback se necessário
4. Contatar suporte Lovable

---

## 📈 KPIs para Acompanhar

| Métrica | Meta | Alerta |
|---------|------|--------|
| Uptime | 99.5% | < 99% |
| Tempo resposta API | < 500ms | > 1000ms |
| Taxa sucesso pagamento | > 95% | < 90% |
| Pedidos/hora (pico) | - | > 100 (escalar) |
| Erros/hora | < 5 | > 20 |

---

## 🔧 Ferramentas Utilizadas

1. **Lovable Cloud** - Logs e métricas de Edge Functions
2. **Supabase Dashboard** - Logs de banco e Auth
3. **WhatsApp Business** - Alertas via sistema
4. **Browser DevTools** - Debug de frontend

---

## 📞 Contatos de Suporte

| Serviço | Contato |
|---------|---------|
| Lovable | support@lovable.dev |
| Mercado Pago | Portal do desenvolvedor |
| Evolution API | Documentação oficial |
| Supabase | Ticket via dashboard |
