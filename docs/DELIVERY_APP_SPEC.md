# VilaFood - Especificação Técnica do App do Entregador

## Visão Geral

App nativo para entregadores do VilaFood, disponível para Android e iOS via Play Store e App Store. O app sincroniza em tempo real com a plataforma web via Supabase.

---

## Stack Tecnológico Recomendado

- **Framework**: React Native ou Flutter
- **Backend**: Supabase (já existente)
- **Autenticação**: Supabase Auth (email/password)
- **Realtime**: Supabase Realtime para pedidos
- **Maps**: Google Maps SDK para navegação
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Estado**: Zustand ou Redux Toolkit

---

## Credenciais Supabase

```
URL: https://gyagfsjbdaacgmmofqip.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YWdmc2piZGFhY2dtbW9mcWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzIwNjYsImV4cCI6MjA4MDQ0ODA2Nn0.4W0hZwETfoALlpn9_f2NqdKQNJ3DKDRkcs7uC-VbdhE
```

---

## Tabelas do Banco de Dados

### 1. `delivery_drivers` - Dados do Entregador
```sql
- id: uuid (PK)
- name: text
- phone: text
- email: text
- user_id: uuid (FK auth.users)
- establishment_id: uuid (FK establishments)
- vehicle_type: text ('motorcycle' | 'bicycle' | 'car')
- license_plate: text
- pix_key: text
- pix_key_type: text
- is_active: boolean
- is_available: boolean
- rating_average: numeric
- total_deliveries: integer
- complaint_count: integer
- created_at: timestamp
- updated_at: timestamp
```

### 2. `delivery_requests` - Pedidos de Entrega Disponíveis
```sql
- id: uuid (PK)
- order_id: uuid (FK orders)
- establishment_id: uuid (FK establishments)
- calculated_fee: numeric (valor total da entrega)
- driver_earnings: numeric (ganho do entregador)
- estimated_distance_km: numeric
- estimated_duration_minutes: integer
- pickup_address: text
- delivery_address: text
- customer_name: text
- status: text ('pending' | 'assigned' | 'expired' | 'cancelled')
- expires_at: timestamp
- accepted_by: uuid (FK delivery_drivers)
- accepted_at: timestamp
- created_at: timestamp
```

### 3. `delivery_tracking` - Rastreamento em Tempo Real
```sql
- id: uuid (PK)
- order_id: uuid (FK orders)
- driver_id: uuid (FK delivery_drivers)
- establishment_id: uuid (FK establishments)
- status: text ('assigned' | 'picking_up' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled')
- current_lat: numeric
- current_lng: numeric
- pickup_lat: numeric
- pickup_lng: numeric
- delivery_lat: numeric
- delivery_lng: numeric
- distance_km: numeric
- estimated_minutes: integer
- route_polyline: text
- accepted_at: timestamp
- picked_up_at: timestamp
- delivered_at: timestamp
- cancelled_at: timestamp
- notes: text
- created_at: timestamp
- updated_at: timestamp
```

### 4. `delivery_queue` - Fila de Entregas
```sql
- id: uuid (PK)
- order_id: uuid (FK orders)
- driver_id: uuid (FK delivery_drivers)
- establishment_id: uuid (FK establishments)
- queue_position: integer
- estimated_pickup_at: timestamp
- estimated_delivery_at: timestamp
- actual_pickup_at: timestamp
- actual_delivery_at: timestamp
- estimated_duration_minutes: integer
- distance_km: numeric
- is_delayed: boolean
- delay_notified_at: timestamp
```

### 5. `orders` - Pedidos (campos relevantes)
```sql
- id: uuid (PK)
- order_number: text
- establishment_id: uuid
- customer_name: text
- customer_phone: text
- delivery_address: jsonb
- delivery_fee: numeric
- total: numeric
- status: text
- delivery_type: text ('delivery' | 'pickup' | 'turbo')
- created_at: timestamp
```

### 6. `driver_reviews` - Avaliações do Entregador
```sql
- id: uuid (PK)
- driver_id: uuid (FK delivery_drivers)
- order_id: uuid (FK orders)
- customer_id: uuid
- rating: integer (1-5)
- comment: text
- selected_tags: jsonb
- created_at: timestamp
```

