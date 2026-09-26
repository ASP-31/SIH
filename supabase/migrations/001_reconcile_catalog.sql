alter table public.stalls add column if not exists bio text;
alter table public.stalls add column if not exists state text;
alter table public.stalls add column if not exists odop_district text;
alter table public.stalls add column if not exists logo_url text;
alter table public.stalls add column if not exists banner_url text;
alter table public.stalls add column if not exists is_verified boolean not null default false;
alter table public.stalls add column if not exists is_vishwakarma_verified boolean not null default false;
alter table public.stalls add column if not exists is_gi_tagged boolean not null default false;
alter table public.stalls add column if not exists rating numeric not null default 0;
alter table public.stalls add column if not exists review_count integer not null default 0;
alter table public.stalls add column if not exists sales_count integer not null default 0;
alter table public.stalls add column if not exists payout_account_id text;
alter table public.stalls add column if not exists payout_status text;
alter table public.stalls add column if not exists heritage_story text;
alter table public.stalls add column if not exists audio_story_url text;
alter table public.stalls add column if not exists craft_origin_history text;
alter table public.stalls add column if not exists artisan_quote text;
alter table public.stalls add column if not exists updated_at timestamptz not null default now();

alter table public.products add column if not exists slug text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists original_price numeric;
alter table public.products add column if not exists material text;
alter table public.products add column if not exists dimensions text;
alter table public.products add column if not exists capacity_liters numeric;
alter table public.products add column if not exists strap_drop text;
alter table public.products add column if not exists colors text[];
alter table public.products add column if not exists original_image_url text;
alter table public.products add column if not exists enhanced_image_url text;
alter table public.products add column if not exists cloudinary_public_id text;
alter table public.products add column if not exists selected_image_url text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists state_origin text;
alter table public.products add column if not exists odop_cluster text;
alter table public.products add column if not exists craft_technique text;
alter table public.products add column if not exists craft_story text;
alter table public.products add column if not exists loom_heritage text;
alter table public.products add column if not exists audio_story_title text;
alter table public.products add column if not exists audio_story_url text;
alter table public.products add column if not exists is_gi_tagged boolean not null default false;
alter table public.products add column if not exists care_instructions text;
alter table public.products add column if not exists b2b_moq_tiers jsonb;
alter table public.products add column if not exists gem_specs jsonb;
alter table public.products add column if not exists ondc_publish_status text;
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists rating numeric not null default 0;
alter table public.products add column if not exists reviews_count integer not null default 0;
alter table public.products add column if not exists updated_at timestamptz not null default now();

create index if not exists stalls_user_id_idx on public.stalls (user_id);
create index if not exists stalls_slug_idx on public.stalls (slug);
create index if not exists products_stall_id_idx on public.products (stall_id);
create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_is_active_idx on public.products (is_active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_stalls_updated_at on public.stalls;
create trigger set_stalls_updated_at
before update on public.stalls
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop view if exists public.products_catalog;
create view public.products_catalog
with (security_invoker = on)
as
select
  p.*,
  s.name as stall_name,
  s.slug as stall_slug,
  s.user_id as stall_user_id
from public.products p
left join public.stalls s on s.id = p.stall_id;

grant select on public.products_catalog to anon, authenticated;

alter table public.stalls enable row level security;
alter table public.products enable row level security;

drop policy if exists stalls_select_public on public.stalls;
create policy stalls_select_public
on public.stalls for select
to anon, authenticated
using (true);

drop policy if exists stalls_insert_own on public.stalls;
create policy stalls_insert_own
on public.stalls for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists stalls_update_own on public.stalls;
create policy stalls_update_own
on public.stalls for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists stalls_delete_own on public.stalls;
create policy stalls_delete_own
on public.stalls for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists products_select_public on public.products;
create policy products_select_public
on public.products for select
to anon, authenticated
using (true);

drop policy if exists products_insert_own on public.products;
create policy products_insert_own
on public.products for insert
to authenticated
with check (
  exists (
    select 1 from public.stalls s
    where s.id = stall_id and s.user_id = auth.uid()
  )
);

drop policy if exists products_update_own on public.products;
create policy products_update_own
on public.products for update
to authenticated
using (
  exists (
    select 1 from public.stalls s
    where s.id = stall_id and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stalls s
    where s.id = stall_id and s.user_id = auth.uid()
  )
);

drop policy if exists products_delete_own on public.products;
create policy products_delete_own
on public.products for delete
to authenticated
using (
  exists (
    select 1 from public.stalls s
    where s.id = stall_id and s.user_id = auth.uid()
  )
);

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
add constraint profiles_role_check
check (role in ('buyer', 'seller', 'influencer', 'admin'));
