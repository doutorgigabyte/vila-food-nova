# 📋 GUIA MESTRE DE TESTES - VilaFood v0.95.0 Beta

> **⚠️ DOCUMENTO CONFIDENCIAL - USO EXCLUSIVO EQUIPE DE QA**

---

## 📌 Informações do Documento

| Campo | Valor |
|-------|-------|
| **Versão** | v0.95.0 Beta |
| **Data de Criação** | 14/12/2024 |
| **Última Atualização** | 14/12/2024 |
| **Validade das Credenciais** | 30 dias |
| **Ambiente** | Staging/Preview |
| **Documento Substitui** | GUIA_TESTES_FASE2, GUIA_TESTES_FASE3, versões anteriores |

---

## 🔗 Links de Acesso (Ambiente Único)

| Ambiente | URL |
|----------|-----|
| **Preview Principal** | https://preview--vilafood-delivery.lovable.app |
| Marketplace | https://preview--vilafood-delivery.lovable.app/marketplace |
| Admin Dashboard | https://preview--vilafood-delivery.lovable.app/admin |
| Painel Lojista | https://preview--vilafood-delivery.lovable.app/painel/doces-e-tortas |
| Menu Digital | https://preview--vilafood-delivery.lovable.app/doces-e-tortas |
| Guia de Testes | https://preview--vilafood-delivery.lovable.app/admin/testes |

> ⚠️ **IMPORTANTE**: Todas as URLs de produção (`vilafood.delivery`) estão PROIBIDAS durante testes. Use APENAS o ambiente de preview acima.

---

## 🔐 Credenciais de Acesso

### Sistema VilaFood

| Perfil | Email | Senha |
|--------|-------|-------|
| **Super Admin** | `doutorgigabyte.ti@gmail.com` | `[Solicitar ao QA Lead]` |
| **Lojista (Doces e Tortas)** | `docestortas@teste.com` | `[Solicitar ao QA Lead]` |
| **Cliente Teste** | `cliente@teste.com` | `[Solicitar ao QA Lead]` |
| **Entregador Teste** | `entregador@teste.com` | `[Solicitar ao QA Lead]` |

### Mercado Pago Sandbox

| Perfil | User | Senha |
|--------|------|-------|
| Marketplace (Plataforma) | `TESTUSER2002566892` | `[Solicitar ao QA Lead]` |
| Cliente Comprador | `TESTUSER34849` | `[Solicitar ao QA Lead]` |
| Lojista Vendedor | `TESTUSER1509698498` | `[Solicitar ao QA Lead]` |

> 📧 Para obter credenciais, contate: **QA Lead** ou consulte o cofre de senhas da equipe.

---

## 💳 Instruções de Pagamento

### Cartões de Teste Mercado Pago

| Bandeira | Número | CVV | Validade | Nome do Titular |
|----------|--------|-----|----------|-----------------|
| Mastercard | `5031 4332 1540 6351` | `[Ver MP Docs]` | `11/25` | `APRO` |
| Visa | `4235 6477 2802 5682` | `[Ver MP Docs]` | `11/25` | `APRO` |
| American Express | `3753 651535 56885` | `[Ver MP Docs]` | `11/25` | `APRO` |
| Elo Débito | `5067 2686 5051 7446` | `[Ver MP Docs]` | `11/25` | `APRO` |

> 📚 **Referência CVV**: [Documentação Oficial Mercado Pago - Cartões de Teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/test-cards)

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
| `FORM` | ❌ Recusado | Erro no formulário |

### CPF para Testes
```
12345678909
```

### PIX

- PIX de teste gera QR Code válido no sandbox
- **Timeout**: 15 minutos para expiração
- Após expiração: pedido deve ser cancelado automaticamente ou mostrar opção de gerar novo QR

### Pagar na Entrega

- **Dinheiro**: Sistema deve calcular troco corretamente
- **Maquineta**: Crédito/Débito no ato da entrega

---

## 📦 Dados de Teste

### Estabelecimento Principal

| Item | Valor |
|------|-------|
| **Nome** | Doces e Tortas |
| **ID** | `4c9b12fb-a4c6-453d-87c2-6a9c9b6b1491` |
| **Horários** | Seg-Sex: 08:00-18:00, Sáb: 08:00-14:00, Dom: Fechado |
| **Zona de Entrega** | Centro, Tirol, Petrópolis - Natal/RN |
| **Taxa de Entrega** | R$ 5,00 - R$ 12,00 (depende do bairro) |
| **Pedido Mínimo** | R$ 20,00 |
| **Cupom de Teste** | `TESTE10` (10% desconto, min R$ 30) |

### Endereço de Teste

```
Rua Apodi, 123
Centro, Natal/RN
CEP: 59025-000
```

