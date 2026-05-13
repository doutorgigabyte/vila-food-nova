# PRD — Vila Wayfinding (Mapa "Vc Está Aqui" + Rota a Pé)

**Módulo:** Vila das Vilas (galerias/agrupamentos de estabelecimentos)
**Owner técnico:** Frontend + DB schema + Admin
**Data:** 2026-05-13
**Status:** Draft — aguardando alinhamento antes da Fase 1

---

## 1. Resumo executivo

Adicionar à página de cada Vila (`/vila/:slug`) um **mapa interativo de wayfinding** que permite ao visitante:

1. Visualizar todos os estabelecimentos da vila numa planta/mapa
2. Selecionar um destino (ex.: "Padaria Nativa")
3. Receber uma **rota a pé** ("trilha") até esse estabelecimento, a partir da posição atual do usuário (GPS) ou de uma entrada/portaria conhecida da vila
4. Acompanhar a trilha em tempo real durante o trajeto

**Por que agora:** As vilas hoje funcionam como listagem (cartões de estabelecimentos), mas não como espaço orientável. Em galerias com 10+ lojas, o cliente pergunta "como chego na Nativa?" — hoje a resposta é "ali no fundo, segunda porta". Wayfinding transforma essa pergunta em fluxo guiado, aumenta footfall qualificado e cria um diferencial de marketing ("a única plataforma que te leva até a loja").

---

## 2. Contexto atual no código

| Item | Existe? | Onde |
|---|---|---|
| Tabela `vilas` (id, name, slug, lat, lng, address, image_url) | ✅ | `supabase/migrations/20251204205231_*.sql` |
| `establishments.vila_id` (FK pra vila) | ✅ | `src/integrations/supabase/types.ts:2480` |
| `establishments.latitude` / `longitude` (lat/lng reais) | ✅ | `types.ts:2429-2432` |
| Posição relativa dentro da vila (floor, x, y, número da loja) | ❌ | precisa schema novo |
| Stack de mapas | ✅ Google Maps | `VITE_GOOGLE_MAPS_API_KEY`, componentes em `src/components/maps/` |
| Hook `useVilas` | ✅ | `src/hooks/useVilas.tsx` |
| Página `/vilas` (listagem) | ✅ | `src/pages/Vilas.tsx` |
| Página `/vila/:slug` (detalhe) | ✅ | `src/pages/VilaDetalhe.tsx` (ou similar) |
| Rota a pé / directions | ❌ | nenhum uso de Directions API ou Mapbox Walking |
| Componente "Como chegar" | ❌ | não existe |

**Lacuna principal:** Não há nenhuma coordenada relativa dentro da vila. Para uma galeria a céu aberto (lojas espalhadas com endereços reais), basta `lat`/`lng` que já temos. Para shopping fechado/multi-andares, precisamos schema novo.

---

## 3. Decisão técnica chave: Mapbox vs Google Maps

O usuário sugeriu Mapbox. Já temos Google Maps integrado. Tradeoffs:

| Critério | Google Maps | Mapbox |
|---|---|---|
| **Já integrado** | ✅ Sim (`@react-google-maps/api` ou similar em `src/components/maps/`) | ❌ Requer nova dep + token |
| **Custo /1000 loads** | $7 (Dynamic Maps) + $5 (Directions) | $5 (Maps) + $2 (Directions Walking) |
| **Rota pedestre (turn-by-turn)** | ✅ Walking mode em Directions API | ✅ Walking profile em Directions API |
| **Mapas indoor customizados (planta de shopping)** | Limitado — só shoppings parceiros do Google | ✅ Tilesets customizados (upload de imagem + georeferenciamento) |
| **Customização visual** | Restrita (styled maps) | ✅ Mapbox Studio (controle total de cores, layers) |
| **Performance mobile** | Boa | ✅ GL JS é WebGL nativo, mais leve em low-end |
| **Vendor lock** | Alto (já investido) | Médio |

**Recomendação:** Híbrido.
- **Fase 1 (outdoor walking route):** usar **Google Maps Directions API** com o componente que já existe. Zero nova dependência, mesmo token, walking mode resolve.
- **Fase 2 (indoor custom map):** introduzir **Mapbox** apenas para o caso de planta customizada de galeria fechada, porque Google Maps não cobre isso.

