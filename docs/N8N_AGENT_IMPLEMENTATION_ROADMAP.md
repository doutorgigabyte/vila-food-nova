# VilaFood N8N Agent - Roadmap de Implementação

Este documento detalha o roadmap de implementação das melhorias identificadas para o agente WhatsApp IA do VilaFood.

## Status Geral

| Funcionalidade | Prioridade | Status | Observações |
|----------------|------------|--------|-------------|
| Debounce com Redis | Alta | 🔄 Pendente | Agrupar mensagens sequenciais |
| Split de Mensagens Longas | Alta | 🔄 Pendente | Evitar rate limit WhatsApp |
| Transcrição de Áudio | Alta | ✅ Implementado | Edge Function criada |
| Análise de Imagem/OCR | Alta | ✅ Implementado | Comprovantes de pagamento |
| Geocodificação + Cálculo Frete | Alta | ✅ Implementado | Edge Function criada |
| Cadastro Automático Cliente | Média | ✅ Implementado | Edge Function criada |
| Human Takeover | Média | ⚠️ Parcial | Painel existe, integrar N8N |

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

Os templates em `/public/n8n-templates/` devem ser atualizados com:

1. **VilaFood-Agent-Complete.json**
   - Adicionar tool `calculate_delivery`
   - Adicionar debounce Redis
   - Adicionar roteamento áudio/imagem

2. **VilaFood-Transcribe-Audio.json** (novo)
   - Subworkflow para transcrição

3. **VilaFood-Analyze-Image.json** (novo)
   - Subworkflow para análise de imagem

4. **VilaFood-Customer-Registration.json** (novo)
   - Fluxo completo de cadastro por áudio
