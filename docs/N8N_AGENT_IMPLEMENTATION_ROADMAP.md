# VilaFood N8N Agent - Roadmap de Implementação

Este documento detalha o roadmap de implementação das melhorias identificadas para o agente WhatsApp IA do VilaFood.

## Status Geral

| Funcionalidade | Prioridade | Status | Observações |
|----------------|------------|--------|-------------|
| Debounce com Redis | Alta | ✅ Implementado | Template v2 com Redis Push/Wait/Get/Clear |
| Split de Mensagens Longas | Alta | ✅ Implementado | Loop com delay 1s entre chunks |
| Transcrição de Áudio | Alta | ✅ Implementado | Lovable AI Gateway |
| Análise de Imagem/OCR | Alta | ✅ Implementado | Lovable AI Gateway |
| Geocodificação + Cálculo Frete | Alta | ✅ Implementado | Edge Function criada |
| Extração de Dados Cliente | Alta | ✅ Implementado | Lovable AI Gateway |
| Cadastro Automático Cliente | Média | ✅ Implementado | Edge Function criada |
| Human Takeover | Média | ⚠️ Parcial | Painel existe, integrar N8N |
| Redis Chat Memory | Alta | ✅ Implementado | Memória por sessão phone+instance |
| 7 Tools AI Agent | Alta | ✅ Implementado | search_menu, send_photo, cart, order |

---

## 1. Debounce com Redis (Alta Prioridade)

### Objetivo
Agrupar mensagens enviadas em sequência (ex: cliente digita 3 mensagens em 5 segundos) antes de processar com IA.

### Implementação N8N

```
Webhook → Redis Push → Wait 3s → Redis Get All → Concatena → AI Brain
```

### Estrutura Redis
- **Key**: `vilafood:debounce:{instance_name}:{phone}`
- **Type**: List (RPUSH)
- **TTL**: 60 segundos

### Nodes N8N Necessários
1. **Redis Push Mensagem**: `RPUSH` nova mensagem na lista
2. **Wait 3s**: Pausa de 3 segundos
3. **Redis Get Mensagens**: `LRANGE` para buscar todas
4. **Redis Limpa Lista**: `DEL` após processar
5. **Concatena Mensagens**: Junta em uma string única

### Exemplo de Saída
```
Mensagens do cliente:
1. "oi"
2. "quero fazer um pedido"
3. "tem pizza?"

→ Concatenado: "oi\nquero fazer um pedido\ntem pizza?"
```

---

## 2. Split de Mensagens Longas (Alta Prioridade)

### Objetivo
Dividir respostas longas em blocos de ~400 caracteres com delay de 1 segundo entre cada.

### Implementação N8N

```javascript
// Code Node: Split Messages
const text = $input.first().json.response;
const MAX_CHARS = 400;
const messages = [];

// Split por parágrafos primeiro
const paragraphs = text.split('\n\n');
let currentChunk = '';

for (const p of paragraphs) {
  if ((currentChunk + '\n\n' + p).length > MAX_CHARS && currentChunk) {
    messages.push(currentChunk.trim());
    currentChunk = p;
  } else {
    currentChunk = currentChunk ? currentChunk + '\n\n' + p : p;
  }
}
if (currentChunk) messages.push(currentChunk.trim());

return messages.map((msg, i) => ({ json: { message: msg, index: i } }));
```

### Fluxo
1. AI gera resposta completa
2. Code Node divide em chunks
3. Loop envia cada chunk com Wait 1s entre eles

---

## 3. Transcrição de Áudio (Alta Prioridade)

### Edge Function: `transcribe-audio`

**Endpoint**: `POST /functions/v1/transcribe-audio`

**Input**:
```json
{
  "audio_url": "https://...",
  "audio_base64": "...",  // alternativa
  "mime_type": "audio/ogg"
}
```

**Output**:
```json
{
  "success": true,
  "text": "Olá, quero pedir uma pizza de calabresa",
  "language": "pt-BR",
  "duration_seconds": 5.2
}
```

**Implementação**: Usar Google Gemini com prompt de transcrição.

### Fluxo N8N
1. Webhook recebe mensagem tipo `audioMessage`
2. Extrai URL do áudio
3. Chama Edge Function `transcribe-audio`
4. Usa texto transcrito como input do AI Brain

---

## 4. Análise de Imagem/OCR (Alta Prioridade)

### Edge Function: `analyze-image`

**Endpoint**: `POST /functions/v1/analyze-image`

**Input**:
```json
{
  "image_url": "https://...",
  "analysis_type": "payment_proof",  // ou "general", "product"
  "establishment_id": "uuid"
}
```

**Output para comprovante**:
```json
{
  "success": true,
  "type": "pix_receipt",
  "extracted_data": {
    "amount": 45.90,
    "date": "2024-01-15",
    "payer_name": "João Silva",
    "transaction_id": "E00000000..."
  },
  "confidence": 0.95,
  "raw_text": "..."
}
```