Isso evita pagar custo de migração se a Fase 2 nunca for priorizada.

---

## 4. Tipos de Vila — duas modalidades distintas

Precisamos diferenciar antes de escrever código:

### Modalidade A — Outdoor (galeria/condomínio a céu aberto)
Estabelecimentos têm **endereços reais** (rua/número) e o cliente caminha pela calçada ou áreas externas. Ex.: "Vila Gourmet do Centro" com 8 lojas em 2 quadras adjacentes.

- **Schema:** `establishments.latitude/longitude` já basta
- **Stack:** Google Maps + Directions API (walking)
- **UX:** Mapa real, rota desenhada por cima da malha viária
- **Esforço:** Baixo

### Modalidade B — Indoor (shopping/galeria fechada multi-andar)
Estabelecimentos não têm endereço próprio — moram dentro do mesmo CEP/edifício e identificam-se por "Loja 12 — Piso L1". Ex.: galeria coberta, mercado público, food hall.

- **Schema:** novos campos `vila_floor`, `vila_position_x`, `vila_position_y`, `vila_door_label`
- **Stack:** Mapbox com tileset custom OU SVG/Canvas próprio (mais barato pra começar)
- **UX:** Planta uploadada pelo admin, lojas posicionadas em coordenadas relativas, rota interna calculada via grafo simples (nós = corredores; arestas = caminhos navegáveis)
- **Esforço:** Alto

**Pergunta crítica que o PRD precisa responder antes da Fase 1:** que % das vilas reais hoje (ou esperadas no roadmap) são Modalidade A vs B?

Sugestão de default: começar Modalidade A (cobre 80% dos casos com 20% do esforço), tratar Modalidade B como Fase 2 opt-in por vila (campo `vila.layout_type: 'outdoor' | 'indoor'`).

---

## 5. Personas e jornadas

### Persona 1 — Cliente novo na vila (descoberta)
> "Vi um story do Vilatok da Padaria Nativa. Tô na Vila Gourmet pela primeira vez. Não sei onde fica."

**Jornada:**
1. Abre app → navega pra `/vila/vila-gourmet` (ou tap na vila a partir do Vilatok)
2. Tap em "Padaria Nativa" → vê página da loja
3. Tap em **botão "Como chegar"** (CTA flutuante)
4. Modal/sheet abre com mapa da vila, marca de "Você está aqui" (GPS), pin do destino, rota desenhada
5. Tap em "Iniciar trajeto" → tela full-screen com setas/instruções turn-by-turn
6. Chega no destino → "Você chegou! Ver cardápio?"

### Persona 2 — Cliente repetente (atalho)
Já conhece a vila, quer só conferir onde fica uma loja nova. Precisa do mapa estático sem o turn-by-turn.

### Persona 3 — Admin da vila (lojista âncora ou gestor da galeria)
Quer cadastrar/editar a planta da vila e posicionar as lojas. Não programa.

**Jornada (Modalidade B):**
1. `/admin/vilas/:id/mapa`
2. Upload da planta (JPG/PNG)
3. Drag-and-drop dos pins de cada estabelecimento na planta
4. Define entrada(s) da vila (pontos de origem default)
5. Define corredores caminháveis (linha/polígono)
6. Salva → vira o mapa público da vila

---

## 6. Requisitos funcionais

### FR-1 — Página da vila ganha botão "Mapa & Como Chegar"
- Aparece no header de `/vila/:slug` quando `vila.has_wayfinding = true`
- Tap abre `VilaWayfindingSheet` (sheet ou modal full-height)

### FR-2 — Visão geral do mapa da vila
- Mostra todos os estabelecimentos posicionados (pin custom com logo da loja)
- Tap no pin → preview card (nome, categoria, "Como chegar")
- Modalidade A: mapa Google base + pins sobre malha real
- Modalidade B: planta uploadada + pins em coords relativas

### FR-3 — Seleção de destino
- Lista lateral com filtro/busca de estabelecimentos da vila
- Tap seleciona destino e pinta a rota

