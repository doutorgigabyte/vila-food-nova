# 🧪 Guia de Testes - Fase 2: Testes Avançados VilaFood

**Data:** 13 de Dezembro de 2025  
**Preparado por:** Equipe VilaFood  
**Para:** Mano (Testador)  
**Versão:** 2.0

---

## 📋 Resumo da Fase Anterior

Na Fase 1, foram testados com sucesso:
- ✅ Navegação no marketplace
- ✅ Visualização de categorias e produtos
- ✅ Adição de produtos ao carrinho
- ✅ Página de checkout (parcial)
- ✅ Painel administrativo básico
- ✅ Lista de estabelecimentos

**Pontos NÃO testados que precisam de validação:**
- ⚠️ Fluxo completo de compra (loja estava fechada)
- ⚠️ Sistema de pagamento (PIX, Cartão, Pagar na Entrega)
- ⚠️ Cadastro e edição de produtos pelo lojista
- ⚠️ Sistema de cupons/vouchers
- ⚠️ Relatórios financeiros
- ⚠️ Funcionalidades do painel do lojista

---

## 🏪 IMPORTANTE: Loja para Testes

### Por que usar "Doces e Tortas"?

A maioria dos estabelecimentos cadastrados está com horário de funcionamento configurado para **fechado** no momento dos testes. O único estabelecimento com configuração que permite testes completos é:

| Estabelecimento | Status | Motivo |
|-----------------|--------|--------|
| Pizzaria | ❌ Fechada | Horário configurado fora do período de teste |
| Casa do Bolo | ❌ Fechada | Horário configurado fora do período de teste |
| Açaíteria | ❌ Fechada | Sem horário configurado |
| **Doces e Tortas** | ✅ **ABERTA** | Configurada para testes 24h |
| Outros 16 estabelecimentos | ❌ Fechados | Diversos motivos |

### Dados do Estabelecimento de Teste

```
📍 DOCES E TORTAS
- URL da Loja: https://vila-food-nova.lovable.app/loja/doces-e-tortas
- Categoria: Confeitaria / Doces
- Cidade: Jardim Gisela
- Status: ATIVO e ABERTO para pedidos
- Produtos: 10+ produtos cadastrados
- Pagamentos: PIX, Cartão e Dinheiro habilitados
```

---

## 🔐 Credenciais de Teste

### 1. SUPER ADMIN (Acesso Total)
```
📧 Email: admin@admin.com.br
🔑 Senha: admin123
🎯 Acesso: /admin (todas as funcionalidades)
```

### 2. LOJISTA (Doces e Tortas)
```
📧 Email: demo6@minhaveznodigital.com
🔑 Senha: Teste@123
🎯 Acesso: /painel/doces-e-tortas (painel do estabelecimento)
```

### 3. CLIENTE (Comprador)
```
📧 Email: cliente.teste@vilafood.delivery
🔑 Senha: Teste@123
🎯 Acesso: /marketplace e /loja/doces-e-tortas
```

> **NOTA:** Se alguma credencial não funcionar, usar o Super Admin para resetar a senha via /admin/usuarios

---

## 🎯 CENÁRIOS DE TESTE - FASE 2

---

## 📱 PARTE 1: TESTES DO CLIENTE (Comprador)

### Teste 1.1: Fluxo Completo de Compra - Retirada no Local

**Objetivo:** Validar compra completa sem delivery

**Passo a Passo:**
1. Abrir navegador anônimo (CTRL+SHIFT+N)
2. Acessar: `https://vila-food-nova.lovable.app/loja/doces-e-tortas`
3. Verificar se aparece **"Aberto"** no status da loja
4. Clicar em qualquer produto (ex: "Bolo de Chocolate")
5. Verificar:
   - [ ] Imagem carrega corretamente
   - [ ] Preço está visível
   - [ ] Descrição aparece
   - [ ] Campo de observações funciona
6. Clicar em **"Adicionar ao Carrinho"**
7. Verificar:
   - [ ] Toast de confirmação aparece
   - [ ] Contador do carrinho aumenta