### 7. `driver_establishment_links` - Vínculo Entregador-Estabelecimento
```sql
- id: uuid (PK)
- driver_id: uuid (FK delivery_drivers)
- establishment_id: uuid (FK establishments)
- status: text ('pending' | 'approved' | 'rejected')
- commission_type: text ('external' | 'split_pix')
- fixed_fee: numeric
- percentage_fee: numeric
- approved_at: timestamp
- approved_by: uuid
```

---

## RPC Functions Disponíveis

### `accept_delivery_request(p_request_id uuid, p_driver_id uuid)`
Aceita um pedido de entrega. Retorna:
```json
{
  "success": true,
  "order_id": "uuid",
  "driver_earnings": 8.50
}
```
Ou em caso de erro:
```json
{
  "success": false,
  "error": "already_accepted" | "expired" | "not_linked" | "request_not_found"
}
```

### `calculate_delivery_queue_position(p_establishment_id uuid, p_driver_id uuid)`
Recalcula posição na fila de entregas do entregador.

---

## Realtime Channels

### Subscrição para novos pedidos
```typescript
supabase
  .channel('delivery_requests')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'delivery_requests',
    filter: `status=eq.pending`
  }, (payload) => {
    // Novo pedido disponível
    showNotification(payload.new);
  })
  .subscribe();
```

### Subscrição para atualizações de pedidos aceitos
```typescript
supabase
  .channel('my_deliveries')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'delivery_tracking',
    filter: `driver_id=eq.${driverId}`
  }, (payload) => {
    // Atualização na entrega
    updateDeliveryStatus(payload.new);
  })
  .subscribe();
```

---

## Fluxos do App

### 1. Autenticação
1. Login com email/senha via `supabase.auth.signInWithPassword()`
2. Verificar se user_id existe em `delivery_drivers`
3. Se não existir, mostrar tela de cadastro de entregador
4. Armazenar sessão localmente

### 2. Tela Principal - Pedidos Disponíveis
1. Buscar pedidos pendentes de estabelecimentos vinculados:
```sql
SELECT dr.*, e.name as establishment_name, e.logo_url
FROM delivery_requests dr
JOIN establishments e ON e.id = dr.establishment_id
JOIN driver_establishment_links del ON del.establishment_id = dr.establishment_id
WHERE dr.status = 'pending'
  AND del.driver_id = :driver_id
  AND del.status = 'approved'
  AND dr.expires_at > now()
ORDER BY dr.created_at DESC
```

2. Exibir cards com:
   - Nome do estabelecimento
   - Endereço de retirada
   - Endereço de entrega
   - Distância estimada
   - Valor do ganho
   - Tempo restante para aceitar

### 3. Aceitar Pedido
1. Chamar RPC `accept_delivery_request`
2. Se sucesso, criar registro em `delivery_tracking`
3. Abrir navegação para endereço de retirada
4. Atualizar status para 'picking_up'

### 4. Durante a Entrega
1. Atualizar `current_lat` e `current_lng` a cada 30 segundos
2. Botões de ação:
   - "Cheguei no estabelecimento" → status = 'picking_up'
   - "Peguei o pedido" → status = 'picked_up', picked_up_at = now()
   - "Entreguei" → status = 'delivered', delivered_at = now()

### 5. Navegação GPS
1. Usar Google Maps Directions API
2. Exibir rota no mapa
3. Instruções turn-by-turn
4. Otimização de múltiplas paradas (quando aplicável)

### 6. Chat com Estabelecimento
1. Usar tabela `support_messages` existente
2. Conversation_id baseado no order_id
3. Realtime para mensagens

### 7. Métricas e Histórico
1. Dashboard com:
   - Entregas hoje/semana/mês
   - Ganhos totais
   - Rating médio
   - Número de reclamações

2. Histórico de entregas:
```sql
SELECT dt.*, o.order_number, e.name as establishment_name
FROM delivery_tracking dt
JOIN orders o ON o.id = dt.order_id
JOIN establishments e ON e.id = dt.establishment_id
WHERE dt.driver_id = :driver_id
ORDER BY dt.created_at DESC
```

