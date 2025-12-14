# 📋 Guias de Teste Beta - VilaFood v0.95.0

**Data de Criação:** 14/12/2024  
**Validade das Credenciais:** 30 dias  
**Ambiente:** Staging/Preview  

> ⚠️ **DOCUMENTO CONFIDENCIAL** - Não compartilhe externamente

---

# 🔗 Links de Acesso

| Ambiente | URL |
|----------|-----|
| Preview Principal | https://preview--vilafood-delivery.lovable.app |
| Marketplace | https://preview--vilafood-delivery.lovable.app/marketplace |
| Admin Dashboard | https://preview--vilafood-delivery.lovable.app/admin |
| Painel Lojista | https://preview--vilafood-delivery.lovable.app/painel/doces-e-tortas |
| Menu Digital | https://preview--vilafood-delivery.lovable.app/doces-e-tortas |
| Guia de Testes | https://preview--vilafood-delivery.lovable.app/admin/testes |

---

# 💳 Instruções de Pagamento

## Cartões de Teste Mercado Pago

| Bandeira | Número | CVV | Validade | Nome do Titular |
|----------|--------|-----|----------|-----------------|
| Mastercard | `5031 4332 1540 6351` | `123` | `11/25` | `APRO` |
| Visa | `4235 6477 2802 5682` | `123` | `11/25` | `APRO` |
| American Express | `3753 651535 56885` | `1234` | `11/25` | `APRO` |
| Elo Débito | `5067 2686 5051 7446` | `123` | `11/25` | `APRO` |

### Códigos de Simulação (Nome do Titular)

| Código | Resultado | Descrição |
|--------|-----------|-----------|
| `APRO` | ✅ Aprovado | Pagamento aprovado |
| `OTHE` | ❌ Recusado | Erro geral |
| `CONT` | ⏳ Pendente | Aguardando pagamento |
| `CALL` | ❌ Recusado | Ligar para autorizar |
| `FUND` | ❌ Recusado | Saldo insuficiente |
| `SECU` | ❌ Recusado | CVV inválido |
| `EXPI` | ❌ Recusado | Cartão expirado |

## PIX

- PIX de teste gera QR Code válido
- Em ambiente de teste, pagamento pode ser simulado via Mercado Pago Sandbox
- Timeout: 15 minutos para expiração

## Pagar na Entrega

- Dinheiro: Informar valor para troco
- Maquineta: Crédito/Débito no ato

---

# 📦 Dados de Teste

| Item | Valor |
|------|-------|
| **Estabelecimento** | Doces e Tortas |
| **ID** | `4c9b12fb-a4c6-453d-87c2-6a9c9b6b1491` |
| **Horários** | Seg-Sex: 08:00-18:00, Sáb: 08:00-14:00 |
| **Zona de Entrega** | Centro, Tirol, Petrópolis - Natal/RN |
| **Taxa de Entrega** | R$ 5,00 - R$ 12,00 |
| **Pedido Mínimo** | R$ 20,00 |
| **Cupom de Teste** | `TESTE10` (10% desconto, min R$ 30) |

### Endereço de Teste
```
Rua Apodi, 123
Centro, Natal/RN
CEP: 59025-000
```

### Produtos Disponíveis
- Bolo de Chocolate - R$ 45,00
- Torta de Limão - R$ 38,00
- Brigadeiro (10un) - R$ 25,00
- Coxinha (6un) - R$ 18,00
- Pudim - R$ 22,00

---

# 👤 TESTADOR 1 - Cliente + Admin

## Credenciais de Acesso

| Perfil | Email | Senha |
|--------|-------|-------|
| **Super Admin** | `doutorgigabyte.ti@gmail.com` | `[Solicitar ao QA Lead]` |
| **Cliente Teste** | `cliente@teste.com` | `[Solicitar ao QA Lead]` |

## Escopo de Testes

### 🛒 Fluxos de Compra (Prioridade P1)

#### Teste 1: Retirada no Local
1. Acesse `/doces-e-tortas`
2. Adicione 2+ produtos ao carrinho (total > R$ 30)
3. Aplique cupom `TESTE10`
4. Selecione "Retirar no Local"
5. Escolha PIX como pagamento
6. Verifique QR Code gerado
7. Simule aprovação (em sandbox)
8. Confirme status do pedido