8. Clicar no ícone do carrinho (canto superior direito)
9. Na página de checkout:
   - [ ] Selecionar **"Retirada no Local"**
   - [ ] Preencher nome e telefone (se solicitado)
10. Finalizar pedido
11. **Resultado Esperado:**
    - [ ] Pedido criado com sucesso
    - [ ] Número do pedido exibido
    - [ ] Sem cobrança de taxa de entrega

**Anotar:** Número do pedido gerado: ____________

---

### Teste 1.2: Fluxo Completo de Compra - Delivery + PIX

**Objetivo:** Validar compra com entrega e pagamento via PIX

**Passo a Passo:**
1. Acessar: `https://vila-food-nova.lovable.app/loja/doces-e-tortas`
2. Adicionar 2 produtos diferentes ao carrinho
3. Ir para o checkout
4. Selecionar **"Entrega"**
5. Preencher endereço:
   ```
   CEP: 55578-000 (ou outro válido da região)
   Rua: Rua de Teste, 123
   Bairro: Centro
   Complemento: Apto 101
   ```
6. Verificar:
   - [ ] Taxa de entrega é calculada
   - [ ] Tempo estimado aparece
7. Forma de pagamento: Selecionar **"PIX"**
8. Finalizar pedido
9. **Resultado Esperado:**
   - [ ] QR Code do PIX é gerado
   - [ ] Código Pix Copia e Cola aparece
   - [ ] Timer de expiração visível
   - [ ] Instruções claras

**Anotar:**
- Número do pedido: ____________
- QR Code gerou? [ ] Sim [ ] Não
- Valor total com taxa: R$ ____________

---

### Teste 1.3: Fluxo Completo de Compra - Delivery + Cartão

**Objetivo:** Validar pagamento com cartão de crédito

**Dados do Cartão de Teste (Mercado Pago Sandbox):**
```
Número: 5031 4332 1540 6351
CVV: 123
Validade: 11/25
Titular: APRO (aprovado) ou OTHE (outros)
CPF: 12345678909
```

**Passo a Passo:**
1. Adicionar produtos ao carrinho
2. Ir para checkout
3. Selecionar **"Entrega"** e preencher endereço
4. Forma de pagamento: **"Cartão de Crédito"**
5. Preencher dados do cartão de teste
6. Clicar em **"Pagar"**
7. **Resultado Esperado:**
   - [ ] Formulário de cartão aparece
   - [ ] Validação de campos funciona
   - [ ] Pagamento processado (ou mensagem de sandbox)
   - [ ] Pedido confirmado

**Anotar:**
- Mensagem exibida: ________________________________
- Pedido criado? [ ] Sim [ ] Não

---

### Teste 1.4: Fluxo de Compra - Pagar na Entrega

**Objetivo:** Validar opção de pagamento no ato da entrega

**Passo a Passo:**
1. Adicionar produto ao carrinho
2. Checkout → Entrega
3. Preencher endereço
4. Forma de pagamento: **"Pagar na Entrega"**
5. Verificar opções disponíveis:
   - [ ] Dinheiro (campo para troco aparece?)
   - [ ] Maquineta (débito/crédito)
6. Se dinheiro: Informar "Troco para R$ 100"
7. Finalizar
8. **Resultado Esperado:**
   - [ ] Pedido criado SEM cobrança imediata
   - [ ] Informação de pagamento na entrega visível

---

### Teste 1.5: Cupom de Desconto

**Objetivo:** Validar sistema de vouchers

**Passo a Passo:**
1. Ir para o checkout com produtos
2. Procurar campo **"Cupom de desconto"** ou **"Voucher"**
3. Inserir código de teste: `TESTE10` ou `DESCONTO`
4. Clicar em aplicar
5. **Resultado Esperado:**
   - [ ] Se cupom válido: desconto aplicado
   - [ ] Se inválido: mensagem de erro clara

**Anotar:** Cupom funcionou? ____________

---

## 🏬 PARTE 2: TESTES DO LOJISTA (Estabelecimento)

### Login no Painel do Lojista
```
URL: https://vila-food-nova.lovable.app/auth
Email: demo6@minhaveznodigital.com
Senha: Teste@123
```

Após login, acessar: `/painel/doces-e-tortas`

