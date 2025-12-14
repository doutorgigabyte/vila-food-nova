# VilaFood Beta Testing Checklist v0.95.0

**Data:** 14/12/2024  
**Ambiente:** https://preview--vilafood-delivery.lovable.app  
**Versão:** Beta v0.95.0

---

## Divisão de Responsabilidades

| Testador | Foco Principal |
|----------|----------------|
| **Testador 1** | Fluxos de cliente, checkout, pagamentos, admin |
| **Testador 2** | Painel lojista, gestão de produtos, KDS, WhatsApp AI |

---

## Credenciais de Teste

> ⚠️ **CONFIDENCIAL** - Solicitar credenciais ao QA Lead

| Papel | Email | Senha |
|-------|-------|-------|
| Super Admin | `[Solicitar ao QA Lead]` | `[Solicitar ao QA Lead]` |
| Lojista | `docestortas@teste.com` | `[Solicitar ao QA Lead]` |
| Cliente | `cliente@teste.com` | `[Solicitar ao QA Lead]` |

**Cartões de Teste Mercado Pago:** [Ver documentação MP](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards)

---

## 1. Login Painel Lojista (🧪 EM TESTE)

**Status:** Testing  
**Responsável:** Testador 2  
**Correção aplicada:** 14/12/2024

### Passos de Validação
1. Acesse `https://preview--vilafood-delivery.lovable.app/auth`
2. Faça login com: `docestortas@teste.com` / `[senha do QA Lead]`
3. Navegue para `/painel/doces-e-tortas`
4. ✅ Deve exibir dashboard com métricas do estabelecimento
5. ❌ NÃO deve exibir "Nenhum estabelecimento vinculado"

### Validação de Segurança
- [ ] Tente acessar `/admin` como lojista → Deve mostrar "Acesso Restrito" SEM logout
- [ ] Verifique se a sessão permanece ativa após tentar acessar rota não autorizada

---

## 2. Fluxo Cliente - Retirada no Local (P1)

**Responsável:** Testador 1

### Passos
```
1. Acesse /doces-e-tortas (sem login)
2. Adicione 2+ produtos (total > R$ 30)
3. Clique em "Finalizar Pedido"
4. Selecione "Retirar no Local"
5. Aplique cupom TESTE10
6. Escolha pagamento PIX
7. Aguarde popup de cadastro via WhatsApp
8. Cadastre com número válido
9. Valide token recebido via WhatsApp
10. Verifique QR Code PIX gerado
11. Complete pagamento (sandbox)
12. Verifique status do pedido em /meus-pedidos
```

### Checklist
- [ ] Cupom TESTE10 aplica 10% de desconto
- [ ] Modal de cadastro WhatsApp aparece antes de finalizar
- [ ] Token de 6 dígitos recebido via WhatsApp
- [ ] Conta criada automaticamente após validação
- [ ] QR Code PIX válido gerado
- [ ] Pedido aparece em "Meus Pedidos"
- [ ] Status inicial: pending_payment → confirmed (após pagar)

---

## 3. Fluxo Cliente - Delivery com Cartão (P1)

**Responsável:** Testador 1

### Passos
```
1. Acesse /doces-e-tortas
2. Adicione produtos ao carrinho
3. Selecione "Entrega"
4. Informe endereço: Rua Apodi, 123 - Centro, Natal/RN
5. Verifique taxa de entrega calculada
6. Selecione "Cartão de Crédito"
7. Preencha com cartão Mastercard de teste:
   - Número: 5031 4332 1540 6351
   - Validade: 11/25
   - CVV: [ver MP docs]
   - Nome: APRO
8. Complete pagamento
```

### Checklist
- [ ] Taxa de entrega calculada corretamente (R$ 5-12)
- [ ] Checkout Mercado Pago carrega
- [ ] Pagamento aprovado (nome APRO)
- [ ] Pedido criado com status "confirmed"
- [ ] Pedido aparece no painel do lojista

---

## 4. Fluxo Cliente - Pagar na Entrega (P1)

**Responsável:** Testador 1

### Passos
```
1. Mesmo fluxo do teste anterior
2. Na etapa de pagamento, selecione "Pagar na Entrega"
3. Escolha "Dinheiro"
4. Informe "Troco para R$ 100"
5. Finalize pedido
```

### Checklist
- [ ] Opção "Pagar na Entrega" disponível
- [ ] Campo de troco funciona
- [ ] Pedido criado SEM cobrança online
- [ ] Status inicial: pending (aguardando loja)
- [ ] Informação de troco registrada no pedido

---

## 5. Admin - Sistema de Vouchers (P1)

