# Manual do Administrador - VilaFood

## Índice
1. [Visão Geral](#visão-geral)
2. [Acesso ao Painel Admin](#acesso-ao-painel-admin)
3. [Dashboard Principal](#dashboard-principal)
4. [Gestão de Estabelecimentos](#gestão-de-estabelecimentos)
5. [Gestão de Usuários](#gestão-de-usuários)
6. [Gestão de Planos e Assinaturas](#gestão-de-planos-e-assinaturas)
7. [Central de Segurança](#central-de-segurança)
8. [Relatórios Financeiros](#relatórios-financeiros)
9. [Configurações do Sistema](#configurações-do-sistema)
10. [VilaTok TV](#vilatok-tv)
11. [Roadmap de Desenvolvimento](#roadmap-de-desenvolvimento)

---

## Visão Geral

O painel administrativo do VilaFood é o centro de controle da plataforma, permitindo gerenciar todos os aspectos do marketplace, desde estabelecimentos até configurações de segurança.

### Requisitos de Acesso
- Usuário com role `super_admin`
- Autenticação via email/senha
- Acesso apenas via `/admin`

---

## Acesso ao Painel Admin

### URL de Acesso
```
https://vilafood.delivery/admin
```

### Processo de Login
1. Acesse a URL do painel admin
2. Insira suas credenciais de super admin
3. Clique em "Entrar"

### Segurança
- Todas as ações são registradas em `admin_access_logs`
- Sessões expiram após período de inatividade
- Acesso a estabelecimentos é auditado

---

## Dashboard Principal

O dashboard (`/admin/dashboard`) apresenta métricas-chave da plataforma:

### Métricas Exibidas
- **Total de Estabelecimentos**: Quantidade de lojas ativas
- **Pedidos Hoje**: Número de pedidos do dia
- **Receita do Dia**: Valor total em vendas
- **Novos Clientes**: Cadastros do período

### Gráficos
- Vendas por período (7, 30, 90 dias)
- Estabelecimentos por categoria
- Pedidos por status

---

## Gestão de Estabelecimentos

### Listagem (`/admin/estabelecimentos`)
- Visualizar todos os estabelecimentos cadastrados
- Filtrar por status (ativo/inativo)
- Buscar por nome ou slug

### Ações Disponíveis
| Ação | Descrição |
|------|-----------|
| **Visualizar** | Ver detalhes do estabelecimento |
| **Editar** | Modificar informações básicas |
| **Acessar Painel** | Entrar no painel do lojista (auditado) |
| **Ativar/Desativar** | Controlar visibilidade no marketplace |
| **Alterar Plano** | Modificar assinatura |

### Acessar Painel do Lojista
Ao clicar em "Acessar Painel":
1. Sistema registra acesso em `admin_access_logs`
2. Admin é redirecionado ao painel do estabelecimento
3. Todas as ações são rastreadas para compliance

---

## Gestão de Usuários

### Listagem (`/admin/usuarios`)
- Visualizar todos os usuários do sistema
- Filtrar por role (admin, lojista, cliente, entregador)
- Ver estabelecimentos vinculados

### Tipos de Usuário
| Role | Descrição |
|------|-----------|
| `super_admin` | Acesso total à plataforma |
| `manager` | Gerente de estabelecimento |
| `cashier` | Operador de PDV |
| `waiter` | Garçom/Atendente |
| `kitchen` | Equipe de cozinha |
| `delivery` | Entregador |

### Ações
- Criar novo usuário admin
- Desativar contas
- Resetar senhas
- Vincular/desvincular de estabelecimentos

---

## Gestão de Planos e Assinaturas

### Planos Disponíveis
| Plano | Preço | Produtos | Recursos |
|-------|-------|----------|----------|
| **Gratuito** | R$0 | 10 | Básico |
| **Starter** | R$79,90/mês | 50 | + Marketplace |
| **Pro** | R$149,90/mês | Ilimitado | + Chatbot |
| **Business** | R$299,90/mês | Ilimitado | + Agente IA |

### Add-ons
- **Agente IA Avançado**: R$49,90/mês
- **Loja Adicional**: R$29,90/mês
- **Usuário Adicional**: R$9,90/mês

### Gerenciar Assinaturas (`/admin/planos`)
1. Visualizar assinaturas ativas
2. Alterar plano de estabelecimento
3. Aplicar descontos ou cupons
4. Gerenciar cobrança

---

## Central de Segurança

### Acesso (`/admin/central-seguranca`)

A Central de Segurança monitora a saúde e segurança da plataforma em tempo real.

### Verificações Automáticas
- **Políticas RLS**: Status das políticas de segurança
- **Edge Functions**: Autenticação JWT
- **Tokens de Pagamento**: Segurança de credenciais
- **Audit Trail**: Logs de ações

### Alertas de Anomalia
- Transações suspeitas
- Tentativas de acesso não autorizado
- Padrões de fraude detectados

### Configurações de Anomalia
```
Configurações > Anomaly Config
- Limite de transação: R$10.000
- Horário suspeito: 00:00 - 06:00
- Tentativas falhas: 5
```

---

## Relatórios Financeiros

### Dashboard Financeiro (`/admin/financeiro`)
- Receita total da plataforma
- Comissões a receber
- Pagamentos pendentes

### Relatórios Disponíveis
1. **DRE**: Demonstração de Resultado
2. **Fluxo de Caixa**: Entradas e saídas
3. **Comissões**: Por estabelecimento
4. **Repasses**: Pagamentos a afiliados

### Exportação
- CSV para Excel
- PDF para impressão
- Período personalizável

---

## Configurações do Sistema

### Categorias (`/admin/categorias`)
- Gerenciar categorias principais (Restaurantes, Lojas, Vilas)
- Criar/editar subcategorias (segmentos)
- Aprovar sugestões de categorias

### Cupons de Plataforma (`/admin/cupons`)
- Criar cupons promocionais
- Definir validade e limites de uso
- Vincular a planos específicos

### Banners (`/admin/banners`)
- Gerenciar banners do marketplace
- Definir ordem de exibição
- Agendar campanhas

### Cidades (`/admin/cidades`)
- Configurar áreas de serviço
- Definir cidade ativa (atualmente: Tamandaré)
- Gerenciar expansão geográfica

---

## VilaTok TV

### Gerenciamento (`/admin/vilatok-tv`)
- Visualizar vídeos de todos os estabelecimentos
- Moderar conteúdo
- Destacar vídeos no marketplace

### Configurações
- Filtrar por categoria
- Ordenar por engajamento
- Aprovar/reprovar conteúdo

---

## Roadmap de Desenvolvimento

### Acesso (`/admin/roadmap`)
O roadmap permite acompanhar o progresso de desenvolvimento da plataforma.

### Status de Items
| Status | Descrição |
|--------|-----------|
| `backlog` | Planejado |
| `in_progress` | Em desenvolvimento |
| `testing` | Em testes |
| `done` | Concluído |

### Funcionalidades
- Visualizar progresso por fase (Alfa, Beta, RC, Final)
- Avançar/retroceder status de items
- Filtrar por categoria e prioridade

---

## Procedimentos de Emergência

### Desativar Estabelecimento
1. Acesse `/admin/estabelecimentos`
2. Localize o estabelecimento
3. Clique em "Desativar"
4. Confirme a ação

### Bloquear Usuário
1. Acesse `/admin/usuarios`
2. Localize o usuário
3. Clique em "Desativar conta"
4. Registre o motivo

### Rollback de Transação
1. Acesse `/admin/financeiro`
2. Localize a transação
3. Clique em "Estornar"
4. Confirme com segundo admin

---

## Suporte Técnico

### Logs do Sistema
- Console logs disponíveis via ferramentas de desenvolvedor
- Edge Function logs via Supabase
- Database logs para debugging

### Contato
- **Email**: suporte@vilafood.delivery
- **WhatsApp**: Sistema interno de notificações

---

## Checklist Diário do Admin

- [ ] Verificar Dashboard de métricas
- [ ] Revisar alertas de segurança
- [ ] Verificar pedidos pendentes de atenção
- [ ] Revisar novos estabelecimentos
- [ ] Conferir relatório financeiro
- [ ] Verificar logs de anomalias

---

*Última atualização: Dezembro 2024*
*Versão do Sistema: v0.95.0 Beta*
