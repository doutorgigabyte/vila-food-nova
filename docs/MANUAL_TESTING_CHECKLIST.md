# VilaFood - Checklist de Testes e Ações Manuais v1.0

**Data:** Dezembro 2024  
**Ambiente:** https://preview--vilafood-delivery.lovable.app  
**Produção:** https://vilafood.delivery

---

## 📋 Resumo Executivo

Este documento consolida todos os testes manuais e ações de infraestrutura necessários para o lançamento em produção do VilaFood.

### Categorias de Verificação
| Categoria | Itens | Prioridade |
|-----------|-------|------------|
| Deploy | 3 | P1 - Crítico |
| Infraestrutura | 1 | P1 - Crítico |
| Segurança | 3 | P1 - Crítico |
| Testes E2E Cliente | 5 | P2 - Alto |
| Testes E2E Lojista | 5 | P2 - Alto |
| Monitoramento | 1 | P3 - Médio |
| Suporte | 1 | P3 - Médio |

---

## 🚀 FASE 1: DEPLOY E INFRAESTRUTURA

### 1.1 Configuração DNS e SSL
**Responsável:** Administrador de Sistema  
**Prazo:** Antes do lançamento

- [ ] Configurar registro DNS A/CNAME para vilafood.delivery
- [ ] Configurar wildcard DNS para subdomínios (*.vilafood.delivery)
- [ ] Verificar certificado SSL válido e renovação automática
- [ ] Testar redirecionamento HTTP → HTTPS
- [ ] Verificar propagação DNS (usar dnschecker.org)

### 1.2 Deploy em Produção
**Responsável:** DevOps / Administrador  
**Prazo:** D-Day

- [ ] Verificar todas as variáveis de ambiente em produção
- [ ] Confirmar URLs de webhook atualizadas para produção:
  - Mercado Pago: `https://vilafood.delivery/api/mercadopago-webhook`
  - PagSeguro: `https://vilafood.delivery/api/pagseguro-webhook`
  - Evolution API: `https://vilafood.delivery/api/whatsapp-webhook`
- [ ] Atualizar N8N endpoints para produção
- [ ] Publicar frontend via botão "Update" no Lovable
- [ ] Verificar Edge Functions deployadas automaticamente
- [ ] Testar acesso à homepage em produção

### 1.3 Migração de Dados
**Responsável:** Administrador de Banco  
**Prazo:** Antes do lançamento

- [ ] Exportar dados de estabelecimentos de teste
- [ ] Limpar dados de teste do ambiente de produção
- [ ] Importar dados reais de estabelecimentos parceiros
- [ ] Verificar integridade de imagens no S3/CloudFront
- [ ] Confirmar produtos migrados corretamente
- [ ] Validar categorias e preços

### 1.4 Backup Automático
**Responsável:** DevOps  
**Prazo:** Antes do lançamento

- [ ] Configurar backup diário automático do banco de dados
- [ ] Definir política de retenção (mínimo 30 dias)
- [ ] Testar processo de restore em ambiente isolado
- [ ] Documentar procedimento de recuperação de desastres
- [ ] Configurar alertas de falha de backup

---

## 🔐 FASE 2: TESTES DE SEGURANÇA

### 2.1 Teste de Acesso Não Autorizado (Cliente)
**Responsável:** QA / Testador 1  
**Prioridade:** CRÍTICA

| Teste | Esperado | Status |
|-------|----------|--------|
| Acessar `/painel/:slug` sem login | Redirecionar para `/auth` | [ ] |
| Acessar `/admin` sem login | Redirecionar para `/auth` | [ ] |
| Acessar `/admin` como cliente comum | Redirecionar para `/marketplace` | [ ] |
| Acessar pedidos de outro usuário via URL | Erro 403 ou dados não exibidos | [ ] |
| Manipular localStorage para simular outro user | Sessão invalidada | [ ] |
| Acessar API de pedidos sem token | Erro 401 | [ ] |

### 2.2 Teste de Acesso Não Autorizado (Lojista)
**Responsável:** QA / Testador 2  
**Prioridade:** CRÍTICA

| Teste | Esperado | Status |
|-------|----------|--------|
| Acessar painel de outro estabelecimento | Acesso negado | [ ] |
| Editar produto de outro estabelecimento via API | Erro 403 | [ ] |
| Ver pedidos de outro estabelecimento | Dados não retornados | [ ] |
| Acessar configurações financeiras de outro lojista | Acesso bloqueado | [ ] |
| Tentar alterar status de pedido de outro estabelecimento | Operação rejeitada | [ ] |

### 2.3 Teste de Sessão e Tokens
**Responsável:** QA  
**Prioridade:** CRÍTICA

| Teste | Esperado | Status |
|-------|----------|--------|
| Token expirado após logout | Requisições falham com 401 | [ ] |
| Refresh token funciona corretamente | Sessão renovada sem re-login | [ ] |
| Sessão persiste após fechar navegador | Usuário permanece logado | [ ] |
| Login simultâneo em dispositivos diferentes | Ambas sessões válidas | [ ] |
| Token não vazado em URLs ou logs | Verificar Network tab | [ ] |
| Logout limpa todos os dados locais | localStorage/sessionStorage limpos | [ ] |