**Responsável:** Testador 1

### Passos
```
1. Login como Super Admin
2. Acesse /admin/vouchers
3. Crie novo voucher:
   - Código: TESTEBETA50
   - Desconto: 50%
   - Valor mínimo: R$ 50
   - Validade: 30 dias
4. Teste aplicação no checkout
5. Edite voucher
6. Desative voucher
7. Verifique que não funciona mais
```

### Checklist
- [ ] Criação de voucher funciona
- [ ] Voucher aplica desconto correto
- [ ] Edição salva alterações
- [ ] Desativação impede uso

---

## 6. Dashboard Lojista - Métricas (P1)

**Responsável:** Testador 2

### Passos
```
1. Login como lojista (docestortas@teste.com)
2. Acesse /painel/doces-e-tortas
3. Verifique cards de métricas:
   - Vendas do dia
   - Pedidos pendentes
   - Ticket médio
   - Pedidos por hora (gráfico)
4. Navegue para outras datas
5. Verifique atualização em tempo real
```

### Checklist
- [ ] Cards de métricas carregam sem erro
- [ ] Valores condizentes com pedidos reais
- [ ] Gráficos renderizam corretamente
- [ ] Atualização quando novo pedido chega

---

## 7. Lojista - Gestão de Pedidos (P1)

**Responsável:** Testador 2

### Passos
```
1. Login como lojista
2. Acesse "Pedidos"
3. Localize pedido de teste
4. Execute workflow completo:
   - Pendente → Confirmado
   - Confirmado → Em Preparo
   - Em Preparo → Pronto
   - Pronto → Saiu para Entrega
   - Saiu para Entrega → Entregue
5. Teste cancelamento de outro pedido
```

### Checklist
- [ ] Cada mudança de status reflete imediatamente
- [ ] Cliente recebe notificação (WhatsApp/push)
- [ ] Histórico de status registrado
- [ ] Cancelamento funciona com motivo

---

## 8. Lojista - CRUD de Produtos (P1)

**Responsável:** Testador 2

### Passos
```
CRIAR:
1. Acesse /painel/doces-e-tortas/produtos
2. Clique "Novo Produto"
3. Preencha: nome, preço, descrição, categoria
4. Faça upload de imagem
5. Salve

EDITAR:
6. Edite o produto criado
7. Altere preço e descrição
8. Salve

DESATIVAR:
9. Toggle de disponibilidade
10. Verifique que some do cardápio público

EXCLUIR:
11. Delete produto de teste
```

### Checklist
- [ ] Produto criado aparece na lista
- [ ] Upload de imagem funciona (CloudFront URL)
- [ ] Edição salva corretamente
- [ ] Toggle desativa produto do cardápio
- [ ] Exclusão remove completamente

---

## 9. Teste de Acesso Não Autorizado - Cliente (P1)

**Responsável:** Testador 1

### Passos
```
1. Login como cliente (cliente@teste.com)
2. Tente acessar:
   - /admin → Deve mostrar "Login Necessário" ou "Acesso Restrito"
   - /painel/doces-e-tortas → Acesso negado
   - /admin/usuarios → Redirect para marketplace
3. No console, tente manipular localStorage:
   - Adicionar role: "super_admin"
4. Tente novamente acessar /admin
```

### Checklist
- [ ] Cliente NÃO acessa /admin
- [ ] Cliente NÃO acessa painel de loja alheia
- [ ] Manipulação de localStorage não concede acesso
- [ ] Sessão permanece ativa (sem logout forçado)

---

## 10. Teste de Acesso Não Autorizado - Lojista (P1)

**Responsável:** Testador 2

### Passos
```
1. Login como lojista (docestortas@teste.com)
2. Tente acessar:
   - /admin → Deve mostrar "Acesso Restrito" SEM logout
   - /painel/outra-loja → Acesso negado
3. No console, tente fazer requisição para outro estabelecimento:
   - supabase.from('products').select('*').eq('establishment_id', 'OUTRO_ID')
```

### Checklist
- [ ] Lojista NÃO acessa /admin
- [ ] Lojista NÃO acessa painel de outra loja
- [ ] RLS bloqueia queries para dados de outras lojas
- [ ] Sessão permanece ativa após tentativa negada

---

## 11. Lojista - Configurações da Loja (P2)

**Responsável:** Testador 2

### Passos
```
1. Acesse /painel/doces-e-tortas/configuracoes
2. Teste edição de:
   - Horário de funcionamento
   - Taxas de entrega
   - Pedido mínimo
   - Área de entrega
   - Métodos de pagamento
3. Salve alterações
4. Verifique no cardápio público
```