---

## Funcionalidades Obrigatórias

### MVP (Fase 1)
- [ ] Login/Logout
- [ ] Listar pedidos disponíveis
- [ ] Aceitar pedido
- [ ] Atualizar status da entrega (pickup → delivering → delivered)
- [ ] Navegação GPS para endereços
- [ ] Push notifications para novos pedidos
- [ ] Histórico de entregas

### Fase 2
- [ ] Chat com estabelecimento
- [ ] Roteirização inteligente (múltiplas entregas)
- [ ] Modo offline (cache de pedidos aceitos)
- [ ] Dashboard de métricas
- [ ] Avaliações recebidas

### Fase 3
- [ ] Integração com carteira digital
- [ ] Retirada de ganhos via PIX
- [ ] Mapa de calor de demanda
- [ ] Ranking de entregadores

---

## Push Notifications

### Eventos para notificar:
1. **Novo pedido disponível** (alta prioridade)
   - Título: "Novo pedido disponível!"
   - Body: "Entrega em {bairro} - R$ {valor}"
   
2. **Pedido prestes a expirar** (média prioridade)
   - Título: "Pedido expirando!"
   - Body: "Restam 2 minutos para aceitar"

3. **Mensagem do estabelecimento** (média prioridade)
   - Título: "Mensagem de {estabelecimento}"
   - Body: preview da mensagem

4. **Nova avaliação recebida** (baixa prioridade)
   - Título: "Você recebeu uma avaliação!"
   - Body: "{rating} estrelas"

---

## Considerações de Segurança

1. **RLS Policies**: Todas as tabelas têm RLS. O app usa `supabase.auth` para autenticação.
2. **Validação de vínculo**: Antes de mostrar pedidos, verificar se entregador está vinculado ao estabelecimento.
3. **Tokens JWT**: Renovar automaticamente tokens expirados.
4. **Localização**: Pedir permissão explícita para GPS.

---

## Telas do App

1. **Splash Screen** - Logo VilaFood
2. **Login** - Email + Senha
3. **Cadastro Entregador** - Nome, telefone, veículo, PIX
4. **Home** - Lista de pedidos disponíveis
5. **Detalhes do Pedido** - Info completa + botão aceitar
6. **Entrega em Andamento** - Mapa + status + ações
7. **Navegação** - Google Maps integrado
8. **Chat** - Mensagens com estabelecimento
9. **Histórico** - Lista de entregas passadas
10. **Métricas** - Dashboard de performance
11. **Perfil** - Dados pessoais + configurações
12. **Avaliações** - Reviews recebidos

---

## Exemplo de Código - Aceitar Pedido

```typescript
import { supabase } from './supabaseClient';

async function acceptDelivery(requestId: string, driverId: string) {
  const { data, error } = await supabase
    .rpc('accept_delivery_request', {
      p_request_id: requestId,
      p_driver_id: driverId
    });

  if (error) throw error;
  
  if (!data.success) {
    switch (data.error) {
      case 'already_accepted':
        throw new Error('Este pedido já foi aceito por outro entregador');
      case 'expired':
        throw new Error('O tempo para aceitar expirou');
      case 'not_linked':
        throw new Error('Você não está vinculado a este estabelecimento');
      default:
        throw new Error('Erro ao aceitar pedido');
    }
  }

  return data;
}
```

---

## Exemplo de Código - Atualizar Localização

```typescript
import * as Location from 'expo-location';

async function updateDriverLocation(trackingId: string) {
  const location = await Location.getCurrentPositionAsync({});
  
  await supabase
    .from('delivery_tracking')
    .update({
      current_lat: location.coords.latitude,
      current_lng: location.coords.longitude,
      updated_at: new Date().toISOString()
    })
    .eq('id', trackingId);
}

// Executar a cada 30 segundos durante entrega ativa
```

---

## Contato para Dúvidas

- **Plataforma**: vilafood.delivery
- **Suporte Técnico**: suporte@vilafood.delivery
- **Documentação API**: Este documento

---

*Documento gerado em: Dezembro 2024*
*Versão: 1.0*