### Produtos Disponíveis

| Produto | Preço |
|---------|-------|
| Bolo de Chocolate | R$ 45,00 |
| Torta de Limão | R$ 38,00 |
| Brigadeiro (10un) | R$ 25,00 |
| Coxinha (6un) | R$ 18,00 |
| Pudim | R$ 22,00 |

---

## 🔄 Matriz de Dependências de Testes

```
┌─────────────────────────────────────────────────────────────┐
│                    ORDEM DE EXECUÇÃO                        │
├─────────────────────────────────────────────────────────────┤
│  1. Login/Auth           ──────►  Todos os outros testes    │
│  2. Visualizar Cardápio  ──────►  Adicionar ao Carrinho     │
│  3. Adicionar ao Carrinho ─────►  Checkout                  │
│  4. Checkout             ──────►  Pagamento                 │
│  5. Pagamento            ──────►  Criar Pedido              │
│  6. Criar Pedido         ──────►  Rastreamento              │
│  7. Criar Pedido         ──────►  Gestão de Pedidos (Loja)  │
│  8. Gestão de Pedidos    ──────►  KDS/Entregas              │
└─────────────────────────────────────────────────────────────┘
```

### Pré-condições por Teste

| Teste | Pré-condição |
|-------|--------------|
| Checkout | Carrinho com itens, usuário logado ou guest |
| Pagamento PIX | Mercado Pago conectado no estabelecimento |
| Rastreamento | Pedido criado com sucesso |
| Gestão Pedidos (Loja) | Pedido existente + login lojista |
| KDS | Pedido em status "Em Preparo" |
| Entregas | Pedido em status "Pronto" + entregador disponível |

---

## ⏱️ Fluxo de Expiração PIX

```
┌──────────────────────────────────────────────────────────────┐
│  TIMELINE PIX                                                │
├──────────────────────────────────────────────────────────────┤
│  00:00  │  QR Code gerado, pedido status: "pending_payment"  │
│  05:00  │  Lembrete visual (opcional)                        │
│  10:00  │  Aviso de expiração próxima                        │
│  15:00  │  PIX expira                                        │
│  15:01  │  Sistema deve:                                     │
│         │  ├─ Cancelar pedido automaticamente OU             │
│         │  └─ Oferecer opção de gerar novo QR Code           │
└──────────────────────────────────────────────────────────────┘
```

**Validações após expiração:**
- [ ] QR Code antigo não deve ser reutilizável
- [ ] Pedido não deve ser criado com PIX expirado
- [ ] Estoque deve ser liberado (se aplicável)

---

## 👤 TESTADOR 1 - Cliente + Admin

### Escopo de Responsabilidade

- Fluxos de compra completos (cliente)
- Sistema de cupons
- Testes de segurança (acesso não autorizado)
- Dashboard e funcionalidades Admin

### Cenários de Teste

#### 🛒 Teste 1: Retirada no Local (P1)

**Passos:**
1. Acesse `/doces-e-tortas`
2. Adicione 2+ produtos ao carrinho (total > R$ 30)
3. Aplique cupom `TESTE10`
4. Selecione "Retirar no Local"
5. Escolha PIX como pagamento
6. Verifique QR Code gerado
7. Simule aprovação (em sandbox)
8. Confirme status do pedido

**Resultado Esperado:** 
- Desconto de 10% aplicado corretamente
- QR Code PIX válido gerado
- Pedido criado com status "pending" → "confirmed" após pagamento

**Cleanup:** Cancelar pedido de teste após validação (ou usar pedidos dedicados)

---

#### 🛒 Teste 2: Delivery com Cartão (P1)

**Passos:**
1. Acesse `/doces-e-tortas`
2. Adicione produtos ao carrinho
3. Selecione "Entrega"
4. Informe endereço: Rua Apodi, 123 - Centro
5. Verifique taxa de entrega calculada
6. Selecione "Cartão de Crédito"
7. Use cartão Mastercard de teste com nome `APRO`
8. Complete pagamento

**Resultado Esperado:**
- Taxa de entrega calculada corretamente
- Redirecionamento para checkout Mercado Pago
- Pagamento aprovado automaticamente (nome APRO)
- Pedido criado com status "confirmed"

**Cleanup:** Cancelar pedido de teste após validação

---

#### 🛒 Teste 3: Pagar na Entrega (P1)

**Passos:**
1. Mesmo fluxo do Teste 2
2. Selecione "Pagar na Entrega"
3. Escolha "Dinheiro" com troco para R$ 100
4. Finalize pedido

**Resultado Esperado:**
- Pedido criado sem cobrança online
- Informação de troco registrada no pedido
- Status inicial "pending" (aguardando confirmação loja)

---

#### 🎟️ Teste 4: Sistema de Cupons (P2)

