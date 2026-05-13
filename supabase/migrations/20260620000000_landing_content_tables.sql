-- Tabelas para CMS-lite da landing /conheca (Fase 3 do plano).
-- Marketing/produto consegue editar FAQ e taxas de competidores sem deploy.
-- Componentes caem pro fallback hardcoded (faqData.ts e constantes do
-- IFoodCalculator) quando as tabelas estao vazias — transicao suave.

-- ============================================================
-- 1) FAQ — perguntas frequentes da landing
-- ============================================================

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),

  -- Agrupamento (atualmente: "Sobre a Plataforma", "Pagamentos",
  -- "Funcionalidades", "Suporte" — mas livre para evoluir)
  category text not null,

  question text not null,
  answer text not null,                  -- pode conter quebras de linha simples
  sort_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index faq_items_active_category_sort_idx
  on public.faq_items (is_active, category, sort_order);

create trigger update_faq_items_updated_at
  before update on public.faq_items
  for each row
  execute function public.update_updated_at_column();

alter table public.faq_items enable row level security;

create policy "Anyone can view active faq_items"
on public.faq_items
for select
using (is_active = true);

create policy "Super admins can manage faq_items"
on public.faq_items
for all
using (has_role(auth.uid(), 'super_admin'::app_role))
with check (has_role(auth.uid(), 'super_admin'::app_role));

comment on table public.faq_items is
  'FAQ exibido em /conheca. Curado via /admin/faq. Fallback hardcoded em src/components/landing/faqData.ts.';

-- ============================================================
-- 2) competitor_fees — taxas de plataformas concorrentes
-- ============================================================
-- Atualmente as taxas do iFood (12%, 23%, 3.2% pagamento, R$100-130
-- mensalidade) estao hardcoded em IFoodCalculator.tsx. Quando o iFood
-- atualizar (e atualizam de tempos em tempos), atualmente precisa deploy.
-- Esta tabela permite atualizar via admin sem deploy.

create table public.competitor_fees (
  id uuid primary key default gen_random_uuid(),

  competitor_slug text not null,         -- ex: "ifood", "rappi", "99food"
  competitor_name text not null,         -- ex: "iFood", "Rappi"
  plan_slug text not null,               -- ex: "basico-propria", "entrega-ifood"
  plan_label text not null,              -- ex: "Plano Básico (Meus Motoboys)"

  -- Comissoes (todos em fracao decimal: 0.12 = 12%)
  commission_percent numeric(5,4) not null default 0,
  payment_fee_percent numeric(5,4) not null default 0,

  -- Mensalidade
  monthly_fee numeric(10,2) not null default 0,
  monthly_fee_threshold numeric(10,2) not null default 0,  -- so cobra acima

  -- Metadata
  source_url text,                       -- link pra tabela publica do competidor
  effective_from date,                   -- data em que estas taxas entraram em vigor
  notes text,                            -- observacoes (ex: "valores apos negociacao")

  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,

  unique (competitor_slug, plan_slug)
);

create index competitor_fees_active_competitor_idx
  on public.competitor_fees (is_active, competitor_slug, sort_order);

create trigger update_competitor_fees_updated_at
  before update on public.competitor_fees
  for each row
  execute function public.update_updated_at_column();

alter table public.competitor_fees enable row level security;

create policy "Anyone can view active competitor_fees"
on public.competitor_fees
for select
using (is_active = true);

create policy "Super admins can manage competitor_fees"
on public.competitor_fees
for all
using (has_role(auth.uid(), 'super_admin'::app_role))
with check (has_role(auth.uid(), 'super_admin'::app_role));

comment on table public.competitor_fees is
  'Taxas de marketplaces concorrentes usadas pelo IFoodCalculator. Curado via /admin/taxas-concorrentes. Fallback nas constantes do componente.';

-- Seed inicial: dois planos do iFood vigentes em 2026 (vai pro DB ja
-- mesmo conteudo do hardcode atual, pra testar)
insert into public.competitor_fees (
  competitor_slug, competitor_name, plan_slug, plan_label,
  commission_percent, payment_fee_percent,
  monthly_fee, monthly_fee_threshold,
  source_url, effective_from, sort_order
) values
  ('ifood', 'iFood', 'basico-propria', 'Plano Básico (Meus Motoboys)',
   0.12, 0.032,
   100, 1800,
   'https://institucional.ifood.com.br/parceiros/precos/', '2026-01-01', 1),
  ('ifood', 'iFood', 'entrega-ifood', 'Plano Entrega (Parceiro iFood)',
   0.23, 0.032,
   130, 1800,
   'https://institucional.ifood.com.br/parceiros/precos/', '2026-01-01', 2);
