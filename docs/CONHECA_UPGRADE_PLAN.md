# Plano de Upgrade — Página `/conheca` (VilaFood)

**Página:** `src/pages/Conheca.tsx` (13 seções compostas a partir de `src/components/landing/`)
**Audiência:** Lojistas considerando assinar a plataforma (B2B sales page)
**Data:** 2026-05-13

---

## Diagnóstico do estado atual

A página tem **boa fundação**: layout responsivo mobile-first, value prop claro ("Pare de pagar taxas abusivas"), calculadora interativa de economia vs iFood como peça central, lazy-loading das seções below-the-fold, CTAs consistentes (todos para `/cadastro-estabelecimento`).

**Problemas críticos que limitam conversão:**

1. **Sem analytics** — nenhum evento de GA4/Pixel; não dá pra medir o que funciona
2. **Sem SEO** — sem meta tags, sem structured data, sem `react-helmet`
3. **Social proof fraco** — 3 testimonials hardcoded (Carlos/Ana/Roberto fictícios), logos de parceiros em texto puro, contadores ("2.500 estabelecimentos") sem fonte
4. **Conteúdo hardcoded** que envelhece sem deploy: taxas iFood, FAQ, telefone WhatsApp, número de estabelecimentos, testimonials
5. **6 componentes não usados** (`FeaturesSection`, `PlatformOverviewSection`, `UniqueSellingPointsSection`, `UseCasesSection`, `VilaTokTVSection` — alguns podem voltar, outros são dead code)

**O que já está bom (não mexer):**
- Hero + IFoodCalculator (peça forte de conversão)
- AllFeaturesSection (tabs interativas com phone/TV mockups)
- VilasConceptSection (explicação do conceito multi-vendor)
- ComparisonSection (tabela vs iFood/Rappi)
- PricingSection (já é DB-driven via `usePlans`)
- Footer (estrutura sólida, contato real)

---

## Estratégia — abordagem em 4 fases

Cada fase entrega valor independente. Pode pausar entre fases conforme prioridade do produto.

### Fase 0 — Quick wins de credibilidade (~4-6h)

Mudanças baratas com impacto imediato em percepção de qualidade.

| Tarefa | Arquivo | Esforço |
|--------|---------|---------|
| Substituir logos de parceiros texto → imagem real (já existem em `src/assets/logos/mercado-pago.jpg`, `pagbank.jpg`) | `TrustBadgesSection.tsx`, `TestimonialsSection.tsx` | 1h |
| Trocar telefone hardcoded `+5581999999999` na `FAQSection` pelo real (`+55 81 98365-5465` que já está no Footer) | `FAQSection.tsx` | 5min |
| Sincronizar contagens "2.500 estabelecimentos" (Testimonials) e "20+" (PlatformOverview) com claim único e honesto | `TestimonialsSection.tsx` | 15min |
| Deletar 5 componentes não usados sem chance de retorno: `FeaturesSection`, `PlatformOverviewSection`, `UniqueSellingPointsSection`, `VilaTokTVSection` (redundante com tab no AllFeatures) | `src/components/landing/` | 30min |
| Decidir: manter `UseCasesSection` arquivado para Fase 4 ou deletar | — | 5min |
| Validar formulário do calculator (input 0/negativo, valores acima de R$1M) | `IFoodCalculator.tsx` | 1h |
| Trocar disclaimer do calculator por texto maior + fonte das taxas iFood (link para tabela oficial 2026) | `IFoodCalculator.tsx` | 30min |
| Corrigir botão "Conhecer Plataforma" do Footer que aponta pra `/conheca` (estamos nela) → trocar por "Falar com vendas" → WhatsApp | `Footer.tsx` | 15min |

**Critério de done:** zero placeholder text visível, zero dead code commitado.

### Fase 1 — Tracking + SEO (~2-3 dias)

Sem isso, o resto do plano é cego.

#### Analytics (GA4)
- Instalar `react-ga4` ou usar GTM
- Eventos a trackear:
  - `page_view` (já implícito)
  - `section_view` para cada seção (IntersectionObserver)
  - `calculator_started`, `calculator_completed` (com `revenue` + `delivery_type` como params)
  - `cta_clicked` (param: `cta_location`, `cta_text`)
  - `pricing_plan_selected` (param: `plan_name`, `billing_cycle`)
  - `faq_opened` (param: `question`)
  - `signup_intent` antes do redirect pra `/cadastro-estabelecimento`
