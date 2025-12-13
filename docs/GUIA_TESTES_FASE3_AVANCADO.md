# 🧪 VilaFood - Guia de Testes Beta Avançados (Fase 3)

> **Versão:** 3.0  
> **Data:** Dezembro 2024  
> **Nível:** Avançado  
> **Pré-requisitos:** Ter completado as Fases 1 e 2

---

## 📋 Índice

1. [Objetivo](#objetivo)
2. [Ambiente de Testes](#ambiente-de-testes)
3. [Credenciais de Acesso](#credenciais-de-acesso)
4. [Testes do Sistema VilaTok](#testes-do-sistema-vilatok)
5. [Testes do Agente IA WhatsApp](#testes-do-agente-ia-whatsapp)
6. [Testes do Sistema de Entregas](#testes-do-sistema-de-entregas)
7. [Testes do PDV e Comandas](#testes-do-pdv-e-comandas)
8. [Testes do KDS (Kitchen Display System)](#testes-do-kds)
9. [Testes de Pagamentos Avançados](#testes-de-pagamentos-avancados)
10. [Testes de Relatórios e Analytics](#testes-de-relatorios-e-analytics)
11. [Testes de Segurança](#testes-de-seguranca)
12. [Testes de Integrações](#testes-de-integracoes)
13. [Testes de Performance](#testes-de-performance)
14. [Checklist Final](#checklist-final)
15. [Formato de Reporte de Bugs](#formato-de-reporte-de-bugs)

---

## 🎯 Objetivo

Este guia cobre testes avançados que validam funcionalidades complexas do VilaFood, incluindo:
- Sistema VilaTok (Stories e TV)
- Agente IA via WhatsApp
- Fluxo completo de entregas com rastreamento
- Sistema de PDV e Comandas
- Kitchen Display System (KDS)
- Integrações de pagamento (Mercado Pago, PagSeguro)
- Relatórios financeiros avançados
- Segurança e controle de acesso

---

## 🌐 Ambiente de Testes

### URLs Principais
| Ambiente | URL |
|----------|-----|
| Marketplace | `https://vilafood.delivery` |
| Painel Admin | `https://vilafood.delivery/admin` |
| Painel Lojista | `https://[slug].vilafood.delivery/painel` |
| Loja Teste | `https://doces-e-tortas.vilafood.delivery` |

### Estabelecimento de Teste Principal
- **Nome:** Doces e Tortas
- **ID:** `4c9b12fb-a4c6-453d-87c2-6a9c9b6b1491`
- **Funcionamento:** 24 horas (para testes)
- **WhatsApp:** 84 99999-9999

---

## 🔑 Credenciais de Acesso

### Super Administrador
```
Email: admin@vilafood.delivery
Senha: [solicitar ao desenvolvedor]
Acesso: /admin
```

### Lojista (Proprietário)
```
Email: doutorgigabyte.ti@gmail.com
Senha: [solicitar ao desenvolvedor]
Acesso: /painel/doces-e-tortas
```

### Entregador
```
Email: entregador@teste.com
Senha: [solicitar ao desenvolvedor]
Acesso: /entregador
```

### Cliente
```
Email: cliente@teste.com
Senha: [solicitar ao desenvolvedor]
Telefone: 84 98888-7777
```

---

## 📱 Testes do Sistema VilaTok

### 5.1 VilaTok Stories (Vertical)

#### Teste VS-01: Criação de Story
**Objetivo:** Validar criação de story com produto vinculado

**Passos:**
1. Acesse `/painel/doces-e-tortas/vilatok`
2. Clique em "Novo Story"
3. Faça upload de uma imagem vertical (9:16)
4. Adicione título e descrição
5. Vincule a um produto existente
6. Marque "Exibir na loja" e "Exibir no marketplace"
7. Salve o story

**Resultado Esperado:**
- [ ] Upload funciona sem erros
- [ ] Preview mostra story corretamente
- [ ] Story aparece na lista após salvar
- [ ] Story aparece no menu digital da loja
- [ ] Story aparece no marketplace (se marcado)

#### Teste VS-02: Visualização de Stories
**Objetivo:** Validar experiência de visualização como cliente

**Passos:**
1. Acesse a loja como cliente anônimo
2. Localize os stories no topo da página
3. Clique em um story para abrir
4. Navegue entre stories (swipe ou clique)
5. Clique no produto vinculado

**Resultado Esperado:**
- [ ] Stories carregam rapidamente
- [ ] Navegação fluida entre stories
- [ ] Clique no produto redireciona corretamente
- [ ] Contador de visualizações incrementa
- [ ] Botão "Eu quero!" funciona

#### Teste VS-03: Repostagem Automática
**Objetivo:** Validar configuração de repostagem

**Passos:**
1. Edite um story existente
2. Configure dias de repostagem (ex: Segunda, Quarta, Sexta)
3. Salve as configurações
4. Verifique se a programação foi salva

**Resultado Esperado:**
- [ ] Dias de repostagem salvos corretamente
- [ ] Interface mostra dias configurados
- [ ] Story respeita limites do plano

---

### 5.2 VilaTok TV (Horizontal)

#### Teste VT-01: Criação de Slide
**Objetivo:** Validar criação de slide para TV

**Passos:**
1. Acesse `/painel/doces-e-tortas/vilatok-tv`
2. Clique em "Novo Slide"
3. Selecione um template (ex: `product_showcase`)
4. Faça upload de imagem horizontal
5. Ajuste posição e zoom da imagem
6. Vincule a um produto
7. Configure tempo de exibição (ex: 10 segundos)
8. Salve o slide

**Resultado Esperado:**
- [ ] Galeria de templates exibe 30 opções
- [ ] Preview mostra slide em tempo real
- [ ] Controles de zoom/posição funcionam
- [ ] Produto vinculado exibe nome, preço e QR Code
- [ ] Slide salvo aparece na lista

#### Teste VT-02: Visualização na TV
**Objetivo:** Validar player de TV

**Passos:**
1. Acesse `/painel/doces-e-tortas/vilatok-tv`
2. Clique em "Gerar Link Público"
3. Copie o link gerado
4. Abra o link em uma nova aba (simule TV)
5. Observe a transição automática entre slides

**Resultado Esperado:**
- [ ] Link público funciona sem login
- [ ] Slides transitam automaticamente
- [ ] QR Codes são legíveis
- [ ] Logo do estabelecimento aparece
- [ ] Footer com redes sociais visível
- [ ] Cores respeitam paleta do estabelecimento

#### Teste VT-03: Variação de Templates
**Objetivo:** Validar todos os templates

**Passos:**
1. Crie slides usando cada um dos 30 templates
2. Verifique consistência visual de cada um
3. Valide que todos exibem corretamente no player

**Templates a testar:**
- [ ] minimal
- [ ] product_showcase
- [ ] promo
- [ ] full_image
- [ ] blob_modern
- [ ] polaroid
- [ ] diamond
- [ ] diagonal
- [ ] menu_grid
- [ ] special_day
- [ ] catering
- [ ] circles
- [ ] clean_white
- [ ] neon_glow
- [ ] pop_art
- [ ] gradient_burst
- [ ] retro_70s
- [ ] art_deco
- [ ] zen_simple
- [ ] glass_card
- [ ] hexagon
- [ ] heart
- [ ] triangle
- [ ] wave
- [ ] arch
- [ ] watermelon
- [ ] mask
- [ ] tree
- [ ] pill
- [ ] cutout

---

## 🤖 Testes do Agente IA WhatsApp

### 6.1 Configuração do Agente

#### Teste WA-01: Conexão da Instância
**Objetivo:** Validar conexão WhatsApp via Evolution API

**Passos:**
1. Acesse `/painel/doces-e-tortas/configuracoes`
2. Vá para aba "IA"
3. Ative o Agente IA
4. Configure o prompt do sistema
5. Salve as configurações

**Resultado Esperado:**
- [ ] Toggle de ativação funciona
- [ ] Prompt é salvo corretamente
- [ ] Status da instância WhatsApp exibido

### 6.2 Fluxo de Atendimento

#### Teste WA-02: Saudação e Menu
**Objetivo:** Validar resposta inicial do agente

**Passos:**
1. Envie "Olá" para o WhatsApp da loja
2. Aguarde resposta do agente
3. Solicite ver o cardápio

**Resultado Esperado:**
- [ ] Agente responde em até 5 segundos
- [ ] Saudação personalizada com nome da loja
- [ ] Menu apresentado de forma clara
- [ ] Links/fotos de produtos enviados

#### Teste WA-03: Busca de Produtos
**Objetivo:** Validar busca por produto

**Passos:**
1. Envie "Quero ver bolos"
2. Aguarde resposta com produtos
3. Solicite detalhes de um produto específico

**Resultado Esperado:**
- [ ] Agente encontra produtos da categoria
- [ ] Envia fotos dos produtos
- [ ] Mostra preços corretamente
- [ ] Oferece adicionar ao carrinho

#### Teste WA-04: Carrinho e Pedido
**Objetivo:** Validar fluxo completo de pedido

**Passos:**
1. Adicione 2 produtos ao carrinho via chat
2. Solicite ver o carrinho
3. Confirme o pedido
4. Forneça endereço de entrega
5. Escolha forma de pagamento (PIX)
6. Receba QR Code do PIX

**Resultado Esperado:**
- [ ] Carrinho mostra itens corretamente
- [ ] Total calculado corretamente
- [ ] Taxa de entrega aplicada
- [ ] QR Code PIX gerado e enviado
- [ ] Pedido criado no sistema
- [ ] Notificação enviada ao lojista

#### Teste WA-05: Acompanhamento de Pedido
**Objetivo:** Validar status do pedido via WhatsApp

**Passos:**
1. Após criar pedido, pergunte "Status do meu pedido"
2. Aguarde resposta com status atual

**Resultado Esperado:**
- [ ] Agente identifica pedido do cliente
- [ ] Status atual exibido corretamente
- [ ] Tempo estimado informado (se aplicável)

---

## 🚗 Testes do Sistema de Entregas

### 7.1 Gestão de Entregadores

#### Teste DE-01: Cadastro de Entregador
**Objetivo:** Validar cadastro completo

**Passos:**
1. Acesse `/painel/doces-e-tortas/entregadores`
2. Clique em "Novo Entregador"
3. Preencha todos os dados:
   - Nome completo
   - Telefone/WhatsApp
   - Email
   - Tipo de veículo (Moto/Bike/Carro)
   - Placa (se aplicável)
   - Chave PIX
4. Salve o cadastro
5. Ative o entregador

**Resultado Esperado:**
- [ ] Cadastro salvo com sucesso
- [ ] Email de convite enviado
- [ ] Entregador aparece na lista
- [ ] Status inicial: Inativo

#### Teste DE-02: Login do Entregador
**Objetivo:** Validar acesso do entregador

**Passos:**
1. Acesse `/entregador`
2. Faça login com credenciais do entregador
3. Verifique dashboard do entregador

**Resultado Esperado:**
- [ ] Login funciona corretamente
- [ ] Dashboard exibe entregas disponíveis
- [ ] Botão "Ficar Disponível" funciona
- [ ] Mapa de entregas carrega

### 7.2 Fluxo de Entrega

#### Teste DE-03: Aceitar Entrega
**Objetivo:** Validar aceitação de corrida

**Passos:**
1. Crie um pedido de delivery como cliente
2. Como lojista, confirme o pedido
3. Como lojista, marque como "Pronto para entrega"
4. Como entregador, verifique notificação
5. Aceite a entrega

**Resultado Esperado:**
- [ ] Notificação push recebida pelo entregador
- [ ] Detalhes da entrega exibidos (endereço, valor)
- [ ] Botão aceitar funciona
- [ ] Status do pedido atualiza para "Em entrega"
- [ ] Cliente recebe notificação

#### Teste DE-04: Rastreamento em Tempo Real
**Objetivo:** Validar rastreamento GPS

**Passos:**
1. Com entrega aceita, ative rastreamento
2. Simule movimento (mude localização)
3. Verifique atualização no mapa do cliente
4. Verifique atualização no painel do lojista

**Resultado Esperado:**
- [ ] Localização atualiza em tempo real
- [ ] Mapa mostra rota até o destino
- [ ] ETA atualiza conforme movimento
- [ ] Cliente vê posição do entregador

#### Teste DE-05: Finalização de Entrega
**Objetivo:** Validar conclusão

**Passos:**
1. Como entregador, chegue ao destino
2. Marque como "Entregue"
3. (Opcional) Tire foto de comprovação
4. Confirme finalização

**Resultado Esperado:**
- [ ] Status atualiza para "Entregue"
- [ ] Tempo de entrega registrado
- [ ] Avaliação solicitada ao cliente
- [ ] Ganhos do entregador atualizados
- [ ] Pedido movido para histórico

---

## 💳 Testes do PDV e Comandas

### 8.1 PDV (Ponto de Venda)

#### Teste PDV-01: Venda Rápida
**Objetivo:** Validar venda no balcão

**Passos:**
1. Acesse `/painel/doces-e-tortas/pdv`
2. Adicione produtos ao carrinho
3. Aplique desconto (se aplicável)
4. Selecione forma de pagamento: Dinheiro
5. Insira valor recebido
6. Finalize venda

**Resultado Esperado:**
- [ ] Produtos adicionados corretamente
- [ ] Cálculo de troco correto
- [ ] Recibo gerado
- [ ] Pedido registrado no sistema
- [ ] Caixa atualizado

#### Teste PDV-02: Venda com Cartão (Maquininha)
**Objetivo:** Validar integração com Point

**Passos:**
1. Crie venda no PDV
2. Selecione "Cartão - Maquininha"
3. Verifique se maquininha recebe comando
4. Confirme pagamento

**Resultado Esperado:**
- [ ] Maquininha ativada automaticamente
- [ ] Valor correto exibido na maquininha
- [ ] Confirmação retorna ao PDV
- [ ] Venda finalizada com sucesso

### 8.2 Sistema de Comandas

#### Teste CM-01: Abrir Comanda
**Objetivo:** Validar abertura de comanda

**Passos:**
1. Acesse `/painel/doces-e-tortas/comandas`
2. Clique em "Nova Comanda"
3. Selecione mesa ou digite nome do cliente
4. Adicione itens à comanda
5. Salve a comanda

**Resultado Esperado:**
- [ ] Comanda criada com número único
- [ ] Itens salvos corretamente
- [ ] Comanda visível na lista de abertas
- [ ] Pedido enviado para cozinha

#### Teste CM-02: Adicionar Itens
**Objetivo:** Validar adição posterior

**Passos:**
1. Abra comanda existente
2. Adicione novos itens
3. Salve alterações

**Resultado Esperado:**
- [ ] Novos itens adicionados
- [ ] Total atualizado
- [ ] Histórico de alterações mantido
- [ ] Cozinha notificada dos novos itens

#### Teste CM-03: Fechar Comanda
**Objetivo:** Validar fechamento e pagamento

**Passos:**
1. Selecione comanda para fechar
2. Revise todos os itens
3. Aplique taxa de serviço (10%)
4. Divida conta (se aplicável)
5. Processe pagamento

**Resultado Esperado:**
- [ ] Total com taxa calculado corretamente
- [ ] Divisão de conta funciona
- [ ] Múltiplas formas de pagamento aceitas
- [ ] Comanda fechada com sucesso
- [ ] Relatório de vendas atualizado

---

## 🍳 Testes do KDS (Kitchen Display System)

### Teste KDS-01: Exibição de Pedidos

**Objetivo:** Validar visualização na cozinha

**Passos:**
1. Acesse `/painel/doces-e-tortas/cozinha`
2. Crie um pedido como cliente
3. Confirme o pedido como lojista
4. Observe o pedido aparecer no KDS

**Resultado Esperado:**
- [ ] Pedido aparece automaticamente
- [ ] Som de notificação toca
- [ ] Alerta visual (splash) exibido
- [ ] Informações claras e legíveis:
  - Número do pedido
  - Itens e quantidades
  - Observações destacadas
  - Tempo desde criação

### Teste KDS-02: Fluxo de Preparo

**Objetivo:** Validar progressão de status

**Passos:**
1. Com pedido no KDS, clique em "Iniciar Preparo"
2. Observe mudança de cor/status
3. Clique em "Pronto"
4. Verifique remoção da lista

**Resultado Esperado:**
- [ ] Status muda para "Preparando" (amarelo)
- [ ] Timer de preparo inicia
- [ ] Status muda para "Pronto" (verde)
- [ ] Pedido move para seção "Prontos"
- [ ] Notificação enviada (se delivery)

### Teste KDS-03: Link Público para TV

**Objetivo:** Validar acesso sem login

**Passos:**
1. Gere link público do KDS
2. Abra em TV/monitor da cozinha
3. Crie pedidos e observe atualização

**Resultado Esperado:**
- [ ] Link funciona sem autenticação
- [ ] Layout otimizado para TV
- [ ] Atualização em tempo real
- [ ] Sons de alerta funcionam

---

## 💰 Testes de Pagamentos Avançados

### 10.1 Mercado Pago

#### Teste MP-01: Conexão OAuth
**Objetivo:** Validar integração OAuth

**Passos:**
1. Acesse Configurações > Pagamentos
2. Clique em "Conectar Mercado Pago"
3. Faça login na conta MP
4. Autorize a aplicação
5. Verifique retorno ao painel

**Resultado Esperado:**
- [ ] Redirecionamento para MP funciona
- [ ] Login e autorização OK
- [ ] Retorno ao painel com sucesso
- [ ] Credenciais salvas
- [ ] Status: "Conectado"

#### Teste MP-02: Pagamento PIX
**Objetivo:** Validar geração de PIX

**Passos:**
1. Crie pedido como cliente
2. Selecione PIX como pagamento
3. Aguarde QR Code
4. Escaneie com app bancário
5. Confirme pagamento

**Resultado Esperado:**
- [ ] QR Code gerado corretamente
- [ ] Código copia e cola disponível
- [ ] Webhook recebe confirmação
- [ ] Pedido atualiza para "Pago"
- [ ] Lojista recebe notificação

### 10.2 Split de Pagamentos

#### Teste SP-01: Comissão de Afiliado
**Objetivo:** Validar split para afiliado

**Passos:**
1. Cadastre cliente via link de afiliado (?ref=CODIGO)
2. Cliente faz pedido e paga
3. Verifique comissão do afiliado

**Resultado Esperado:**
- [ ] Cliente vinculado ao afiliado
- [ ] Comissão calculada corretamente
- [ ] Split registrado no sistema
- [ ] Afiliado vê comissão no dashboard

---

## 📊 Testes de Relatórios e Analytics

### Teste RL-01: DRE Automático
**Objetivo:** Validar demonstrativo financeiro

**Passos:**
1. Acesse `/painel/doces-e-tortas/dre`
2. Selecione período (último mês)
3. Gere relatório

**Resultado Esperado:**
- [ ] Receitas calculadas corretamente
- [ ] Custos categorizados
- [ ] Lucro/prejuízo calculado
- [ ] Gráficos renderizam
- [ ] Exportação PDF funciona

### Teste RL-02: Curva ABC
**Objetivo:** Validar análise de produtos

**Passos:**
1. Acesse análise ABC de produtos
2. Verifique classificação A/B/C
3. Analise produtos mais vendidos

**Resultado Esperado:**
- [ ] Produtos classificados corretamente
- [ ] Percentuais de participação corretos
- [ ] Visualização gráfica funciona
- [ ] Filtros por período funcionam

### Teste RL-03: Relatório de Vendas
**Objetivo:** Validar relatório detalhado

**Passos:**
1. Acesse relatórios de vendas
2. Aplique filtros (data, forma pagamento, status)
3. Exporte para Excel

**Resultado Esperado:**
- [ ] Dados filtrados corretamente
- [ ] Totalizadores corretos
- [ ] Exportação funciona
- [ ] Arquivo Excel legível

---

## 🔐 Testes de Segurança

### Teste SEC-01: Controle de Acesso por Cargo
**Objetivo:** Validar permissões por função

**Passos:**
1. Crie usuário com cargo "Atendente"
2. Faça login com esse usuário
3. Tente acessar Configurações
4. Tente acessar Relatórios Financeiros

**Resultado Esperado:**
- [ ] Acesso a Configurações bloqueado
- [ ] Acesso a Financeiro bloqueado
- [ ] Mensagem de permissão negada exibida
- [ ] Apenas funções permitidas visíveis

### Teste SEC-02: Auditoria de Ações
**Objetivo:** Validar log de atividades

**Passos:**
1. Como Super Admin, acesse logs de auditoria
2. Realize ações (editar produto, excluir pedido)
3. Verifique registro no log

**Resultado Esperado:**
- [ ] Ações registradas com timestamp
- [ ] Usuário identificado
- [ ] Detalhes da ação registrados
- [ ] IP/User Agent capturados

### Teste SEC-03: Acesso Admin a Painéis
**Objetivo:** Validar acesso cruzado

**Passos:**
1. Como Super Admin, acesse lista de estabelecimentos
2. Clique em "Acessar Painel" de um estabelecimento
3. Navegue pelo painel
4. Verifique log de acesso

**Resultado Esperado:**
- [ ] Acesso concedido ao painel
- [ ] Banner indicando acesso admin
- [ ] Ação logada em admin_access_logs
- [ ] Botão "Sair do Painel" visível

---

## 🔌 Testes de Integrações

### Teste INT-01: Evolution API (WhatsApp)
**Objetivo:** Validar conexão WhatsApp

**Passos:**
1. Acesse configurações de WhatsApp
2. Verifique status da instância
3. Envie mensagem de teste

**Resultado Esperado:**
- [ ] Status "Conectado" exibido
- [ ] QR Code disponível (se desconectado)
- [ ] Mensagem de teste enviada
- [ ] Webhook recebendo mensagens

### Teste INT-02: Analytics (Pixels)
**Objetivo:** Validar tracking

**Passos:**
1. Configure Facebook Pixel ID
2. Acesse a loja como cliente
3. Adicione produto ao carrinho
4. Verifique eventos no Facebook Events Manager

**Resultado Esperado:**
- [ ] PageView disparado
- [ ] AddToCart disparado com dados corretos
- [ ] Purchase disparado após compra

---

## ⚡ Testes de Performance

### Teste PERF-01: Carregamento do Cardápio
**Objetivo:** Validar velocidade

**Passos:**
1. Acesse a loja com cache limpo
2. Meça tempo de carregamento
3. Navegue entre categorias

**Meta:** < 3 segundos para First Contentful Paint

### Teste PERF-02: Realtime Updates
**Objetivo:** Validar latência

**Passos:**
1. Abra KDS em uma aba
2. Crie pedido em outra aba
3. Meça tempo até aparecer no KDS

**Meta:** < 2 segundos de latência

---

## ✅ Checklist Final

### Sistema VilaTok
| Teste | Status | Observações |
|-------|--------|-------------|
| Stories - Criação | ⬜ | |
| Stories - Visualização | ⬜ | |
| Stories - Repostagem | ⬜ | |
| TV - Criação de Slide | ⬜ | |
| TV - Player Público | ⬜ | |
| TV - Todos Templates | ⬜ | |

### Agente IA WhatsApp
| Teste | Status | Observações |
|-------|--------|-------------|
| Conexão Instância | ⬜ | |
| Saudação | ⬜ | |
| Busca Produtos | ⬜ | |
| Carrinho/Pedido | ⬜ | |
| Acompanhamento | ⬜ | |

### Sistema de Entregas
| Teste | Status | Observações |
|-------|--------|-------------|
| Cadastro Entregador | ⬜ | |
| Login Entregador | ⬜ | |
| Aceitar Entrega | ⬜ | |
| Rastreamento | ⬜ | |
| Finalização | ⬜ | |

### PDV e Comandas
| Teste | Status | Observações |
|-------|--------|-------------|
| Venda Dinheiro | ⬜ | |
| Venda Cartão | ⬜ | |
| Abrir Comanda | ⬜ | |
| Adicionar Itens | ⬜ | |
| Fechar Comanda | ⬜ | |

### KDS
| Teste | Status | Observações |
|-------|--------|-------------|
| Exibição Pedidos | ⬜ | |
| Fluxo Preparo | ⬜ | |
| Link Público | ⬜ | |

### Pagamentos
| Teste | Status | Observações |
|-------|--------|-------------|
| OAuth Mercado Pago | ⬜ | |
| Pagamento PIX | ⬜ | |
| Split Afiliado | ⬜ | |

### Relatórios
| Teste | Status | Observações |
|-------|--------|-------------|
| DRE Automático | ⬜ | |
| Curva ABC | ⬜ | |
| Relatório Vendas | ⬜ | |

### Segurança
| Teste | Status | Observações |
|-------|--------|-------------|
| Controle de Acesso | ⬜ | |
| Auditoria | ⬜ | |
| Acesso Admin | ⬜ | |

### Integrações
| Teste | Status | Observações |
|-------|--------|-------------|
| Evolution API | ⬜ | |
| Analytics Pixels | ⬜ | |

### Performance
| Teste | Status | Observações |
|-------|--------|-------------|
| Carregamento Cardápio | ⬜ | |
| Realtime Updates | ⬜ | |

---

## 🐛 Formato de Reporte de Bugs

```markdown
## Bug #[NÚMERO]

**Localização:** [Página/Componente]
**Severidade:** [Crítica/Alta/Média/Baixa]
**Teste Relacionado:** [ID do teste, ex: VT-02]

### Descrição
[Descrição clara do problema]

### Passos para Reproduzir
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

### Resultado Esperado
[O que deveria acontecer]

### Resultado Atual
[O que está acontecendo]

### Evidências
[Screenshots, vídeos, logs]

### Ambiente
- Navegador: [Chrome 120, Safari 17, etc]
- Dispositivo: [Desktop, iPhone 15, Samsung S24]
- Data/Hora: [DD/MM/YYYY HH:MM]
```

---

## 📝 Notas Importantes

1. **Ordem de Execução:** Siga a ordem dos testes, pois alguns dependem de dados criados em testes anteriores.

2. **Ambiente Limpo:** Antes de iniciar, verifique se o ambiente de testes está configurado corretamente.

3. **Documentação:** Documente TODOS os bugs encontrados, mesmo os menores.

4. **Comunicação:** Reporte bugs críticos imediatamente via canal de comunicação prioritário.

5. **Horários:** Testes de WhatsApp devem considerar horários de funcionamento configurados.

6. **Pagamentos:** Use ambiente de sandbox do Mercado Pago para testes de pagamento.

---

**Última atualização:** Dezembro 2024  
**Responsável:** Equipe de QA VilaFood
