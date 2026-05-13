-- Tabela de depoimentos para a landing page (/conheca).
-- Substitui o array hardcoded em TestimonialsSection.tsx pelo padrao
-- DB-driven: marketing/admin pode adicionar/editar via /admin/depoimentos
-- sem deploy. Componente cai pro fallback hardcoded se a tabela estiver
-- vazia (transicao suave durante o lancamento).

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),

  -- Conteudo do depoimento
  name text not null,
  role text,                          -- ex: "Dono - Pizzaria Don Carlo"
  content text not null,
  rating smallint not null default 5 check (rating between 1 and 5),

  -- Atribuicao (opcional, mas recomendado pra credibilidade)
  avatar_url text,                    -- foto do cliente
  establishment_id uuid references public.establishments(id) on delete set null,

  -- Curadoria
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,

  -- Metricas opcionais (ex: "Triplicou pedidos em 3 meses")
  metric_label text,                  -- ex: "Aumento de pedidos"
  metric_value text,                  -- ex: "+200%"

  -- Auditoria
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index testimonials_active_sort_idx
  on public.testimonials (is_active, sort_order, created_at desc);

create index testimonials_establishment_idx
  on public.testimonials (establishment_id)
  where establishment_id is not null;

-- Trigger pra updated_at (mesma funcao usada por establishments, products, etc.)
create trigger update_testimonials_updated_at
  before update on public.testimonials
  for each row
  execute function public.update_updated_at_column();

-- RLS (mesmo padrao de main_categories e segments)
alter table public.testimonials enable row level security;

create policy "Anyone can view active testimonials"
on public.testimonials
for select
using (is_active = true);

create policy "Super admins can manage testimonials"
on public.testimonials
for all
using (has_role(auth.uid(), 'super_admin'::app_role))
with check (has_role(auth.uid(), 'super_admin'::app_role));

comment on table public.testimonials is
  'Depoimentos exibidos em /conheca. Curados via /admin/depoimentos.';