- Dashboard de funil no GA4: Hero view → Calculator started → Calculator completed → Signup clicked → Signup completed

#### SEO técnico
- Adicionar `react-helmet-async` (já compatível com Vite SSG)
- Por seção/página:
  - `<title>VilaFood — Plataforma de delivery sem taxas abusivas</title>` (60 chars)
  - `<meta name="description">` (150-160 chars, focada em "sem comissão por pedido")
  - Open Graph completo (já tem `og-image.png` da migração anterior — reutilizar)
  - Twitter Card
  - `<link rel="canonical" href="https://vilafood.delivery/conheca">`
- Structured data (JSON-LD):
  - `SoftwareApplication` com `aggregateRating`, `offers` (lista de planos do `usePlans`)
  - `FAQPage` schema na FAQSection (Google mostra rich snippet)
  - `Organization` no footer (logo, contato, sameAs com redes sociais)
  - `BreadcrumbList`
- Heading hierarchy: garantir 1 h1 (já tem no Hero), restante h2/h3 corretos
- Sitemap.xml e robots.txt entries

**Critério de done:** Lighthouse SEO ≥ 95, GA4 mostrando funil em tempo real.

### Fase 2 — Social proof real (~3-5 dias)

Substitui copy fictícia por evidência concreta.

| Item | Origem dos dados | Esforço |
|------|------------------|---------|
| **Testimonials reais** — entrevistar 3-5 lojistas em produção (Marina Café Empório como piloto), pegar quote + foto + métrica concreta ("Economizei R$ X em Y meses") | Manual (entrevista) + tabela `testimonials` no Supabase | 2 dias |
| **Logos de clientes** — carrossel autoplay com logo dos primeiros 12-20 estabelecimentos ativos | Query em `establishments WHERE status='active' AND logo_url IS NOT NULL ORDER BY created_at LIMIT 20` | 4h |
| **Contadores ao vivo** — "X estabelecimentos ativos · Y pedidos processados · R$ Z economizados em comissões" | View materializada no Supabase, refresh diário | 4h |
| **Case studies** — 2-3 páginas dedicadas (`/casos/marina-cafe-emporio`) com narrativa antes/depois, números, screenshots | Markdown em `docs/cases/` ou tabela `case_studies` | 1 dia |
| **Trust badges com verificação** — substituir "SSL Criptografia" texto por badge clicável (SSL Labs A+, PCI DSS via MP, LGPD compliance via doc) | Badges externos, links pra relatórios reais | 4h |
| **Vídeo testimonial** (opcional Fase 4) — 1 vídeo de 60s com lojista falando | Produção externa | — |

**Migrar testimonials e trust badges para tabelas Supabase** com admin UI (reaproveitar pattern existing) para que marketing edite sem deploy.

**Critério de done:** zero copy fictícia em testimonials e contadores. Cada claim tem fonte verificável.

### Fase 3 — Content management (CMS-lite via Supabase) (~5-8 dias)

Eliminar dependência de deploy para mudar conteúdo.

| Conteúdo atualmente hardcoded | Solução | Esforço |
|-------------------------------|---------|---------|
| FAQ (4 categorias × 3-4 perguntas) | Tabela `faq_items` (category, question, answer, sort_order, is_active) + admin UI | 1 dia |
| Taxas iFood/Rappi do calculator e ComparisonSection | Tabela `competitor_fees` (competitor, plan, percentage, monthly_fee, source_url, updated_at) | 4h |
| Testimonials (já planejado Fase 2) | Tabela `testimonials` | (Fase 2) |
| Trust badges + partner logos | Tabela `landing_assets` ou colunas em `system_settings` | 4h |
| Hero copy + CTA labels | Config table `landing_content` (key-value JSON) — permite A/B test futuro | 1 dia |
| Lista de features do AllFeaturesSection | Tabela `feature_highlights` (tab_name, title, description, icon, simulation_component) | 1 dia |

**Admin UI:** estender `src/pages/admin/` com tela "Conteúdo da Landing" agrupando essas tabelas.

**Critério de done:** marketing/produto consegue editar FAQ, testimonials e taxas sem PR.

### Fase 4 — Polish & expansion (~3-5 dias)