---

### Teste 2.1: Dashboard do Lojista

**Verificar se aparecem:**
- [ ] Resumo de vendas do dia
- [ ] Pedidos pendentes
- [ ] Gráfico de vendas
- [ ] Botões de acesso rápido
- [ ] Status online/offline da loja

---

### Teste 2.2: Gerenciamento de Pedidos

**Passo a Passo:**
1. Acessar menu **"Pedidos"** ou **"Gestão de Pedidos"**
2. Verificar:
   - [ ] Lista de pedidos aparece
   - [ ] Status dos pedidos (Pendente, Confirmado, Pronto, etc.)
   - [ ] Detalhes do pedido ao clicar
3. Tentar mudar status de um pedido:
   - Pendente → Confirmado
   - Confirmado → Em Preparo
   - Em Preparo → Pronto
4. **Resultado Esperado:**
   - [ ] Status atualiza em tempo real
   - [ ] Notificação enviada (se configurado)

---

### Teste 2.3: Cadastro de Novo Produto

**Passo a Passo:**
1. Acessar menu **"Produtos"** ou **"Cardápio"**
2. Clicar em **"Adicionar Produto"** ou **"+"**
3. Preencher:
   ```
   Nome: Bolo de Teste
   Descrição: Produto criado para teste do sistema
   Preço: R$ 45,00
   Categoria: Bolos
   Tempo de Preparo: 30 min
   ```
4. Fazer upload de uma imagem
5. Marcar como **"Ativo"**
6. Salvar
7. **Resultado Esperado:**
   - [ ] Produto salvo com sucesso
   - [ ] Aparece na lista de produtos
   - [ ] Visível na loja pública

**Anotar:** Produto criado? ____________

---

### Teste 2.4: Editar Produto Existente

**Passo a Passo:**
1. Na lista de produtos, clicar em **"Editar"** em qualquer produto
2. Alterar o preço (ex: de R$25 para R$27)
3. Salvar
4. Verificar na loja pública se o preço atualizou
5. **Resultado Esperado:**
   - [ ] Alteração salva
   - [ ] Reflete na loja do cliente

---

### Teste 2.5: Configurações da Loja

**Acessar:** Menu → Configurações

**Verificar e testar:**

**Aba Perfil:**
- [ ] Alterar nome da loja
- [ ] Alterar descrição
- [ ] Upload de logo
- [ ] Upload de banner

**Aba Horários:**
- [ ] Configurar horário de funcionamento
- [ ] Ativar/desativar dias

**Aba Pagamentos:**
- [ ] PIX habilitado?
- [ ] Cartão habilitado?
- [ ] Dinheiro habilitado?
- [ ] Conexão com Mercado Pago

**Aba Entrega:**
- [ ] Taxas por bairro configuradas?
- [ ] Tempo estimado de entrega

---

### Teste 2.6: VilaTok TV (Slides para TV)

**Se disponível no menu:**
1. Acessar **"VilaTok TV"** ou **"Slides"**
2. Verificar:
   - [ ] Lista de slides existentes
   - [ ] Botão de adicionar novo slide
3. Criar um novo slide de teste
4. **Resultado Esperado:**
   - [ ] Slide criado com sucesso
   - [ ] Preview funciona

---

## 👑 PARTE 3: TESTES DO ADMINISTRADOR

### Login Admin
```
URL: https://vila-food-nova.lovable.app/auth
Email: admin@admin.com.br
Senha: admin123
```

Após login, acessar: `/admin`

---

### Teste 3.1: Dashboard Administrativo

**Verificar métricas:**
- [ ] Total de estabelecimentos
- [ ] Total de usuários
- [ ] Receita do período
- [ ] Gráficos de performance

---

### Teste 3.2: Gerenciamento de Estabelecimentos

**Passo a Passo:**
1. Menu → **Estabelecimentos**
2. Verificar:
   - [ ] Lista completa carrega
   - [ ] Busca funciona
   - [ ] Filtro por status funciona
3. Clicar em **"Acessar Painel"** de qualquer loja
4. **Resultado Esperado:**
   - [ ] Acesso ao painel da loja como admin
   - [ ] Log de acesso registrado

