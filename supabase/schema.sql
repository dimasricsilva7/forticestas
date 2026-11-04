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


-- OAuth connection credentials are encrypted at application level.
-- This table has no public or authenticated policies; only server service-role code accesses it.
create table if not exists public.shipping_connections (
  provider text primary key check (provider in ('melhor_envio')),
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  expires_at timestamptz not null,
  scopes text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.shipping_connections enable row level security;


-- Inventory reservation ledger. stock_quantity means physical units on hand.
alter table public.products
  add column if not exists reserved_quantity integer not null default 0
  check (reserved_quantity >= 0);

alter table public.order_items
  add column if not exists line_total_cents integer not null default 0
  check (line_total_cents >= 0);

create table if not exists public.stock_reservations (
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  status text not null default 'reserved'
    check (status in ('reserved','committed','released')),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (order_id, product_id)
);
alter table public.stock_reservations enable row level security;
create index if not exists stock_reservations_expiry_idx
  on public.stock_reservations(status, expires_at);

create or replace function public.create_forticestas_order(
  p_order jsonb,
  p_items jsonb,
  p_checkout_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_existing public.orders%rowtype;
  v_item record;
  v_product public.products%rowtype;
  v_reservation public.stock_reservations%rowtype;
begin
  if p_checkout_key is null or length(p_checkout_key) > 100 then
    raise exception 'Chave de checkout inválida.';
  end if;

  select * into v_existing
  from public.orders
  where checkout_idempotency_key = p_checkout_key;

  if found then
    return to_jsonb(v_existing);
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'O pedido precisa ter pelo menos um item.';
  end if;

  -- Release expired holds so abandoned Pix checkouts do not lock stock forever.
  for v_reservation in
    select * from public.stock_reservations
    where status = 'reserved' and expires_at <= now()
    for update
  loop
    update public.products
      set reserved_quantity = greatest(0, reserved_quantity - v_reservation.quantity),
          updated_at = now()
      where id = v_reservation.product_id;
    update public.stock_reservations
      set status = 'released', updated_at = now()
      where order_id = v_reservation.order_id and product_id = v_reservation.product_id;
    update public.orders
      set payment_status = 'failed', updated_at = now()
      where id = v_reservation.order_id and payment_status = 'pending';
  end loop;

  insert into public.orders (
    customer_name, customer_email, customer_phone, cep, address,
    subtotal_cents, shipping_cents, total_cents, shipping_service,
    checkout_idempotency_key, payment_provider
  ) values (
    p_order->>'customer_name',
    nullif(p_order->>'customer_email',''),
    p_order->>'customer_phone',
    p_order->>'cep',
    coalesce(p_order->'address','{}'::jsonb),
    (p_order->>'subtotal_cents')::integer,
    (p_order->>'shipping_cents')::integer,
    (p_order->>'total_cents')::integer,
    p_order->>'shipping_service',
    p_checkout_key,
    'bravopay'
  )
  returning * into v_order;

  for v_item in
    select *
    from jsonb_to_recordset(p_items)
      as items(product_id uuid, quantity integer, line_total_cents integer)
  loop
    if v_item.quantity is null or v_item.quantity <= 0 or v_item.line_total_cents is null or v_item.line_total_cents < 0 then
      raise exception 'Quantidade ou total de item inválido.';
    end if;

    select * into v_product
      from public.products
      where id = v_item.product_id
      for update;

    if not found or not v_product.active then
      raise exception 'Um produto do pedido não está mais disponível.';
    end if;

    if v_product.stock_quantity - v_product.reserved_quantity < v_item.quantity then
      raise exception 'Estoque insuficiente para o produto %.', v_product.name;
    end if;

    update public.products
      set reserved_quantity = reserved_quantity + v_item.quantity,
          updated_at = now()
      where id = v_product.id;

    insert into public.stock_reservations(order_id, product_id, quantity, status, expires_at)
      values (v_order.id, v_product.id, v_item.quantity, 'reserved', now() + interval '65 minutes');

    insert into public.order_items(
      order_id, product_id, product_name, sku, unit_price_cents, quantity, line_total_cents
    ) values (
      v_order.id, v_product.id, v_product.name, v_product.sku,
      v_product.price_cents, v_item.quantity, v_item.line_total_cents
    );
  end loop;

  return to_jsonb(v_order);
end;
$$;

create or replace function public.finalize_forticestas_order_inventory(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reservation public.stock_reservations%rowtype;
begin
  if exists (
    select 1 from public.stock_reservations
    where order_id = p_order_id and status = 'released'
  ) then
    return false;
  end if;

  for v_reservation in
    select * from public.stock_reservations
    where order_id = p_order_id and status = 'reserved'
    for update
  loop
    update public.products
      set stock_quantity = stock_quantity - v_reservation.quantity,
          reserved_quantity = reserved_quantity - v_reservation.quantity,
          updated_at = now()
      where id = v_reservation.product_id
        and stock_quantity >= v_reservation.quantity
        and reserved_quantity >= v_reservation.quantity;

    if not found then
      raise exception 'Não foi possível baixar o estoque reservado do pedido.';
    end if;

    update public.stock_reservations
      set status = 'committed', updated_at = now()
      where order_id = p_order_id and product_id = v_reservation.product_id;
  end loop;

  return true;
end;
$$;

create or replace function public.release_forticestas_order_inventory(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reservation public.stock_reservations%rowtype;
begin
  for v_reservation in
    select * from public.stock_reservations
    where order_id = p_order_id and status = 'reserved'
    for update
  loop
    update public.products
      set reserved_quantity = greatest(0, reserved_quantity - v_reservation.quantity),
          updated_at = now()
      where id = v_reservation.product_id;

    update public.stock_reservations
      set status = 'released', updated_at = now()
      where order_id = p_order_id and product_id = v_reservation.product_id;
  end loop;

  return true;
end;
$$;

revoke all on function public.create_forticestas_order(jsonb,jsonb,text) from public, anon, authenticated;
revoke all on function public.finalize_forticestas_order_inventory(uuid) from public, anon, authenticated;
revoke all on function public.release_forticestas_order_inventory(uuid) from public, anon, authenticated;
grant execute on function public.create_forticestas_order(jsonb,jsonb,text) to service_role;
grant execute on function public.finalize_forticestas_order_inventory(uuid) to service_role;
grant execute on function public.release_forticestas_order_inventory(uuid) to service_role;


-- Basket matching metadata used by the FortiCestas recommendation quiz.
alter table public.baskets
  add column if not exists category text not null default 'traditional',
  add column if not exists supported_households text[] not null default '{}',
  add column if not exists food_tags text[] not null default '{}';

alter table public.baskets
  drop constraint if exists baskets_category_check;
alter table public.baskets
  add constraint baskets_category_check
  check (category in ('economic','traditional','complete'));
