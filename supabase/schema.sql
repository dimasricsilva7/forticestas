-- FortiCestas initial database schema.
-- Review policies and grant only the minimum required access before production.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  sku text unique,
  price_cents integer not null check (price_cents >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.baskets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.basket_items (
  basket_id uuid not null references public.baskets(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  primary key (basket_id, product_id)
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question_key text not null unique,
  title text not null,
  subtitle text not null default '',
  options jsonb not null default '[]'::jsonb,
  required boolean not null default true,
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  cep text not null,
  address jsonb not null,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  payment_provider text not null default 'bravopay',
  payment_reference text,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded','cancelled')),
  fulfillment_status text not null default 'pending' check (fulfillment_status in ('pending','processing','shipped','delivered','cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0)
);

create table if not exists public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  answers jsonb not null,
  cep text,
  created_at timestamptz not null default now()
);

create index if not exists products_active_idx on public.products(active);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_payment_status_idx on public.orders(payment_status);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.baskets enable row level security;
alter table public.basket_items enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.quiz_responses enable row level security;

-- No public write policies are created intentionally.
-- Add narrowly scoped policies after the authentication and server API model is implemented.


-- Administrator allow-list. Add the first user only after creating the user in Supabase Auth.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

drop policy if exists "admins can read own admin record" on public.admin_users;
create policy "admins can read own admin record"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

-- Public storefront reads only records explicitly published as active.
drop policy if exists "public can read active products" on public.products;
create policy "public can read active products"
  on public.products for select
  to anon, authenticated
  using (active = true);

drop policy if exists "public can read active baskets" on public.baskets;
create policy "public can read active baskets"
  on public.baskets for select
  to anon, authenticated
  using (active = true);

drop policy if exists "public can read items of active baskets" on public.basket_items;
create policy "public can read items of active baskets"
  on public.basket_items for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.baskets b
      where b.id = basket_id and b.active = true
    )
  );

drop policy if exists "public can read products used in active baskets" on public.products;
create policy "public can read products used in active baskets"
  on public.products for select
  to anon, authenticated
  using (
    active = true
    or exists (
      select 1 from public.basket_items bi
      join public.baskets b on b.id = bi.basket_id
      where bi.product_id = products.id and b.active = true
    )
  );

drop policy if exists "public can read active quiz questions" on public.quiz_questions;
create policy "public can read active quiz questions"
  on public.quiz_questions for select
  to anon, authenticated
  using (active = true);

-- The service-role key bypasses RLS and is used only by server routes.
-- Do not create public INSERT/UPDATE/DELETE policies for orders or admin data.


-- Editable quiz configuration. Reapplying this schema will not overwrite admin edits.
alter table public.quiz_questions
  add column if not exists multi boolean not null default false;

insert into public.quiz_questions
  (question_key, title, subtitle, options, multi, required, position, active)
values
  ('household', 'Quantas pessoas vivem na sua casa?', 'Vamos considerar o tamanho da sua família para sugerir uma cesta adequada.',
   '[{"value":"1 pessoa","description":"Uma pessoa"},{"value":"2 pessoas","description":"Duas pessoas"},{"value":"3 a 4 pessoas","description":"De três a quatro pessoas"},{"value":"5 pessoas ou mais","description":"Cinco pessoas ou mais"}]'::jsonb, false, true, 1, true),
  ('goal', 'O que é mais importante para você?', 'Escolha o que melhor representa sua prioridade neste momento.',
   '[{"value":"Economizar","description":"Quero aproveitar melhor meu orçamento"},{"value":"Itens essenciais","description":"Quero garantir o básico em casa"},{"value":"Variedade","description":"Quero uma seleção mais completa"}]'::jsonb, false, true, 2, true),
  ('foods', 'Quais itens não podem faltar?', 'Selecione uma ou mais opções que sua família costuma consumir.',
   '[{"value":"Arroz e feijão","description":"A base das refeições"},{"value":"Massas e molhos","description":"Praticidade durante a semana"},{"value":"Café e açúcar","description":"Para a rotina diária"},{"value":"Óleo e temperos","description":"Complementos para cozinhar"},{"value":"Biscoitos e complementos","description":"Itens para lanches"}]'::jsonb, true, true, 3, true),
  ('budget', 'Qual faixa de orçamento você planeja?', 'Essa resposta ajuda a filtrar sugestões. Os valores finais serão exibidos antes do pagamento.',
   '[{"value":"Até R$ 150","description":"Uma opção econômica"},{"value":"R$ 151 a R$ 250","description":"Equilíbrio entre preço e variedade"},{"value":"R$ 251 a R$ 350","description":"Uma cesta mais completa"},{"value":"Acima de R$ 350","description":"Maior variedade de itens"}]'::jsonb, false, true, 4, true),
  ('frequency', 'Com que frequência pretende comprar?', 'Queremos entender o ritmo ideal para sua casa.',
   '[{"value":"Uma vez","description":"Compra pontual"},{"value":"Todo mês","description":"Reposição mensal"},{"value":"A cada 15 dias","description":"Reposição quinzenal"}]'::jsonb, false, true, 5, true),
  ('basket', 'Qual tipo de cesta prefere?', 'Você pode refinar a escolha antes de ver a recomendação.',
   '[{"value":"Tradicional","description":"Alimentos básicos para o dia a dia"},{"value":"Econômica","description":"Foco nos itens essenciais"},{"value":"Completa","description":"Mais variedade de produtos"}]'::jsonb, false, true, 6, true)
on conflict (question_key) do nothing;


-- BravoPay event delivery log: event_id is stable across provider retries.
create table if not exists public.payment_webhook_events (
  event_id text primary key,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);
alter table public.payment_webhook_events enable row level security;

-- Distinguish a chargeback from a voluntary refund in the order ledger.
alter table public.orders
  drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending','paid','failed','refunded','chargeback','cancelled'));


-- Checkout and freight fields required by the server-side checkout.
alter table public.products
  add column if not exists weight_grams integer not null default 0
  check (weight_grams >= 0);

alter table public.orders
  add column if not exists shipping_service text,
  add column if not exists checkout_idempotency_key text,
  add column if not exists payment_payload jsonb;

create unique index if not exists orders_checkout_idempotency_key_idx
  on public.orders(checkout_idempotency_key)
  where checkout_idempotency_key is not null;

-- Webhook receipts are private to server-side processing.
create index if not exists payment_webhook_events_received_at_idx
  on public.payment_webhook_events(received_at desc);


-- Package dimensions are stored in centimeters for carrier quotations.
alter table public.products
  add column if not exists width_cm numeric(8,2) not null default 0 check (width_cm >= 0),
  add column if not exists height_cm numeric(8,2) not null default 0 check (height_cm >= 0),
  add column if not exists length_cm numeric(8,2) not null default 0 check (length_cm >= 0);