---

### Teste 3.3: Gerenciamento de Usuários

**Passo a Passo:**
1. Menu → **Usuários**
2. Verificar:
   - [ ] Lista de usuários carrega
   - [ ] Informações visíveis (nome, email, role)
3. Tentar editar um usuário
4. Tentar criar novo usuário
5. **Resultado Esperado:**
   - [ ] CRUD de usuários funciona

---

### Teste 3.4: Sistema de Vouchers/Cupons

**Passo a Passo:**
1. Menu → **Vouchers**
2. Criar novo cupom:
   ```
   Código: TESTE50
   Tipo: Percentual
   Valor: 50%
   Uso máximo: 10
   Válido até: [data futura]
   ```
3. Salvar
4. **Testar:** Usar o cupom no checkout como cliente
5. **Resultado Esperado:**
   - [ ] Cupom criado
   - [ ] Funciona no checkout

---

### Teste 3.5: Relatórios

**Passo a Passo:**
1. Menu → **Relatórios**
2. Verificar relatórios disponíveis:
   - [ ] Vendas por período
   - [ ] Vendas por estabelecimento
   - [ ] Produtos mais vendidos
3. Gerar um relatório
4. Exportar (se disponível)
5. **Resultado Esperado:**
   - [ ] Dados corretos
   - [ ] Exportação funciona

---

### Teste 3.6: Financeiro

**Passo a Passo:**
1. Menu → **Financeiro**
2. Verificar:
   - [ ] Resumo de receitas
   - [ ] Comissões pendentes
   - [ ] Histórico de pagamentos
3. **Resultado Esperado:**
   - [ ] Dados consistentes com pedidos realizados

---

### Teste 3.7: Central de Segurança

**Passo a Passo:**
1. Menu → **Central de Segurança** (se disponível)
2. Verificar:
   - [ ] Status das políticas RLS
   - [ ] Alertas de segurança
   - [ ] Logs de acesso admin

---

## 📊 CHECKLIST FINAL DE VALIDAÇÃO

### Fluxo do Cliente
| Teste | Status | Observação |
|-------|--------|------------|
| Navegação no marketplace | ⬜ | |
| Visualização de loja | ⬜ | |
| Adicionar ao carrinho | ⬜ | |
| Checkout - Retirada | ⬜ | |
| Checkout - Delivery PIX | ⬜ | |
| Checkout - Delivery Cartão | ⬜ | |
| Checkout - Pagar na Entrega | ⬜ | |
| Cupom de desconto | ⬜ | |

### Fluxo do Lojista
| Teste | Status | Observação |
|-------|--------|------------|
| Login no painel | ⬜ | |
| Dashboard com métricas | ⬜ | |
| Ver pedidos | ⬜ | |
| Alterar status pedido | ⬜ | |
| Cadastrar produto | ⬜ | |
| Editar produto | ⬜ | |
| Configurações da loja | ⬜ | |
| VilaTok TV | ⬜ | |

### Fluxo do Admin
| Teste | Status | Observação |
|-------|--------|------------|
| Dashboard admin | ⬜ | |
| Gerenciar estabelecimentos | ⬜ | |
| Acessar painel de loja | ⬜ | |
| Gerenciar usuários | ⬜ | |
| Criar voucher | ⬜ | |
| Relatórios | ⬜ | |
| Financeiro | ⬜ | |

---

## 🐛 FORMATO PARA REPORTAR BUGS

Se encontrar algum problema, anotar no seguinte formato:

```
🐛 BUG #[número]
📍 Localização: [URL ou tela onde ocorreu]
📝 Descrição: [O que aconteceu]
🔄 Passos para reproduzir:
   1. ...
   2. ...
   3. ...
⚠️ Resultado obtido: [O que aconteceu]
✅ Resultado esperado: [O que deveria acontecer]
📸 Screenshot: [Se possível, anexar]
```

---

## 📞 Suporte

Em caso de dúvidas ou problemas com as credenciais:
- Contatar a equipe de desenvolvimento
- Usar o Super Admin para resetar senhas

---

**Boa sorte nos testes! 🚀**