Iniciativas para depois das 3 primeiras fases (não bloqueiam launch).

- **Voltar `UseCasesSection`** com vertical-specific copy (Pizzaria, Hamburgueria, Mercado, Farmácia, Restaurante) — bom para SEO long-tail e conversão segmentada
- **Demo interativa do dashboard** — iframe ou screencast embed mostrando fluxo PDV → Pedido → Entrega
- **Calculadora ampliada** — incluir Rappi, 99Food, Aiqfome além do iFood (taxas em DB já vindas da Fase 3)
- **Live chat widget** — integrar Daré IA chat (já existe componente `DareChatWidget` da PR #4) ou suporte humano via WhatsApp
- **A/B test framework** — feature flags via Supabase para testar 2 versões de hero/pricing/CTA copy
- **Vídeo testimonials** + página `/casos`
- **Sticky bar pós-scroll** — após user passar do hero, mostrar barra fixa "Calcular minha economia" com input direto
- **Comparativo lado-a-lado interativo** — slider que mostra "VilaFood vs iFood" para mesmo cenário, animado

---

## Métricas de sucesso

Cada fase tem North Star diferente:

| Fase | Métrica primária | Baseline (a medir antes de começar) | Target |
|------|------------------|-------------------------------------|--------|
| 0 | Lighthouse Performance + Best Practices | TBD | ≥ 90 |
| 1 | GA4 funnel completion rate (Hero → Signup intent) | desconhecido (zero tracking hoje) | estabelecer baseline + iterar |
| 2 | Calculator completion → Signup rate | TBD | +20% após social proof real |
| 3 | Tempo médio entre mudança de conteúdo solicitada e go-live | semanas (deploy required) | < 1 dia |
| 4 | Bounce rate + tempo médio na página | TBD | bounce -15%, tempo +30% |

---

## Não-goals (escopo deliberadamente fora)

- **Não** migrar para Next.js só por SEO — `vite-plugin-ssg` resolve render server-side se necessário
- **Não** construir CMS próprio — Supabase + admin UI existing é suficiente
- **Não** reescrever o IFoodCalculator — funciona bem, só precisa de fees dinâmicas (Fase 3)
- **Não** trocar o design system — shadcn-ui + Tailwind atende
- **Não** prometer features que não existem (ex: "Suporte 24/7" se for só horário comercial)

---

## Sequenciamento sugerido

```
Semana 1: Fase 0 (quick wins)            ← pode começar imediatamente
Semana 1-2: Fase 1 (tracking + SEO)      ← desbloqueia decisões data-driven
Semana 3-4: Fase 2 (social proof)        ← maior impacto em conversão
Semana 5-6: Fase 3 (CMS-lite Supabase)   ← reduz custo de iteração futura
Semana 7+: Fase 4 conforme prioridade    ← incrementos de polish
```

Total: **~6 semanas** para Fases 0-3 com 1 dev part-time. Pode paralelizar Fase 1 (analytics/SEO) com Fase 2 (social proof) se houver 2 devs.

---

## Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Testimonials reais demoram (lojistas não respondem) | Começar Fase 2 já entrevistando enquanto Fase 1 acontece |
| Taxas iFood mudam durante migração | Fase 3 prioriza `competitor_fees` table cedo; até lá manter disclaimer "valores referência 2026" |
| GA4 sem CMP (Consent Management Platform) viola LGPD | CookieConsentBanner já existe (port do Rota T) — integrar gating de scripts antes de Fase 1 ir pra prod |
| Cleanup de componentes deleta algo usado em outra página | Antes de deletar, `grep` por imports — backup branch antes do delete |
| Schema markup mal-feito penaliza SEO | Validar com Google Rich Results Test antes de cada deploy |

---

## Próximos passos concretos

1. **Aprovar este plano** ou ajustar prioridades
2. **Definir owner** (quem executa Fase 0-1) e cadência (sprints semanais?)
3. **Estabelecer baseline** das métricas atuais (Lighthouse, qualquer tracking que exista, etc.)
4. **Começar pela Fase 0** — quick wins entregam valor já na primeira semana e dão confiança no plano

Quando tudo isso terminar, próxima iteração natural é A/B testing sistematicom (Fase 4) e expansão para `/conheca/[vertical]` por segmento (pizzaria, hamburgueria, etc.) usando a base de dados configurável criada na Fase 3.