---

## 🛒 FASE 3: TESTES E2E - FLUXO CLIENTE

### 3.1 Teste Completo: Retirada no Local
**Responsável:** Testador 1  
**Estabelecimento:** Doces e Tortas (ou outro ativo)

**Pré-condições:**
- Estabelecimento aberto
- Produtos disponíveis
- Usuário com conta verificada

**Passos:**
1. [ ] Acessar marketplace
2. [ ] Selecionar estabelecimento
3. [ ] Adicionar 2+ produtos ao carrinho
4. [ ] Selecionar "Retirada no Local"
5. [ ] Preencher dados pessoais (se guest checkout)
6. [ ] Verificar código WhatsApp recebido
7. [ ] Confirmar pedido
8. [ ] Verificar pedido em "Meus Pedidos"
9. [ ] Verificar notificação no painel do lojista

**Resultado Esperado:** Pedido criado com status "pending", notificação enviada

### 3.2 Teste Completo: Delivery com PIX
**Responsável:** Testador 1

**Passos:**
1. [ ] Selecionar produtos
2. [ ] Escolher "Delivery"
3. [ ] Inserir endereço de entrega válido
4. [ ] Selecionar pagamento PIX
5. [ ] Gerar QR Code PIX
6. [ ] Simular pagamento (ambiente de teste MP)
7. [ ] Verificar webhook atualiza status
8. [ ] Confirmar pedido aparece como "paid"

### 3.3 Teste Completo: Delivery com Cartão
**Responsável:** Testador 1

**Dados de Teste Mercado Pago:**
- Cartão aprovado: `5031 4332 1540 6351`
- CVV: `123`
- Validade: Qualquer data futura
- Nome: APRO

**Passos:**
1. [ ] Adicionar produtos ao carrinho
2. [ ] Escolher "Delivery"
3. [ ] Inserir endereço
4. [ ] Selecionar "Cartão de Crédito"
5. [ ] Preencher dados do cartão de teste
6. [ ] Processar pagamento
7. [ ] Verificar aprovação
8. [ ] Confirmar status do pedido

### 3.4 Teste Completo: Pagar na Entrega
**Responsável:** Testador 1

**Passos:**
1. [ ] Adicionar produtos
2. [ ] Escolher "Delivery"
3. [ ] Selecionar "Pagar na Entrega"
4. [ ] Escolher método: Dinheiro (com troco) ou Maquineta
5. [ ] Finalizar pedido
6. [ ] Verificar pedido criado sem pagamento online
7. [ ] Confirmar informação de troco aparece para lojista

### 3.5 Teste E2E Completo - Cliente
**Responsável:** Testador 1  
**Tempo estimado:** 2 horas

**Checklist Consolidado:**
- [ ] Navegação marketplace funcional
- [ ] Filtros por categoria funcionam
- [ ] Busca de produtos funciona
- [ ] Favoritos são salvos corretamente
- [ ] Carrinho persiste entre páginas
- [ ] Guest checkout com WhatsApp funciona
- [ ] Login/cadastro tradicional funciona
- [ ] Recuperação de senha funciona
- [ ] Histórico de pedidos exibe corretamente
- [ ] Acompanhamento de pedido em tempo real
- [ ] Cupons de desconto aplicados corretamente
- [ ] Avaliação pós-pedido funciona

---

## 🏪 FASE 4: TESTES E2E - FLUXO LOJISTA

### 4.1 Login Painel Lojista
**Responsável:** Testador 2  
**URL:** `/painel/:slug`

- [ ] Login com credenciais válidas
- [ ] Redirecionamento para dashboard após login
- [ ] Recuperação de senha funciona
- [ ] Logout limpa sessão
- [ ] Acesso negado com credenciais inválidas

### 4.2 Dashboard Lojista - Métricas
**Responsável:** Testador 2

- [ ] Métricas de vendas do dia exibidas
- [ ] Gráficos carregam corretamente
- [ ] Pedidos pendentes destacados
- [ ] Botão abrir/fechar loja funciona
- [ ] Refresh manual de dados funciona

### 4.3 CRUD de Produtos
**Responsável:** Testador 2

| Operação | Teste | Status |
|----------|-------|--------|
| CREATE | Criar produto com foto, preço, categoria | [ ] |
| READ | Listar todos os produtos | [ ] |
| UPDATE | Editar nome, preço, disponibilidade | [ ] |
| DELETE | Remover produto (soft delete) | [ ] |
| UPLOAD | Upload de imagem funciona | [ ] |
| CATEGORIA | Criar/editar categorias | [ ] |

### 4.4 Gestão de Pedidos (Workflow Completo)
**Responsável:** Testador 2

**Fluxo de Status:**
```
pending → accepted → preparing → ready → out_for_delivery → delivered
                                      → picked_up (retirada)
       → rejected (cancelado)
```