| Cenário | Entrada | Resultado Esperado |
|---------|---------|-------------------|
| Cupom válido | `TESTE10` (pedido > R$30) | Desconto 10% aplicado |
| Cupom inexistente | `INVALIDO123` | Toast: "Cupom não encontrado" |
| Pedido abaixo do mínimo | `TESTE10` (pedido < R$30) | Toast: "Pedido mínimo R$30" |
| Cupom expirado | Usar cupom com data passada | Toast: "Cupom expirado" |

---

#### 🔒 Teste 5: Segurança - Acesso Não Autorizado (P1)

| Ação | Resultado Esperado |
|------|-------------------|
| Login como cliente → acessar `/admin` | Redirect para marketplace ou 403 |
| Login como cliente → acessar `/painel/doces-e-tortas` | Acesso negado |
| Manipular localStorage (forjar role) | Token inválido, logout forçado |
| URL direta sem login → `/admin/usuarios` | Redirect para login |

---

#### 📊 Teste 6: Admin Dashboard (P1-P2)

**Como Super Admin:**
1. Acesse `/admin`
2. Verifique métricas do dashboard carregando
3. Teste CRUD de usuários em `/admin/usuarios`
4. Teste vouchers em `/admin/vouchers`
5. Teste Central de Segurança em `/admin/central-seguranca`
6. Teste Relatórios em `/admin/relatorios`
7. Teste financeiro em `/admin/financeiro`
8. Teste gestão de estabelecimentos em `/admin/estabelecimentos`

---

### Checklist Testador 1

#### Prioridade P1 (Obrigatório)
- [ ] Fluxo cliente - Retirada no Local com PIX
- [ ] Fluxo cliente - Delivery com Cartão
- [ ] Fluxo cliente - Pagar na Entrega
- [ ] Admin - Gestão de usuários (CRUD)
- [ ] Admin - Sistema de vouchers
- [ ] Segurança - Acesso não autorizado (cliente)

#### Prioridade P2 (Importante)
- [ ] Sistema de cupons (todos cenários)
- [ ] Dashboard Admin - Métricas carregando
- [ ] Admin - Gestão de estabelecimentos
- [ ] Admin - Central de Segurança
- [ ] Admin - Relatórios e exportação
- [ ] Admin - Financeiro

---

## 👤 TESTADOR 2 - Lojista + Entregador

### Escopo de Responsabilidade

- Painel do lojista completo
- Gestão de pedidos e produtos
- KDS (Kitchen Display System)
- Sistema de entregas e tracking
- VilaTok (Stories e TV)
- Configurações da loja

### Cenários de Teste

#### 🏪 Teste 1: Login e Dashboard Lojista (P1)

**Passos:**
1. Acesse `/painel/doces-e-tortas`
2. Faça login com credenciais do lojista
3. Verifique dashboard com métricas
4. Navegue pelas seções do menu lateral

**Resultado Esperado:**
- Login bem-sucedido
- Dashboard exibe métricas corretas
- Todas as seções do menu funcionais

---

#### 📦 Teste 2: Gestão de Pedidos - Workflow (P1)

**Passos:**
1. Acesse "Pedidos"
2. Localize pedido de teste
3. Execute workflow completo:
   - Pendente → Confirmado → Em Preparo → Pronto → Saiu para Entrega → Entregue

**Resultado Esperado:**
- Cada mudança de status reflete imediatamente
- Notificações enviadas (se configurado)
- Histórico de status registrado

**Teste Adicional:**
- Teste cancelamento de pedido
- Teste impressão de comanda

---

#### 🍕 Teste 3: CRUD de Produtos (P1)

| Operação | Passos | Resultado Esperado |
|----------|--------|-------------------|
| Criar | Novo produto com nome, preço, imagem | Produto aparece na lista |
| Ler | Visualizar detalhes do produto | Dados corretos exibidos |
| Atualizar | Editar preço ou descrição | Alterações salvas |
| Desativar | Toggle de disponibilidade | Produto some do cardápio público |
| Upload Imagem | Enviar imagem de produto | Imagem exibida via CloudFront |

---

#### 👨‍🍳 Teste 4: KDS - Kitchen Display (P2)

**Passos:**
1. Acesse `/painel/doces-e-tortas/kds`
2. Gere token público para TV
3. Acesse link público em aba anônima
4. Verifique exibição de pedidos "Em Preparo"

**Resultado Esperado:**
- Link público funciona sem login
- Pedidos exibidos em tempo real
- Som/visual de novos pedidos

---

#### 🚗 Teste 5: Sistema de Entregas (P2)

**Como Lojista:**
1. Acesse "Entregas"
2. Verifique fila de pedidos "Pronto"
3. Atribua entregador a pedido

