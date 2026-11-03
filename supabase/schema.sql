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