**Resultado Esperado:** Pedido criado com status "Pendente", desconto aplicado corretamente

#### Teste 2: Delivery com Cartão
1. Acesse `/doces-e-tortas`
2. Adicione produtos ao carrinho
3. Selecione "Entrega"
4. Informe endereço: Rua Apodi, 123 - Centro
5. Verifique taxa de entrega calculada
6. Selecione "Cartão de Crédito"
7. Use cartão: `5031 4332 1540 6351`, CVV `123`, `11/25`, `APRO`
8. Complete pagamento

**Resultado Esperado:** Redirecionamento para Mercado Pago, aprovação automática

#### Teste 3: Pagar na Entrega
1. Mesmo fluxo do Teste 2
2. Selecione "Pagar na Entrega"
3. Escolha "Dinheiro" com troco para R$ 100
4. Finalize pedido

**Resultado Esperado:** Pedido criado sem cobrança online, informação de troco registrada

### 🎟️ Sistema de Cupons (P2)
1. Teste cupom válido `TESTE10`
2. Teste cupom inexistente
3. Teste cupom com pedido abaixo do mínimo
4. Verifique desconto aplicado corretamente

### 🔒 Teste de Segurança - Acesso Não Autorizado (P1)
1. Faça login como cliente
2. Tente acessar `/admin` - deve redirecionar
3. Tente acessar `/painel/doces-e-tortas` - deve negar acesso
4. Tente manipular localStorage para forjar roles - deve falhar

### 📊 Admin Dashboard (P1-P2)
1. Faça login como Super Admin
2. Acesse `/admin`
3. Verifique métricas do dashboard
4. Teste CRUD de usuários em `/admin/usuarios`
5. Teste sistema de vouchers em `/admin/vouchers`
6. Teste Central de Segurança em `/admin/central-seguranca`
7. Teste Relatórios em `/admin/relatorios`
8. Teste gestão de estabelecimentos em `/admin/estabelecimentos`
9. Teste módulo financeiro em `/admin/financeiro`

---

## Checklist Testador 1

### Prioridade P1 (Obrigatório)
- [ ] Teste completo fluxo cliente - Retirada
- [ ] Teste completo fluxo cliente - Delivery Cartão
- [ ] Teste completo fluxo cliente - Pagar na Entrega
- [ ] Admin - Gestão de usuários (CRUD completo)
- [ ] Admin - Sistema de vouchers
- [ ] Teste de acesso não autorizado (cliente)

### Prioridade P2 (Importante)
- [ ] Teste sistema de cupons (cliente)
- [ ] Dashboard Admin - Métricas
- [ ] Admin - Gestão de estabelecimentos
- [ ] Admin - Central de Segurança
- [ ] Admin - Relatórios e exportação
- [ ] Admin - Financeiro

### Prioridade P3 (Desejável)
- [ ] Teste de carga - checkout simultâneo

---

# 👤 TESTADOR 2 - Lojista + Entregador

## Credenciais de Acesso

| Perfil | Email | Senha |
|--------|-------|-------|
| **Lojista (Doces e Tortas)** | `docestortas@teste.com` | `[Solicitar ao QA Lead]` |
| **Entregador** | `entregador@teste.com` | `[Solicitar ao QA Lead]` |
| **Super Admin** (backup) | `doutorgigabyte.ti@gmail.com` | `[Solicitar ao QA Lead]` |

## Escopo de Testes

### 🏪 Painel do Lojista (P1)

#### Login e Dashboard
1. Acesse `/lojista` ou `/painel/doces-e-tortas`
2. Faça login com credenciais do lojista
3. Verifique dashboard com métricas
4. Navegue pelas seções do menu

#### Gestão de Pedidos
1. Acesse "Pedidos"
2. Teste workflow completo:
   - Pendente → Confirmado → Em Preparo → Pronto → Saiu para Entrega → Entregue
3. Teste cancelamento de pedido
4. Teste impressão de comanda

#### CRUD de Produtos
1. Acesse "Produtos"
2. Crie novo produto com imagem
3. Edite produto existente
4. Desative/ative produto
5. Teste upload de imagem (S3/CloudFront)