### Checklist
- [ ] Horários salvam corretamente
- [ ] Taxas de entrega refletem no checkout
- [ ] Pedido mínimo bloqueia pedidos abaixo
- [ ] Métodos de pagamento aparecem no checkout

---

## 12. KDS - Display de Cozinha (P2)

**Responsável:** Testador 2

### Passos
```
1. Acesse /painel/doces-e-tortas/kds
2. Clique "Gerar Link Público"
3. Copie link gerado
4. Abra em aba anônima
5. Verifique exibição de pedidos "Em Preparo"
6. Em outra aba, mude status de pedido para "Em Preparo"
7. Verifique atualização em tempo real no KDS
```

### Checklist
- [ ] Link público funciona sem login
- [ ] Pedidos exibem em tempo real
- [ ] Som/visual de novos pedidos
- [ ] Layout legível à distância

---

## 13. VilaTok Stories (P2)

**Responsável:** Testador 2

### Passos
```
1. Acesse /painel/doces-e-tortas/vilatok
2. Crie novo story com imagem
3. Vincule a um produto
4. Defina duração (24h)
5. Publique
6. Verifique exibição no cardápio público /doces-e-tortas
```

### Checklist
- [ ] Upload de imagem funciona
- [ ] Vínculo com produto funciona
- [ ] Story aparece no cardápio
- [ ] Clique leva ao produto

---

## 14. VilaTok TV (P2)

**Responsável:** Testador 2

### Passos
```
1. Acesse /painel/doces-e-tortas/vilatokTV
2. Crie slides com diferentes templates
3. Ajuste zoom e posição da imagem
4. Gere link público
5. Abra link em tela cheia
6. Verifique player automático
```

### Checklist
- [ ] Templates variados funcionam
- [ ] Ajustes de zoom/posição salvam
- [ ] Link público funciona
- [ ] Slides transitam automaticamente

---

## 15. N8N - WhatsApp AI Agent (P2)

**Responsável:** Testador 2

### Passos
```
1. Envie mensagem para WhatsApp da loja: 84999999999
2. Teste:
   - "Olá" → Saudação do agente
   - "Quais produtos vocês têm?" → Lista de produtos
   - "Quero um bolo de chocolate" → Adiciona ao carrinho
   - "Ver meu carrinho" → Mostra itens
   - "Finalizar pedido" → Inicia checkout
3. Envie áudio → Deve transcrever
4. Envie imagem → Deve analisar
```

### Checklist
- [ ] Agente responde em até 10s
- [ ] Consulta menu corretamente
- [ ] Adiciona produtos ao carrinho
- [ ] Gera link PIX para pagamento
- [ ] Transcrição de áudio funciona
- [ ] Análise de imagem funciona

---

## Formato de Relatório de Bug

```markdown
## Bug #[número]

**Teste:** [Nome do teste]
**Testador:** [1 ou 2]
**Data:** DD/MM/YYYY HH:MM
**Severidade:** 🔴 Crítico | 🟠 Alto | 🟡 Médio | 🟢 Baixo

### Descrição
[O que aconteceu vs o que deveria acontecer]

### Passos para Reproduzir
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

### URL
[URL onde o bug ocorreu]

### Screenshot/Vídeo
[Anexar evidência]

### Console Errors
```
[Copiar erros do console se houver]
```

### Observações
[Informações adicionais]
```

---

## Resumo de Status

| # | Teste | Responsável | Status |
|---|-------|-------------|--------|
| 1 | Login Painel Lojista | T2 | 🧪 Testing |
| 2 | Fluxo Retirada | T1 | ⏳ In Progress |
| 3 | Fluxo Delivery Cartão | T1 | ⏳ In Progress |
| 4 | Fluxo Pagar Entrega | T1 | ⏳ In Progress |
| 5 | Admin Vouchers | T1 | ⏳ In Progress |
| 6 | Dashboard Métricas | T2 | ⏳ In Progress |
| 7 | Gestão Pedidos | T2 | ⏳ In Progress |
| 8 | CRUD Produtos | T2 | ⏳ In Progress |
| 9 | Acesso Cliente | T1 | ⏳ In Progress |
| 10 | Acesso Lojista | T2 | ⏳ In Progress |
| 11 | Config Loja | T2 | ⏳ In Progress |
| 12 | KDS | T2 | ⏳ In Progress |
| 13 | VilaTok Stories | T2 | ⏳ In Progress |
| 14 | VilaTok TV | T2 | ⏳ In Progress |
| 15 | WhatsApp AI | T2 | ⏳ In Progress |

---

**Última atualização:** 14/12/2024