### FR-4 — Cálculo de rota a pé
- **Modalidade A:** chamada à Google Directions API com `mode: walking`, origem = GPS do usuário (com permissão) ou entrada default da vila
- **Modalidade B:** Dijkstra/A* sobre grafo de corredores definidos no admin (ver FR-9)
- Renderiza polyline animada (cor de marca, ~6px, com glow)
- Tempo estimado + distância

### FR-5 — Modo turn-by-turn (Fase 1.5)
- Full-screen, próxima instrução grande, seta direcional
- Recalcula a cada N segundos (Modalidade A)
- "Chegou!" quando dist < 15m do pin

### FR-6 — Fallback sem GPS
- Se permissão negada/sem GPS, usar entrada principal da vila como origem
- Texto "Saindo da entrada principal" no header da rota

### FR-7 — Compartilhamento
- Botão "Compartilhar trajeto" → gera link `/vila/:slug/mapa?destino=:est_slug`
- Quem abrir já vê mapa com destino selecionado (sem precisar do GPS)

### FR-8 — Estabelecimento → mapa da vila
- Card/página do estabelecimento (`/loja/:slug` ou similar) ganha botão "Ver no mapa da vila" (se `establishment.vila_id` existir)

### FR-9 — Admin (Modalidade B): editor de planta
- Upload de imagem (JPG/PNG/SVG, máx 5MB)
- Calibração: 2 pontos âncora pra escala (opcional)
- Drag-and-drop de pins de estabelecimentos sobre a imagem
- Desenho de polígonos/linhas de corredores caminháveis (reuso do `ServiceAreaMap` drawing manager?)
- Definição de entradas (pontos verdes com label)
- Preview do trajeto antes de salvar

### FR-10 — Acessibilidade
- Mapa tem `aria-label` descritivo
- Pins têm texto alternativo (nome do estabelecimento)
- Modo "lista" toggle pra quem não quer mapa visual ("Padaria Nativa — sair pela entrada principal, virar à esquerda, 3ª porta")
- Respeita `prefers-reduced-motion` (sem animação da polyline)

---

## 7. Mudanças no schema

### Tabela `vilas` — adições
```sql
ALTER TABLE vilas ADD COLUMN layout_type text DEFAULT 'outdoor'
  CHECK (layout_type IN ('outdoor', 'indoor'));
ALTER TABLE vilas ADD COLUMN has_wayfinding boolean DEFAULT false;
ALTER TABLE vilas ADD COLUMN map_image_url text;  -- planta (modalidade B)
ALTER TABLE vilas ADD COLUMN map_bounds jsonb;    -- [[lat1,lng1],[lat2,lng2]] pra georef (modalidade B híbrida)
ALTER TABLE vilas ADD COLUMN default_entry_point jsonb; -- {lat, lng} ou {x, y} dependendo do tipo
```

### Tabela `establishments` — adições (modalidade B)
```sql
ALTER TABLE establishments ADD COLUMN vila_floor text;          -- 'L1', 'Térreo', '2º Piso'
ALTER TABLE establishments ADD COLUMN vila_position jsonb;      -- {x: 0.42, y: 0.71} relativo à planta (0-1)
ALTER TABLE establishments ADD COLUMN vila_door_label text;     -- 'Loja 12', 'Box 5A'
```

### Nova tabela `vila_map_paths` (modalidade B — grafo de corredores)
```sql
CREATE TABLE vila_map_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vila_id uuid NOT NULL REFERENCES vilas(id) ON DELETE CASCADE,
  geometry jsonb NOT NULL,  -- array de [{x, y}] (polyline) ou polígono
  path_type text DEFAULT 'corridor' CHECK (path_type IN ('corridor', 'stairs', 'elevator', 'entry')),
  floor text,
  is_accessible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

RLS: `SELECT` público pra `vilas` com `has_wayfinding=true` e suas paths; `INSERT/UPDATE/DELETE` apenas pra admins/owners da vila.

---

## 8. Componentes novos

```
src/components/wayfinding/
├── VilaWayfindingSheet.tsx          # Container (sheet/modal)
├── VilaWayfindingMap.tsx            # Mapa (decide outdoor vs indoor por prop)
│   ├── OutdoorMap.tsx               # Wrapper do GoogleMap existente
│   └── IndoorMap.tsx                # Canvas/SVG ou Mapbox tileset
├── VilaWayfindingDestinationList.tsx # Lateral com busca
├── VilaWayfindingDirections.tsx     # Modo turn-by-turn
├── VilaWayfindingHint.tsx           # Onboarding ("Toque numa loja...")
└── hooks/
    ├── useWayfindingRoute.ts        # Calcula rota (delega A vs B)
    ├── useUserPosition.ts           # GPS + fallback
    └── useIndoorRouter.ts           # Dijkstra/A* (modalidade B)