### 👨‍🍳 KDS - Kitchen Display System (P2)
1. Acesse `/painel/doces-e-tortas/kds`
2. Gere token público para TV
3. Acesse link público em nova aba
4. Verifique exibição de pedidos
5. Teste notificações de novos pedidos

### 🚗 Sistema de Entregas (P2)

#### Fila de Entregas
1. Acesse "Entregas"
2. Verifique fila de pedidos
3. Atribua entregador a pedido
4. Teste status de entrega

#### Tracking em Tempo Real
1. Como entregador, acesse painel
2. Aceite entrega
3. Atualize status (coletado, em trânsito, entregue)
4. Verifique atualização no painel do lojista

### 📱 WhatsApp AI Agent (P2)
1. Verifique configuração em "Configurações > WhatsApp"
2. Teste instância conectada
3. Simule conversa (se disponível em sandbox)

### 🎬 VilaTok (P2)

#### VilaTok Stories
1. Acesse "VilaTok Stories"
2. Crie novo story com imagem
3. Vincule produto
4. Verifique exibição no menu

#### VilaTok TV
1. Acesse "VilaTok TV"
2. Crie slides com diferentes templates
3. Gere link público para TV
4. Teste player de slides

### ⚙️ Configurações da Loja (P2)
1. Acesse "Configurações"
2. Edite informações da loja
3. Configure horários de funcionamento
4. Configure zonas de entrega
5. Configure métodos de pagamento

### 👥 Gestão de Equipe (P2)
1. Acesse "Equipe"
2. Adicione novo colaborador
3. Atribua roles (atendente, cozinha, gerente)
4. Teste permissões de acesso

### 🔒 Teste de Segurança - Acesso Não Autorizado (P1)
1. Faça login como lojista de "Doces e Tortas"
2. Tente acessar `/painel/outra-loja` - deve negar
3. Tente acessar `/admin` - deve redirecionar
4. Tente modificar produtos de outro estabelecimento via console - deve falhar

---

## Checklist Testador 2

### Prioridade P1 (Obrigatório)
- [ ] Login painel lojista (/painel/:slug)
- [ ] Dashboard lojista - Métricas
- [ ] Lojista - Gestão de pedidos (workflow completo)
- [ ] Lojista - CRUD de produtos
- [ ] Teste de acesso não autorizado (lojista)

### Prioridade P2 (Importante)
- [ ] Lojista - Gestão de equipe
- [ ] KDS - Display de cozinha
- [ ] Delivery - Fila de entregas
- [ ] Delivery - Tracking em tempo real
- [ ] N8N - WhatsApp AI Agent
- [ ] Lojista - Upload de imagens produtos
- [ ] Lojista - Configurações da loja
- [ ] Lojista - VilaTok Stories
- [ ] Lojista - VilaTok TV

---

# 🐛 Template de Relatório de Bug

```markdown
## Bug Report

**Testador:** [1 ou 2]
**Data/Hora:** 
**Ambiente:** Preview/Staging

### Descrição
[Descreva o bug em uma frase]

### Passos para Reproduzir
1. 
2. 
3. 

### Resultado Esperado
[O que deveria acontecer]

### Resultado Atual
[O que realmente aconteceu]

### Evidências
- Screenshot: [anexar]
- Console errors: [copiar]
- Network request: [URL e status]

### Severidade
- [ ] Crítico (blocker)
- [ ] Alto (funcionalidade quebrada)
- [ ] Médio (funciona com workaround)
- [ ] Baixo (cosmético)

### Informações Adicionais
- Navegador: 
- Dispositivo: 
- Resolução: 
```

---

# 📞 Suporte

**Canal de Comunicação:** [Definir WhatsApp/Discord/Email do QA Lead]

**Horário de Suporte:** Seg-Sex 09:00-18:00

**Contato Técnico:** doutorgigabyte.ti@gmail.com

---

# ✅ Critérios de Aceite

Para avançar para fase RC (Release Candidate):

1. **100% dos itens P1** devem passar sem bugs críticos
2. **80% dos itens P2** devem passar
3. Todos os bugs críticos devem estar resolvidos
4. Nenhuma vulnerabilidade de segurança identificada

---

*Documento gerado automaticamente - VilaFood v0.95.0 Beta*