### Casos de Uso
1. **Comprovante PIX**: Extrair valor, data, identificador
2. **Foto de Produto**: Identificar produto do cardápio
3. **Endereço**: Extrair endereço de foto de papel/tela

---

## 5. Geocodificação + Cálculo de Frete ✅ IMPLEMENTADO

### Edge Function: `geocode-and-calculate-delivery`

**Endpoint**: `POST /functions/v1/geocode-and-calculate-delivery`

**Input**:
```json
{
  "establishment_id": "uuid",
  "customer_address": "Rua das Flores, 123, Centro",
  "customer_cep": "12345-678"  // opcional
}
```

**Output**:
```json
{
  "success": true,
  "can_deliver": true,
  "distance_km": 3.2,
  "delivery_fee": 8.50,
  "delivery_fee_formatted": "R$ 8,50",
  "estimated_min_time": 25,
  "estimated_max_time": 35,
  "estimated_time_formatted": "25-35 min",
  "zone_name": "Centro",
  "formatted_address": "Rua das Flores, 123 - Centro, Cidade - UF",
  "coordinates": { "lat": -23.123, "lng": -46.456 },
  "establishment_name": "Pizzaria do João"
}
```

### Lógica Implementada
1. Busca dados do estabelecimento (cidade, estado, coordenadas)
2. Geocodifica endereço via Google Maps API
3. Calcula distância com fórmula Haversine
4. Verifica zonas de entrega (CEP, raio, polígono)
5. Retorna taxa e tempo estimado

### Tool N8N: `calculate_delivery`

```javascript
// Parâmetros da Tool
{
  "name": "calculate_delivery",
  "description": "Calcula o frete de entrega para um endereço",
  "parameters": {
    "customer_address": {
      "type": "string",
      "description": "Endereço completo do cliente"
    }
  }
}

// HTTP Request Node
POST {{SUPABASE_URL}}/functions/v1/geocode-and-calculate-delivery
{
  "establishment_id": "{{establishment_id}}",
  "customer_address": "{{$json.customer_address}}"
}
```

---

## 6. Cadastro Automático de Cliente (Média Prioridade)

### Fluxo Conversacional

```
Cliente novo detectado
    ↓
"Para finalizar seu pedido, preciso de alguns dados. 
 Pode me enviar um ÁUDIO dizendo seu nome completo 
 e endereço de entrega?"
    ↓
Cliente envia áudio
    ↓
Transcreve áudio (Edge Function)
    ↓
Extrai dados com Gemini:
  - nome
  - rua + número
  - complemento
  - bairro
  - CEP (se mencionado)
    ↓
Geocodifica endereço
    ↓
"Deixa eu confirmar:
 📝 Nome: João Silva
 📍 Endereço: Rua das Flores, 123, Apto 45
 🏘️ Bairro: Centro
 📦 CEP: 12345-678
 
 Está correto? (Sim/Não)"
    ↓
Se SIM → Salva no Supabase (customers)
Se NÃO → "Me diga o que está errado"
```

### Campos Capturados
- `name`: Nome completo
- `phone`: Número do WhatsApp (já temos)
- `addresses`: Array JSON com endereços
  - `street`, `number`, `complement`, `neighborhood`, `city`, `zip_code`, `lat`, `lng`

### Edge Function: `register-customer`

```json
// Input
{
  "phone": "5511999999999",
  "name": "João Silva",
  "establishment_id": "uuid",
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "complement": "Apto 45",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "zip_code": "12345-678",
    "lat": -23.123,
    "lng": -46.456
  }
}

// Output
{
  "success": true,
  "customer_id": "uuid",
  "is_new": true
}
```

---

## 7. Human Takeover - Integração N8N (Média Prioridade)

### Componente Existente
`HumanTakeoverPanel` em `/src/components/whatsapp/HumanTakeoverPanel.tsx`

### Tabela: `whatsapp_sessions`
```sql
- id, establishment_id, phone
- human_takeover: boolean
- takeover_reason: string
- takeover_at: timestamp
- takeover_by: uuid (user_id)
```

### Fluxo N8N

```
Webhook recebe mensagem
    ↓
Busca session no Supabase
    ↓
IF human_takeover = true:
    → Apenas salva histórico
    → NÃO processa com IA
    → Notifica humano (badge no painel)
ELSE:
    → Processa normalmente com IA
```

### Ativação Manual
- Lojista clica "Assumir Conversa" no painel
- Atualiza `human_takeover = true`
- Todas mensagens subsequentes vão para o humano
- Lojista clica "Devolver para IA" quando resolver

### Ativação Automática
Detectar frases como:
- "quero falar com atendente"
- "humano por favor"
- "não entendi" (3x consecutivas)

---

## Próximos Passos