- [ ] Aceitar pedido pendente
- [ ] Rejeitar pedido com motivo
- [ ] Marcar como "Preparando"
- [ ] Marcar como "Pronto"
- [ ] Marcar como "Saiu para Entrega"
- [ ] Marcar como "Entregue"
- [ ] Notificações enviadas a cada mudança de status
- [ ] Histórico de pedidos acessível

### 4.5 Teste E2E Completo - Lojista
**Responsável:** Testador 2  
**Tempo estimado:** 3 horas

**Checklist Consolidado:**
- [ ] Dashboard carrega métricas corretas
- [ ] CRUD de produtos funcional
- [ ] CRUD de categorias funcional
- [ ] Gestão de pedidos completa
- [ ] Configurações de entrega funcionam
- [ ] Configurações de pagamento funcionam
- [ ] Relatórios financeiros acessíveis
- [ ] Gestão de equipe (adicionar/remover colaboradores)
- [ ] VilaTok Stories funciona
- [ ] VilaTok TV funciona
- [ ] QR Code gerado corretamente
- [ ] Notificações recebidas corretamente

---

## 💳 FASE 5: INTEGRAÇÕES DE PAGAMENTO

### 5.1 Integração Mercado Pago - Produção
**Responsável:** Administrador / QA  
**Prioridade:** CRÍTICA

**Pré-requisitos:**
- [ ] Credenciais de produção configuradas
- [ ] Webhook URL atualizada para produção
- [ ] OAuth configurado para lojistas

**Testes:**
| Cenário | Esperado | Status |
|---------|----------|--------|
| Gerar PIX | QR Code válido gerado | [ ] |
| Pagar PIX | Webhook recebido, status atualizado | [ ] |
| Pagamento Cartão | Transação aprovada | [ ] |
| Cartão Recusado | Mensagem de erro clara | [ ] |
| Reembolso | Estorno processado | [ ] |

### 5.2 Sistema de Vouchers
**Responsável:** Testador 1 / Admin

- [ ] Criar voucher de desconto fixo
- [ ] Criar voucher de desconto percentual
- [ ] Aplicar voucher no checkout
- [ ] Voucher com limite de uso funciona
- [ ] Voucher expirado rejeitado
- [ ] Voucher de valor mínimo validado

---

## 📊 FASE 6: MONITORAMENTO E SUPORTE

### 6.1 Monitoramento 24h - Primeiras Semanas
**Responsável:** Equipe de Operações  
**Período:** 2 semanas pós-lançamento

**Métricas a Monitorar:**

| Métrica | Threshold Alerta | Ação |
|---------|------------------|------|
| Tempo resposta API | > 3s | Investigar |
| Taxa de erro 5xx | > 1% | Alerta crítico |
| Webhooks falhando | > 3 consecutivos | Verificar logs |
| Pedidos pendentes > 30min | Sim | Notificar lojista |
| Pagamentos não confirmados > 10min | Sim | Verificar MP/PS |

**Checklist Diário:**
- [ ] Verificar logs de Edge Functions
- [ ] Verificar fila de webhooks
- [ ] Revisar pedidos com problemas
- [ ] Verificar uptime do sistema
- [ ] Responder tickets de suporte

### 6.2 Canal de Suporte Ativo
**Responsável:** Equipe de Suporte

- [ ] WhatsApp de suporte configurado
- [ ] Email de suporte ativo
- [ ] FAQ atualizado no site
- [ ] Processo de escalação definido
- [ ] Tempo de resposta SLA definido (ex: 4h)

---

## ✅ CHECKLIST FINAL PRÉ-LANÇAMENTO

### Infraestrutura
- [ ] DNS configurado e propagado
- [ ] SSL válido e funcionando
- [ ] Backup automático ativo
- [ ] Variáveis de ambiente em produção
- [ ] Edge Functions deployadas

### Segurança
- [ ] Testes de acesso não autorizado passaram
- [ ] Tokens e sessões funcionando corretamente
- [ ] RLS policies validadas
- [ ] Dados sensíveis protegidos

### Funcionalidades
- [ ] Fluxo cliente E2E testado
- [ ] Fluxo lojista E2E testado
- [ ] Pagamentos funcionando em produção
- [ ] Notificações WhatsApp funcionando
- [ ] Sistema de vouchers testado

### Operações
- [ ] Equipe de suporte treinada
- [ ] Monitoramento configurado
- [ ] Procedimentos de emergência documentados
- [ ] Comunicação de lançamento preparada

---

## 📞 CONTATOS DE EMERGÊNCIA

| Função | Contato | Responsabilidade |
|--------|---------|------------------|
| DevOps | [Definir] | Infraestrutura e deploy |
| Suporte Técnico | [Definir] | Bugs e problemas técnicos |
| Suporte Cliente | [Definir] | Atendimento ao usuário |
| Financeiro | [Definir] | Problemas de pagamento |

---

## 📝 NOTAS DE VERSÃO

**v1.0 - Dezembro 2024**
- Documento inicial criado
- Consolidação de todos os itens de roadmap pendentes
- Organização por fases e responsáveis

---

*Este documento deve ser atualizado conforme os testes são realizados. Marcar cada item como concluído [x] ao finalizar.*