**Como Entregador:**
1. Login como entregador
2. Aceite entrega
3. Atualize status: Coletado → Em Trânsito → Entregue

**Resultado Esperado:**
- Atribuição funciona
- Status atualiza em tempo real para todas as partes

---

#### 🎬 Teste 6: VilaTok (P2)

**VilaTok Stories:**
1. Acesse "VilaTok Stories"
2. Crie story com imagem
3. Vincule produto
4. Verifique exibição no cardápio

**VilaTok TV:**
1. Acesse "VilaTok TV"
2. Crie slides com diferentes templates
3. Gere link público
4. Verifique player automático

---

#### 🔒 Teste 7: Segurança - Isolamento de Loja (P1)

| Ação | Resultado Esperado |
|------|-------------------|
| Login loja A → acessar `/painel/loja-b` | Acesso negado |
| Login lojista → acessar `/admin` | Redirect ou acesso negado |
| Console: modificar produto de outra loja | RLS bloqueia operação |

---

### Checklist Testador 2

#### Prioridade P1 (Obrigatório)
- [ ] Login painel lojista
- [ ] Dashboard lojista - Métricas
- [ ] Gestão de pedidos (workflow completo)
- [ ] CRUD de produtos
- [ ] Segurança - Isolamento de loja

#### Prioridade P2 (Importante)
- [ ] Gestão de equipe
- [ ] KDS - Display de cozinha
- [ ] Sistema de entregas
- [ ] Tracking em tempo real
- [ ] Upload de imagens (S3/CloudFront)
- [ ] Configurações da loja
- [ ] VilaTok Stories
- [ ] VilaTok TV

---

## 🧹 Procedimentos de Cleanup

### Após cada sessão de testes:

1. **Pedidos de Teste**
   - Cancelar pedidos criados durante testes
   - Não deixar pedidos "pendentes" indefinidamente

2. **Produtos de Teste**
   - Desativar ou excluir produtos criados para teste
   - Manter apenas produtos padrão do estabelecimento

3. **Usuários de Teste**
   - Não criar usuários adicionais desnecessários
   - Usar sempre as credenciais fornecidas

4. **Dados Sensíveis**
   - Não salvar screenshots com credenciais visíveis
   - Não compartilhar tokens/senhas fora do canal oficial

---

## 🐛 Template de Relatório de Bug

```markdown
## Bug Report #[NÚMERO]

**Testador:** [1 ou 2]
**Data/Hora:** [DD/MM/YYYY HH:MM]
**Ambiente:** Preview/Staging
**URL:** [URL completa onde o bug ocorreu]

### Descrição
[Descreva o bug em uma frase clara]

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
- Console errors: [copiar texto do console]
- Network request: [URL, método, status code, response body]

### Severidade
- [ ] 🔴 Crítico (blocker - impede uso do sistema)
- [ ] 🟠 Alto (funcionalidade quebrada)
- [ ] 🟡 Médio (funciona com workaround)
- [ ] 🟢 Baixo (cosmético/UX)

### Informações do Ambiente
- Navegador: [Chrome/Firefox/Safari + versão]
- Dispositivo: [Desktop/Mobile + modelo se mobile]
- Resolução: [ex: 1920x1080]
- Sistema Operacional: [Windows/macOS/iOS/Android]
```

---

## 🌐 Matriz de Compatibilidade de Navegadores

| Navegador | Desktop | Mobile | Prioridade |
|-----------|---------|--------|------------|
| Chrome | ✅ Suportado | ✅ Suportado | P1 |
| Safari | ✅ Suportado | ✅ Suportado (iOS) | P1 |
| Firefox | ✅ Suportado | ⚠️ Testar | P2 |
| Edge | ✅ Suportado | ⚠️ Testar | P2 |
| Samsung Internet | - | ⚠️ Testar | P3 |

**Resoluções Mínimas:**
- Desktop: 1280x720
- Tablet: 768x1024
- Mobile: 375x667

---

## ✅ Critérios de Aceite para RC

Para avançar para fase **Release Candidate (v0.99.0)**:

| Critério | Meta |
|----------|------|
| Itens P1 passando | 100% |
| Itens P2 passando | 80% |
| Bugs críticos abertos | 0 |
| Bugs altos abertos | ≤ 3 |
| Vulnerabilidades de segurança | 0 |

---

## 📞 Suporte

| Canal | Contato |
|-------|---------|
| **QA Lead** | [Definir canal interno] |
| **Horário** | Seg-Sex 09:00-18:00 |
| **Email Técnico** | doutorgigabyte.ti@gmail.com |

---

*Documento consolidado - VilaFood v0.95.0 Beta*
*Este documento é a única fonte de verdade para testes. Versões anteriores estão arquivadas.*