### Fase 1 (Imediato)
1. ✅ Edge Function `geocode-and-calculate-delivery`
2. 🔄 Atualizar workflow N8N com tool `calculate_delivery`
3. 🔄 Implementar debounce Redis no workflow

### Fase 2 (Curto Prazo)
4. Criar Edge Function `transcribe-audio`
5. Criar Edge Function `analyze-image`
6. Adicionar nodes de transcrição no workflow N8N

### Fase 3 (Médio Prazo)
7. Implementar fluxo de cadastro por áudio
8. Integrar Human Takeover com N8N
9. Adicionar split de mensagens longas

---

## Templates N8N Atualizados

Os templates estão disponíveis em `/public/n8n-templates/`:

### 1. VilaFood-Agent-Complete-v2.json ✅ NOVO

Template principal com todas as funcionalidades:

**Funcionalidades incluídas:**
- ✅ Debounce com Redis (3 segundos)
- ✅ Split de mensagens longas (~400 chars)
- ✅ Roteamento por tipo (texto/áudio/imagem)
- ✅ Transcrição de áudio via Edge Function
- ✅ Análise de imagem via Edge Function
- ✅ 6 Tools integradas

**Tools disponíveis:**
| Tool | Descrição | Edge Function |
|------|-----------|---------------|
| `calculate_delivery` | Calcula frete por endereço | `geocode-and-calculate-delivery` |
| `register_customer` | Cadastra cliente | `register-customer` |
| `extract_customer_data` | Extrai dados do texto | `extract-customer-data` |
| `create_order_pix` | Cria pedido com PIX | `whatsapp-checkout` |
| `search_menu` | Busca produtos | Supabase REST |
| `send_product_photo` | Envia foto produto | `whatsapp-send-media` |

**Variáveis de ambiente necessárias:**
```
SUPABASE_URL=https://gyagfsjbdaacgmmofqip.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
EVOLUTION_API_URL=https://evolution.vilafood.delivery
EVOLUTION_API_KEY=sua_chave
```

**Credenciais N8N necessárias:**
- Redis (para debounce)
- Google Gemini API (para AI Brain)

### 2. Templates Legados (Compatibilidade)

- `VilaFood-Agent-Complete.json` - Versão anterior sem debounce
- `VilaFood-AI-Brain.json` - Subworkflow do AI Brain
- `VilaFood-MercadoPago-PIX.json` - Geração de PIX

---

## Checklist de Configuração N8N

### Pré-requisitos
- [ ] N8N instalado e acessível
- [ ] Redis configurado e acessível
- [ ] Evolution API funcionando
- [ ] Edge Functions deployadas

### Passos de Configuração

1. **Importar Template**
   - Acesse N8N → Workflows → Import
   - Selecione `VilaFood-Agent-Complete-v2.json`

2. **Configurar Credenciais**
   - Redis: Host, Port, Password
   - Adicionar variáveis de ambiente

3. **Configurar Webhook Evolution API**
   ```
   URL: https://n8n.vilafood.delivery/webhook/vilafood-webhook
   Events: MESSAGES_UPSERT
   ```

4. **Testar Fluxo**
   - Enviar mensagem de teste
   - Verificar logs do N8N
   - Confirmar resposta no WhatsApp

---

## Edge Functions Disponíveis

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `transcribe-audio` | POST | Não | Transcreve áudio para texto |
| `analyze-image` | POST | Não | Analisa imagens (comprovantes, produtos) |
| `extract-customer-data` | POST | Não | Extrai dados do cliente de texto |
| `register-customer` | POST | Não | Cadastra cliente no Supabase |
| `geocode-and-calculate-delivery` | POST | Não | Geocodifica + calcula frete |
| `whatsapp-checkout` | POST | Não | Cria pedido via WhatsApp |
| `whatsapp-send-media` | POST | Não | Envia mídia no WhatsApp |

---

## Fluxo Completo do Agente

```
Cliente envia mensagem
       ↓
[Webhook N8N recebe]
       ↓
[Filtra mensagens próprias]
       ↓
[Extrai campos (phone, text, type)]
       ↓
[Busca estabelecimento por instance_name]
       ↓
┌──────┴──────┐
│  É Áudio?  │
└──────┬──────┘
   Sim ↓       Não
[Transcreve]    ↓
       ↓    ┌──────┴──────┐
       ↓    │  É Imagem?  │
       ↓    └──────┬──────┘
       ↓       Sim ↓       Não
       ↓    [Analisa]       ↓
       ↓        ↓           ↓
       └────────┴───────────┘
                ↓
[Redis Push - Debounce 3s]
                ↓
[Redis Get All + Clear]
                ↓
[Combina mensagens]
                ↓
[AI Brain (Gemini) + Tools]
                ↓
[Split mensagens longas]
                ↓
[Loop: Envia cada chunk]
    ↓ (1s delay)
[Envia WhatsApp]
                ↓
[Salva histórico]
                ↓
[Respond OK]
```
