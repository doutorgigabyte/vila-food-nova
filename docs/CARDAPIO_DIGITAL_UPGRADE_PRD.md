# PRD — Upgrade do Cardápio Digital (página `/loja/:slug`)

**Página:** `src/pages/Store.tsx` + 20+ componentes em `src/components/store/`
**Audiência:** **Cliente final** (mobile 80%+) descobrindo, navegando e comprando
**Data:** 2026-05-13
**Status:** Draft — pendente alinhamento antes da Fase 1

---

## 1. Resumo executivo

A página de cardápio é **funcional mas crua**. O fluxo de pedido fecha (validado via E2E Marina Café Pedido #1), mas a experiência fica abaixo do que clientes esperam de delivery moderno — comparada com iFood, Goomer, Anota AI. Os ganhos rápidos não estão em refazer arquitetura: estão em **UX visual**, **acessibilidade**, **performance percebida** e **micro-interações de feedback**.

Foco em 3 vetores:
1. **Reduzir fricção de descoberta** (search melhor, filtros, fotos boas, placeholders inteligentes)
2. **Aumentar confiança/conversão** (avaliações, dark mode, animações de feedback, recomendações no momento certo)
3. **Performance + acessibilidade** (lazy/srcset/skeleton refinado, ARIA, JSON-LD, Core Web Vitals)

A meta é **conversão (add-to-cart → checkout) ≥ 35%** numa loja com >5 produtos, mantendo **LCP < 2.5s** em mobile 4G.

---

## 2. Diagnóstico do estado atual

### O que está bom (não mexer)

| Área | Estado |
|---|---|
| Estrutura responsiva mobile-first | ✅ funciona em 360px e 1920px |
| React Query + skeleton de loading | ✅ caching + UX de carregamento |
| Multi-establishment cart | ✅ raro até em concorrentes; manter |
| Modal de produto rico (variations + additionals + nutricional) | ✅ cobre serviço/digital/perecível |
| Checkout 5 steps com state machine | ✅ robusto, integra MP/PagBank/PIX |
| Helmet com og:* + canonical | ✅ base de SEO presente |
| Hover effects (scale, elevação) | ✅ feedback visual desktop |
| Tokens HSL via Tailwind + animações nomeadas | ✅ base de design system |

### O que precisa melhorar (gaps reais)

| # | Problema | Severidade | Onde |
|---|---|---|---|
| **G1** | Foto vazia → ícone genérico Package em todos os produtos sem foto | 🔴 Alta | `ProductCard.tsx:118` |
| **G2** | Search filtra mas não tem debounce, autocomplete, "produtos populares", histórico, "limpar" | 🔴 Alta | `Store.tsx:374-392` |
| **G3** | Sem `aria-label` / `role` / live regions em Store/Modal/Checkout | 🔴 Alta | toda a stack |
| **G4** | **Zero tracking GA4** de funil (view_product, add_to_cart, checkout_start, purchase) | 🔴 Alta | nenhum lugar |
| **G5** | ProductModal não sugere upsell (recomendações só aparecem no carrinho) | 🟡 Média | `ProductModal.tsx` |
| **G6** | Sem JSON-LD `Product` / `Restaurant` / `MenuItem` (SEO long-tail perdido) | 🟡 Média | `Store.tsx` Helmet |
| **G7** | Cart in-memory (perde ao fechar aba — `useCart` não persiste localStorage) | 🟡 Média | `useCart.ts` |
| **G8** | Sem srcset/blur placeholder em fotos (rede ruim → tela em branco) | 🟡 Média | `ProductCard.tsx:118`, `ProductModal.tsx:239` |
| **G9** | Sem filtros além de categoria (preço, vegano, sem glúten, tempo entrega) | 🟡 Média | `StoreCategoryNav.tsx` |
| **G10** | Bottom nav mobile (5 abas) + Floating cart desktop são duas UIs separadas — transição confusa em tablets | 🟡 Média | `StoreBottomNav.tsx` + `StoreFloatingCart.tsx` |
| **G11** | Dark mode incompleto (badges hardcoded `bg-blue-100`, `bg-purple-100`) | 🟢 Baixa | badges em `ProductCard.tsx:71-95` |
| **G12** | Sem animação de feedback "produto adicionado" (toast existe, mas falta micro-interaction no card) | 🟢 Baixa | `ProductCard.tsx` |
| **G13** | Sem PWA install prompt na store (já tem `pwa-install-dismissed` flag mas sem lógica) | 🟢 Baixa | nenhum |
| **G14** | StoreBanners renderiza vazio (`banners=[]`) — espaço desperdiçado | 🟢 Baixa | `StoreBanners.tsx` |
| **G15** | Não há reviews funcionais (componente existe mas vazio na maioria das lojas) | 🟢 Baixa | `StoreReviewsSection.tsx` |

---

## 3. Princípios norteadores

Toda decisão de design/código nas próximas fases deve seguir:

- **Mobile-first absoluto:** se uma decisão melhora desktop e piora mobile, escolher mobile.
- **Foto → primeira coisa que o usuário vê:** investir em placeholder de qualidade enquanto carrega + fallback visual quando não tem foto.
- **Feedback < 100ms:** toda interação (tap, swipe, click) responde visualmente em menos de 100ms (skeleton, ripple, scale).
- **Acessibilidade não-negociável:** WCAG 2.1 AA mínimo. Toda imagem tem `alt`, todo botão tem `aria-label` quando ícone só, contraste ≥ 4.5:1.
- **Métricas guiam decisões:** sem GA4 tracking, fase 2+ não começa.
- **Não reinventar tokens:** reusar HSL vars do `src/index.css`. Não criar `--vt-*` aqui (Vilatok namespace é separado).
- **Zero dependência nova sem trade-off claro:** cada lib add precisa pagar 5x peso.

---

## 4. Estratégia — 4 fases

### Fase 0 — Validação (~3 dias, sem código)

Sem isso, fases seguintes são chute.

| Tarefa | Esforço |
|---|---|
| Benchmarking visual: comparar Store.tsx vs iFood/Goomer/Anota/Cardápio Web (5 prints lado a lado de cada momento — listing, modal, carrinho, checkout) | 0.5d |
| Sessão de heatmap em prod (Hotjar/Microsoft Clarity grátis) gravando 50 sessões na Marina Café | 1d setup + esperar 2-3d |
| Entrevista rápida com 3 clientes piloto: "use a Marina Café no celular e me conta o que te incomoda" | 1d |
| Audit Lighthouse mobile da loja Marina (LCP, CLS, FID, accessibility score) | 0.5d |
| Decisão go/no-go + priorização das fases 1-4 baseado nos achados | 0.5d |

**Critério de pronto:** documento `docs/CARDAPIO_DIGITAL_RESEARCH.md` com 5 insights acionáveis e priorização ajustada.

### Fase 1 — Fundamentos invisíveis (~5-7 dias)

Coisas que ninguém vê mas destravam tudo.

| # | Tarefa | Esforço | Arquivo |
|---|---|---|---|
| 1.1 | Adicionar 3 eventos GA4: `view_item` (abrir modal), `add_to_cart` (botão Adicionar), `begin_checkout` (botão Fechar pedido) — usando helper existente em `src/lib/analytics.ts` | 0.5d | `ProductModal.tsx`, `CartSheet.tsx` |
| 1.2 | Adicionar `aria-label` em todos os botões com ícone só em Store/Modal/Checkout (auditoria + fix) | 1d | `src/components/store/*` |
| 1.3 | Persistir `useCart` em localStorage (key `vilafood_cart_v1`) com schema versionado + migration | 0.5d | `src/hooks/useCart.ts` |
| 1.4 | Placeholder inteligente quando produto sem foto: gradient da categoria + nome estilizado em vez de ícone Package | 0.5d | `ProductCard.tsx`, `ProductModal.tsx` |
| 1.5 | Skeleton aprimorado: shape match real do card (foto + 2 linhas texto + price) em vez de blocks genéricos | 0.5d | `Store.tsx:268-289` |
| 1.6 | JSON-LD `Restaurant` + `MenuItem` por produto (SEO crítico pra long-tail "pão de queijo tamandare") | 1d | `Store.tsx` Helmet section |
| 1.7 | Lighthouse score >90 mobile (perf+a11y+seo+best-practices) | 0.5d | medição+fix |
| 1.8 | Toast de "adicionado" + micro-animação de scale no card clicado (feedback de 80ms) | 0.5d | `ProductCard.tsx` |

**Critério de pronto:** Lighthouse ≥ 90 em todas as 4 categorias na Marina Café em mobile real, GA4 dispara os 3 eventos validados via DevTools, cart sobrevive ao reload da página.

### Fase 2 — Descoberta + Conversão (~7-10 dias)

Onde mora a maior parte da conversão.

| # | Tarefa | Esforço |
|---|---|---|
| 2.1 | Search aprimorado: debounce 300ms, autocomplete com top 5 produtos enquanto digita, "limpar" visível, histórico de últimas 3 buscas em localStorage | 1.5d |
| 2.2 | Filtros adicionais (toggle): "Sem foto não", "Promoção", "Combos", "<R$20", "Vegano", "Sem glúten" — chips persistentes acima do grid | 1.5d |
| 2.3 | Upsell no ProductModal: "Vai bem com isso" — 3 produtos da mesma categoria ou complementares (regra simples por enquanto, IA depois) | 1d |
| 2.4 | Preview de avaliações no card (estrela amarela + nº reviews) quando `reviews_avg ≥ 4.0` | 0.5d |
| 2.5 | Badge "Esgotando" / "+50 pessoas pediram hoje" — gera FOMO honesto baseado em estoque/`order_items` | 1d |
| 2.6 | Imagens com `srcset` (320/640/960) + blur placeholder (LQIP base64 16x16) + retry 1x se falhar load | 2d |
| 2.7 | Bottom sheet (não Dialog) pra ProductModal em mobile — drag-to-dismiss, melhor que modal full-height | 1.5d |
| 2.8 | Animação de "voar pro carrinho" ao adicionar (curva bezier do produto até o ícone do cart) | 1d |

**Critério de pronto:** A/B test (rollout gradual via feature flag em `establishment_settings`) mostra +15% no funil view_item → add_to_cart numa vila piloto com 3+ estabelecimentos.

### Fase 3 — Polish + Confiança (~5-7 dias)

Acaba a página parecendo top de linha.

| # | Tarefa | Esforço |
|---|---|---|
| 3.1 | Dark mode 100%: refatorar badges de tipo-produto pra usar tokens HSL (sem cores hardcoded) | 1d |
| 3.2 | Reviews funcionais: card "Avalie seu pedido" pós-checkout, persistir em `reviews` table, exibir 3 melhores no card+página | 2d |
| 3.3 | Photo gallery no ProductModal: se produto tem ≥2 fotos, swiper horizontal com pagination dots | 1d |
| 3.4 | StoreBanners reativado: usa `establishment_banners` table (criar se necessário) com 1-3 banners rotativos manageable via dashboard | 1.5d |
| 3.5 | "Visto recentemente" — 4 últimos produtos clicados (localStorage) reaparecem como sticky em qualquer loja | 1d |
| 3.6 | PWA prompt na 2ª visita: "Salve VilaFood na tela inicial" (já tem flag `pwa-install-dismissed`) | 0.5d |

**Critério de pronto:** dark mode validado no DevTools system theme, 5+ reviews reais coletados em vila piloto, PWA prompt aparece na 2ª sessão e instala.

### Fase 4 — Engajamento avançado (~10+ dias, opt-in por fase)

Só se Fase 3 mover métricas. Caro de implementar e manter.

| Item | Esforço | Quando vale |
|---|---|---|
| Notificações push web ("Seu pedido saiu pra entrega") | 5d (incl. backend) | quando >100 pedidos/dia em qualquer loja |
| AR view 3D do prato (WebXR) | 8d exploratório | quando categoria foto ≥ 80% no catálogo |
| Recomendações com IA real (vector embeddings dos produtos vs perfil cliente) | 7d | quando >1k pedidos/mês geram dados |
| Gamification (selos "Cliente fiel", desconto após 5º pedido) | 4d | quando >300 clientes recorrentes |
| Cardápio em vídeo (Vilatok TV embedded na loja) | 3d | quando lojista produz vídeos regulares |

---

## 5. Métricas de sucesso

Definir baseline na Fase 0, medir mensalmente após cada fase via GA4 + analytics próprio.

| Métrica | Target após Fase 1 | Target após Fase 2 | Target após Fase 3 |
|---|---|---|---|
| **LCP mobile (Marina Café)** | < 2.8s | < 2.5s | < 2.2s |
| **Lighthouse mobile total** | ≥ 90 | ≥ 92 | ≥ 95 |
| **Funil `view_item` → `add_to_cart`** | baseline | +15% | +25% |
| **Funil `add_to_cart` → `purchase`** | baseline | +10% | +20% |
| **Bounce rate /loja/:slug** | baseline | -10% | -25% |
| **Tempo médio na página** | baseline | +20% | +35% |
| **Lojas com cart abandonment recovery** | 0 | 0 | piloto |

---

## 6. Riscos e mitigações

| Risco | Sev | Mitigação |
|---|---|---|
| Fase 2 (filtros + upsell) afeta perf negativamente | Médio | Lighthouse na pipeline de PR — rejeita se LCP regredir > 200ms |
| Adicionar lib (ex: react-instantsearch pra search) explode bundle | Médio | Search nativo com debounce + Fuse.js (5kb gzip) é suficiente Fase 2 |
| Lojistas mudam cores/banners e quebra visual | Baixo | Whitelist de cores aceitas no admin; fallback pro tema VilaFood se inválido |
| GA4 tracking sem consent LGPD viola política | Alto | Já existe `CookieConsentBanner` + `vilafood_lgpd_consent_v1` — gating todos os tracking calls |
| Reviews funcionais → fake reviews / SPAM | Médio | Apenas clientes com `order.status='delivered'` podem avaliar (RLS) |
| Animações pesadas em Android low-end | Médio | `prefers-reduced-motion` respeitado em tudo + feature detection (`window.matchMedia`) |

---

## 7. Open questions (decidir antes da Fase 1)

1. **Métrica de sucesso prioritária:** conversão (add-to-cart → purchase) ou time-on-page? Define onde investir mais esforço.
2. **Heatmap tool:** Microsoft Clarity (grátis) ou Hotjar (pago, mais preciso)?
3. **Search engine:** Fuse.js client-side (≤500 produtos por loja) ou search server-side com índice (PostgreSQL `tsvector` ou Algolia)?
4. **Filtros vegano/sem glúten:** dado já existe em `nutritional_info` (ProductModal usa) — refletir isso no card e como filtro requer migration mínima?
5. **Reviews moderação:** auto-aprovar 4+ estrelas, manual pra ≤3? Ou todas auto?
6. **Upsell logic Fase 2:** regra simples ("3 produtos da mesma categoria") OU IA já na Fase 2?
7. **PWA install prompt:** após qual gatilho? 2ª sessão? Após 1º add-to-cart? Após pedido?

---

## 8. Definição de pronto (Fase 1 mínima)

- [ ] PR aprovado, type-check + lint clean
- [ ] Lighthouse mobile ≥ 90 nas 4 categorias na URL `vilafood.delivery/loja/marinacafeemporium`
- [ ] GA4 mostra eventos `view_item`, `add_to_cart`, `begin_checkout` na conta real (não no DebugView)
- [ ] Cart sobrevive ao `localStorage.clear()` test (precisa novo cart) E ao reload (mesma sessão mantém)
- [ ] Audit a11y do axe DevTools com 0 erros críticos em Store + ProductModal + CartSheet
- [ ] Foto vazia agora mostra placeholder estilizado (não Package icon)
- [ ] JSON-LD valida em https://validator.schema.org/ pra Marina Café
- [ ] Documentado em `docs/CARDAPIO_DIGITAL_RESEARCH.md` os achados da Fase 0

---

## 9. Cronograma sugerido

| Semana | Atividade |
|---|---|
| Sem 1 | Fase 0 (validação + baseline + decisões open questions) |
| Sem 2-3 | Fase 1 (fundamentos invisíveis) |
| Sem 4-5 | Pausa pra observar métricas + decidir Fase 2 escopo |
| Sem 6-7 | Fase 2 parte 1 (search + filtros + upsell + reviews preview) |
| Sem 8 | Fase 2 parte 2 (srcset + bottom sheet + voar pro carrinho) |
| Sem 9 | Pausa + métricas |
| Sem 10-11 | Fase 3 (polish) |
| Sem 12+ | Avaliar Fase 4 com base em métricas reais |

**Investimento total ~30-40 dias úteis** distribuídos em 12 semanas. Cada fase isoladamente entrega valor — pode pausar a qualquer momento.

---

## 10. Quem faz o quê

- **Frontend:** todas as fases (Store.tsx + components/store/* + components/checkout/*)
- **Backend:** Fase 1 (JSON-LD via meta), Fase 2 (search se server-side), Fase 3 (reviews schema + RLS)
- **Design:** Fase 0 (benchmark visual), Fase 2 (filtros UI + upsell card), Fase 3 (banners design + dark badges)
- **Produto:** Fase 0 (entrevistas), Fase 4 (decisão go/no-go por item)

---

**Próximo passo concreto:** Decidir as 7 open questions da seção 7 e dar `go` na Fase 0. Posso já preparar o boilerplate de GA4 events + a11y audit script enquanto você decide.