src/pages/admin/
├── VilaMapEditor.tsx                # /admin/vilas/:id/mapa (Fase 2)
```

Componentes reusam o `GoogleMap` base de `src/components/maps/` e seguem o padrão Vilatok V2 (design tokens `--vt-*` quando overlay/sheet).

---

## 9. Plano de entrega em fases

### Fase 0 — Validação de produto (1 semana, sem código)
- Levantar com 5 lojistas/clientes se isso resolve dor real
- Inventariar: das vilas cadastradas hoje, quantas são A vs B?
- Decisão go/no-go para Fase 1

### Fase 1 — MVP Outdoor (Modalidade A) (~5-7 dias)
Mínimo viável que cobre galerias a céu aberto.

| Tarefa | Esforço |
|---|---|
| Migration: `vilas.has_wayfinding`, `default_entry_point` | 0.5d |
| Componente `VilaWayfindingSheet` + `OutdoorMap` (reusa GoogleMap) | 1.5d |
| `useWayfindingRoute` com Google Directions Walking API + cache | 1d |
| Pin custom com logo do estabelecimento + cluster se >15 lojas | 1d |
| Botão "Como chegar" na página da vila + estabelecimento | 0.5d |
| Geolocation API + permissão + fallback | 0.5d |
| Modo lista acessível (fallback FR-10) | 0.5d |
| Tracking GA4: `wayfinding_open`, `route_calculated`, `route_started` | 0.5d |

**Critério de done:** numa vila piloto (ex.: Marina Café Empório se houver vila vinculada), conseguir abrir mapa, escolher 3 destinos diferentes e ver a rota desenhada. Funciona em mobile real (não só DevTools).

### Fase 1.5 — Turn-by-turn (~2-3 dias)
Só se métricas da Fase 1 mostrarem que >30% dos `route_calculated` viram `route_started` (sinal de interesse real em seguir trajeto).

### Fase 2 — Indoor (Modalidade B) (~10-14 dias)
Só se demanda existir (vilas indoor cadastradas ou pipeline confirmado).

| Tarefa | Esforço |
|---|---|
| Schema completo (floors, position, paths, door_label) | 1d |
| Admin: `VilaMapEditor` (upload, drag pins, desenho paths) | 4d |
| `IndoorMap` (Canvas ou Mapbox tileset — decisão na hora) | 3d |
| `useIndoorRouter` (A*/Dijkstra sobre vila_map_paths) | 2d |
| Multi-floor (escadas/elevador como nós especiais) | 2d |
| Testes em vila indoor piloto | 2d |

### Fase 3 — Polimento (~3-5 dias)
- Animações refinadas (polyline desenhando, pulse no destino)
- AR overlay (câmera + seta) — exploratório, depende de validação prévia
- Notificações push "Você está a 50m da Padaria Nativa, abrir cardápio?"
- Heatmap de destinos mais buscados pra ofertar pros lojistas

---

## 10. Integração com features existentes

### Vilatok
Quando o usuário assiste um vídeo de estabelecimento que está dentro de uma vila com wayfinding, mostrar CTA secundário "📍 Como chegar — Vila Gourmet" abaixo do CTA principal de cardápio.

### Página do estabelecimento
Adicionar bloco "Localização" com mini-mapa da vila (read-only) e botão "Abrir mapa completo da vila".

### Marketing/SEO
Páginas `/vila/:slug/mapa` indexáveis com JSON-LD `Place` + lista de `LocalBusiness` filhos. Bom pra long-tail "como chegar na Vila Gourmet".

### Vilatok TV (modo display nos estabelecimentos)
Template novo "v2-vila-map" mostrando planta da vila + destaque do estabelecimento atual ("Você está aqui"). Reaproveita o `IndoorMap`.

---

## 11. Métricas de sucesso

| Métrica | Target Fase 1 | Como medir |
|---|---|---|
| `wayfinding_open` por sessão em `/vila/:slug` | >25% | GA4 event |
| `route_calculated` / `wayfinding_open` | >60% | funil |
| Tempo médio na sheet de mapa | >45s | GA4 engagement |
| % de mobile vs desktop | >80% mobile | GA4 device |
| Bounce rate em `/vila/:slug` (com vs sem feature) | -15% | comparativo A/B se rollout gradual |
| Pedidos originados via wayfinding (utm_source=wayfinding) | mensurar baseline | analytics de pedidos |

---

## 12. Riscos e mitigações

| Risco | Severidade | Mitigação |
|---|---|---|
| Custo da Directions API explode | Médio | Cache server-side por (origem_arredondada, destino_id) válido por 24h. Rate limit no cliente (1 req/2s) |
| GPS impreciso em galerias cobertas | Alto (modalidade B) | Sempre oferecer "Saindo da entrada X" como alternativa. Em indoor, GPS é decorativo |
| Admin não preenche planta → vila com `has_wayfinding=true` mas vazia | Médio | Validação no toggle: só habilitar se ≥3 estabelecimentos posicionados |
| Mapa lento em low-end (Android < 2GB) | Médio | Lazy load do GoogleMap, debounce de pan, virtualização de pins se >50 |
| LGPD: localização do usuário é dado pessoal | Alto | Pedir permissão explícita com texto claro, não armazenar coords no servidor (cálculo client-side ou efêmero) |
| Vendor lock se adotar Mapbox | Baixo (Fase 1 não toca) | Abstrair via `IMapProvider` interface se for pra Fase 2 |
| Lojista pede mapa da vila mas vila não existe ainda | Médio | Onboarding pode oferecer "criar vila com X lojas" |

---

## 13. Open questions (precisam de resposta antes do código)

1. **Distribuição A vs B:** das vilas cadastradas hoje (ou no roadmap próximo), quantas % são outdoor real vs galeria fechada? Define se Fase 2 entra no roadmap ou não.
2. **Vila piloto:** existe uma vila real cadastrada que possa servir de piloto da Fase 1? Quantos estabelecimentos? Geo correto?
3. **Origem default:** quando GPS não disponível, usar centróide da vila ou ponto de entrada cadastrado pelo admin? (Sugiro entrada cadastrada, com fallback pra centróide se não houver.)
4. **Quem pode editar o mapa (Fase 2)?** Admin da plataforma só, ou owner da vila também? Owner pode contratar — RLS muda.
5. **Mapbox token:** se Fase 2 entrar, criar conta corporativa Mapbox ou usar token pessoal? (Recomendo corporativa pra controle de billing.)
6. **AR (Fase 3):** explorar `WebXR` ou descartar de saída? Suporte real iOS é fraco.
7. **Internacionalização das instruções turn-by-turn:** pt-BR só ou multi-idioma?

---

## 14. Definição de pronto (Fase 1)

- [ ] Migration aplicada em dev + produção
- [ ] Componente `VilaWayfindingSheet` renderiza em `/vila/:slug` quando `has_wayfinding=true`
- [ ] Rota a pé desenhada corretamente em 3 cenários reais testados em mobile
- [ ] GA4 dispara `wayfinding_open` e `route_calculated`
- [ ] Modo lista acessível funciona (testar com VoiceOver/TalkBack)
- [ ] LGPD: permissão de localização documentada + texto revisado
- [ ] Custo estimado mensal calculado (Google Directions) e documentado em `docs/MONITORING_SETUP.md`
- [ ] Vila piloto com >5 estabelecimentos posicionados serve como demo
- [ ] PR aprovado + deploy via Coolify Force Deploy (cache buildx invalidado conforme `vilatok_v2.md`)
